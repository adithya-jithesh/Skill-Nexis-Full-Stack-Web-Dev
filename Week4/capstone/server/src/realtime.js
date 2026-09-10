import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import Follow from "./models/Follow.js";
import User from "./models/User.js";

// Live updates, over Socket.IO.
//
// The REST API stays the source of truth: every change is still a normal HTTP
// request that answers with the new state. These events only tell other people
// that something happened, so their screens do not have to be reloaded to find
// out. Nothing here is required for the app to work - a client that never
// connects simply sees changes on its next fetch.
//
// Three kinds of room:
//   "everyone"    - the public timeline; every socket joins, logged in or not
//   "user:<id>"   - one account's personal feed, for follower fan-out
//   "post:<id>"   - an open thread, so a reply appears while it is being read

let io = null;

export function initRealtime(httpServer, allowedOrigins) {
  io = new Server(httpServer, {
    cors: { origin: allowedOrigins },
    // Long enough to survive a phone locking or a laptop sleeping briefly,
    // without holding rooms open for the rest of the day.
    pingTimeout: 30000,
  });

  // The handshake carries the same JWT the REST calls use. A socket without
  // one is not refused - anonymous readers get the public timeline - it simply
  // has no personal room to join.
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) return next();

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.id);
      if (user) socket.data.userId = String(user._id);
    } catch {
      // An expired or forged token means anonymous, not an error: the HTTP
      // API is what refuses writes, and it checks the token every time.
    }

    next();
  });

  io.on("connection", (socket) => {
    socket.join("everyone");
    if (socket.data.userId) socket.join("user:" + socket.data.userId);

    // Straight to the new arrival, so it knows the count immediately rather
    // than waiting for the next person to come or go, and then to everyone
    // else, whose count has just changed.
    socket.emit("presence", { online: io.engine.clientsCount });
    broadcastPresence();

    // A thread page asks to hear about one post while it is open, and says so
    // again when it is closed. Rooms are per socket, so this cannot leak
    // between tabs.
    socket.on("post:watch", (postId) => {
      if (typeof postId === "string") socket.join("post:" + postId);
    });

    socket.on("post:unwatch", (postId) => {
      if (typeof postId === "string") socket.leave("post:" + postId);
    });

    socket.on("disconnect", broadcastPresence);
  });

  return io;
}

// How many sockets are connected. Sent on every join and leave, which is cheap
// at this scale - a busy site would sample it on a timer instead.
function broadcastPresence() {
  if (!io) return;
  io.to("everyone").emit("presence", { online: io.engine.clientsCount });
}

// A new post goes to two places: the public timeline, and the personal feed of
// everyone following the author.
//
// This is follower fan-out, and it is deliberately done here rather than by
// letting every client filter a global firehose - a client does not know who
// it follows without asking, and sending everybody every post would mean
// broadcasting private-feed decisions to people they do not concern.
export async function emitNewPost(post) {
  if (!io || !post?.author?.id) return;

  io.to("everyone").emit("post:new", { scope: "everyone", post });

  const authorId = String(post.author.id);
  const followers = await Follow.find({ following: authorId }).select("follower");

  // The author's own feed includes their posts, which is why they are in this
  // list alongside their followers.
  const rooms = [...followers.map((f) => "user:" + f.follower), "user:" + authorId];

  if (rooms.length > 0) io.to(rooms).emit("post:new", { scope: "following", post });
}

// A like or a comment changed the numbers on a card. Sent to the timeline and
// to anyone reading that post's thread.
export function emitPostCounts({ id, likeCount, commentCount }) {
  if (!io) return;

  const payload = { id, likeCount, commentCount };
  io.to("everyone").emit("post:counts", payload);
  io.to("post:" + id).emit("post:counts", payload);
}

// A reply, for whoever has that thread open.
export function emitNewComment(postId, comment) {
  if (!io) return;
  io.to("post:" + postId).emit("comment:new", { postId, comment });
}

export function emitDeletedComment(postId, commentId) {
  if (!io) return;
  io.to("post:" + postId).emit("comment:deleted", { postId, commentId });
}

// A post that no longer exists should not sit on somebody's screen waiting to
// 404 when they click it.
export function emitDeletedPost(postId) {
  if (!io) return;
  io.to("everyone").emit("post:deleted", { id: postId });
}
