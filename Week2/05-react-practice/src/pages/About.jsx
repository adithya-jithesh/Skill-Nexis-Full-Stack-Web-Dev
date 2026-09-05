import styles from "./About.module.css";

// About - a plain content page. Its real job is to give the router a
// second and third destination so the navigation is worth having.

const routes = [
  { path: "/", page: "Home", note: "index route inside the layout" },
  { path: "/todos", page: "Todos", note: "the add and delete practice" },
  { path: "/about", page: "About", note: "this page" },
  { path: "anything else", page: "NotFound", note: "the * catch-all route" },
];

function About() {
  return (
    <section>
      <h2>How this app is put together</h2>

      <h3 className={styles.heading}>Routing</h3>
      <p className={styles.body}>
        <code className={styles.code}>BrowserRouter</code> wraps the app in{" "}
        <code className={styles.code}>main.jsx</code>. The routes are declared in{" "}
        <code className={styles.code}>App.jsx</code>, and every one of them is a
        child of the <code className={styles.code}>Layout</code> route, so the nav
        bar and footer are written once and appear on all of them.
      </p>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>URL</th>
            <th>Component</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {routes.map((route) => (
            <tr key={route.path}>
              <td>
                <code className={styles.code}>{route.path}</code>
              </td>
              <td>{route.page}</td>
              <td className={styles.note}>{route.note}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className={styles.heading}>Styling</h3>
      <p className={styles.body}>
        Each component imports its own{" "}
        <code className={styles.code}>*.module.css</code> file and reads class
        names off the imported object, so a class name here cannot leak into
        another component. Only the reset, the colour and spacing variables, and
        the body rules stay global in{" "}
        <code className={styles.code}>index.css</code>.
      </p>
    </section>
  );
}

export default About;
