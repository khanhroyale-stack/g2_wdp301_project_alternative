import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import adminService from "../../services/admin.service";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminService.getStats();
        if (res.success) {
          setStats(res.data);
        }
      } catch (error) {
        console.error("Lỗi lấy thống kê:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#F5F5F7]">
        <Sidebar variant="admin" />
        <main className="flex-1 md:ml-64 px-4 md:px-10 py-10 flex items-center justify-center">
          <div className="text-on-surface-variant flex flex-col items-center gap-3">
             <span className="material-symbols-outlined text-4xl animate-spin">refresh</span>
             <p>Đang tải dữ liệu thống kê...</p>
          </div>
        </main>
      </div>
    );
  }

  const STATS_CARDS = [
    { icon: "group", bg: "bg-secondary-container text-on-secondary-container", label: "Tổng người dùng", value: stats?.users?.total || 0, badge: "Thành viên", badgeColor: "text-primary bg-primary-fixed-dim/20" },
    { icon: "pending_actions", bg: "bg-error-container text-on-error-container", label: "Tài khoản chờ duyệt", value: stats?.users?.pending || 0, badge: "Cần xử lý", badgeColor: "text-error bg-error/10" },
    { icon: "inventory_2", bg: "bg-surface-container-high text-on-surface", label: "Sản phẩm", value: stats?.products?.total || 0, badge: "Đã đăng", badgeColor: "text-primary bg-primary-fixed-dim/20" },
    { icon: "check_circle", bg: "bg-secondary-container text-on-secondary-container", label: "Đơn hàng hoàn tất", value: stats?.orders?.completed || 0, badge: "Đơn mua bán", badgeColor: "text-primary bg-primary-fixed-dim/20" },
    { icon: "handshake", bg: "bg-surface-container-high text-on-surface", label: "Hợp đồng thuê", value: stats?.rentals?.active || 0, badge: "Đang thuê", badgeColor: "text-on-surface-variant bg-surface-container-high" },
    { icon: "report", bg: "bg-error-container text-on-error-container", label: "Báo cáo vi phạm", value: stats?.reports?.pending || 0, badge: "Chờ xử lý", badgeColor: "text-error bg-error/10" },
  ];

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <Sidebar variant="admin" />
      <main className="flex-1 md:ml-64 px-4 md:px-10 py-10">
        <header className="flex justify-between items-end pb-8 border-b border-surface-variant/50 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-on-surface mb-1">Trang quản trị</h2>
            <p className="text-on-surface-variant">Tổng quan số liệu thực tế từ hệ thống.</p>
          </div>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {STATS_CARDS.map((s) => (
            <div key={s.label} className="bg-surface-container-lowest rounded-2xl p-6 shadow-apple border border-surface-variant/30 flex flex-col gap-4 hover-scale transition-transform">
              <div className="flex justify-between items-start">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.bg}`}>
                  <span className="material-symbols-outlined text-[24px]">{s.icon}</span>
                </div>
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${s.badgeColor}`}>{s.badge}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-on-surface-variant mb-1">{s.label}</p>
                <p className="text-3xl font-bold text-on-surface">{s.value}</p>
              </div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detailed Stats */}
          <section className="lg:col-span-2 bg-surface-container-lowest rounded-2xl p-6 shadow-apple border border-surface-variant/30">
            <h3 className="font-bold text-on-surface text-lg mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">bar_chart</span>
              Chi tiết hoạt động
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
               <div className="flex flex-col gap-1">
                 <p className="text-sm text-on-surface-variant">Tài khoản bị khóa</p>
                 <p className="text-xl font-bold text-error">{stats?.users?.banned || 0}</p>
               </div>
               <div className="flex flex-col gap-1">
                 <p className="text-sm text-on-surface-variant">Bài đăng chờ duyệt</p>
                 <p className="text-xl font-bold text-primary">{stats?.products?.pending || 0}</p>
               </div>
               <div className="flex flex-col gap-1">
                 <p className="text-sm text-on-surface-variant">Tổng số Shipper</p>
                 <p className="text-xl font-bold text-secondary">{stats?.shippers?.total || 0}</p>
               </div>
               <div className="flex flex-col gap-1">
                 <p className="text-sm text-on-surface-variant">Báo cáo đã xử lý</p>
                 <p className="text-xl font-bold text-success">{stats?.reports?.resolved || 0}</p>
               </div>
            </div>

            <div className="mt-8 flex gap-4">
              <Link to="/admin/nguoi-dung" className="px-5 py-2.5 bg-surface-container-low text-on-surface rounded-xl text-sm font-semibold hover:bg-surface-container transition-colors">
                Quản lý người dùng
              </Link>
              <Link to="/admin/duyet-bai-dang" className="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 transition-colors shadow-sm">
                Duyệt bài đăng
              </Link>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="lg:col-span-1 bg-surface-container-lowest rounded-2xl p-6 shadow-apple border border-surface-variant/30 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-on-surface text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">flash_on</span>
                Truy cập nhanh
              </h3>
            </div>
            <div className="flex flex-col gap-3 flex-1">
              <Link to="/admin/duyet-tai-khoan" className="p-4 border border-surface-variant/50 rounded-xl flex items-center justify-between hover:border-primary/40 hover:bg-primary/5 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-xl">fact_check</span>
                  </div>
                  <span className="font-semibold text-on-surface text-sm">Duyệt KYC</span>
                </div>
                {stats?.users?.pending > 0 && (
                  <span className="bg-error text-white text-xs font-bold px-2 py-1 rounded-full">{stats.users.pending}</span>
                )}
              </Link>
              
              <Link to="/admin/don-hang" className="p-4 border border-surface-variant/50 rounded-xl flex items-center justify-between hover:border-primary/40 hover:bg-primary/5 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-xl">local_mall</span>
                  </div>
                  <span className="font-semibold text-on-surface text-sm">Quản lý Đơn hàng</span>
                </div>
              </Link>

              <Link to="/admin/hop-dong" className="p-4 border border-surface-variant/50 rounded-xl flex items-center justify-between hover:border-primary/40 hover:bg-primary/5 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary group-hover:bg-tertiary group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-xl">description</span>
                  </div>
                  <span className="font-semibold text-on-surface text-sm">Hợp đồng thuê</span>
                </div>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
