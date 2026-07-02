import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  Crown,
  Infinity as InfinityIcon,
  TrendingUp,
  BadgeCheck,
  FilePlus2,
  Home,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const UNLOCKED = [
  { icon: InfinityIcon, text: "Đăng bài không giới hạn" },
  { icon: TrendingUp, text: "Ưu tiên hiển thị trên Chợ" },
  { icon: BadgeCheck, text: "Huy hiệu Pro cạnh tên" },
];

export default function ProResult() {
  const [params] = useSearchParams();
  const status = params.get("status");
  const { user, refreshUser } = useAuth();
  const [refreshed, setRefreshed] = useState(false);

  const success = status === "success";

  useEffect(() => {
    if (success && typeof refreshUser === "function" && !refreshed) {
      refreshUser().finally(() => setRefreshed(true));
    }
  }, [success, refreshUser, refreshed]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-surface-variant/40 bg-surface-container-lowest p-8 text-center shadow-card">
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
            success ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
          }`}
        >
          {success ? <CheckCircle2 size={44} /> : <XCircle size={44} />}
        </div>

        <h1 className={`mt-5 text-2xl font-black ${success ? "text-success" : "text-danger"}`}>
          {success ? "Thanh toán thành công" : "Thanh toán thất bại"}
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          {success
            ? "Chúc mừng! Tài khoản của bạn đã được nâng cấp Pro."
            : "Giao dịch chưa hoàn tất. Bạn có thể thử lại hoặc chọn gói khác."}
        </p>

        {success && (
          <>
            <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
              <Crown size={16} />
              {refreshed && user?.proExpiresAt
                ? `Pro có hiệu lực đến ${new Date(user.proExpiresAt).toLocaleDateString("vi-VN")}`
                : "Tài khoản Pro đã được kích hoạt"}
            </div>

            <div className="mt-5 rounded-xl border border-surface-variant/40 p-4 text-left">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Bạn vừa mở khóa
              </p>
              <ul className="flex flex-col gap-2.5">
                {UNLOCKED.map((item) => (
                  <li key={item.text} className="flex items-center gap-2.5 text-sm text-on-surface">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <item.icon size={16} />
                    </span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {success ? (
            <Link
              to="/dang-tin"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition hover:opacity-90"
            >
              <FilePlus2 size={16} />
              Đăng bài ngay
            </Link>
          ) : (
            <Link
              to="/goi-pro"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition hover:opacity-90"
            >
              <RotateCcw size={16} />
              Thử lại
            </Link>
          )}
          <Link
            to="/"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-surface-variant px-4 py-2.5 text-sm font-medium text-on-surface transition hover:bg-surface-container-low"
          >
            <Home size={16} />
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
