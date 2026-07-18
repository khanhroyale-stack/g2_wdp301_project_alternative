import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Sidebar from "../../components/Sidebar";
import adminService from "../../services/admin.service";

const PLAN_LABELS = {
  "1m": "1 tháng",
  "3m": "3 tháng",
  "12m": "12 tháng",
};

const STATUS_META = {
  pending: { label: "Chờ thanh toán", className: "bg-orange-50 text-orange-700 border-orange-200" },
  paid: { label: "Thành công", className: "bg-green-50 text-green-700 border-green-200" },
  failed: { label: "Thất bại", className: "bg-red-50 text-red-700 border-red-200" },
  cancelled: { label: "Đã hủy", className: "bg-surface-container text-on-surface-variant border-surface-variant" },
};

const DEFAULT_FILTERS = {
  status: "",
  plan: "",
  startDate: "",
  endDate: "",
  page: 1,
  limit: 20,
};

const currency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value || 0);

const shortCurrency = (value) => {
  const amount = Number(value) || 0;
  if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)} tỷ`;
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)} triệu`;
  if (amount >= 1000) return `${Math.round(amount / 1000)}K`;
  return `${amount}đ`;
};

const RevenueReport = () => {
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [statsLoading, setStatsLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);

  const statsParams = useMemo(() => {
    const params = {};
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    return params;
  }, [filters.startDate, filters.endDate]);

  const transactionParams = useMemo(() => {
    const params = {
      page: filters.page,
      limit: filters.limit,
    };
    if (filters.status) params.status = filters.status;
    if (filters.plan) params.plan = filters.plan;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    return params;
  }, [filters]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await adminService.getRevenueStats(statsParams);
      if (res.success) setStats(res.data);
    } catch {
      toast.error("Không thể tải thống kê doanh thu");
    } finally {
      setStatsLoading(false);
    }
  }, [statsParams]);

  const fetchTransactions = useCallback(async () => {
    setTableLoading(true);
    try {
      const res = await adminService.getRevenueTransactions(transactionParams);
      if (res.success) {
        setTransactions(res.data.transactions || []);
        setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
      }
    } catch {
      toast.error("Không thể tải danh sách giao dịch");
    } finally {
      setTableLoading(false);
    }
  }, [transactionParams]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const bestPlan = stats?.revenueByPlan?.[0];
  const maxPlanRevenue = Math.max(...(stats?.revenueByPlan || []).map((item) => item.revenue), 1);
  const maxMonthlyRevenue = Math.max(...(stats?.monthlyRevenue || []).map((item) => item.revenue), 1);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  };

  const goToPage = (page) => {
    setFilters((current) => ({
      ...current,
      page: Math.min(Math.max(page, 1), pagination.pages || 1),
    }));
  };

  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  const renderMonth = (item) => `T${item._id.month}/${item._id.year}`;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar variant="admin" />
      <main className="flex-1 px-4 py-10 md:ml-72 md:px-10">
        <header className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-primary/50">Admin Dashboard</p>
            <h1 className="font-display text-3xl font-black tracking-tight text-foreground">Báo cáo doanh thu Pro</h1>
            <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
              Theo dõi doanh thu từ gói Pro, trạng thái thanh toán VNPay và hiệu quả từng gói đăng ký.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-primary/5 bg-white p-3 shadow-sm">
            <label className="grid gap-1 text-xs font-bold text-on-surface-variant">
              Từ ngày
              <input
                type="date"
                value={filters.startDate}
                onChange={(event) => updateFilter("startDate", event.target.value)}
                className="rounded-xl border border-surface-variant bg-surface-container-lowest px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </label>
            <label className="grid gap-1 text-xs font-bold text-on-surface-variant">
              Đến ngày
              <input
                type="date"
                value={filters.endDate}
                onChange={(event) => updateFilter("endDate", event.target.value)}
                className="rounded-xl border border-surface-variant bg-surface-container-lowest px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </label>
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-primary/10 px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary/5"
            >
              Xóa lọc
            </button>
          </div>
        </header>

        <section className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            { icon: "payments", label: "Tổng doanh thu", value: currency(stats?.totalRevenue), helper: "Giao dịch paid" },
            { icon: "receipt_long", label: "Giao dịch thành công", value: stats?.totalTransactions?.toLocaleString("vi-VN") || "0", helper: "Gói Pro đã kích hoạt" },
            { icon: "workspace_premium", label: "Gói bán tốt", value: bestPlan ? PLAN_LABELS[bestPlan._id] : "Chưa có", helper: bestPlan ? `${bestPlan.count} lượt mua` : "Chưa phát sinh" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-primary/5 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5 text-primary">
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                {statsLoading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" /> : null}
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant/50">{item.label}</p>
              <p className="mt-2 font-display text-3xl font-black text-foreground">{item.value}</p>
              <p className="mt-1 text-sm text-on-surface-variant">{item.helper}</p>
            </div>
          ))}
        </section>

        <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-5">
          <section className="rounded-2xl border border-primary/5 bg-white p-6 shadow-sm xl:col-span-2">
            <h2 className="mb-5 flex items-center gap-2 font-display text-xl font-black text-foreground">
              <span className="material-symbols-outlined text-primary">bar_chart</span>
              Doanh thu theo gói
            </h2>
            <div className="space-y-4">
              {(stats?.revenueByPlan || []).length === 0 ? (
                <p className="rounded-xl bg-surface-container-low p-5 text-sm text-on-surface-variant">Chưa có giao dịch Pro thành công.</p>
              ) : (
                stats.revenueByPlan.map((item) => (
                  <div key={item._id}>
                    <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                      <span className="font-bold text-foreground">{PLAN_LABELS[item._id] || item._id}</span>
                      <span className="font-black text-primary">{currency(item.revenue)}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-surface-container">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max((item.revenue / maxPlanRevenue) * 100, 4)}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-on-surface-variant">{item.count} giao dịch</p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-primary/5 bg-white p-6 shadow-sm xl:col-span-3">
            <h2 className="mb-5 flex items-center gap-2 font-display text-xl font-black text-foreground">
              <span className="material-symbols-outlined text-primary">monitoring</span>
              Xu hướng doanh thu
            </h2>
            <div className="flex h-64 items-end gap-3 overflow-x-auto border-b border-surface-variant pb-4">
              {(stats?.monthlyRevenue || []).length === 0 ? (
                <div className="flex h-full w-full items-center justify-center rounded-xl bg-surface-container-low text-sm text-on-surface-variant">
                  Chưa có dữ liệu trong khoảng thời gian này.
                </div>
              ) : (
                stats.monthlyRevenue.map((item) => (
                  <div key={`${item._id.year}-${item._id.month}`} className="flex min-w-[72px] flex-1 flex-col items-center justify-end gap-2">
                    <span className="text-xs font-black text-primary">{shortCurrency(item.revenue)}</span>
                    <div className="w-full rounded-t-xl bg-primary/80" style={{ height: `${Math.max((item.revenue / maxMonthlyRevenue) * 180, 12)}px` }} />
                    <span className="text-xs font-bold text-on-surface-variant">{renderMonth(item)}</span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="overflow-hidden rounded-2xl border border-primary/5 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-primary/5 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-display text-xl font-black text-foreground">Danh sách giao dịch</h2>
              <p className="text-sm text-on-surface-variant">Tổng {pagination.total.toLocaleString("vi-VN")} giao dịch</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={filters.status}
                onChange={(event) => updateFilter("status", event.target.value)}
                className="rounded-xl border border-surface-variant bg-surface-container-lowest px-3 py-2 text-sm font-bold text-foreground outline-none focus:border-primary"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="paid">Thành công</option>
                <option value="pending">Chờ thanh toán</option>
                <option value="failed">Thất bại</option>
                <option value="cancelled">Đã hủy</option>
              </select>
              <select
                value={filters.plan}
                onChange={(event) => updateFilter("plan", event.target.value)}
                className="rounded-xl border border-surface-variant bg-surface-container-lowest px-3 py-2 text-sm font-bold text-foreground outline-none focus:border-primary"
              >
                <option value="">Tất cả gói</option>
                <option value="1m">1 tháng</option>
                <option value="3m">3 tháng</option>
                <option value="12m">12 tháng</option>
              </select>
            </div>
          </div>

          {tableLoading ? (
            <div className="flex justify-center p-12">
              <span className="material-symbols-outlined animate-spin text-3xl text-primary">refresh</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-on-surface-variant">
              <span className="material-symbols-outlined mb-2 block text-4xl opacity-40">receipt_long</span>
              Không có giao dịch phù hợp.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left">
                <thead className="bg-surface-container-low text-xs font-black uppercase tracking-widest text-on-surface-variant">
                  <tr>
                    {["Mã giao dịch", "Người dùng", "Gói", "Số tiền", "Trạng thái", "Ngày tạo", "Ngày kích hoạt"].map((heading) => (
                      <th key={heading} className="px-5 py-4">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant/40">
                  {transactions.map((item) => {
                    const status = STATUS_META[item.status] || STATUS_META.pending;
                    return (
                      <tr key={item._id} className="transition hover:bg-surface-container-low/60">
                        <td className="px-5 py-4">
                          <p className="text-sm font-black text-foreground">{item.vnpTransactionNo || item.vnpTxnRef}</p>
                          <p className="text-xs text-on-surface-variant">{item._id.slice(-8).toUpperCase()}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-foreground">{item.userId?.fullName || "Người dùng đã xóa"}</p>
                          <p className="text-xs text-on-surface-variant">{item.userId?.email || "Không có email"}</p>
                        </td>
                        <td className="px-5 py-4 text-sm font-bold text-foreground">{PLAN_LABELS[item.plan] || item.plan}</td>
                        <td className="px-5 py-4 text-sm font-black text-primary">{currency(item.amount)}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-on-surface-variant">{new Date(item.createdAt).toLocaleDateString("vi-VN")}</td>
                        <td className="px-5 py-4 text-sm text-on-surface-variant">
                          {item.startsAt ? new Date(item.startsAt).toLocaleDateString("vi-VN") : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold text-on-surface-variant">
              Trang {pagination.page}/{pagination.pages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1 || tableLoading}
                onClick={() => goToPage(pagination.page - 1)}
                className="rounded-xl border border-primary/10 px-4 py-2 text-sm font-black text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.pages || tableLoading}
                onClick={() => goToPage(pagination.page + 1)}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default RevenueReport;
