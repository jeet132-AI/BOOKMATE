import { BrowserRouter, Routes, Route } from "react-router-dom";

import AdminLayout from "./layouts/AdminLayout";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProducts from "./pages/AdminProducts";
import PendingProducts from "./pages/PendingProducts";
import AdminUsers from "./pages/AdminUsers";
import AdminOrders from "./pages/AdminOrders";
import AdminPayments from "./pages/AdminPayments";
import AdminShipping from "./pages/AdminShipping";
import AdminPayouts from "./pages/AdminPayouts";
import AdminCategories from "./pages/AdminCategories";
import AdminReports from "./pages/AdminReports";
import AdminPricing from "./pages/AdminPricing";
import AdminReviews from "./pages/AdminReviews";

import ProtectedAdminRoute from "./components/ProtectedAdminRoute";


function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Admin Login */}
        <Route
          path="/login"
          element={<AdminLogin />}
        />


        {/* Protected Admin Area */}
        <Route
          path="/*"
          element={
            <ProtectedAdminRoute>
              <AdminLayout>

                <Routes>

                  {/* Dashboard */}
                  <Route
                    path="/"
                    element={<AdminDashboard />}
                  />


                  {/* Products */}
                  <Route
                    path="/products"
                    element={<AdminProducts />}
                  />

                  <Route
                    path="/products/pending"
                    element={<PendingProducts />}
                  />


                  {/* Users */}
                  <Route
                    path="/users"
                    element={<AdminUsers />}
                  />


                  {/* Orders */}
                  <Route
                    path="/orders"
                    element={<AdminOrders />}
                  />


                  {/* Payments */}
                  <Route
                    path="/payments"
                    element={<AdminPayments />}
                  />


                  {/* Shipping */}
                  <Route
                    path="/shipping"
                    element={<AdminShipping />}
                  />


                  {/* Seller Payouts */}
                  <Route
                    path="/payouts"
                    element={<AdminPayouts />}
                  />


                  {/* Categories */}
                  <Route
                    path="/categories"
                    element={<AdminCategories />}
                  />


                  {/* Reports */}
                  <Route
                    path="/reports"
                    element={<AdminReports />}
                  />


                  {/* Buyer Reviews */}
                  <Route
                    path="/reviews"
                    element={<AdminReviews />}
                  />


                  {/* Pricing */}
                  <Route
                    path="/pricing"
                    element={<AdminPricing />}
                  />

                </Routes>

              </AdminLayout>
            </ProtectedAdminRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;