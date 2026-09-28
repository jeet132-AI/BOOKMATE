const pool = require("../db");

// Get all reviews for a product
const getProductReviews = async (
  req,
  res
) => {
  try {
    const { productId } =
      req.params;

    const result = await pool.query(
      `SELECT
         r.id,
         r.buyer_id,
         r.product_id,
         r.rating,
         r.comment,
         r.created_at,

         u.name AS user_name,
         u.email AS user_email

       FROM reviews r

       JOIN users u
         ON r.buyer_id = u.id

       WHERE r.product_id = $1

       ORDER BY r.created_at DESC`,
      [productId]
    );

    res.json({
      reviews: result.rows,
    });
  } catch (error) {
    console.error(
      "Get product reviews error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Create a review
const createReview = async (
  req,
  res
) => {
  try {
    const {
      product_id,
      rating,
      comment,
    } = req.body;

    if (!product_id || !rating) {
      return res.status(400).json({
        message:
          "Product and rating are required",
      });
    }

    const numericRating =
      Number(rating);

    if (
      Number.isNaN(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        message:
          "Rating must be between 1 and 5",
      });
    }

    // Check whether product exists
    const productResult =
      await pool.query(
        `SELECT
           id,
           title,
           seller_id
         FROM products
         WHERE id = $1`,
        [product_id]
      );

    if (
      productResult.rows.length === 0
    ) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    const product =
      productResult.rows[0];

    // Check whether the user actually
    // purchased this product.
    const orderResult =
      await pool.query(
        `SELECT id
         FROM orders
         WHERE buyer_id = $1
         AND product_id = $2
         AND status = 'delivered'
         LIMIT 1`,
        [
          req.user.id,
          product_id,
        ]
      );

    if (orderResult.rows.length === 0) {
      return res.status(403).json({
        message:
          "You can review a book only after purchasing and receiving it",
      });
    }

    // Prevent duplicate review
    const existingReview =
      await pool.query(
        `SELECT id
         FROM reviews
         WHERE buyer_id = $1
         AND product_id = $2`,
        [
          req.user.id,
          product_id,
        ]
      );

    if (
      existingReview.rows.length > 0
    ) {
      return res.status(409).json({
        message:
          "You have already reviewed this book",
      });
    }

    const result = await pool.query(
      `INSERT INTO reviews
       (
         buyer_id,
         product_id,
         rating,
         comment
       )
       VALUES
       ($1, $2, $3, $4)
       RETURNING *`,
      [
        req.user.id,
        product_id,
        numericRating,
        comment
          ? comment.trim()
          : null,
      ]
    );

    res.status(201).json({
      message:
        "Review submitted successfully",
      review: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Create review error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Get logged-in user's reviews
const getMyReviews = async (
  req,
  res
) => {
  try {
    const result = await pool.query(
      `SELECT
         r.id,
         r.product_id,
         r.rating,
         r.comment,
         r.created_at,

         p.title AS product_title

       FROM reviews r

       JOIN products p
         ON r.product_id = p.id

       WHERE r.buyer_id = $1

       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    res.json({
      reviews: result.rows,
    });
  } catch (error) {
    console.error(
      "Get my reviews error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Delete own review
const deleteReview = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM reviews
       WHERE id = $1
       AND buyer_id = $2
       RETURNING *`,
      [
        id,
        req.user.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message:
          "Review not found",
      });
    }

    res.json({
      message:
        "Review deleted successfully",
      review: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Delete review error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


// ADMIN — Get every buyer review with book + buyer info
const getAllReviews = async (
  req,
  res
) => {
  try {
    const result = await pool.query(
      `SELECT
         r.id,
         r.product_id,
         r.rating,
         r.comment,
         r.created_at,

         p.title AS product_title,
         p.status AS product_status,

         u.id AS buyer_id,
         u.name AS buyer_name,
         u.email AS buyer_email,

         (
           SELECT COUNT(*)
           FROM reports rep
           WHERE rep.product_id = r.product_id
           AND rep.status IN ('pending', 'reviewing')
         ) AS open_report_count

       FROM reviews r

       JOIN products p
         ON r.product_id = p.id

       JOIN users u
         ON r.buyer_id = u.id

       ORDER BY r.created_at DESC`
    );

    res.json({
      reviews: result.rows,
    });
  } catch (error) {
    console.error(
      "Get all reviews error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


// ADMIN — Remove any review (abuse / fake reviews)
const deleteAnyReview = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM reviews
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message:
          "Review not found",
      });
    }

    res.json({
      message:
        "Review deleted successfully",
      review: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Admin delete review error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


module.exports = {
  getProductReviews,
  createReview,
  getMyReviews,
  deleteReview,
  getAllReviews,
  deleteAnyReview,
};