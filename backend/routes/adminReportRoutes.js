const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  getAllReports,
  getReportById,
  getPerformanceStats,
  updateReportStatus,
  deleteReport,
} = require("../controllers/adminReportController");

const router = express.Router();

// Marketplace performance analytics (before "/:id")
router.get(
  "/stats",
  authMiddleware,
  adminMiddleware,
  getPerformanceStats
);

// Get all reports
router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getAllReports
);

// Get one report
router.get(
  "/:id",
  authMiddleware,
  adminMiddleware,
  getReportById
);

// Update report status
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  updateReportStatus
);

// Delete report
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  deleteReport
);

module.exports = router;