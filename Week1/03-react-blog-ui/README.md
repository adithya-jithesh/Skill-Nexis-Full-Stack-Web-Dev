# React Blog UI

Week 1, assignment 3 - the mini project. A blog that renders post cards out of
a local JSON file, with a search box and category filtering.

The ten posts sit in `src/data/posts.json` and come in through a plain
`import`, so there's no fetch and no loading state to design around. Search
matches the title, summary and tags, and works alongside the category buttons
instead of replacing them.

`search` and `category` live in `src/App.jsx` because the sidebar sets them and
the post list reads them. Whether a post is expanded stays inside that
`PostCard` - opening one shouldn't do anything to the others, and keeping it
local is what guarantees that.

```bash
npm install
npm run dev
```

```
src/
├── App.jsx              search and category state, filters the posts
├── index.css            all the styling
├── main.jsx             renders <App /> into index.html
├── data/posts.json      the posts
└── components/
    ├── Header.jsx       blog title and the post count
    ├── Sidebar.jsx      search box and category buttons
    ├── PostCard.jsx     one post, expands to show the full text
    ├── Footer.jsx       name, year and links
    └── Button.jsx       shared button
```
