const pool = require("../db");

// Get all seller payouts
const getAllPayouts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         sp.id,
         sp.order_id,
         sp.seller_id,
         sp.amount,
         sp.payout_status,
         sp.transaction_id,
         sp.paid_at,
         sp.created_at,

         o.buyer_id,
         o.product_id,
         o.buyer_price,
         o.status AS order_status,

         p.title AS product_title,

         buyerPay.payment_method AS buyer_payment_method,
         buyerPay.payment_status AS buyer_payment_status,
         buyerPay.transaction_id AS buyer_transaction_id,

         seller.name AS seller_name,
         seller.email AS seller_email,

         buyer.name AS buyer_name,
         buyer.email AS buyer_email

       FROM seller_payouts sp

       JOIN orders o
         ON sp.order_id = o.id

       JOIN products p
         ON o.product_id = p.id

       JOIN users seller
         ON sp.seller_id = seller.id

       JOIN users buyer
         ON o.buyer_id = buyer.id

       LEFT JOIN payments buyerPay
         ON buyerPay.order_id = o.id

       ORDER BY sp.created_at DESC`
    );

    res.json({
      payouts: result.rows,
    });
  } catch (error) {
    console.error(
      "Get all payouts error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Get one payout
const getPayoutById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
         sp.id,
         sp.order_id,
         sp.seller_id,
         sp.amount,
         sp.payout_status,
         sp.transaction_id,
         sp.paid_at,
         sp.created_at,

         o.buyer_id,
         o.product_id,
         o.buyer_price,
         o.status AS order_status,

         p.title AS product_title,

         buyerPay.payment_method AS buyer_payment_method,
         buyerPay.payment_status AS buyer_payment_status,
         buyerPay.transaction_id AS buyer_transaction_id,

         seller.name AS seller_name,
         seller.email AS seller_email,

         buyer.name AS buyer_name,
         buyer.email AS buyer_email

       FROM seller_payouts sp

       JOIN orders o
         ON sp.order_id = o.id

       JOIN products p
         ON o.product_id = p.id

       JOIN users seller
         ON sp.seller_id = seller.id

       JOIN users buyer
         ON o.buyer_id = buyer.id

       LEFT JOIN payments buyerPay
         ON buyerPay.order_id = o.id

       WHERE sp.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Payout not found",
      });
    }

    res.json({
      payout: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Get payout error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Update payout status
const updatePayoutStatus = async (
  req,
  res
) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    const {
      payout_status,
      transaction_id,
    } = req.body;

    const allowedStatuses = [
      "pending",
      "processing",
      "paid",
      "cancelled",
      "failed",
    ];

    if (!payout_status) {
      return res.status(400).json({
        message:
          "Payout status is required",
      });
    }

    if (
      !allowedStatuses.includes(
        payout_status
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid payout status",
      });
    }

    await client.query("BEGIN");

    const payoutResult =
      await client.query(
        `SELECT
           sp.id,
           sp.order_id,
           sp.seller_id,
           sp.amount,
           sp.payout_status,
           p.title
         FROM seller_payouts sp

         JOIN orders o
           ON sp.order_id = o.id

         JOIN products p
           ON o.product_id = p.id

         WHERE sp.id = $1
         FOR UPDATE`,
        [id]
      );

    if (payoutResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Payout not found",
      });
    }

    const payout =
      payoutResult.rows[0];

    // A payout can only be paid after delivery
    if (payout_status === "paid") {
      const orderResult =
        await client.query(
          `SELECT status
           FROM orders
           WHERE id = $1`,
          [payout.order_id]
        );

      if (
        orderResult.rows.length === 0 ||
        orderResult.rows[0].status !==
          "delivered"
      ) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message:
            "Seller payout can only be paid after the order is delivered",
        });
      }
    }

    const result = await client.query(
      `UPDATE seller_payouts
       SET
         payout_status = $1,
         transaction_id = COALESCE(
           $2,
           transaction_id
         ),
         paid_at =
           CASE
             WHEN $1 = 'paid'
             THEN COALESCE(
               paid_at,
               CURRENT_TIMESTAMP
             )
             ELSE paid_at
           END
       WHERE id = $3
       RETURNING *`,
      [
        payout_status,
        transaction_id || null,
        id,
      ]
    );

    // Notify seller
    let notificationMessage =
      `Your payout for order #${payout.order_id} is now ${payout_status}.`;

    if (payout_status === "paid") {
      notificationMessage =
        `Your payout of ₹${payout.amount} for "${payout.title}" has been paid.`;
    }

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
        payout.seller_id,
        "Seller Payout Update",
        notificationMessage,
      ]
    );

    await client.query("COMMIT");

    res.json({
      message:
        "Payout status updated successfully",
      payout: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Update payout status error:",
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
  getAllPayouts,
  getPayoutById,
  updatePayoutStatus,
};