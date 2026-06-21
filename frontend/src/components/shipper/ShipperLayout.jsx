import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ShipperLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.fullName || user?.name || "Shipper";

  const handleLogout = () => {
    logout();
    navigate("/dang-nhap");
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbf8_0%,#eef5f0_100%)]">
      <header className="sticky top-0 z-40 border-b border-surface-variant/50 bg-surface/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 md:px-8">
          <Link to="/shipper" className="text-[1.35rem] font-extrabold tracking-tight text-primary">
            EcoTrade Shipper
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="text-sm font-semibold text-on-surface">{displayName}</p>
              <p className="text-xs text-on-surface-variant">Luồng giao hàng</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-full border border-surface-variant/60 px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] px-4 py-8 md:px-8">
        {children}
      </main>
    </div>
  );
}
