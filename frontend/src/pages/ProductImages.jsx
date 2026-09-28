import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { bookImageUrl } from "../utils/bookImage";

function ProductImages() {
  const { productId } = useParams();

  const [images, setImages] = useState([]);
  const [imageUrl, setImageUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchImages = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `http://localhost:5000/api/products/${productId}/images`
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Unable to load product images."
        );
        return;
      }

      setImages(data.images || []);
      setMessage("");
    } catch (error) {
      console.error(
        "Product images error:",
        error
      );

      setMessage(
        "Unable to connect to server."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchImages();
    }
  }, [productId]);

  const handleAddImage = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      setMessage(
        "Please login first."
      );
      return;
    }

    if (!imageUrl.trim()) {
      setMessage(
        "Image URL is required."
      );
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      const response = await fetch(
        `http://localhost:5000/api/products/${productId}/images`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            image_url: imageUrl.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Unable to add image."
        );
        return;
      }

      setMessage(
        "Product image added successfully."
      );

      setImageUrl("");

      await fetchImages();
    } catch (error) {
      console.error(
        "Add image error:",
        error
      );

      setMessage(
        "Unable to connect to server."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage(
        "Please login first."
      );
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this image?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/products/${productId}/images/${imageId}`,
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
            "Unable to delete image."
        );
        return;
      }

      setMessage(
        "Product image deleted successfully."
      );

      setImages((current) =>
        current.filter(
          (image) =>
            image.id !== imageId
        )
      );
    } catch (error) {
      console.error(
        "Delete image error:",
        error
      );

      setMessage(
        "Unable to connect to server."
      );
    }
  };

  if (!productId) {
    return (
      <div>
        <h1>Product Images</h1>

        <p>
          No product selected.
        </p>

        <Link to="/listings">
          <button type="button">
            Back to Listings
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1>Product Images</h1>

      <p>
        Product ID: #{productId}
      </p>

      {message && (
        <p>{message}</p>
      )}

      <hr />

      <h2>
        Add Image
      </h2>

      <form onSubmit={handleAddImage}>
        <input
          type="url"
          placeholder="Enter image URL"
          value={imageUrl}
          onChange={(e) =>
            setImageUrl(
              e.target.value
            )
          }
          required
        />

        {" "}

        <button
          type="submit"
          disabled={submitting}
        >
          {submitting
            ? "Adding..."
            : "Add Image"}
        </button>
      </form>

      <hr />

      <h2>
        Product Images
      </h2>

      {loading ? (
        <p>
          Loading images...
        </p>
      ) : images.length === 0 ? (
        <p>
          No images have been added.
        </p>
      ) : (
        <div>
          {images.map(
            (image) => (
              <div
                key={image.id}
              >
                <img
                  src={bookImageUrl(image.image_url)}
                  alt={`Product ${productId}`}
                  width="250"
                />

                <br />

                <p>
                  {image.image_url}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    handleDeleteImage(
                      image.id
                    )
                  }
                >
                  Delete Image
                </button>

                <hr />
              </div>
            )
          )}
        </div>
      )}

      <Link to="/listings">
        Back to Listings
      </Link>
    </div>
  );
}

export default ProductImages;