// Footer - name, year and links. Props in, markup out, no state.

function Footer({ name, links }) {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <p>
        {name} - {year} - SkillNexis Week 2 mini project
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
