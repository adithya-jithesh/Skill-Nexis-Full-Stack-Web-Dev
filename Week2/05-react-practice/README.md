# React Practice Set

The Week 2 practice set is React rather than backend, so it doesn't overlap
with the APIs in the folders next door. Questions 1 and 2 - a component showing
product info, and props and state in a component - were already answered by the
[Week 1 React projects](../../Week1/02-react-components), so this app covers
the three that were left:

- **Q3**, a to-do with add and delete - `src/pages/Todos.jsx`
- **Q4**, React Router for multi-page navigation - `src/App.jsx` and
  `src/components/Layout.jsx`
- **Q5**, CSS modules - every `*.module.css` file

Vite and React 19, same theme as the rest of the repo.

```bash
cd Week2/05-react-practice
npm install
npm run dev     # http://localhost:5173
```

No backend and no `.env` for this one - it's all in the browser.

## The to-do

The list is `useState` in `Todos.jsx` rather than in the components underneath
it. Both the form and the list need it, so it sits in the closest component
above the two of them and comes down as props - the same lifting-state-up idea
as the Week 1 shop.

Add builds a new array with `[...todos, task]`. Delete uses `filter` to keep
everything except the id that was clicked. Toggle uses `map` to rebuild the
list with `done` flipped on one item.

None of the three touch the existing array. React decides whether to re-render
by comparing old state to new by identity, so pushing onto the array in place
would change the data and show nothing.

`TodoForm` keeps the text of its own input, which is what lets it clear the box
after adding and turn away an empty task.

## Routing

`BrowserRouter` wraps the app in `main.jsx`; the routes themselves are in
`App.jsx`.

| URL | Component |
|-----|-----------|
| `/` | `Home` |
| `/todos` | `Todos` |
| `/about` | `About` |
| anything else | `NotFound`, via the `*` catch-all |

All four are children of a `Layout` route, so the nav bar and footer are
written once and `<Outlet />` marks the hole the current page drops into. The
nav uses `NavLink`, which hands `isActive` to its `className`, so the current
tab highlights itself and there's no state to keep in sync.

## CSS modules

Each component has a `*.module.css` beside it and reads class names off the
imported object:

```jsx
import styles from "./TodoItem.module.css";

<li className={styles.item}>
```

Vite rewrites those names to something unique at build time, so `.item` here
can't collide with an `.item` somewhere else. You can see it in the built CSS:
`.body` shows up twice, once from `About` and once from `NotFound`, under two
different hashed names.

What's left in `index.css` is only what can't belong to a single component -
the reset, the colour and spacing custom properties, and the `body` rules.
