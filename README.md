# SkillNexis — Full Stack Web Development (MERN)

Assignment submissions for the SkillNexis Full Stack Web Development (MERN) virtual internship.

**Adithya Jithesh** — B.Tech Electronics & Computer Engineering, Somaiya Vidyavihar School of Engineering
[GitHub](https://github.com/adithya-jithesh) · [LinkedIn](https://linkedin.com/in/adithyajithesh)

---

## Week 1 — Frontend Fundamentals (HTML, CSS, React Basics)

**Topics:** HTML5 semantic structure · CSS3 (Flexbox, Grid, Responsive Design) · JavaScript ES6+ · React basics (Components, Props, State, Events)

| # | Deliverable | Folder | Status |
|---|-------------|--------|--------|
| 1 | Personal Portfolio Website | [`Week1/01-portfolio`](Week1/01-portfolio) | ✅ Done |
| 2 | React Components Practice | [`Week1/02-react-components`](Week1/02-react-components) | ✅ Done |
| 3 | Mini Project — React Blog UI | `Week1/03-react-blog-ui` | ⏳ Pending |

### 1. Personal Portfolio Website
Responsive portfolio built with plain HTML5, CSS3 and vanilla JavaScript — no frameworks.

- Semantic HTML5 structure (`header`, `nav`, `main`, `section`, `article`, `footer`)
- Required sections: About, Education, Projects, Contact (plus Hero and Skills)
- Responsive navigation bar with an animated hamburger menu on mobile
- Layout built with CSS Flexbox and Grid (`auto-fit` + `minmax` responsive columns)
- Vanilla JavaScript contact form validation with inline, per-field error messages

**Run it:** open `Week1/01-portfolio/index.html` in a browser, or serve it with
`npx http-server Week1/01-portfolio -p 5500`.

### 2. React Components Practice
Five reusable components built with React 19 and Vite, wired together into a
working project manager.

| Component | Demonstrates |
|-----------|--------------|
| `Button`  | Props with defaults, `children`, variant modifier classes |
| `Card`    | Props, list rendering with `.map()` and `key`, conditional rendering |
| `Header`  | Derived props (live project count), controlled theme switching |
| `Form`    | `useState`, controlled inputs, validation, lifting state up |
| `Footer`  | Pure presentational component, rendering an array of links |

State lives in `App.jsx` and flows down through props: the form adds projects,
cards remove them, the search box filters them, and the header count updates
automatically.

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
└── Week1/
    ├── 01-portfolio/          # HTML + CSS + vanilla JS
    │   ├── index.html
    │   ├── css/style.css
    │   └── js/script.js
    ├── 02-react-components/   # Vite + React
    └── 03-react-blog-ui/      # Vite + React
```
