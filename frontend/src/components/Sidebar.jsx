import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import usePendingSalesCount from "../hooks/usePendingSalesCount";

const USER_NAV = [
  { label: "Marketplace", icon: "storefront", to: "/marketplaces" },
  { label: "Tổng quan", icon: "dashboard", to: "/ho-so" },
  { label: "Bài đăng của tôi", icon: "inventory_2", to: "/quan-ly/bai-dang" },
  { label: "Đơn mua", icon: "shopping_bag", to: "/don-hang" },
  { label: "Đơn bán", icon: "local_mall", to: "/don-ban" },
  { label: "Thuê và mượn", icon: "handshake", to: "/thue-muon" },
  { label: "Tin nhắn", icon: "chat", to: "/tin-nhan" },
  { label: "Thông báo", icon: "notifications", to: "/thong-bao" },
];

const ADMIN_NAV = [
  { label: "Marketplace", icon: "storefront", to: "/marketplaces" },
  { label: "Tổng quan", icon: "dashboard", to: "/admin" },
  { label: "Duyệt bài đăng", icon: "fact_check", to: "/admin/duyet-bai-dang" },
  { label: "Quản lý người dùng", icon: "group", to: "/admin/nguoi-dung" },
  { label: "Quản lý danh mục", icon: "category", to: "/admin/danh-muc" },
  { label: "Báo cáo vi phạm", icon: "report", to: "/admin/bao-cao" },
  { label: "Đơn hàng", icon: "receipt_long", to: "/admin/don-hang" },
  { label: "Báo cáo doanh thu", icon: "payments", to: "/admin/revenue" },
  { label: "Hợp đồng thuê", icon: "description", to: "/admin/hop-dong" },
  { label: "Quản lý shipper", icon: "local_shipping", to: "/admin/shippers" },
  { label: "Lịch sử giao hàng", icon: "route", to: "/admin/giao-hang" },
  { label: "Biên bản kiểm định", icon: "fact_check", to: "/admin/kiem-dinh" },
  { label: "Báo cáo giao hàng", icon: "warning", to: "/admin/bao-cao-giao-hang" },
  { label: "Hỗ trợ trực tuyến", icon: "support_agent", to: "/admin/hotro" },
];

const SHIPPER_NAV = [
  { label: "Marketplace", icon: "storefront", to: "/marketplaces" },
  { label: "Đơn có thể nhận", icon: "local_shipping", to: "/shipper" },
];

const Sidebar = ({ variant = "user" }) => {
  const { user, logout, unreadCount } = useAuth();
  const pendingSalesCount = usePendingSalesCount();
  const navigate = useNavigate();
  const navItems = variant === "admin" ? ADMIN_NAV : variant === "shipper" ? SHIPPER_NAV : USER_NAV;
  const titleMap = {
    admin: "Quản trị viên",
    shipper: "Shipper",
    user: "Người dùng",
  };
  const displayName = user?.fullName || user?.name || "";

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 shrink-0 flex-col border-r border-primary/5 bg-background font-sans md:flex shadow-apple">
      <div className="flex items-center gap-4 px-8 py-8">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-black text-white shadow-lg shadow-primary/20">
          {displayName.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-display font-black tracking-tight text-primary">EcoTrade</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">{titleMap[variant]}</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-5 py-2 custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to.split("/").length <= 2}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-pill px-5 py-3.5 text-sm font-bold transition-all ${isActive
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "text-on-surface-variant hover:bg-primary/5 hover:text-primary"
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px] opacity-40 group-[.active]:opacity-100">{item.icon}</span>
            <span className="flex-1 truncate">{item.label}</span>
            {item.to === "/thong-bao" && unreadCount > 0 ? (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-black text-white shadow-sm shadow-secondary/20">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
            {item.to === "/don-ban" && pendingSalesCount > 0 ? (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-secondary px-1.5 text-[10px] font-black text-white shadow-sm shadow-secondary/20">
                {pendingSalesCount}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-3 p-6">
        <div className="flex items-center gap-3 rounded-organic bg-white p-3 shadow-sm border border-primary/5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary overflow-hidden">
             {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-black text-foreground">{displayName}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-primary/40 leading-none">{titleMap[user?.role] || "Thành viên"}</p>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            navigate("/marketplaces");
          }}
          className="flex w-full items-center gap-3 rounded-pill px-5 py-3.5 text-left text-sm font-bold text-error transition-all hover:bg-error/5 hover:scale-105 active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Thoát hệ thống
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
