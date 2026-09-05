import { Link } from "react-router-dom";
import styles from "./NotFound.module.css";

// NotFound - what the "*" route renders for a URL that matched nothing.

function NotFound() {
  return (
    <section className={styles.wrap}>
      <p className={styles.code}>404</p>
      <h2>No page at that address</h2>
      <p className={styles.body}>The link may be wrong, or the page may have moved.</p>
      <Link className={styles.link} to="/">
        Back to home
      </Link>
    </section>
  );
}

export default NotFound;
