import { Bell, Box, CircleHelp, History, LogOut, Search, Settings } from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function OrderWorkspace({ children }) {
  const { user, logout, unreadCount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const name = user?.fullName || user?.name || "Người dùng";

  const handleLogout = () => {
    logout();
    navigate("/dang-nhap");
  };

  return (
    <div className="min-h-screen bg-white text-[#202124]">
      <header className="fixed inset-x-0 top-0 z-50 flex h-[66px] items-center border-b border-[#dfe3e8] bg-white px-5 shadow-[0_1px_5px_rgba(20,30,40,.08)] lg:px-10">
        <Link to="/marketplaces" className="flex w-[220px] items-center gap-2 text-xl font-extrabold text-[#18c76b]">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#18c76b] text-white">◒</span>
          EcoTrade
        </Link>
        <div className="mx-auto hidden h-10 w-[385px] items-center gap-2 rounded-md border border-[#cfe1d7] bg-[#effcf5] px-3 md:flex">
          <Search className="h-4 w-4 text-[#596576]" />
          <input className="w-full bg-transparent text-sm outline-none placeholder:text-[#94a0b0]" placeholder="Tìm kiếm đơn hàng..." />
        </div>
        <div className="ml-auto flex items-center gap-5">
          <Link to="/thong-bao" className="relative text-[#202124]">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 ? <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#ff5353]" /> : null}
          </Link>
          <span className="hidden h-8 w-px bg-[#dfe3e8] sm:block" />
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold leading-4">{name}</p>
            <p className="text-xs text-[#667085]">Premium Buyer</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#152b23] text-sm font-bold text-white">
            {name.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <aside className="fixed bottom-0 left-0 top-[66px] z-40 hidden w-[258px] flex-col border-r border-[#dfe3e8] bg-[#fbfcfd] lg:flex">
        <div className="px-4 py-5">
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wide text-[#8a93a1]">Quản lý</p>
          <NavLink to="/orders/my-orders" end className={({ isActive }) => `flex h-10 items-center gap-3 rounded-md px-3 text-sm ${isActive || location.pathname === "/don-hang" ? "bg-[#18c76b] font-medium text-[#092416]" : "text-[#596576] hover:bg-[#eef3f0]"}`}>
            <Box className="h-4 w-4" /> Đơn hàng của tôi
          </NavLink>
          <NavLink to="/orders/history" className={({ isActive }) => `mt-1 flex h-10 items-center gap-3 rounded-md px-3 text-sm ${isActive ? "bg-[#18c76b] font-medium text-[#092416]" : "text-[#596576] hover:bg-[#eef3f0]"}`}>
            <History className="h-4 w-4" /> Lịch sử giao dịch
          </NavLink>
        </div>
        <div className="mt-auto border-t border-[#dfe3e8] px-5 py-5 text-sm text-[#596576]">
          <Link to="/ho-so" className="flex items-center gap-3 px-2 py-2"><Settings className="h-4 w-4" /> Cài đặt</Link>
          <a href="#support" className="flex items-center gap-3 px-2 py-2"><CircleHelp className="h-4 w-4" /> Trung tâm trợ giúp</a>
          <button onClick={handleLogout} className="flex w-full items-center gap-3 px-2 py-2 text-[#ff4d4f]"><LogOut className="h-4 w-4" /> Đăng xuất</button>
        </div>
      </aside>

      <main className="min-h-screen pt-[66px] lg:pl-[258px]">
        <div className="mx-auto w-full max-w-[1020px] px-5 pb-16 pt-9 lg:px-7">{children}</div>
      </main>
      <footer className="border-t border-[#dfe3e8] bg-[#fbfcfd] py-6 text-center text-xs text-[#667085] lg:ml-[258px]">
        <p className="text-sm">© 2026 EcoTrade — Sustainable Trading Platform</p>
        <div className="mt-3 flex justify-center gap-7"><a href="#privacy">Privacy Policy</a><a href="#terms">Terms of Service</a><a href="#support">Support</a></div>
      </footer>
    </div>
  );
}
