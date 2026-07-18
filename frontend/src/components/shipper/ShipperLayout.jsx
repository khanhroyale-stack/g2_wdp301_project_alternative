import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LogOut, Navigation, UserRound } from "lucide-react";

export default function ShipperLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.fullName || user?.name || "Shipper";

  const handleLogout = () => {
    logout();
    navigate("/dang-nhap");
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 font-sans">
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 md:px-10">
          <Link to="/shipper" className="flex items-center gap-3 text-[1.5rem] font-display font-black tracking-tight text-primary hover:opacity-90 transition-opacity">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
              <Navigation className="h-5 w-5" />
            </div>
            EcoTrade <span className="text-foreground italic">Shipper</span>
          </Link>
          <div className="flex items-center gap-6">
            <div className="hidden items-center gap-4 text-right md:flex">
              <div>
                <p className="text-sm font-black text-foreground font-display">{displayName}</p>
                <div className="flex items-center justify-end gap-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-primary">
                  <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                  Sẵn sàng vận chuyển
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/5 text-primary overflow-hidden shadow-sm transition-all hover:border-primary/40">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <UserRound className="h-6 w-6" />
                )}
              </div>
            </div>
            <div className="h-8 w-px bg-primary/10 hidden md:block"></div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-pill bg-white px-5 py-2.5 text-xs font-black uppercase tracking-widest text-error transition-all hover:bg-error/5 border border-error/10 shadow-sm"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Thoát</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-12 md:px-10">
        {children}
      </main>
    </div>
  );
}
