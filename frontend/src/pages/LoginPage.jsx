import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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

const LoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message || "";

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem", background: "var(--color-bg)" }}>
      <div style={card}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text)", marginBottom: "0.375rem" }}>Đăng nhập</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>Chào mừng bạn quay lại!</p>
        </div>

        {successMessage && (
          <div style={{ color: "#15803d", marginBottom: "1.25rem", padding: "0.875rem 1rem", background: "#f0fdf4", borderRadius: "var(--radius)", fontSize: "0.875rem", border: "1px solid #bbf7d0" }}>
            {successMessage}
          </div>
        )}
        {error && (
          <div style={{ color: "var(--color-error)", marginBottom: "1.25rem", padding: "0.875rem 1rem", background: "#fef2f2", borderRadius: "var(--radius)", fontSize: "0.875rem", border: "1px solid #fecaca" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.375rem", fontSize: "0.875rem", fontWeight: 500 }}>Email</label>
            <input name="email" type="email" placeholder="example@email.com" value={form.email} onChange={handleChange} required style={inputStyle} />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.375rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 500 }}>Mật khẩu</label>
              <Link to="/forgot-password" style={{ fontSize: "0.8rem" }}>Quên mật khẩu?</Link>
            </div>
            <input name="password" type="password" placeholder="Nhập mật khẩu" value={form.password} onChange={handleChange} required style={inputStyle} />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: "0.375rem", padding: "0.875rem", background: loading ? "var(--color-text-muted)" : "var(--color-primary)", color: "#fff", border: "none", borderRadius: "var(--radius)", fontWeight: 600, fontSize: "1rem", transition: "background 0.2s" }}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <p style={{ marginTop: "1.5rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
          Chưa có tài khoản?{" "}
          <Link to="/register" style={{ fontWeight: 600, color: "var(--color-primary)" }}>Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
