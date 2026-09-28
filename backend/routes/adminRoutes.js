const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  getPendingProducts,
  approveProduct,
  rejectProduct,
  getAllProducts,
} = require("../controllers/adminController");

const {
  getAllUsers,
} = require("../controllers/adminUserController");

const adminOrderRoutes = require("./adminOrderRoutes");
const adminReviewRoutes = require("./adminReviewRoutes");
const adminPaymentRoutes = require("./adminPaymentRoutes");const adminShippingRoutes = require("./adminShippingRoutes");
const adminPayoutRoutes = require("./adminPayoutRoutes");
const adminCategoryRoutes = require("./adminCategoryRoutes");
const adminReportRoutes = require("./adminReportRoutes");
const adminPricingRoutes = require("./adminPricingRoutes");

const router = express.Router();

// ADMIN PRODUCT MANAGEMENT

// Get pending products
router.get(
  "/products/pending",
  authMiddleware,
  adminMiddleware,
  getPendingProducts
);


// Get all products
router.get(
  "/products",
  authMiddleware,
  adminMiddleware,
  getAllProducts
);


// Approve product
router.put(
  "/products/:id/approve",
  authMiddleware,
  adminMiddleware,
  approveProduct
);


// Reject product
router.put(
  "/products/:id/reject",
  authMiddleware,
  adminMiddleware,
  rejectProduct
);


// ADMIN USER MANAGEMENT
// Get all users
router.get(
  "/users",
  authMiddleware,
  adminMiddleware,
  getAllUsers
);



// ADMIN ORDER MANAGEMENT

router.use(
  "/orders",
  adminOrderRoutes
);



// ADMIN REVIEW MANAGEMENT

router.use(
  "/reviews",
  adminReviewRoutes
);



// ADMIN PAYMENT MANAGEMENT

router.use(
  "/payments",
  adminPaymentRoutes
);



// ADMIN SHIPPING MANAGEMENT

router.use(
  "/shipping",
  adminShippingRoutes
);



// ADMIN PAYOUT MANAGEMENT

router.use(
  "/payouts",
  adminPayoutRoutes
);


// ADMIN CATEGORY MANAGEMENT

router.use(
  "/categories",
  adminCategoryRoutes
);



// ADMIN REPORT MANAGEMENT


router.use(
  "/reports",
  adminReportRoutes
);



// ADMIN PRICING MANAGEMENT

router.use(
  "/pricing",
  adminPricingRoutes
);


module.exports = router;