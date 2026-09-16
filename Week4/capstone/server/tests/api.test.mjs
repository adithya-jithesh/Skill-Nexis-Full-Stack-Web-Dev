// Checks the Week 4 capstone API against a live server, database and disk.
import { Buffer } from "node:buffer";

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
  const type = res.headers.get("content-type") || "";
  return {
    status: res.status,
    data: type.includes("json") ? await res.json().catch(() => ({})) : null,
    length: Number(res.headers.get("content-length") || 0),
  };
}

const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

async function postForm(path, token, fields, file) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  if (file) form.append(file.field, new Blob([file.buffer], { type: file.type }), file.name);

  const res = await fetch(BASE + path, {
    method: "POST",
    headers: token ? { Authorization: "Bearer " + token } : {},
    body: form,
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

const stamp = Date.now().toString().slice(-8);
const alice = { name: "Alice Tester", username: "alice" + stamp, email: `alice${stamp}@example.com`, password: "password123" };
const bob = { name: "Bob Tester", username: "bob" + stamp, email: `bob${stamp}@example.com`, password: "password123" };

console.log("\nHEALTH AND ACCOUNTS");
let r = await call("/api/health");
check("health check answers without touching the database", r.status === 200 && r.data.status === "ok", r.status);

r = await call("/api/auth/register", { method: "POST", body: alice });
check("register returns 201 and a token", r.status === 201 && Boolean(r.data.token), r.status + " " + r.data.message);
check("the account shows its own email back", r.data.user?.email === alice.email);
check("no password in the response", r.data.user?.password === undefined);
const tokenA = r.data.token;

r = await call("/api/auth/register", { method: "POST", body: bob });
const tokenB = r.data.token;
check("second account registers", r.status === 201, r.status);

r = await call("/api/auth/register", { method: "POST", body: { ...bob, email: `other${stamp}@example.com` } });
check("a taken username is 409", r.status === 409, r.status);
check("and the message says which one", /username/i.test(r.data.message || ""), r.data.message);

r = await call("/api/auth/register", { method: "POST", body: { ...alice, username: "other" + stamp } });
check("a taken email is 409", r.status === 409, r.status);

r = await call("/api/auth/register", { method: "POST", body: { name: "Bad", username: "no spaces!", email: `x${stamp}@example.com`, password: "password123" } });
check("an invalid username is 400", r.status === 400, r.status);

r = await call("/api/auth/login", { method: "POST", body: { identifier: alice.email, password: alice.password } });
check("login by email works", r.status === 200 && Boolean(r.data.token), r.status);

r = await call("/api/auth/login", { method: "POST", body: { identifier: alice.username, password: alice.password } });
check("login by username works too", r.status === 200 && Boolean(r.data.token), r.status);

r = await call("/api/auth/login", { method: "POST", body: { identifier: alice.email, password: "wrongpassword" } });
check("a wrong password is 401", r.status === 401, r.status);
const wrongPass = r.data.message;

r = await call("/api/auth/login", { method: "POST", body: { identifier: "ghost", password: "wrongpassword" } });
check("an unknown account gives the same message", r.data.message === wrongPass, r.data.message);

r = await call("/api/auth/me", { token: tokenA });
check("/me returns the account", r.status === 200 && r.data.user.username === alice.username, r.status);

r = await call("/api/auth/me", { method: "PUT", token: tokenA, body: { bio: "Testing the capstone." } });
check("the bio can be set", r.status === 200 && r.data.user.bio === "Testing the capstone.", r.status);

r = await call("/api/auth/me", { method: "PUT", token: tokenA, body: { bio: "x".repeat(200) } });
check("an over-long bio is 400", r.status === 400, r.status);

console.log("\nAVATARS");
r = await postForm("/api/auth/me/avatar", tokenA, {}, { field: "avatar", buffer: PNG_1PX, name: "me.png", type: "image/png" });
check("avatar upload returns 200", r.status === 200, r.status + " " + r.data.message);
check("the profile now has an avatar url", /^\/uploads\/[0-9a-f]{32}\.png$/.test(r.data.user?.avatarUrl || ""), r.data.user?.avatarUrl);
const avatarUrl = r.data.user.avatarUrl;

r = await call(avatarUrl);
check("the avatar is served as a file", r.status === 200 && r.length === PNG_1PX.length, r.status + " " + r.length);

r = await postForm("/api/auth/me/avatar", tokenA, {}, { field: "avatar", buffer: Buffer.alloc(2 * 1024 * 1024), name: "big.png", type: "image/png" });
check("an avatar over 1 MB is 413", r.status === 413, r.status);
check("the message names the limit", /1 MB/.test(r.data.message || ""), r.data.message);

r = await postForm("/api/auth/me/avatar", tokenA, {}, { field: "avatar", buffer: Buffer.from("nope"), name: "notes.txt", type: "text/plain" });
check("a non-image avatar is 400", r.status === 400, r.status);

console.log("\nPOSTS");
r = await call("/api/posts", { method: "POST", token: tokenA, body: { text: "Hello from the capstone." } });
check("create returns 201", r.status === 201, r.status + " " + r.data.message);
check("the author comes back nested, not as an id", r.data.data?.author?.username === alice.username);
check("counts start at zero", r.data.data?.likeCount === 0 && r.data.data?.commentCount === 0);
const postA = r.data.data.id;

r = await postForm("/api/posts", tokenA, { text: "A post with a picture." }, { field: "image", buffer: PNG_1PX, name: "shot.png", type: "image/png" });
check("a post can carry an image", r.status === 201 && /^\/uploads\//.test(r.data.data?.imageUrl || ""), r.status);
const imagePost = r.data.data;

r = await call(imagePost.imageUrl);
check("that image is served", r.status === 200 && r.length === PNG_1PX.length, r.status);

r = await call("/api/posts", { method: "POST", token: tokenA, body: { text: "   " } });
check("an empty post is 400", r.status === 400, r.status);

r = await call("/api/posts", { method: "POST", token: tokenA, body: { text: "x".repeat(600) } });
check("a post over 500 characters is 400", r.status === 400, r.status);

r = await call("/api/posts", { method: "POST", body: { text: "No token here." } });
check("posting without a token is 401", r.status === 401, r.status);

r = await postForm("/api/posts", tokenA, { text: "Too big." }, { field: "image", buffer: Buffer.alloc(5 * 1024 * 1024), name: "huge.png", type: "image/png" });
check("a post image over 4 MB is 413", r.status === 413, r.status);

r = await call("/api/posts", { method: "POST", token: tokenB, body: { text: "Bob says hello." } });
check("the second account can post", r.status === 201, r.status);
const postB = r.data.data.id;

console.log("\nREADING - PUBLIC AND PERSONAL");
r = await call("/api/posts");
check("the public timeline is readable logged out", r.status === 200 && r.data.total >= 3, r.status);
check("logged out, nothing is marked as liked by me", r.data.data.every((p) => p.likedByMe === false));

r = await call("/api/posts/" + postA);
check("one post reads without a token", r.status === 200 && r.data.data.id === postA, r.status);

r = await call("/api/posts?username=" + alice.username);
check("?username filters to one person's posts", r.status === 200 && r.data.data.every((p) => p.author.username === alice.username), r.status);

r = await call("/api/posts?scope=following");
check("the personal feed needs a login", r.status === 401, r.status);

r = await call("/api/posts?scope=following", { token: tokenA });
check("your own posts are in your feed before following anyone", r.data.data.every((p) => p.author.username === alice.username) && r.data.total === 2, JSON.stringify(r.data.total));

r = await call("/api/posts?limit=1&page=2");
check("paging works", r.status === 200 && r.data.count === 1 && r.data.pages >= 3, JSON.stringify({ c: r.data.count, p: r.data.pages }));

r = await call("/api/posts/not-an-id");
check("a malformed id is 400", r.status === 400, r.status);

r = await call("/api/posts/64b7f9c2e1a2b3c4d5e6f7a8");
check("an id that does not exist is 404", r.status === 404, r.status);

console.log("\nLIKES");
r = await call("/api/posts/" + postB + "/like", { method: "POST", token: tokenA });
check("liking returns the new state", r.status === 200 && r.data.data.liked === true && r.data.data.likeCount === 1, JSON.stringify(r.data.data));

r = await call("/api/posts/" + postB, { token: tokenA });
check("the post now says likedByMe", r.data.data.likedByMe === true);

r = await call("/api/posts/" + postB, { token: tokenB });
check("but not for somebody who has not liked it", r.data.data.likedByMe === false);

r = await call("/api/posts/" + postB + "/likes");
check("the likers list names the right person", r.data.count === 1 && r.data.data[0].username === alice.username, JSON.stringify(r.data.data));

r = await call("/api/posts/" + postB + "/like", { method: "POST", token: tokenA });
check("liking again unlikes", r.data.data.liked === false && r.data.data.likeCount === 0, JSON.stringify(r.data.data));

r = await call("/api/posts/" + postB + "/likes");
check("and the likers list is empty again", r.data.count === 0);

// Hammer the same like from several requests at once: the unique index has to
// keep the counter honest.
await call("/api/posts/" + postB + "/like", { method: "POST", token: tokenA });
await Promise.all([
  call("/api/posts/" + postB + "/like", { method: "POST", token: tokenB }),
  call("/api/posts/" + postB + "/like", { method: "POST", token: tokenB }),
  call("/api/posts/" + postB + "/like", { method: "POST", token: tokenB }),
]);
r = await call("/api/posts/" + postB + "/likes");
const likeCount = (await call("/api/posts/" + postB)).data.data.likeCount;
check("racing likes cannot inflate the count", likeCount === r.data.count, "counter=" + likeCount + " rows=" + r.data.count);

r = await call("/api/posts/" + postB + "/like", { method: "POST" });
check("liking without a token is 401", r.status === 401, r.status);

console.log("\nCOMMENTS");
r = await call("/api/posts/" + postA + "/comments", { method: "POST", token: tokenB, body: { text: "Nice post." } });
check("commenting returns 201", r.status === 201, r.status + " " + r.data.message);
check("the comment carries its author", r.data.data?.author?.username === bob.username);
const commentByBob = r.data.data.id;

r = await call("/api/posts/" + postA);
check("the post's comment count went up", r.data.data.commentCount === 1, String(r.data.data.commentCount));

r = await call("/api/posts/" + postA + "/comments");
check("the thread is readable logged out", r.status === 200 && r.data.count === 1, r.status);

r = await call("/api/posts/" + postA + "/comments", { method: "POST", token: tokenB, body: { text: "" } });
check("an empty comment is 400", r.status === 400, r.status);

r = await call("/api/posts/" + postA + "/comments", { method: "POST", body: { text: "No token." } });
check("commenting without a token is 401", r.status === 401, r.status);

// Alice owns the post, so she may remove Bob's comment on it.
r = await call("/api/comments/" + commentByBob, { method: "DELETE", token: tokenA });
check("the post owner can delete a comment on their post", r.status === 200, r.status);

r = await call("/api/posts/" + postA);
check("the comment count went back down", r.data.data.commentCount === 0, String(r.data.data.commentCount));

// Bob owning the post is the whole point of the rule above, so proving the
// 403 needs somebody who is neither the comment's author nor the post's
// owner: Alice comments on her own post, and Bob - a bystander there - tries
// to remove it.
r = await call("/api/posts/" + postA + "/comments", { method: "POST", token: tokenA, body: { text: "Mine to delete." } });
const commentByAlice = r.data.data.id;

r = await call("/api/comments/" + commentByAlice, { method: "DELETE", token: tokenB });
check("a bystander deleting someone else's comment is 403", r.status === 403, r.status);

r = await call("/api/comments/" + commentByAlice, { method: "DELETE", token: tokenA });
check("but its author can", r.status === 200, r.status);

r = await call("/api/posts/" + postA);
check("the count is right after all that", r.data.data.commentCount === 0, String(r.data.data.commentCount));

console.log("\nFOLLOWING AND THE FEED");
r = await call("/api/users/" + bob.username);
check("a profile is public", r.status === 200 && r.data.data.username === bob.username, r.status);
check("a public profile hides the email", r.data.data.email === undefined);

r = await call("/api/users/" + bob.username, { token: tokenA });
check("logged in, the profile says whether you follow them", r.data.data.followedByMe === false);

r = await call("/api/users/" + alice.username, { token: tokenA });
check("and knows your own profile is yours", r.data.data.isMe === true);

r = await call("/api/users/" + bob.username + "/follow", { method: "POST", token: tokenA });
check("following returns the new state", r.status === 200 && r.data.data.followed === true && r.data.data.followerCount === 1, JSON.stringify(r.data.data));

r = await call("/api/users/" + alice.username + "/follow", { method: "POST", token: tokenA });
check("following yourself is 400", r.status === 400, r.status);

r = await call("/api/posts?scope=following", { token: tokenA });
check("Bob's posts now appear in Alice's feed", r.data.data.some((p) => p.author.username === bob.username), JSON.stringify(r.data.total));

r = await call("/api/posts?scope=following", { token: tokenB });
check("but Alice's do not appear in Bob's, since he follows nobody", r.data.data.every((p) => p.author.username === bob.username));

r = await call("/api/users/" + bob.username + "/followers");
check("the followers list names Alice", r.data.count === 1 && r.data.data[0].username === alice.username, JSON.stringify(r.data.data));

r = await call("/api/users/" + alice.username + "/following");
check("and Alice's following list names Bob", r.data.count === 1 && r.data.data[0].username === bob.username);

r = await call("/api/users/" + bob.username + "/follow", { method: "POST", token: tokenA });
check("following again unfollows", r.data.data.followed === false && r.data.data.followerCount === 0, JSON.stringify(r.data.data));

r = await call("/api/users/" + bob.username + "/follow", { method: "POST", token: tokenA });
r = await call("/api/users?search=" + bob.username, { token: tokenA });
check("people search finds Bob", r.data.count === 1 && r.data.data[0].username === bob.username, JSON.stringify(r.data.count));
check("and marks him as followed", r.data.data[0].followedByMe === true);

r = await call("/api/users?search=" + alice.username, { token: tokenA });
check("search never suggests you to yourself", r.data.count === 0, JSON.stringify(r.data.data));

r = await call("/api/users/nobody-with-this-name");
check("an unknown profile is 404", r.status === 404, r.status);

console.log("\nDELETING A POST TAKES ITS LIKES AND COMMENTS WITH IT");
r = await call("/api/posts/" + imagePost.id + "/comments", { method: "POST", token: tokenB, body: { text: "Doomed comment." } });
check("set up: a comment on the image post", r.status === 201);
await call("/api/posts/" + imagePost.id + "/like", { method: "POST", token: tokenB });

r = await call("/api/posts/" + imagePost.id, { method: "DELETE", token: tokenB });
check("deleting somebody else's post is 404", r.status === 404, r.status);

r = await call("/api/posts/" + imagePost.id, { method: "DELETE", token: tokenA });
check("the author can delete it", r.status === 200, r.status);

r = await call("/api/posts/" + imagePost.id);
check("the post is gone", r.status === 404, r.status);

r = await call(imagePost.imageUrl);
check("its image left the disk too", r.status === 404, r.status);

r = await call("/api/posts/" + imagePost.id + "/comments");
check("its comments went with it", r.status === 404, r.status);

r = await call("/api/auth/me", { token: tokenA });
check("the post count came back down", r.data.user.postCount === 1, String(r.data.user.postCount));

r = await call("/api/nope");
check("an unknown route is 404 JSON", r.status === 404 && r.data.success === false, r.status);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
