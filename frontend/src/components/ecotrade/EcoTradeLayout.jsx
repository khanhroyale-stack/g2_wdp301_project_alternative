import { NavLink } from "react-router-dom";
import { Bell, Box, Grid2x2, Leaf, LogOut, Search, Settings, ShoppingCart, Store, Truck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import usePendingSalesCount from "../../hooks/usePendingSalesCount";
import { cn } from "../../lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Input } from "../ui/input";

export default function EcoTradeLayout({ children }) {
  const { user, logout } = useAuth();
  const pendingSalesCount = usePendingSalesCount();
  const mainMenu = user?.role === "shipper"
    ? [
        { label: "Marketplace", icon: Grid2x2, to: "/products" },
        { label: "Shipper Hub", icon: Box, to: "/shipper" },
        { label: "Don can giao", icon: Truck, to: "/shipper/don-can-giao" },
        { label: "Don dang giao", icon: Truck, to: "/shipper/dang-giao" },
      ]
    : [
        { label: "Marketplace", icon: Grid2x2, to: "/products" },
        { label: "Gio hang", icon: ShoppingCart, to: "/gio-hang" },
        { label: "Don mua", icon: Box, to: "/orders/my-orders" },
        { label: "Don ban", icon: Store, to: "/orders/my-sales" },
      ];
  const initials = (user?.fullName || "Alex Nguyen")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen w-full bg-white">
        <aside className="hidden w-[256px] shrink-0 border-r border-border bg-[#fbfbfb] lg:flex lg:flex-col">
          <div className="border-b border-border px-8 py-9">
            <div className="text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">Main Menu</div>
          </div>
          <nav className="flex-1 space-y-1 px-6 py-6">
            {mainMenu.map(({ label, icon: Icon, to }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-[1.05rem] font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground",
                    isActive && "bg-white text-foreground shadow-panel"
                  )
                }
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
                {to === "/orders/my-sales" && pendingSalesCount > 0 ? (
                  <span className="ml-auto flex h-6 min-w-6 items-center justify-center rounded-full bg-warning px-2 text-xs font-bold text-warning-foreground">
                    {pendingSalesCount}
                  </span>
                ) : null}
              </NavLink>
            ))}
          </nav>
          <div className="px-8 pb-6">
            <div className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">System</div>
            <div className="space-y-1">
              <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[1.02rem] font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground">
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </button>
              <button
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[1.02rem] font-semibold text-[#ff5d53] transition hover:bg-[#fff0ef]"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-border bg-white/95 backdrop-blur">
            <div className="flex h-[88px] items-center gap-4 px-5 sm:px-8">
              <NavLink to="/products" className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Leaf className="h-5 w-5" />
                </div>
                <span className="text-[2rem] font-extrabold tracking-tight text-success">EcoTrade</span>
              </NavLink>
              <div className="hidden max-w-[420px] flex-1 md:block">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="border-transparent bg-[#f5f7f6] pl-11" placeholder="Search items, orders, or delivery IDs..." />
                </div>
              </div>
              <div className="ml-auto flex items-center gap-4">
                <button className="relative flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white text-muted-foreground">
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-danger" />
                </button>
                <div className="hidden h-11 w-px bg-border md:block" />
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-base font-bold">{user?.fullName || "Alex Nguyen"}</div>
                    <div className="text-sm text-muted-foreground">{user?.role === "shipper" ? "Premium Shipper" : "Premium Trader"}</div>
                  </div>
                  <div className="relative">
                    <Avatar className="h-12 w-12 border border-border">
                      <AvatarImage src="" alt={user?.fullName || "User"} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-success" />
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 bg-white pb-10 pt-8">{children}</main>

          <footer className="flex flex-col gap-3 border-t border-border px-5 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div className="flex items-center gap-5">
              <span>© 2024 EcoTrade Inc.</span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-success" />
                System Operational
              </span>
            </div>
            <div className="flex items-center gap-6">
              <span>Help Center</span>
              <span>Terms of Service</span>
              <span>Privacy Policy</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
