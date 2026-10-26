const navItems = [
  { label: "Home", href: "/" },
  { label: "Places", href: "/places" },
  { label: "Trip Planner", href: "/planner" },
  { label: "Itinerary", href: "/itinerary" },
  { label: "Dashboard", href: "/dashboard" },
];

export default function Navbar() {
  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <a className="brand" href="/">
          <img
            className="brand-logo"
            src="/Logo1.png"
            alt="NavYatra logo"
          />
          <span>NavYatra</span>
        </a>

        <nav className="nav-links" aria-label="Main">
          {navItems.map((item) => (
            <a className="nav-link" href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}