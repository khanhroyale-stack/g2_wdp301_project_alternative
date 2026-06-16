import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/auth.service";

const card = {
  width: "100%",
  maxWidth: 420,
  background: "var(--color-surface)",
  borderRadius: 16,
  boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  padding: "2.5rem 2rem",
};

const VerifyEmailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  const email = location.state?.email || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  if (!email) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ marginBottom: "1rem", color: "var(--color-text-muted)" }}>Không tìm thấy thông tin email. Vui lòng đăng ký lại.</p>
          <Link to="/register">Quay lại đăng ký</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Vui lòng nhập đủ 6 chữ số OTP");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await verifyEmail({ email, otp });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Xác thực thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    setSuccess("");
    try {
      await authService.resendOTP({ email });
      setSuccess("OTP mới đã được gửi đến email của bạn.");
    } catch (err) {
      setError(err.response?.data?.message || "Không thể gửi lại OTP. Vui lòng thử lại.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem", background: "var(--color-bg)" }}>
      <div style={card}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 56, height: 56, background: "#ede9fe", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            <svg width="28" height="28" fill="none" stroke="var(--color-primary)" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Xác thực email</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", lineHeight: 1.6 }}>
            Mã OTP đã được gửi đến<br />
            <strong style={{ color: "var(--color-text)" }}>{email}</strong>
          </p>
        </div>

        {error && (
          <div style={{ color: "var(--color-error)", marginBottom: "1.25rem", padding: "0.875rem 1rem", background: "#fef2f2", borderRadius: "var(--radius)", fontSize: "0.875rem", border: "1px solid #fecaca" }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ color: "#15803d", marginBottom: "1.25rem", padding: "0.875rem 1rem", background: "#f0fdf4", borderRadius: "var(--radius)", fontSize: "0.875rem", border: "1px solid #bbf7d0" }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.375rem", fontSize: "0.875rem", fontWeight: 500 }}>Nhập mã OTP (6 chữ số)</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              style={{ padding: "0.875rem 1rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius)", fontSize: "1.5rem", width: "100%", textAlign: "center", letterSpacing: "0.75rem", outline: "none", background: "#fff" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ padding: "0.875rem", background: loading ? "var(--color-text-muted)" : "var(--color-primary)", color: "#fff", border: "none", borderRadius: "var(--radius)", fontWeight: 600, fontSize: "1rem", transition: "background 0.2s" }}
          >
            {loading ? "Đang xác thực..." : "Xác thực"}
          </button>
        </form>

        <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
            OTP có hiệu lực trong <strong>10 phút</strong>. Không nhận được?
          </p>
          <button
            onClick={handleResend}
            disabled={resending}
            style={{ background: "none", border: "none", color: "var(--color-primary)", cursor: resending ? "default" : "pointer", fontWeight: 600, fontSize: "0.875rem", padding: 0 }}
          >
            {resending ? "Đang gửi..." : "Gửi lại OTP"}
          </button>
        </div>

        <p style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.875rem" }}>
          <Link to="/register" style={{ color: "var(--color-text-muted)" }}>Quay lại đăng ký</Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
