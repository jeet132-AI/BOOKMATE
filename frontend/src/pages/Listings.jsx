import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { bookImageUrl } from "../utils/bookImage";
import "./Listings.css";

function Listings() {
  const [listings, setListings] = useState([]);
  const [message, setMessage] = useState("");

  const [expandedListingId, setExpandedListingId] =
    useState(null);

  const [listingImages, setListingImages] =
    useState({});

  const [loadingImages, setLoadingImages] =
    useState(null);

  useEffect(() => {
    const fetchListings = async () => {
      const token =
        localStorage.getItem("token");

      if (!token) {
        setMessage("Please login first");
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:5000/api/products/my",
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          setMessage(
            data.message ||
              "Unable to load listings"
          );
          return;
        }

        setListings(
          data.products || []
        );
      } catch (error) {
        console.error(
          "Listings error:",
          error
        );

        setMessage(
          "Unable to connect to server"
        );
      }
    };

    fetchListings();
  }, []);

  async function handleListingImages(
    productId
  ) {
    // Close the currently opened listing
    if (
      expandedListingId === productId
    ) {
      setExpandedListingId(null);
      return;
    }

    // If files were already loaded,
    // simply open the listing.
    if (listingImages[productId]) {
      setExpandedListingId(productId);
      return;
    }

    try {
      setLoadingImages(productId);

      const token =
        localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/products/${productId}/images`,
        {
          method: "GET",

          headers: token
            ? {
                Authorization:
                  `Bearer ${token}`,
              }
            : {},
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Unable to load book files"
        );
        return;
      }

      setListingImages(
        (previousImages) => ({
          ...previousImages,
          [productId]:
            data.images || [],
        })
      );

      setExpandedListingId(productId);
    } catch (error) {
      console.error(
        "Listing files error:",
        error
      );

      setMessage(
        "Unable to load book files"
      );
    } finally {
      setLoadingImages(null);
    }
  }

  return (
    <main className="listings-page">

      {/* Background Effects */}

      <div className="listings-glow listings-glow-one"></div>

      <div className="listings-glow listings-glow-two"></div>

      <div className="floating-listing-book floating-book-one">
        📚
      </div>

      <div className="floating-listing-book floating-book-two">
        📖
      </div>

      {/* Header */}

      <section className="listings-header">

        <div className="listings-icon">
          📚
        </div>

        <p className="listings-label">
          STUDENT MARKETPLACE
        </p>

        <h1>
          My <span>Listings</span>
        </h1>

        <p className="listings-subtitle">
          Manage the books you are selling and track their approval status.
        </p>

      </section>

      {/* Top Action */}

      <section className="listings-toolbar">

        <div>

          <p className="toolbar-label">
            YOUR BOOKS
          </p>

          <h2>
            Books You Are Selling
          </h2>

        </div>

        <Link
          className="add-listing"
          to="/sell"
        >
          <span>＋</span>
          Add New Book
        </Link>

      </section>

      {/* Message */}

      {message && (
        <div className="listings-message">

          <span>⚠️</span>

          <p>{message}</p>

        </div>
      )}

      {/* Listings */}

      {listings.length > 0 ? (

        <section className="listings-list">

          {listings.map(
            (listing, index) => {

              const images =
                listingImages[
                  listing.id
                ] || [];

              const isExpanded =
                expandedListingId ===
                listing.id;

              // Find the PDF file
              const pdfFile =
                images.find(
                  (image) =>
                    image.image_url &&
                    image.image_url
                      .toLowerCase()
                      .endsWith(".pdf")
                );

              // Back image is the second uploaded file
              const backImage =
                images.length > 1 &&
                images[1]?.image_url &&
                !images[1].image_url
                  .toLowerCase()
                  .endsWith(".pdf")
                  ? images[1]
                  : null;

              return (
                <div
                  className="listing-card"
                  key={listing.id}
                  style={{
                    "--listing-delay":
                      `${index * 0.12}s`,
                  }}
                >

                  {/* Card Top */}

                  <div className="listing-card-top">

                    <div className="listing-book-icon">
                      📖
                    </div>

                    <span
                      className={`listing-status ${
                        listing.status
                          ? listing.status.toLowerCase()
                          : ""
                      }`}
                    >
                      {listing.status ||
                        "Pending"}
                    </span>

                  </div>

                  {/* FRONT IMAGE */}

                  {listing.image_url ? (

                    <img
                      src={
                        bookImageUrl(listing.image_url)
                      }
                      alt={`${listing.title} front cover`}
                      className="listing-book-image"
                    />

                  ) : (

                    <div className="listing-book-image-placeholder">
                      📖
                    </div>

                  )}

                  {/* Title */}

                  <div className="listing-card-content">

                    <h2>
                      {listing.title}
                    </h2>

                    <div className="listing-category">
                      📚 {listing.category}
                    </div>

                    {listing.class_name && (
                      <div className="listing-category">
                        🎓 {listing.class_name}
                      </div>
                    )}

                  </div>

                  {/* Details */}

                  <div className="listing-details">

                    <div className="listing-detail">

                      <span className="detail-icon">
                        ⭐
                      </span>

                      <div>

                        <small>
                          CONDITION
                        </small>

                        <strong>
                          {listing.condition}
                        </strong>

                      </div>

                    </div>

                    <div className="listing-detail">

                      <span className="detail-icon">
                        💰
                      </span>

                      <div>

                        <small>
                          SELLER PRICE
                        </small>

                        <strong className="price">
                          ₹{listing.seller_price}
                        </strong>

                      </div>

                    </div>

                    <div className="listing-detail">

                      <span className="detail-icon">
                        📍
                      </span>

                      <div>

                        <small>
                          LOCATION
                        </small>

                        <strong>
                          {listing.location}
                        </strong>

                      </div>

                    </div>

                  </div>

                  {/* EXTRA BOOK FILES */}

                  {isExpanded && (

                    <div className="listing-extra-images">

                      <div className="listing-extra-images-heading">

                        <span>
                          BOOK DETAILS
                        </span>

                        <small>
                          Back Photo & PDF
                        </small>

                      </div>

                      <div className="listing-extra-images-grid">

                        {/* BACK OF BOOK */}

                        {backImage && (

                          <div className="listing-extra-image-card">

                            <img
                              src={bookImageUrl(backImage.image_url)}
                              alt={`${listing.title} back cover`}
                              className="listing-extra-image"
                            />

                            <span>
                              Back of Book
                            </span>

                          </div>

                        )}

                        {/* BOOK PDF */}

                        {pdfFile && (

                          <div className="listing-extra-image-card listing-pdf-card">

                            <div className="listing-pdf-icon">
                              📄
                            </div>

                            <strong>
                              Book PDF
                            </strong>

                            <a
                              href={bookImageUrl(pdfFile.image_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="listing-pdf-button"
                            >
                              Open PDF →
                            </a>

                          </div>

                        )}

                        {/* FILE WARNING */}

                        {(!backImage || !pdfFile) && (

                          <p className="listing-images-warning">
                            Some book files are not available.
                          </p>

                        )}

                      </div>

                    </div>

                  )}

                  {/* Bottom */}

                  <div className="listing-card-bottom">

                    <span>
                      Listing ID: #{listing.id}
                    </span>

                    <button
                      type="button"
                      className="listing-details-button"
                      onClick={() =>
                        handleListingImages(
                          listing.id
                        )
                      }
                      aria-label={
                        isExpanded
                          ? "Hide book details"
                          : "See book details"
                      }
                    >
                      {loadingImages ===
                      listing.id
                        ? "Loading..."
                        : isExpanded
                        ? "Hide details"
                        : "See in details"}
                    </button>

                  </div>

                </div>
              );
            }
          )}

        </section>

      ) : (

        !message && (

          <section className="empty-listings">

            <div className="empty-icon">
              📚
            </div>

            <h2>
              No Listings Yet
            </h2>

            <p>
              You haven't listed any books for sale yet.
            </p>

            <Link
              to="/sell"
              className="empty-add-button"
            >
              Sell Your First Book →
            </Link>

          </section>

        )

      )}

      {/* Bottom */}

      <section className="listings-footer">

        <div className="footer-icon">
          📖
        </div>

        <div>

          <p>
            GIVE YOUR BOOK A SECOND LIFE
          </p>

          <h2>
            Ready to sell another book?
          </h2>

        </div>

        <Link
          to="/sell"
          className="footer-sell-button"
        >
          List Another Book
          <span>→</span>
        </Link>

      </section>

      {/* Back */}

      <div className="back-dashboard-wrapper">

        <Link
          className="back-dashboard"
          to="/dashboard"
        >
          ← Back to Dashboard
        </Link>

      </div>

    </main>
  );
}

export default Listings;