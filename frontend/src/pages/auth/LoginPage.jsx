import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import GoogleAuthButton from "../../components/auth/GoogleAuthButton";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthField from "../../components/auth/AuthField";
import PasswordField from "../../components/auth/PasswordField";
import { validators, validateAll } from "../../components/auth/validators";

const FIELDS = ["email", "password"];

const LoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  // Chỉ báo lỗi sau khi người dùng đã rời ô lần đầu, rồi mới cập nhật theo từng ký tự.
  const handleChange = (field) => (e) => {
    const next = { ...form, [field]: e.target.value };
    setForm(next);
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validators[field](next[field], next) }));
    }
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validators[field](form[field], form) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = validateAll(form, FIELDS);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setTouched(FIELDS.reduce((acc, field) => ({ ...acc, [field]: true }), {}));
      return;
    }

    setError("");
    setLoading(true);
    try {
      const data = await login(form);
      if (data.user.role === "shipper") {
        navigate("/shipper", { replace: true });
      } else {
        const from = location.state?.from?.pathname;
        if (from) {
          navigate(from, { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.needVerification && data?.email) {
        navigate("/xac-thuc-email", { state: { email: data.email }, replace: true });
      } else {
        setError(data?.message || "Email hoặc mật khẩu không đúng");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Đăng nhập"
      subtitle="Chào mừng trở lại!"
      footer={
        <p className="text-center mt-5 text-sm text-on-surface-variant">
          Chưa có tài khoản?{" "}
          <Link to="/dang-ky" className="text-primary font-semibold hover:underline">
            Đăng ký ngay
          </Link>
        </p>
      }
    >
      {successMessage && (
        <div className="flex items-center gap-2 text-primary mb-5 p-3.5 bg-primary/10 rounded-xl text-sm border border-primary/20">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {successMessage}
        </div>
      )}
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
          id="login-email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="ban@example.com"
          value={form.email}
          onChange={handleChange("email")}
          onBlur={handleBlur("email")}
          error={touched.email ? errors.email : ""}
        />

        <PasswordField
          id="login-password"
          label="Mật khẩu"
          autoComplete="current-password"
          placeholder="••••••••"
          value={form.password}
          onChange={handleChange("password")}
          onBlur={handleBlur("password")}
          error={touched.password ? errors.password : ""}
        />

        <div className="flex justify-end">
          <Link to="/quen-mat-khau" className="text-sm text-primary hover:underline">
            Quên mật khẩu?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-primary text-on-primary font-semibold rounded-xl hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
              Đang đăng nhập...
            </span>
          ) : (
            "Đăng nhập"
          )}
        </button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-surface-variant" />
        <span className="text-xs text-on-surface-variant">hoặc</span>
        <div className="flex-1 h-px bg-surface-variant" />
      </div>

      <GoogleAuthButton onError={setError} />
    </AuthLayout>
  );
};

export default LoginPage;
