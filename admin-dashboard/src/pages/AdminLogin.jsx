import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";

function AdminLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message);
        return;
      }

      if (data.user.role !== "admin") {
        setMessage(
          "Admin access required. User accounts cannot sign in here."
        );
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      navigate("/");
    } catch (error) {
      setMessage("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-icon">
          🛡️
        </div>

        <h1>
          Admin <span>Login</span>
        </h1>

        <p className="admin-login-subtitle">
          USED BOOK MARKET • CONTROL CENTER
        </p>

        <form onSubmit={handleSubmit}>
          <div className="admin-login-field">
            <label htmlFor="admin-email">
              ADMIN EMAIL
            </label>

            <input
              id="admin-email"
              type="email"
              name="email"
              placeholder="Admin email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="admin-login-field">
            <label htmlFor="admin-password">
              PASSWORD
            </label>

            <input
              id="admin-password"
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="admin-login-button"
            disabled={loading}
          >
            {loading
              ? "Verifying..."
              : "🔐 Admin Login"}
          </button>
        </form>

        {message && (
          <p className="admin-login-message">
            {message}
          </p>
        )}

        <p className="admin-login-footer">
          RESTRICTED AREA • AUTHORIZED ONLY
        </p>
      </div>
    </main>
  );
}

export default AdminLogin;
