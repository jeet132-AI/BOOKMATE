import { useEffect, useState } from "react";
import "../components/AdminPanels.css";

function AdminPayouts() {
  const [payouts, setPayouts] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedPayoutId, setSelectedPayoutId] =
    useState(null);

  const fetchPayouts = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Admin login required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/admin/payouts",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Unable to load payouts"
        );
        return;
      }

      setPayouts(data.payouts || []);
      setMessage("");
    } catch (error) {
      console.error(
        "Admin payouts error:",
        error
      );

      setMessage(
        "Unable to connect to server"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const updatePayout = async (
    payout,
    payout_status,
    transaction_id
  ) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Admin login required");
      return;
    }

    try {
      setUpdatingId(payout.id);

      const response = await fetch(
        `http://localhost:5000/api/admin/payouts/${payout.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            payout_status,
            transaction_id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Unable to update payout"
        );
        return;
      }

      setPayouts((current) =>
        current.map((item) =>
          item.id === payout.id
            ? {
                ...item,
                payout_status,
                transaction_id:
                  transaction_id ||
                  item.transaction_id,
                paid_at:
                  payout_status === "paid"
                    ? item.paid_at ||
                      new Date().toISOString()
                    : item.paid_at,
              }
            : item
        )
      );

      setMessage(
        `Payout #${payout.id} marked as ${payout_status}. Seller notified.`
      );
    } catch (error) {
      console.error(
        "Update payout error:",
        error
      );

      setMessage(
        "Unable to connect to server"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkPaid = (payout) => {
    if (payout.order_status !== "delivered") {
      setMessage(
        `Payout #${payout.id} cannot be paid yet — order #${payout.order_id} is ${payout.order_status || "not delivered"}.`
      );
      return;
    }

    const transaction_id = window.prompt(
      `Pay ₹${payout.amount} to ${payout.seller_name || "seller"} (order #${payout.order_id}).\nEnter payout transaction / UTR reference:`,
      payout.transaction_id || ""
    );

    if (transaction_id === null) return;

    if (!transaction_id.trim()) {
      setMessage(
        "A transaction reference is required to mark a payout as paid."
      );
      return;
    }

    updatePayout(
      payout,
      "paid",
      transaction_id.trim()
    );
  };

  const handleMarkFailed = (payout) => {
    if (
      !window.confirm(
        `Mark payout #${payout.id} (₹${payout.amount} to ${payout.seller_name || "seller"}) as FAILED?`
      )
    )
      return;

    updatePayout(payout, "failed");
  };

  const filteredPayouts =
    payouts.filter((payout) => {
      const searchText =
        search.toLowerCase();

      const matchesSearch =
        String(payout.id)
          .includes(searchText) ||
        String(payout.order_id)
          .includes(searchText) ||
        (payout.seller_name || "")
          .toLowerCase()
          .includes(searchText) ||
        (payout.seller_email || "")
          .toLowerCase()
          .includes(searchText) ||
        (payout.product_title || "")
          .toLowerCase()
          .includes(searchText) ||
        (payout.transaction_id || "")
          .toLowerCase()
          .includes(searchText) ||
        (payout.buyer_transaction_id || "")
          .toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "All" ||
        payout.payout_status ===
          statusFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesStatus
      );
    });

  const sumBy = (status) =>
    payouts
      .filter(
        (payout) =>
          payout.payout_status === status
      )
      .reduce(
        (sum, payout) =>
          sum + Number(payout.amount || 0),
        0
      );

  const countBy = (status) =>
    payouts.filter(
      (payout) =>
        payout.payout_status === status
    ).length;

  // Selected payout for the ID-button details panel.
  // Defaults to the first visible payout.
  const selectedPayout =
    filteredPayouts.find(
      (payout) => payout.id === selectedPayoutId
    ) ||
    filteredPayouts[0] ||
    null;

  const badgeFor = (status) => {
    switch (status) {
      case "paid":
        return "ap-badge ap-badge-paid";
      case "failed":
        return "ap-badge ap-badge-failed";
      case "cancelled":
        return "ap-badge ap-badge-cancelled";
      case "processing":
        return "ap-badge ap-badge-processing";
      default:
        return "ap-badge ap-badge-pending";
    }
  };

  return (
    <main className="ap-page">
      <section className="ap-header">
        <div className="ap-header-icon">💰</div>

        <p className="ap-label">
          ADMIN CONTROL CENTER
        </p>

        <h1>
          Seller <span>Payouts</span>
        </h1>

        <p>
          Money going OUT to sellers after
          their books are sold and delivered
          — not money received from buyers.
        </p>

        <div className="ap-header-line"></div>
      </section>

      {message && (
        <div
          className={`ap-message ${
            message.includes("successfully")
              ? "success"
              : ""
          }`}
        >
          {message.includes("successfully")
            ? "✅ "
            : "⚠️ "}
          {message}
        </div>
      )}

      <section className="ap-toolbar">
        <div className="ap-search-box">
          <span>🔍</span>

          <input
            type="text"
            placeholder="Search payout, seller, book or transaction..."
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
          Clear
        </button>

        <label>
          Status{" "}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
          >
            <option value="All">
              All
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="processing">
              Processing
            </option>

            <option value="paid">
              Paid
            </option>

            <option value="failed">
              Failed
            </option>

            <option value="cancelled">
              Cancelled
            </option>
          </select>
        </label>
      </section>

      <section className="ap-summary">
        <div className="ap-stat">
          <span>⏳</span>
          <small>PENDING</small>
          <strong>
            ₹{sumBy("pending").toFixed(2)}
          </strong>
        </div>

        <div className="ap-stat">
          <span>✅</span>
          <small>PAID</small>
          <strong>
            ₹{sumBy("paid").toFixed(2)}
          </strong>
        </div>

        <div className="ap-stat">
          <span>❌</span>
          <small>FAILED</small>
          <strong>
            {countBy("failed")}
          </strong>
        </div>

        <div className="ap-stat">
          <span>📦</span>
          <small>SHOWING</small>
          <strong>
            {filteredPayouts.length} /{" "}
            {payouts.length}
          </strong>
        </div>
      </section>

      {loading ? (
        <div className="ap-loading">
          <div className="ap-spinner"></div>
          <h2>Loading payouts...</h2>
        </div>
      ) : filteredPayouts.length === 0 ? (
        <div className="ap-empty">
          <div className="ap-empty-icon">📭</div>
          <h2>No payouts found</h2>
          <p>
            Try changing your search or status
            filter.
          </p>
        </div>
      ) : (
        <>
          {/* Payout ID buttons — 5 per row */}
          <div className="id-btn-grid">
            {filteredPayouts.map((payout) => (
              <button
                key={payout.id}
                type="button"
                className={
                  selectedPayout?.id === payout.id
                    ? "id-btn selected"
                    : "id-btn"
                }
                onClick={() =>
                  setSelectedPayoutId(payout.id)
                }
                aria-label={`Payout ${payout.id} details`}
              >
                #{payout.id}
              </button>
            ))}
          </div>

          {/* Selected payout details */}
          {selectedPayout && (
            <div className="id-details-panel">
              <div className="id-details-panel-heading">
                <strong>
                  💰 Payout #
                  {selectedPayout.id} — Order #
                  {selectedPayout.order_id}
                </strong>

                <span
                  className={badgeFor(
                    selectedPayout.payout_status
                  )}
                >
                  {selectedPayout.payout_status}
                </span>
              </div>

              <div className="id-details-grid">
                <div>
                  <small>SELLER</small>
                  <strong>
                    {selectedPayout.seller_name ||
                      "Unknown"}
                  </strong>
                </div>
                <div>
                  <small>SOLD BOOK</small>
                  <strong>
                    {selectedPayout.product_title ||
                      "Book removed"}
                  </strong>
                </div>
                <div>
                  <small>AMOUNT</small>
                  <strong>
                    ₹{selectedPayout.amount}
                  </strong>
                </div>
                <div>
                  <small>BUYER PAYMENT REF</small>
                  <strong>
                    {selectedPayout.buyer_payment_method
                      ? `${selectedPayout.buyer_payment_method} • ${selectedPayout.buyer_payment_status || "pending"}`
                      : "—"}
                    {selectedPayout.buyer_transaction_id &&
                      ` • UTR ${selectedPayout.buyer_transaction_id}`}
                  </strong>
                </div>
                <div>
                  <small>PAYOUT TXN</small>
                  <strong>
                    {selectedPayout.transaction_id ||
                      "Not available"}
                  </strong>
                </div>
                <div>
                  <small>PAID AT</small>
                  <strong>
                    {selectedPayout.paid_at
                      ? new Date(
                          selectedPayout.paid_at
                        ).toLocaleString()
                      : "Not paid"}
                  </strong>
                </div>
              </div>

              <div className="id-details-actions">
                {(selectedPayout.payout_status ===
                  "pending" ||
                  selectedPayout.payout_status ===
                    "processing" ||
                  selectedPayout.payout_status ===
                    "failed") && (
                  <>
                    <button
                      type="button"
                      className="ap-btn ap-btn-success ap-btn-sm"
                      disabled={
                        updatingId ===
                        selectedPayout.id
                      }
                      onClick={() =>
                        handleMarkPaid(
                          selectedPayout
                        )
                      }
                      title={
                        selectedPayout.order_status !==
                        "delivered"
                          ? `Order is ${selectedPayout.order_status || "not delivered"} — payout unlocks after delivery`
                          : "Mark as paid"
                      }
                    >
                      {updatingId ===
                      selectedPayout.id
                        ? "Saving..."
                        : "✅ Paid"}
                    </button>

                    <button
                      type="button"
                      className="ap-btn ap-btn-danger ap-btn-sm"
                      disabled={
                        updatingId ===
                        selectedPayout.id
                      }
                      onClick={() =>
                        handleMarkFailed(
                          selectedPayout
                        )
                      }
                    >
                      ❌ Failed
                    </button>
                  </>
                )}

                {(selectedPayout.payout_status ===
                  "paid" ||
                  selectedPayout.payout_status ===
                    "cancelled") && (
                  <small>No action</small>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default AdminPayouts;
