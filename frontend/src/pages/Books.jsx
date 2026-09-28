import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { frontImage } from "../utils/bookImage";
import { useCart } from "../context/CartContext";
import {
  CLASS_OPTIONS,
  classShortLabel,
} from "../data/classes";
import "./Books.css";

function Books() {
  const { addToCart, isInCart } = useCart();
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedClass, setSelectedClass] = useState("All");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchBooks = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/products"
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Unable to load books");
        return;
      }

      setBooks(data.products || []);
      setMessage("");
    } catch (error) {
      console.error("Books error:", error);
      setMessage("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const categories = [
    "All",
    ...new Set(books.map((book) => book.category)),
  ];

  const filteredBooks = books
    .filter((book) => !book.status || book.status === "approved")
    .filter((book) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      book.title?.toLowerCase().includes(searchText) ||
      (book.description || "").toLowerCase().includes(searchText) ||
      (book.category || "").toLowerCase().includes(searchText) ||
      (book.class_name || "").toLowerCase().includes(searchText) ||
      (book.seller_name || "").toLowerCase().includes(searchText);

    const matchesCategory =
      category === "All" || book.category === category;

    const matchesClass =
      selectedClass === "All" ||
      book.class_name === selectedClass;

    return matchesSearch && matchesCategory && matchesClass;
  });

  const resetFilters = () => {
    setSearch("");
    setCategory("All");
    setSelectedClass("All");
  };

  return (
    <main className="books-page">

      {/* Decorative floating books */}
      <div className="books-floating-book floating-book-one">📘</div>
      <div className="books-floating-book floating-book-two">📕</div>
      <div className="books-floating-book floating-book-three">📗</div>

      {/* Header */}
      <section className="books-header">

        <div className="books-header-icon">
          📚
        </div>

        <p className="books-label">
          STUDENT BOOK MARKETPLACE
        </p>

        <h1 className="books-title">
          Discover <span>Books</span> 📖
        </h1>

        <p className="books-subtitle">
          Browse approved used books available from student sellers.
        </p>

        <div className="books-header-line"></div>

      </section>

      {/* Search + class sections stay fixed on top while
          the book list scrolls below (Flipkart style) */}
      <div className="books-sticky-top">

      {/* Search and Filter */}
      <section className="books-toolbar">

        <div className="search-wrapper">

          <span className="search-icon">
            🔍
          </span>

          <input
            type="text"
            placeholder="Search books, categories or sellers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search && (
            <button
              type="button"
              className="search-clear"
              onClick={() => setSearch("")}
            >
              ×
            </button>
          )}

        </div>

        <select
          className="category-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="clear-btn"
          onClick={resetFilters}
        >
          ↻ Clear
        </button>

      </section>

      {/* Class sections — small buttons, all visible in one row */}
      <section className="class-section">

        <p className="class-section-label">
          Browse by class
        </p>

        <div className="class-buttons">

          <button
            type="button"
            className={
              selectedClass === "All"
                ? "class-btn active"
                : "class-btn"
            }
            onClick={() => setSelectedClass("All")}
          >
            All
          </button>

          {CLASS_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={
                selectedClass === option
                  ? "class-btn active"
                  : "class-btn"
              }
              onClick={() => setSelectedClass(option)}
              title={option}
            >
              {classShortLabel(option)}
            </button>
          ))}

        </div>

      </section>

      </div>{/* books-sticky-top */}

      {/* Error Message */}
      {message && (
        <div className="books-message error-message">
          <span>⚠️</span>
          {message}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="books-status">

          <div className="loading-book-stack">
            <span>📕</span>
            <span>📗</span>
            <span>📘</span>
          </div>

          <h2>Loading Books...</h2>
          <p>Finding books available in the marketplace.</p>

        </div>
      ) : filteredBooks.length === 0 ? (

        /* Empty */
        <div className="books-status empty-status">

          <div className="empty-book">
            📕
          </div>

          <h2>No Books Found</h2>

          <p>
            Try another search or choose a different category.
          </p>

          <button
            type="button"
            className="empty-reset-button"
            onClick={resetFilters}
          >
            Show All Books
          </button>

        </div>

      ) : (

        <>

          {/* Result count */}
          <div className="books-results-bar">

            <div>
              <span className="results-small">
                MARKETPLACE COLLECTION
              </span>

              <p>
                Showing{" "}
                <strong>{filteredBooks.length}</strong>{" "}
                {filteredBooks.length === 1
                  ? "book"
                  : "books"}
              </p>
            </div>

            <div className="results-icon">
              📚
            </div>

          </div>

          {/* Books */}
          <section className="books-grid">

            {filteredBooks.map((book, index) => (

              <article
                className="book-card"
                key={book.id}
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
              >

                {/* Book Image */}
                <div className="book-image">

                  <div className="book-image-shine"></div>

                  {book.image_url ? (
                    <img
                      src={frontImage(book)}
                      alt={book.title}
                    />
                  ) : (
                    <div className="no-image">
                      <span>📚</span>
                      <p>No Image</p>
                    </div>
                  )}

                  <div className="book-condition-badge">
                    {book.condition}
                  </div>

                </div>

                {/* Card Content */}
                <div className="book-card-content">

                  <div className="book-category">
                    {book.category || "General"}
                  </div>

                  {book.class_name && (
                    <div className="book-class-chip">
                      🎓 {book.class_name}
                    </div>
                  )}

                  <h2 className="book-title">
                    {book.title}
                  </h2>

                  <div className="book-details">

                    <p>
                      <span>Condition</span>
                      <strong>
                        {book.condition}
                      </strong>
                    </p>

                    <p>
                      <span>Seller</span>
                      <strong>
                        {book.seller_name ||
                          "Student Seller"}
                      </strong>
                    </p>

                    <p>
                      <span>Location</span>
                      <strong>
                        {book.location ||
                          "Not provided"}
                      </strong>
                    </p>

                  </div>

                  {/* Pricing */}
                  <div className="book-pricing">

                    <div className="seller-price-row">
                      <span>
                        Seller Price
                      </span>

                      <strong>
                        ₹{book.seller_price}
                      </strong>
                    </div>

                    <div className="fee-row">
                      <span>
                        Platform Fee
                      </span>

                      <strong>
                        ₹{book.platform_fee ?? "0.00"}
                      </strong>
                    </div>

                    <div className="buyer-price-row">

                      <span>
                        Buyer Price
                      </span>

                      <strong>
                        ₹
                        {book.buyer_price ??
                          book.seller_price}
                      </strong>

                    </div>

                  </div>

                  {/* Details Button */}
                  <Link
                    className="view-details-btn"
                    to={`/books/${book.id}`}
                  >
                    <span>View Details</span>
                    <span className="details-arrow">
                      ↗
                    </span>
                  </Link>

                  <button
                    type="button"
                    className={
                      isInCart(book.id)
                        ? "add-cart-btn added"
                        : "add-cart-btn"
                    }
                    onClick={() => addToCart(book.id, book.seller_id)}
                    disabled={isInCart(book.id)}
                  >
                    {isInCart(book.id)
                      ? "✓ In Cart"
                      : "🛒 Add to Cart"}
                  </button>

                </div>

              </article>

            ))}

          </section>

        </>

      )}

    </main>
  );
}

export default Books;