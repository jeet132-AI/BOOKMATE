const express = require("express");
const rateLimit = require("express-rate-limit");

const {
  registerUser,
  loginUser,
} = require("../controllers/authController");

const router = express.Router();

// Slow down brute-force attacks on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message:
      "Too many attempts. Please try again after 15 minutes.",
  },
});

// Register
router.post(
  "/register",
  authLimiter,
  registerUser
);

// Login
router.post(
  "/login",
  authLimiter,
  loginUser
);

module.exports = router;