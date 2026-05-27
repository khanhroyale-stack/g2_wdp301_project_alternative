import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div style={{ maxWidth: 700, margin: "3rem auto", padding: "0 1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1>Dashboard</h1>
        <button
          onClick={handleLogout}
          style={{ padding: "0.5rem 1rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius)", background: "transparent", fontWeight: 500 }}
        >
          Logout
        </button>
      </div>

      <div style={{ background: "var(--color-surface)", padding: "1.5rem", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", border: "1px solid var(--color-border)" }}>
        <h2 style={{ marginBottom: "1rem", fontSize: "1.2rem" }}>👋 Welcome back, {user?.name}!</h2>
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <div><strong>Name:</strong> {user?.name}</div>
          <div><strong>Email:</strong> {user?.email}</div>
          <div><strong>Role:</strong> <span style={{ background: "#e0e7ff", color: "#4f46e5", padding: "0.15rem 0.5rem", borderRadius: "999px", fontSize: "0.85rem" }}>{user?.role}</span></div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
