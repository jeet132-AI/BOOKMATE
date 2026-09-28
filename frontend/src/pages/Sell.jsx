import { useEffect, useState } from "react";
import { CLASS_OPTIONS } from "../data/classes";
import "./Sell.css";

const FALLBACK_CATEGORIES = [
  "Programming",
  "Database",
  "Networking",
  "Other",
];

const initialFormData = {
  title: "",
  seller_price: "",
  category: "",
  condition: "",
  class_name: "",
  description: "",
  location: "",
};

const initialImages = [null, null];
const initialPdf = null;

function Sell() {
  const [formData, setFormData] =
    useState(initialFormData);

  const [bookImages, setBookImages] =
    useState(initialImages);

  const [bookPdf, setBookPdf] =
    useState(initialPdf);

  const [imageErrors, setImageErrors] =
    useState(["", ""]);

  const [pdfError, setPdfError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [categoryOptions, setCategoryOptions] =
    useState(FALLBACK_CATEGORIES);

  // Live categories managed by admin; deactivated
  // categories disappear from this dropdown.
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/categories"
        );
        const data = await response.json();

        if (
          response.ok &&
          Array.isArray(data.categories) &&
          data.categories.length > 0
        ) {
          setCategoryOptions(
            data.categories.map(
              (category) => category.name
            )
          );
        }
      } catch (error) {
        console.error(
          "Sell categories error:",
          error
        );
      }
    };

    fetchCategories();
  }, []);


  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }


  function handleImageChange(index, event) {
    const file = event.target.files[0];

    setImageErrors((previousErrors) => {
      const updatedErrors = [...previousErrors];

      updatedErrors[index] = "";

      return updatedErrors;
    });


    if (!file) {
      setBookImages((previousImages) => {
        const updatedImages = [...previousImages];

        updatedImages[index] = null;

        return updatedImages;
      });

      return;
    }


    const maxSize =
      5 * 1024 * 1024;


    if (file.size > maxSize) {
      setBookImages((previousImages) => {
        const updatedImages = [...previousImages];

        updatedImages[index] = null;

        return updatedImages;
      });


      setImageErrors((previousErrors) => {
        const updatedErrors = [...previousErrors];

        updatedErrors[index] =
          "Image must be 5 MB or less.";

        return updatedErrors;
      });


      event.target.value = "";

      return;
    }


    if (!file.type.startsWith("image/")) {
      setBookImages((previousImages) => {
        const updatedImages = [...previousImages];

        updatedImages[index] = null;

        return updatedImages;
      });


      setImageErrors((previousErrors) => {
        const updatedErrors = [...previousErrors];

        updatedErrors[index] =
          "Please select an image file.";

        return updatedErrors;
      });


      event.target.value = "";

      return;
    }


    setBookImages((previousImages) => {
      const updatedImages = [...previousImages];

      updatedImages[index] = file;

      return updatedImages;
    });
  }


  function handlePdfChange(event) {
    const file = event.target.files[0];

    setPdfError("");


    if (!file) {
      setBookPdf(null);

      return;
    }


    const maxSize =
      5 * 1024 * 1024;


    if (file.size > maxSize) {
      setBookPdf(null);

      setPdfError(
        "PDF must be 5 MB or less."
      );

      event.target.value = "";

      return;
    }


    if (file.type !== "application/pdf") {
      setBookPdf(null);

      setPdfError(
        "Please select a PDF file."
      );

      event.target.value = "";

      return;
    }


    setBookPdf(file);
  }


  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");


    const token =
      localStorage.getItem("token");


    if (!token) {
      setMessage("Please log in first.");

      return;
    }


    const hasMissingImage =
      bookImages.some(
        (image) => !image
      );


    if (
      hasMissingImage ||
      !bookPdf
    ) {
      setMessage(
        "Please upload the front image, back image and book PDF."
      );

      return;
    }


    const hasImageError =
      imageErrors.some(
        (error) => error
      );


    if (
      hasImageError ||
      pdfError
    ) {
      setMessage(
        "Please fix the upload errors before submitting."
      );

      return;
    }


    try {
      setIsSubmitting(true);


      const formDataToSend =
        new FormData();


      formDataToSend.append(
        "title",
        formData.title
      );


      formDataToSend.append(
        "seller_price",
        Number(
          formData.seller_price
        )
      );


      formDataToSend.append(
        "category",
        formData.category
      );


      formDataToSend.append(
        "condition",
        formData.condition
      );


      formDataToSend.append(
        "class_name",
        formData.class_name
      );


      formDataToSend.append(
        "description",
        formData.description
      );


      formDataToSend.append(
        "location",
        formData.location
      );


      // Front image
      formDataToSend.append(
        "bookImages",
        bookImages[0]
      );


      // Back image
      formDataToSend.append(
        "bookImages",
        bookImages[1]
      );


      // Book PDF
      formDataToSend.append(
        "bookPdf",
        bookPdf
      );


      const response =
        await fetch(
          "http://localhost:5000/api/products",
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            body: formDataToSend,
          }
        );


      const data =
        await response.json();


      if (!response.ok) {
        setMessage(
          data.message ||
            "Unable to list your book."
        );

        return;
      }


      setMessage(
        "Book submitted successfully and is waiting for admin approval."
      );


      setFormData(
        initialFormData
      );


      setBookImages(
        initialImages
      );


      setBookPdf(
        initialPdf
      );


      setImageErrors(
        ["", ""]
      );


      setPdfError("");


      // Clear file inputs
      document
        .querySelectorAll(
          ".book-image-input, .book-pdf-input"
        )
        .forEach((input) => {
          input.value = "";
        });

    } catch (error) {
      console.error(
        "Sell book error:",
        error
      );

      setMessage(
        "Unable to connect to the server. Please try again."
      );

    } finally {
      setIsSubmitting(false);
    }
  }


  const isSuccess =
    message.includes(
      "successfully"
    );


  return (
    <main className="sell-page">

      <div
        className="sell-glow sell-glow-one"
        aria-hidden="true"
      />

      <div
        className="sell-glow sell-glow-two"
        aria-hidden="true"
      />


      <span
        className="sell-decoration decoration-book-left"
        aria-hidden="true"
      >
        📚
      </span>


      <span
        className="sell-decoration decoration-book-right"
        aria-hidden="true"
      >
        📖
      </span>


      <span
        className="sell-decoration decoration-feather"
        aria-hidden="true"
      >
        🪶
      </span>


      <span
        className="sell-decoration decoration-compass"
        aria-hidden="true"
      >
        🧭
      </span>


      <section className="sell-content">

        <header className="sell-header">

          <span className="sell-kicker">
            Give your books a new chapter
          </span>


          <h1>
            Sell Your <span>Book</span>
          </h1>


          <p>
            List your used books, notes, or study materials for other students.
          </p>

        </header>


        <form
          className="sell-form"
          onSubmit={handleSubmit}
        >

          <div className="sell-form-heading">

            <div>

              <h2>
                Book details
              </h2>


              <p>
                Fill in the details to create your listing.
              </p>

            </div>


            <span
              className="sell-form-icon"
              aria-hidden="true"
            >
              ✨
            </span>

          </div>


          {/* BOOK TITLE + PRICE */}

          <div className="form-row">

            <div className="form-field">

              <label htmlFor="book-title">
                Book title
              </label>


              <input
                id="book-title"
                type="text"
                name="title"
                placeholder="e.g. Introduction to Algorithms"
                value={formData.title}
                onChange={handleChange}
                required
              />

            </div>


            <div className="form-field">

              <label htmlFor="seller-price">
                Your price
              </label>


              <div className="price-input-wrap">

                <span aria-hidden="true">
                  ₹
                </span>


                <input
                  id="seller-price"
                  type="number"
                  name="seller_price"
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                  value={
                    formData.seller_price
                  }
                  onChange={handleChange}
                  required
                />

              </div>

            </div>

          </div>


          {/* CATEGORY + CONDITION */}

          <div className="form-row">

            <div className="form-field">

              <label htmlFor="book-category">
                Category
              </label>

              <select
                id="book-category"
                name="category"
                value={
                  formData.category
                }
                onChange={handleChange}
                required
              >

                <option
                  value=""
                  disabled
                >
                  Choose a category
                </option>


                {categoryOptions.map(
                  (option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option}
                    </option>
                  )
                )}

              </select>

            </div>


            <div className="form-field">

              <label htmlFor="book-condition">
                Condition
              </label>


              <select
                id="book-condition"
                name="condition"
                value={
                  formData.condition
                }
                onChange={handleChange}
                required
              >

                <option
                  value=""
                  disabled
                >
                  Choose condition
                </option>


                <option value="Like New">
                  Like New
                </option>


                <option value="Good">
                  Good
                </option>


                <option value="Used">
                  Used
                </option>

              </select>

            </div>

          </div>


          {/* CLASS / EXAM */}

          <div className="form-field">

            <label htmlFor="book-class">
              Class / Exam
            </label>


            <select
              id="book-class"
              name="class_name"
              value={
                formData.class_name
              }
              onChange={handleChange}
              required
            >

              <option
                value=""
                disabled
              >
                Choose class or exam
              </option>


              {CLASS_OPTIONS.map(
                (option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                )
              )}

            </select>

          </div>


          {/* BOOK IMAGES + PDF */}

          <div className="book-images-section">

            <div className="book-images-heading">

              <label>
                Book Files
              </label>


              <span>
                2 images + 1 PDF required
              </span>

            </div>


            <div className="book-images-grid">

              {/* FRONT IMAGE */}

              <div className="book-image-upload">

                <label
                  htmlFor="book-image-front"
                  className="book-image-label"
                >

                  <span className="book-image-icon">
                    {bookImages[0]
                      ? "✓"
                      : "📷"}
                  </span>


                  <span className="book-image-title">
                    Front of Book
                  </span>


                  <span className="book-image-hint">

                    {bookImages[0]
                      ? bookImages[0].name
                      : "Choose image"}

                  </span>

                </label>


                <input
                  id="book-image-front"
                  className="book-image-input"
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    handleImageChange(
                      0,
                      event
                    )
                  }
                  required
                />


                {imageErrors[0] && (
                  <p className="book-image-error">
                    {imageErrors[0]}
                  </p>
                )}

              </div>


              {/* BACK IMAGE */}

              <div className="book-image-upload">

                <label
                  htmlFor="book-image-back"
                  className="book-image-label"
                >

                  <span className="book-image-icon">
                    {bookImages[1]
                      ? "✓"
                      : "📷"}
                  </span>


                  <span className="book-image-title">
                    Back of Book
                  </span>


                  <span className="book-image-hint">

                    {bookImages[1]
                      ? bookImages[1].name
                      : "Choose image"}

                  </span>

                </label>


                <input
                  id="book-image-back"
                  className="book-image-input"
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    handleImageChange(
                      1,
                      event
                    )
                  }
                  required
                />


                {imageErrors[1] && (
                  <p className="book-image-error">
                    {imageErrors[1]}
                  </p>
                )}

              </div>


              {/* PDF */}

              <div className="book-image-upload">

                <label
                  htmlFor="book-pdf"
                  className="book-image-label"
                >

                  <span className="book-image-icon">
                    {bookPdf
                      ? "✓"
                      : "📄"}
                  </span>


                  <span className="book-image-title">
                    Book PDF
                  </span>


                  <span className="book-image-hint">

                    {bookPdf
                      ? bookPdf.name
                      : "Choose PDF"}

                  </span>

                </label>


                <input
                  id="book-pdf"
                  className="book-pdf-input"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={
                    handlePdfChange
                  }
                  required
                />


                {pdfError && (
                  <p className="book-image-error">
                    {pdfError}
                  </p>
                )}

              </div>

            </div>


            <p className="book-images-note">
              Images and PDF must be 5 MB or less.
            </p>

          </div>


          {/* LOCATION */}

          <div className="form-field">

            <label htmlFor="book-location">
              Location
            </label>


            <input
              id="book-location"
              type="text"
              name="location"
              placeholder="City, campus, or area"
              value={
                formData.location
              }
              onChange={handleChange}
              required
            />

          </div>


          {/* DESCRIPTION */}

          <div className="form-field">

            <label htmlFor="book-description">

              Description{" "}

              <span className="optional-label">
                Optional
              </span>

            </label>


            <textarea
              id="book-description"
              name="description"
              placeholder="Share details about the book, edition, or any notes..."
              rows={5}
              value={
                formData.description
              }
              onChange={handleChange}
            />

          </div>


          {/* SUBMIT */}

          <button
            type="submit"
            className="list-book-btn"
            disabled={isSubmitting}
          >

            <span>
              {isSubmitting
                ? "Submitting..."
                : "List my book"}
            </span>


            <span
              className="rocket-icon"
              aria-hidden="true"
            >
              {isSubmitting
                ? "⏳"
                : "🚀"}
            </span>

          </button>


          <p className="sell-footnote">
            Your listing will be reviewed before it appears to other students.
          </p>

        </form>


        {message && (

          <p
            className={`sell-message ${
              isSuccess
                ? "success-message"
                : "error-message"
            }`}
            role="status"
          >

            <span aria-hidden="true">
              {isSuccess
                ? "✓"
                : "!"}
            </span>


            {message}

          </p>

        )}

      </section>

    </main>
  );
}

export default Sell;