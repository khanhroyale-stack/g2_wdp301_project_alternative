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
      <div className={`animate-pulse rounded-2xl border border-surface-variant/40 bg-surface-container-lowest p-5 ${className}`}>
        <div className="h-4 w-40 rounded bg-surface-container-high" />
        <div className="mt-3 h-2.5 w-full rounded bg-surface-container-high" />
      </div>
    );
  }

  if (!data) return null;

  const { isPro, proExpiresAt, freePostLimit, activePosts, remainingPosts } = data;

  if (isPro) {
    const left = proExpiresAt ? daysLeft(proExpiresAt) : null;
    return (
      <div
        className={`rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/40 p-5 ${className}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/20 text-amber-600">
              <Crown size={22} />
            </span>
            <div>
              <p className="flex items-center gap-1.5 text-sm font-bold text-amber-700">
                Tài khoản Pro
                <Sparkles size={14} />
              </p>
              <p className="text-xs text-amber-700/80">
                {proExpiresAt
                  ? `Hết hạn ${formatDate(proExpiresAt)}${left != null ? ` · còn ${left} ngày` : ""}`
                  : "Đang hoạt động"}
              </p>
            </div>
          </div>
          {!compact && (
            <Link
              to="/goi-pro"
              className="shrink-0 rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
            >
              Gia hạn
            </Link>
          )}
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/60 px-3 py-2.5 text-sm font-medium text-amber-800">
          <InfinityIcon size={16} />
          Đăng bài không giới hạn
          {typeof activePosts === "number" && (
            <span className="ml-auto text-xs font-normal text-amber-700/70">
              Đang có {activePosts} bài
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
    <div className={`rounded-2xl border border-surface-variant/40 bg-surface-container-lowest p-5 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant">
            <FileText size={20} />
          </span>
          <div>
            <p className="text-sm font-bold text-on-surface">Tài khoản thường</p>
            <p className="text-xs text-on-surface-variant">
              {atLimit
                ? "Bạn đã dùng hết lượt đăng bài miễn phí"
                : `Còn ${remaining}/${limit} lượt đăng bài đang hoạt động`}
            </p>
          </div>
        </div>
        <Link
          to="/goi-pro"
          className="flex shrink-0 items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary transition hover:opacity-90"
        >
          <Crown size={13} />
          Nâng cấp Pro
        </Link>
      </div>
      <div className="mt-4">
        <div className="mb-1.5 flex justify-between text-xs font-medium text-on-surface-variant">
          <span>Bài đăng đang hoạt động</span>
          <span className={atLimit ? "text-error" : ""}>
            {used}/{limit}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
          <div
            className={`h-full rounded-full transition-all ${atLimit ? "bg-error" : "bg-primary"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
