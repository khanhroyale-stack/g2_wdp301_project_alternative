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
  { label: "Quản lý đánh giá", icon: "reviews", to: "/admin/danh-gia" },
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
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 shrink-0 flex-col border-r border-border bg-surface/90 backdrop-blur-xl font-sans md:flex shadow-glass">
      <div className="flex items-center gap-3 px-6 py-7 border-b border-border">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-primary text-base font-extrabold text-white shadow-card">
          {displayName.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-extrabold tracking-tight text-primary">EcoTrade</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
            {titleMap[variant]}
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-4 py-5 custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to.split("/").length <= 2}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-field px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-primary text-white shadow-card"
                  : "text-muted-foreground hover:bg-surface-secondary hover:text-primary"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`material-symbols-outlined text-[20px] transition-opacity duration-200 ${
                    isActive ? "opacity-100" : "opacity-50 group-hover:opacity-80"
                  }`}
                >
                  {item.icon}
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.to === "/thong-bao" && unreadCount > 0 ? (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-pill bg-secondary text-[10px] font-extrabold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
                {item.to === "/don-ban" && pendingSalesCount > 0 ? (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-pill bg-secondary px-1.5 text-[10px] font-extrabold text-white">
                    {pendingSalesCount}
                  </span>
                ) : null}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-3 border-t border-border p-5">
        <div className="flex items-center gap-3 rounded-card bg-surface-secondary p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-extrabold text-primary overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-foreground">{displayName}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted leading-none mt-0.5">
              {titleMap[user?.role] || "Thành viên"}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            navigate("/marketplaces");
          }}
          className="flex w-full items-center gap-3 rounded-field px-4 py-3 text-left text-sm font-semibold text-danger transition-all duration-200 hover:bg-danger-soft active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Thoát hệ thống
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
