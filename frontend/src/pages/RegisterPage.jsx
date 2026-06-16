import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const card = {
  width: "100%",
  maxWidth: 440,
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

const RegisterPage = () => {
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { fullName, email, phone, password } = form;
      await register({ fullName, email, phone: phone || undefined, password });
      navigate("/verify-email", { state: { email } });
    } catch (err) {
      setError(err.response?.data?.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem", background: "var(--color-bg)" }}>
      <div style={card}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text)", marginBottom: "0.375rem" }}>Tạo tài khoản</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>Tham gia marketplace mua bán & cho thuê đồ dùng</p>
        </div>

        {error && (
          <div style={{ color: "var(--color-error)", marginBottom: "1.25rem", padding: "0.875rem 1rem", background: "#fef2f2", borderRadius: "var(--radius)", fontSize: "0.875rem", border: "1px solid #fecaca" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.375rem", fontSize: "0.875rem", fontWeight: 500 }}>Họ và tên</label>
            <input name="fullName" type="text" placeholder="Nguyễn Văn A" value={form.fullName} onChange={handleChange} required style={inputStyle} />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.375rem", fontSize: "0.875rem", fontWeight: 500 }}>Email</label>
            <input name="email" type="email" placeholder="example@email.com" value={form.email} onChange={handleChange} required style={inputStyle} />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.375rem", fontSize: "0.875rem", fontWeight: 500 }}>
              Số điện thoại{" "}
              <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>(tùy chọn)</span>
            </label>
            <input name="phone" type="tel" placeholder="0901234567" value={form.phone} onChange={handleChange} style={inputStyle} />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.375rem", fontSize: "0.875rem", fontWeight: 500 }}>Mật khẩu</label>
            <input name="password" type="password" placeholder="Tối thiểu 6 ký tự" value={form.password} onChange={handleChange} required minLength={6} style={inputStyle} />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.375rem", fontSize: "0.875rem", fontWeight: 500 }}>Xác nhận mật khẩu</label>
            <input name="confirmPassword" type="password" placeholder="Nhập lại mật khẩu" value={form.confirmPassword} onChange={handleChange} required style={inputStyle} />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: "0.375rem", padding: "0.875rem", background: loading ? "var(--color-text-muted)" : "var(--color-primary)", color: "#fff", border: "none", borderRadius: "var(--radius)", fontWeight: 600, fontSize: "1rem", transition: "background 0.2s" }}
          >
            {loading ? "Đang xử lý..." : "Đăng ký"}
          </button>
        </form>

        <p style={{ marginTop: "1.5rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
          Đã có tài khoản?{" "}
          <Link to="/login" style={{ fontWeight: 600, color: "var(--color-primary)" }}>Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
