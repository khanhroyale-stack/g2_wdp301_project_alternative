import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import usePendingSalesCount from "../hooks/usePendingSalesCount";

const USER_NAV = [
  { label: "Trang chu", icon: "home", to: "/" },
  { label: "Tong quan", icon: "dashboard", to: "/ho-so" },
  { label: "Bai dang cua toi", icon: "inventory_2", to: "/quan-ly/bai-dang" },
  { label: "Don mua hang", icon: "shopping_bag", to: "/don-hang" },
  { label: "Don ban hang", icon: "storefront", to: "/don-ban" },
  { label: "Thue va muon", icon: "handshake", to: "/thue-muon" },
  { label: "Tin nhan", icon: "chat", to: "/tin-nhan" },
  { label: "Thong bao", icon: "notifications", to: "/thong-bao" },
];

const ADMIN_NAV = [
  { label: "Trang chu", icon: "home", to: "/" },
  { label: "Tong quan", icon: "dashboard", to: "/admin" },
  { label: "Duyet tai khoan", icon: "how_to_reg", to: "/admin/duyet-tai-khoan" },
  { label: "Duyet bai dang", icon: "fact_check", to: "/admin/duyet-bai-dang" },
  { label: "Quan ly nguoi dung", icon: "group", to: "/admin/nguoi-dung" },
  { label: "Quan ly danh muc", icon: "category", to: "/admin/danh-muc" },
  { label: "Bao cao vi pham", icon: "report", to: "/admin/bao-cao" },
  { label: "Don hang", icon: "receipt_long", to: "/admin/don-hang" },
  { label: "Hop dong thue", icon: "description", to: "/admin/hop-dong" },
];

const SHIPPER_NAV = [
  { label: "Trang chu", icon: "home", to: "/" },
  { label: "Tong quan", icon: "dashboard", to: "/shipper" },
  { label: "Don can giao", icon: "local_shipping", to: "/shipper/don-can-giao" },
  { label: "Don dang giao", icon: "pending_actions", to: "/shipper/dang-giao" },
];

const Sidebar = ({ variant = "user" }) => {
  const { user, logout, unreadCount } = useAuth();
  const pendingSalesCount = usePendingSalesCount();
  const navigate = useNavigate();
  const navItems = variant === "admin" ? ADMIN_NAV : variant === "shipper" ? SHIPPER_NAV : USER_NAV;
  const titleMap = {
    admin: "Quan tri vien",
    shipper: "Shipper",
    user: "Nguoi dung",
  };
  const displayName = user?.fullName || user?.name || "";

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 shrink-0 flex-col border-r border-surface-variant bg-surface-bright font-sans md:flex">
      <div className="flex items-center gap-3 border-b border-surface-variant/40 px-5 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">
          {displayName.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold tracking-tight text-primary">EcoTrade</h1>
          <p className="text-xs text-on-surface-variant">{titleMap[variant]}</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to.split("/").length <= 2}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                isActive
                  ? "bg-secondary-container font-semibold text-on-secondary-container"
                  : "text-on-surface-variant hover:bg-surface-container-low"
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

      <div className="space-y-0.5 border-t border-surface-variant/40 px-3 py-4">
        <div className="mb-1 flex items-center gap-3 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {displayName.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-on-surface">{displayName}</p>
            <p className="text-xs text-on-surface-variant">{titleMap[user?.role] || "Nguoi dung"}</p>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-error transition-all hover:bg-error/5"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Dang xuat
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
