import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";

import Home from "./pages/core/Home";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import VerifyOTPPage from "./pages/auth/VerifyOTPPage";
import AccountVerification from "./pages/auth/AccountVerification";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";

import Profile from "./pages/user/Profile";
import MyPosts from "./pages/user/MyPosts";
import CreatePost from "./pages/product/CreatePost";
import MyOrdersPage from "./pages/user/MyOrders";
import Rentals from "./pages/user/Rentals";
import Messages from "./pages/user/Messages";
import Notifications from "./pages/user/Notifications";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AccountApprovals from "./pages/admin/AccountApprovals";
import PostApprovals from "./pages/admin/PostApprovals";
import UserManagement from "./pages/admin/UserManagement";
import CategoryManagement from "./pages/admin/CategoryManagement";
import ViolationReports from "./pages/admin/ViolationReports";
import OrderManagement from "./pages/admin/OrderManagement";
import ContractManagement from "./pages/admin/ContractManagement";

import ShipperDashboard from "./pages/shipper/ShipperDashboard";

import ProductList from "./pages/products/ProductList";
import BuyerProductDetail from "./pages/products/ProductDetail";
import Marketplace from "./pages/product/Marketplace";
import ProductDetail from "./pages/product/ProductDetail";
import CreateOrder from "./pages/orders/CreateOrder";
import OrderList from "./pages/orders/OrderList";
import OrderDetail from "./pages/orders/OrderDetail";
import MySales from "./pages/orders/MySales";
import DeliveryList from "./pages/delivery/DeliveryList";
import DeliveryDetail from "./pages/delivery/DeliveryDetail";
import DeliveryInspection from "./pages/delivery/DeliveryInspection";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dang-nhap" element={<LoginPage />} />
          <Route path="/login" element={<Navigate to="/dang-nhap" replace />} />
          <Route path="/dang-ky" element={<RegisterPage />} />
          <Route path="/register" element={<Navigate to="/dang-ky" replace />} />
          <Route path="/xac-minh-otp" element={<VerifyOTPPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/xac-minh-tai-khoan" element={<AccountVerification />} />
          <Route path="/quen-mat-khau" element={<ForgotPasswordPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/dat-lai-mat-khau" element={<ResetPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/cho-thue" element={<Marketplace />} />
          <Route path="/products/:id" element={<BuyerProductDetail />} />
          <Route path="/san-pham/:id" element={<ProductDetail />} />

          <Route path="/ho-so" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/quan-ly/bai-dang" element={<PrivateRoute><MyPosts /></PrivateRoute>} />
          <Route path="/dang-tin" element={<PrivateRoute><CreatePost /></PrivateRoute>} />
          <Route path="/dang-tin/:id" element={<PrivateRoute><CreatePost /></PrivateRoute>} />
          <Route path="/thue-muon" element={<PrivateRoute><Rentals /></PrivateRoute>} />
          <Route path="/tin-nhan" element={<PrivateRoute><Messages /></PrivateRoute>} />
          <Route path="/thong-bao" element={<PrivateRoute><Notifications /></PrivateRoute>} />

          <Route path="/don-hang" element={<PrivateRoute><MyOrdersPage /></PrivateRoute>} />
          <Route path="/orders/create/:productId" element={<PrivateRoute><CreateOrder /></PrivateRoute>} />
          <Route path="/orders/my-orders" element={<PrivateRoute><OrderList /></PrivateRoute>} />
          <Route path="/orders/my-sales" element={<PrivateRoute><MySales /></PrivateRoute>} />
          <Route path="/orders/:id" element={<PrivateRoute><OrderDetail /></PrivateRoute>} />

          <Route path="/admin" element={<PrivateRoute adminOnly><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/duyet-tai-khoan" element={<PrivateRoute adminOnly><AccountApprovals /></PrivateRoute>} />
          <Route path="/admin/duyet-bai-dang" element={<PrivateRoute adminOnly><PostApprovals /></PrivateRoute>} />
          <Route path="/admin/nguoi-dung" element={<PrivateRoute adminOnly><UserManagement /></PrivateRoute>} />
          <Route path="/admin/danh-muc" element={<PrivateRoute adminOnly><CategoryManagement /></PrivateRoute>} />
          <Route path="/admin/bao-cao" element={<PrivateRoute adminOnly><ViolationReports /></PrivateRoute>} />
          <Route path="/admin/don-hang" element={<PrivateRoute adminOnly><OrderManagement /></PrivateRoute>} />
          <Route path="/admin/hop-dong" element={<PrivateRoute adminOnly><ContractManagement /></PrivateRoute>} />

          <Route path="/shipper" element={<PrivateRoute shipperOnly><ShipperDashboard /></PrivateRoute>} />
          <Route path="/shipper/don-can-giao" element={<PrivateRoute shipperOnly><DeliveryList /></PrivateRoute>} />
          <Route path="/shipper/dang-giao" element={<PrivateRoute shipperOnly><DeliveryList /></PrivateRoute>} />
          <Route path="/deliveries" element={<PrivateRoute shipperOnly><DeliveryList /></PrivateRoute>} />
          <Route path="/deliveries/:id" element={<PrivateRoute><DeliveryDetail /></PrivateRoute>} />
          <Route path="/deliveries/:id/inspection" element={<PrivateRoute shipperOnly><DeliveryInspection /></PrivateRoute>} />
          <Route path="/inspections/:id" element={<PrivateRoute><DeliveryInspection /></PrivateRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
