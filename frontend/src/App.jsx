import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";

// Public pages
import Home from "./pages/core/Home";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import XacMinhTaiKhoan from "./pages/auth/XacMinhTaiKhoan";
import Marketplace from "./pages/product/Marketplace";
import ProductDetail from "./pages/product/ProductDetail";

// User pages
import HoSo from "./pages/user/HoSo";
import QuanLyBaiDang from "./pages/user/QuanLyBaiDang";
import DangTin from "./pages/product/DangTin";
import DonHang from "./pages/user/DonHang";
import ThueMuon from "./pages/user/ThueMuon";
import TinNhan from "./pages/user/TinNhan";
import ThongBao from "./pages/user/ThongBao";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import DuyetTaiKhoan from "./pages/admin/DuyetTaiKhoan";
import DuyetBaiDang from "./pages/admin/DuyetBaiDang";
import QuanLyNguoiDung from "./pages/admin/QuanLyNguoiDung";
import QuanLyDanhMuc from "./pages/admin/QuanLyDanhMuc";
import BaoCaoViPham from "./pages/admin/BaoCaoViPham";
import QuanLyDonHang from "./pages/admin/QuanLyDonHang";
import QuanLyHopDong from "./pages/admin/QuanLyHopDong";

// Shipper pages
import ShipperDashboard from "./pages/shipper/ShipperDashboard";
import DonCanGiao from "./pages/shipper/DonCanGiao";
import DangGiao from "./pages/shipper/DangGiao";



function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Công khai ──────────────────────────── */}
          <Route path="/" element={<Home />} />
          <Route path="/dang-nhap" element={<LoginPage />} />
          <Route path="/dang-ky" element={<RegisterPage />} />
          <Route path="/xac-minh-tai-khoan" element={<XacMinhTaiKhoan />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/cho-thue" element={<Marketplace />} />
          <Route path="/san-pham/:id" element={<ProductDetail />} />
          <Route path="/san-pham" element={<ProductDetail />} />

          {/* ── Người dùng (cần đăng nhập) ─────────── */}
          <Route path="/ho-so" element={<PrivateRoute><HoSo /></PrivateRoute>} />
          <Route path="/quan-ly/bai-dang" element={<PrivateRoute><QuanLyBaiDang /></PrivateRoute>} />
          <Route path="/dang-tin" element={<PrivateRoute><DangTin /></PrivateRoute>} />
          <Route path="/don-hang" element={<PrivateRoute><DonHang /></PrivateRoute>} />
          <Route path="/thue-muon" element={<PrivateRoute><ThueMuon /></PrivateRoute>} />
          <Route path="/tin-nhan" element={<PrivateRoute><TinNhan /></PrivateRoute>} />
          <Route path="/thong-bao" element={<PrivateRoute><ThongBao /></PrivateRoute>} />

          {/* ── Admin ───────────────────────────────── */}
          <Route path="/admin" element={<PrivateRoute adminOnly><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/duyet-tai-khoan" element={<PrivateRoute adminOnly><DuyetTaiKhoan /></PrivateRoute>} />
          <Route path="/admin/duyet-bai-dang" element={<PrivateRoute adminOnly><DuyetBaiDang /></PrivateRoute>} />
          <Route path="/admin/nguoi-dung" element={<PrivateRoute adminOnly><QuanLyNguoiDung /></PrivateRoute>} />
          <Route path="/admin/danh-muc" element={<PrivateRoute adminOnly><QuanLyDanhMuc /></PrivateRoute>} />
          <Route path="/admin/bao-cao" element={<PrivateRoute adminOnly><BaoCaoViPham /></PrivateRoute>} />
          <Route path="/admin/don-hang" element={<PrivateRoute adminOnly><QuanLyDonHang /></PrivateRoute>} />
          <Route path="/admin/hop-dong" element={<PrivateRoute adminOnly><QuanLyHopDong /></PrivateRoute>} />

          {/* ── Shipper ─────────────────────────────── */}
          <Route path="/shipper" element={<PrivateRoute shipperOnly><ShipperDashboard /></PrivateRoute>} />
          <Route path="/shipper/don-can-giao" element={<PrivateRoute shipperOnly><DonCanGiao /></PrivateRoute>} />
          <Route path="/shipper/dang-giao" element={<PrivateRoute shipperOnly><DangGiao /></PrivateRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
