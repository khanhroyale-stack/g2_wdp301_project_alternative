import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/auth.service";

const card = {
  width: "100%",
  maxWidth: 420,
  background: "var(--color-surface)",
  borderRadius: 16,
  boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  padding: "2.5rem 2rem",
};

const inputStyle = {
  padding: "0.75rem 1rem",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius)",
  fontSize: "1rem",
  width: "100%",
  outline: "none",
  background: "#fff",
};

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authService.forgotPassword({ email });
      navigate("/reset-password", { state: { email } });
    } catch (err) {
      setError(err.response?.data?.message || "Gửi OTP thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem", background: "var(--color-bg)" }}>
      <div style={card}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.375rem" }}>Quên mật khẩu</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Nhập email đã đăng ký, chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.
          </p>
        </div>

        {error && (
          <div style={{ color: "var(--color-error)", marginBottom: "1.25rem", padding: "0.875rem 1rem", background: "#fef2f2", borderRadius: "var(--radius)", fontSize: "0.875rem", border: "1px solid #fecaca" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.375rem", fontSize: "0.875rem", fontWeight: 500 }}>Email</label>
            <input type="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: "0.375rem", padding: "0.875rem", background: loading ? "var(--color-text-muted)" : "var(--color-primary)", color: "#fff", border: "none", borderRadius: "var(--radius)", fontWeight: 600, fontSize: "1rem" }}
          >
            {loading ? "Đang gửi..." : "Gửi mã OTP"}
          </button>
        </form>

        <p style={{ marginTop: "1.5rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
          <Link to="/login" style={{ color: "var(--color-primary)", fontWeight: 600 }}>Quay lại đăng nhập</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
