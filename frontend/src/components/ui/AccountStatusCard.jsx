import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Crown, FileText, Infinity as InfinityIcon, Sparkles } from "lucide-react";
import subscriptionService from "../../services/subscription.service";

const formatDate = (d) => new Date(d).toLocaleDateString("vi-VN");

const daysLeft = (d) => {
  const ms = new Date(d).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
};

/**
 * Thẻ trạng thái tài khoản: hiển thị gói hiện tại (Free/Pro) và hạn mức đăng bài.
 * - `compact`: bản gọn (banner) dùng trong trang Đăng tin.
 * - Tự gọi API `/subscriptions/status`; có thể truyền sẵn `data` để bỏ qua fetch.
 */
export default function AccountStatusCard({ compact = false, data: dataProp = null, className = "" }) {
  const [data, setData] = useState(dataProp);
  const [loading, setLoading] = useState(!dataProp);

  useEffect(() => {
    if (dataProp) return;
    let alive = true;
    subscriptionService
      .getStatus()
      .then((res) => alive && setData(res.data))
      .catch(() => alive && setData(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [dataProp]);

  if (loading) {
    return (
      <div className={`animate-pulse rounded-organic border border-primary/5 bg-white p-6 ${className}`}>
        <div className="h-5 w-48 rounded-full bg-primary/5 mb-4" />
        <div className="h-3 w-full rounded-full bg-primary/5" />
      </div>
    );
  }

  if (!data) return null;

  const { isPro, proExpiresAt, freePostLimit, activePosts, remainingPosts } = data;

  if (isPro) {
    const left = proExpiresAt ? daysLeft(proExpiresAt) : null;
    return (
      <div
        className={`relative overflow-hidden rounded-organic border border-amber-200/50 bg-gradient-to-br from-amber-50 to-amber-100/30 p-6 shadow-apple-md ${className}`}
      >
        {/* Decorative Blob */}
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-400/10 blur-2xl"></div>
        
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-white shadow-lg shadow-amber-400/20">
              <Crown size={28} />
            </div>
            <div>
              <p className="flex items-center gap-2 font-display text-lg font-black text-amber-900">
                Thành viên Pro
                <Sparkles size={16} className="text-amber-500 animate-pulse" />
              </p>
              <p className="text-xs font-bold text-amber-700/60 uppercase tracking-widest">
                {proExpiresAt
                  ? `Hết hạn ${formatDate(proExpiresAt)}${left != null ? ` · còn ${left} ngày` : ""}`
                  : "Đang hoạt động"}
              </p>
            </div>
          </div>
          {!compact && (
            <Link
              to="/goi-pro"
              className="shrink-0 rounded-pill bg-white px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-amber-700 shadow-sm border border-amber-200 transition-all hover:bg-amber-50 hover:scale-105 active:scale-95"
            >
              Gia hạn
            </Link>
          )}
        </div>
        <div className="relative z-10 mt-6 flex items-center gap-3 rounded-2xl bg-white/60 p-4 text-sm font-bold text-amber-900 backdrop-blur-sm border border-white/40">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-white">
            <InfinityIcon size={14} />
          </div>
          Đăng bài không giới hạn
          {typeof activePosts === "number" && (
            <span className="ml-auto text-xs font-black text-amber-700/40 uppercase tracking-widest">
              {activePosts} bài đang đăng
            </span>
          )}
        </div>
      </div>
    );
  }

  // Free account
  const limit = freePostLimit || 0;
  const used = Math.min(activePosts ?? 0, limit);
  const remaining = remainingPosts ?? Math.max(0, limit - used);
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const atLimit = remaining <= 0;

  return (
    <div className={`rounded-organic border border-primary/5 bg-white p-6 shadow-apple-md ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/5 text-primary">
            <FileText size={24} />
          </div>
          <div>
            <p className="font-display text-lg font-black text-foreground">Tài khoản thường</p>
            <p className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest">
              {atLimit
                ? "Đã hết lượt đăng bài miễn phí"
                : `Còn ${remaining}/${limit} lượt đăng bài`}
            </p>
          </div>
        </div>
        <Link
          to="/goi-pro"
          className="flex shrink-0 items-center gap-2 rounded-pill bg-primary px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:bg-primary/90 active:scale-95"
        >
          <Crown size={14} />
          Nâng cấp Pro
        </Link>
      </div>
      <div className="mt-8">
        <div className="mb-3 flex justify-between text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">
          <span>Bài đăng đang hoạt động</span>
          <span className={atLimit ? "text-error" : "text-primary"}>
            {used} / {limit}
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-primary/5 border border-primary/5 p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${atLimit ? "bg-error" : "bg-primary shadow-[0_0_10px_rgba(42,90,59,0.3)]"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
