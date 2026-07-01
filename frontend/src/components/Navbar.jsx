import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import usePendingSalesCount from "../hooks/usePendingSalesCount";
import ProBadge from "./ui/ProBadge";

const roleLabel = {
  admin: "Quản trị viên",
  shipper: "Shipper",
  user: "Người dùng",
};

const Navbar = () => {
  const { user, logout, unreadCount } = useAuth();
  const pendingSalesCount = usePendingSalesCount();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const displayName = user?.fullName || user?.name || "";

  const linkClass = ({ isActive }) =>
    isActive
      ? "border-b-2 border-primary pb-1 text-sm font-semibold text-primary transition-colors"
      : "text-sm font-medium text-on-surface-variant transition-colors hover:text-primary";

  const handleLogout = () => {
    logout();
    navigate("/marketplaces");
    setMenuOpen(false);
    setUserMenuOpen(false);
  };

  return (
    <nav className="fixed left-0 top-0 z-50 h-16 w-full border-b border-surface-variant/50 bg-surface/90 shadow-[0px_8px_30px_rgba(17,38,28,0.05)] backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between gap-4 px-4 md:px-10">
        <div className="flex items-center gap-8">
          <Link to="/" className="select-none text-[1.35rem] font-extrabold tracking-tight text-primary">
            EcoTrade
          </Link>
          <div className="hidden gap-5 md:flex">
            <NavLink to="/marketplaces" className={linkClass}>Mua sắm</NavLink>
            <NavLink to="/cho-thue" className={linkClass}>Cho thuê</NavLink>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden w-56 items-center gap-2 rounded-full border border-surface-variant/60 bg-surface-container-low px-4 py-2 lg:flex">
            <span className="material-symbols-outlined text-[17px] text-on-surface-variant">search</span>
            <input
              className="w-full border-none bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant"
              placeholder="Tìm kiếm sản phẩm..."
              onKeyDown={(event) => event.key === "Enter" && navigate(`/marketplaces?q=${event.target.value}`)}
            />
          </div>

          {user && user.role !== "admin" ? (
            <Link
              to="/dang-tin"
              className="hidden items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-sm transition-all hover:opacity-90 md:flex"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Đăng tin
            </Link>
          ) : null}

          <button
            onClick={() => user && navigate("/thong-bao")}
            className="relative rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 ? (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[9px] font-bold leading-none text-on-error">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((value) => !value)}
                className="flex items-center gap-2 rounded-full border border-surface-variant/60 px-2.5 py-1.5 transition-colors hover:bg-surface-container-low"
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={displayName} className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary">
                    {displayName.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <span className="hidden max-w-[90px] truncate text-sm font-medium text-on-surface md:block">
                  {displayName}
                </span>
                {user?.isPro && <ProBadge className="hidden md:inline-flex" />}
                <span className="material-symbols-outlined text-[15px] text-on-surface-variant">expand_more</span>
              </button>

              {userMenuOpen ? (
                <div className="absolute right-0 top-12 z-50 w-60 rounded-2xl border border-surface-variant/70 bg-surface-container-lowest py-2 shadow-apple-md">
                  <div className="border-b border-surface-variant/50 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-on-surface">{displayName}</p>
                    <p className="mt-0.5 text-xs text-on-surface-variant">{roleLabel[user.role] || "Người dùng"}</p>
                  </div>

                  {user.role !== "admin" ? (
                    <>
                      <Link to="/ho-so" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface transition-colors hover:bg-surface-container-low">
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">person</span>
                        Hồ sơ cá nhân
                      </Link>
                      <Link to="/quan-ly/bai-dang" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface transition-colors hover:bg-surface-container-low">
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">inventory_2</span>
                        Bài đăng của tôi
                      </Link>
                      <Link to="/goi-pro" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface transition-colors hover:bg-surface-container-low">
                        <span className="material-symbols-outlined text-[18px] text-amber-500">workspace_premium</span>
                        Nâng cấp Pro
                        {user?.isPro && <ProBadge className="ml-auto" />}
                      </Link>
                      <Link to="/don-hang" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface transition-colors hover:bg-surface-container-low">
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">shopping_bag</span>
                        Đơn mua
                      </Link>
                      <Link to="/gio-hang" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface transition-colors hover:bg-surface-container-low">
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">shopping_cart</span>
                        Giỏ hàng
                      </Link>
                      <Link to="/don-ban" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface transition-colors hover:bg-surface-container-low">
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">storefront</span>
                        Đơn bán
                        {pendingSalesCount > 0 ? (
                          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-warning px-1.5 text-[10px] font-bold text-warning-foreground">
                            {pendingSalesCount}
                          </span>
                        ) : null}
                      </Link>
                      <Link to="/thue-muon" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface transition-colors hover:bg-surface-container-low">
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">handshake</span>
                        Thuê và mượn
                      </Link>
                      <Link to="/tin-nhan" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface transition-colors hover:bg-surface-container-low">
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chat</span>
                        Tin nhắn
                      </Link>
                    </>
                  ) : (
                    <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface transition-colors hover:bg-surface-container-low">
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">admin_panel_settings</span>
                      Trang quản trị
                    </Link>
                  )}

                  {user.role === "shipper" ? (
                    <Link to="/shipper" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface transition-colors hover:bg-surface-container-low">
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">local_shipping</span>
                      Trang shipper
                    </Link>
                  ) : null}

                  <div className="my-1 border-t border-surface-variant" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-error transition-colors hover:bg-error/5"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Đăng xuất
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/dang-nhap" state={{ from: location }} className="rounded-full border border-primary/30 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-surface-container-low">
                Đăng nhập
              </Link>
              <Link to="/dang-ky" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-sm transition-all hover:opacity-90">
                Đăng ký
              </Link>
            </div>
          )}

          <button className="p-2 text-on-surface-variant hover:text-primary md:hidden" onClick={() => setMenuOpen((value) => !value)}>
            <span className="material-symbols-outlined">{menuOpen ? "close" : "menu"}</span>
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="absolute left-0 top-16 z-40 flex w-full flex-col gap-1 border-b border-surface-variant bg-surface px-6 py-4 shadow-md md:hidden">
          <NavLink to="/marketplaces" className={linkClass} onClick={() => setMenuOpen(false)}>Mua sắm</NavLink>
          <NavLink to="/cho-thue" className={linkClass} onClick={() => setMenuOpen(false)}>Cho thuê</NavLink>
          {user ? (
            <>
              {user.role !== "admin" ? (
                <>
                  <NavLink to="/ho-so" className={linkClass} onClick={() => setMenuOpen(false)}>Hồ sơ cá nhân</NavLink>
                  <NavLink to="/goi-pro" className={linkClass} onClick={() => setMenuOpen(false)}>Nâng cấp Pro</NavLink>
                  <NavLink to="/dang-tin" className={linkClass} onClick={() => setMenuOpen(false)}>Đăng tin</NavLink>
                  <NavLink to="/don-hang" className={linkClass} onClick={() => setMenuOpen(false)}>Đơn mua</NavLink>
                  <NavLink to="/gio-hang" className={linkClass} onClick={() => setMenuOpen(false)}>Giỏ hàng</NavLink>
                  <NavLink to="/don-ban" className={linkClass} onClick={() => setMenuOpen(false)}>Đơn bán</NavLink>
                </>
              ) : (
                <NavLink to="/admin" className={linkClass} onClick={() => setMenuOpen(false)}>Trang quản trị</NavLink>
              )}
              {user.role === "shipper" && (
                <NavLink to="/shipper" className={linkClass} onClick={() => setMenuOpen(false)}>Trang shipper</NavLink>
              )}
            </>
          ) : (
            <>
              <Link to="/dang-nhap" state={{ from: location }} className="py-1 text-sm font-medium text-primary" onClick={() => setMenuOpen(false)}>Đăng nhập</Link>
              <Link to="/dang-ky" className="py-1 text-sm font-medium text-primary" onClick={() => setMenuOpen(false)}>Đăng ký</Link>
            </>
          )}
        </div>
      ) : null}
    </nav>
  );
};

export default Navbar;
