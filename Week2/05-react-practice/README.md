# React Practice Set

The Week 2 practice set is React rather than backend, and questions 1 and 2 were
already answered by the [Week 1 React projects](../../Week1/02-react-components)
- a component showing product info, and props and state in a component. This app
covers the three that were left:

| Q | Question | Where to look |
|---|----------|---------------|
| 3 | Create a To-Do App with add/delete functionality | `src/pages/Todos.jsx` |
| 4 | Use React Router for multi-page navigation | `src/App.jsx`, `src/components/Layout.jsx` |
| 5 | Add CSS modules for styling components | every `*.module.css` file |

Built with Vite and React 19, same theme as the other apps in the repo.

## 3. To-Do with add and delete

The list of tasks is `useState` in `Todos.jsx`, not in the components below it.
Both the form and the list need it, so it is held by the closest component above
the two of them and passed down as props - the same lifting-state-up pattern as
the Week 1 shop.

- **Add** builds a new array with the spread operator, `[...todos, task]`
- **Delete** uses `filter` to keep everything except the id that was clicked
- **Toggle** uses `map` to rebuild the list with `done` flipped on one item

None of the three edit the array in place. React compares the old state to the
new one by identity, so mutating the existing array would change nothing on
screen.

`TodoForm` holds the text of its own controlled input, which is what lets it
clear the box after adding and refuse an empty task.

## 4. React Router

`BrowserRouter` wraps the app in `main.jsx`. The routes live in `App.jsx`:

| URL | Component | Note |
|-----|-----------|------|
| `/` | `Home` | index route |
| `/todos` | `Todos` | the add and delete practice |
| `/about` | `About` | how the app is put together |
| anything else | `NotFound` | the `*` catch-all |

All four are children of a `Layout` route, so the nav bar and footer are written
once and `<Outlet />` marks where the current page is dropped in. The nav uses
`NavLink`, which passes `isActive` to its `className`, so the current tab
highlights itself without any state.

## 5. CSS modules

Every component has a `*.module.css` file beside it and reads its class names
off the imported object:

```jsx
import styles from "./TodoItem.module.css";

<li className={styles.item}>
```

Vite rewrites those class names to something unique at build time, so `.item`
here cannot collide with an `.item` anywhere else. In the built CSS the `.body`
class appears twice - once from `About`, once from `NotFound` - under two
different hashed names, which is the point of the exercise.

Only what cannot be scoped to a single component stays global in `index.css`:
the reset, the colour and spacing custom properties, and the `body` rules.

## Running it

```bash
cd Week2/05-react-practice
npm install
npm run dev                          # http://localhost:5173
```

No backend and no `.env` - everything is in the browser.
