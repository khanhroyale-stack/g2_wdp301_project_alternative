import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/auth.service";

// ─── Step 1: Form đăng ký ────────────────────────────────
const RegisterForm = ({ onSuccess }) => {
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError("Mật khẩu xác nhận không khớp."); return; }
    if (form.password.length < 6) { setError("Mật khẩu tối thiểu 6 ký tự."); return; }
    setError(""); setLoading(true);
    try {
      await authService.register({ fullName: form.fullName, email: form.email, phone: form.phone, password: form.password });
      onSuccess(form.email);
    } catch (err) {
      setError(err.response?.data?.message || "Đăng ký thất bại.");
    } finally { setLoading(false); }
  };

  const cls = "w-full px-4 py-3 border border-surface-variant rounded-xl text-sm bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="flex items-center gap-2 text-error p-3.5 bg-error-container/30 rounded-xl text-sm border border-error/20">
          <span className="material-symbols-outlined text-[18px]">error</span>{error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-on-surface mb-1.5">Họ và tên <span className="text-error">*</span></label>
        <input type="text" placeholder="Nguyễn Văn A" className={cls} value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
      </div>
      <div>
        <label className="block text-sm font-medium text-on-surface mb-1.5">Email <span className="text-error">*</span></label>
        <input type="email" placeholder="ban@example.com" className={cls} value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      </div>
      <div>
        <label className="block text-sm font-medium text-on-surface mb-1.5">Số điện thoại</label>
        <input type="tel" placeholder="0912 345 678" className={cls} value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>
      <div>
        <label className="block text-sm font-medium text-on-surface mb-1.5">Mật khẩu <span className="text-error">*</span></label>
        <input type="password" placeholder="Tối thiểu 6 ký tự" className={cls} value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
      </div>
      <div>
        <label className="block text-sm font-medium text-on-surface mb-1.5">Xác nhận mật khẩu <span className="text-error">*</span></label>
        <input type="password" placeholder="Nhập lại mật khẩu" className={cls} value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
      </div>
      <p className="text-xs text-on-surface-variant">
        Bằng cách đăng ký, bạn đồng ý với{" "}
        <a href="#" className="text-primary hover:underline">Điều khoản</a> và{" "}
        <a href="#" className="text-primary hover:underline">Chính sách bảo mật</a>.
      </p>
      <button type="submit" disabled={loading}
        className="w-full py-3.5 bg-primary text-on-primary font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-60">
        {loading
          ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />Đang xử lý...</span>
          : "Đăng ký"}
      </button>
    </form>
  );
};

// ─── Step 2: Nhập OTP ────────────────────────────────────
const OTPForm = ({ email, onVerified }) => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length < 4) { setError("Vui lòng nhập đủ mã OTP."); return; }
    setError(""); setLoading(true);
    try {
      const data = await authService.verifyEmail({ email, otp });
      // Lưu token và set user
      localStorage.setItem("token", data.token);
      onVerified(data.user);
    } catch (err) {
      setError(err.response?.data?.message || "OTP không hợp lệ hoặc đã hết hạn.");
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authService.resendOTP(email);
      setError(""); alert("Đã gửi lại OTP. Vui lòng kiểm tra email.");
    } catch (err) {
      setError("Không thể gửi lại OTP.");
    } finally { setResending(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="bg-secondary-container/20 rounded-xl p-4 text-sm text-on-surface-variant flex items-start gap-2">
        <span className="material-symbols-outlined text-on-secondary-container mt-0.5 flex-shrink-0">mail</span>
        <p>Mã OTP đã được gửi đến <strong className="text-on-surface">{email}</strong>. Kiểm tra hộp thư (hoặc spam).</p>
      </div>
      {error && (
        <div className="flex items-center gap-2 text-error p-3.5 bg-error-container/30 rounded-xl text-sm border border-error/20">
          <span className="material-symbols-outlined text-[18px]">error</span>{error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-on-surface mb-1.5">Mã OTP <span className="text-error">*</span></label>
        <input
          type="text"
          placeholder="Nhập mã OTP 6 chữ số"
          maxLength={6}
          className="w-full px-4 py-3 border border-surface-variant rounded-xl text-sm bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-center text-xl tracking-[0.5em] font-bold"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          required
        />
      </div>
      <button type="submit" disabled={loading}
        className="w-full py-3.5 bg-primary text-on-primary font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-60">
        {loading
          ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />Đang xác thực...</span>
          : "Xác nhận OTP"}
      </button>
      <button type="button" onClick={handleResend} disabled={resending}
        className="text-sm text-primary hover:underline text-center disabled:opacity-50">
        {resending ? "Đang gửi lại..." : "Gửi lại OTP"}
      </button>
    </form>
  );
};

// ─── Main Component ───────────────────────────────────────
const RegisterPage = () => {
  const [step, setStep] = useState(1); // 1: form | 2: otp
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleRegisterSuccess = (registeredEmail) => {
    setEmail(registeredEmail);
    setStep(2);
  };

  const handleOTPVerified = (user) => {
    // Điều hướng sang trang xác minh giấy tờ
    navigate("/xac-minh-tai-khoan");
  };

  return (
    <div className="min-h-screen bg-surface-container-low flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block text-2xl font-bold text-primary tracking-tight mb-3">EcoTrade</Link>
          <h2 className="text-2xl font-bold text-on-surface">
            {step === 1 ? "Tạo tài khoản" : "Xác thực email"}
          </h2>
          <p className="text-on-surface-variant text-sm mt-1">
            {step === 1 ? "Tham gia cộng đồng EcoTrade khu vực Hòa Lạc" : "Nhập mã OTP để hoàn tất đăng ký"}
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${s < step ? "bg-primary text-on-primary" :
                  s === step ? "bg-primary text-on-primary ring-2 ring-primary/30" :
                    "bg-surface-container text-on-surface-variant"
                }`}>
                {s < step ? <span className="material-symbols-outlined text-[14px]">check</span> : s}
              </div>
              {s < 2 && <div className={`flex-1 h-0.5 ${s < step ? "bg-primary" : "bg-surface-variant"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-surface-container-lowest rounded-2xl shadow-apple-md p-8 border border-surface-variant/30">
          {step === 1
            ? <RegisterForm onSuccess={handleRegisterSuccess} />
            : <OTPForm email={email} onVerified={handleOTPVerified} />
          }
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
