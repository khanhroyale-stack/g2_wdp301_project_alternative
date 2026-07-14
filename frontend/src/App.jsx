import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import PrivateRoute from "./components/PrivateRoute";
import { Toaster } from "react-hot-toast";
import LiveChatWidget from "./components/support/LiveChatWidget";
import UserChatWidget from "./components/chat/UserChatWidget";

import Home from "./pages/core/Home";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import VerifyOTPPage from "./pages/auth/VerifyOTPPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFoundPage from "./pages/core/NotFoundPage";

import Profile from "./pages/user/Profile";
import PublicProfile from "./pages/user/PublicProfile";
import MyPosts from "./pages/user/MyPosts";
import CreatePost from "./pages/product/CreatePost";
import SelectFeaturedProducts from "./pages/user/SelectFeaturedProducts";
import Rentals from "./pages/user/Rentals";
import RentalDetail from "./pages/user/RentalDetail";
import CreateRentalRequest from "./pages/rental/CreateRentalRequest";
import Messages from "./pages/user/Messages";
import Notifications from "./pages/user/Notifications";
import Cart from "./pages/user/Cart";
import ProPlans from "./pages/user/ProPlans";
import ProResult from "./pages/user/ProResult";

import AdminDashboard from "./pages/admin/AdminDashboard";
import PostApprovals from "./pages/admin/PostApprovals";
import UserManagement from "./pages/admin/UserManagement";
import CategoryManagement from "./pages/admin/CategoryManagement";
import ViolationReports from "./pages/admin/ViolationReports";
import OrderManagement from "./pages/admin/OrderManagement";
import ContractManagement from "./pages/admin/ContractManagement";
import LogisticsManagement from "./pages/admin/LogisticsManagement";
import SupportManagement from "./pages/admin/SupportManagement";

import Marketplace from "./pages/product/Marketplace";
import ProductDetail from "./pages/product/ProductDetail";
import CreateOrder from "./pages/orders/CreateOrder";
import OrderList from "./pages/orders/OrderList";
import OrderHistory from "./pages/orders/OrderHistory";
import OrderDetail from "./pages/orders/OrderDetail";
import MySales from "./pages/orders/MySales";
import DeliveryList from "./pages/delivery/DeliveryList";
import DeliveryDetail from "./pages/delivery/DeliveryDetail";
import DeliveryInspection from "./pages/delivery/DeliveryInspection";
import ShipperReport from "./pages/delivery/ShipperReport";

function LegacyProductRedirect() {
  const { id } = useParams();
  return <Navigate to={`/marketplaces/${id}`} replace />;
}

function LegacyOrderRedirect() {
  const { id } = useParams();
  return <Navigate to={`/orders/${id}`} replace />;
}

const ChatRoomRedirect = () => {
  const { roomId } = useParams();
  return <Navigate to={`/tin-nhan/${roomId}`} replace />;
};

const ShipperRedirect = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-surface-variant border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-on-surface-variant">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!loading && user?.role === "shipper") {
    return <Navigate to="/shipper" replace />;
  }

  return children;
};

const RoleScopedWidgets = () => {
  const { user } = useAuth();

  if (user?.role === "shipper") return null;

  return (
    <>
      <LiveChatWidget />
      <UserChatWidget />
    </>
  );
};

const RoleBasedRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-surface-variant border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-on-surface-variant">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (user) {
    if (user.role === "shipper") {
      return <Navigate to="/shipper" replace />;
    }
    if (user.role === "admin") {
      return <Navigate to="/admin" replace />;
    }
  }

  return <Home />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ChatProvider>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <RoleScopedWidgets />
          <Routes>
            <Route path="/" element={<RoleBasedRedirect />} />
            <Route path="/dang-nhap" element={<LoginPage />} />
            <Route path="/login" element={<Navigate to="/dang-nhap" replace />} />
            <Route path="/dang-ky" element={<RegisterPage />} />
            <Route path="/register" element={<Navigate to="/dang-ky" replace />} />
            <Route path="/xac-thuc-email" element={<VerifyOTPPage />} />
            <Route path="/quen-mat-khau" element={<ForgotPasswordPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/dat-lai-mat-khau" element={<ResetPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route path="/marketplaces" element={<ShipperRedirect><Marketplace /></ShipperRedirect>} />
            <Route path="/marketplace" element={<Navigate to="/marketplaces" replace />} />
            <Route path="/product" element={<Navigate to="/marketplaces" replace />} />
            <Route path="/products" element={<Navigate to="/marketplaces" replace />} />
            <Route path="/cho-thue" element={<ShipperRedirect><Marketplace /></ShipperRedirect>} />
            <Route path="/san-pham" element={<Navigate to="/marketplaces" replace />} />
            <Route path="/marketplaces/:id" element={<ShipperRedirect><ProductDetail /></ShipperRedirect>} />
            <Route path="/products/:id" element={<LegacyProductRedirect />} />
            <Route path="/product/:id" element={<LegacyProductRedirect />} />
            <Route path="/san-pham/:id" element={<LegacyProductRedirect />} />
            <Route path="/chat/:roomId" element={<ChatRoomRedirect />} />
            <Route path="/nguoi-dung/:id" element={<ShipperRedirect><PublicProfile /></ShipperRedirect>} />

            <Route path="/ho-so" element={<PrivateRoute userOnly><Profile /></PrivateRoute>} />
            <Route path="/quan-ly/bai-dang" element={<PrivateRoute userOnly><MyPosts /></PrivateRoute>} />
            <Route path="/dang-tin" element={<PrivateRoute userOnly><CreatePost /></PrivateRoute>} />
            <Route path="/dang-tin/:id" element={<PrivateRoute userOnly><CreatePost /></PrivateRoute>} />
            <Route path="/thue-muon" element={<PrivateRoute userOnly><Rentals /></PrivateRoute>} />
            <Route path="/thue-muon/:id" element={<PrivateRoute userOnly><RentalDetail /></PrivateRoute>} />
            <Route path="/thue/:productId" element={<PrivateRoute userOnly><CreateRentalRequest /></PrivateRoute>} />
            <Route path="/tin-nhan" element={<PrivateRoute userOnly><Messages /></PrivateRoute>} />
            <Route path="/tin-nhan/:roomId" element={<PrivateRoute userOnly><Messages /></PrivateRoute>} />
            <Route path="/thong-bao" element={<PrivateRoute userOnly><Notifications /></PrivateRoute>} />
            <Route path="/gio-hang" element={<PrivateRoute userOnly><Cart /></PrivateRoute>} />
            <Route path="/goi-pro" element={<PrivateRoute userOnly><ProPlans /></PrivateRoute>} />
            <Route path="/goi-pro/ket-qua" element={<ShipperRedirect><ProResult /></ShipperRedirect>} />
            <Route path="/goi-pro/chon-san-pham-noi-bat" element={<PrivateRoute userOnly><SelectFeaturedProducts /></PrivateRoute>} />

            <Route path="/don-hang" element={<Navigate to="/orders/my-orders" replace />} />
            <Route path="/don-hang/:id" element={<LegacyOrderRedirect />} />
            <Route path="/don-ban" element={<Navigate to="/orders/my-sales" replace />} />
            <Route path="/dat-hang/:productId" element={<PrivateRoute userOnly><CreateOrder /></PrivateRoute>} />
            <Route path="/orders/my-orders" element={<PrivateRoute userOnly><OrderList /></PrivateRoute>} />
            <Route path="/orders/history" element={<PrivateRoute userOnly><OrderHistory /></PrivateRoute>} />
            <Route path="/orders/my-sales" element={<PrivateRoute userOnly><MySales /></PrivateRoute>} />
            <Route path="/orders/:id" element={<PrivateRoute userOnly><OrderDetail /></PrivateRoute>} />

            <Route path="/giao-hang" element={<Navigate to="/shipper" replace />} />
            <Route path="/giao-hang/:id" element={<Navigate to="/shipper" replace />} />
            <Route path="/giao-hang/:id/kiem-tra" element={<Navigate to="/shipper" replace />} />

            <Route path="/admin" element={<PrivateRoute adminOnly><AdminDashboard /></PrivateRoute>} />
            <Route path="/admin/duyet-bai-dang" element={<PrivateRoute adminOnly><PostApprovals /></PrivateRoute>} />
            <Route path="/admin/nguoi-dung" element={<PrivateRoute adminOnly><UserManagement /></PrivateRoute>} />
            <Route path="/admin/danh-muc" element={<PrivateRoute adminOnly><CategoryManagement /></PrivateRoute>} />
            <Route path="/admin/bao-cao" element={<PrivateRoute adminOnly><ViolationReports /></PrivateRoute>} />
            <Route path="/admin/don-hang" element={<PrivateRoute adminOnly><OrderManagement /></PrivateRoute>} />
            <Route path="/admin/hop-dong" element={<PrivateRoute adminOnly><ContractManagement /></PrivateRoute>} />
            <Route path="/admin/shippers" element={<PrivateRoute adminOnly><LogisticsManagement mode="shippers" /></PrivateRoute>} />
            <Route path="/admin/giao-hang" element={<PrivateRoute adminOnly><LogisticsManagement mode="deliveries" /></PrivateRoute>} />
            <Route path="/admin/kiem-dinh" element={<PrivateRoute adminOnly><LogisticsManagement mode="inspections" /></PrivateRoute>} />
            <Route path="/admin/bao-cao-giao-hang" element={<PrivateRoute adminOnly><LogisticsManagement mode="reports" /></PrivateRoute>} />
            <Route path="/admin/hotro" element={<PrivateRoute adminOnly><SupportManagement /></PrivateRoute>} />

            <Route path="/shipper" element={<PrivateRoute shipperOnly><DeliveryList /></PrivateRoute>} />
            <Route path="/shipper/don/:id" element={<PrivateRoute shipperOnly><DeliveryDetail /></PrivateRoute>} />
            <Route path="/shipper/don/:id/inspection" element={<PrivateRoute shipperOnly><DeliveryInspection /></PrivateRoute>} />
            <Route path="/shipper/don/:id/bao-cao" element={<PrivateRoute shipperOnly><ShipperReport /></PrivateRoute>} />
            <Route path="/shipper/inspection/:id" element={<PrivateRoute shipperOnly><DeliveryInspection /></PrivateRoute>} />
            <Route path="/shipper/don-can-giao" element={<Navigate to="/shipper" replace />} />
            <Route path="/shipper/dang-giao" element={<Navigate to="/shipper" replace />} />
            <Route path="/deliveries" element={<Navigate to="/shipper" replace />} />
            <Route path="/deliveries/:id" element={<Navigate to="/shipper" replace />} />
            <Route path="/deliveries/:id/inspection" element={<Navigate to="/shipper" replace />} />
            <Route path="/inspections/:id" element={<Navigate to="/shipper" replace />} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
