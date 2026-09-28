const pool = require("../db");


// Delivery charge comes from the latest pricing settings.
const getDeliveryCharge = async () => {
  const result = await pool.query(
    `SELECT
       delivery_charge
     FROM pricing_settings
     ORDER BY id DESC
     LIMIT 1`
  );

  if (result.rows.length === 0) {
    return 0;
  }

  const charge =
    result.rows[0].delivery_charge;

  return charge === null
    ? 0
    : Number(charge);
};


// Resolve the full price for a book:
// Book price (seller + platform fee) + delivery charge = total.
const resolvePricing = async (
  sellerPrice,
  category
) => {
  const deliveryCharge =
    await getDeliveryCharge();

  if (
    category &&
    String(category).trim()
  ) {
    const ruleResult = await pool.query(
      `SELECT
         fee_type,
         fee_value
        FROM category_pricing_rules
        WHERE LOWER(category) = LOWER($1)
        AND is_active = TRUE
        LIMIT 1`,
      [String(category).trim()]
    );

    if (ruleResult.rows.length > 0) {
      const rule = ruleResult.rows[0];

      const feeValue = Number(
        rule.fee_value
      );

      const platformFee =
        rule.fee_type === "percentage"
          ? (sellerPrice * feeValue) / 100
          : feeValue;

      return {
        platformFee,

        deliveryCharge,

        buyerPrice:
          sellerPrice +
          platformFee +
          deliveryCharge,

        rule:
          "category:" +
          String(category).trim(),
      };
    }
  }

  const pricing = await calculatePricing(
    sellerPrice
  );

  return {
    ...pricing,

    deliveryCharge,

    buyerPrice:
      sellerPrice +
      pricing.platformFee +
      deliveryCharge,

    rule: "global",
  };
};


// Calculate platform fee and buyer price (global rule)
const calculatePricing = async (sellerPrice) => {
  const pricingResult = await pool.query(
    `SELECT
       fee_type,
       fee_value
     FROM pricing_settings
     ORDER BY id DESC
     LIMIT 1`
  );

  let platformFee = 0;

  if (pricingResult.rows.length > 0) {
    const pricing = pricingResult.rows[0];

    const feeValue =
      Number(pricing.fee_value);

    if (
      pricing.fee_type === "percentage"
    ) {
      platformFee =
        (sellerPrice * feeValue) / 100;
    } else {
      platformFee = feeValue;
    }
  }

  return {
    platformFee,

    buyerPrice:
      sellerPrice + platformFee,
  };
};


// Create a new book listing
const createProduct = async (
  req,
  res
) => {
  try {

    const {
      title,
      description,
      category,
      condition,
      class_name,
      seller_price,
      location,
    } = req.body;


    // Check required book details

    if (
      !title ||
      !category ||
      !condition ||
      seller_price === undefined ||
      seller_price === null
    ) {
      return res.status(400).json({
        message:
          "Title, category, condition and seller price are required",
      });
    }


    // Check uploaded files

    if (
      !req.files ||
      !req.files.bookImages ||
      req.files.bookImages.length !== 2 ||
      !req.files.bookPdf ||
      req.files.bookPdf.length !== 1
    ) {
      return res.status(400).json({
        message:
          "Please upload the front image, back image and book PDF.",
      });
    }


    // Validate seller price

    const sellerPrice =
      Number(seller_price);


    if (
      Number.isNaN(sellerPrice) ||
      sellerPrice <= 0
    ) {
      return res.status(400).json({
        message:
          "Seller price must be greater than 0",
      });
    }


    // Enforce admin-configured price limits
    const limitsResult = await pool.query(
      `SELECT
         min_seller_price,
         max_seller_price
        FROM pricing_settings
        ORDER BY id DESC
        LIMIT 1`
    );

    if (limitsResult.rows.length > 0) {
      const minPrice =
        limitsResult.rows[0].min_seller_price ===
        null
          ? null
          : Number(
              limitsResult.rows[0]
                .min_seller_price
            );

      const maxPrice =
        limitsResult.rows[0].max_seller_price ===
        null
          ? null
          : Number(
              limitsResult.rows[0]
                .max_seller_price
            );

      if (
        minPrice !== null &&
        sellerPrice < minPrice
      ) {
        return res.status(400).json({
          message: `Seller price must be at least ₹${minPrice}`,
        });
      }

      if (
        maxPrice !== null &&
        sellerPrice > maxPrice
      ) {
        return res.status(400).json({
          message: `Seller price cannot be more than ₹${maxPrice}`,
        });
      }
    }


    // Create product

    const result = await pool.query(
      `INSERT INTO products
       (
         seller_id,
         title,
         description,
         category,
         condition,
         class_name,
         seller_price,
         location,
         status
       )
       VALUES
       ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
       RETURNING *`,
      [
        req.user.id,

        title.trim(),

        description
          ? description.trim()
          : null,

        category.trim(),

        condition.trim(),

        class_name
          ? String(class_name).trim() || null
          : null,

        sellerPrice,

        location
          ? location.trim()
          : null,
      ]
    );


    const product =
      result.rows[0];


    // Get uploaded files

    const frontImage =
      req.files.bookImages[0];

    const backImage =
      req.files.bookImages[1];

    const pdfFile =
      req.files.bookPdf[0];


    // Save front image

    await pool.query(
      `INSERT INTO product_images
       (
         product_id,
         image_url
       )
       VALUES
       ($1, $2)`,
      [
        product.id,

        `/uploads/${frontImage.filename}`,
      ]
    );


    // Save back image

    await pool.query(
      `INSERT INTO product_images
       (
         product_id,
         image_url
       )
       VALUES
       ($1, $2)`,
      [
        product.id,

        `/uploads/${backImage.filename}`,
      ]
    );


    // Save PDF
    // We are using the same image_url
    // column because it stores file paths.

    await pool.query(
      `INSERT INTO product_images
       (
         product_id,
         image_url
       )
       VALUES
       ($1, $2)`,
      [
        product.id,

        `/uploads/${pdfFile.filename}`,
      ]
    );


    res.status(201).json({
      message:
        "Book listing submitted successfully",

      product,
    });

  } catch (error) {

    console.error(
      "Create product error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Get all products listed by logged-in seller

const getMyProducts = async (
  req,
  res
) => {
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

         (
           SELECT pi.image_url
           FROM product_images pi
           WHERE pi.product_id = p.id
           ORDER BY pi.created_at ASC
           LIMIT 1
         ) AS image_url

       FROM products p

       WHERE p.seller_id = $1

       ORDER BY p.created_at DESC`,
      [req.user.id]
    );


    res.json({
      products: result.rows,
    });

  } catch (error) {

    console.error(
      "Get my products error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Get all approved products for buyers

const getApprovedProducts = async (
  req,
  res
) => {
  try {

    const { class: classFilter } = req.query;

    const values = [];
    let classClause = "";

    if (classFilter && classFilter !== "All") {
      values.push(String(classFilter));
      classClause = `AND p.class_name = $1`;
    }

    const result = await pool.query(
      `SELECT
         p.id,
         p.title,
         p.description,
         p.category,
         p.condition,
         p.class_name,
         p.seller_price,
         p.location,
         p.created_at,

         u.id AS seller_id,
         u.name AS seller_name,

         (
           SELECT pi.image_url
           FROM product_images pi
           WHERE pi.product_id = p.id
           ORDER BY pi.created_at ASC
           LIMIT 1
         ) AS image_url,

         (
           SELECT ROUND(AVG(r.rating), 1)
           FROM reviews r
           WHERE r.product_id = p.id
         ) AS avg_rating,

         (
           SELECT COUNT(*)
           FROM reviews r
           WHERE r.product_id = p.id
         ) AS review_count

       FROM products p

       JOIN users u
         ON p.seller_id = u.id

       WHERE p.status = 'approved'
       ${classClause}

       ORDER BY p.created_at DESC`,
      values
    );


    const products =
      await Promise.all(
        result.rows.map(
          async (product) => {

            const sellerPrice =
              Number(
                product.seller_price
              );


            const pricing =
              await resolvePricing(
                sellerPrice,
                product.category
              );


            return {
              ...product,

              seller_price:
                sellerPrice,

              platform_fee:
                pricing.platformFee,

              delivery_charge:
                pricing.deliveryCharge,

              buyer_price:
                pricing.buyerPrice,
            };
          }
        )
      );


    res.json({
      products,
    });

  } catch (error) {

    console.error(
      "Get approved products error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Get one approved product

const getProductById = async (
  req,
  res
) => {
  try {

    const { id } = req.params;


    const result = await pool.query(
      `SELECT
         p.id,
         p.title,
         p.description,
         p.category,
         p.condition,
         p.class_name,
         p.seller_price,
         p.location,
         p.status,
         p.created_at,

         u.id AS seller_id,
         u.name AS seller_name,
         u.email AS seller_email

       FROM products p

       JOIN users u
         ON p.seller_id = u.id

       WHERE p.id = $1
       AND p.status IN (
         'approved',
         'sold'
       )`,
      [id]
    );


    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        message: "Book not found",
      });
    }


    const product =
      result.rows[0];


    const sellerPrice =
      Number(
        product.seller_price
      );


    const pricing =
      await resolvePricing(
        sellerPrice,
        product.category
      );


    const imagesResult =
      await pool.query(
        `SELECT
           id,
           image_url,
           created_at
         FROM product_images
         WHERE product_id = $1
         ORDER BY created_at ASC`,
        [id]
      );


    res.json({
      product: {
        ...product,

        seller_price:
          sellerPrice,

        platform_fee:
          pricing.platformFee,

        delivery_charge:
          pricing.deliveryCharge,

        buyer_price:
          pricing.buyerPrice,

        images:
          imagesResult.rows,
      },
    });

  } catch (error) {

    console.error(
      "Get product error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


module.exports = {
  createProduct,
  getMyProducts,
  getApprovedProducts,
  getProductById,
  calculatePricing,
  resolvePricing,
};