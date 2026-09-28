import { Link } from "react-router-dom";
import { useState } from "react";
import useTheme from "../hooks/useTheme";
import "./Register.css";

function Register() {
  const { darkMode, toggleTheme } = useTheme();
  const [lampOn, setLampOn] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const [accountExists, setAccountExists] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLampToggle = () => {
    setLampOn((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setAccountExists(false);

    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setMessage("Password must be at least 6 characters");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Registration failed");
        if (response.status === 409) {
          setAccountExists(true);
        }
        return;
      }

      setMessage("Registration successful! Please login.");
      setAccountExists(false);

      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Registration error:", error);
      setMessage("Unable to connect to server");
    }
  };

  return (
    <main className="register-scene">
      <button
        type="button"
        className="page-theme-toggle"
        onClick={toggleTheme}
        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        aria-pressed={darkMode}
      >
        {darkMode ? "☀️ Light" : "🌙 Dark"}
      </button>

      {/* Background decoration */}
      <div className="register-glow glow-one"></div>
      <div className="register-glow glow-two"></div>

      {/* Page title */}
      <div className="register-title">
        <p>📚 USED BOOK MARKET</p>

        <h1>
          Create Your <span>Account</span>
        </h1>

        <span>
          Turn on the lamp to start your journey.
        </span>
      </div>

      {/* Main container */}
      <div className="register-container">

        {/* ================= LAMP ================= */}

        <div className="lamp-section">

          <div
            className={`lamp-area ${
              lampOn ? "lamp-on" : ""
            }`}
            onClick={handleLampToggle}
          >

            <div className="lamp">

              <div className="shade">

                <div className="eye left-eye"></div>
                <div className="eye right-eye"></div>

                <div className="mouth"></div>

              </div>

              <div className="light"></div>

              <div className="stand"></div>

              <div className="base"></div>

            </div>

          </div>

          {/* Toggle button */}

          <button
            type="button"
            className="lamp-toggle"
            onClick={handleLampToggle}
          >
            {lampOn
              ? "🌙 Turn OFF"
              : "💡 Turn ON"}
          </button>

          <p className="lamp-status">
            {lampOn
              ? "Light is ON — Create your account"
              : "Turn ON the lamp to register"}
          </p>

        </div>


        {/* ================= REGISTER CARD ================= */}

        <section
          className={`register-card ${
            lampOn ? "register-card-show" : ""
          }`}
        >

          <div className="register-icon">
            📚
          </div>

          <h2>
            Create Account
          </h2>

          <p className="register-description">
            Register to buy and sell used books.
          </p>

          <form
            className="register-form"
            onSubmit={handleSubmit}
          >

            {/* Name */}

            <div className="register-input-group">
              <span>👤</span>

              <input
                type="text"
                name="name"
                placeholder="Full name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>


            {/* Email */}

            <div className="register-input-group">
              <span>📧</span>

              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>


            {/* Password */}

            <div className="register-input-group">
              <span>🔒</span>

              <input
                type="password"
                name="password"
                placeholder="Password (min 6 characters)"
                value={formData.password}
                onChange={handleChange}
                minLength={6}
                required
              />
            </div>


            {/* Confirm Password */}

            <div className="register-input-group">
              <span>🔐</span>

              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>


            {/* Register button */}

            <button
              type="submit"
              className="register-button"
            >
              Create Account
              <span>→</span>
            </button>

          </form>


          {/* Message */}

          {message && (
            <p
              className={`register-message ${
                message.includes("successful")
                  ? "register-success"
                  : "register-error"
              }`}
            >
              {message}
            </p>
          )}
          {accountExists && (
            <p className="register-existing-account">
              <Link to="/login">
                  Login Now →
              </Link>
            </p>
          )}

          {/* Login */}

          <p className="login-link">
            Already have an account?{" "}

            <Link to="/login">
              Login
            </Link>
          </p>

        </section>

      </div>

    </main>
  );
}

export default Register;