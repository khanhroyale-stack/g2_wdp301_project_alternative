import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Box, ShoppingCart, Store, Truck, ChevronDown, ChevronRight, History, PackageSearch, User, Handshake, MessageSquare, Bell, BarChart3 } from "lucide-react";
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

  const isOrdersActive = location.pathname.startsWith("/orders/my-orders") || location.pathname.startsWith("/orders/history") || location.pathname === "/don-hang";
  const [isOrdersOpen, setIsOrdersOpen] = useState(isOrdersActive);

  useEffect(() => {
    if (isOrdersActive) setIsOrdersOpen(true);
  }, [isOrdersActive]);

  const mainMenu = user?.role === "shipper"
    ? [
        { label: "Đơn có thể nhận", icon: Truck, to: "/shipper" },
      ]
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
            { label: "Lịch sử giao dịch", to: "/orders/history", icon: History }
          ]
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
    if (to === "/quan-ly/bai-dang") return location.pathname === "/quan-ly/bai-dang" || location.pathname === "/goi-pro/chon-san-pham-noi-bat";
    if (to === "/orders/my-orders") return (
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

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20">
      <Navbar />

      <main className="mx-auto w-full max-w-container-max-width flex-grow px-4 pb-20 pt-28 md:px-10 flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-[280px] shrink-0">
          <div className="sticky top-28 flex flex-col gap-1.5 rounded-organic border border-primary/5 bg-white p-4 shadow-apple-md">
            <div className="px-4 py-2 mb-2">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-primary/40">Bảng điều khiển</p>
            </div>
            {mainMenu.map((item) => {
              if (item.isDropdown) {
                return (
                  <div key="orders-dropdown" className="flex flex-col gap-1">
                    <button
                      onClick={item.onToggle}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-pill px-5 py-3.5 text-sm font-bold transition-all",
                        isOrdersActive && !item.isOpen
                          ? "bg-primary/5 text-primary"
                          : "text-on-surface-variant hover:bg-primary/5 hover:text-primary"
                      )}
                    >
                      <item.icon className={cn("h-5 w-5", isOrdersActive && !item.isOpen ? "text-primary" : "text-primary/40")} />
                      <span>{item.label}</span>
                      {item.isOpen ? <ChevronDown className="ml-auto h-4 w-4 opacity-40" /> : <ChevronRight className="ml-auto h-4 w-4 opacity-40" />}
                    </button>
                    {item.isOpen && (
                      <div className="ml-7 mt-1 flex flex-col gap-1 border-l border-primary/10 pl-3">
                        {item.subItems.map((sub) => (
                           <NavLink
                             key={sub.to}
                             to={sub.to}
                             className={cn(
                               "flex w-full items-center gap-3 rounded-pill px-5 py-2.5 text-sm font-bold transition-all",
                               isActive(sub.to)
                                 ? "bg-primary text-white shadow-lg shadow-primary/20"
                                 : "text-on-surface-variant hover:text-primary hover:bg-primary/5"
                             )}
                           >
                             <sub.icon className={cn("h-4 w-4", isActive(sub.to) ? "text-white" : "text-primary/40")} />
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
                    "flex w-full items-center gap-3 rounded-pill px-5 py-3.5 text-sm font-bold transition-all",
                    isActive(item.to)
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "text-on-surface-variant hover:bg-primary/5 hover:text-primary"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive(item.to) ? "text-white" : "text-primary/40")} />
                  <span>{item.label}</span>
                  {item.to === "/orders/my-sales" && pendingSalesCount > 0 ? (
                    <span
                      className={cn(
                        "ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-black",
                        isActive(item.to) ? "bg-white/20 text-white" : "bg-secondary text-white shadow-sm shadow-secondary/20"
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
