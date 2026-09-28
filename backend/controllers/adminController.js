const pool = require("../db");

// Get all pending book listings
const getPendingProducts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         p.id,
         p.title,
         p.description,
         p.category,
         p.condition,
         p.class_name,
         p.seller_price,
         p.status,
         p.location,
         p.created_at,
         u.id AS seller_id,
         u.name AS seller_name,
         u.email AS seller_email,
         COALESCE(
           (
             SELECT json_agg(
               pi.image_url
               ORDER BY pi.created_at ASC
             )
             FROM product_images pi
             WHERE pi.product_id = p.id
           ),
           '[]'
         ) AS images
       FROM products p
       JOIN users u
         ON p.seller_id = u.id
       WHERE p.status = 'pending'
       ORDER BY p.created_at ASC`
    );

    res.json({
      products: result.rows,
    });
  } catch (error) {
    console.error(
      "Get pending products error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// Approve a book listing
const approveProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE products
       SET status = 'approved'
       WHERE id = $1
       AND status = 'pending'
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message:
          "Pending product not found",
      });
    }

    res.json({
      message:
        "Book listing approved successfully",
      product: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Approve product error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// Reject a book listing
const rejectProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE products
       SET status = 'rejected'
       WHERE id = $1
       AND status = 'pending'
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message:
          "Pending product not found",
      });
    }

    res.json({
      message:
        "Book listing rejected successfully",
      product: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Reject product error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};
const getAllProducts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         p.id,
         p.title,
         p.description,
         p.category,
         p.condition,
         p.class_name,
         p.seller_price,
         p.status,
         p.location,
         p.created_at,
         u.id AS seller_id,
         u.name AS seller_name,
         u.email AS seller_email
       FROM products p
       JOIN users u
         ON p.seller_id = u.id
       ORDER BY p.created_at DESC`
    );

    res.json({
      products: result.rows,
    });
  } catch (error) {
    console.error(
      "Get all products error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getPendingProducts,
  approveProduct,
  rejectProduct,
  getAllProducts,
};