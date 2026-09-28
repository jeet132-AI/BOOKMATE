const express = require("express");

const {
  getActiveCategories,
} = require("../controllers/adminCategoryController");

const router = express.Router();

// Public list of active categories
router.get(
  "/",
  getActiveCategories
);

module.exports = router;
