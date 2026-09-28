const pool = require("../db");

// Get all categories
const getAllCategories = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         c.id,
         c.name,
         c.description,
         c.is_active,
         c.created_at,
         (
           SELECT COUNT(*)
           FROM products p
           WHERE LOWER(p.category) = LOWER(c.name)
         ) AS book_count
        FROM categories c
        ORDER BY c.name ASC`
    );

    res.json({
      categories: result.rows,
    });
  } catch (error) {
    console.error(
      "Get all categories error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Get one category
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
         c.id,
         c.name,
         c.description,
         c.is_active,
         c.created_at,
         (
           SELECT COUNT(*)
           FROM products p
           WHERE LOWER(p.category) = LOWER(c.name)
         ) AS book_count
        FROM categories c
        WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    res.json({
      category: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Get category error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Create category
const createCategory = async (req, res) => {
  try {
    const {
      name,
      description,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message:
          "Category name is required",
      });
    }

    const categoryName =
      name.trim();

    const existingCategory =
      await pool.query(
        `SELECT id
         FROM categories
         WHERE LOWER(name) = LOWER($1)`,
        [categoryName]
      );

    if (
      existingCategory.rows.length > 0
    ) {
      return res.status(409).json({
        message:
          "Category already exists",
      });
    }

    const result = await pool.query(
      `INSERT INTO categories
       (
         name,
         description
       )
       VALUES
       ($1, $2)
       RETURNING *`,
      [
        categoryName,
        description
          ? description.trim()
          : null,
      ]
    );

    res.status(201).json({
      message:
        "Category created successfully",
      category: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Create category error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Update category
const updateCategory = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const {
      name,
      description,
      is_active,
    } = req.body;

    // Partial update allowed: renaming needs a name,
    // activation toggle only needs is_active.
    let categoryName = null;

    if (name !== undefined) {
      if (!name || !String(name).trim()) {
        return res.status(400).json({
          message:
            "Category name is required",
        });
      }

      categoryName = String(name).trim();

      const existingCategory =
        await pool.query(
          `SELECT id
           FROM categories
           WHERE LOWER(name) = LOWER($1)
           AND id <> $2`,
          [
            categoryName,
            id,
          ]
        );

      if (
        existingCategory.rows.length > 0
      ) {
        return res.status(409).json({
          message:
            "Another category with this name already exists",
        });
      }
    }

    const currentResult =
      await pool.query(
        `SELECT name, description, is_active
         FROM categories
         WHERE id = $1`,
        [id]
      );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        message:
          "Category not found",
      });
    }

    const current = currentResult.rows[0];

    const result = await pool.query(
      `UPDATE categories
       SET
         name = $1,
         description = $2,
         is_active = $3
       WHERE id = $4
       RETURNING *`,
      [
        categoryName ?? current.name,
        description !== undefined
          ? description
            ? String(description).trim() || null
            : null
          : current.description,
        is_active !== undefined
          ? Boolean(is_active)
          : current.is_active,
        id,
      ]
    );

    res.json({
      message:
        "Category updated successfully",
      category: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Update category error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


// PUBLIC — Active categories for the marketplace
// (sell form dropdown, buyer filters).
const getActiveCategories = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         c.id,
         c.name,
         c.description
        FROM categories c
        WHERE c.is_active = TRUE
        ORDER BY c.name ASC`
    );

    res.json({
      categories: result.rows,
    });
  } catch (error) {
    console.error(
      "Get active categories error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Delete category
const deleteCategory = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    // Check whether products use this
    // category name.
    const categoryResult =
      await pool.query(
        `SELECT name
         FROM categories
         WHERE id = $1`,
        [id]
      );

    if (
      categoryResult.rows.length === 0
    ) {
      return res.status(404).json({
        message:
          "Category not found",
      });
    }

    const categoryName =
      categoryResult.rows[0].name;

    const productResult =
      await pool.query(
        `SELECT COUNT(*) AS count
         FROM products
         WHERE LOWER(category) = LOWER($1)`,
        [categoryName]
      );

    const productCount = Number(
      productResult.rows[0].count
    );

    if (productCount > 0) {
      return res.status(400).json({
        message:
          "This category cannot be deleted because products are using it",
      });
    }

    const result = await pool.query(
      `DELETE FROM categories
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    res.json({
      message:
        "Category deleted successfully",
      category: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Delete category error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


module.exports = {
  getAllCategories,
  getCategoryById,
  getActiveCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};