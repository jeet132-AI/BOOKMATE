const pool = require("../db");

// Get current pricing settings
const getPricingSettings = async (
  req,
  res
) => {
  try {
    const result = await pool.query(
      `SELECT
         id,
         fee_type,
         fee_value,
         min_seller_price,
         max_seller_price,
         delivery_charge,
         updated_at
       FROM pricing_settings
       ORDER BY id DESC
       LIMIT 1`
    );

    res.json({
      settings:
        result.rows.length > 0
          ? result.rows[0]
          : null,
    });
  } catch (error) {
    console.error(
      "Get pricing settings error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Create or update pricing settings
const updatePricingSettings = async (
  req,
  res
) => {
  const client = await pool.connect();

  try {
    const {
      fee_type,
      fee_value,
      min_seller_price,
      max_seller_price,
      delivery_charge,
    } = req.body;

    if (
      fee_type !== "fixed" &&
      fee_type !== "percentage"
    ) {
      return res.status(400).json({
        message:
          "Fee type must be fixed or percentage",
      });
    }

    const numericFee = Number(
      fee_value
    );

    if (
      Number.isNaN(numericFee) ||
      numericFee < 0
    ) {
      return res.status(400).json({
        message:
          "Fee value must be a valid non-negative number",
      });
    }

    if (
      fee_type === "percentage" &&
      numericFee > 100
    ) {
      return res.status(400).json({
        message:
          "Percentage fee cannot be greater than 100",
      });
    }

    // Optional seller price limits
    let minPrice = null;
    let maxPrice = null;

    if (
      min_seller_price !== undefined &&
      min_seller_price !== null &&
      min_seller_price !== ""
    ) {
      minPrice = Number(min_seller_price);

      if (
        Number.isNaN(minPrice) ||
        minPrice < 0
      ) {
        return res.status(400).json({
          message:
            "Minimum price must be a valid non-negative number",
        });
      }
    }

    if (
      max_seller_price !== undefined &&
      max_seller_price !== null &&
      max_seller_price !== ""
    ) {
      maxPrice = Number(max_seller_price);

      if (
        Number.isNaN(maxPrice) ||
        maxPrice < 0
      ) {
        return res.status(400).json({
          message:
            "Maximum price must be a valid non-negative number",
        });
      }
    }

    if (
      minPrice !== null &&
      maxPrice !== null &&
      minPrice > maxPrice
    ) {
      return res.status(400).json({
        message:
          "Minimum price cannot be greater than maximum price",
      });
    }

    // Optional delivery charge (flat amount per order)
    let deliveryCharge = null;

    if (
      delivery_charge !== undefined &&
      delivery_charge !== null &&
      delivery_charge !== ""
    ) {
      deliveryCharge = Number(delivery_charge);

      if (
        Number.isNaN(deliveryCharge) ||
        deliveryCharge < 0
      ) {
        return res.status(400).json({
          message:
            "Delivery charge must be a valid non-negative number",
        });
      }
    }

    await client.query("BEGIN");

    const existingResult =
      await client.query(
        `SELECT id
         FROM pricing_settings
         ORDER BY id DESC
         LIMIT 1`
      );

    let result;

    if (
      existingResult.rows.length === 0
    ) {
      result = await client.query(
        `INSERT INTO pricing_settings
         (
           fee_type,
           fee_value,
           min_seller_price,
           max_seller_price,
           delivery_charge,
           updated_at
         )
         VALUES
         ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          fee_type,
          numericFee,
          minPrice,
          maxPrice,
          deliveryCharge,
        ]
      );
    } else {
      const settingId =
        existingResult.rows[0].id;

      result = await client.query(
        `UPDATE pricing_settings
         SET
           fee_type = $1,
           fee_value = $2,
           min_seller_price = $3,
           max_seller_price = $4,
           delivery_charge = $5,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING *`,
        [
          fee_type,
          numericFee,
          minPrice,
          maxPrice,
          deliveryCharge,
          settingId,
        ]
      );
    }

    await client.query("COMMIT");

    res.json({
      message:
        "Pricing settings updated successfully",
      settings: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Update pricing settings error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  } finally {
    client.release();
  }
};


// CATEGORY PRICING RULES — per-category fee overrides

// List all category rules
const getCategoryPricingRules = async (
  req,
  res
) => {
  try {
    const result = await pool.query(
      `SELECT
         id,
         category,
         fee_type,
         fee_value,
         is_active,
         updated_at
        FROM category_pricing_rules
        ORDER BY category ASC`
    );

    res.json({
      rules: result.rows,
    });
  } catch (error) {
    console.error(
      "Get category pricing error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Create or update one category rule
const upsertCategoryPricingRule = async (
  req,
  res
) => {
  try {
    const {
      category,
      fee_type,
      fee_value,
      is_active,
    } = req.body;

    if (
      !category ||
      !String(category).trim()
    ) {
      return res.status(400).json({
        message:
          "Category is required",
      });
    }

    if (
      fee_type !== "fixed" &&
      fee_type !== "percentage"
    ) {
      return res.status(400).json({
        message:
          "Fee type must be fixed or percentage",
      });
    }

    const numericFee = Number(
      fee_value
    );

    if (
      Number.isNaN(numericFee) ||
      numericFee < 0
    ) {
      return res.status(400).json({
        message:
          "Fee value must be a valid non-negative number",
      });
    }

    if (
      fee_type === "percentage" &&
      numericFee > 100
    ) {
      return res.status(400).json({
        message:
          "Percentage fee cannot be greater than 100",
      });
    }

    const result = await pool.query(
      `INSERT INTO category_pricing_rules
       (
         category,
         fee_type,
         fee_value,
         is_active,
         updated_at
       )
       VALUES
       ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (category)
       DO UPDATE SET
         fee_type = EXCLUDED.fee_type,
         fee_value = EXCLUDED.fee_value,
         is_active = EXCLUDED.is_active,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        String(category).trim(),
        fee_type,
        numericFee,
        is_active !== undefined
          ? Boolean(is_active)
          : true,
      ]
    );

    res.status(201).json({
      message:
        "Category pricing rule saved successfully",
      rule: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Upsert category pricing error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Delete one category rule (falls back to global rule)
const deleteCategoryPricingRule = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM category_pricing_rules
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message:
          "Category pricing rule not found",
      });
    }

    res.json({
      message:
        "Category pricing rule deleted successfully",
      rule: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Delete category pricing error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


module.exports = {
  getPricingSettings,
  updatePricingSettings,
  getCategoryPricingRules,
  upsertCategoryPricingRule,
  deleteCategoryPricingRule,
};