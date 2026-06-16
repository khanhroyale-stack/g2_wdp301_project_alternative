import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const RegisterPage = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      navigate("/xac-minh-tai-khoan");
    } catch (err) {
      setError(err.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const field = (key, label, type = "text", placeholder = "") => (
    <div>
      <label className="block text-sm font-medium text-on-surface mb-1.5">{label}</label>
      <input type={type} placeholder={placeholder} value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })} required={key !== "phone"}
        className="w-full px-4 py-3 border border-surface-variant rounded-xl text-sm bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" />
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-container-low flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block text-2xl font-bold text-primary tracking-tight mb-3">EcoTrade</Link>
          <h2 className="text-2xl font-bold text-on-surface">Tạo tài khoản</h2>
          <p className="text-on-surface-variant text-sm mt-1">Tham gia cộng đồng EcoTrade khu vực Hòa Lạc</p>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl shadow-apple-md p-8 border border-surface-variant/30">
          {error && (
            <div className="flex items-center gap-2 text-error mb-5 p-3.5 bg-error-container/30 rounded-xl text-sm border border-error/20">
              <span className="material-symbols-outlined text-[18px]">error</span>{error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {field("name", "Họ và tên", "text", "Nguyễn Văn A")}
            {field("email", "Email", "email", "ban@example.com")}
            {field("phone", "Số điện thoại", "tel", "0912 345 678")}
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">Mật khẩu</label>
              <input type="password" placeholder="Tối thiểu 6 ký tự" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6}
                className="w-full px-4 py-3 border border-surface-variant rounded-xl text-sm bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">Xác nhận mật khẩu</label>
              <input type="password" placeholder="Nhập lại mật khẩu" value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required
                className="w-full px-4 py-3 border border-surface-variant rounded-xl text-sm bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" />
            </div>
            <p className="text-xs text-on-surface-variant">
              Bằng cách đăng ký, bạn đồng ý với{" "}
              <a href="#" className="text-primary hover:underline">Điều khoản dịch vụ</a>{" "}và{" "}
              <a href="#" className="text-primary hover:underline">Chính sách bảo mật</a>.
            </p>
            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-primary text-on-primary font-semibold rounded-xl hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-60">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  Đang tạo tài khoản...
                </span>
              ) : "Đăng ký"}
            </button>
          </form>
        </div>

        <p className="text-center mt-5 text-sm text-on-surface-variant">
          Đã có tài khoản?{" "}
          <Link to="/dang-nhap" className="text-primary font-semibold hover:underline">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
};
export default RegisterPage;
