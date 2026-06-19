import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ children, adminOnly = false, shipperOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-surface-variant border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-on-surface-variant">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/dang-nhap" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/ho-so" replace />;
  if (shipperOnly && user.role !== "shipper" && user.role !== "admin") return <Navigate to="/ho-so" replace />;

  return children;
};

export default PrivateRoute;
