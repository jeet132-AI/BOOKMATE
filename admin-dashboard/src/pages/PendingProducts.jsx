import { useEffect, useState } from "react";
import "../components/AdminPanels.css";

function PendingProducts() {
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewProduct, setViewProduct] = useState(null);
  const [actingId, setActingId] = useState(null);

  const imageSrc = (path) => {
    if (!path) return null;
    const url = String(path).trim();
    if (!url) return null;
    if (/^(https?:|data:|blob:)/i.test(url)) {
      return url;
    }
    return `http://localhost:5000${
      url.startsWith("/") ? url : `/${url}`
    }`;
  };

  const productImages = (product) => {
    const list = product?.images || [];
    return Array.isArray(list) ? list : [];
  };

  const productPdf = (product) =>
    productImages(product).find(
      (path) =>
        path &&
        String(path)
          .toLowerCase()
          .endsWith(".pdf")
    );

  const fetchPendingProducts = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Admin login required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/admin/products/pending",
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
            "Unable to load pending products"
        );
        return;
      }

      setProducts(data.products || []);
      setMessage("");
    } catch (error) {
      console.error(
        "Pending products error:",
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
    fetchPendingProducts();
  }, []);

  const handleApprove = async (id) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Admin login required");
      return;
    }

    if (
      !window.confirm(
        `Approve book #${id}? It becomes available to buyers.`
      )
    )
      return;

    try {
      setActingId(id);
      const response = await fetch(
        `http://localhost:5000/api/admin/products/${id}/approve`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Unable to approve product"
        );
        return;
      }

      setMessage(
        "Book listing approved successfully."
      );

      setViewProduct(null);

      await fetchPendingProducts();
    } catch (error) {
      console.error(
        "Approve product error:",
        error
      );

      setMessage(
        "Unable to connect to server"
      );
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (id) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Admin login required");
      return;
    }

    if (
      !window.confirm(
        `Reject book #${id}? It will not be listed.`
      )
    )
      return;

    try {
      setActingId(id);
      const response = await fetch(
        `http://localhost:5000/api/admin/products/${id}/reject`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Unable to reject product"
        );
        return;
      }

      setMessage(
        "Book listing rejected successfully."
      );

      setViewProduct(null);

      await fetchPendingProducts();
    } catch (error) {
      console.error(
        "Reject product error:",
        error
      );

      setMessage(
        "Unable to connect to server"
      );
    } finally {
      setActingId(null);
    }
  };

  const filteredProducts = products.filter(
    (product) => {
      const searchText =
        search.toLowerCase();

      return (
        String(product.id).includes(
          searchText
        ) ||
        (product.title || "")
          .toLowerCase()
          .includes(searchText) ||
        (product.seller_name || "")
          .toLowerCase()
          .includes(searchText) ||
        (product.seller_email || "")
          .toLowerCase()
          .includes(searchText) ||
        (product.category || "")
          .toLowerCase()
          .includes(searchText) ||
        (product.class_name || "")
          .toLowerCase()
          .includes(searchText) ||
        (product.condition || "")
          .toLowerCase()
          .includes(searchText)
      );
    }
  );

  return (
    <main className="ap-page">
      <section className="ap-header">
        <div className="ap-header-icon">⏳</div>

        <p className="ap-label">
          ADMIN CONTROL CENTER
        </p>

        <h1>
          Pending <span>Products</span>
        </h1>

        <p>
          Review book listings before making
          them available to buyers.
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
            placeholder="Search title, seller, category, class..."
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
        <strong style={{ color: "#f1f5f9" }}>
          {filteredProducts.length}
        </strong>{" "}
        of{" "}
        <strong style={{ color: "#f1f5f9" }}>
          {products.length}
        </strong>{" "}
        pending books
      </p>

      {loading ? (
        <div className="ap-loading">
          <div className="ap-spinner"></div>
          <h2>Loading pending products...</h2>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="ap-empty">
          <div className="ap-empty-icon">📭</div>
          <h2>No pending products</h2>
          <p>
            {products.length === 0
              ? "All listings have been reviewed."
              : "No listings match your search."}
          </p>
        </div>
      ) : (
        <div className="ap-table-wrapper">
        <table className="ap-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Book</th>
              <th>Seller</th>
              <th>Price</th>
              <th>Info</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts.map(
              (product) => {
                const photos = productImages(
                  product
                ).filter(
                  (path) =>
                    path &&
                    !String(path)
                      .toLowerCase()
                      .endsWith(".pdf")
                );

                return (
                <tr key={product.id}>
                  <td>
                    <strong>
                      #{product.id}
                    </strong>
                  </td>

                  <td>
                    <div className="ap-book-cell">
                      {photos.length > 0 ? (
                        <img
                          src={imageSrc(
                            photos[0]
                          )}
                          alt={product.title}
                        />
                      ) : (
                        <span>📚</span>
                      )}
                      <div>
                        <strong>
                          {product.title}
                        </strong>
                        <small>
                          {product.seller_email}
                        </small>
                      </div>
                    </div>
                  </td>

                  <td>
                    {product.seller_name}
                  </td>

                  <td>
                    <strong>
                      ₹{product.seller_price}
                    </strong>
                  </td>

                  <td>
                    <small>
                      {[
                        product.category,
                        product.class_name,
                        product.condition,
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                    </small>
                  </td>

                  <td>
                    <div className="ap-actions">
                      <button
                        type="button"
                        className="ap-btn ap-btn-info ap-btn-sm"
                        onClick={() =>
                          setViewProduct(product)
                        }
                      >
                        👀 View
                      </button>

                      <button
                        type="button"
                        className="ap-btn ap-btn-success ap-btn-sm"
                        disabled={
                          actingId ===
                          product.id
                        }
                        onClick={() =>
                          handleApprove(
                            product.id
                          )
                        }
                      >
                        ✓ Approve
                      </button>

                      <button
                        type="button"
                        className="ap-btn ap-btn-danger ap-btn-sm"
                        disabled={
                          actingId ===
                          product.id
                        }
                        onClick={() =>
                          handleReject(
                            product.id
                          )
                        }
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </td>
                </tr>
                );
              }
            )}
          </tbody>
        </table>
        </div>
      )}

      {/* BOOK DETAIL MODAL */}
      {viewProduct && (
        <div
          className="ap-modal-overlay"
          onClick={() => setViewProduct(null)}
        >
          <div
            className="ap-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ap-modal-header">
              <h2>
                {viewProduct.title}
              </h2>

              <button
                type="button"
                className="ap-modal-close"
                onClick={() =>
                  setViewProduct(null)
                }
                aria-label="Close details"
              >
                ✕
              </button>
            </div>

            <div className="ap-modal-photos">
              {productImages(viewProduct)
                .filter(
                  (path) =>
                    path &&
                    !String(path)
                      .toLowerCase()
                      .endsWith(".pdf")
                )
                .map((path, index) => (
                  <img
                    key={index}
                    src={imageSrc(path)}
                    alt={`${viewProduct.title} photo ${index + 1}`}
                  />
                ))}

              {productImages(viewProduct).filter(
                (path) =>
                  path &&
                  !String(path)
                    .toLowerCase()
                    .endsWith(".pdf")
              ).length === 0 && (
                <span>📚 No photos uploaded</span>
              )}
            </div>

            <div className="ap-modal-grid">
              <div className="ap-modal-block">
                <h3>📖 Book Information</h3>
                <p>
                  {viewProduct.description ||
                    "No description provided."}
                </p>
                <p>
                  Category:{" "}
                  <strong>
                    {viewProduct.category}
                  </strong>
                </p>
                <p>
                  Class:{" "}
                  <strong>
                    {viewProduct.class_name ||
                      "Not specified"}
                  </strong>
                </p>
                <p>
                  Condition:{" "}
                  <strong>
                    {viewProduct.condition}
                  </strong>
                </p>
                <p>
                  Location:{" "}
                  <strong>
                    {viewProduct.location ||
                      "Not provided"}
                  </strong>
                </p>
              </div>

              <div className="ap-modal-block">
                <h3>👤 Seller Details</h3>
                <p>
                  <strong>
                    {viewProduct.seller_name}
                  </strong>
                </p>
                <p>
                  {viewProduct.seller_email}
                </p>
                <p>
                  Price:{" "}
                  <strong>
                    ₹
                    {viewProduct.seller_price}
                  </strong>
                </p>

                {productPdf(viewProduct) && (
                  <a
                    href={imageSrc(
                      productPdf(viewProduct)
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ap-btn ap-btn-info ap-btn-sm"
                    style={{
                      marginTop: "10px",
                      textDecoration: "none",
                    }}
                  >
                    📄 Open Book PDF
                  </a>
                )}
              </div>
            </div>

            <div className="ap-modal-actions">
              <button
                type="button"
                className="ap-btn ap-btn-success"
                disabled={
                  actingId === viewProduct.id
                }
                onClick={() =>
                  handleApprove(viewProduct.id)
                }
              >
                ✓ Approve — list to buyers
              </button>

              <button
                type="button"
                className="ap-btn ap-btn-danger"
                disabled={
                  actingId === viewProduct.id
                }
                onClick={() =>
                  handleReject(viewProduct.id)
                }
              >
                ✕ Reject — do not list
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default PendingProducts;