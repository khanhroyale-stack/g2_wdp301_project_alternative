import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import { Toaster } from "react-hot-toast";
// Public pages
import Home from "./pages/core/Home";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import VerifyOTPPage from "./pages/auth/VerifyOTPPage";
import AccountVerification from './pages/auth/AccountVerification';
import Marketplace from "./pages/product/Marketplace";
import ProductDetail from "./pages/product/ProductDetail";

import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

// User pages
import Profile from './pages/user/Profile';
import MyPosts from './pages/user/MyPosts';
import CreatePost from './pages/product/CreatePost';
import MyOrders from './pages/user/MyOrders';
import Rentals from './pages/user/Rentals';
import Messages from './pages/user/Messages';
import Notifications from './pages/user/Notifications';

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AccountApprovals from './pages/admin/AccountApprovals';
import PostApprovals from './pages/admin/PostApprovals';
import UserManagement from './pages/admin/UserManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import ViolationReports from './pages/admin/ViolationReports';
import OrderManagement from './pages/admin/OrderManagement';
import ContractManagement from './pages/admin/ContractManagement';

// Shipper pages
import ShipperDashboard from "./pages/shipper/ShipperDashboard";
import PendingDeliveries from './pages/shipper/PendingDeliveries';
import DeliveringOrders from './pages/shipper/DeliveringOrders';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          {/* ── Công khai ──────────────────────────── */}
          <Route path="/" element={<Home />} />
          <Route path="/dang-nhap" element={<LoginPage />} />
          <Route path="/dang-ky" element={<RegisterPage />} />
          <Route path="/xac-minh-otp" element={<VerifyOTPPage />} />
          <Route path="/xac-minh-tai-khoan" element={<AccountVerification />} />
          <Route path="/quen-mat-khau" element={<ForgotPasswordPage />} />
          <Route path="/dat-lai-mat-khau" element={<ResetPasswordPage />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/cho-thue" element={<Marketplace />} />
          <Route path="/san-pham/:id" element={<ProductDetail />} />
          <Route path="/san-pham" element={<ProductDetail />} />

          {/* ── Người dùng (cần đăng nhập) ─────────── */}
          <Route path="/ho-so" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/quan-ly/bai-dang" element={<PrivateRoute><MyPosts /></PrivateRoute>} />
          <Route path="/dang-tin" element={<PrivateRoute><CreatePost /></PrivateRoute>} />
          <Route path="/don-hang" element={<PrivateRoute><MyOrders /></PrivateRoute>} />
          <Route path="/thue-muon" element={<PrivateRoute><Rentals /></PrivateRoute>} />
          <Route path="/tin-nhan" element={<PrivateRoute><Messages /></PrivateRoute>} />
          <Route path="/thong-bao" element={<PrivateRoute><Notifications /></PrivateRoute>} />

          {/* ── Admin ───────────────────────────────── */}
          <Route path="/admin" element={<PrivateRoute adminOnly><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/duyet-tai-khoan" element={<PrivateRoute adminOnly><AccountApprovals /></PrivateRoute>} />
          <Route path="/admin/duyet-bai-dang" element={<PrivateRoute adminOnly><PostApprovals /></PrivateRoute>} />
          <Route path="/admin/nguoi-dung" element={<PrivateRoute adminOnly><UserManagement /></PrivateRoute>} />
          <Route path="/admin/danh-muc" element={<PrivateRoute adminOnly><CategoryManagement /></PrivateRoute>} />
          <Route path="/admin/bao-cao" element={<PrivateRoute adminOnly><ViolationReports /></PrivateRoute>} />
          <Route path="/admin/don-hang" element={<PrivateRoute adminOnly><OrderManagement /></PrivateRoute>} />
          <Route path="/admin/hop-dong" element={<PrivateRoute adminOnly><ContractManagement /></PrivateRoute>} />

          {/* ── Shipper ─────────────────────────────── */}
          <Route path="/shipper" element={<PrivateRoute shipperOnly><ShipperDashboard /></PrivateRoute>} />
          <Route path="/shipper/don-can-giao" element={<PrivateRoute shipperOnly><PendingDeliveries /></PrivateRoute>} />
          <Route path="/shipper/dang-giao" element={<PrivateRoute shipperOnly><DeliveringOrders /></PrivateRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
