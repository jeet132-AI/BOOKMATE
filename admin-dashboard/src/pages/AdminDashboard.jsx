import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../components/AdminPanels.css";

function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Admin login required");
        setLoading(false);
        return;
      }

      try {
        const [productsResponse, usersResponse] =
          await Promise.all([
            fetch("http://localhost:5000/api/admin/products", {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),

            fetch("http://localhost:5000/api/admin/users", {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),
          ]);

        const productsData =
          await productsResponse.json();

        const usersData =
          await usersResponse.json();

        if (!productsResponse.ok) {
          setMessage(
            productsData.message ||
              "Unable to load products"
          );
          return;
        }

        if (!usersResponse.ok) {
          setMessage(
            usersData.message ||
              "Unable to load users"
          );
          return;
        }

        setProducts(productsData.products || []);
        setUsers(usersData.users || []);
      } catch (error) {
        console.error(
          "Dashboard error:",
          error
        );

        setMessage(
          "Unable to connect to server"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const totalProducts = products.length;

  const pendingProducts = products.filter(
    (product) =>
      product.status === "pending"
  ).length;

  const approvedProducts = products.filter(
    (product) =>
      product.status === "approved"
  ).length;

  const rejectedProducts = products.filter(
    (product) =>
      product.status === "rejected"
  ).length;

  const totalUsers = users.length;

  const adminUsers = users.filter(
    (user) =>
      user.role === "admin"
  ).length;

  const normalUsers = users.filter(
    (user) =>
      user.role === "user"
  ).length;

  const stats = [
    {
      icon: "👥",
      label: "TOTAL USERS",
      value: totalUsers,
      to: "/users",
    },
    {
      icon: "👤",
      label: "NORMAL USERS",
      value: normalUsers,
      to: "/users",
    },
    {
      icon: "🛡️",
      label: "ADMIN USERS",
      value: adminUsers,
      to: "/users",
    },
    {
      icon: "📚",
      label: "TOTAL PRODUCTS",
      value: totalProducts,
      to: "/products",
    },
    {
      icon: "⏳",
      label: "PENDING",
      value: pendingProducts,
      to: "/products/pending",
    },
    {
      icon: "✅",
      label: "APPROVED",
      value: approvedProducts,
      to: "/products",
    },
    {
      icon: "❌",
      label: "REJECTED",
      value: rejectedProducts,
      to: "/products",
    },
  ];

  const sections = [
    {
      icon: "⏳",
      label: "PENDING PRODUCTS",
      desc: "Approve or reject new listings",
      to: "/products/pending",
    },
    {
      icon: "📦",
      label: "ORDERS",
      desc: "Confirm, ship and deliver orders",
      to: "/orders",
    },
    {
      icon: "🚚",
      label: "SHIPPING",
      desc: "Couriers, tracking and delivery",
      to: "/shipping",
    },
    {
      icon: "💰",
      label: "PAYOUTS",
      desc: "Pay sellers after delivery",
      to: "/payouts",
    },
    {
      icon: "💳",
      label: "PAYMENTS",
      desc: "Monitor buyer payments",
      to: "/payments",
    },
    {
      icon: "⭐",
      label: "REVIEWS",
      desc: "Buyer ratings and reports",
      to: "/reviews",
    },
    {
      icon: "🗂️",
      label: "CATEGORIES",
      desc: "Book categories and status",
      to: "/categories",
    },
    {
      icon: "📊",
      label: "REPORTS",
      desc: "Performance and abuse reports",
      to: "/reports",
    },
    {
      icon: "⚙️",
      label: "PRICING",
      desc: "Fees, limits and delivery charge",
      to: "/pricing",
    },
  ];

  return (
    <main className="ap-page">
      <section className="ap-header">
        <div className="ap-header-icon">🏠</div>

        <p className="ap-label">
          ADMIN CONTROL CENTER
        </p>

        <h1>
          Admin <span>Dashboard</span>
        </h1>

        <p>
          Manage users, books and marketplace
          activity from one place.
        </p>

        <div className="ap-header-line"></div>
      </section>

      {message && (
        <div className="ap-message">
          <span>⚠️</span>
          {message}
        </div>
      )}

      {loading ? (
        <div className="ap-loading">
          <div className="ap-spinner"></div>
          <h2>
            Loading Admin Dashboard...
          </h2>
          <p>
            Fetching marketplace information
          </p>
        </div>
      ) : (
        <>
          <section className="ap-summary">
            {stats.map((stat) => (
              <Link
                key={stat.label}
                to={stat.to}
                className="ap-stat-link"
              >
                <div className="ap-stat">
                  <span>{stat.icon}</span>
                  <small>{stat.label}</small>
                  <strong>{stat.value}</strong>
                </div>
              </Link>
            ))}
          </section>

          <h2 className="ap-section-title">
            Management Sections
          </h2>

          <section className="ap-summary">
            {sections.map((section) => (
              <Link
                key={section.label}
                to={section.to}
                className="ap-stat-link"
              >
                <div className="ap-stat">
                  <span>{section.icon}</span>
                  <small>{section.label}</small>
                  <strong
                    style={{ fontSize: "0.85rem" }}
                  >
                    {section.desc}
                  </strong>
                </div>
              </Link>
            ))}
          </section>
        </>
      )}
    </main>
  );
}

export default AdminDashboard;