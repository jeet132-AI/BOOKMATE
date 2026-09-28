import { Link, useNavigate } from "react-router-dom";
import "./AdminNavbar.css";

function AdminNavbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

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

        <Link to="/" className="admin-navbar-brand">
          <div className="brand-3d-book">
            <span>📚</span>
          </div>

          <div className="brand-text">
            <strong>USED BOOK MARKET</strong>
            <small>ADMIN PANEL</small>
          </div>
        </Link>

        <div className="admin-nav-links">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="admin-nav-link"
            >
              <span className="nav-link-icon">
                {item.icon}
              </span>

              <span>{item.name}</span>
            </Link>
          ))}

          <button
            type="button"
            className="admin-logout-button"
            onClick={handleLogout}
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="navbar-bottom-line"></div>
    </nav>
  );
}

export default AdminNavbar;