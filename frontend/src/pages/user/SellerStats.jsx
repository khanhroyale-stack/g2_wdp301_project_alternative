import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  ShoppingBag,
  Receipt,
  Clock,
  Store,
  Handshake,
  BarChart3,
  Table2,
} from "lucide-react";
import EcoTradeLayout from "../../components/ecotrade/EcoTradeLayout";
import sellerService from "../../services/seller.service";

// Màu series đã qua validator dataviz (CVD ΔE 13.9): bán = xanh brand, thuê = terracotta
const COLOR_SALES = "#3E7D56";
const COLOR_RENTAL = "#E8946F";

const formatVND = (num) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num || 0);

// Định dạng gọn cho trục biểu đồ: 1.200.000 -> "1,2tr"
const formatCompact = (num) => {
  const n = Number(num) || 0;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(".0", "")} tỷ`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".0", "")}tr`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}N`;
  return String(n);
};

const StatTile = ({ icon: Icon, label, value, hint, accent }) => (
  <div className="flex flex-col gap-3 rounded-organic border border-primary/5 bg-white p-5 shadow-apple">
    <div className="flex items-center justify-between">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-on-surface-variant/50">{label}</p>
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: `${accent}1A`, color: accent }}
      >
        <Icon size={18} />
      </span>
    </div>
    <p className="text-2xl font-display font-black leading-none text-foreground">{value}</p>
    {hint ? <p className="text-xs font-medium text-on-surface-variant/60">{hint}</p> : null}
  </div>
);

const RevenueChart = ({ monthly }) => {
  const maxTotal = useMemo(
    () => Math.max(1, ...monthly.map((m) => m.total)),
    [monthly]
  );
  // Mốc lưới ~ 4 đường
  const gridLines = useMemo(() => {
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, i) => (maxTotal / steps) * i).reverse();
  }, [maxTotal]);

  return (
    <div className="flex flex-col gap-5">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-5">
        <span className="flex items-center gap-2 text-xs font-bold text-on-surface-variant">
          <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: COLOR_SALES }} />
          Bán hàng
        </span>
        <span className="flex items-center gap-2 text-xs font-bold text-on-surface-variant">
          <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: COLOR_RENTAL }} />
          Cho thuê
        </span>
      </div>

      <div className="flex gap-3">
        {/* Trục Y (nhãn giá trị – thoả yêu cầu nhãn hiển thị) */}
        <div className="flex w-12 shrink-0 flex-col justify-between py-1 text-right text-[10px] font-bold text-on-surface-variant/40" style={{ height: 240 }}>
          {gridLines.map((v, i) => (
            <span key={i}>{formatCompact(v)}</span>
          ))}
        </div>

        {/* Vùng vẽ cột */}
        <div className="relative flex-1">
          {/* Đường lưới ngang */}
          <div className="absolute inset-0 flex flex-col justify-between" style={{ height: 240 }}>
            {gridLines.map((_, i) => (
              <div key={i} className="h-px w-full bg-primary/5" />
            ))}
          </div>

          {/* Các cột chồng */}
          <div className="relative flex items-end justify-between gap-1.5" style={{ height: 240 }}>
            {monthly.map((m) => {
              const salesH = (m.sales / maxTotal) * 240;
              const rentalH = (m.rental / maxTotal) * 240;
              return (
                <div key={m.key} className="group relative flex h-full flex-1 flex-col justify-end">
                  {/* Tooltip hover */}
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-xl border border-primary/10 bg-white px-3 py-2 text-left shadow-apple-md group-hover:block">
                    <p className="mb-1 text-[10px] font-black uppercase tracking-wide text-on-surface-variant/50">
                      {m.label}/{m.year}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: COLOR_SALES }} />
                      Bán: {formatVND(m.sales)}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: COLOR_RENTAL }} />
                      Thuê: {formatVND(m.rental)}
                    </p>
                    <p className="mt-1 border-t border-primary/5 pt-1 text-xs font-black text-primary">
                      Tổng: {formatVND(m.total)}
                    </p>
                  </div>

                  {/* Cột: thuê chồng trên bán, chừa khe 2px */}
                  <div className="flex w-full flex-col items-stretch transition-opacity group-hover:opacity-90">
                    {rentalH > 0 ? (
                      <div
                        className="w-full rounded-t-md"
                        style={{ height: Math.max(rentalH, 3), backgroundColor: COLOR_RENTAL, marginBottom: salesH > 0 ? 2 : 0 }}
                      />
                    ) : null}
                    {salesH > 0 ? (
                      <div
                        className="w-full"
                        style={{ height: Math.max(salesH, 3), backgroundColor: COLOR_SALES, borderRadius: rentalH > 0 ? "0 0 6px 6px" : "6px" }}
                      />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Nhãn tháng */}
          <div className="mt-2 flex justify-between gap-1.5">
            {monthly.map((m) => (
              <span key={m.key} className="flex-1 text-center text-[10px] font-bold text-on-surface-variant/50">
                {m.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const SellerStats = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await sellerService.getStats();
        if (res.success) setData(res.data);
        else setError(res.message || "Không thể tải thống kê");
      } catch (err) {
        setError(err.response?.data?.message || "Không thể tải thống kê doanh số");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const summary = data?.summary;
  const monthly = data?.monthly || [];
  const hasRevenue = summary && (summary.totalRevenue > 0 || summary.pendingRevenue > 0);

  return (
    <EcoTradeLayout>
      <div className="flex w-full flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-organic bg-primary/10 text-primary">
              <BarChart3 size={22} />
            </span>
            <div>
              <h1 className="text-2xl font-display font-black text-foreground">Thống kê bán hàng</h1>
              <p className="text-sm font-medium text-on-surface-variant/70">
                Tổng quan doanh thu từ bán và cho thuê của bạn
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-organic border border-primary/5 bg-white shadow-apple">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span>
          </div>
        ) : error ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-organic border border-danger/10 bg-white shadow-apple">
            <span className="material-symbols-outlined text-5xl text-danger/40">error</span>
            <p className="font-bold text-danger">{error}</p>
          </div>
        ) : (
          <>
            {/* Thẻ tổng quan */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile
                icon={TrendingUp}
                label="Tổng doanh thu"
                value={formatVND(summary.totalRevenue)}
                hint={`${summary.totalCount} giao dịch hoàn tất`}
                accent={COLOR_SALES}
              />
              <StatTile
                icon={ShoppingBag}
                label="Giao dịch hoàn tất"
                value={summary.totalCount}
                hint={`${summary.salesCount} đơn bán · ${summary.rentalCount} lượt thuê`}
                accent="#2A5A3B"
              />
              <StatTile
                icon={Receipt}
                label="Giá trị trung bình"
                value={formatVND(summary.avgOrderValue)}
                hint="Mỗi giao dịch"
                accent="#3B6BA5"
              />
              <StatTile
                icon={Clock}
                label="Đang xử lý"
                value={formatVND(summary.pendingRevenue)}
                hint={`${summary.pendingCount} đơn chưa hoàn tất`}
                accent={COLOR_RENTAL}
              />
            </div>

            {/* Tách bán / thuê */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-4 rounded-organic border border-primary/5 bg-white p-5 shadow-apple">
                <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: `${COLOR_SALES}1A`, color: COLOR_SALES }}>
                  <Store size={22} />
                </span>
                <div className="flex-1">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-on-surface-variant/50">Doanh thu bán hàng</p>
                  <p className="text-xl font-display font-black text-foreground">{formatVND(summary.salesRevenue)}</p>
                  <p className="text-xs font-medium text-on-surface-variant/60">{summary.salesCount} đơn đã bán</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-organic border border-primary/5 bg-white p-5 shadow-apple">
                <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: `${COLOR_RENTAL}1A`, color: COLOR_RENTAL }}>
                  <Handshake size={22} />
                </span>
                <div className="flex-1">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-on-surface-variant/50">Doanh thu cho thuê</p>
                  <p className="text-xl font-display font-black text-foreground">{formatVND(summary.rentalRevenue)}</p>
                  <p className="text-xs font-medium text-on-surface-variant/60">{summary.rentalCount} lượt cho thuê</p>
                </div>
              </div>
            </div>

            {/* Biểu đồ */}
            <div className="rounded-organic border border-primary/5 bg-white p-6 shadow-apple">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-display font-black text-foreground">Doanh thu 12 tháng gần nhất</h2>
                  <p className="text-xs font-medium text-on-surface-variant/60">Theo ngày tạo đơn</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTable((v) => !v)}
                  className="flex items-center gap-1.5 rounded-full border border-primary/10 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
                >
                  <Table2 size={14} />
                  {showTable ? "Xem biểu đồ" : "Xem dạng bảng"}
                </button>
              </div>

              {!hasRevenue ? (
                <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-primary/10 bg-background">
                  <BarChart3 className="text-primary/20" size={48} />
                  <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant/50">
                    Chưa có doanh thu để hiển thị
                  </p>
                </div>
              ) : showTable ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-primary/10 text-left text-[11px] font-black uppercase tracking-wide text-on-surface-variant/50">
                        <th className="py-2 pr-4">Tháng</th>
                        <th className="py-2 pr-4 text-right">Bán hàng</th>
                        <th className="py-2 pr-4 text-right">Cho thuê</th>
                        <th className="py-2 text-right">Tổng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthly.map((m) => (
                        <tr key={m.key} className="border-b border-primary/5">
                          <td className="py-2 pr-4 font-bold text-foreground">{m.label}/{m.year}</td>
                          <td className="py-2 pr-4 text-right text-on-surface-variant">{formatVND(m.sales)}</td>
                          <td className="py-2 pr-4 text-right text-on-surface-variant">{formatVND(m.rental)}</td>
                          <td className="py-2 text-right font-bold text-primary">{formatVND(m.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <RevenueChart monthly={monthly} />
              )}
            </div>
          </>
        )}
      </div>
    </EcoTradeLayout>
  );
};

export default SellerStats;
