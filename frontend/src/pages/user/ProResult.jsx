import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProResult() {
  const [params] = useSearchParams();
  const status = params.get("status");
  const { refreshUser } = useAuth();
  const [refreshed, setRefreshed] = useState(false);

  useEffect(() => {
    if (status === "success" && typeof refreshUser === "function" && !refreshed) {
      refreshUser().finally(() => setRefreshed(true));
    }
  }, [status, refreshUser, refreshed]);

  const success = status === "success";
  return (
    <div className="max-w-md mx-auto p-8 text-center">
      <h1 className={`text-2xl font-bold mb-3 ${success ? "text-green-600" : "text-red-600"}`}>
        {success ? "Thanh toán thành công" : "Thanh toán thất bại"}
      </h1>
      <p className="text-on-surface-variant mb-6">
        {success
          ? "Tài khoản của bạn đã được nâng cấp Pro."
          : "Giao dịch chưa hoàn tất. Bạn có thể thử lại."}
      </p>
      <div className="flex gap-3 justify-center">
        <Link to="/goi-pro" className="rounded-lg border px-4 py-2">Xem gói</Link>
        <Link to="/" className="rounded-lg bg-primary text-white px-4 py-2">Về trang chủ</Link>
      </div>
    </div>
  );
}
