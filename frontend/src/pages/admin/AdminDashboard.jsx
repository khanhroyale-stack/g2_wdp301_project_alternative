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
      <div className="app-shell flex">
        <Sidebar variant="admin" />
        <main className="flex flex-1 items-center justify-center md:ml-72">
          <div className="flex flex-col items-center gap-3 text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl animate-spin text-primary">refresh</span>
            <p className="text-sm font-medium">Đang tải dữ liệu thống kê...</p>
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
      badge: "Thành viên",
      badgeColor: "text-primary bg-primary-fixed-dim/20",
      bg: "bg-secondary-container text-on-secondary-container",
    },
    {
      icon: "pending_actions",
      label: "Chờ xác minh KYC",
      value: stats?.users?.pendingVerify ?? 0,
      badge: "Cần duyệt",
      badgeColor: "text-error bg-error/10",
      bg: "bg-error-container text-on-error-container",
    },
    {
      icon: "inventory_2",
      label: "Bài đăng chờ duyệt",
      value: stats?.products?.pending ?? 0,
      badge: "Pending",
      badgeColor: "text-error bg-error/10",
      bg: "bg-surface-container-high text-on-surface",
    },
    {
      icon: "check_circle",
      label: "Đơn hàng hoàn tất",
      value: stats?.orders?.completed ?? 0,
      badge: "Mua bán",
      badgeColor: "text-primary bg-primary-fixed-dim/20",
      bg: "bg-secondary-container text-on-secondary-container",
    },
    {
      icon: "handshake",
      label: "Hợp đồng đang thuê",
      value: stats?.rentals?.active ?? 0,
      badge: "Active",
      badgeColor: "text-on-surface-variant bg-surface-container-high",
      bg: "bg-surface-container-high text-on-surface",
    },
    {
      icon: "report",
      label: "Báo cáo chờ xử lý",
      value: stats?.reports?.pending ?? 0,
      badge: "Cần xử lý",
      badgeColor: "text-error bg-error/10",
      bg: "bg-error-container text-on-error-container",
    },
  ];

  const detailItems = [
    { label: "Tài khoản bị khóa", value: stats?.users?.banned ?? 0, color: "text-error" },
    { label: "Sản phẩm active", value: stats?.products?.active ?? 0, color: "text-primary" },
    { label: "Tổng số shipper", value: stats?.shippers?.total ?? 0, color: "text-on-surface" },
    { label: "Báo cáo đã giải quyết", value: stats?.reports?.resolved ?? 0, color: "text-on-secondary-container" },
    { label: "Hợp đồng hoàn tất", value: stats?.rentals?.completed ?? 0, color: "text-on-surface" },
    { label: "Hợp đồng tranh chấp", value: stats?.rentals?.disputed ?? 0, color: "text-error" },
    { label: "Đơn hàng bị hủy", value: stats?.orders?.cancelled ?? 0, color: "text-on-surface-variant" },
    { label: "Tổng đánh giá", value: stats?.reviews?.total ?? 0, color: "text-primary" },
  ];

  return (
    <div className="app-shell flex">
      <Sidebar variant="admin" />
      <main className="flex-1 px-4 py-10 md:ml-72 md:px-10">
        <header className="mb-8 rounded-[28px] border border-surface-variant/40 bg-[linear-gradient(135deg,#ffffff_0%,#edf7f0_100%)] p-7 shadow-apple">
          <h2 className="page-title mb-1">Trang quản trị</h2>
          <p className="page-subtitle mt-0">Tổng quan dữ liệu hoạt động thực tế của toàn hệ thống.</p>
        </header>

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {statsCards.map((item) => (
            <div
              key={item.label}
              className="panel-surface flex flex-col gap-4 p-5 transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.bg}`}>
                  <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.badgeColor}`}>{item.badge}</span>
              </div>
              <div>
                <p className="mb-1 text-sm text-on-surface-variant">{item.label}</p>
                <p className="text-3xl font-extrabold text-on-surface">{item.value.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="panel-surface xl:col-span-2 p-6">
            <h3 className="mb-6 flex items-center gap-2 text-base font-bold text-on-surface">
              <span className="material-symbols-outlined text-primary">bar_chart</span>
              Chi tiết hoạt động
            </h3>
            <div className="mb-8 grid grid-cols-2 gap-5 md:grid-cols-4">
              {detailItems.map((item) => (
                <div key={item.label} className="flex flex-col gap-1">
                  <p className="text-xs leading-tight text-on-surface-variant">{item.label}</p>
                  <p className={`text-xl font-bold ${item.color}`}>{item.value.toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 border-t border-surface-variant/40 pt-5">
              <Link to="/admin/nguoi-dung" className="rounded-xl bg-surface-container-low px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container">
                Quản lý người dùng
              </Link>
              <Link to="/admin/duyet-bai-dang" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition-colors hover:opacity-90">
                Duyệt bài đăng
              </Link>
              <Link to="/admin/bao-cao" className="rounded-xl border border-error/30 px-5 py-2.5 text-sm font-semibold text-error transition-colors hover:bg-error/5">
                Xem báo cáo vi phạm
              </Link>
            </div>
          </section>

          <section className="panel-surface flex flex-col p-6">
            <h3 className="mb-5 flex items-center gap-2 text-base font-bold text-on-surface">
              <span className="material-symbols-outlined text-primary">flash_on</span>
              Truy cập nhanh
            </h3>
            <div className="flex flex-1 flex-col gap-2">
              {[
                {
                  to: "/admin/duyet-tai-khoan",
                  icon: "how_to_reg",
                  label: "Duyệt KYC",
                  badge: stats?.users?.pendingVerify > 0 ? stats.users.pendingVerify : null,
                },
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
                <Link
                  key={to}
                  to={to}
                  className="flex items-center justify-between rounded-2xl border border-surface-variant/50 p-3.5 transition-all hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors">
                      <span className="material-symbols-outlined text-[18px]">{icon}</span>
                    </div>
                    <span className="text-sm font-medium text-on-surface">{label}</span>
                  </div>
                  {badge ? (
                    <span className="min-w-[20px] rounded-full bg-error px-2 py-0.5 text-center text-[10px] font-bold text-on-error">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  ) : null}
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
