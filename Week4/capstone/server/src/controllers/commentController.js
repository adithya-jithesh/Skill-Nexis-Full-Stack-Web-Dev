import Comment from "../models/Comment.js";
import Post from "../models/Post.js";

function shape(comment) {
  const author = comment.author;

  return {
    id: comment._id,
    text: comment.text,
    post: comment.post,
    author: author
      ? {
          id: author._id,
          name: author.name,
          username: author.username,
          avatarUrl: author.avatar ? "/uploads/" + author.avatar : "",
        }
      : null,
    createdAt: comment.createdAt,
  };
}

// GET /api/posts/:id/comments - oldest first, because a thread reads in the
// order it was written. The feed is the other way round.
export async function getComments(req, res) {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error("No post found with id " + req.params.id);
  }

  const comments = await Comment.find({ post: post._id })
    .sort({ createdAt: 1 })
    .populate("author", "name username avatar");

  res.json({ success: true, count: comments.length, data: comments.map(shape) });
}

// POST /api/posts/:id/comments
export async function createComment(req, res) {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error("No post found with id " + req.params.id);
  }

  const comment = await Comment.create({
    post: post._id,
    author: req.user._id,
    text: req.body.text,
  });

  // Kept in step with the row that was just written, so the feed card can
  // show a count without counting.
  await Post.updateOne({ _id: post._id }, { $inc: { commentCount: 1 } });
  await comment.populate("author", "name username avatar");

  res.status(201).json({ success: true, data: shape(comment) });
}

// DELETE /api/comments/:id
//
// Two people may remove a comment: whoever wrote it, and whoever owns the
// post it sits under - your own posts are yours to keep clean.
export async function deleteComment(req, res) {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    res.status(404);
    throw new Error("No comment found with id " + req.params.id);
  }

  const post = await Post.findById(comment.post);
  const isAuthor = String(comment.author) === String(req.user._id);
  const ownsPost = post && String(post.author) === String(req.user._id);

  if (!isAuthor && !ownsPost) {
    // 403 here, not 404: the comment is public, so its existence is no
    // secret - only the permission to remove it is missing.
    res.status(403);
    throw new Error("You can only delete your own comments, or comments on your own posts.");
  }

  await comment.deleteOne();

  if (post) await Post.updateOne({ _id: post._id }, { $inc: { commentCount: -1 } });

  res.json({ success: true, message: "Comment deleted.", data: { id: comment._id } });
}
