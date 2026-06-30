import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Box, ShoppingCart, Store, Truck, ChevronDown, ChevronRight, History, PackageSearch } from "lucide-react";
import Navbar from "../Navbar";
import Footer from "../Footer";
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
        { label: "Giỏ hàng", icon: ShoppingCart, to: "/gio-hang" },
        { label: "Sản phẩm của tôi", icon: PackageSearch, to: "/quan-ly/bai-dang" },
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
      ];

  const isActive = (to) => {
    if (to === "/shipper") return location.pathname === "/shipper" || location.pathname.startsWith("/shipper/don/");
    if (to === "/quan-ly/bai-dang") return location.pathname === "/quan-ly/bai-dang";
    if (to === "/orders/my-orders") return (
      location.pathname === "/orders/my-orders" ||
      location.pathname === "/don-hang" ||
      location.pathname.startsWith("/orders/detail/") ||
      /^\/orders\/[a-fA-F0-9]{24}$/.test(location.pathname)
    );
    if (to === "/orders/history") return location.pathname === "/orders/history";
    if (to === "/orders/my-sales") return location.pathname === "/orders/my-sales" || location.pathname === "/don-ban";
    return location.pathname === to;
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-[1400px] flex-grow px-4 pb-16 pt-24 md:px-10 flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-[250px] shrink-0">
          <div className="flex flex-col gap-2 rounded-2xl border border-surface-variant/40 bg-surface-container-lowest p-3 shadow-apple">
            {mainMenu.map((item) => {
              if (item.isDropdown) {
                return (
                  <div key="orders-dropdown" className="flex flex-col gap-1">
                    <button
                      onClick={item.onToggle}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
                        isOrdersActive && !item.isOpen
                          ? "bg-primary/10 text-primary"
                          : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                      )}
                    >
                      <item.icon className="h-[18px] w-[18px]" />
                      <span>{item.label}</span>
                      {item.isOpen ? <ChevronDown className="ml-auto h-4 w-4" /> : <ChevronRight className="ml-auto h-4 w-4" />}
                    </button>
                    {item.isOpen && (
                      <div className="ml-4 flex flex-col gap-1 border-l-2 border-surface-variant/30 pl-2">
                        {item.subItems.map((sub) => (
                           <NavLink
                             key={sub.to}
                             to={sub.to}
                             className={cn(
                               "flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
                               isActive(sub.to)
                                 ? "bg-primary text-on-primary shadow-sm"
                                 : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                             )}
                           >
                             <sub.icon className="h-4 w-4" />
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
                    "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
                    isActive(item.to)
                      ? "bg-primary text-on-primary shadow-sm"
                      : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                  )}
                >
                  <item.icon className="h-[18px] w-[18px]" />
                  <span>{item.label}</span>
                  {item.to === "/orders/my-sales" && pendingSalesCount > 0 ? (
                    <span
                      className={cn(
                        "ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                        isActive(item.to) ? "bg-white/20 text-on-primary" : "bg-warning text-warning-foreground"
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
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
