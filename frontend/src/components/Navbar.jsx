import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

const Navbar = () => {
  const { user, logout, unreadCount } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/"); setUserMenuOpen(false); };

  // Backend trả về fullName, không phải name
  const displayName = user?.fullName || user?.name || "";

  const linkClass = ({ isActive }) =>
    isActive
      ? "text-primary border-b-2 border-primary pb-1 text-sm font-medium transition-colors"
      : "text-on-surface-variant hover:text-primary text-sm font-medium transition-colors";

  const roleLabel = { admin: "Quản trị viên", shipper: "Shipper", user: "Người dùng" };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 h-16 bg-surface/95 backdrop-blur-md border-b border-surface-variant/50 shadow-[0px_1px_8px_rgba(0,0,0,0.06)]">
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 h-full flex items-center justify-between gap-4">

        {/* Logo + Nav links */}
        <div className="flex items-center gap-8">
          <Link to="/" className="text-xl font-bold text-primary tracking-tight select-none flex-shrink-0">
            EcoTrade
          </Link>
          <div className="hidden md:flex gap-5">
            <NavLink to="/marketplace" className={linkClass}>Mua sắm</NavLink>
            <NavLink to="/cho-thue" className={linkClass}>Cho thuê</NavLink>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Search (desktop) */}
          <div className="hidden lg:flex items-center bg-surface-container-low rounded-full px-4 py-2 border border-surface-variant gap-2 w-52">
            <span className="material-symbols-outlined text-on-surface-variant text-[17px]">search</span>
            <input
              className="bg-transparent border-none outline-none text-sm text-on-surface placeholder:text-on-surface-variant w-full"
              placeholder="Tìm kiếm..."
              onKeyDown={(e) => e.key === "Enter" && navigate(`/marketplace?q=${e.target.value}`)}
            />
          </div>

          {/* Đăng tin */}
          {user && user.role !== "admin" && (
            <Link
              to="/dang-tin"
              className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-full text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Đăng tin
            </Link>
          )}

          {/* Notification bell với unread badge */}
          <button
            onClick={() => user && navigate("/thong-bao")}
            className="relative text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-error text-on-error text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* User menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-surface-variant hover:bg-surface-container-low transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-on-primary text-xs font-bold flex-shrink-0">
                  {displayName.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="hidden md:block text-sm font-medium text-on-surface max-w-[90px] truncate">
                  {displayName}
                </span>
                <span className="material-symbols-outlined text-[15px] text-on-surface-variant">expand_more</span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-12 bg-surface-container-lowest rounded-xl shadow-apple-md border border-surface-variant w-56 py-2 z-50">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-surface-variant/50">
                    <p className="font-semibold text-on-surface text-sm truncate">{displayName}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{roleLabel[user.role] || "Người dùng"}</p>
                  </div>
                  {user.role !== "admin" && (
                    <>
                      <Link to="/ho-so" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-low text-sm text-on-surface transition-colors">
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">person</span>
                        Hồ sơ cá nhân
                      </Link>
                      <Link to="/quan-ly/bai-dang" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-low text-sm text-on-surface transition-colors">
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">inventory_2</span>
                        Bài đăng của tôi
                      </Link>
                      <Link to="/don-hang" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-low text-sm text-on-surface transition-colors">
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">shopping_bag</span>
                        Đơn hàng
                      </Link>
                      <Link to="/thue-muon" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-low text-sm text-on-surface transition-colors">
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">handshake</span>
                        Thuê & mượn
                      </Link>
                      <Link to="/tin-nhan" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-low text-sm text-on-surface transition-colors">
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chat</span>
                        Tin nhắn
                      </Link>
                    </>
                  )}
                  {user.role === "admin" && (
                    <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-low text-sm text-on-surface transition-colors">
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">admin_panel_settings</span>
                      Trang quản trị
                    </Link>
                  )}
                  {user.role === "shipper" && (
                    <Link to="/shipper" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-low text-sm text-on-surface transition-colors">
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">local_shipping</span>
                      Trang Shipper
                    </Link>
                  )}
                  <div className="border-t border-surface-variant my-1" />
                  <button onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-error/5 text-sm text-error transition-colors w-full text-left">
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/dang-nhap"
                className="px-4 py-2 text-sm font-medium text-primary border border-primary/30 rounded-full hover:bg-surface-container-low transition-colors">
                Đăng nhập
              </Link>
              <Link to="/dang-ky"
                className="px-4 py-2 text-sm font-semibold bg-primary text-on-primary rounded-full hover:opacity-90 transition-all shadow-sm">
                Đăng ký
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button className="md:hidden text-on-surface-variant hover:text-primary p-2"
            onClick={() => setMenuOpen(!menuOpen)}>
            <span className="material-symbols-outlined">{menuOpen ? "close" : "menu"}</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute top-16 left-0 w-full bg-surface border-b border-surface-variant shadow-md md:hidden flex flex-col py-4 px-6 gap-1 z-40">
          <NavLink to="/marketplace" className={linkClass} onClick={() => setMenuOpen(false)}>Mua sắm</NavLink>
          <NavLink to="/cho-thue" className={linkClass} onClick={() => setMenuOpen(false)}>Cho thuê</NavLink>
          {user ? (
            <>
              {user.role !== "admin" && (
                <>
                  <NavLink to="/ho-so" className={linkClass} onClick={() => setMenuOpen(false)}>Hồ sơ cá nhân</NavLink>
                  <NavLink to="/dang-tin" className={linkClass} onClick={() => setMenuOpen(false)}>Đăng tin</NavLink>
                </>
              )}
              {user.role === "admin" && (
                <NavLink to="/admin" className={linkClass} onClick={() => setMenuOpen(false)}>Trang quản trị</NavLink>
              )}
            </>
          ) : (
            <>
              <Link to="/dang-nhap" className="text-primary font-medium text-sm py-1" onClick={() => setMenuOpen(false)}>Đăng nhập</Link>
              <Link to="/dang-ky" className="text-primary font-medium text-sm py-1" onClick={() => setMenuOpen(false)}>Đăng ký</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
