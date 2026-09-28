import { useEffect, useState } from "react";
import "../components/AdminPanels.css";

function AdminReports() {
  const [tab, setTab] = useState("performance");

  // ---------- Performance state ----------
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [period, setPeriod] = useState("monthly");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // ---------- Abuse-report state (unchanged flow) ----------
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const authHeader = () => {
    const token = localStorage.getItem("token");
    return token
      ? { Authorization: `Bearer ${token}` }
      : null;
  };

  // ================= PERFORMANCE =================

  const fetchStats = async (overrides = {}) => {
    const headers = authHeader();

    if (!headers) {
      setMessage("Admin login required");
      setStatsLoading(false);
      return;
    }

    try {
      setStatsLoading(true);

      const params = new URLSearchParams({
        period: overrides.period ?? period,
        ...(overrides.from ?? fromDate
          ? { from: overrides.from ?? fromDate }
          : {}),
        ...(overrides.to ?? toDate
          ? { to: overrides.to ?? toDate }
          : {}),
        ...((overrides.category ?? categoryFilter) !==
        "All"
          ? {
              category:
                overrides.category ??
                categoryFilter,
            }
          : {}),
      });

      const response = await fetch(
        `http://localhost:5000/api/admin/reports/stats?${params.toString()}`,
        {
          method: "GET",
          headers,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Unable to load performance stats"
        );
        return;
      }

      setStats(data);
      setMessage("");
    } catch (error) {
      console.error(
        "Performance stats error:",
        error
      );

      setMessage(
        "Unable to connect to server"
      );
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchReports();
  }, []);

  const handleApplyFilters = () => {
    fetchStats();
  };

  const handleResetFilters = () => {
    setPeriod("monthly");
    setFromDate("");
    setToDate("");
    setCategoryFilter("All");
    fetchStats({
      period: "monthly",
      from: "",
      to: "",
      category: "All",
    });
  };

  const handleExportCsv = () => {
    if (!stats) return;

    const lines = [
      "USED BOOK MARKET — PERFORMANCE REPORT",
      `Period,${stats.period}`,
      `From,${stats.filters.from || "-"}`,
      `To,${stats.filters.to || "-"}`,
      `Category,${stats.filters.category}`,
      "",
      "TOTALS",
      "Metric,Value",
      `Total Sales (Rs),${stats.totals.total_sales}`,
      `Total Orders,${stats.totals.total_orders}`,
      `Delivered Orders,${stats.totals.delivered_orders}`,
      `Platform Earnings (Rs),${stats.totals.platform_earnings}`,
      `Books Listed,${stats.totals.books_listed}`,
      `Books Sold,${stats.totals.books_sold}`,
      `Total Users,${stats.totals.total_users}`,
      `Total Sellers,${stats.totals.total_sellers}`,
      `Payouts Paid (Rs),${stats.totals.payouts_paid}`,
      `Payouts Pending (Rs),${stats.totals.payouts_pending}`,
      `Payouts Failed (Rs),${stats.totals.payouts_failed}`,
      "",
      "SALES BY CATEGORY",
      "Category,Orders,Revenue (Rs)",
      ...stats.sales_by_category.map(
        (row) =>
          `"${row.category}",${row.orders},${row.revenue}`
      ),
      "",
      "TIMESERIES",
      "Label,Orders,Revenue (Rs)",
      ...stats.timeseries.map(
        (row) =>
          `${row.label},${row.orders},${row.revenue}`
      ),
    ];

    const blob = new Blob(
      [lines.join("\n")],
      { type: "text/csv" }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `marketplace-report-${stats.period}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totals = stats?.totals;
  const maxSeriesRevenue = Math.max(
    0,
    ...(stats?.timeseries.map((row) =>
      Number(row.revenue)
    ) || [0])
  );
  const maxCategoryRevenue = Math.max(
    0,
    ...(stats?.sales_by_category.map((row) =>
      Number(row.revenue)
    ) || [0])
  );
  const categoryOptions = [
    "All",
    ...(stats?.sales_by_category.map(
      (row) => row.category
    ) || []),
  ];

  // ================= ABUSE REPORTS =================

  const fetchReports = async () => {
    const headers = authHeader();

    if (!headers) {
      setMessage("Admin login required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/admin/reports",
        {
          method: "GET",
          headers,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Unable to load reports"
        );
        return;
      }

      setReports(data.reports || []);
      setMessage("");
    } catch (error) {
      console.error(
        "Admin reports error:",
        error
      );

      setMessage(
        "Unable to connect to server"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    id,
    status
  ) => {
    const headers = authHeader();

    if (!headers) {
      setMessage("Admin login required");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/reports/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: JSON.stringify({
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Unable to update report"
        );
        return;
      }

      setMessage(
        "Report status updated successfully."
      );

      await fetchReports();
    } catch (error) {
      console.error(
        "Update report error:",
        error
      );

      setMessage(
        "Unable to connect to server"
      );
    }
  };

  const filteredReports =
    reports.filter((report) => {
      const searchText =
        search.toLowerCase();

      const matchesSearch =
        String(report.id)
          .includes(searchText) ||
        (report.reporter_name || "")
          .toLowerCase()
          .includes(searchText) ||
        (report.reporter_email || "")
          .toLowerCase()
          .includes(searchText) ||
        (report.product_title || "")
          .toLowerCase()
          .includes(searchText) ||
        (report.reason || "")
          .toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "All" ||
        report.status ===
          statusFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesStatus
      );
    });

  const statCards = totals
    ? [
        {
          icon: "📈",
          label: "TOTAL SALES",
          value: `₹${Number(
            totals.total_sales
          ).toFixed(2)}`,
        },
        {
          icon: "📦",
          label: "TOTAL ORDERS",
          value: totals.total_orders,
        },
        {
          icon: "📚",
          label: "BOOKS LISTED / SOLD",
          value: `${totals.books_listed} / ${totals.books_sold}`,
        },
        {
          icon: "👤",
          label: "USERS / SELLERS",
          value: `${totals.total_users} / ${totals.total_sellers}`,
        },
        {
          icon: "💰",
          label: "PLATFORM REVENUE",
          value: `₹${Number(
            totals.platform_earnings
          ).toFixed(2)}`,
        },
        {
          icon: "💸",
          label: "PAYOUTS PAID",
          value: `₹${Number(
            totals.payouts_paid
          ).toFixed(2)}`,
        },
        {
          icon: "⏳",
          label: "PAYOUTS PENDING",
          value: `₹${Number(
            totals.payouts_pending
          ).toFixed(2)}`,
        },
        {
          icon: "✅",
          label: "DELIVERED ORDERS",
          value: totals.delivered_orders,
        },
      ]
    : [];

  return (
    <main className="ap-page">
      <section className="ap-header">
        <div className="ap-header-icon">📊</div>

        <p className="ap-label">
          ADMIN CONTROL CENTER
        </p>

        <h1>
          Marketplace <span>Reports</span>
        </h1>

        <p>
          Marketplace performance overview:
          Users → Books → Orders → Revenue →
          Payouts.
        </p>

        <div className="ap-header-line"></div>
      </section>

      <div className="ap-tabs">
        <button
          type="button"
          className="ap-btn ap-btn-primary"
          onClick={() => setTab("performance")}
          disabled={tab === "performance"}
        >
          📊 Performance
        </button>

        <button
          type="button"
          className="ap-btn ap-btn-ghost"
          onClick={() => setTab("abuse")}
          disabled={tab === "abuse"}
        >
          🚨 Abuse Reports (
          {reports.length})
        </button>
      </div>

      {message && (
        <div className="ap-message">{message}</div>
      )}

      {tab === "performance" ? (
        <div>
          <h2 className="ap-section-title">
            Performance Dashboard
          </h2>

          <section className="ap-toolbar">
            <label>
              Period{" "}
              <select
                value={period}
                onChange={(e) =>
                  setPeriod(e.target.value)
                }
              >
                <option value="daily">
                  Daily
                </option>
                <option value="monthly">
                  Monthly
                </option>
                <option value="yearly">
                  Yearly
                </option>
              </select>
            </label>

            <label>
              From{" "}
              <input
                type="date"
                value={fromDate}
                onChange={(e) =>
                  setFromDate(e.target.value)
                }
              />
            </label>

            <label>
              To{" "}
              <input
                type="date"
                value={toDate}
                onChange={(e) =>
                  setToDate(e.target.value)
                }
              />
            </label>

            <label>
              Category{" "}
              <select
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(
                    e.target.value
                  )
                }
              >
                {categoryOptions.map(
                  (option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option}
                    </option>
                  )
                )}
              </select>
            </label>

            <button
              type="button"
              className="ap-btn ap-btn-primary"
              onClick={handleApplyFilters}
            >
              Apply
            </button>

            <button
              type="button"
              className="ap-btn ap-btn-ghost"
              onClick={handleResetFilters}
            >
              Reset
            </button>

            <button
              type="button"
              className="ap-btn ap-btn-success"
              onClick={handleExportCsv}
              disabled={!stats}
            >
              📥 Export CSV
            </button>
          </section>

          {statsLoading ? (
            <div className="ap-loading">
              <div className="ap-spinner"></div>
              <h2>
                Loading performance stats...
              </h2>
            </div>
          ) : !stats ? (
            <div className="ap-empty">
              <div className="ap-empty-icon">
                📊
              </div>
              <h2>No stats available</h2>
            </div>
          ) : (
            <>
              <section className="ap-summary">
                {statCards.map((card) => (
                  <div
                    key={card.label}
                    className="ap-stat"
                  >
                    <span>{card.icon}</span>
                    <small>{card.label}</small>
                    <strong>
                      {card.value}
                    </strong>
                  </div>
                ))}
              </section>

              <h3 className="ap-section-title">
                Sales by Category
              </h3>

              {stats.sales_by_category.length ===
              0 ? (
                <div className="ap-empty">
                  <p>
                    No category sales in this
                    range.
                  </p>
                </div>
              ) : (
                <div className="ap-table-wrapper">
                  <table className="ap-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Orders</th>
                        <th>Revenue (₹)</th>
                        <th>Share</th>
                      </tr>
                    </thead>

                    <tbody>
                      {stats.sales_by_category.map(
                        (row) => (
                          <tr
                            key={row.category}
                          >
                            <td>
                              <strong>
                                {row.category}
                              </strong>
                            </td>
                            <td>
                              {row.orders}
                            </td>
                            <td>
                              <strong>
                                ₹
                                {Number(
                                  row.revenue
                                ).toFixed(2)}
                              </strong>
                            </td>
                            <td
                              style={{
                                minWidth: "140px",
                              }}
                            >
                              <div
                                style={{
                                  height: "10px",
                                  borderRadius: "5px",
                                  background:
                                    "#14b8a6",
                                  width: `${
                                    maxCategoryRevenue
                                      ? (Number(
                                          row.revenue
                                        ) /
                                          maxCategoryRevenue) *
                                        100
                                      : 0
                                  }%`,
                                }}
                              ></div>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <h3 className="ap-section-title">
                {period === "daily"
                  ? "Daily"
                  : period === "yearly"
                    ? "Yearly"
                    : "Monthly"}{" "}
                Trend
              </h3>

              {stats.timeseries.length ===
              0 ? (
                <div className="ap-empty">
                  <p>
                    No orders in this range.
                  </p>
                </div>
              ) : (
                <div className="ap-table-wrapper">
                  <table className="ap-table">
                    <thead>
                      <tr>
                        <th>
                          {period === "daily"
                            ? "Date"
                            : period ===
                                "yearly"
                              ? "Year"
                              : "Month"}
                        </th>
                        <th>Orders</th>
                        <th>Revenue (₹)</th>
                        <th>Trend</th>
                      </tr>
                    </thead>

                    <tbody>
                      {stats.timeseries.map(
                        (row) => (
                          <tr key={row.label}>
                            <td>
                              <strong>
                                {row.label}
                              </strong>
                            </td>
                            <td>
                              {row.orders}
                            </td>
                            <td>
                              <strong>
                                ₹
                                {Number(
                                  row.revenue
                                ).toFixed(2)}
                              </strong>
                            </td>
                            <td
                              style={{
                                minWidth: "140px",
                              }}
                            >
                              <div
                                style={{
                                  height: "10px",
                                  borderRadius: "5px",
                                  background:
                                    "#f97316",
                                  width: `${
                                    maxSeriesRevenue
                                      ? (Number(
                                          row.revenue
                                        ) /
                                          maxSeriesRevenue) *
                                        100
                                      : 0
                                  }%`,
                                }}
                              ></div>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div>
          <h2 className="ap-section-title">
            Abuse Reports
          </h2>

          <p
            style={{
              maxWidth: "1200px",
              margin: "0 auto 14px",
              color: "#7d93a0",
              fontSize: "0.85rem",
            }}
          >
            Review reports submitted by
            users about book listings.
          </p>

          <section className="ap-toolbar">
            <div className="ap-search-box">
              <span>🔍</span>

              <input
                type="text"
                placeholder="Search report, user, book or reason..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </div>

            <button
              type="button"
              className="ap-btn ap-btn-ghost"
              onClick={() => setSearch("")}
            >
              Clear Search
            </button>

            <label>
              Status{" "}
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value
                  )
                }
              >
                <option value="All">
                  All
                </option>

                <option value="pending">
                  Pending
                </option>

                <option value="reviewed">
                  Reviewed
                </option>

                <option value="resolved">
                  Resolved
                </option>

                <option value="rejected">
                  Rejected
                </option>
              </select>
            </label>
          </section>

          <p
            style={{
              maxWidth: "1200px",
              margin: "0 auto 14px",
              color: "#7d93a0",
              fontSize: "0.85rem",
            }}
          >
            Showing{" "}
            <strong
              style={{ color: "#f1f5f9" }}
            >
              {filteredReports.length}
            </strong>{" "}
            of{" "}
            <strong
              style={{ color: "#f1f5f9" }}
            >
              {reports.length}
            </strong>{" "}
            reports
          </p>

          {loading ? (
            <div className="ap-loading">
              <div className="ap-spinner"></div>
              <h2>Loading reports...</h2>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="ap-empty">
              <div className="ap-empty-icon">
                📭
              </div>
              <h2>No reports found</h2>
            </div>
          ) : (
            <div className="ap-table-wrapper">
              <table className="ap-table">
                <thead>
                  <tr>
                    <th>Report</th>
                    <th>Reporter</th>
                    <th>Book</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredReports.map(
                    (report) => (
                      <tr key={report.id}>
                        <td>
                          <strong>
                            #{report.id}
                          </strong>
                          <small>
                            {report.description ||
                              "No description"}
                          </small>
                        </td>

                        <td>
                          <strong>
                            {report.reporter_name ||
                              "Unknown"}
                          </strong>
                          <small>
                            {report.reporter_email ||
                              ""}
                          </small>
                        </td>

                        <td>
                          {report.product_title ||
                            "Product removed"}
                        </td>

                        <td>
                          <small>
                            {report.reason}
                          </small>
                        </td>

                        <td>
                          <span
                            className={`ap-badge ap-badge-${report.status}`}
                          >
                            {report.status}
                          </span>
                        </td>

                        <td>
                          <small>
                            {new Date(
                              report.created_at
                            ).toLocaleString()}
                          </small>
                        </td>

                        <td>
                          <div className="ap-actions">
                            <button
                              type="button"
                              className="ap-btn ap-btn-info ap-btn-sm"
                              onClick={() =>
                                handleUpdateStatus(
                                  report.id,
                                  "reviewed"
                                )
                              }
                            >
                              Reviewed
                            </button>

                            <button
                              type="button"
                              className="ap-btn ap-btn-success ap-btn-sm"
                              onClick={() =>
                                handleUpdateStatus(
                                  report.id,
                                  "resolved"
                                )
                              }
                            >
                              Resolve
                            </button>

                            <button
                              type="button"
                              className="ap-btn ap-btn-danger ap-btn-sm"
                              onClick={() =>
                                handleUpdateStatus(
                                  report.id,
                                  "rejected"
                                )
                              }
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default AdminReports;
