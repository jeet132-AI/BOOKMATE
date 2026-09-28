import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { frontImage } from "../utils/bookImage";
import "./Reviews.css";

function Reviews() {
  const [searchParams] = useSearchParams();

  const productId = searchParams.get("product");

  const [reviews, setReviews] = useState([]);
  const [product, setProduct] = useState(null);
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = async () => {
    if (!productId) {
      setMessage(
        "No book selected for reviews."
      );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `http://localhost:5000/api/reviews/product/${productId}`
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Unable to load reviews."
        );
        return;
      }

      setReviews(data.reviews || []);
      setMessage("");
    } catch (error) {
      console.error(
        "Reviews error:",
        error
      );

      setMessage(
        "Unable to connect to server."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchProduct = async () => {
    if (!productId) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/products/${productId}`
      );
      const data = await response.json();

      if (response.ok) {
        setProduct(data.product || null);
      }
    } catch (error) {
      console.error(
        "Review product error:",
        error
      );
    }
  };

  useEffect(() => {
    fetchReviews();
    fetchProduct();
  }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      setMessage(
        "Please login to submit a review."
      );
      return;
    }

    if (!productId) {
      setMessage(
        "No book selected."
      );
      return;
    }

    if (!comment.trim()) {
      setMessage(
        "Please write a review comment."
      );
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      const response = await fetch(
        "http://localhost:5000/api/reviews",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            product_id: Number(productId),
            rating: Number(rating),
            comment: comment.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Unable to submit review."
        );
        return;
      }

      setMessage(
        "Review submitted successfully."
      );

      setRating("5");
      setComment("");

      await fetchReviews();
    } catch (error) {
      console.error(
        "Submit review error:",
        error
      );

      setMessage(
        "Unable to connect to server."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = reviews.length
    ? reviews.reduce(
        (sum, review) => sum + Number(review.rating),
        0
      ) / reviews.length
    : 0;

  if (!productId) {
    return (
      <main className="reviews-page">
        <div className="reviews-error-card">
          <h1>Reviews</h1>

          <p>
            Select a book to view its
            reviews.
          </p>

          <Link to="/books">
            <button type="button">
              Browse Books
            </button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="reviews-page">
      <section className="reviews-header">
        <p className="reviews-label">
          VERIFIED BUYER REVIEWS
        </p>

        <h1>
          Book <span>Reviews</span>
        </h1>
      </section>

      {/* Book summary */}
      <section className="reviews-book-card">
        <div className="reviews-book-photo">
          {frontImage(product) ? (
            <img
              src={frontImage(product)}
              alt={product?.title || "Book"}
            />
          ) : (
            "📚"
          )}
        </div>

        <div className="reviews-book-info">
          <h2>
            {product?.title ||
              `Book #${productId}`}
          </h2>

          {reviews.length > 0 ? (
            <p className="reviews-summary">
              <span className="reviews-avg">
                ★ {averageRating.toFixed(1)}
              </span>
              <span>
                {reviews.length}{" "}
                {reviews.length === 1
                  ? "review"
                  : "reviews"}
              </span>
            </p>
          ) : (
            <p className="reviews-summary">
              No reviews yet — be the first
              to review this book.
            </p>
          )}
        </div>

        <Link
          to={`/books/${productId}`}
          className="reviews-view-book"
        >
          View Book →
        </Link>
      </section>

      {message && (
        <div className="reviews-message">
          {message}
        </div>
      )}

      <div className="reviews-layout">
        {/* Write a review */}
        <section className="reviews-form-card">
          <h2>Write a Review</h2>

          <p>
            Purchased and received this
            book? Share your experience.
          </p>

          {!localStorage.getItem("token") ? (
            <div>
              <p>
                Please login to write a
                review.
              </p>

              <Link to="/login">
                <button
                  type="button"
                  className="reviews-submit-button"
                >
                  Login
                </button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label>
                Your rating
                <select
                  value={rating}
                  onChange={(e) =>
                    setRating(
                      e.target.value
                    )
                  }
                >
                  <option value="5">
                    5 - Excellent
                  </option>

                  <option value="4">
                    4 - Very Good
                  </option>

                  <option value="3">
                    3 - Good
                  </option>

                  <option value="2">
                    2 - Fair
                  </option>

                  <option value="1">
                    1 - Poor
                  </option>
                </select>
              </label>

              <label>
                Your review
                <textarea
                  rows="5"
                  placeholder="How was the book condition, seller and delivery?"
                  value={comment}
                  onChange={(e) =>
                    setComment(
                      e.target.value
                    )
                  }
                  required
                />
              </label>

              <button
                type="submit"
                className="reviews-submit-button"
                disabled={submitting}
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Review"}
              </button>
            </form>
          )}
        </section>

        {/* Review list */}
        <section className="reviews-list-card">
          <h2>
            Customer Reviews{" "}
            {reviews.length > 0 &&
              `(${reviews.length})`}
          </h2>

          {loading ? (
            <p>Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p>No reviews yet.</p>
          ) : (
            <div className="reviews-list">
              {reviews.map(
                (review) => (
                  <article
                    className="review-item"
                    key={review.id}
                  >
                    <div className="review-item-top">
                      <span className="review-stars">
                        {"★".repeat(
                          Number(
                            review.rating
                          )
                        )}
                        {"☆".repeat(
                          5 -
                            Number(
                              review.rating
                            )
                        )}
                      </span>

                      <strong>
                        {review.user_name ||
                          "Verified Buyer"}
                      </strong>
                    </div>

                    <p className="review-comment">
                      {review.comment}
                    </p>

                    <small>
                      {new Date(
                        review.created_at
                      ).toLocaleString()}
                    </small>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default Reviews;
