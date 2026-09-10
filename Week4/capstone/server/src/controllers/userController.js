import Follow from "../models/Follow.js";
import User from "../models/User.js";

// Escapes the characters that mean something in a regular expression, so a
// search for "c++" or "(" is treated as plain text.
function escapeForRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /api/users?search=  - the people search, and with no search the newest
// accounts, which is what a "who to follow" panel wants.
export async function getUsers(req, res) {
  const filter = {};

  if (req.query.search) {
    const pattern = new RegExp(escapeForRegex(req.query.search.trim()), "i");
    filter.$or = [{ name: pattern }, { username: pattern }];
  }

  // Never suggest the viewer to themselves.
  if (req.user) filter._id = { $ne: req.user._id };

  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
  const users = await User.find(filter).sort({ followerCount: -1, createdAt: -1 }).limit(limit);

  // Which of these the viewer already follows, in one query rather than one
  // per user.
  const following = await followingSet(req.user, users);

  res.json({
    success: true,
    count: users.length,
    data: users.map((user) => ({
      ...user.toPublicJSON(),
      followedByMe: following.has(String(user._id)),
    })),
  });
}

async function followingSet(viewer, users) {
  if (!viewer || users.length === 0) return new Set();

  const follows = await Follow.find({
    follower: viewer._id,
    following: { $in: users.map((user) => user._id) },
  }).select("following");

  return new Set(follows.map((follow) => String(follow.following)));
}

// GET /api/users/:username - a profile. Public: anyone can read it, logged in
// or not, which is why it uses toPublicJSON and leaves the email out.
export async function getUser(req, res) {
  const user = await User.findOne({ username: req.params.username.toLowerCase() });

  if (!user) {
    res.status(404);
    throw new Error("No user found with username " + req.params.username);
  }

  const following = await followingSet(req.user, [user]);

  res.json({
    success: true,
    data: {
      ...user.toPublicJSON(),
      followedByMe: following.has(String(user._id)),
      // So the client can hide the follow button on your own profile.
      isMe: Boolean(req.user && String(req.user._id) === String(user._id)),
    },
  });
}

// POST /api/users/:username/follow - toggles, like the heart on a post.
export async function toggleFollow(req, res) {
  const target = await User.findOne({ username: req.params.username.toLowerCase() });

  if (!target) {
    res.status(404);
    throw new Error("No user found with username " + req.params.username);
  }

  if (String(target._id) === String(req.user._id)) {
    res.status(400);
    throw new Error("You cannot follow yourself.");
  }

  const removed = await Follow.deleteOne({ follower: req.user._id, following: target._id });

  let followed;

  if (removed.deletedCount > 0) {
    followed = false;
    // Both sides of the relationship carry a counter, so both move.
    await Promise.all([
      User.updateOne({ _id: target._id }, { $inc: { followerCount: -1 } }),
      User.updateOne({ _id: req.user._id }, { $inc: { followingCount: -1 } }),
    ]);
  } else {
    try {
      await Follow.create({ follower: req.user._id, following: target._id });
      followed = true;
      await Promise.all([
        User.updateOne({ _id: target._id }, { $inc: { followerCount: 1 } }),
        User.updateOne({ _id: req.user._id }, { $inc: { followingCount: 1 } }),
      ]);
    } catch (error) {
      // 11000 means a duplicate: another request got there first, and the end
      // state is the one the caller asked for.
      if (error.code !== 11000) throw error;
      followed = true;
    }
  }

  const updated = await User.findById(target._id);

  res.json({
    success: true,
    data: { username: target.username, followed, followerCount: updated.followerCount },
  });
}

// GET /api/users/:username/followers
export async function getFollowers(req, res) {
  const user = await User.findOne({ username: req.params.username.toLowerCase() });

  if (!user) {
    res.status(404);
    throw new Error("No user found with username " + req.params.username);
  }

  const follows = await Follow.find({ following: user._id })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("follower", "name username avatar bio");

  res.json({
    success: true,
    count: follows.length,
    data: follows.filter((f) => f.follower).map((f) => f.follower.toPublicJSON()),
  });
}

// GET /api/users/:username/following
export async function getFollowing(req, res) {
  const user = await User.findOne({ username: req.params.username.toLowerCase() });

  if (!user) {
    res.status(404);
    throw new Error("No user found with username " + req.params.username);
  }

  const follows = await Follow.find({ follower: user._id })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("following", "name username avatar bio");

  res.json({
    success: true,
    count: follows.length,
    data: follows.filter((f) => f.following).map((f) => f.following.toPublicJSON()),
  });
}
