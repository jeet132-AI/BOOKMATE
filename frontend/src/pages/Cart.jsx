import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart, isOwnBook } from "../context/CartContext";
import { frontImage } from "../utils/bookImage";
import "./Cart.css";

function Cart() {
  const navigate = useNavigate();
  const {
    items,
    removeFromCart,
    clearCart,
    showNotice,
  } = useCart();

  const [cartBooks, setCartBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removedNote, setRemovedNote] = useState("");

  useEffect(() => {
    if (items.length === 0) {
      setCartBooks([]);
      setLoading(false);
      return;
    }

    const fetchCartBooks = async () => {
      try {
        setLoading(true);
        setRemovedNote("");

        const results = await Promise.all(
          items.map(async (id) => {
            try {
              const response = await fetch(
                `http://localhost:5000/api/products/${id}`
              );
              const data = await response.json();

              if (!response.ok) return null;
              return data.product || null;
            } catch {
              return null;
            }
          })
        );

        const available = results.filter(Boolean);
        const removedCount =
          items.length - available.length;

        if (removedCount > 0) {
          // Sold or removed books leave the cart automatically
          const availableIds = new Set(
            available.map((book) => Number(book.id))
          );
          items.forEach((id) => {
            if (!availableIds.has(Number(id))) {
              removeFromCart(id);
            }
          });

          setRemovedNote(
            `${removedCount} book${removedCount === 1 ? " is" : "s are"} no longer available and ${removedCount === 1 ? "was" : "were"} removed from your cart.`
          );
        }

        setCartBooks(available);
      } finally {
        setLoading(false);
      }
    };

    fetchCartBooks();
  }, [items.length]);

  const total = cartBooks.reduce(
    (sum, book) =>
      sum + Number(book.buyer_price || book.seller_price || 0),
    0
  );

  const handleBuyNow = (book) => {
    if (book && isOwnBook(book.seller_id)) {
      showNotice(
        "This is your own book — you cannot buy it."
      );
      removeFromCart(book.id);
      return;
    }

    navigate(`/checkout/${book?.id ?? book}`);
  };

  return (
    <main className="cart-page">
      <section className="cart-header">
        <p className="cart-label">
          YOUR SHOPPING CART
        </p>

        <h1>
          My <span>Cart</span>
        </h1>

        <p className="cart-subtitle">
          Review your books and buy them
          one by one through secure checkout.
        </p>

        <div className="cart-header-line"></div>
      </section>

      {removedNote && (
        <div className="cart-note">
          ⚠️ {removedNote}
        </div>
      )}

      {loading ? (
        <section className="cart-loading">
          <div className="cart-spinner"></div>
          <h2>Loading Your Cart...</h2>
        </section>
      ) : cartBooks.length === 0 ? (
        <section className="cart-empty">
          <div className="cart-empty-icon">🛒</div>

          <p className="cart-empty-label">
            CART IS EMPTY
          </p>

          <h2>Nothing Here Yet</h2>

          <p>
            Add books from Home or the
            Books page, then buy them
            through checkout.
          </p>

          <Link to="/books">
            <button
              type="button"
              className="cart-primary-button"
            >
              📚 Browse Books
              <span>→</span>
            </button>
          </Link>
        </section>
      ) : (
        <>
          <section className="cart-list">
            {cartBooks.map((book) => (
              <article
                className="cart-card"
                key={book.id}
              >
                <Link
                  to={`/books/${book.id}`}
                  className="cart-card-photo"
                >
                  {frontImage(book) ? (
                    <img
                      src={frontImage(book)}
                      alt={book.title}
                    />
                  ) : (
                    "📚"
                  )}
                </Link>

                <div className="cart-card-info">
                  <p className="cart-card-category">
                    {book.category || "General"}
                    {book.class_name
                      ? ` • ${book.class_name}`
                      : ""}
                  </p>

                  <h2>
                    <Link
                      to={`/books/${book.id}`}
                    >
                      {book.title}
                    </Link>
                  </h2>

                  <p className="cart-card-price">
                    ₹
                    {Number(
                      book.buyer_price ||
                        book.seller_price ||
                        0
                    ).toFixed(0)}
                  </p>

                  <div className="cart-card-actions">
                    <button
                      type="button"
                      className="cart-buy-button"
                      onClick={() =>
                        handleBuyNow(book)
                      }
                    >
                      🛒 Buy Now
                    </button>

                    <button
                      type="button"
                      className="cart-remove-button"
                      onClick={() =>
                        removeFromCart(book.id)
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <section className="cart-summary">
            <div>
              <span>
                {cartBooks.length}{" "}
                {cartBooks.length === 1
                  ? "book"
                  : "books"}{" "}
                in cart
              </span>
              <strong>
                Total: ₹{total.toFixed(0)}
              </strong>
            </div>

            <button
              type="button"
              className="cart-clear-button"
              onClick={clearCart}
            >
              Clear Cart
            </button>
          </section>
        </>
      )}
    </main>
  );
}

export default Cart;
