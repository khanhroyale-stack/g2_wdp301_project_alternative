import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const RegisterPage = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
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
      await register({
        fullName: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        bankAccountNumber: form.bankAccountNumber.trim(),
        bankName: form.bankName.trim(),
        bankAccountHolder: form.bankAccountHolder.trim(),
      });
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
    <AuthLayout
      title="Tạo tài khoản"
      subtitle="Tham gia cộng đồng EcoTrade khu vực Hòa Lạc"
      footer={
        <p className="text-center mt-5 text-sm text-on-surface-variant">
          Đã có tài khoản?{" "}
          <Link to="/dang-nhap" className="text-primary font-semibold hover:underline">
            Đăng nhập
          </Link>
        </p>
      }
    >
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 text-error mb-5 p-3.5 bg-error-container/30 rounded-xl text-sm border border-error/20"
        >
          <span className="material-symbols-outlined text-[18px]">error</span>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <AuthField
          id="register-name"
          label="Họ và tên"
          autoComplete="name"
          placeholder="Nguyễn Văn A"
          value={form.name}
          onChange={handleChange("name")}
          onBlur={handleBlur("name")}
          error={touched.name ? errors.name : ""}
        />

        <AuthField
          id="register-email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="ban@example.com"
          value={form.email}
          onChange={handleChange("email")}
          onBlur={handleBlur("email")}
          error={touched.email ? errors.email : ""}
        />

        <AuthField
          id="register-phone"
          label="Số điện thoại"
          type="tel"
          autoComplete="tel"
          placeholder="0912345678"
          value={form.phone}
          onChange={handleChange("phone")}
          onBlur={handleBlur("phone")}
          error={touched.phone ? errors.phone : ""}
        />

        <div>
          <PasswordField
            id="register-password"
            label="Mật khẩu"
            autoComplete="new-password"
            placeholder="Tối thiểu 6 ký tự"
            value={form.password}
            onChange={handleChange("password")}
            onBlur={handleBlur("password")}
            error={touched.password ? errors.password : ""}
          />
          <PasswordStrength password={form.password} />
        </div>

        <PasswordField
          id="register-confirm-password"
          label="Xác nhận mật khẩu"
          autoComplete="new-password"
          placeholder="Nhập lại mật khẩu"
          value={form.confirmPassword}
          onChange={handleChange("confirmPassword")}
          onBlur={handleBlur("confirmPassword")}
          error={touched.confirmPassword ? errors.confirmPassword : ""}
        />

        <p className="text-xs text-on-surface-variant">
          Bằng cách đăng ký, bạn đồng ý với{" "}
          <a href="#" className="text-primary hover:underline">
            Điều khoản dịch vụ
          </a>{" "}
          và{" "}
          <a href="#" className="text-primary hover:underline">
            Chính sách bảo mật
          </a>
          .
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-primary text-on-primary font-semibold rounded-xl hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
              Đang tạo tài khoản...
            </span>
          ) : (
            "Đăng ký"
          )}
        </button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-surface-variant" />
        <span className="text-xs text-on-surface-variant">hoặc</span>
        <div className="flex-1 h-px bg-surface-variant" />
      </div>
    </div>
  );
};
export default RegisterPage;
