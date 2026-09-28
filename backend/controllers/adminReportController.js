const pool = require("../db");

// Get all reports
const getAllReports = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         r.id,
         r.reporter_id,
         r.product_id,
         r.reason,
         r.description,
         r.status,
         r.created_at,

         reporter.name AS reporter_name,
         reporter.email AS reporter_email,

         p.title AS product_title,
         p.status AS product_status,

         seller.name AS seller_name,
         seller.email AS seller_email

       FROM reports r

       JOIN users reporter
         ON r.reporter_id = reporter.id

       LEFT JOIN products p
         ON r.product_id = p.id

       LEFT JOIN users seller
         ON p.seller_id = seller.id

       ORDER BY r.created_at DESC`
    );

    res.json({
      reports: result.rows,
    });
  } catch (error) {
    console.error(
      "Get all reports error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Get one report
const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
         r.id,
         r.reporter_id,
         r.product_id,
         r.reason,
         r.description,
         r.status,
         r.created_at,

         reporter.name AS reporter_name,
         reporter.email AS reporter_email,

         p.title AS product_title,
         p.description AS product_description,
         p.status AS product_status,
         p.seller_id,

         seller.name AS seller_name,
         seller.email AS seller_email

       FROM reports r

       JOIN users reporter
         ON r.reporter_id = reporter.id

       LEFT JOIN products p
         ON r.product_id = p.id

       LEFT JOIN users seller
         ON p.seller_id = seller.id

       WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Report not found",
      });
    }

    res.json({
      report: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Get report error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


// Update report status
const updateReportStatus = async (
  req,
  res
) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "reviewing",
      "resolved",
      "rejected",
    ];

    if (!status) {
      return res.status(400).json({
        message:
          "Report status is required",
      });
    }

    if (
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        message:
          "Invalid report status",
      });
    }

    await client.query("BEGIN");

    const reportResult =
      await client.query(
        `SELECT
           r.id,
           r.reporter_id,
           r.product_id,
           r.reason,
           p.title AS product_title,
           p.seller_id
         FROM reports r

         LEFT JOIN products p
           ON r.product_id = p.id

         WHERE r.id = $1
         FOR UPDATE`,
        [id]
      );

    if (reportResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Report not found",
      });
    }

    const report =
      reportResult.rows[0];

    const result = await client.query(
      `UPDATE reports
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    // Notify the person who submitted
    // the report.
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
        report.reporter_id,
        "Report Status Updated",
        `Your report #${id} is now ${status}.`,
      ]
    );

    // If a report is resolved against
    // a product, notify the seller.
    if (
      status === "resolved" &&
      report.seller_id
    ) {
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
          report.seller_id,
          "Product Report Resolved",
          `A report concerning "${report.product_title || "your product"}" has been resolved by the administrator.`,
        ]
      );
    }

    await client.query("COMMIT");

    res.json({
      message:
        "Report status updated successfully",
      report: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Update report status error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  } finally {
    client.release();
  }
};


// Delete a report
const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM reports
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Report not found",
      });
    }

    res.json({
      message:
        "Report deleted successfully",
      report: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Delete report error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


// PERFORMANCE ANALYTICS — marketplace overview
// GET /api/admin/reports/stats?period=daily|monthly|yearly&from=YYYY-MM-DD&to=YYYY-MM-DD&category=X
const getPerformanceStats = async (req, res) => {
  try {
    const allowedPeriods = {
      daily: { unit: "day", format: "YYYY-MM-DD" },
      monthly: { unit: "month", format: "YYYY-MM" },
      yearly: { unit: "year", format: "YYYY" },
    };

    const period = allowedPeriods[req.query.period]
      ? req.query.period
      : "monthly";
    const { unit, format } = allowedPeriods[period];

    const { from, to, category } = req.query;

    // Shared filters for order-based queries
    const orderFilters = [];
    const orderValues = [];
    const productFilters = [];
    const productValues = [];

    if (from) {
      orderValues.push(from);
      orderFilters.push(
        `o.created_at >= $${orderValues.length}`
      );
    }

    if (to) {
      orderValues.push(to);
      orderFilters.push(
        `o.created_at <= ($${orderValues.length}::date + INTERVAL '1 day' - INTERVAL '1 second')`
      );
    }

    if (category && category !== "All") {
      orderValues.push(category);
      orderFilters.push(
        `p.category = $${orderValues.length}`
      );
      productValues.push(category);
      productFilters.push(
        `p.category = $${productValues.length}`
      );
    }

    const orderWhere = orderFilters.length
      ? `WHERE ${orderFilters.join(" AND ")}`
      : "";
    const productWhere = productFilters.length
      ? `WHERE ${productFilters.join(" AND ")}`
      : "";

    // Default time window when no explicit dates given
    let windowClause = "";
    if (!from && !to) {
      if (period === "daily") {
        windowClause = `o.created_at >= CURRENT_DATE - INTERVAL '30 days'`;
      } else if (period === "monthly") {
        windowClause = `o.created_at >= CURRENT_DATE - INTERVAL '12 months'`;
      }
    }

    const scopedWhere = [
      ...orderFilters,
      ...(windowClause ? [windowClause] : []),
    ];
    const scopedWhereSql = scopedWhere.length
      ? `WHERE ${scopedWhere.join(" AND ")}`
      : "";

    // ---- Totals ----
    const totalsResult = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE o.status <> 'cancelled')::int AS total_orders,
         COUNT(*) FILTER (WHERE o.status = 'delivered')::int AS delivered_orders,
         COALESCE(SUM(o.buyer_price) FILTER (WHERE o.status <> 'cancelled'), 0) AS total_sales,
         COALESCE(SUM(o.platform_fee) FILTER (WHERE o.status <> 'cancelled'), 0) AS platform_earnings
       FROM orders o
       JOIN products p ON o.product_id = p.id
       ${orderWhere}`,
      orderValues
    );

    // ---- Books ----
    const booksResult = await pool.query(
      `SELECT
         COUNT(*)::int AS listed,
         COUNT(*) FILTER (WHERE p.status = 'sold')::int AS sold
       FROM products p
       ${productWhere}`,
      productValues
    );

    // ---- Users ----
    const usersResult = await pool.query(
      `SELECT
         COUNT(*)::int AS total_users,
         (SELECT COUNT(DISTINCT seller_id)::int FROM products) AS total_sellers`
    );

    // ---- Payouts ----
    const payoutFilters = [];
    const payoutValues = [];
    if (from) {
      payoutValues.push(from);
      payoutFilters.push(
        `sp.created_at >= $${payoutValues.length}`
      );
    }
    if (to) {
      payoutValues.push(to);
      payoutFilters.push(
        `sp.created_at <= ($${payoutValues.length}::date + INTERVAL '1 day' - INTERVAL '1 second')`
      );
    }
    const payoutWhere = payoutFilters.length
      ? `WHERE ${payoutFilters.join(" AND ")}`
      : "";
    const payoutsResult = await pool.query(
      `SELECT
         COALESCE(SUM(sp.amount) FILTER (WHERE sp.payout_status = 'paid'), 0) AS paid,
         COALESCE(SUM(sp.amount) FILTER (WHERE sp.payout_status = 'pending'), 0) AS pending,
         COALESCE(SUM(sp.amount) FILTER (WHERE sp.payout_status = 'failed'), 0) AS failed
       FROM seller_payouts sp
       ${payoutWhere}`,
      payoutValues
    );

    // ---- Sales by category ----
    const categoryResult = await pool.query(
      `SELECT
         p.category,
         COUNT(*)::int AS orders,
         COALESCE(SUM(o.buyer_price), 0) AS revenue
       FROM orders o
       JOIN products p ON o.product_id = p.id
       ${scopedWhereSql ? `${scopedWhereSql} AND o.status <> 'cancelled'` : `WHERE o.status <> 'cancelled'`}
       GROUP BY p.category
       ORDER BY revenue DESC`,
      orderValues
    );

    // ---- Timeseries ----
    const seriesResult = await pool.query(
      `SELECT
         to_char(date_trunc('${unit}', o.created_at), '${format}') AS label,
         COUNT(*)::int AS orders,
         COALESCE(SUM(o.buyer_price), 0) AS revenue
       FROM orders o
       JOIN products p ON o.product_id = p.id
       ${scopedWhereSql ? `${scopedWhereSql} AND o.status <> 'cancelled'` : `WHERE o.status <> 'cancelled'`}
       GROUP BY date_trunc('${unit}', o.created_at), label
       ORDER BY date_trunc('${unit}', o.created_at) ASC`,
      orderValues
    );

    res.json({
      period,
      filters: {
        from: from || null,
        to: to || null,
        category: category || "All",
      },
      totals: {
        ...totalsResult.rows[0],
        books_listed: booksResult.rows[0].listed,
        books_sold: booksResult.rows[0].sold,
        total_users: usersResult.rows[0].total_users,
        total_sellers: usersResult.rows[0].total_sellers,
        payouts_paid: payoutsResult.rows[0].paid,
        payouts_pending: payoutsResult.rows[0].pending,
        payouts_failed: payoutsResult.rows[0].failed,
      },
      sales_by_category: categoryResult.rows,
      timeseries: seriesResult.rows,
    });
  } catch (error) {
    console.error(
      "Performance stats error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


module.exports = {
  getAllReports,
  getReportById,
  getPerformanceStats,
  updateReportStatus,
  deleteReport,
};