import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import useTheme from "../hooks/useTheme";
import { useCart } from "../context/CartContext";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();

  const { darkMode, toggleTheme } = useTheme();
  const { count } = useCart();

  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 24);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isLoggedIn = Boolean(token && user);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    closeMenu();
    navigate("/");
  }

  return (
    <nav className={scrolled ? "navbar scrolled" : "navbar"}>
      <NavLink
        to="/"
        className="navbar-logo"
        onClick={closeMenu}
      >
        USED BOOK MARKET
      </NavLink>

      <button
        type="button"
        className="menu-toggle"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      <div
        className={menuOpen ? "nav-links open" : "nav-links"}
        onClick={closeMenu}
      >
        {!isLoggedIn && (
          <>
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Home
            </NavLink>

            <NavLink
              to="/about"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              About
            </NavLink>

            <span className="nav-login-hint">
              <span
                className="nav-pointing-hand"
                aria-hidden="true"
              >
                👉
              </span>

              <span className="nav-hint-bubble">
                Login here!
              </span>
            </span>

            <NavLink
              to="/login"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Login
            </NavLink>

            <NavLink
              to="/register"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Register
            </NavLink>

            <NavLink
              to="/cart"
              className={({ isActive }) =>
                isActive ? "nav-link active cart-link" : "nav-link cart-link"
              }
              aria-label={`Cart, ${count} items`}
            >
              🛒
              {count > 0 && (
                <span className="cart-count-badge">
                  {count}
                </span>
              )}
            </NavLink>
          </>
        )}

        {isLoggedIn && user?.role !== "admin" && (
          <>
            <NavLink to="/" className="nav-link">Home</NavLink>
            <NavLink to="/books" className="nav-link">Books</NavLink>
            <NavLink to="/sell" className="nav-link">Sell</NavLink>
            <NavLink to="/dashboard" className="nav-link">Dashboard</NavLink>
            <NavLink to="/orders" className="nav-link">Orders</NavLink>
            <NavLink to="/listings" className="nav-link">Listings</NavLink>
            <NavLink to="/wishlist" className="nav-link">Wishlist</NavLink>
            <NavLink to="/profile" className="nav-link">Profile</NavLink>

            <NavLink
              to="/cart"
              className="nav-link cart-link"
              aria-label={`Cart, ${count} items`}
            >
              🛒
              {count > 0 && (
                <span className="cart-count-badge">
                  {count}
                </span>
              )}
            </NavLink>
            <button
              type="button"
              className="nav-logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        )}

        {isLoggedIn && user?.role === "admin" && (
          <button
            type="button"
            className="nav-logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        )}

        <button
          type="button"
          className="theme-toggle"
          onClick={(e) => {
            e.stopPropagation();
            toggleTheme();
          }}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          aria-pressed={darkMode}
        >
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;