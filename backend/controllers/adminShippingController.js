const pool = require("../db");

// Get all shipping records
const getAllShipping = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         s.id,
         s.order_id,
         s.tracking_number,
         s.courier_name,
         s.shipping_status,
         s.shipped_at,
         s.delivered_at,
         s.created_at,

         o.buyer_id,
         o.product_id,
         o.buyer_price,
         o.status AS order_status,
         o.delivery_address,

         p.title AS product_title,

         buyer.name AS buyer_name,
         buyer.email AS buyer_email,

         seller.name AS seller_name,
         seller.email AS seller_email

       FROM shipping s

       JOIN orders o
         ON s.order_id = o.id

       JOIN products p
         ON o.product_id = p.id

       JOIN users buyer
         ON o.buyer_id = buyer.id

       JOIN users seller
         ON p.seller_id = seller.id

       ORDER BY s.created_at DESC`
    );

    res.json({
      shipping: result.rows,
    });
  } catch (error) {
    console.error(
      "Get all shipping error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Get one shipping record
const getShippingById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
         s.id,
         s.order_id,
         s.tracking_number,
         s.courier_name,
         s.shipping_status,
         s.shipped_at,
         s.delivered_at,
         s.created_at,

         o.buyer_id,
         o.product_id,
         o.buyer_price,
         o.status AS order_status,
         o.delivery_address,

         p.title AS product_title,

         buyer.name AS buyer_name,
         buyer.email AS buyer_email,

         seller.name AS seller_name,
         seller.email AS seller_email

       FROM shipping s

       JOIN orders o
         ON s.order_id = o.id

       JOIN products p
         ON o.product_id = p.id

       JOIN users buyer
         ON o.buyer_id = buyer.id

       JOIN users seller
         ON p.seller_id = seller.id

       WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Shipping record not found",
      });
    }

    res.json({
      shipping: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Get shipping error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Update shipping information
const updateShipping = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    const {
      tracking_number,
      courier_name,
      shipping_status,
    } = req.body;

    const allowedStatuses = [
      "pending",
      "shipped",
      "in_transit",
      "delivered",
      "cancelled",
    ];

    if (
      shipping_status &&
      !allowedStatuses.includes(
        shipping_status
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid shipping status",
      });
    }

    await client.query("BEGIN");

    const shippingResult =
      await client.query(
        `SELECT
           s.id,
           s.order_id,
           s.shipping_status,
           s.tracking_number,
           s.courier_name,
           o.buyer_id,
           o.product_id,
           o.status AS order_status,
           p.seller_id,
           p.title AS product_title,
           buyer.name AS buyer_name
         FROM shipping s
         JOIN orders o
           ON s.order_id = o.id
         JOIN products p
           ON o.product_id = p.id
         JOIN users buyer
           ON o.buyer_id = buyer.id
         WHERE s.id = $1
         FOR UPDATE`,
        [id]
      );

    if (shippingResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message:
          "Shipping record not found",
      });
    }

    const shipping =
      shippingResult.rows[0];

    const newStatus =
      shipping_status ||
      shipping.shipping_status;

    const nextTracking =
      tracking_number?.trim() ||
      shipping.tracking_number ||
      null;

    const nextCourier =
      courier_name?.trim() ||
      shipping.courier_name ||
      null;

    // A shipment cannot move without courier + tracking details —
    // the buyer tracks the order with these on My Orders.
    if (
      ["shipped", "in_transit", "delivered"].includes(
        newStatus
      ) &&
      (!nextTracking || !nextCourier)
    ) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message:
          "Courier name and tracking number are required before marking a shipment as " +
          newStatus,
      });
    }

    const result = await client.query(
      `UPDATE shipping
       SET
         tracking_number = COALESCE(
           $1,
           tracking_number
         ),
         courier_name = COALESCE(
           $2,
           courier_name
         ),
         shipping_status = $3,

         shipped_at =
           CASE
             WHEN $3 IN (
               'shipped',
               'in_transit',
               'delivered'
             )
             THEN COALESCE(
               shipped_at,
               CURRENT_TIMESTAMP
             )
             ELSE shipped_at
           END,

         delivered_at =
           CASE
             WHEN $3 = 'delivered'
             THEN COALESCE(
               delivered_at,
               CURRENT_TIMESTAMP
             )
             ELSE delivered_at
           END

       WHERE id = $4

       RETURNING *`,
      [
        tracking_number || null,
        courier_name || null,
        newStatus,
        id,
      ]
    );

    // Keep order status synchronized
    if (newStatus === "shipped") {
      await client.query(
        `UPDATE orders
         SET status = 'shipped'
         WHERE id = $1`,
        [shipping.order_id]
      );
    }

    if (newStatus === "in_transit") {
      await client.query(
        `UPDATE orders
         SET status = 'shipped'
         WHERE id = $1
         AND status NOT IN (
           'delivered',
           'cancelled'
         )`,
        [shipping.order_id]
      );
    }

    if (newStatus === "delivered") {
      await client.query(
        `UPDATE orders
         SET status = 'delivered'
         WHERE id = $1`,
        [shipping.order_id]
      );

      // Cash collected on delivery — settle COD payments
      await client.query(
        `UPDATE payments
         SET payment_status = 'paid',
             paid_at = COALESCE(
               paid_at,
               CURRENT_TIMESTAMP
             )
         WHERE order_id = $1
         AND payment_status = 'pending'
         AND payment_method = 'Cash on Delivery'`,
        [shipping.order_id]
      );
    }

    if (newStatus === "cancelled") {
      await client.query(
        `UPDATE orders
         SET status = 'cancelled'
         WHERE id = $1`,
        [shipping.order_id]
      );

      await client.query(
        `UPDATE seller_payouts
         SET payout_status = 'cancelled'
         WHERE order_id = $1
         AND payout_status IN (
           'pending',
           'processing'
         )`,
        [shipping.order_id]
      );

      // Refund prepaid (UPI) payments
      await client.query(
        `UPDATE payments
         SET payment_status = 'refunded'
         WHERE order_id = $1
         AND payment_status = 'paid'`,
        [shipping.order_id]
      );

      // Book goes back on sale
      await client.query(
        `UPDATE products
         SET status = 'approved'
         WHERE id = $1`,
        [shipping.product_id]
      );
    }

    // Keep buyer + seller informed — same messages as
    // the order-status path so My Orders is never stale
    const buyerMessages = {
      shipped:
        `Your order #${shipping.order_id} for "${shipping.product_title}" has been shipped via ${nextCourier} (Tracking: ${nextTracking}).`,
      in_transit:
        `Your order #${shipping.order_id} for "${shipping.product_title}" is in transit via ${nextCourier} (Tracking: ${nextTracking}).`,
      delivered:
        `Your order #${shipping.order_id} for "${shipping.product_title}" has been delivered. Enjoy your book! You can now leave a review.`,
      cancelled:
        `Your order #${shipping.order_id} for "${shipping.product_title}" has been cancelled.`,
    };

    if (buyerMessages[newStatus]) {
      await client.query(
        `INSERT INTO notifications
         (
           user_id,
           title,
           message
         )
         VALUES
         ($1, $2, $3)`,
        [
          shipping.buyer_id,
          "Order Status Updated",
          buyerMessages[newStatus],
        ]
      );

      await client.query(
        `INSERT INTO notifications
         (
           user_id,
           title,
           message
         )
         VALUES
         (
           $1,
           $2,
           $3
         )`,
        [
          shipping.seller_id,
          "Order Status Updated",
          `Order #${shipping.order_id} for "${shipping.product_title}" is now ${newStatus}.`,
        ]
      );
    }

    await client.query("COMMIT");

    res.json({
      message:
        "Shipping information updated successfully",
      shipping: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Update shipping error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  } finally {
    client.release();
  }
};


module.exports = {
  getAllShipping,
  getShippingById,
  updateShipping,
};