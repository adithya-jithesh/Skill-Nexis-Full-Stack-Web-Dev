import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { UPLOAD_DIR } from "../config/paths.js";
import Comment from "../models/Comment.js";
import Follow from "../models/Follow.js";
import Like from "../models/Like.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import { emitDeletedPost, emitNewPost, emitPostCounts } from "../realtime.js";

// What a post looks like in a response. The author comes back nested rather
// than as a bare id, because every card in the feed shows a name and avatar
// and the client should not have to fetch each author separately.
function shape(post, likedIds) {
  const author = post.author;

  return {
    id: post._id,
    text: post.text,
    imageUrl: post.image ? "/uploads/" + post.image : "",
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    // Whether the person reading has liked it - false for a logged-out
    // visitor, who has no likes to match.
    likedByMe: likedIds.has(String(post._id)),
    author: author
      ? {
          id: author._id,
          name: author.name,
          username: author.username,
          avatarUrl: author.avatar ? "/uploads/" + author.avatar : "",
        }
      : null,
    createdAt: post.createdAt,
  };
}

// Which of these posts the viewer has already liked, in one query rather than
// one per post. Without this, a feed of twenty posts is twenty extra lookups.
async function likedByViewer(posts, viewer) {
  if (!viewer || posts.length === 0) return new Set();

  const likes = await Like.find({
    user: viewer._id,
    post: { $in: posts.map((post) => post._id) },
  }).select("post");

  return new Set(likes.map((like) => String(like.post)));
}

// GET /api/posts
// ?scope=everyone|following  ?username=  ?page=  ?limit=
export async function getPosts(req, res) {
  const filter = {};

  // The two timelines. "following" is the personal feed - the people you
  // follow, plus yourself, which is what makes your own post appear the
  // moment you write it.
  if (req.query.scope === "following") {
    if (!req.user) {
      res.status(401);
      throw new Error("Log in to see the posts of people you follow.");
    }

    const follows = await Follow.find({ follower: req.user._id }).select("following");
    filter.author = { $in: [...follows.map((f) => f.following), req.user._id] };
  }

  // One person's posts, for their profile page.
  if (req.query.username) {
    const author = await User.findOne({ username: req.query.username.toLowerCase() });

    if (!author) {
      res.status(404);
      throw new Error("No user found with username " + req.query.username);
    }

    filter.author = author._id;
  }

  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
  const page = Math.max(Number(req.query.page) || 1, 1);

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      // populate swaps the author id for the fields named here - and only
      // those, so a password hash could not travel even by accident.
      .populate("author", "name username avatar"),
    Post.countDocuments(filter),
  ]);

  const likedIds = await likedByViewer(posts, req.user);

  res.json({
    success: true,
    count: posts.length,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
    data: posts.map((post) => shape(post, likedIds)),
  });
}

// GET /api/posts/:id
export async function getPost(req, res) {
  const post = await Post.findById(req.params.id).populate("author", "name username avatar");

  if (!post) {
    res.status(404);
    throw new Error("No post found with id " + req.params.id);
  }

  const likedIds = await likedByViewer([post], req.user);

  res.json({ success: true, data: shape(post, likedIds) });
}

// POST /api/posts - text, and optionally an image (field "image").
export async function createPost(req, res) {
  try {
    const post = await Post.create({
      text: req.body.text,
      image: req.file ? req.file.filename : "",
      // From the token, never the body - otherwise a client could post as
      // somebody else.
      author: req.user._id,
    });

    await User.updateOne({ _id: req.user._id }, { $inc: { postCount: 1 } });
    await post.populate("author", "name username avatar");

    const body = shape(post, new Set());

    // Answer first, then tell everyone else. The person who wrote it already
    // has the post in the response; a slow fan-out should not delay that.
    res.status(201).json({ success: true, data: body });

    emitNewPost(body);
  } catch (error) {
    // The image is already on disk by the time the row is written. If the
    // row fails - empty text, say - the file would sit there with nothing
    // pointing at it.
    if (req.file) await fs.unlink(path.join(UPLOAD_DIR, req.file.filename)).catch(() => {});
    throw error;
  }
}

// DELETE /api/posts/:id - only the author's own.
export async function deletePost(req, res) {
  const post = await Post.findOne({ _id: req.params.id, author: req.user._id });

  if (!post) {
    // 404 rather than 403, so this cannot be used to find out whether a post
    // exists on somebody else's account.
    res.status(404);
    throw new Error("No post of yours found with id " + req.params.id);
  }

  await post.deleteOne();

  // The likes and comments belong to a post that no longer exists, so they go
  // with it - otherwise they pile up forever, counted by nothing.
  await Promise.all([
    Like.deleteMany({ post: post._id }),
    Comment.deleteMany({ post: post._id }),
    User.updateOne({ _id: req.user._id }, { $inc: { postCount: -1 } }),
  ]);

  if (post.image) await fs.unlink(path.join(UPLOAD_DIR, post.image)).catch(() => {});

  res.json({ success: true, message: "Post deleted.", data: { id: post._id } });

  emitDeletedPost(String(post._id));
}

// POST /api/posts/:id/like - one endpoint that toggles, because the client
// only ever knows "the heart was tapped", not which way round it should go.
export async function toggleLike(req, res) {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error("No post found with id " + req.params.id);
  }

  // deleteOne then insert, both keyed on the unique index. Whichever way this
  // goes, the counter moves by exactly the number of rows that changed - so a
  // double-tap cannot inflate it.
  const removed = await Like.deleteOne({ post: post._id, user: req.user._id });

  let liked;

  if (removed.deletedCount > 0) {
    liked = false;
    await Post.updateOne({ _id: post._id }, { $inc: { likeCount: -1 } });
  } else {
    try {
      await Like.create({ post: post._id, user: req.user._id });
      liked = true;
      await Post.updateOne({ _id: post._id }, { $inc: { likeCount: 1 } });
    } catch (error) {
      // 11000 means another request inserted the same like first. The end
      // state is what the caller wanted, so this is not an error.
      if (error.code !== 11000) throw error;
      liked = true;
    }
  }

  const updated = await Post.findById(post._id);

  res.json({ success: true, data: { id: post._id, liked, likeCount: updated.likeCount } });

  // Only the counts travel, never "who liked it" - whether *you* have liked a
  // post is answered per viewer, and is nobody else's business.
  emitPostCounts({
    id: String(post._id),
    likeCount: updated.likeCount,
    commentCount: updated.commentCount,
  });
}

// GET /api/posts/:id/likes - who liked it.
export async function getLikes(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400);
    throw new Error("'" + req.params.id + "' is not a valid id.");
  }

  const likes = await Like.find({ post: req.params.id })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("user", "name username avatar");

  res.json({
    success: true,
    count: likes.length,
    data: likes
      .filter((like) => like.user)
      .map((like) => ({
        id: like.user._id,
        name: like.user.name,
        username: like.user.username,
        avatarUrl: like.user.avatar ? "/uploads/" + like.user.avatar : "",
      })),
  });
}
