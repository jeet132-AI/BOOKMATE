import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { frontImage } from "../utils/bookImage";
import { useCart, isOwnBook } from "../context/CartContext";
import "./Home.css";

function Home() {
  const navigate = useNavigate();
  const dealsRowRef = useRef(null);
  const { addToCart, isInCart, showNotice } = useCart();

  const isLoggedIn = Boolean(
    localStorage.getItem("token")
  );

  const [deals, setDeals] = useState([]);
  const [dealsLoading, setDealsLoading] = useState(true);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/products"
        );
        const data = await response.json();

        if (response.ok) {
          setDeals(
            (data.products || []).slice(0, 10)
          );
        }
      } catch (error) {
        console.error("Home deals error:", error);
      } finally {
        setDealsLoading(false);
      }
    };

    fetchDeals();
  }, []);

  const scrollDeals = (direction) => {
    dealsRowRef.current?.scrollBy({
      left: direction * 340,
      behavior: "smooth",
    });
  };

  const allBooks = deals.slice(0, 20);

  const handleBuyNow = (book) => {
    const bookId = book?.id ?? book;

    if (book && isOwnBook(book.seller_id)) {
      showNotice(
        "This is your own book — you cannot buy it."
      );
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    navigate(`/checkout/${bookId}`);
  };

  const renderStars = (avgRating) => {
    if (!avgRating) return null;

    const full = Math.round(Number(avgRating));
    return "★".repeat(full) + "☆".repeat(5 - full);
  };

  return (
    <div className="home-page">

      {/* ================= HERO ================= */}
      <section className="home-hero">
        <div className="hero-content">

          <div className="hero-badge">
            📚 A STUDENT-TO-STUDENT BOOK MARKETPLACE
          </div>

          <h1>
            Buy. Sell.
            <span> Reuse & Help.</span>
          </h1>

          <p className="hero-description">
            Buy affordable used books, sell the books you no longer need,
            and give another student a chance to learn from them.
          </p>

          <div className="hero-buttons">
            <Link to="/books" className="hero-btn primary-btn">
              Explore Books →
            </Link>

            <span className="guest-join-wrap">
              {!isLoggedIn && (
                <>
                  <span
                    className="pointing-hand"
                    aria-hidden="true"
                  >
                    👉
                  </span>

                  <span className="hint-bubble">
                    Login / Register here!
                  </span>
                </>
              )}

              <Link
                to="/register"
                className="hero-btn secondary-btn"
              >
                Join the Marketplace
              </Link>
            </span>
          </div>

          <div className="hero-stats">
            <div>
              <strong>BUY</strong>
              <span>Affordable books</span>
            </div>

            <div>
              <strong>SELL</strong>
              <span>Unused books</span>
            </div>

            <div>
              <strong>REUSE</strong>
              <span>Help another student</span>
            </div>
          </div>

        </div>

        <div className="hero-visual">

          <div className="hero-circle"></div>

          <div className="floating-book book-one">
            📕
          </div>

          <div className="floating-book book-two">
            📗
          </div>

          <div className="floating-book book-three">
            📘
          </div>

          <img
            src="/images/student-reading-hero.png"
            alt="Student reading a used book"
            className="student-reading-image"
          />

        </div>
      </section>


      {/* ================= TOP BOOK DEALS (Flipkart style) ================= */}
      <section className="deals-section">

        <div className="deals-header">

          <div>
            <p className="deals-label">
              REAL STUDENT LISTINGS
            </p>

            <h2>
              Top Books <span>For You</span>
            </h2>
          </div>

          <div className="deals-nav">

            <Link
              to="/books"
              className="view-all-books"
            >
              View All →
            </Link>

            <button
              type="button"
              className="deals-arrow"
              onClick={() => scrollDeals(-1)}
              aria-label="Scroll books left"
            >
              ‹
            </button>

            <button
              type="button"
              className="deals-arrow"
              onClick={() => scrollDeals(1)}
              aria-label="Scroll books right"
            >
              ›
            </button>

          </div>

        </div>

        {dealsLoading ? (
          <p className="deals-status">
            Loading top books...
          </p>
        ) : deals.length === 0 ? (
          <p className="deals-status">
            New books are on the way.{" "}
            <Link to="/books">Browse all books →</Link>
          </p>
        ) : (
          <div
            className="deals-row"
            ref={dealsRowRef}
          >
            {deals.map((book) => (
              <article
                className="deal-card"
                key={book.id}
              >
                <Link
                  to={`/books/${book.id}`}
                  className="deal-image"
                >
                  {frontImage(book) ? (
                    <img
                      src={frontImage(book)}
                      alt={book.title}
                      loading="lazy"
                    />
                  ) : (
                    <span>📚</span>
                  )}
                </Link>

                <p className="deal-category">
                  {book.category || "General"}
                </p>

                <h3>
                  <Link to={`/books/${book.id}`}>
                    {book.title}
                  </Link>
                </h3>

                {book.avg_rating ? (
                  <p className="deal-rating">
                    <span className="deal-stars">
                      {renderStars(book.avg_rating)}
                    </span>
                    <span>
                      {Number(book.avg_rating).toFixed(1)} (
                      {book.review_count})
                    </span>
                  </p>
                ) : (
                  <p className="deal-rating deal-new">
                    ✨ New listing
                  </p>
                )}

                <p className="deal-price">
                  ₹{Number(book.buyer_price).toFixed(0)}
                </p>

                <button
                  type="button"
                  className="deal-buy-button"
                  onClick={() => handleBuyNow(book)}
                >
                  🛒 Buy Now
                </button>

                <button
                  type="button"
                  className={
                    isInCart(book.id)
                      ? "deal-cart-button added"
                      : "deal-cart-button"
                  }
                  onClick={() => addToCart(book.id, book.seller_id)}
                  disabled={isInCart(book.id)}
                >
                  {isInCart(book.id)
                    ? "✓ In Cart"
                    : "＋ Add to Cart"}
                </button>
              </article>
            ))}
          </div>
        )}

      </section>


      {/* ================= ALL BOOKS (20-book grid, click for details) ================= */}
      <section className="all-books-section">

        <div className="section-heading">
          <span>MARKETPLACE COLLECTION</span>

          <h2>
            Explore <span>All Books</span>
          </h2>

          <p>
            Tap any book to see full details,
            then buy or add it to your cart.
          </p>
        </div>

        {dealsLoading ? (
          <p className="deals-status">
            Loading books...
          </p>
        ) : allBooks.length === 0 ? (
          <p className="deals-status">
            New books are on the way.{" "}
            <Link to="/books">Browse all books →</Link>
          </p>
        ) : (
          <>
            <div className="all-books-grid">
              {allBooks.map((book) => (
                <article
                  className="deal-card"
                  key={book.id}
                >
                  <Link
                    to={`/books/${book.id}`}
                    className="deal-image"
                  >
                    {frontImage(book) ? (
                      <img
                        src={frontImage(book)}
                        alt={book.title}
                        loading="lazy"
                      />
                    ) : (
                      <span>📚</span>
                    )}
                  </Link>

                  <p className="deal-category">
                    {book.category || "General"}
                  </p>

                  <h3>
                    <Link to={`/books/${book.id}`}>
                      {book.title}
                    </Link>
                  </h3>

                  {book.avg_rating ? (
                    <p className="deal-rating">
                      <span className="deal-stars">
                        {renderStars(book.avg_rating)}
                      </span>
                      <span>
                        {Number(book.avg_rating).toFixed(1)} (
                        {book.review_count})
                      </span>
                    </p>
                  ) : (
                    <p className="deal-rating deal-new">
                      ✨ New listing
                    </p>
                  )}

                  <p className="deal-price">
                    ₹{Number(book.buyer_price).toFixed(0)}
                  </p>

                  <button
                    type="button"
                    className="deal-buy-button"
                    onClick={() => handleBuyNow(book)}
                  >
                    🛒 Buy Now
                  </button>

                  <button
                    type="button"
                    className={
                      isInCart(book.id)
                        ? "deal-cart-button added"
                        : "deal-cart-button"
                    }
                    onClick={() => addToCart(book.id, book.seller_id)}
                    disabled={isInCart(book.id)}
                  >
                    {isInCart(book.id)
                      ? "✓ In Cart"
                      : "＋ Add to Cart"}
                  </button>
                </article>
              ))}
            </div>

            <div className="all-books-more">
              <Link
                to="/books"
                className="hero-btn primary-btn"
              >
                View All Books →
              </Link>
            </div>
          </>
        )}

      </section>


      {/* ================= WHAT IS USED BOOK MARKET ================= */}
      <section className="purpose-section">

        <div className="section-heading">
          <span>WHY THIS WEBSITE?</span>

          <h2>
            What is <span>Used Book Market?</span>
          </h2>

          <p>
            A simple marketplace where students can buy and sell
            used books and study materials.
          </p>
        </div>

        <div className="purpose-grid">

          <div className="purpose-card">
            <div className="purpose-icon">🛒</div>

            <h3>Buy Used Books</h3>

            <p>
              Find useful books at affordable prices instead of
              buying everything new.
            </p>
          </div>

          <div className="purpose-card">
            <div className="purpose-icon">💰</div>

            <h3>Sell Your Books</h3>

            <p>
              Finished your semester? Sell your old books
              and recover some of your money.
            </p>
          </div>

          <div className="purpose-card">
            <div className="purpose-icon">🤝</div>

            <h3>Help Another Student</h3>

            <p>
              Your old book can become another student's
              useful learning resource.
            </p>
          </div>

        </div>

      </section>


      {/* ================= HOW IT WORKS ================= */}
      <section className="how-section">

        <div className="section-heading">
          <span>HOW IT WORKS</span>

          <h2>
            From <span>One Student</span> To Another
          </h2>

          <p>
            The marketplace makes the complete process simple.
          </p>
        </div>

        <div className="journey">

          <div className="journey-line"></div>

          <div className="journey-step">
            <div className="journey-number">01</div>

            <div className="journey-icon">🔎</div>

            <h3>Find a Book</h3>

            <p>
              Search for the book or study material
              you need.
            </p>
          </div>

          <div className="journey-step">
            <div className="journey-number">02</div>

            <div className="journey-icon">📖</div>

            <h3>Buy & Read</h3>

            <p>
              Purchase an affordable used book
              and use it for your studies.
            </p>
          </div>

          <div className="journey-step">
            <div className="journey-number">03</div>

            <div className="journey-icon">💵</div>

            <h3>Sell Again</h3>

            <p>
              After finishing your studies,
              list the book for another student.
            </p>
          </div>

          <div className="journey-step">
            <div className="journey-number">04</div>

            <div className="journey-icon">❤️</div>

            <h3>Help Someone</h3>

            <p>
              Your old book continues its journey
              and helps another learner.
            </p>
          </div>

        </div>

      </section>


      {/* ================= BUY SELL REUSE ================= */}
      <section className="action-section">

        <div className="section-heading">
          <span>ONE MARKETPLACE</span>

          <h2>
            Buy. Sell. <span>Reuse.</span>
          </h2>

          <p>
            Everything you need to give your books another life.
          </p>
        </div>

        <div className="action-grid">

          <div className="action-card buy-card">
            <div className="action-large-icon">
              🛍️
            </div>

            <div>
              <span className="action-label">
                FOR BUYERS
              </span>

              <h3>Find affordable books</h3>

              <p>
                Search books by subject, category,
                condition and price.
              </p>

              <Link to="/books">
                Browse Books →
              </Link>
            </div>
          </div>


          <div className="action-card sell-card">
            <div className="action-large-icon">
              📚
            </div>

            <div>
              <span className="action-label">
                FOR SELLERS
              </span>

              <h3>Give your books a second life</h3>

              <p>
                List your used books and make them
                useful for another student.
              </p>

              <Link to="/sell">
                Sell a Book →
              </Link>
            </div>
          </div>


          <div className="action-card reuse-card">
            <div className="action-large-icon">
              ♻️
            </div>

            <div>
              <span className="action-label">
                FOR EVERYONE
              </span>

              <h3>Keep learning materials moving</h3>

              <p>
                One book can be useful to several
                students throughout its life.
              </p>

              <Link to="/register">
                Join Us →
              </Link>
            </div>
          </div>

        </div>

      </section>


      {/* ================= SAMPLE BOOKS ================= */}
      <section className="books-section">

        <div className="section-heading books-heading">

          <div>
            <span>SAMPLE BOOKS</span>

            <h2>
              Books Students <span>Need</span>
            </h2>

            <p>
              These are examples of the type of books
              you can find on the marketplace.
            </p>
          </div>

          <Link to="/books" className="view-all-books">
            View All Books →
          </Link>

        </div>


        <div className="sample-books-grid">

          <div className="sample-book-card">

            <div className="book-cover operating-system">
              <span>💻</span>

              <strong>
                OPERATING
                <br />
                SYSTEM
              </strong>

              <small>
                COMPUTER SCIENCE
              </small>
            </div>

            <div className="sample-book-info">
              <span>Programming</span>

              <h3>Operating System</h3>

              <p>Good condition</p>

              <strong>₹120</strong>
            </div>

          </div>


          <div className="sample-book-card">

            <div className="book-cover dbms">
              <span>🗄️</span>

              <strong>
                DATABASE
                <br />
                MANAGEMENT
              </strong>

              <small>
                COMPUTER SCIENCE
              </small>
            </div>

            <div className="sample-book-info">
              <span>Database</span>

              <h3>Database Management</h3>

              <p>Like New</p>

              <strong>₹170</strong>
            </div>

          </div>


          <div className="sample-book-card">

            <div className="book-cover networks">
              <span>🌐</span>

              <strong>
                COMPUTER
                <br />
                NETWORKS
              </strong>

              <small>
                NETWORKING
              </small>
            </div>

            <div className="sample-book-info">
              <span>Networking</span>

              <h3>Computer Networks</h3>

              <p>Used condition</p>

              <strong>₹100</strong>
            </div>

          </div>


          <div className="sample-book-card">

            <div className="book-cover mathematics">
              <span>∑</span>

              <strong>
                ENGINEERING
                <br />
                MATHEMATICS
              </strong>

              <small>
                ENGINEERING
              </small>
            </div>

            <div className="sample-book-info">
              <span>Mathematics</span>

              <h3>Engineering Mathematics</h3>

              <p>Good condition</p>

              <strong>₹150</strong>
            </div>

          </div>

        </div>

      </section>


      {/* ================= STORY SECTION ================= */}
      <section className="story-section">

        <div className="story-visual">

          <div className="story-circle"></div>

          <div className="story-student">
            👨‍🎓
          </div>

          <div className="story-book">
            📚
          </div>

          <div className="story-heart">
            ❤️
          </div>

        </div>


        <div className="story-content">

          <span className="story-label">
            THE IDEA BEHIND THE MARKET
          </span>

          <h2>
            Read it.
            <br />
            Reuse it.
            <br />
            <span>Help someone else.</span>
          </h2>

          <p>
            Imagine a student buying a book for ₹100.
            After completing the semester, instead of
            leaving the book unused, the student can
            sell it to another learner.
          </p>

          <p>
            The same book can continue helping students
            instead of sitting unused on a shelf.
          </p>

          <div className="story-flow">

            <div>
              <strong>01</strong>
              <span>Student buys</span>
            </div>

            <div className="flow-arrow">→</div>

            <div>
              <strong>02</strong>
              <span>Student learns</span>
            </div>

            <div className="flow-arrow">→</div>

            <div>
              <strong>03</strong>
              <span>Student sells</span>
            </div>

            <div className="flow-arrow">→</div>

            <div>
              <strong>04</strong>
              <span>Another student learns</span>
            </div>

          </div>

        </div>

      </section>


      {/* ================= CATEGORIES ================= */}
      <section className="category-section">

        <div className="section-heading">

          <span>EXPLORE</span>

          <h2>
            Find Books By <span>Category</span>
          </h2>

          <p>
            Explore different study materials in one place.
          </p>

        </div>


        <div className="category-grid">

          <Link to="/category/programming" className="category-card">
            <span>💻</span>
            <strong>Programming</strong>
            <small>Software & Coding</small>
          </Link>

          <Link to="/category/engineering" className="category-card">
            <span>⚙️</span>
            <strong>Engineering</strong>
            <small>Engineering Subjects</small>
          </Link>

          <Link to="/category/medical" className="category-card">
            <span>🩺</span>
            <strong>Medical</strong>
            <small>Medical Studies</small>
          </Link>

          <Link to="/category/mathematics" className="category-card">
            <span>📐</span>
            <strong>Mathematics</strong>
            <small>Math & Calculations</small>
          </Link>

          <Link to="/category/exam-prep" className="category-card">
            <span>🎯</span>
            <strong>Exam Prep</strong>
            <small>Competitive Exams</small>
          </Link>

          <Link to="/category/study-notes" className="category-card">
            <span>📝</span>
            <strong>Study Notes</strong>
            <small>Notes & Materials</small>
          </Link>

        </div>

      </section>


      {/* ================= FINAL CTA ================= */}
      <section className="final-cta">

        <div className="final-cta-content">

          <span>
            START YOUR BOOK JOURNEY
          </span>

          <h2>
            Your next useful book
            <br />
            could already be here.
          </h2>

          <p>
            Explore books, sell what you no longer need,
            and become part of a student-powered marketplace.
          </p>

          <div className="final-buttons">

            <Link to="/books" className="final-primary">
              Explore Books →
            </Link>

            <Link to="/register" className="final-secondary">
              Create Account
            </Link>

          </div>

        </div>

      </section>


      {/* ================= FOOTER (Flipkart style) ================= */}
      <footer className="site-footer">

        <div className="site-footer-grid">

          <div className="site-footer-col">
            <h4>ABOUT</h4>
            <ul>
              <li><span>Contact Us</span></li>
              <li><span>About Us</span></li>
              <li><Link to="/sell">Sell Your Books</Link></li>
              <li><Link to="/books">Buy Books</Link></li>
              <li><span>Press</span></li>
            </ul>
          </div>

          <div className="site-footer-col">
            <h4>MARKETPLACE</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/books">Books</Link></li>
              <li><Link to="/sell">Sell</Link></li>
              <li><Link to="/wishlist">Wishlist</Link></li>
              <li><Link to="/cart">Cart</Link></li>
              <li><Link to="/orders">Orders</Link></li>
            </ul>
          </div>

          <div className="site-footer-col">
            <h4>HELP</h4>
            <ul>
              <li><span>Payments</span></li>
              <li><span>Shipping</span></li>
              <li><span>Cancellation & Returns</span></li>
              <li><span>FAQ</span></li>
            </ul>
          </div>

          <div className="site-footer-col">
            <h4>CONSUMER POLICY</h4>
            <ul>
              <li><span>Cancellation & Returns</span></li>
              <li><span>Terms Of Use</span></li>
              <li><span>Security</span></li>
              <li><span>Privacy</span></li>
              <li><span>Sitemap</span></li>
              <li><span>Grievance Redressal</span></li>
            </ul>
          </div>

          <div className="site-footer-col site-footer-contact">
            <h4 className="site-footer-contact-heading">
              Mail Us:
            </h4>
            <p>
              Used Book Market,
              <br />
              College Street,
              <br />
              Kolkata, 700073,
              <br />
              West Bengal, India
            </p>

            <h4 className="site-footer-contact-heading">
              Social:
            </h4>
            <div className="site-footer-social">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.1-.1-2.1-.1-2.1 0-3.6 1.3-3.6 3.7V11H8.2v3h2.5v7h2.8z" />
                </svg>
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M17.8 4h2.7l-6 6.8L21.5 20h-5.6l-4.3-5.6L6.6 20H3.9l6.4-7.3L3.6 4H9.3l3.9 5.1L17.8 4zm-1 14.3h1.5L8.1 5.6H6.5l10.3 12.7z" />
                </svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                  <path d="M21.6 7.2c-.2-1.2-1.1-2.1-2.3-2.3C17.3 4.5 12 4.5 12 4.5s-5.3 0-7.3.4c-1.2.2-2.1 1.1-2.3 2.3C2 9.2 2 12 2 12s0 2.8.4 4.8c.2 1.2 1.1 2.1 2.3 2.3 2 .4 7.3.4 7.3.4s5.3 0 7.3-.4c1.2-.2 2.1-1.1 2.3-2.3.4-2 .4-4.8.4-4.8s0-2.8-.4-4.8zM10 15.2V8.8L15.5 12 10 15.2z" />
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M12 8.8A3.2 3.2 0 1 0 12 15.2 3.2 3.2 0 0 0 12 8.8zm0-2.1a5.3 5.3 0 1 1 0 10.6 5.3 5.3 0 0 1 0-10.6zm6.8-.3a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0zM12 4.2c-2.5 0-2.9 0-3.9.1-1 .1-1.6.2-2.1.4-.6.2-1 .5-1.4.9-.4.4-.7.8-.9 1.4-.2.5-.3 1.1-.4 2.1-.1 1-.1 1.4-.1 3.9s0 2.9.1 3.9c.1 1 .2 1.6.4 2.1.2.6.5 1 .9 1.4.4.4.8.7 1.4.9.5.2 1.1.3 2.1.4 1 .1 1.4.1 3.9.1s2.9 0 3.9-.1c1-.1 1.6-.2 2.1-.4.6-.2 1-.5 1.4-.9.4-.4.7-.8.9-1.4.2-.5.3-1.1.4-2.1.1-1 .1-1.4.1-3.9s0-2.9-.1-3.9c-.1-1-.2-1.6-.4-2.1-.2-.6-.5-1-.9-1.4-.4-.4-.8-.7-1.4-.9-.5-.2-1.1-.3-2.1-.4-1-.1-1.4-.1-3.9-.1z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="site-footer-col site-footer-contact">
            <h4 className="site-footer-contact-heading">
              Registered Office Address:
            </h4>
            <p>
              Used Book Market,
              <br />
              College Street,
              <br />
              Kolkata, 700073,
              <br />
              West Bengal, India
              <br />
              Telephone:{" "}
              <a href="tel:03345670000">
                033-45670000
              </a>
            </p>
          </div>

        </div>

      </footer>


      {/* ================= FOOTER MESSAGE ================= */}
      <section className="home-bottom">

        <h3>
          USED BOOK MARKET
        </h3>

        <p>
          Buy • Sell • Reuse • Help — © 2026
        </p>

      </section>

    </div>
  );
}


export default Home;
