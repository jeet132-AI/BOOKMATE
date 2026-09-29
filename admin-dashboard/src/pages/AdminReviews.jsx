import { useEffect, useState } from "react";
import "../components/AdminPanels.css";

function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("All");
  const [reportedOnly, setReportedOnly] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedReviewId, setSelectedReviewId] =
    useState(null);

  const fetchReviews = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Admin login required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/admin/reviews",
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
            "Unable to load reviews"
        );
        return;
      }

      setReviews(data.reviews || []);
      setMessage("");
    } catch (error) {
      console.error(
        "Admin reviews error:",
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
    fetchReviews();
  }, []);

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      `Delete review #${id}? This cannot be undone.`
    );

    if (!confirmed) return;

    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Admin login required");
      return;
    }

    try {
      setDeletingId(id);

      const response = await fetch(
        `http://localhost:5000/api/admin/reviews/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Unable to delete review"
        );
        return;
      }

      setMessage(
        `Review #${id} deleted successfully.`
      );

      await fetchReviews();
    } catch (error) {
      console.error(
        "Delete review error:",
        error
      );

      setMessage(
        "Unable to connect to server"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const filteredReviews = reviews.filter(
    (review) => {
      const searchText =
        search.toLowerCase();

      const matchesSearch =
        String(review.id).includes(
          searchText
        ) ||
        (review.buyer_name || "")
          .toLowerCase()
          .includes(searchText) ||
        (review.buyer_email || "")
          .toLowerCase()
          .includes(searchText) ||
        (review.product_title || "")
          .toLowerCase()
          .includes(searchText) ||
        (review.comment || "")
          .toLowerCase()
          .includes(searchText);

      const matchesRating =
        ratingFilter === "All" ||
        Number(review.rating) ===
          Number(ratingFilter);

      const matchesReported =
        !reportedOnly ||
        Number(
          review.open_report_count || 0
        ) > 0;

      return (
        matchesSearch &&
        matchesRating &&
        matchesReported
      );
    }
  );

  // Selected review for the ID-button details panel.
  // Defaults to the first visible review.
  const selectedReview =
    filteredReviews.find(
      (review) => review.id === selectedReviewId
    ) ||
    filteredReviews[0] ||
    null;

  const averageRating = reviews.length
    ? reviews.reduce(
        (sum, review) =>
          sum + Number(review.rating || 0),
        0
      ) / reviews.length
    : 0;

  const countByStars = (stars) =>
    reviews.filter(
      (review) =>
        Number(review.rating) === stars
    ).length;

  const reportedCount = reviews.filter(
    (review) =>
      Number(review.open_report_count || 0) >
      0
  ).length;

  return (
    <main className="ap-page">
      <section className="ap-header">
        <div className="ap-header-icon">⭐</div>

        <p className="ap-label">
          ADMIN CONTROL CENTER
        </p>

        <h1>
          Buyer <span>Reviews</span>
        </h1>

        <p>
          Reviews written by buyers after
          delivery, like Flipkart ratings.
          Delete abusive or fake reviews.
        </p>

        <div className="ap-header-line"></div>
      </section>

      {message && (
        <div className="ap-message">{message}</div>
      )}

      <section className="ap-toolbar">
        <div className="ap-search-box">
          <span>🔍</span>

          <input
            type="text"
            placeholder="Search review, buyer, book or comment..."
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
          Rating{" "}
          <select
            value={ratingFilter}
            onChange={(e) =>
              setRatingFilter(e.target.value)
            }
          >
            <option value="All">
              All ratings
            </option>

            <option value="5">
              5 stars
            </option>

            <option value="4">
              4 stars
            </option>

            <option value="3">
              3 stars
            </option>

            <option value="2">
              2 stars
            </option>

            <option value="1">
              1 star
            </option>
          </select>
        </label>

        <label>
          <input
            type="checkbox"
            checked={reportedOnly}
            onChange={(e) =>
              setReportedOnly(e.target.checked)
            }
          />{" "}
          Reported books only
        </label>
      </section>

      <section className="ap-summary">
        <div className="ap-stat">
          <span>⭐</span>
          <small>AVERAGE</small>
          <strong>
            {reviews.length
              ? averageRating.toFixed(1)
              : "-"}
            /5
          </strong>
        </div>

        <div className="ap-stat">
          <span>💬</span>
          <small>TOTAL REVIEWS</small>
          <strong>{reviews.length}</strong>
        </div>

        <div className="ap-stat">
          <span>🌟</span>
          <small>5★ / 4★</small>
          <strong>
            {countByStars(5)} /{" "}
            {countByStars(4)}
          </strong>
        </div>

        <div className="ap-stat">
          <span>🚩</span>
          <small>REPORTED</small>
          <strong>{reportedCount}</strong>
        </div>
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
          {filteredReviews.length}
        </strong>{" "}
        of{" "}
        <strong style={{ color: "#f1f5f9" }}>
          {reviews.length}
        </strong>{" "}
        reviews
      </p>

      {loading ? (
        <div className="ap-loading">
          <div className="ap-spinner"></div>
          <h2>Loading reviews...</h2>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="ap-empty">
          <div className="ap-empty-icon">⭐</div>
          <h2>No reviews found</h2>
          <p>
            Try changing your search or
            filters.
          </p>
        </div>
      ) : (
        <>
          {/* Review ID buttons — 5 per row */}
          <div className="id-btn-grid">
            {filteredReviews.map((review) => (
              <button
                key={review.id}
                type="button"
                className={
                  selectedReview?.id === review.id
                    ? "id-btn selected"
                    : "id-btn"
                }
                onClick={() =>
                  setSelectedReviewId(review.id)
                }
                aria-label={`Review ${review.id} details`}
              >
                #{review.id}
              </button>
            ))}
          </div>

          {/* Selected review details */}
          {selectedReview && (
            <div className="id-details-panel">
              <div className="id-details-panel-heading">
                <strong>
                  ⭐ Review #
                  {selectedReview.id} —{" "}
                  {selectedReview.product_title ||
                    "Product removed"}
                </strong>

                <span className="ap-badge ap-badge-paid">
                  {"★".repeat(
                    Number(selectedReview.rating)
                  )}
                  {"☆".repeat(
                    5 -
                      Number(selectedReview.rating)
                  )}
                </span>
              </div>

              <div className="id-details-grid">
                <div>
                  <small>BUYER</small>
                  <strong>
                    {selectedReview.buyer_name ||
                      "Unknown"}
                  </strong>
                </div>
                <div>
                  <small>RATING</small>
                  <strong>
                    ({selectedReview.rating}/5)
                  </strong>
                </div>
                <div>
                  <small>FLAG</small>
                  <strong>
                    {Number(
                      selectedReview.open_report_count ||
                        0
                    ) > 0
                      ? `🚩 ${selectedReview.open_report_count} open report(s)`
                      : "—"}
                  </strong>
                </div>
                <div>
                  <small>CREATED</small>
                  <strong>
                    {new Date(
                      selectedReview.created_at
                    ).toLocaleString()}
                  </strong>
                </div>
                <div>
                  <small>COMMENT</small>
                  <strong>
                    {selectedReview.comment ||
                      "No comment"}
                  </strong>
                </div>
              </div>

              <div className="id-details-actions">
                <button
                  type="button"
                  className="ap-btn ap-btn-danger ap-btn-sm"
                  disabled={
                    deletingId ===
                    selectedReview.id
                  }
                  onClick={() =>
                    handleDelete(selectedReview.id)
                  }
                >
                  {deletingId ===
                  selectedReview.id
                    ? "Deleting..."
                    : "Delete"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default AdminReviews;
