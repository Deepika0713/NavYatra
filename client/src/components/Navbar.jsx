
import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Places", to: "/places" },
  { label: "Trip Planner", to: "/planner" },
  { label: "Itinerary", to: "/itinerary" },
  { label: "Dashboard", to: "/dashboard" },
];

export default function Navbar() {
  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <NavLink to="/" className="brand">
          <img
            src="/Logo1.png"
            alt="NavYatra logo"
            className="brand-logo"
          />
          <span>NavYatra</span>
        </NavLink>

        <nav className="nav-links" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
