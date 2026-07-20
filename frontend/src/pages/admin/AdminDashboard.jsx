import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import adminService from "../../services/admin.service";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getStats()
      .then((res) => {
        if (res.success) setStats(res.data);
      })
      .catch((err) => console.error("Lỗi lấy thống kê:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar variant="admin" />
        <main className="flex flex-1 items-center justify-center md:ml-72">
          <div className="flex flex-col items-center gap-4 text-primary/40">
            <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-xs font-black uppercase tracking-widest">Đang tải trung tâm dữ liệu...</p>
          </div>
        </main>
      </div>
    );
  }

  const statsCards = [
    {
      icon: "group",
      label: "Tổng người dùng",
      value: stats?.users?.total ?? 0,
      badge: "Cộng đồng",
      badgeColor: "text-primary bg-primary/10 border-primary/10",
      bg: "bg-primary/5 text-primary",
    },
    {
      icon: "pending_actions",
      label: "Xác minh KYC",
      value: stats?.users?.pendingVerify ?? 0,
      badge: "Cần duyệt",
      badgeColor: "text-secondary bg-secondary/10 border-secondary/10",
      bg: "bg-secondary/5 text-secondary",
    },
    {
      icon: "inventory_2",
      label: "Bài đăng mới",
      value: stats?.products?.pending ?? 0,
      badge: "Chờ duyệt",
      badgeColor: "text-error bg-error/10 border-error/10",
      bg: "bg-error/5 text-error",
    },
    {
      icon: "check_circle",
      label: "Đơn hoàn tất",
      value: stats?.orders?.completed ?? 0,
      badge: "Giao dịch",
      badgeColor: "text-primary bg-primary/10 border-primary/10",
      bg: "bg-primary/5 text-primary",
    },
    {
      icon: "handshake",
      label: "Đang thuê",
      value: stats?.rentals?.active ?? 0,
      badge: "Hợp đồng",
      badgeColor: "text-sky-600 bg-sky-50 border-sky-100",
      bg: "bg-sky-50 text-sky-600",
    },
    {
      icon: "report",
      label: "Báo cáo vi phạm",
      value: stats?.reports?.pending ?? 0,
      badge: "Ưu tiên",
      badgeColor: "text-error bg-error/10 border-error/10",
      bg: "bg-error/5 text-error",
    },
  ];

  const detailItems = [
    { label: "Tài khoản bị khóa", value: stats?.users?.banned ?? 0, color: "text-error" },
    { label: "Sản phẩm active", value: stats?.products?.active ?? 0, color: "text-primary" },
    { label: "Tổng số shipper", value: stats?.shippers?.total ?? 0, color: "text-foreground" },
    { label: "Báo cáo đã xử lý", value: stats?.reports?.resolved ?? 0, color: "text-primary" },
    { label: "Hợp đồng hoàn tất", value: stats?.rentals?.completed ?? 0, color: "text-foreground" },
    { label: "Đơn hàng bị hủy", value: stats?.orders?.cancelled ?? 0, color: "text-on-surface-variant/60" },
    { label: "Tổng đánh giá", value: stats?.reviews?.total ?? 0, color: "text-primary" },
  ];

  return (
    <div className="min-h-screen bg-background flex selection:bg-primary/20">
      <Sidebar variant="admin" />
      <main className="flex-1 px-4 py-12 md:ml-72 md:px-12">
        <header className="relative mb-12 overflow-hidden rounded-organic bg-gradient-to-br from-primary to-primary-container p-10 shadow-apple-md">
          {/* Animated Blobs */}
          <div className="absolute -right-16 -top-16 h-48 w-48 animate-blob rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute -left-16 -bottom-16 h-48 w-48 animate-blob animation-delay-4000 rounded-full bg-secondary/10 blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/80 backdrop-blur-md border border-white/10">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse"></span>
              Trung tâm kiểm soát hệ thống
            </div>
            <h1 className="text-4xl font-display font-black text-white md:text-5xl tracking-tight mb-2">Xin chào, Quản trị viên</h1>
            <p className="text-lg font-medium text-white/70">Theo dõi toàn diện các hoạt động và chỉ số vận hành của EcoTrade.</p>
          </div>
        </header>

        <section className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {statsCards.map((item) => (
            <div
              key={item.label}
              className="bg-white rounded-organic p-7 shadow-sm border border-primary/5 transition-all hover:shadow-apple-md group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.bg} shadow-inner transition-transform group-hover:scale-110`}>
                  <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                </div>
                <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border ${item.badgeColor}`}>{item.badge}</span>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 group-hover:text-primary transition-colors">{item.label}</p>
                <p className="text-4xl font-display font-black text-foreground">{item.value.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
          <section className="bg-white rounded-organic xl:col-span-2 p-10 border border-primary/5 shadow-sm">
            <h3 className="mb-10 flex items-center gap-3 font-display text-xl font-black text-foreground">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary">
                <span className="material-symbols-outlined text-[20px]">analytics</span>
              </div>
              Hoạt động chi tiết
            </h3>
            
            <div className="mb-12 grid grid-cols-2 gap-x-10 gap-y-8 md:grid-cols-4">
              {detailItems.map((item) => (
                <div key={item.label} className="group">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 mb-2 group-hover:text-primary transition-colors">{item.label}</p>
                  <p className={`text-2xl font-display font-black ${item.color}`}>{item.value.toLocaleString()}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 border-t border-primary/5 pt-10">
              <Link to="/admin/nguoi-dung" className="rounded-pill bg-background px-8 py-3.5 text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/5 transition-all">
                Quản lý thành viên
              </Link>
              <Link to="/admin/duyet-bai-dang" className="rounded-pill bg-primary px-8 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                Duyệt bài đăng mới
              </Link>
              <Link to="/admin/bao-cao" className="rounded-pill border-2 border-error/10 px-8 py-3.5 text-xs font-black uppercase tracking-widest text-error hover:bg-error/5 transition-all">
                Báo cáo vi phạm
              </Link>
            </div>
          </section>

          <section className="bg-white rounded-organic p-10 border border-primary/5 shadow-sm flex flex-col">
            <h3 className="mb-8 flex items-center gap-3 font-display text-xl font-black text-foreground">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/5 text-secondary">
                <span className="material-symbols-outlined text-[20px]">bolt</span>
              </div>
              Truy cập nhanh
            </h3>
            <div className="flex flex-1 flex-col gap-3">
              {[
                {
                  to: "/admin/duyet-bai-dang",
                  icon: "fact_check",
                  label: "Bài đăng chờ duyệt",
                  badge: stats?.products?.pending > 0 ? stats.products.pending : null,
                  color: "primary"
                },
                {
                  to: "/admin/bao-cao",
                  icon: "report",
                  label: "Báo cáo khẩn cấp",
                  badge: stats?.reports?.pending > 0 ? stats.reports.pending : null,
                  color: "error"
                },
                { to: "/admin/don-hang", icon: "receipt_long", label: "Quản lý đơn hàng", color: "primary" },
                { to: "/admin/hop-dong", icon: "description", label: "Quản lý hợp đồng", color: "primary" },
                { to: "/admin/danh-muc", icon: "category", label: "Cấu trúc danh mục", color: "primary" },
              ].map(({ to, icon, label, badge, color }) => (
                <Link
                  key={to}
                  to={to}
                  className="group flex items-center justify-between rounded-2xl border border-primary/5 bg-background/30 p-4 transition-all hover:border-primary/20 hover:bg-white hover:shadow-apple"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white text-${color} shadow-sm group-hover:bg-primary group-hover:text-white transition-all`}>
                      <span className="material-symbols-outlined text-[18px]">{icon}</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">{label}</span>
                  </div>
                  {badge ? (
                    <span className="min-w-[24px] h-6 flex items-center justify-center rounded-full bg-error px-2 text-[10px] font-black text-white shadow-sm shadow-error/20">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px] text-primary/20 group-hover:text-primary transition-colors">chevron_right</span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
