# SkillNexis - Full Stack Web Development (MERN)

Assignment submissions for the SkillNexis Full Stack Web Development (MERN) virtual internship.

**Adithya Jithesh** - B.Tech Electronics & Computer Engineering, Somaiya Vidyavihar School of Engineering
[GitHub](https://github.com/adithya-jithesh) · [LinkedIn](https://linkedin.com/in/adithyajithesh)

### Live sites

- **Portfolio** - https://adithya-jithesh.github.io/Skill-Nexis-Full-Stack-Web-Dev/portfolio/
- **React Components Practice** - https://adithya-jithesh.github.io/Skill-Nexis-Full-Stack-Web-Dev/shop/
- **Mini Project, Blog UI** - https://adithya-jithesh.github.io/Skill-Nexis-Full-Stack-Web-Dev/blog/

Deployed by GitHub Pages on every push to `main`. The portfolio is copied
across as-is; the two React apps are built with Vite by the workflow in
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

---

## Week 1 - Frontend Fundamentals (HTML, CSS, React Basics)

**Topics:** HTML5 semantic structure · CSS3 (Flexbox, Grid, Responsive Design) · JavaScript ES6+ · React basics (Components, Props, State, Events)

| # | Deliverable | Folder | Status |
|---|-------------|--------|--------|
| 1 | Personal Portfolio Website | [`Week1/01-portfolio`](Week1/01-portfolio) | ✅ Done |
| 2 | React Components Practice | [`Week1/02-react-components`](Week1/02-react-components) | ✅ Done |
| 3 | Mini Project - React Blog UI | [`Week1/03-react-blog-ui`](Week1/03-react-blog-ui) | ✅ Done |

### 1. Personal Portfolio Website
Responsive portfolio built with plain HTML5, CSS3 and vanilla JavaScript - no frameworks.

- Semantic HTML5 structure (`header`, `nav`, `main`, `section`, `article`, `footer`)
- Required sections: About, Education, Projects, Contact (plus Hero and Skills)
- Responsive navigation bar with an animated hamburger menu on mobile
- Layout built with CSS Flexbox and Grid (`auto-fit` + `minmax` responsive columns)
- Vanilla JavaScript contact form validation with inline, per-field error messages

**Run it:** open `Week1/01-portfolio/index.html` in a browser, or serve it with
`npx http-server Week1/01-portfolio -p 5500`.

### 2. React Components Practice
Five reusable components built with React 19 and Vite, wired together into a
small supermarket app: browse products, search and filter them, add stock, and
add items to a cart.

| Component | Demonstrates |
|-----------|--------------|
| `Button`  | Props with defaults, `children`, a `disabled` prop |
| `Card`    | Props, conditional rendering, a value calculated from a prop |
| `Header`  | Derived props (live cart count and total), conditional button |
| `Form`    | `useState`, controlled inputs, validation, lifting state up |
| `Footer`  | Pure presentational component, rendering an array with `.map()` |

State lives in `App.jsx` and flows down through props: the form adds products,
cards sell and remove them, the search box and category dropdown filter them,
and the header cart updates automatically.

See [`FLOW.md`](FLOW.md) for how the pieces fit together and
[`DECISIONS.md`](DECISIONS.md) for why each choice was made.

**Run it:**
```bash
cd Week1/02-react-components
npm install
npm run dev
```

### 3. Mini Project - React Blog UI
A blog that renders post cards from a local JSON file, with search and filtering.

- Ten posts stored in `src/data/posts.json` and pulled in with a plain `import`
- Post cards rendered with `.map()` over the filtered array
- Search box matching the title, summary and tags
- Category sidebar built from the posts themselves, so the buttons follow the data
- Search and category apply together, with a "no posts found" message and a clear button
- Each card expands its full text with its own `useState`, independent of the others

| Component | Demonstrates |
|-----------|--------------|
| `Header`   | Props, a live "showing x of y" count |
| `Sidebar`  | Controlled input, list rendering, conditional class names |
| `PostCard` | Its own local state, conditional rendering, rendering an array of tags |
| `Footer`   | Pure presentational component |
| `Button`   | Reused from assignment 2 |

**Run it:**
```bash
cd Week1/03-react-blog-ui
npm install
npm run dev
```

**Run it:**
```bash
cd Week1/02-react-components
npm install
npm run dev
```

---

## Repository structure

```
.
├── README.md
├── DECISIONS.md
├── FLOW.md
└── Week1/
    ├── 01-portfolio/          # HTML + CSS + vanilla JS
    │   ├── index.html
    │   ├── css/style.css
    │   └── js/script.js
    ├── 02-react-components/   # Vite + React
    └── 03-react-blog-ui/      # Vite + React
```
