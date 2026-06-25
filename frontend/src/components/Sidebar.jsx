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
  { label: "Hợp đồng thuê", icon: "description", to: "/admin/hop-dong" },
  { label: "Quản lý shipper", icon: "local_shipping", to: "/admin/shippers" },
  { label: "Lịch sử giao hàng", icon: "route", to: "/admin/giao-hang" },
  { label: "Biên bản kiểm định", icon: "fact_check", to: "/admin/kiem-dinh" },
  { label: "Báo cáo giao hàng", icon: "warning", to: "/admin/bao-cao-giao-hang" },
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

    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 shrink-0 flex-col border-r border-surface-variant/60 bg-[linear-gradient(180deg,#fbfdfb_0%,#f0f6f2_100%)] font-sans md:flex">
      <div className="flex items-center gap-3 border-b border-surface-variant/40 px-6 py-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-on-primary shadow-sm">
          {displayName.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-base font-extrabold tracking-tight text-primary">EcoTrade</h1>
          <p className="text-xs font-medium text-on-surface-variant">{titleMap[variant]}</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to.split("/").length <= 2}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all ${isActive
                ? "bg-primary font-semibold text-on-primary shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span className="flex-1 truncate">{item.label}</span>
            {item.to === "/thong-bao" && unreadCount > 0 ? (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-error text-[10px] font-bold text-on-error">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
            {item.to === "/don-ban" && pendingSalesCount > 0 ? (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-warning px-1.5 text-[10px] font-bold text-warning-foreground">
                {pendingSalesCount}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 border-t border-surface-variant/40 px-4 py-4">
        <div className="mb-1 flex items-center gap-3 rounded-2xl bg-surface-container-lowest/70 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-xs font-bold text-primary">
            {displayName.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-on-surface">{displayName}</p>
            <p className="text-xs text-on-surface-variant">{titleMap[user?.role] || "Người dùng"}</p>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            navigate("/marketplaces");
          }}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-error transition-all hover:bg-error/5"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Đăng xuất
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
