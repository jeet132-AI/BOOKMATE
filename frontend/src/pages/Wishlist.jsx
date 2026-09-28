import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { frontImage } from "../utils/bookImage";
import "./Wishlist.css";

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Please login to view your wishlist.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/wishlist",
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
          data.message || "Unable to load wishlist."
        );
        return;
      }

      setWishlist(data.wishlist || []);
      setMessage("");
    } catch (error) {
      console.error("Wishlist error:", error);

      setMessage(
        "Unable to connect to server."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Please login first.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/wishlist/${productId}`,
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
          data.message || "Unable to remove item."
        );
        return;
      }

      setWishlist((current) =>
        current.filter(
          (item) =>
            item.product_id !== productId
        )
      );

      setMessage(
        "Book removed from wishlist."
      );
    } catch (error) {
      console.error(
        "Remove wishlist error:",
        error
      );

      setMessage(
        "Unable to connect to server."
      );
    }
  };

  return (
    <main className="wishlist-page">
      {/* BACKGROUND */}
      <div className="wishlist-bg wishlist-bg-one"></div>
      <div className="wishlist-bg wishlist-bg-two"></div>

      <div className="wishlist-floating-book wishlist-book-one">
        📕
      </div>

      <div className="wishlist-floating-book wishlist-book-two">
        📗
      </div>

      <div className="wishlist-floating-book wishlist-book-three">
        📘
      </div>

      {/* HEADER */}
      <section className="wishlist-header">
        <div className="wishlist-heart">
          ❤️
        </div>

        <p className="wishlist-label">
          STUDENT BOOK MARKETPLACE
        </p>

        <h1>
          My <span>Wishlist</span>
        </h1>

        <p className="wishlist-subtitle">
          Save books that you may want to buy later.
          <br />
          Keep your favourite study materials in one place.
        </p>

        <div className="wishlist-header-line"></div>
      </section>

      {/* MESSAGE */}
      {message && (
        <div className="wishlist-message">
          <span>ℹ️</span>
          {message}
        </div>
      )}

      {/* NOT LOGGED IN */}
      {!localStorage.getItem("token") ? (
        <section className="wishlist-login-card">
          <div className="wishlist-login-icon">
            🔐
          </div>

          <p className="wishlist-small-label">
            ACCOUNT REQUIRED
          </p>

          <h2>
            Login to Manage Your Wishlist
          </h2>

          <p>
            Save books, view them later and quickly
            return to your favourite listings.
          </p>

          <Link to="/login">
            <button
              type="button"
              className="wishlist-primary-button"
            >
              Login →
            </button>
          </Link>
        </section>
      ) : loading ? (
        /* LOADING */
        <section className="wishlist-loading">
          <div className="wishlist-spinner"></div>

          <h2>Loading Your Wishlist...</h2>

          <p>
            Finding your saved books.
          </p>
        </section>
      ) : wishlist.length === 0 ? (
        /* EMPTY */
        <section className="wishlist-empty">
          <div className="empty-wishlist-book">
            📚
          </div>

          <p className="wishlist-small-label">
            NO SAVED BOOKS
          </p>

          <h2>
            Your Wishlist Is Empty
          </h2>

          <p>
            Browse the marketplace and save books
            you may want to purchase later.
          </p>

          <Link to="/books">
            <button
              type="button"
              className="wishlist-primary-button"
            >
              📚 Browse Books
              <span>→</span>
            </button>
          </Link>
        </section>
      ) : (
        <>
          {/* TOOLBAR */}
          <section className="wishlist-toolbar">
            <div className="wishlist-toolbar-left">
              <div className="toolbar-icon">
                ❤️
              </div>

              <div>
                <small>SAVED BOOKS</small>

                <h2>
                  {wishlist.length}{" "}
                  {wishlist.length === 1
                    ? "Book"
                    : "Books"}{" "}
                  Saved
                </h2>
              </div>
            </div>

            <Link to="/books">
              <button
                type="button"
                className="browse-more-button"
              >
                + Browse More
              </button>
            </Link>
          </section>

          {/* WISHLIST GRID */}
          <section className="wishlist-grid">
            {wishlist.map((item, index) => (
              <article
                className="wishlist-card"
                key={item.id}
                style={{
                  animationDelay: `${index * 0.12}s`,
                }}
              >
                {/* IMAGE */}
                <div className="wishlist-image-wrapper">
                  {item.image_url ? (
                    <img
                      src={frontImage(item)}
                      alt={
                        item.product_title ||
                        "Book"
                      }
                      className="wishlist-image"
                    />
                  ) : (
                    <div className="wishlist-no-image">
                      📖
                      <span>No Image</span>
                    </div>
                  )}

                  <div className="wishlist-heart-badge">
                    ♥
                  </div>

                  <div className="wishlist-image-shine"></div>
                </div>

                {/* CONTENT */}
                <div className="wishlist-card-content">
                  <p className="wishlist-category">
                    {item.category ||
                      "Study Material"}
                  </p>

                  <h2>
                    {item.product_title ||
                      "Book"}
                  </h2>

                  <div className="wishlist-info-grid">
                    <div>
                      <span>Condition</span>
                      <strong>
                        {item.condition ||
                          "Used"}
                      </strong>
                    </div>

                    <div>
                      <span>Seller</span>
                      <strong>
                        {item.seller_name ||
                          "Student Seller"}
                      </strong>
                    </div>
                  </div>

                  {/* PRICING */}
                  <div className="wishlist-pricing">
                    <div className="seller-price">
                      <span>
                        Seller Price
                      </span>

                      <strong>
                        ₹{item.seller_price}
                      </strong>
                    </div>

                    <div className="buyer-price">
                      <span>
                        Buyer Price
                      </span>

                      <strong>
                        ₹
                        {item.buyer_price ||
                          item.seller_price}
                      </strong>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="wishlist-actions">
                    <Link
                      to={`/books/${item.product_id}`}
                    >
                      <button
                        type="button"
                        className="view-wishlist-button"
                      >
                        📖 View Book
                        <span>↗</span>
                      </button>
                    </Link>

                    <button
                      type="button"
                      className="remove-wishlist-button"
                      onClick={() =>
                        handleRemove(
                          item.product_id
                        )
                      }
                      aria-label={`Remove ${
                        item.product_title ||
                        "book"
                      } from wishlist`}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>

          {/* FOOTER */}
          <section className="wishlist-footer">
            <div className="wishlist-footer-icon">
              📚
            </div>

            <div>
              <h2>
                Looking for More Books?
              </h2>

              <p>
                Explore affordable books from
                student sellers and discover your
                next study companion.
              </p>
            </div>

            <Link to="/books">
              <button
                type="button"
                className="wishlist-footer-button"
              >
                Explore Books →
              </button>
            </Link>
          </section>
        </>
      )}
    </main>
  );
}

export default Wishlist;