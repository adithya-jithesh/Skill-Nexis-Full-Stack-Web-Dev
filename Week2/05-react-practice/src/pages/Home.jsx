import { Link } from "react-router-dom";
import styles from "./Home.module.css";

// Home - the landing page. It explains which practice questions this app
// answers and links across to the other routes.

const covered = [
  {
    number: 3,
    title: "To-Do app with add and delete",
    detail: "State in the page, props down to the form and the list.",
  },
  {
    number: 4,
    title: "React Router for multi-page navigation",
    detail: "Three routes behind one shared layout, plus a catch-all.",
  },
  {
    number: 5,
    title: "CSS modules for styling",
    detail: "Every component has its own scoped *.module.css file.",
  },
];

function Home() {
  return (
    <section>
      <h2>React practice set</h2>
      <p className={styles.intro}>
        Questions 1 and 2 of the Week 2 practice set were already answered by the
        Week 1 React projects. This small app covers the three that were left.
      </p>

      <ul className={styles.cards}>
        {covered.map((item) => (
          <li key={item.number} className={styles.card}>
            <span className={styles.number}>Q{item.number}</span>
            <div>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardDetail}>{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>

      {/* Link, not <a> - it swaps the page without reloading the browser */}
      <Link className={styles.cta} to="/todos">
        Open the to-do app
      </Link>
    </section>
  );
}

export default Home;
