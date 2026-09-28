const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  getPricingSettings,
  updatePricingSettings,
  getCategoryPricingRules,
  upsertCategoryPricingRule,
  deleteCategoryPricingRule,
} = require("../controllers/adminPricingController");

const router = express.Router();

// Get current pricing settings
router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getPricingSettings
);

// Create or update pricing settings
router.put(
  "/",
  authMiddleware,
  adminMiddleware,
  updatePricingSettings
);

// Category-wise pricing rules
router.get(
  "/rules",
  authMiddleware,
  adminMiddleware,
  getCategoryPricingRules
);

router.post(
  "/rules",
  authMiddleware,
  adminMiddleware,
  upsertCategoryPricingRule
);

router.delete(
  "/rules/:id",
  authMiddleware,
  adminMiddleware,
  deleteCategoryPricingRule
);

module.exports = router;