import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import subscriptionService from "../../services/subscription.service";
import { useAuth } from "../../context/AuthContext";

const PLAN_LABELS = { "1m": "1 tháng", "3m": "3 tháng", "12m": "12 tháng" };
const formatVnd = (n) => n.toLocaleString("vi-VN") + "đ";

export default function ProPlans() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loadingPlan, setLoadingPlan] = useState(null);

  useEffect(() => {
    subscriptionService
      .getPlans()
      .then((res) => setPlans(res.data))
      .catch(() => toast.error("Không tải được danh sách gói"));
  }, []);

  const handleBuy = async (plan) => {
    try {
      setLoadingPlan(plan);
      const res = await subscriptionService.createPayment(plan);
      window.location.href = res.data.paymentUrl;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không tạo được thanh toán");
      setLoadingPlan(null);
    }
  };

  const isPro = user?.isPro;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Nâng cấp tài khoản Pro</h1>
      <p className="text-on-surface-variant mb-6">
        Đăng bài không giới hạn, ưu tiên hiển thị và huy hiệu Pro.
      </p>
      {isPro && (
        <div className="mb-6 rounded-lg bg-primary/10 p-4 text-sm">
          Bạn đang là Pro, hết hạn ngày{" "}
          {new Date(user.proExpiresAt).toLocaleDateString("vi-VN")}. Mua thêm để gia hạn.
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map((p) => (
          <div key={p.plan} className="rounded-xl border p-5 flex flex-col">
            <div className="text-lg font-semibold">{PLAN_LABELS[p.plan] || p.plan}</div>
            <div className="text-2xl font-bold my-2">{formatVnd(p.amount)}</div>
            <div className="text-sm text-on-surface-variant mb-4">{p.durationDays} ngày</div>
            <button
              className="mt-auto rounded-lg bg-primary text-white py-2 disabled:opacity-60"
              disabled={loadingPlan === p.plan}
              onClick={() => handleBuy(p.plan)}
            >
              {loadingPlan === p.plan ? "Đang chuyển..." : isPro ? "Gia hạn" : "Nâng cấp"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
