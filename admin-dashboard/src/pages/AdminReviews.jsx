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
        <div className="ap-table-wrapper">
          <table className="ap-table">
            <thead>
              <tr>
                <th>Review</th>
                <th>Buyer</th>
                <th>Book</th>
                <th>Rating</th>
                <th>Flag</th>
                <th>Comment</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredReviews.map(
                (review) => (
                  <tr key={review.id}>
                    <td>
                      <strong>
                        #{review.id}
                      </strong>
                    </td>

                    <td>
                      <strong>
                        {review.buyer_name ||
                          "Unknown"}
                      </strong>
                      <small>
                        {review.buyer_email ||
                          ""}
                      </small>
                    </td>

                    <td>
                      {review.product_title ||
                        "Product removed"}{" "}
                      <small>
                        (#{review.product_id})
                      </small>
                    </td>

                    <td>
                      <span className="ap-badge ap-badge-paid">
                        {"★".repeat(
                          Number(review.rating)
                        )}
                        {"☆".repeat(
                          5 -
                            Number(review.rating)
                        )}
                      </span>
                      <small>
                        ({review.rating}/5)
                      </small>
                    </td>

                    <td>
                      {Number(
                        review.open_report_count ||
                          0
                      ) > 0 ? (
                        <span
                          className="ap-badge ap-badge-cancelled"
                          title={`${review.open_report_count} open abuse report(s) on this book — check the Reports section`}
                        >
                          🚩{" "}
                          {
                            review.open_report_count
                          }
                        </span>
                      ) : (
                        <small>—</small>
                      )}
                    </td>

                    <td>
                      <small>
                        {review.comment ||
                          "No comment"}
                      </small>
                    </td>

                    <td>
                      <small>
                        {new Date(
                          review.created_at
                        ).toLocaleString()}
                      </small>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="ap-btn ap-btn-danger ap-btn-sm"
                        disabled={
                          deletingId ===
                          review.id
                        }
                        onClick={() =>
                          handleDelete(review.id)
                        }
                      >
                        {deletingId ===
                        review.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default AdminReviews;
