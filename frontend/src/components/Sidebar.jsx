import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const USER_NAV = [
  { label: "Trang chủ", icon: "home", to: "/" },
  { label: "Tổng quan", icon: "dashboard", to: "/ho-so" },
  { label: "Bài đăng của tôi", icon: "inventory_2", to: "/quan-ly/bai-dang" },
  { label: "Đơn mua hàng", icon: "shopping_bag", to: "/don-hang" },
  { label: "Thuê & mượn", icon: "handshake", to: "/thue-muon" },
  { label: "Tin nhắn", icon: "chat", to: "/tin-nhan" },
  { label: "Thông báo", icon: "notifications", to: "/thong-bao" },
];

const ADMIN_NAV = [
  { label: "Trang chủ", icon: "home", to: "/" },
  { label: "Tổng quan", icon: "dashboard", to: "/admin" },
  { label: "Duyệt tài khoản", icon: "how_to_reg", to: "/admin/duyet-tai-khoan" },
  { label: "Duyệt bài đăng", icon: "fact_check", to: "/admin/duyet-bai-dang" },
  { label: "Quản lý người dùng", icon: "group", to: "/admin/nguoi-dung" },
  { label: "Quản lý danh mục", icon: "category", to: "/admin/danh-muc" },
  { label: "Báo cáo vi phạm", icon: "report", to: "/admin/bao-cao" },
  { label: "Đơn hàng", icon: "receipt_long", to: "/admin/don-hang" },
  { label: "Hợp đồng thuê", icon: "description", to: "/admin/hop-dong" },
];

const SHIPPER_NAV = [
  { label: "Trang chủ", icon: "home", to: "/" },
  { label: "Tổng quan", icon: "dashboard", to: "/shipper" },
  { label: "Đơn cần giao", icon: "local_shipping", to: "/shipper/don-can-giao" },
  { label: "Đơn đang giao", icon: "pending_actions", to: "/shipper/dang-giao" },
];

const Sidebar = ({ variant = "user" }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = variant === "admin" ? ADMIN_NAV : variant === "shipper" ? SHIPPER_NAV : USER_NAV;

  const titleMap = { admin: "Quản trị viên", shipper: "Shipper", user: "Người dùng" };

  return (
    <aside className="hidden md:flex flex-col bg-surface-bright w-64 flex-shrink-0 fixed left-0 top-0 h-screen border-r border-surface-variant z-40">
      {/* Header */}
      <div className="px-5 py-5 flex items-center gap-3 border-b border-surface-variant/40">
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary text-sm font-bold flex-shrink-0">
          {user?.name?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <div className="min-w-0">
          <h1 className="font-bold text-primary text-sm tracking-tight truncate">EcoTrade</h1>
          <p className="text-xs text-on-surface-variant">{titleMap[variant]}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0.5 py-3 px-3 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.label} to={item.to} end={item.to.split("/").length <= 2}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${isActive
                ? "bg-secondary-container text-on-secondary-container font-semibold"
                : "text-on-surface-variant hover:bg-surface-container-low"
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-surface-variant/40 space-y-0.5">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-on-surface truncate">{user?.name}</p>
            <p className="text-xs text-on-surface-variant">{titleMap[user?.role] || "Người dùng"}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate("/"); }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-error hover:bg-error/5 transition-all w-full"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Đăng xuất
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
