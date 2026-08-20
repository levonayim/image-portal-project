# /photos

Drop your landscape image files (jpg/png/gif) into this folder, then add a
matching entry to `../photos.config.js`:

```js
{ id: "unique-id", src: "photos/your-file.jpg", caption: "Optional caption" },
```

Order in `photos.config.js` is the order they appear in the portal. Comment
out an entry to temporarily hide it without deleting the file.

Want a moving photo instead of a still one? See `../tools/README.md` — you
can turn any photo into an animated GIF and drop that in here instead.
