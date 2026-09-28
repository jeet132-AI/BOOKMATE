import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import Home from "./pages/Home";
import Books from "./pages/Books";
import BookDetails from "./pages/BookDetails";
import Sell from "./pages/Sell";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Checkout from "./pages/Checkout";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Listings from "./pages/Listings";
import Wishlist from "./pages/Wishlist";
import Reviews from "./pages/Reviews";
import Category from "./pages/Category";
import Cart from "./pages/Cart";
import SellAgain from "./pages/SellAgain";
import ProductImages from "./pages/ProductImages";
import ProtectedRoute from "./components/ProtectedRoute";
import HoliCursor from "./HoliCursor";
import useTheme from "./hooks/useTheme";
import { CartProvider } from "./context/CartContext";

function App() {
  // Applies the saved theme (default: light) to every route,
  // including Login/Register which render without a Navbar.
  useTheme();

  return (
    <CartProvider>
    <BrowserRouter>
      <HoliCursor />

      <Routes>
        <Route
          path="/"
          element={
            <MainLayout>
              <Home />
            </MainLayout>
          }
        />

        <Route
          path="/books"
          element={
            <MainLayout>
              <Books />
            </MainLayout>
          }
        />

        <Route
          path="/books/:id"
          element={
            <MainLayout>
              <BookDetails />
            </MainLayout>
          }
        />

        <Route
          path="/sell"
          element={
            <MainLayout>
              <Sell />
            </MainLayout>
          }
        />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/checkout/:productId"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Checkout />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Profile />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Orders />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/listings"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Listings />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/wishlist"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Wishlist />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reviews"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Reviews />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/cart"
          element={
            <MainLayout>
              <Cart />
            </MainLayout>
          }
        />

        <Route
          path="/category/:name"
          element={
            <MainLayout>
              <Category />
            </MainLayout>
          }
        />

        <Route
          path="/sell-again/:productId"
          element={
            <ProtectedRoute>
              <MainLayout>
                <SellAgain />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/products/:productId/images"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ProductImages />
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
    </CartProvider>
  );
}

export default App;