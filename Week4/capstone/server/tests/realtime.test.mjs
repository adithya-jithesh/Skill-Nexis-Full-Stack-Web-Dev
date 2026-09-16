// Checks the Week 4 real-time layer against a live server: three sockets -
// two accounts and an anonymous reader - and HTTP calls that should make
// events arrive at the right ones.
import { io } from "socket.io-client";

const BASE = "http://localhost:5006";
let pass = 0;
let fail = 0;

function check(name, condition, extra = "") {
  if (condition) {
    pass += 1;
    console.log("  ok   " + name);
  } else {
    fail += 1;
    console.log("  FAIL " + name + (extra ? " -> " + extra : ""));
  }
}

async function call(path, { method = "GET", body, token } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

// Collects every event a socket receives, so a test can look back at what
// arrived rather than racing a single listener.
function watcher(socket) {
  const seen = [];

  for (const event of [
    "post:new",
    "post:counts",
    "post:deleted",
    "comment:new",
    "comment:deleted",
    "presence",
  ]) {
    socket.on(event, (payload) => seen.push({ event, payload }));
  }

  return {
    seen,
    clear: () => (seen.length = 0),
    // Waits for a matching event rather than sleeping a fixed time.
    wait: (event, match = () => true, ms = 3000) =>
      new Promise((resolve) => {
        const found = seen.find((e) => e.event === event && match(e.payload));
        if (found) return resolve(found.payload);

        const timer = setTimeout(() => {
          socket.off(event, listener);
          resolve(null);
        }, ms);

        function listener(payload) {
          if (!match(payload)) return;
          clearTimeout(timer);
          socket.off(event, listener);
          resolve(payload);
        }

        socket.on(event, listener);
      }),
  };
}

// Returns the socket and its watcher together, with the listeners attached
// before the handshake completes - which is what a real client does, since it
// calls socket.on() immediately after io().
function connect(token) {
  return new Promise((resolve, reject) => {
    const socket = io(BASE, { auth: { token: token || "" } });
    const watch = watcher(socket);

    socket.on("connect", () => resolve({ socket, watch }));
    socket.on("connect_error", reject);
    setTimeout(() => reject(new Error("socket did not connect in time")), 5000);
  });
}

const stamp = Date.now().toString().slice(-8);
const alice = { name: "Alice Live", username: "alive" + stamp, email: `alive${stamp}@example.com`, password: "password123" };
const bob = { name: "Bob Live", username: "blive" + stamp, email: `blive${stamp}@example.com`, password: "password123" };

console.log("\nSETUP");
let r = await call("/api/auth/register", { method: "POST", body: alice });
const tokenA = r.data.token;
check("Alice registered", r.status === 201, r.status);

r = await call("/api/auth/register", { method: "POST", body: bob });
const tokenB = r.data.token;
check("Bob registered", r.status === 201, r.status);

const { socket: socketA, watch: watchA } = await connect(tokenA);
const { socket: socketB, watch: watchB } = await connect(tokenB);
const { socket: socketAnon, watch: watchAnon } = await connect(null);

check("all three sockets connected", socketA.connected && socketB.connected && socketAnon.connected);

console.log("\nPRESENCE");
const presence = await watchAnon.wait("presence");
check("a connecting socket is told the count immediately", presence !== null && presence.online >= 3, JSON.stringify(presence));

console.log("\nA POST REACHES THE RIGHT TIMELINES");
// Nobody follows Alice yet.
watchA.clear();
watchB.clear();
watchAnon.clear();

r = await call("/api/posts", { method: "POST", token: tokenA, body: { text: "Before anyone follows me." } });
const firstPost = r.data.data.id;
check("Alice posted", r.status === 201, r.status);

const anonEvent = await watchAnon.wait("post:new", (p) => p.post.id === firstPost);
check("the anonymous reader gets it on the public timeline", anonEvent?.scope === "everyone", JSON.stringify(anonEvent?.scope));

const ownFollowing = await watchA.wait("post:new", (p) => p.post.id === firstPost && p.scope === "following");
check("Alice gets it in her own following feed", ownFollowing !== null);

// Bob follows nobody, so the personal-feed copy must not reach him.
await new Promise((r2) => setTimeout(r2, 600));
const bobFollowingEarly = watchB.seen.find((e) => e.event === "post:new" && e.payload.scope === "following");
check("Bob does not get a following copy while not following her", !bobFollowingEarly, JSON.stringify(bobFollowingEarly));

const bobEveryone = watchB.seen.find((e) => e.event === "post:new" && e.payload.scope === "everyone");
check("but he does see it on the public timeline", Boolean(bobEveryone));

console.log("\nFOLLOWER FAN-OUT");
r = await call("/api/users/" + alice.username + "/follow", { method: "POST", token: tokenB });
check("Bob follows Alice", r.data.data?.followed === true, JSON.stringify(r.data.data));

watchB.clear();
r = await call("/api/posts", { method: "POST", token: tokenA, body: { text: "Now he follows me." } });
const secondPost = r.data.data.id;

const bobFollowing = await watchB.wait("post:new", (p) => p.post.id === secondPost && p.scope === "following");
check("the new post reaches Bob's following feed", bobFollowing !== null);
check("and carries the author, ready to render", bobFollowing?.post?.author?.username === alice.username);

console.log("\nLIKES AND REPLIES");
watchA.clear();
r = await call("/api/posts/" + secondPost + "/like", { method: "POST", token: tokenB });
check("Bob liked it", r.data.data?.liked === true);

const counts = await watchA.wait("post:counts", (p) => p.id === secondPost);
check("Alice sees the like count move without asking", counts?.likeCount === 1, JSON.stringify(counts));
check("the event carries no 'who liked it'", counts && counts.likedByMe === undefined);

// Bob opens the thread; Alice replies.
socketB.emit("post:watch", secondPost);
await new Promise((r2) => setTimeout(r2, 300));
watchB.clear();

r = await call("/api/posts/" + secondPost + "/comments", { method: "POST", token: tokenA, body: { text: "Thanks for the like." } });
const commentId = r.data.data.id;
check("Alice replied", r.status === 201, r.status);

const liveComment = await watchB.wait("comment:new", (p) => p.postId === secondPost);
check("Bob's open thread receives the reply", liveComment?.comment?.text === "Thanks for the like.", JSON.stringify(liveComment?.comment?.text));

const commentCounts = await watchB.wait("post:counts", (p) => p.id === secondPost && p.commentCount === 1);
check("and the comment count moves with it", commentCounts !== null);

// Anyone not watching that thread should not receive its replies.
const anonComment = watchAnon.seen.find((e) => e.event === "comment:new");
check("a reader not on that thread gets no reply events", !anonComment);

console.log("\nLEAVING A THREAD, AND DELETES");
socketB.emit("post:unwatch", secondPost);
await new Promise((r2) => setTimeout(r2, 300));
watchB.clear();

await call("/api/comments/" + commentId, { method: "DELETE", token: tokenA });
await new Promise((r2) => setTimeout(r2, 600));
const afterUnwatch = watchB.seen.find((e) => e.event === "comment:deleted");
check("after unwatching, thread events stop arriving", !afterUnwatch, JSON.stringify(afterUnwatch));

watchAnon.clear();
await call("/api/posts/" + firstPost, { method: "DELETE", token: tokenA });
const deleted = await watchAnon.wait("post:deleted", (p) => p.id === firstPost);
check("a deleted post is announced to the timeline", deleted !== null);

console.log("\nUNFOLLOWING STOPS THE FAN-OUT");
await call("/api/users/" + alice.username + "/follow", { method: "POST", token: tokenB });
watchB.clear();

r = await call("/api/posts", { method: "POST", token: tokenA, body: { text: "He unfollowed me." } });
await new Promise((r2) => setTimeout(r2, 800));

const afterUnfollow = watchB.seen.find((e) => e.event === "post:new" && e.payload.scope === "following");
check("no following copy once Bob has unfollowed", !afterUnfollow, JSON.stringify(afterUnfollow));
check("the public copy still arrives", watchB.seen.some((e) => e.event === "post:new" && e.payload.scope === "everyone"));

console.log("\nAN EXPIRED OR FORGED TOKEN IS ANONYMOUS, NOT REFUSED");
const { socket: socketBad, watch: watchBad } = await connect("not.a.real.token");
check("a socket with a bad token still connects", socketBad.connected);
r = await call("/api/posts", { method: "POST", token: tokenA, body: { text: "Public post." } });
const publicToBad = await watchBad.wait("post:new", (p) => p.scope === "everyone");
check("and receives the public timeline", publicToBad !== null);

const followingToBad = watchBad.seen.find((e) => e.event === "post:new" && e.payload.scope === "following");
check("but never a personal feed", !followingToBad);

socketA.disconnect();
socketB.disconnect();
socketAnon.disconnect();
socketBad.disconnect();

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
