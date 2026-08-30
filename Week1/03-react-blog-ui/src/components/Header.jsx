// Header - blog title and how many posts are being shown right now.
// Props: title, subtitle, postCount, totalCount.
// The two counts are worked out in App and passed down.

function Header({ title, subtitle, postCount, totalCount }) {
  return (
    <header className="header">
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <p className="header__count">
        Showing {postCount} of {totalCount} posts
      </p>
    </header>
  );
}

export default Header;
