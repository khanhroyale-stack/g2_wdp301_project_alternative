import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardPage from "./pages/DashboardPage";

// Product pages
import ProductList from "./pages/products/ProductList";
import ProductDetail from "./pages/products/ProductDetail";

// Order pages
import CreateOrder from "./pages/orders/CreateOrder";
import OrderList from "./pages/orders/OrderList";
import OrderDetail from "./pages/orders/OrderDetail";

// Delivery pages
import DeliveryList from "./pages/delivery/DeliveryList";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          {/* Temporarily disable authentication for testing */}
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* Product routes */}
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          
          {/* Order routes */}
          <Route path="/orders/create/:productId" element={<CreateOrder />} />
          <Route path="/orders/my-orders" element={<OrderList />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          
          {/* Delivery routes (for shippers) */}
          <Route path="/deliveries" element={<DeliveryList />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
