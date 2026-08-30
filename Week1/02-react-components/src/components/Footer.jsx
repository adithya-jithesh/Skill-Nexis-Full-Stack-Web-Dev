// Footer - simple component, props in and markup out, no state.
// Props: name, links (array of objects with label and href).

function Footer({ name, links }) {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <p>
        {name} - {year} - SkillNexis Week 1 assignment
      </p>

      <p>
        {links.map((link) => (
          <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
            {link.label}
          </a>
        ))}
      </p>
    </footer>
  );
}

export default Footer;
