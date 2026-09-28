import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { frontImage } from "../utils/bookImage";
import { isOwnBook, useCart } from "../context/CartContext";
import "./BookDetails.css";

function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotice } = useCart();

  const [book, setBook] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [bookReviews, setBookReviews] = useState([]);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `http://localhost:5000/api/products/${id}`
        );

        const data = await response.json();

        if (!response.ok) {
          setMessage(data.message || "Unable to load book");
          return;
        }

        setBook(data.product);
        setMessage("");
      } catch (error) {
        console.error("Book details error:", error);
        setMessage("Unable to connect to server");
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  useEffect(() => {
    const fetchBookReviews = async () => {
      if (!id) return;

      try {
        const response = await fetch(
          `http://localhost:5000/api/reviews/product/${id}`
        );
        const data = await response.json();

        if (response.ok) {
          setBookReviews(data.reviews || []);
        }
      } catch (error) {
        console.error("Book reviews error:", error);
      }
    };

    fetchBookReviews();
  }, [id]);

  useEffect(() => {
    const checkWishlistStatus = async () => {
      const token = localStorage.getItem("token");
      if (!token || !id) return;

      try {
        const response = await fetch(
          `http://localhost:5000/api/wishlist/${id}/check`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) return;
        const data = await response.json();
        setInWishlist(Boolean(data.inWishlist));
      } catch (error) {
        console.error("Check wishlist error:", error);
      }
    };

    checkWishlistStatus();
  }, [id]);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/books");
    }
  };

  const handleWishlistToggle = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    if (!book) return;

    try {
      setWishlistLoading(true);
      setActionMessage("");

      if (inWishlist) {
        const response = await fetch(
          `http://localhost:5000/api/wishlist/${book.id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setActionMessage(data.message || "Unable to remove from wishlist");
          return;
        }

        setInWishlist(false);
        setActionMessage("Removed from wishlist");
      } else {
        const response = await fetch(
          "http://localhost:5000/api/wishlist",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ product_id: book.id }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setActionMessage(data.message || "Unable to add to wishlist");
          return;
        }

        setInWishlist(true);
        setActionMessage("Added to wishlist ❤️");
      }
    } catch (error) {
      console.error("Wishlist toggle error:", error);
      setActionMessage("Unable to connect to server");
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleBuyNow = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    if (!book || book.status === "sold") return;

    if (isOwnBook(book.seller_id)) {
      showNotice(
        "This is your own book — you cannot buy it."
      );
      return;
    }

    navigate(`/checkout/${book.id}`);
  };

  if (loading) {
    return (
      <main className="book-details-page">
        <div className="details-loading">
          <div className="loading-books">
            <span>📕</span>
            <span>📗</span>
            <span>📘</span>
          </div>

          <h1>Loading Book...</h1>
          <p>Preparing the book details for you.</p>
        </div>
      </main>
    );
  }

  if (message || !book) {
    const isSold =
      /not found|not available|sold|already been ordered/i.test(message || "");
    return (
      <main className="book-details-page">
        <div className="details-error">
          <div className="error-icon">📕</div>

          <h1>{isSold ? "Sold Out" : "Book Not Found"}</h1>

          <p>
            {isSold
              ? "This book was just sold and removed from the book list."
              : message || "This book is not available."}
          </p>

          <button
            type="button"
            className="details-back-button"
            onClick={() => navigate("/books")}
          >
            ← Back to Books
          </button>
        </div>
      </main>
    );
  }

  const sellerPrice = Number(book.seller_price || 0);

  const platformFee = Number(book.platform_fee || 0);

  const buyerPrice = Number(
    book.buyer_price || sellerPrice + platformFee
  );

  const isSold = book.status === "sold";

  return (
    <main className="book-details-page">

      {/* Animated Background */}
      <div className="details-bg-circle circle-one"></div>
      <div className="details-bg-circle circle-two"></div>

      <div className="details-floating-book floating-one">
        📚
      </div>

      <div className="details-floating-book floating-two">
        📖
      </div>

      <div className="details-floating-book floating-three">
        📘
      </div>

      {/* Header */}
      <section className="details-header">
        <p className="details-label">
          STUDENT BOOK MARKETPLACE
        </p>

        <h1>
          Book <span>Details</span>
        </h1>

        <p>
          Explore the book information, pricing and seller details.
        </p>

        <div className="details-header-line"></div>
      </section>

      {/* Main Details */}
      <section className="details-container">

        {/* Image Section */}
        <div className="details-image-card">

          <div className="image-top-badge">
            📚 BOOK #{book.id}
          </div>

          <div className="details-image">

            {frontImage(book) ? (
              <img
                src={frontImage(book)}
                alt={book.title}
              />
            ) : (
              <div className="details-no-image">
                <span>📚</span>
                <p>No Image Available</p>
              </div>
            )}

            <div className="image-shine"></div>
          </div>

          <div className="image-bottom-info">
            <span>
              {book.condition || "Used"}
            </span>

            <span>
              {book.category || "General"}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="details-content">

          <div className="details-category">
            {book.category || "GENERAL"}
          </div>

          {isSold && (
            <div className="sold-badge">
              🔴 SOLD OUT
            </div>
          )}

          <h2 className="details-title">
            {book.title}
          </h2>

          <p className="details-description">
            {book.description ||
              "No description provided for this book."}
          </p>

          <div className="details-divider"></div>

          {/* Information */}
          <div className="book-information">

            <div className="info-item">
              <span className="info-icon">📂</span>

              <div>
                <small>Category</small>
                <strong>
                  {book.category || "Not provided"}
                </strong>
              </div>
            </div>

            {book.class_name && (
              <div className="info-item">
                <span className="info-icon">🎓</span>

                <div>
                  <small>Class / Exam</small>
                  <strong>
                    {book.class_name}
                  </strong>
                </div>
              </div>
            )}

            <div className="info-item">
              <span className="info-icon">✨</span>

              <div>
                <small>Condition</small>
                <strong>
                  {book.condition || "Not provided"}
                </strong>
              </div>
            </div>

            <div className="info-item">
              <span className="info-icon">👤</span>

              <div>
                <small>Seller</small>
                <strong>
                  {book.seller_name || "Student Seller"}
                </strong>
              </div>
            </div>

            <div className="info-item">
              <span className="info-icon">📍</span>

              <div>
                <small>Location</small>
                <strong>
                  {book.location || "Not provided"}
                </strong>
              </div>
            </div>

          </div>

          {/* Pricing */}
          <div className="price-section">

            <div className="price-section-title">
              <span>💰</span>
              <h3>Price Details</h3>
            </div>

            <div className="price-row">
              <span>Seller Price</span>

              <strong>
                ₹{sellerPrice.toFixed(2)}
              </strong>
            </div>

            <div className="price-row fee-price">
              <span>Platform Fee</span>

              <strong>
                ₹{platformFee.toFixed(2)}
              </strong>
            </div>

            <div className="price-total">
              <div>
                <span>Buyer Price</span>
                <small>Final marketplace price</small>
              </div>

              <strong>
                ₹{buyerPrice.toFixed(2)}
              </strong>
            </div>

          </div>

          {/* Buttons: Back | Buy | Wishlist */}
          <div className="details-actions">

            <button
              type="button"
              className="back-button"
              onClick={handleGoBack}
            >
              ← Back
            </button>

            {!isSold && (
              <button
                type="button"
                className="buy-button"
                onClick={handleBuyNow}
              >
                <span>🛒</span>
                <span>Buy Now</span>
                <span className="button-arrow">→</span>
              </button>
            )}

            {!isSold && (
              <button
                type="button"
                className={inWishlist ? "wishlist-button active" : "wishlist-button"}
                onClick={handleWishlistToggle}
                disabled={wishlistLoading}
              >
                <span>{inWishlist ? "❤️" : "🤍"}</span>
                <span>
                  {wishlistLoading
                    ? "Saving..."
                    : inWishlist
                      ? "Wishlisted"
                      : "Add to Wishlist"}
                </span>
              </button>
            )}

            {isSold && (
              <div className="sold-note">
                This book has been sold and removed from the book list.
              </div>
            )}

          </div>

          {actionMessage && (
            <p className="details-action-message">{actionMessage}</p>
          )}

        </div>
      </section>

      {/* Ratings & Reviews (Flipkart style) */}
      <section className="details-reviews-card">

        <div className="details-reviews-header">
          <h3>
            Ratings & Reviews
          </h3>

          {bookReviews.length > 0 ? (
            <p className="details-rating-summary">
              <span className="details-avg-badge">
                ★{" "}
                {(
                  bookReviews.reduce(
                    (sum, review) =>
                      sum + Number(review.rating),
                    0
                  ) / bookReviews.length
                ).toFixed(1)}
              </span>
              <span>
                {bookReviews.length}{" "}
                {bookReviews.length === 1
                  ? "review"
                  : "reviews"}
              </span>
            </p>
          ) : (
            <p className="details-no-reviews">
              No reviews yet.
            </p>
          )}
        </div>

        {bookReviews.length > 0 && (
          <div className="details-reviews-list">
            {bookReviews.slice(0, 3).map((review) => (
              <article
                className="details-review-item"
                key={review.id}
              >
                <p>
                  <span className="details-review-stars">
                    {"★".repeat(Number(review.rating))}
                    {"☆".repeat(5 - Number(review.rating))}
                  </span>
                  <strong>
                    {review.user_name || "Verified Buyer"}
                  </strong>
                </p>

                <p>{review.comment}</p>
              </article>
            ))}
          </div>
        )}

      </section>

      {/* Bottom Message */}
      <section className="details-footer-card">

        <div className="footer-book-icon">
          📖
        </div>

        <div>
          <h3>
            Give This Book a Second Life
          </h3>

          <p>
            Buy affordable study materials from other students
            and keep useful books in circulation.
          </p>
        </div>

      </section>

    </main>
  );
}

export default BookDetails;