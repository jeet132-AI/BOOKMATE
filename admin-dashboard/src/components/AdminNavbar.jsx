import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./AdminNavbar.css";

function AdminNavbar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  const closeMenu = () => setMenuOpen(false);

  const navItems = [
    { name: "Dashboard", path: "/", icon: "🏠" },
    { name: "All Products", path: "/products", icon: "📚" },
    { name: "Pending Products", path: "/products/pending", icon: "⏳" },
    { name: "Users", path: "/users", icon: "👥" },
    { name: "Orders", path: "/orders", icon: "📦" },
    { name: "Payments", path: "/payments", icon: "💳" },
    { name: "Shipping", path: "/shipping", icon: "🚚" },
    { name: "Payouts", path: "/payouts", icon: "💰" },
    { name: "Categories", path: "/categories", icon: "🗂️" },
    { name: "Reports", path: "/reports", icon: "📊" },
    { name: "Reviews", path: "/reviews", icon: "⭐" },
    { name: "Pricing", path: "/pricing", icon: "⚙️" },
  ];

  return (
    <nav className="admin-navbar">
      <div className="navbar-book book-one">📕</div>
      <div className="navbar-book book-two">📗</div>
      <div className="navbar-book book-three">📘</div>

      <div className="admin-navbar-inner">

        <Link to="/" className="admin-navbar-brand" onClick={closeMenu}>
          <div className="brand-3d-book">
            <span>📚</span>
          </div>

          <div className="brand-text">
            <strong>USED BOOK MARKET</strong>
            <small>ADMIN PANEL</small>
          </div>
        </Link>

        {/* Phone top bar: Dashboard + Logout + Menu button */}
        <div className="admin-nav-quick">
          <Link
            to="/"
            className="admin-nav-link admin-quick-link"
            onClick={closeMenu}
          >
            <span className="nav-link-icon">🏠</span>
            <span>Dashboard</span>
          </Link>

          <button
            type="button"
            className="admin-logout-button admin-quick-logout"
            onClick={handleLogout}
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>

          <button
            type="button"
            className="admin-menu-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        <div className="admin-nav-links">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="admin-nav-link"
              onClick={closeMenu}
            >
              <span className="nav-link-icon">
                {item.icon}
              </span>

              <span>{item.name}</span>
            </Link>
          ))}

          <button
            type="button"
            className="admin-logout-button admin-full-logout"
            onClick={handleLogout}
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>

        {/* Phone dropdown: all menus */}
        {menuOpen && (
          <div className="admin-nav-dropdown">
            {navItems
              .filter((item) => item.path !== "/")
              .map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="admin-nav-link"
                  onClick={closeMenu}
                >
                  <span className="nav-link-icon">
                    {item.icon}
                  </span>

                  <span>{item.name}</span>
                </Link>
              ))}
          </div>
        )}
      </div>

      <div className="navbar-bottom-line"></div>
    </nav>
  );
}

export default AdminNavbar;