import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const HomePage = () => {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: 600, margin: "5rem auto", textAlign: "center", padding: "0 1rem" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Welcome to My App 🚀</h1>
      <p style={{ color: "var(--color-text-muted)", marginBottom: "2rem" }}>
        A full-stack app built with React + Vite + Express + MongoDB
      </p>
      {user ? (
        <Link
          to="/dashboard"
          style={{
            background: "var(--color-primary)",
            color: "#fff",
            padding: "0.75rem 1.5rem",
            borderRadius: "var(--radius)",
            fontWeight: 600,
          }}
        >
          Go to Dashboard →
        </Link>
      ) : (
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <Link
            to="/login"
            style={{
              background: "var(--color-primary)",
              color: "#fff",
              padding: "0.75rem 1.5rem",
              borderRadius: "var(--radius)",
              fontWeight: 600,
            }}
          >
            Login
          </Link>
          <Link
            to="/register"
            style={{
              border: "1px solid var(--color-border)",
              padding: "0.75rem 1.5rem",
              borderRadius: "var(--radius)",
              fontWeight: 600,
            }}
          >
            Register
          </Link>
        </div>
      )}
    </div>
  );
};

export default HomePage;
