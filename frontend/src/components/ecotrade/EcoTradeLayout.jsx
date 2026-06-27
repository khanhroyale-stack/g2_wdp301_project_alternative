import { NavLink, useLocation } from "react-router-dom";
import { Box, Grid2x2, ShoppingCart, Store, Truck } from "lucide-react";
import Navbar from "../Navbar";
import Footer from "../Footer";
import { useAuth } from "../../context/AuthContext";
import usePendingSalesCount from "../../hooks/usePendingSalesCount";
import { cn } from "../../lib/utils";

export default function EcoTradeLayout({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const pendingSalesCount = usePendingSalesCount();

  const mainMenu = user?.role === "shipper"
    ? [
        { label: "Marketplace", icon: Grid2x2, to: "/marketplaces" },
        { label: "Đơn có thể nhận", icon: Truck, to: "/shipper" },
      ]
    : [
        { label: "Marketplace", icon: Grid2x2, to: "/marketplaces" },
        { label: "Giỏ hàng", icon: ShoppingCart, to: "/gio-hang" },
        { label: "Đơn mua", icon: Box, to: "/orders/my-orders" },
        { label: "Đơn bán", icon: Store, to: "/orders/my-sales" },
      ];

  const isActive = (to) => {
    if (to === "/shipper") return location.pathname === "/shipper" || location.pathname.startsWith("/shipper/don/");
    if (to === "/orders/my-orders") return location.pathname === "/orders/my-orders" || location.pathname === "/don-hang";
    if (to === "/orders/my-sales") return location.pathname === "/orders/my-sales" || location.pathname === "/don-ban";
    return location.pathname === to;
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-[1400px] flex-grow px-4 pb-16 pt-24 md:px-10">
        <div className="mb-6 overflow-x-auto">
          <div className="inline-flex min-w-full gap-2 rounded-2xl border border-surface-variant/40 bg-surface-container-lowest p-2 shadow-apple">
            {mainMenu.map(({ label, icon: Icon, to }) => (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  "flex min-w-fit items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
                  isActive(to)
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
                {to === "/orders/my-sales" && pendingSalesCount > 0 ? (
                  <span
                    className={cn(
                      "ml-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                      isActive(to) ? "bg-white/20 text-on-primary" : "bg-warning text-warning-foreground"
                    )}
                  >
                    {pendingSalesCount}
                  </span>
                ) : null}
              </NavLink>
            ))}
          </div>
        </div>

        {children}
      </main>

      <Footer />
    </div>
  );
}
