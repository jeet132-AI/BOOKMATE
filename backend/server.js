const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

const PORT = process.env.PORT || 5000;


// MIDDLEWARE

app.use(cors());

app.use(express.json());


// SERVE UPLOADED BOOK IMAGES

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);


// BASIC ROUTE

app.get("/", (req, res) => {
  res.send(
    "USED BOOK MARKET Backend is running"
  );
});


// USER & AUTH ROUTES

app.use(
  "/api/users",
  userRoutes
);

app.use(
  "/api/auth",
  authRoutes
);


// PRODUCT ROUTES

app.use(
  "/api/products",
  productRoutes
);


// ORDER ROUTES

app.use(
  "/api/orders",
  orderRoutes
);


// WISHLIST ROUTES

app.use(
  "/api/wishlist",
  wishlistRoutes
);


// REVIEW ROUTES

app.use(
  "/api/reviews",
  reviewRoutes
);


// PUBLIC CATEGORY LIST

app.use(
  "/api/categories",
  categoryRoutes
);


// ADMIN ROUTES

app.use(
  "/api/admin",
  adminRoutes
);


// 404 ROUTE

app.use((req, res) => {
  res.status(404).json({
    message: "API route not found",
  });
});


// START SERVER

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});