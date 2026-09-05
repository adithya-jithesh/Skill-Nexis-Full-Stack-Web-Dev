import { NavLink, Outlet } from "react-router-dom";
import styles from "./Layout.module.css";

// Layout - the frame every page sits inside: the nav bar at the top and
// the footer at the bottom. It takes no props; the page in the middle
// comes from the router through <Outlet />.

// The three links in the nav bar. Keeping them in an array means adding a
// page later is one line here, not another copy-pasted <NavLink>.
const links = [
  { to: "/", label: "Home", end: true },
  { to: "/todos", label: "To-Do" },
  { to: "/about", label: "About" },
];

function Layout() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.mark} aria-hidden="true">
            SN
          </span>
          <span>
            <strong className={styles.title}>React Practice Set</strong>
            <span className={styles.tagline}>SkillNexis Week 2</span>
          </span>
        </div>

        <nav className={styles.nav}>
          {links.map((link) => (
            // NavLink is a Link that knows whether it is the current page.
            // className can be a function, and React Router passes it
            // isActive - that is how the current tab gets highlighted
            // without any state of our own.
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                isActive ? styles.link + " " + styles.linkActive : styles.link
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Whichever page matched the URL is rendered right here */}
      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        Built with React and React Router - practice questions 3, 4 and 5.
      </footer>
    </div>
  );
}

export default Layout;
