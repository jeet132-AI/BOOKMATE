const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  getAllReviews,
  deleteAnyReview,
} = require("../controllers/reviewController");

const router = express.Router();

// Get every buyer review
router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getAllReviews
);

// Delete any review
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  deleteAnyReview
);

module.exports = router;
