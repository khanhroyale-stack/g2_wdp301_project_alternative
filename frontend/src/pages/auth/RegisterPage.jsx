import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import GoogleAuthButton from "../../components/auth/GoogleAuthButton";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthField from "../../components/auth/AuthField";
import PasswordField from "../../components/auth/PasswordField";
import PasswordStrength from "../../components/auth/PasswordStrength";
import { validators, validateAll } from "../../components/auth/validators";

const FIELDS = ["name", "email", "phone", "password", "confirmPassword"];

const RegisterPage = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    bankAccountNumber: "",
    bankName: "",
    bankAccountHolder: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (field) => (e) => {
    const next = { ...form, [field]: e.target.value };
    setForm(next);

    setErrors((prev) => {
      const updated = { ...prev };
      if (touched[field]) {
        updated[field] = validators[field](next[field], next);
      }
      // Sửa mật khẩu thì ô nhập lại phải được kiểm tra lại theo giá trị mới.
      if (field === "password" && touched.confirmPassword) {
        updated.confirmPassword = validators.confirmPassword(next.confirmPassword, next);
      }
      return updated;
    });
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        <div className="mt-1 rounded-xl border border-surface-variant/60 bg-surface-variant/10 p-4">
          <p className="mb-3 text-sm font-semibold text-on-surface">
            Thông tin ngân hàng nhận thanh toán{" "}
            <span className="font-normal text-on-surface-variant">(tuỳ chọn)</span>
          </p>
          <p className="mb-3 text-xs text-on-surface-variant">
            Dùng để nhận tiền khi bạn bán hàng. Có thể bỏ trống và cập nhật sau trong hồ sơ.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AuthField
              id="register-bank-number"
              label="Số tài khoản"
              placeholder="VD: 0123456789"
              value={form.bankAccountNumber}
              onChange={(e) => setForm((f) => ({ ...f, bankAccountNumber: e.target.value }))}
            />
            <AuthField
              id="register-bank-name"
              label="Ngân hàng"
              placeholder="VD: Vietcombank"
              value={form.bankName}
              onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
            />
            <div className="md:col-span-2">
              <AuthField
                id="register-bank-holder"
                label="Chủ tài khoản"
                placeholder="VD: NGUYEN VAN A"
                value={form.bankAccountHolder}
                onChange={(e) => setForm((f) => ({ ...f, bankAccountHolder: e.target.value }))}
              />
            </div>
          </div>
        </div>

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

      <GoogleAuthButton onError={setError} />
    </AuthLayout>
  );
};

export default RegisterPage;
