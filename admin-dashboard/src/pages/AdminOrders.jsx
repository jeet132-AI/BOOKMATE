import { useEffect, useState } from "react";
import "./AdminOrders.css";

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedOrderId, setSelectedOrderId] =
    useState(null);

  const fetchOrders = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Admin login required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/admin/orders",
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
          data.message || "Unable to load orders"
        );
        return;
      }

      setOrders(data.orders || []);
      setMessage("");
    } catch (error) {
      console.error("Admin orders error:", error);

      setMessage(
        "Unable to connect to server"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusUpdate = async (orderId, nextStatus) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Admin login required");
      return;
    }

    const confirmText =
      nextStatus === "shipped"
        ? `Ship order #${orderId}? User will see SHIPPED and it moves to Shipping list.`
        : `Update order #${orderId} to ${nextStatus}?`;
    if (!window.confirm(confirmText)) return;

    try {
      setUpdatingId(orderId);
      const response = await fetch(
        `http://localhost:5000/api/admin/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: nextStatus }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message || "Unable to update order status");
        return;
      }
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? { ...order, status: nextStatus } : order
        )
      );
      setMessage(
        nextStatus === "shipped"
          ? `Order #${orderId} shipped. User now sees SHIPPED. Handle further in Shipping list.`
          : `Order #${orderId} updated to ${nextStatus}.`
      );
    } catch (error) {
      console.error("Update order status error:", error);
      setMessage("Unable to connect to server");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleViewDetails = async (orderId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Admin login required");
      return;
    }

    try {
      setDetailLoading(true);
      setDetailOrder({ id: orderId, _loading: true });

      const response = await fetch(
        `http://localhost:5000/api/admin/orders/${orderId}`,
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
          data.message || "Unable to load order details"
        );
        setDetailOrder(null);
        return;
      }

      setDetailOrder(data.order || null);
    } catch (error) {
      console.error("Order details error:", error);
      setMessage("Unable to connect to server");
      setDetailOrder(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      String(order.id).includes(searchText) ||
      (order.product_title || "")
        .toLowerCase()
        .includes(searchText) ||
      (order.product_category || "")
        .toLowerCase()
        .includes(searchText) ||
      (order.product_class || "")
        .toLowerCase()
        .includes(searchText) ||
      (order.buyer_name || "")
        .toLowerCase()
        .includes(searchText) ||
      (order.buyer_email || "")
        .toLowerCase()
        .includes(searchText) ||
      (order.seller_name || "")
        .toLowerCase()
        .includes(searchText) ||
      (order.payment_method || "")
        .toLowerCase()
        .includes(searchText) ||
      (order.delivery_address || "")
        .toLowerCase()
        .includes(searchText);

    const matchesStatus =
      statusFilter === "All" ||
      order.status === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Selected order for the ID-button details panel.
  // Defaults to the first visible order.
  const selectedOrder =
    filteredOrders.find(
      (order) => order.id === selectedOrderId
    ) ||
    filteredOrders[0] ||
    null;

  const getStatusClass = (status) => {
    switch (status) {
      case "pending":
        return "admin-order-status pending";

      case "confirmed":
        return "admin-order-status confirmed";

      case "shipped":
        return "admin-order-status shipped";

      case "delivered":
        return "admin-order-status delivered";

      case "cancelled":
        return "admin-order-status cancelled";

      default:
        return "admin-order-status default";
    }
  };

  return (
    <main className="admin-orders-page">
      {/* BACKGROUND */}
      <div className="admin-orders-bg bg-one"></div>
      <div className="admin-orders-bg bg-two"></div>

      <div className="admin-orders-floating-book book-one">
        📦
      </div>

      <div className="admin-orders-floating-book book-two">
        📚
      </div>

      {/* HEADER */}
      <section className="admin-orders-header">
        <div className="admin-orders-icon">
          📦
        </div>

        <p className="admin-orders-label">
          ADMIN CONTROL CENTER
        </p>

        <h1>
          Order <span>Management</span>
        </h1>

        <p>
          Manage buyer orders, sellers, pricing and
          order status from one place.
        </p>

        <div className="admin-orders-header-line"></div>
      </section>

      {/* MESSAGE */}
      {message && (
        <div className="admin-orders-message">
          ⚠️ {message}
        </div>
      )}

      {/* TOOLBAR */}
      <section className="admin-orders-toolbar">
        <div className="admin-orders-toolbar-heading">
          <div className="toolbar-icon">
            🔎
          </div>

          <div>
            <small>ORDER DATABASE</small>
            <h2>All Orders</h2>
          </div>
        </div>

        <div className="admin-orders-controls">
          <div className="admin-search-box">
            <span>🔍</span>

            <input
              type="text"
              placeholder="Search order, buyer, seller or book..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>

          <button
            type="button"
            className="admin-clear-button"
            onClick={() => setSearch("")}
          >
            Clear
          </button>

          <div className="admin-status-filter">
            <label htmlFor="admin-order-status">
              Status
            </label>

            <select
              id="admin-order-status"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
            >
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">
                Confirmed
              </option>
              <option value="Shipped">
                Shipped
              </option>
              <option value="Delivered">
                Delivered
              </option>
              <option value="Cancelled">
                Cancelled
              </option>
            </select>
          </div>
        </div>
      </section>

      {/* RESULT SUMMARY */}
      <section className="admin-orders-summary">
        <div className="summary-item">
          <span className="summary-icon">
            📦
          </span>

          <div>
            <small>TOTAL ORDERS</small>
            <strong>{orders.length}</strong>
          </div>
        </div>

        <div className="summary-item">
          <span className="summary-icon teal">
            🔎
          </span>

          <div>
            <small>SHOWING</small>
            <strong>
              {filteredOrders.length}
            </strong>
          </div>
        </div>

        <div className="summary-item">
          <span className="summary-icon orange">
            ⏳
          </span>

          <div>
            <small>PENDING</small>
            <strong>
              {
                orders.filter(
                  (order) =>
                    order.status === "pending"
                ).length
              }
            </strong>
          </div>
        </div>

        <div className="summary-item">
          <span className="summary-icon green">
            ✓
          </span>

          <div>
            <small>DELIVERED</small>
            <strong>
              {
                orders.filter(
                  (order) =>
                    order.status === "delivered"
                ).length
              }
            </strong>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="admin-orders-content">
        {loading ? (
          <div className="admin-orders-loading">
            <div className="admin-orders-spinner"></div>

            <h2>Loading Orders...</h2>

            <p>
              Fetching order information from the
              marketplace.
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="admin-orders-empty">
            <div className="empty-icon">
              📭
            </div>

            <p>NO ORDERS FOUND</p>

            <h2>
              No matching orders
            </h2>

            <span>
              Try changing your search or status
              filter.
            </span>
          </div>
        ) : (
          <>
            {/* Order ID buttons — 5 per row, click to see details */}
            <div className="order-id-grid">
              {filteredOrders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  className={
                    selectedOrder?.id === order.id
                      ? "order-id-btn selected"
                      : "order-id-btn"
                  }
                  onClick={() =>
                    setSelectedOrderId(order.id)
                  }
                  aria-label={`Order ${order.id} details`}
                >
                  #{order.id}
                </button>
              ))}
            </div>

            {/* Selected order details */}
            {selectedOrder && (
              <div className="order-details-panel">
                <div className="order-details-panel-heading">
                  <strong>
                    📦 Order #{selectedOrder.id} —{" "}
                    {selectedOrder.product_title ||
                      "Book"}
                  </strong>

                  <span
                    className={getStatusClass(
                      selectedOrder.status
                    )}
                  >
                    <span className="status-dot"></span>
                    {selectedOrder.status}
                  </span>
                </div>

                <div className="order-details-grid">
                  <div>
                    <small>BOOK</small>
                    <strong>
                      {selectedOrder.product_title ||
                        "Book"}
                    </strong>
                  </div>
                  <div>
                    <small>BUYER</small>
                    <strong>
                      {selectedOrder.buyer_name ||
                        "Buyer"}
                    </strong>
                  </div>
                  <div>
                    <small>SELLER</small>
                    <strong>
                      {selectedOrder.seller_name ||
                        "Seller"}
                    </strong>
                  </div>
                  <div>
                    <small>BUYER PRICE</small>
                    <strong>
                      ₹{selectedOrder.buyer_price}
                    </strong>
                  </div>
                  <div>
                    <small>PAYMENT</small>
                    <strong>
                      {selectedOrder.payment_method ||
                        "-"}
                      {selectedOrder.payment_status ===
                        "paid" && " • Paid"}
                      {selectedOrder.payment_status ===
                        "refunded" && " • Refunded"}
                    </strong>
                  </div>
                  <div>
                    <small>CREATED</small>
                    <strong>
                      {selectedOrder.created_at
                        ? new Date(
                            selectedOrder.created_at
                          ).toLocaleString()
                        : "N/A"}
                    </strong>
                  </div>
                </div>

                <div className="order-details-actions">
                  <button
                    type="button"
                    className="order-action-button view-button"
                    onClick={() =>
                      handleViewDetails(selectedOrder.id)
                    }
                  >
                    👀 Full Details
                  </button>
                  {selectedOrder.status ===
                    "pending" && (
                    <>
                      <button
                        type="button"
                        className="order-action-button confirm-button"
                        disabled={
                          updatingId ===
                          selectedOrder.id
                        }
                        onClick={() =>
                          handleStatusUpdate(
                            selectedOrder.id,
                            "confirmed"
                          )
                        }
                      >
                        ✓ Confirm
                      </button>
                      <button
                        type="button"
                        className="order-action-button cancel-button"
                        disabled={
                          updatingId ===
                          selectedOrder.id
                        }
                        onClick={() =>
                          handleStatusUpdate(
                            selectedOrder.id,
                            "cancelled"
                          )
                        }
                      >
                        ✕ Cancel
                      </button>
                    </>
                  )}
                  {selectedOrder.status ===
                    "confirmed" && (
                    <>
                      <button
                        type="button"
                        className="order-action-button ship-button"
                        disabled={
                          updatingId ===
                          selectedOrder.id
                        }
                        onClick={() =>
                          handleStatusUpdate(
                            selectedOrder.id,
                            "shipped"
                          )
                        }
                      >
                        {updatingId ===
                        selectedOrder.id
                          ? "Shipping..."
                          : "🚚 Ship Now"}
                      </button>
                      <button
                        type="button"
                        className="order-action-button cancel-button"
                        disabled={
                          updatingId ===
                          selectedOrder.id
                        }
                        onClick={() =>
                          handleStatusUpdate(
                            selectedOrder.id,
                            "cancelled"
                          )
                        }
                      >
                        ✕ Cancel
                      </button>
                    </>
                  )}
                  {selectedOrder.status ===
                    "shipped" && (
                    <>
                      <button
                        type="button"
                        className="order-action-button deliver-button"
                        disabled={
                          updatingId ===
                          selectedOrder.id
                        }
                        onClick={() =>
                          handleStatusUpdate(
                            selectedOrder.id,
                            "delivered"
                          )
                        }
                      >
                        ✓ Deliver
                      </button>
                      <a
                        href="/shipping"
                        className="shipping-link"
                      >
                        Go to Shipping →
                      </a>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* ORDER DETAILS MODAL */}
      {detailOrder && (
        <div
          className="order-modal-overlay"
          onClick={() => setDetailOrder(null)}
        >
          <div
            className="order-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="order-modal-header">
              <h2>
                Order #{detailOrder.id}
              </h2>

              <button
                type="button"
                className="order-modal-close"
                onClick={() => setDetailOrder(null)}
                aria-label="Close details"
              >
                ✕
              </button>
            </div>

            {detailLoading || detailOrder._loading ? (
              <p>Loading order details...</p>
            ) : (
              <>
                <div className="order-modal-status">
                  <span
                    className={getStatusClass(
                      detailOrder.status
                    )}
                  >
                    <span className="status-dot"></span>
                    {detailOrder.status}
                  </span>

                  <small>
                    {detailOrder.created_at &&
                      new Date(
                        detailOrder.created_at
                      ).toLocaleString()}
                  </small>
                </div>

                <div className="order-modal-grid">
                  <div className="order-modal-block">
                    <h3>📚 Book</h3>
                    {detailOrder.product_image && (
                      <img
                        src={`http://localhost:5000${detailOrder.product_image}`}
                        alt={detailOrder.product_title}
                      />
                    )}
                    <strong>
                      {detailOrder.product_title}
                    </strong>
                    <p>
                      {[
                        detailOrder.product_category,
                        detailOrder.product_class,
                        detailOrder.product_condition,
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                    <p>
                      Product ID:{" "}
                      {detailOrder.product_id}
                    </p>
                  </div>

                  <div className="order-modal-block">
                    <h3>👤 Buyer</h3>
                    <strong>
                      {detailOrder.buyer_name}
                    </strong>
                    <p>
                      {detailOrder.buyer_email}
                    </p>
                    <p>
                      {detailOrder.delivery_address}
                    </p>
                  </div>

                  <div className="order-modal-block">
                    <h3>🧑 Seller</h3>
                    <strong>
                      {detailOrder.seller_name}
                    </strong>
                    <p>
                      {detailOrder.seller_email}
                    </p>
                  </div>

                  <div className="order-modal-block">
                    <h3>💰 Amount</h3>
                    <p>
                      Seller Price: ₹
                      {detailOrder.seller_price}
                    </p>
                    <p>
                      Platform Fee: ₹
                      {detailOrder.platform_fee}
                    </p>
                    <p>
                      <strong>
                        Buyer Price: ₹
                        {detailOrder.buyer_price}
                      </strong>
                    </p>
                  </div>

                  <div className="order-modal-block">
                    <h3>💳 Payment</h3>
                    <p>
                      Method:{" "}
                      {detailOrder.payment_method ||
                        "-"}
                    </p>
                    <p>
                      Status:{" "}
                      {detailOrder.payment_status ||
                        "pending"}
                    </p>
                    {detailOrder.transaction_id && (
                      <p>
                        UTR:{" "}
                        {
                          detailOrder.transaction_id
                        }
                      </p>
                    )}
                  </div>

                  <div className="order-modal-block">
                    <h3>🚚 Shipping</h3>
                    <p>
                      Status:{" "}
                      {detailOrder.shipping_status ||
                        "pending"}
                    </p>
                    <p>
                      Courier:{" "}
                      {detailOrder.courier_name ||
                        "-"}
                    </p>
                    <p>
                      Tracking:{" "}
                      {detailOrder.tracking_number ||
                        "-"}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <section className="admin-orders-footer">
        <div className="footer-icon">
          📊
        </div>

        <div>
          <h2>
            Marketplace Order Overview
          </h2>

          <p>
            Monitor order activity and keep buyer
            and seller transactions organized.
          </p>
        </div>
      </section>
    </main>
  );
}

export default AdminOrders;