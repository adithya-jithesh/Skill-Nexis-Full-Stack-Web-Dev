# React Components Practice

Week 1, assignment 2. A small supermarket app put together from five reusable
components: `Header`, `Footer`, `Card`, `Button` and `Form`.

You can add products through the form, search and filter the shelf, and drop
things into a cart. Selling an item takes it off the shelf, and emptying the
cart puts it back.

The assignment was really about props and state, so that's what the structure
is built around. Everything shared lives in `src/App.jsx` and comes down as
props; the components push changes back up by calling functions their parent
gave them. `Form` is the one holding local state of its own, since a
half-typed product isn't anybody else's business until it's submitted.

```bash
npm install
npm run dev
```

```
src/
├── App.jsx              products, cart, search and filter state
├── index.css            all the styling
├── main.jsx             renders <App /> into index.html
└── components/
    ├── Header.jsx       shop name and the cart summary
    ├── Form.jsx         add a new product, with validation
    ├── Card.jsx         one product
    ├── Footer.jsx       name, year and links
    └── Button.jsx       shared button
```
