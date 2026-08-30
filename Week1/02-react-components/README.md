# React Components Practice

SkillNexis Week 1, assignment 2. A small supermarket app built from five
reusable components: `Header`, `Footer`, `Card`, `Button` and `Form`.

Add products through the form, search and filter the shelf, and add items to a
cart. Selling an item takes it off the shelf, and emptying the cart puts it
back.

All shared state lives in `src/App.jsx` and is passed down as props. The
components send changes back up by calling functions the parent gave them.

## Run it

```bash
npm install
npm run dev
```

## Files

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
