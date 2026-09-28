import { Link } from "react-router-dom";
import { frontImage } from "../utils/bookImage";
import "./BookCard.css";

function BookCard({ book }) {
  const photo = frontImage(book);

  return (
    <div className="book-card">
      <div className="book-image">
        {photo ? (
          <img
            src={photo}
            alt={book.title}
          />
        ) : (
          <span>📚</span>
        )}
      </div>

      <h3>{book.title}</h3>

      <p>Category: {book.category}</p>

      <p>Condition: {book.condition}</p>

      <p>Seller Price: ₹{book.sellerPrice ?? book.seller_price}</p>

      <p>Buyer Price: ₹{book.buyerPrice ?? book.buyer_price}</p>

    <Link to={`/books/${book.id}`}>
        <button>
        View Details
        </button>
    </Link>
    </div>
  );
}

export default BookCard;
