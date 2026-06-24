import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/auth.service";

const RESEND_COOLDOWN = 60;

const VerifyOTPPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();

  const email = location.state?.email || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMsg, setResendMsg] = useState("");

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  if (!email) {
    navigate("/dang-nhap");
    return null;
  }

  const handleResend = async () => {
    setResendMsg("");
    setError("");
    try {
      await authService.resendOTP(email);
      setResendCooldown(RESEND_COOLDOWN);
      setResendMsg("Mã OTP mới đã được gửi đến email của bạn.");
    } catch (err) {
      setError(err.response?.data?.message || "Không thể gửi lại OTP. Vui lòng thử lại.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Mã OTP phải bao gồm 6 chữ số.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await verifyEmail({ email, otp });
      // Xác thực OTP thành công → có token, dùng được ngay (không có KYC)
      navigate("/ho-so");
    } catch (err) {
      setError(err.response?.data?.message || "Xác thực thất bại. Vui lòng kiểm tra lại mã OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-low flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block text-2xl font-bold text-primary tracking-tight mb-3">EcoTrade</Link>
          <h2 className="text-2xl font-bold text-on-surface">Xác thực Email</h2>
          <p className="text-on-surface-variant text-sm mt-1">Vui lòng nhập mã OTP gồm 6 chữ số đã được gửi đến email <strong>{email}</strong></p>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl shadow-apple-md p-8 border border-surface-variant/30">
          {error && (
            <div className="flex items-center gap-2 text-error mb-5 p-3.5 bg-error-container/30 rounded-xl text-sm border border-error/20">
              <span className="material-symbols-outlined text-[18px]">error</span>{error}
            </div>
          )}
          {resendMsg && (
            <div className="flex items-center gap-2 text-on-secondary-container mb-5 p-3.5 bg-secondary-container/30 rounded-xl text-sm border border-secondary-container">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>{resendMsg}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5 text-center">Mã OTP</label>
              <input
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                required
                className="w-full text-center tracking-[1em] text-2xl px-4 py-4 border border-surface-variant rounded-xl font-bold bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              />
            </div>

            <button type="submit" disabled={loading || otp.length < 6}
              className="w-full mt-2 py-3.5 bg-primary text-on-primary font-semibold rounded-xl hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-60">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  Đang xác thực...
                </span>
              ) : "Xác nhận OTP"}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-on-surface-variant mb-2">Không nhận được mã?</p>
            {resendCooldown > 0 ? (
              <p className="text-sm text-on-surface-variant">
                Gửi lại sau <span className="font-semibold text-primary">{resendCooldown}s</span>
              </p>
            ) : (
              <button onClick={handleResend}
                className="text-sm font-semibold text-primary hover:underline transition-all">
                Gửi lại OTP
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTPPage;
