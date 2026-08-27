/**
 * Footer — the simplest component here: props in, markup out, no state.
 *
 * Props:
 *   name   whose site this is
 *   links  ARRAY of { label, href } objects → rendered with .map()
 *
 * The year isn't a prop because it's derivable — computing it here means
 * one less thing for the parent to pass and remember to update.
 */
function Footer({ name, links = [] }) {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <p>
        &copy; {year} {name} &middot; Week 1 &mdash; React Components Practice
      </p>

      <ul className="footer__links">
        {links.map((link) => (
          <li key={link.href}>
            <a href={link.href} target="_blank" rel="noopener noreferrer">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </footer>
  );
}

export default Footer;
