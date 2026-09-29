import { useEffect, useState } from "react";
import "./AdminProducts.css";

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  const fetchProducts = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Admin login required");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/admin/products",
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
          data.message || "Unable to load products"
        );
        return;
      }

      setProducts(data.products || []);
      setMessage("");
    } catch (error) {
      console.error("Products error:", error);

      setMessage(
        "Unable to connect to server"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(
    (product) => {
      const searchText =
        search.toLowerCase();

      const title =
        (product.title || "").toLowerCase();

      const seller =
        (product.seller_name || "").toLowerCase();

      const category =
        (product.category || "").toLowerCase();

      const matchesSearch =
        title.includes(searchText) ||
        seller.includes(searchText) ||
        category.includes(searchText);

      const matchesStatus =
        statusFilter === "All" ||
        product.status ===
          statusFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesStatus
      );
    }
  );

  // Selected product for the ID-button details panel.
  // Defaults to the first visible product.
  const selectedProduct =
    filteredProducts.find(
      (product) => product.id === selectedId
    ) ||
    filteredProducts[0] ||
    null;

  const getStatusText = (status) => {
    if (status === "pending") {
      return "Pending";
    }

    if (status === "approved") {
      return "Approved";
    }

    if (status === "rejected") {
      return "Rejected";
    }

    return status || "Unknown";
  };

  const getStatusClass = (status) => {
    if (status === "pending") {
      return "product-status pending-status";
    }

    if (status === "approved") {
      return "product-status approved-status";
    }

    if (status === "rejected") {
      return "product-status rejected-status";
    }

    return "product-status";
  };

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

  return (
    <main className="admin-products-page">

      {/* Background Animation */}
      <div className="products-bg products-bg-one"></div>
      <div className="products-bg products-bg-two"></div>
      <div className="products-bg products-bg-three"></div>

      {/* Header */}
      <section className="products-header">

        <div className="products-header-icon">
          📚
        </div>

        <div>
          <p className="products-label">
            ADMIN CONTROL CENTER
          </p>

          <h1>
            Product <span>Management</span>
          </h1>

          <p className="products-description">
            View and monitor all book listings
            submitted by sellers.
          </p>
        </div>

      </section>

      {/* Message */}
      {message && (
        <div className="products-message">
          <span>⚠️</span>
          {message}
        </div>
      )}

      {/* Statistics */}
      {!loading && !message && (
        <section className="products-statistics">

          <div className="product-stat-card total-product-stat">
            <div className="product-stat-icon">
              📚
            </div>

            <div>
              <p>Total Products</p>
              <h2>{totalProducts}</h2>
            </div>

            <span className="product-stat-decoration">
              📖
            </span>
          </div>

          <div className="product-stat-card pending-product-stat">
            <div className="product-stat-icon">
              ⏳
            </div>

            <div>
              <p>Pending</p>
              <h2>{pendingProducts}</h2>
            </div>

            <span className="product-stat-decoration">
              ⏰
            </span>
          </div>

          <div className="product-stat-card approved-product-stat">
            <div className="product-stat-icon">
              ✅
            </div>

            <div>
              <p>Approved</p>
              <h2>{approvedProducts}</h2>
            </div>

            <span className="product-stat-decoration">
              ✔️
            </span>
          </div>

          <div className="product-stat-card rejected-product-stat">
            <div className="product-stat-icon">
              ❌
            </div>

            <div>
              <p>Rejected</p>
              <h2>{rejectedProducts}</h2>
            </div>

            <span className="product-stat-decoration">
              🚫
            </span>
          </div>

        </section>
      )}

      {/* Search and Filter */}
      {!loading && (
        <section className="products-controls">

          <div className="products-controls-heading">

            <div>
              <span>PRODUCT DIRECTORY</span>

              <h2>
                🔎 Find Products
              </h2>
            </div>

            <div className="product-count-badge">
              {filteredProducts.length} PRODUCTS
            </div>

          </div>

          <div className="products-controls-row">

            <div className="product-search-box">

              <span>🔍</span>

              <input
                type="text"
                placeholder="Search book, seller or category..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

              {search && (
                <button
                  type="button"
                  className="product-search-clear"
                  onClick={() =>
                    setSearch("")
                  }
                >
                  ×
                </button>
              )}

            </div>

            <div className="product-status-filter">

              <label htmlFor="product-status">
                Status
              </label>

              <select
                id="product-status"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value
                  )
                }
              >
                <option value="All">
                  All Products
                </option>

                <option value="Pending">
                  Pending
                </option>

                <option value="Approved">
                  Approved
                </option>

                <option value="Rejected">
                  Rejected
                </option>
              </select>

            </div>

            <button
              type="button"
              className="product-reset-button"
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
              }}
            >
              ↻ Reset
            </button>

          </div>

        </section>
      )}

      {/* Product Table */}
      <section className="products-table-section">

        <div className="products-table-heading">

          <div>
            <span>BOOK LISTINGS</span>

            <h2>
              📚 All Products
            </h2>
          </div>

          {!loading && (
            <p>
              Showing{" "}
              <strong>
                {filteredProducts.length}
              </strong>{" "}
              of{" "}
              <strong>
                {products.length}
              </strong>
            </p>
          )}

        </div>

        {loading ? (

          <div className="products-loading">

            <div className="products-loader">
              📚
            </div>

            <h2>
              Loading Products...
            </h2>

            <p>
              Fetching marketplace listings
            </p>

          </div>

        ) : filteredProducts.length > 0 ? (

          <>
            {/* ID buttons — 5 per row, click to see details */}
            <div className="product-id-grid">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  className={
                    selectedProduct?.id === product.id
                      ? "product-id-btn selected"
                      : "product-id-btn"
                  }
                  onClick={() =>
                    setSelectedId(product.id)
                  }
                  aria-label={`Product ${product.id} details`}
                >
                  #{product.id}
                </button>
              ))}
            </div>

            {/* Selected product details */}
            {selectedProduct && (
              <div className="product-details-panel">
                <div className="product-details-panel-heading">
                  <strong>
                    #{selectedProduct.id} —{" "}
                    {selectedProduct.title}
                  </strong>

                  <span
                    className={getStatusClass(
                      selectedProduct.status
                    )}
                  >
                    {getStatusText(
                      selectedProduct.status
                    )}
                  </span>
                </div>

                <div className="product-details-grid">
                  <div>
                    <small>ID</small>
                    <strong>
                      #{selectedProduct.id}
                    </strong>
                  </div>
                  <div>
                    <small>BOOK</small>
                    <strong>
                      {selectedProduct.title}
                    </strong>
                  </div>
                  <div>
                    <small>SELLER</small>
                    <strong>
                      {selectedProduct.seller_name}
                    </strong>
                  </div>
                  <div>
                    <small>EMAIL</small>
                    <strong>
                      {selectedProduct.seller_email}
                    </strong>
                  </div>
                  <div>
                    <small>CATEGORY</small>
                    <strong>
                      {selectedProduct.category}
                    </strong>
                  </div>
                  <div>
                    <small>CONDITION</small>
                    <strong>
                      {selectedProduct.condition}
                    </strong>
                  </div>
                  <div>
                    <small>SELLER PRICE</small>
                    <strong>
                      ₹{selectedProduct.seller_price}
                    </strong>
                  </div>
                  <div>
                    <small>LOCATION</small>
                    <strong>
                      {selectedProduct.location ||
                        "Not provided"}
                    </strong>
                  </div>
                  <div>
                    <small>STATUS</small>
                    <strong>
                      {getStatusText(
                        selectedProduct.status
                      )}
                    </strong>
                  </div>
                  <div>
                    <small>CREATED AT</small>
                    <strong>
                      {selectedProduct.created_at
                        ? new Date(
                            selectedProduct.created_at
                          ).toLocaleString()
                        : "N/A"}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </>

        ) : (

          <div className="no-products">

            <div className="no-products-icon">
              🔍
            </div>

            <h2>
              No Products Found
            </h2>

            <p>
              No book listings match your
              current search or status filter.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
              }}
            >
              Clear Filters
            </button>

          </div>

        )}

      </section>

      {/* Footer */}
      <section className="products-footer">

        <div className="products-footer-icon">
          📚
        </div>

        <div>
          <h2>
            USED BOOK MARKET
          </h2>

          <p>
            Product management control panel
          </p>
        </div>

        <div className="products-footer-status">
          <span></span>
          System Online
        </div>

      </section>

    </main>
  );
}

export default AdminProducts;