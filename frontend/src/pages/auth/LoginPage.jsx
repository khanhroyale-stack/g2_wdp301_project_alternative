import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const LoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(form);
      // Check if we have a saved location to return to
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else {
        // If no saved location, redirect based on role
        if (data.user.role === "shipper") {
          navigate("/shipper", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.needVerification && data?.email) {
        navigate("/xac-thuc-email", { state: { email: data.email }, replace: true });
      } else {
        setError(data?.message || "Email hoac mat khau khong dung.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-low flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block text-2xl font-bold text-primary tracking-tight mb-3">EcoTrade</Link>
          <h2 className="text-2xl font-bold text-on-surface">Đăng nhập</h2>
          <p className="text-on-surface-variant text-sm mt-1">Chào mừng trở lại!</p>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl shadow-apple-md p-8 border border-surface-variant/30">
          {successMessage && (
            <div className="flex items-center gap-2 text-primary mb-5 p-3.5 bg-primary/10 rounded-xl text-sm border border-primary/20">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              {successMessage}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-error mb-5 p-3.5 bg-error-container/30 rounded-xl text-sm border border-error/20">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">Email</label>
              <input type="email" placeholder="ban@example.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required
                className="w-full px-4 py-3 border border-surface-variant rounded-xl text-sm bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">Mật khẩu</label>
              <input type="password" placeholder="••••••••" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} required
                className="w-full px-4 py-3 border border-surface-variant rounded-xl text-sm bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" />
            </div>
            <div className="flex justify-end">
              <Link to="/quen-mat-khau" className="text-sm text-primary hover:underline">Quên mật khẩu?</Link>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-primary text-on-primary font-semibold rounded-xl hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-60">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  Đang đăng nhập...
                </span>
              ) : "Đăng nhập"}
            </button>
          </form>
        </div>

        <p className="text-center mt-5 text-sm text-on-surface-variant">
          Chưa có tài khoản?{" "}
          <Link to="/dang-ky" className="text-primary font-semibold hover:underline">Đăng ký ngay</Link>
        </p>
        <div className="text-center mt-3">
          <Link to="/" className="text-sm text-on-surface-variant hover:text-primary flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
