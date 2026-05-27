import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RegisterPage = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "5rem auto", padding: "0 1rem" }}>
      <h2 style={{ marginBottom: "1.5rem", fontSize: "1.75rem" }}>Create Account</h2>
      {error && (
        <div style={{ color: "var(--color-error)", marginBottom: "1rem", padding: "0.75rem", background: "#fef2f2", borderRadius: "var(--radius)" }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <input
          type="text"
          placeholder="Full Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          style={{ padding: "0.75rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius)", fontSize: "1rem" }}
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          style={{ padding: "0.75rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius)", fontSize: "1rem" }}
        />
        <input
          type="password"
          placeholder="Password (min 6 characters)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          minLength={6}
          style={{ padding: "0.75rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius)", fontSize: "1rem" }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: "0.75rem", background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: "var(--radius)", fontWeight: 600, fontSize: "1rem" }}
        >
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>
      <p style={{ marginTop: "1rem", color: "var(--color-text-muted)" }}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
};

export default RegisterPage;
