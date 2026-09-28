import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useTheme from "../hooks/useTheme";
import "./login.css";

function Login() {
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [accountNotFound, setAccountNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("");
    setAccountNotFound(false);
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Invalid email or password");

        if (
          response.status === 404 &&
          data.message === "Account not found. Please register first."
        ) {
          setAccountNotFound(true);
        }

        setLoading(false);
        return;
      }

      const user = data.user;

      if (!user) {
        setMessage("Invalid server response.");
        setLoading(false);
        return;
      }

      // Administrator accounts sign in through the
      // separate Admin Panel, never here.
      if (user?.role === "admin") {
        setMessage(
          "This is an administrator account. Please sign in through the Admin Panel."
        );
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/profile");
    } catch (error) {
      console.error(error);
      setMessage(
        "Unable to connect to server. Please start the backend."
      );
    }

    setLoading(false);
  };

  return (
    <div className="login-page">
      <button
        type="button"
        className="page-theme-toggle"
        onClick={toggleTheme}
        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        aria-pressed={darkMode}
      >
        {darkMode ? "☀️ Light" : "🌙 Dark"}
      </button>

      {/* Animated Background */}
      <div className="login-background">
        <span className="floating-book book-1">📕</span>
        <span className="floating-book book-2">📗</span>
        <span className="floating-book book-3">📘</span>
        <span className="floating-book book-4">📙</span>
        <span className="floating-book book-5">📚</span>
      </div>

      {/* Main Login Container */}
      <div className="login-container">

        {/* Left Side */}
        <div className="login-info">

          <div className="login-logo">
            📚
          </div>

          <h1>USED BOOK MARKET</h1>

          <p>
            Buy, Sell and Reuse Your Study Materials
          </p>

          <div className="login-flow">

            <div className="flow-box">
              <span className="flow-icon">📖</span>
              <strong>BUY</strong>
              <small>Affordable books</small>
            </div>

            <div className="flow-arrow">→</div>

            <div className="flow-box">
              <span className="flow-icon">💰</span>
              <strong>SELL</strong>
              <small>Unused books</small>
            </div>

            <div className="flow-arrow">→</div>

            <div className="flow-box">
              <span className="flow-icon">♻️</span>
              <strong>REUSE</strong>
              <small>Help students</small>
            </div>

          </div>

          <div className="login-info-footer">
            <span>📖</span>
            <span>Learn</span>

            <span>•</span>

            <span>💰</span>
            <span>Sell</span>

            <span>•</span>

            <span>♻️</span>
            <span>Reuse</span>
          </div>

        </div>

        {/* Right Side */}
        <div className="login-card">

          {/* Heading */}
          <div className="login-card-header">

            <div className="login-card-icon">
              👤
            </div>

            <h2>
              USER LOGIN
            </h2>

            <p>
              Login to your marketplace account
            </p>

          </div>

          {/* Error / Message */}
          {message && (
            <div className="login-message">
              ⚠️ {message}
            </div>
          )}

          {accountNotFound && (
            <div className="account-not-found">
              <Link to="/register">
                Register Now →
              </Link>
            </div>
          )}

          {/* Login Form */}
          <form
            className="login-form"
            onSubmit={handleLogin}
          >

            <div className="form-group">

              <label>Email Address</label>

              <div className="input-wrapper">
                <span>📧</span>

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                />
              </div>

            </div>

            <div className="form-group">

              <label>Password</label>

              <div className="input-wrapper">
                <span>🔒</span>

                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                />
              </div>

            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="login-spinner"></span>
                  Checking...
                </>
              ) : (
                <>
                  <span>
                    🚀
                  </span>

                  LOGIN
                </>
              )}

            </button>

          </form>

          {/* User Register */}
          <div className="register-section">

            <span>Don't have an account?</span>

            <Link to="/register">
              Create Account
            </Link>

          </div>

          {/* Back */}
          <button
            type="button"
            className="back-home"
            onClick={() => navigate("/")}
          >
            ← Back to Marketplace
          </button>

        </div>
      </div>
    </div>
  );
}

export default Login;
