import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Box,
  ShoppingCart,
  Store,
  Truck,
  ChevronDown,
  ChevronRight,
  History,
  PackageSearch,
  User,
  Handshake,
  MessageSquare,
  Bell,
  BarChart3,
  LayoutDashboard,
} from "lucide-react";
import Navbar from "../Navbar";
import Footer from "../Footer";
import FeaturedReminderBanner from "../FeaturedReminderBanner";
import { useAuth } from "../../context/AuthContext";
import usePendingSalesCount from "../../hooks/usePendingSalesCount";
import { cn } from "../../lib/utils";

export default function EcoTradeLayout({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const pendingSalesCount = usePendingSalesCount();

  const isOrdersActive =
    location.pathname.startsWith("/orders/my-orders") ||
    location.pathname.startsWith("/orders/history") ||
    location.pathname === "/don-hang";
  const [isOrdersOpen, setIsOrdersOpen] = useState(isOrdersActive);

  useEffect(() => {
    if (isOrdersActive) setIsOrdersOpen(true);
  }, [isOrdersActive]);

  const mainMenu =
    user?.role === "shipper"
      ? [{ label: "Đơn có thể nhận", icon: Truck, to: "/shipper" }]
      : [
          { label: "Tổng quan", icon: User, to: "/ho-so" },
          { label: "Giỏ hàng", icon: ShoppingCart, to: "/gio-hang" },
          { label: "Bài đăng của tôi", icon: PackageSearch, to: "/quan-ly/bai-dang" },
          {
            label: "Đơn mua",
            icon: Box,
            isDropdown: true,
            isOpen: isOrdersOpen,
            onToggle: () => setIsOrdersOpen(!isOrdersOpen),
            subItems: [
              { label: "Đơn hàng của tôi", to: "/orders/my-orders", icon: Box },
              { label: "Lịch sử giao dịch", to: "/orders/history", icon: History },
            ],
          },
          { label: "Đơn bán", icon: Store, to: "/orders/my-sales" },
          { label: "Thống kê bán hàng", icon: BarChart3, to: "/thong-ke-ban-hang" },
          { label: "Thuê và mượn", icon: Handshake, to: "/thue-muon" },
          { label: "Tin nhắn", icon: MessageSquare, to: "/tin-nhan" },
          { label: "Thông báo", icon: Bell, to: "/thong-bao" },
        ];

  const isActive = (to) => {
    if (to === "/shipper") return location.pathname === "/shipper" || location.pathname.startsWith("/shipper/don/");
    if (to === "/ho-so") return location.pathname === "/ho-so";
    if (to === "/quan-ly/bai-dang")
      return location.pathname === "/quan-ly/bai-dang" || location.pathname === "/goi-pro/chon-san-pham-noi-bat";
    if (to === "/orders/my-orders")
      return (
        location.pathname === "/orders/my-orders" ||
        location.pathname === "/don-hang" ||
        location.pathname.startsWith("/orders/detail/") ||
        /^\/orders\/[a-fA-F0-9]{24}$/.test(location.pathname)
      );
    if (to === "/orders/history") return location.pathname === "/orders/history";
    if (to === "/orders/my-sales") return location.pathname === "/orders/my-sales" || location.pathname === "/don-ban";
    if (to === "/thue-muon") return location.pathname === "/thue-muon" || location.pathname.startsWith("/thue-muon/");
    if (to === "/tin-nhan") return location.pathname === "/tin-nhan" || location.pathname.startsWith("/tin-nhan/");
    if (to === "/thong-bao") return location.pathname === "/thong-bao";
    return location.pathname === to;
  };

  const navItemBase =
    "flex w-full items-center gap-3 rounded-field px-4 py-3 text-sm font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98]";

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/15">
      <Navbar />

      <main className="mx-auto w-full max-w-container-max-width flex-grow px-4 pb-20 pt-28 md:px-10 flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-[280px] shrink-0">
          <div className="sticky top-28 flex flex-col gap-1 rounded-card border border-border bg-surface/90 p-4 shadow-glass backdrop-blur-xl">
            <div className="mb-3 flex items-center gap-3 border-b border-border px-2 pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-field bg-primary/10 text-primary">
                <LayoutDashboard className="h-4.5 w-4.5 h-[18px] w-[18px]" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Bảng điều khiển</p>
                <p className="truncate text-sm font-bold text-foreground">
                  {user?.fullName || user?.name || "EcoTrade"}
                </p>
              </div>
            </div>

            {mainMenu.map((item) => {
              if (item.isDropdown) {
                return (
                  <div key="orders-dropdown" className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={item.onToggle}
                      className={cn(
                        navItemBase,
                        isOrdersActive && !item.isOpen
                          ? "bg-surface-secondary text-primary"
                          : "text-muted-foreground hover:bg-surface-secondary hover:text-primary"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-5 w-5 shrink-0 transition-opacity duration-200",
                          isOrdersActive ? "text-primary opacity-100" : "opacity-50"
                        )}
                      />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.isOpen ? (
                        <ChevronDown className="h-4 w-4 opacity-40" />
                      ) : (
                        <ChevronRight className="h-4 w-4 opacity-40" />
                      )}
                    </button>
                    {item.isOpen && (
                      <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-border pl-3">
                        {item.subItems.map((sub) => (
                          <NavLink
                            key={sub.to}
                            to={sub.to}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-field px-3 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                              isActive(sub.to)
                                ? "bg-primary text-white shadow-card"
                                : "text-muted-foreground hover:bg-surface-secondary hover:text-primary"
                            )}
                          >
                            <sub.icon
                              className={cn("h-4 w-4 shrink-0", isActive(sub.to) ? "text-white" : "opacity-50")}
                            />
                            <span>{sub.label}</span>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    navItemBase,
                    isActive(item.to)
                      ? "bg-primary text-white shadow-card"
                      : "text-muted-foreground hover:bg-surface-secondary hover:text-primary"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 shrink-0 transition-opacity duration-200",
                      isActive(item.to) ? "text-white opacity-100" : "opacity-50"
                    )}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.to === "/orders/my-sales" && pendingSalesCount > 0 ? (
                    <span
                      className={cn(
                        "flex h-5 min-w-5 items-center justify-center rounded-pill px-1.5 text-[10px] font-extrabold",
                        isActive(item.to) ? "bg-white/20 text-white" : "bg-secondary text-white"
                      )}
                    >
                      {pendingSalesCount}
                    </span>
                  ) : null}
                </NavLink>
              );
            })}
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <FeaturedReminderBanner />
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
