import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import adminService from "../../services/admin.service";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getStats()
      .then((res) => { if (res.success) setStats(res.data); })
      .catch((err) => console.error("Lỗi lấy thống kê:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#F5F5F7]">
        <Sidebar variant="admin" />
        <main className="flex-1 md:ml-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl animate-spin text-primary">refresh</span>
            <p className="text-sm">Đang tải dữ liệu thống kê...</p>
          </div>
        </main>
      </div>
    );
  }

  const STATS_CARDS = [
    {
      icon: "group", label: "Tổng người dùng",
      value: stats?.users?.total ?? 0,
      badge: "Thành viên", badgeColor: "text-primary bg-primary-fixed-dim/20",
      bg: "bg-secondary-container text-on-secondary-container",
    },
    {
      icon: "pending_actions", label: "Chưa xác minh email",
      value: stats?.users?.pendingVerify ?? 0,
      badge: "Chưa xác minh", badgeColor: "text-error bg-error/10",
      bg: "bg-error-container text-on-error-container",
    },
    {
      icon: "inventory_2", label: "Bài đăng chờ duyệt",
      value: stats?.products?.pending ?? 0,
      badge: "Pending", badgeColor: "text-error bg-error/10",
      bg: "bg-surface-container-high text-on-surface",
    },
    {
      icon: "check_circle", label: "Đơn hàng hoàn tất",
      value: stats?.orders?.completed ?? 0,
      badge: "Mua bán", badgeColor: "text-primary bg-primary-fixed-dim/20",
      bg: "bg-secondary-container text-on-secondary-container",
    },
    {
      icon: "handshake", label: "Hợp đồng đang thuê",
      value: stats?.rentals?.active ?? 0,
      badge: "Active", badgeColor: "text-on-surface-variant bg-surface-container-high",
      bg: "bg-surface-container-high text-on-surface",
    },
    {
      icon: "report", label: "Báo cáo chờ xử lý",
      value: stats?.reports?.pending ?? 0,
      badge: "Cần xử lý", badgeColor: "text-error bg-error/10",
      bg: "bg-error-container text-on-error-container",
    },
  ];

  const DETAIL_ITEMS = [
    { label: "Tài khoản bị khóa", value: stats?.users?.banned ?? 0, color: "text-error" },
    { label: "Sản phẩm active", value: stats?.products?.active ?? 0, color: "text-primary" },
    { label: "Tổng số Shipper", value: stats?.shippers?.total ?? 0, color: "text-on-surface" },
    { label: "Báo cáo đã giải quyết", value: stats?.reports?.resolved ?? 0, color: "text-on-secondary-container" },
    { label: "Hợp đồng hoàn tất", value: stats?.rentals?.completed ?? 0, color: "text-on-surface" },
    { label: "Hợp đồng tranh chấp", value: stats?.rentals?.disputed ?? 0, color: "text-error" },
    { label: "Đơn hàng bị hủy", value: stats?.orders?.cancelled ?? 0, color: "text-on-surface-variant" },
    { label: "Tổng đánh giá", value: stats?.reviews?.total ?? 0, color: "text-primary" },
  ];

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <Sidebar variant="admin" />
      <main className="flex-1 md:ml-64 px-4 md:px-10 py-10">

        {/* Header */}
        <header className="pb-8 border-b border-surface-variant/50 mb-8">
          <h2 className="text-3xl font-bold text-on-surface mb-1">Trang quản trị</h2>
          <p className="text-on-surface-variant text-sm">Tổng quan số liệu thực tế từ hệ thống.</p>
        </header>

        {/* Stats cards */}
        <section className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {STATS_CARDS.map((s) => (
            <div key={s.label}
              className="bg-surface-container-lowest rounded-2xl p-5 shadow-apple border border-surface-variant/30 flex flex-col gap-4 hover:-translate-y-0.5 transition-transform">
              <div className="flex justify-between items-start">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.bg}`}>
                  <span className="material-symbols-outlined text-[22px]">{s.icon}</span>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.badgeColor}`}>{s.badge}</span>
              </div>
              <div>
                <p className="text-sm text-on-surface-variant mb-0.5">{s.label}</p>
                <p className="text-3xl font-bold text-on-surface">{s.value.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Chi tiết */}
          <section className="lg:col-span-2 bg-surface-container-lowest rounded-2xl p-6 shadow-apple border border-surface-variant/30">
            <h3 className="font-bold text-on-surface text-base mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">bar_chart</span>
              Chi tiết hoạt động
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
              {DETAIL_ITEMS.map((item) => (
                <div key={item.label} className="flex flex-col gap-1">
                  <p className="text-xs text-on-surface-variant leading-tight">{item.label}</p>
                  <p className={`text-xl font-bold ${item.color}`}>{item.value.toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 pt-5 border-t border-surface-variant/40">
              <Link to="/admin/nguoi-dung"
                className="px-5 py-2.5 bg-surface-container-low text-on-surface rounded-xl text-sm font-semibold hover:bg-surface-container transition-colors">
                Quản lý người dùng
              </Link>
              <Link to="/admin/duyet-bai-dang"
                className="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 transition-colors shadow-sm">
                Duyệt bài đăng
              </Link>
              <Link to="/admin/bao-cao"
                className="px-5 py-2.5 border border-error/30 text-error rounded-xl text-sm font-semibold hover:bg-error/5 transition-colors">
                Xem báo cáo vi phạm
              </Link>
            </div>
          </section>

          {/* Truy cập nhanh */}
          <section className="lg:col-span-1 bg-surface-container-lowest rounded-2xl p-6 shadow-apple border border-surface-variant/30 flex flex-col">
            <h3 className="font-bold text-on-surface text-base mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">flash_on</span>
              Truy cập nhanh
            </h3>
            <div className="flex flex-col gap-2 flex-1">
              {[
                {
                  to: "/admin/duyet-bai-dang",
                  icon: "fact_check",
                  label: "Duyệt bài đăng",
                  badge: stats?.products?.pending > 0 ? stats.products.pending : null,
                },
                {
                  to: "/admin/bao-cao",
                  icon: "report",
                  label: "Báo cáo vi phạm",
                  badge: stats?.reports?.pending > 0 ? stats.reports.pending : null,
                },
                { to: "/admin/don-hang", icon: "receipt_long", label: "Quản lý đơn hàng", badge: null },
                { to: "/admin/hop-dong", icon: "description", label: "Hợp đồng thuê", badge: null },
                { to: "/admin/danh-muc", icon: "category", label: "Quản lý danh mục", badge: null },
              ].map(({ to, icon, label, badge }) => (
                <Link key={to} to={to}
                  className="p-3.5 border border-surface-variant/50 rounded-xl flex items-center justify-between hover:border-primary/40 hover:bg-primary/5 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                      <span className="material-symbols-outlined text-[18px]">{icon}</span>
                    </div>
                    <span className="font-medium text-on-surface text-sm">{label}</span>
                  </div>
                  {badge && (
                    <span className="bg-error text-on-error text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                      {badge > 99 ? "99+" : badge}
                    </span>
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
