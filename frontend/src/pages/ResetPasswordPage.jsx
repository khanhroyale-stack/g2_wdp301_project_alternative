import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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

const ResetPasswordPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";

  const [form, setForm] = useState({ otp: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  if (!email) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ marginBottom: "1rem", color: "var(--color-text-muted)" }}>Không tìm thấy thông tin. Vui lòng thực hiện lại.</p>
          <Link to="/quen-mat-khau">Quay lại</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authService.resetPassword({ email, otp: form.otp, newPassword: form.newPassword });
      navigate("/dang-nhap", { state: { message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập." } });
    } catch (err) {
      setError(err.response?.data?.message || "Đặt lại mật khẩu thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem", background: "var(--color-bg)" }}>
      <div style={card}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.375rem" }}>Đặt lại mật khẩu</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Nhập OTP đã gửi đến <strong style={{ color: "var(--color-text)" }}>{email}</strong>
          </p>
        </div>

        {error && (
          <div style={{ color: "var(--color-error)", marginBottom: "1.25rem", padding: "0.875rem 1rem", background: "#fef2f2", borderRadius: "var(--radius)", fontSize: "0.875rem", border: "1px solid #fecaca" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.375rem", fontSize: "0.875rem", fontWeight: 500 }}>Mã OTP (6 chữ số)</label>
            <input
              name="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={form.otp}
              onChange={(e) => setForm({ ...form, otp: e.target.value.replace(/\D/g, "").slice(0, 6) })}
              required
              style={{ ...inputStyle, textAlign: "center", letterSpacing: "0.5rem", fontSize: "1.25rem" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.375rem", fontSize: "0.875rem", fontWeight: 500 }}>Mật khẩu mới</label>
            <input name="newPassword" type="password" placeholder="Tối thiểu 6 ký tự" value={form.newPassword} onChange={handleChange} required minLength={6} style={inputStyle} />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.375rem", fontSize: "0.875rem", fontWeight: 500 }}>Xác nhận mật khẩu mới</label>
            <input name="confirmPassword" type="password" placeholder="Nhập lại mật khẩu mới" value={form.confirmPassword} onChange={handleChange} required style={inputStyle} />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: "0.375rem", padding: "0.875rem", background: loading ? "var(--color-text-muted)" : "var(--color-primary)", color: "#fff", border: "none", borderRadius: "var(--radius)", fontWeight: 600, fontSize: "1rem" }}
          >
            {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
          </button>
        </form>

        <p style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.875rem" }}>
          <Link to="/quen-mat-khau" style={{ color: "var(--color-text-muted)" }}>Gửi lại OTP</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
