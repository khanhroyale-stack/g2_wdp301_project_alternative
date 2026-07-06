import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sparkles, X } from "lucide-react";
import { authService } from "../services/auth.service";

export default function FeaturedReminderBanner() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed || location.pathname === "/goi-pro/chon-san-pham-noi-bat") {
      setVisible(false);
      return;
    }

    authService
      .checkFeaturedReminder()
      .then((res) => {
        setVisible(!!res?.data?.shouldShowReminder);
      })
      .catch(() => setVisible(false));
  }, [dismissed, location.pathname]);

  if (!visible) return null;

  return (
    <div className="mb-5 rounded-[8px] border border-[#baf0cd] bg-[#f0fff5] px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#34d37b] text-[#07361f]">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-extrabold text-[#174b2f]">Bạn chưa chọn sản phẩm nổi bật</p>
            <p className="mt-1 text-sm font-medium text-[#648174]">Chọn tối đa 3 sản phẩm để ưu tiên hiển thị trong mục sản phẩm nổi bật.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/goi-pro/chon-san-pham-noi-bat" className="inline-flex h-9 items-center rounded-[6px] bg-[#34d37b] px-4 text-sm font-extrabold text-[#07361f] hover:bg-[#2fc271]">
            Chọn ngay
          </Link>
          <button type="button" onClick={() => setDismissed(true)} className="flex h-9 w-9 items-center justify-center rounded-[6px] text-[#648174] hover:bg-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
