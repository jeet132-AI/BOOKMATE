import { useEffect, useState } from "react";
import "./AdminUsers.css";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] =
    useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Admin login required");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:5000/api/admin/users",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setMessage(data.message || "Unable to load users");
          return;
        }

        setUsers(data.users || []);
      } catch (error) {
        console.error("Users error:", error);
        setMessage("Unable to connect to server");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const searchText = search.toLowerCase();

    const userName = (user.name || "").toLowerCase();
    const userEmail = (user.email || "").toLowerCase();

    const matchesSearch =
      userName.includes(searchText) ||
      userEmail.includes(searchText);

    const matchesRole =
      roleFilter === "All" ||
      user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Selected user for the name-button details panel.
  // Defaults to the first visible user.
  const selectedUser =
    filteredUsers.find(
      (user) => user.id === selectedUserId
    ) ||
    filteredUsers[0] ||
    null;

  const totalUsers = users.length;
  const normalUsers = users.filter(
    (user) => user.role === "user"
  ).length;
  const adminUsers = users.filter(
    (user) => user.role === "admin"
  ).length;

  return (
    <main className="admin-users-page">

      {/* Background Animation */}
      <div className="users-bg users-bg-one"></div>
      <div className="users-bg users-bg-two"></div>
      <div className="users-bg users-bg-three"></div>

      {/* Header */}
      <section className="users-header">
        <div className="users-header-icon">
          👥
        </div>

        <div>
          <p className="users-label">
            ADMIN CONTROL CENTER
          </p>

          <h1>
            User <span>Management</span>
          </h1>

          <p className="users-description">
            Manage registered users of USED BOOK MARKET.
          </p>
        </div>
      </section>

      {/* Message */}
      {message && (
        <div className="users-message">
          <span>⚠️</span>
          {message}
        </div>
      )}

      {/* Statistics */}
      {!loading && !message && (
        <section className="users-statistics">

          <div className="user-stat-card total-stat">
            <div className="stat-icon">
              👥
            </div>

            <div>
              <p>Total Users</p>
              <h2>{totalUsers}</h2>
            </div>

            <span className="stat-decoration">
              👤
            </span>
          </div>

          <div className="user-stat-card normal-stat">
            <div className="stat-icon">
              👤
            </div>

            <div>
              <p>Normal Users</p>
              <h2>{normalUsers}</h2>
            </div>

            <span className="stat-decoration">
              📚
            </span>
          </div>

          <div className="user-stat-card admin-stat">
            <div className="stat-icon">
              🛡️
            </div>

            <div>
              <p>Admin Users</p>
              <h2>{adminUsers}</h2>
            </div>

            <span className="stat-decoration">
              ⚙️
            </span>
          </div>

        </section>
      )}

      {/* Search & Filter */}
      {!loading && (
        <section className="users-controls">

          <div className="controls-heading">
            <div>
              <span>USER DIRECTORY</span>
              <h2>🔎 Find Users</h2>
            </div>

            <div className="user-count-badge">
              {filteredUsers.length} USERS
            </div>
          </div>

          <div className="controls-row">

            <div className="search-box">
              <span>🔍</span>

              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

              {search && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => setSearch("")}
                >
                  ×
                </button>
              )}
            </div>

            <div className="role-filter">
              <label htmlFor="role">
                Role
              </label>

              <select
                id="role"
                value={roleFilter}
                onChange={(e) =>
                  setRoleFilter(e.target.value)
                }
              >
                <option value="All">
                  All Users
                </option>

                <option value="user">
                  Normal Users
                </option>

                <option value="admin">
                  Admin Users
                </option>
              </select>
            </div>

            <button
              type="button"
              className="clear-filter-button"
              onClick={() => {
                setSearch("");
                setRoleFilter("All");
              }}
            >
              ↻ Reset
            </button>

          </div>
        </section>
      )}

      {/* User Table */}
      <section className="users-table-section">

        <div className="table-heading">
          <div>
            <span>REGISTERED ACCOUNTS</span>
            <h2>👤 All Users</h2>
          </div>

          {!loading && (
            <p>
              Showing{" "}
              <strong>{filteredUsers.length}</strong>{" "}
              of{" "}
              <strong>{totalUsers}</strong>
            </p>
          )}
        </div>

        {loading ? (
          <div className="users-loading">
            <div className="users-loader">
              👥
            </div>

            <h2>Loading Users...</h2>

            <p>
              Fetching registered user information
            </p>
          </div>
        ) : filteredUsers.length > 0 ? (

          <>
            {/* Name buttons — 5 per row, click to see details */}
            <div className="user-name-grid">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className={
                    selectedUser?.id === user.id
                      ? "user-name-btn selected"
                      : "user-name-btn"
                  }
                  onClick={() =>
                    setSelectedUserId(user.id)
                  }
                  title={`${user.name} (${user.email})`}
                  aria-label={`User ${user.name} details`}
                >
                  {user.name || `User #${user.id}`}
                </button>
              ))}
            </div>

            {/* Selected user details */}
            {selectedUser && (
              <div className="user-details-panel">
                <div className="user-details-panel-heading">
                  <strong>
                    👤 {selectedUser.name}
                  </strong>

                  <span
                    className={`role-badge ${
                      selectedUser.role === "admin"
                        ? "admin-role"
                        : "user-role"
                    }`}
                  >
                    {selectedUser.role === "admin"
                      ? "🛡️ Admin"
                      : "👤 User"}
                  </span>
                </div>

                <div className="user-details-grid">
                  <div>
                    <small>ID</small>
                    <strong>
                      #{selectedUser.id}
                    </strong>
                  </div>
                  <div>
                    <small>NAME</small>
                    <strong>
                      {selectedUser.name}
                    </strong>
                  </div>
                  <div>
                    <small>EMAIL</small>
                    <strong>
                      {selectedUser.email}
                    </strong>
                  </div>
                  <div>
                    <small>ROLE</small>
                    <strong>
                      {selectedUser.role}
                    </strong>
                  </div>
                  <div>
                    <small>CREATED AT</small>
                    <strong>
                      {selectedUser.created_at
                        ? new Date(
                            selectedUser.created_at
                          ).toLocaleString()
                        : "N/A"}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </>

        ) : (

          <div className="no-users">
            <div className="no-users-icon">
              🔍
            </div>

            <h2>No Users Found</h2>

            <p>
              No registered users match your current
              search or filter.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setRoleFilter("All");
              }}
            >
              Clear Filters
            </button>
          </div>

        )}

      </section>

      {/* Footer */}
      <section className="users-footer">

        <div className="footer-users-icon">
          👥
        </div>

        <div>
          <h2>
            USED BOOK MARKET
          </h2>

          <p>
            User management control panel
          </p>
        </div>

        <div className="footer-status">
          <span></span>
          System Online
        </div>

      </section>

    </main>
  );
}

export default AdminUsers;