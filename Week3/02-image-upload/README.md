# Week 3, assignment 2 - Image Upload

An upload endpoint built with Multer, and a React front end that previews the
picked file before it is sent and shows everything that has been uploaded.

```
02-image-upload/
├── server/     Express + Multer + MongoDB, port 5004
│   └── uploads/    where the files land (gitignored)
└── client/     React + Vite, port 5174
```

## Running it

```bash
# terminal 1
cd Week3/02-image-upload/server
npm install
cp .env.example .env
npm run dev               # http://localhost:5004

# terminal 2
cd Week3/02-image-upload/client
npm install
cp .env.example .env
npm run dev               # http://localhost:5174
```

## The API

| Method | Route | What it does |
|--------|-------|--------------|
| POST | `/api/images` | upload one image - `multipart/form-data`, field `image`, optional `caption` |
| GET | `/api/images` | every image, newest first |
| GET | `/api/images/:id` | one record |
| DELETE | `/api/images/:id` | delete the record and the file |
| GET | `/uploads/:filename` | the image itself |

Limits: 2 MB, and JPEG, PNG, GIF or WebP.

`postman/image-upload.postman_collection.json` has all of it. One thing to know
about the upload request: Postman cannot store a file inside a collection, so
that row comes in empty - open the request, go to **Body > form-data** and pick
a file for the `image` key.

## Why a file needs Multer

Everything so far has been JSON, which `express.json()` parses. A file cannot
go in JSON, so a form containing one is sent as `multipart/form-data`: the body
is split into parts with a boundary string between them, one part per field,
and the file part carries raw bytes. Express does not parse that. Multer does -
it reads the parts, writes the file, and leaves the text fields on `req.body`
and the file on `req.file`.

The same thing shows up on the client. `api.js` deliberately does **not** set a
`Content-Type` header on the upload:

```js
const form = new FormData();
form.append("image", file);
return client.post("/api/images", form, { onUploadProgress });
```

The browser has to write that header itself, because it includes the boundary
string, and a hand-written `multipart/form-data` header would leave it out -
the server then has no idea where one part ends and the next begins.

## The parts worth explaining

**The stored name is never the uploaded name.** Multer generates a random one:

```js
cb(null, crypto.randomBytes(16).toString("hex") + path.extname(file.originalname));
```

Two people uploading `photo.jpg` would otherwise overwrite each other, and a
name like `../../src/server.js` would write outside the uploads folder
entirely. A random name from a fixed alphabet can do neither. The original name
is still stored on the record, but only to show it - it is never used to build
a path.

**The type check does not trust the browser.** A request can claim any MIME
type it likes, so `fileFilter` requires the claimed type and the file extension
to agree, and rejects anything that is not one of the four image types.

**The size limit is enforced by Multer, not by the controller.** `limits.fileSize`
stops reading once the file passes 2 MB, so an oversized upload is refused part
way through instead of being written to disk and deleted afterwards.

**Multer's errors are translated.** It throws a `MulterError` with terse
wording like "File too large". `uploadErrors` turns those into the same JSON
shape as the rest of the API with a status that fits - 413 for the size limit,
400 for the wrong field or a rejected type - so the client can show the message
as it is.

**A failed record does not leave a file behind.** By the time the controller
runs, the file is already on disk. If writing the record then fails - a caption
over 140 characters, say - the file would sit there forever with nothing
pointing at it, so the controller deletes it before rethrowing. Deleting an
image does both as well: the record and the file.

**The record stores a filename; the response carries a URL.** Where files are
served from is the server's business, so the model has a virtual:

```js
imageSchema.virtual("url").get(function url() {
  return "/uploads/" + this.filename;
});
```

Change the static route and every response follows.

## The preview

The preview is drawn before anything is uploaded. `URL.createObjectURL(file)`
hands back a URL pointing at the file already in the browser's memory, which
goes straight into an `<img src>`. The browser holds that object until it is
revoked, so the effect that creates it also revokes it when the file changes or
the component unmounts - otherwise picking ten images in a row leaks ten of
them.

Once the upload finishes, the gallery below shows the stored image fetched back
from the API, which is the real difference between the two: the preview is
local and disappears on refresh, the gallery is what the server actually has.

Axios reports upload progress through `onUploadProgress`, which is what drives
the progress bar. The same thing with `fetch` needs a `ReadableStream` and a
good deal more code.

The client repeats the server's size and type checks before sending. That is
not a substitute for the server's - it only saves uploading 5 MB to be told no.

## Checks

24 automated checks against a live server, database and disk: uploading,
fetching the stored file back and comparing its length to the bytes sent,
listing, reading, deleting - and confirming the file leaves the disk with the
record. Plus the refusals: a non-image, an image type with a mismatched
extension, a 3 MB file, a request with no file, and an over-long caption. That
last one also checks nothing was left in the uploads folder. All 24 pass.
