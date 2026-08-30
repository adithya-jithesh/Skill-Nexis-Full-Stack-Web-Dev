# React Blog UI

SkillNexis Week 1, assignment 3 (mini project). A blog that renders post cards
from a local JSON file, with search and category filtering.

The ten posts live in `src/data/posts.json` and are pulled in with a plain
`import`, so there is no fetch and nothing to wait for. Search matches the
title, summary and tags, and works together with the category buttons.

`search` and `category` live in `src/App.jsx` because the sidebar sets them and
the post list reads them. Whether a post is expanded lives inside that
`PostCard`, since it affects nothing else.

## Run it

```bash
npm install
npm run dev
```

## Files

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
