const pool = require("../db");

// Get all orders
const getAllOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         o.id,
         o.buyer_id,
         o.product_id,
         o.seller_price,
         o.platform_fee,
         o.delivery_charge,
         o.buyer_price,
         o.status,
         o.delivery_address,
         o.created_at,

         p.title AS product_title,
         p.category AS product_category,
         p.condition AS product_condition,
         p.class_name AS product_class,

         (
           SELECT pi.image_url
           FROM product_images pi
           WHERE pi.product_id = p.id
           ORDER BY pi.created_at ASC
           LIMIT 1
         ) AS product_image,

         pay.payment_method,
         pay.payment_status,
         pay.transaction_id,

         buyer.name AS buyer_name,
         buyer.email AS buyer_email,

         seller.id AS seller_id,
         seller.name AS seller_name,
         seller.email AS seller_email

       FROM orders o

       JOIN products p
         ON o.product_id = p.id

       JOIN users buyer
         ON o.buyer_id = buyer.id

       JOIN users seller
         ON p.seller_id = seller.id

       LEFT JOIN payments pay
         ON pay.order_id = o.id

       ORDER BY o.created_at DESC`
    );

    res.json({
      orders: result.rows,
    });
  } catch (error) {
    console.error(
      "Get all orders error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Get one order by ID
const getAdminOrderById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
         o.id,
         o.buyer_id,
         o.product_id,
         o.seller_price,
         o.platform_fee,
         o.delivery_charge,
         o.buyer_price,
         o.status,
         o.delivery_address,
         o.created_at,

         p.title AS product_title,
         p.category AS product_category,
         p.condition AS product_condition,
         p.class_name AS product_class,

         (
           SELECT pi.image_url
           FROM product_images pi
           WHERE pi.product_id = p.id
           ORDER BY pi.created_at ASC
           LIMIT 1
         ) AS product_image,

         pay.payment_method,
         pay.payment_status,
         pay.transaction_id,
         pay.amount AS payment_amount,
         pay.paid_at AS payment_paid_at,

         s.shipping_status,
         s.tracking_number,
         s.courier_name,
         s.shipped_at,
         s.delivered_at,

         buyer.name AS buyer_name,
         buyer.email AS buyer_email,

         seller.id AS seller_id,
         seller.name AS seller_name,
         seller.email AS seller_email

       FROM orders o

       JOIN products p
         ON o.product_id = p.id

       JOIN users buyer
         ON o.buyer_id = buyer.id

       JOIN users seller
         ON p.seller_id = seller.id

       LEFT JOIN payments pay
         ON pay.order_id = o.id

       LEFT JOIN shipping s
         ON s.order_id = o.id

       WHERE o.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.json({
      order: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Get admin order error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Update order status
const updateOrderStatus = async (
  req,
  res
) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!status) {
      return res.status(400).json({
        message:
          "Order status is required",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message:
          "Invalid order status",
      });
    }

    await client.query("BEGIN");

    const orderResult =
      await client.query(
        `SELECT
           o.id,
           o.buyer_id,
           o.product_id,
           o.status,
           p.seller_id,
           p.title
         FROM orders o
         JOIN products p
           ON o.product_id = p.id
         WHERE o.id = $1
         FOR UPDATE`,
        [id]
      );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Order not found",
      });
    }

    const order =
      orderResult.rows[0];

    await client.query(
      `UPDATE orders
       SET status = $1
       WHERE id = $2`,
      [status, id]
    );

    // Update related shipping record
    if (status === "shipped") {
      await client.query(
        `UPDATE shipping
         SET shipping_status = 'shipped',
             shipped_at = COALESCE(
               shipped_at,
               CURRENT_TIMESTAMP
             )
         WHERE order_id = $1`,
        [id]
      );
    }

    if (status === "delivered") {
      await client.query(
        `UPDATE shipping
         SET shipping_status = 'delivered',
             delivered_at = COALESCE(
               delivered_at,
               CURRENT_TIMESTAMP
             )
         WHERE order_id = $1`,
        [id]
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
        [id]
      );

      // Seller payout becomes payable
      await client.query(
        `UPDATE seller_payouts
         SET payout_status = 'pending'
         WHERE order_id = $1
         AND payout_status = 'processing'`,
        [id]
      );
    }

    if (status === "cancelled") {
      await client.query(
        `UPDATE shipping
         SET shipping_status = 'cancelled'
         WHERE order_id = $1`,
        [id]
      );

      await client.query(
        `UPDATE seller_payouts
         SET payout_status = 'cancelled'
         WHERE order_id = $1
         AND payout_status IN (
           'pending',
           'processing'
         )`,
        [id]
      );

      await client.query(
        `UPDATE payments
         SET payment_status = 'refunded'
         WHERE order_id = $1
         AND payment_status = 'paid'`,
        [id]
      );

      await client.query(
        `UPDATE products
         SET status = 'approved'
         WHERE id = $1`,
        [order.product_id]
      );
    }

    // Notify seller
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
        order.seller_id,
        "Order Status Updated",
        `Order #${id} for "${order.title}" is now ${status}.`,
      ]
    );

    // Notify buyer so My Orders always reflects the latest stage
    const buyerMessages = {
      confirmed:
        `Your order #${id} for "${order.title}" is confirmed and will be shipped soon.`,
      shipped:
        `Your order #${id} for "${order.title}" has been shipped and is on its way.`,
      delivered:
        `Your order #${id} for "${order.title}" has been delivered. Enjoy your book! You can now leave a review.`,
      cancelled:
        `Your order #${id} for "${order.title}" has been cancelled.`,
    };

    if (buyerMessages[status]) {
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
          order.buyer_id,
          "Order Status Updated",
          buyerMessages[status],
        ]
      );
    }

    await client.query("COMMIT");

    res.json({
      message:
        "Order status updated successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Update order status error:",
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
  getAllOrders,
  getAdminOrderById,
  updateOrderStatus,
};