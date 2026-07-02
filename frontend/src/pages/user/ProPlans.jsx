import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Crown,
  Infinity as InfinityIcon,
  TrendingUp,
  BadgeCheck,
  Check,
  ShieldCheck,
  ArrowLeft,
  Home,
} from "lucide-react";
import subscriptionService from "../../services/subscription.service";
import AccountStatusCard from "../../components/ui/AccountStatusCard";
import { useAuth } from "../../context/AuthContext";

const PLAN_LABELS = { "1m": "1 tháng", "3m": "3 tháng", "12m": "12 tháng" };
const formatVnd = (n) => n.toLocaleString("vi-VN") + "đ";

// Quyền lợi khi nâng cấp Pro
const BENEFITS = [
  {
    icon: InfinityIcon,
    title: "Đăng bài không giới hạn",
    desc: "Tài khoản thường chỉ được 5 bài đang hoạt động. Pro gỡ bỏ hoàn toàn giới hạn này.",
  },
  {
    icon: TrendingUp,
    title: "Ưu tiên hiển thị",
    desc: "Tin của bạn được xếp trước trong kết quả Chợ, tiếp cận nhiều người mua/thuê hơn.",
  },
  {
    icon: BadgeCheck,
    title: "Huy hiệu Pro uy tín",
    desc: "Hiển thị huy hiệu Pro cạnh tên, tăng độ tin cậy khi giao dịch.",
  },
];

// Card gói được đánh dấu nổi bật / tiết kiệm
const PLAN_TAGS = {
  "3m": { label: "Phổ biến nhất", featured: true },
  "12m": { label: "Tiết kiệm nhất", featured: false },
};

const FAQS = [
  {
    q: "Thanh toán bằng cách nào?",
    a: "Qua cổng VNPay (thẻ ATM nội địa / QR). Sau khi thanh toán thành công, tài khoản được nâng cấp Pro ngay lập tức.",
  },
  {
    q: "Gia hạn gói như thế nào?",
    a: "Mua thêm bất kỳ gói nào — thời hạn sẽ được cộng dồn vào ngày hết hạn hiện tại của bạn.",
  },
  {
    q: "Hết hạn Pro thì sao?",
    a: "Tài khoản trở lại loại thường. Các bài đang đăng vẫn được giữ nguyên, nhưng khi đăng mới sẽ áp lại giới hạn 5 bài hoạt động.",
  },
  {
    q: "Có được hoàn tiền không?",
    a: "Gói Pro không hỗ trợ hoàn tiền sau khi đã kích hoạt, vui lòng cân nhắc kỹ trước khi mua.",
  },
];

const monthlyEquivalent = (amount, durationDays) => Math.round(amount / (durationDays / 30));

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
  const baseMonthly = 50000; // giá gói 1 tháng, dùng để tính % tiết kiệm

  return (
    <div className="min-h-screen bg-surface pb-16">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary to-primary-container px-4 pb-14 pt-12 text-center text-on-primary">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
          <Crown size={32} />
        </div>
        <h1 className="mt-4 text-3xl font-black">Nâng cấp tài khoản Pro</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-on-primary/85">
          Đăng bài không giới hạn, ưu tiên hiển thị và huy hiệu Pro giúp bạn bán & cho thuê hiệu quả hơn.
        </p>
      </div>

      <div className="mx-auto -mt-8 max-w-5xl px-4">
        {/* Trạng thái tài khoản hiện tại */}
        <AccountStatusCard className="shadow-card" />

        {/* Quyền lợi */}
        <section className="mt-10">
          <h2 className="mb-5 text-center text-xl font-bold text-on-surface">Quyền lợi khi lên Pro</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-surface-variant/40 bg-surface-container-lowest p-5 text-center"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <b.icon size={24} />
                </div>
                <h3 className="mt-3 font-semibold text-on-surface">{b.title}</h3>
                <p className="mt-1.5 text-sm text-on-surface-variant">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bảng giá */}
        <section className="mt-12">
          <h2 className="mb-6 text-center text-xl font-bold text-on-surface">Chọn gói phù hợp</h2>
          {isPro && (
            <div className="mx-auto mb-6 max-w-xl rounded-xl bg-amber-50 p-4 text-center text-sm text-amber-700">
              Bạn đang là Pro
              {user?.proExpiresAt &&
                `, hết hạn ngày ${new Date(user.proExpiresAt).toLocaleDateString("vi-VN")}`}
              . Mua thêm để cộng dồn thời hạn.
            </div>
          )}
          <div className="grid items-start gap-5 sm:grid-cols-3">
            {plans.map((p) => {
              const tag = PLAN_TAGS[p.plan];
              const monthly = monthlyEquivalent(p.amount, p.durationDays);
              const savePct = Math.round((1 - monthly / baseMonthly) * 100);
              return (
                <div
                  key={p.plan}
                  className={`relative flex flex-col rounded-2xl border bg-surface-container-lowest p-6 ${
                    tag?.featured
                      ? "border-primary shadow-card ring-1 ring-primary/30 sm:-mt-2 sm:mb-2"
                      : "border-surface-variant/40"
                  }`}
                >
                  {tag && (
                    <span
                      className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${
                        tag.featured
                          ? "bg-primary text-on-primary"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {tag.label}
                    </span>
                  )}
                  <div className="text-base font-semibold text-on-surface">
                    {PLAN_LABELS[p.plan] || p.plan}
                  </div>
                  <div className="mt-2 text-3xl font-black text-on-surface">{formatVnd(p.amount)}</div>
                  <div className="mt-1 text-xs text-on-surface-variant">
                    ≈ {formatVnd(monthly)}/tháng
                    {savePct > 0 && (
                      <span className="ml-1.5 font-semibold text-primary">tiết kiệm {savePct}%</span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-on-surface-variant">{p.durationDays} ngày sử dụng</div>

                  <ul className="mt-4 flex flex-col gap-2 border-t border-surface-variant/40 pt-4 text-sm text-on-surface">
                    {BENEFITS.map((b) => (
                      <li key={b.title} className="flex items-start gap-2">
                        <Check size={16} className="mt-0.5 shrink-0 text-primary" />
                        {b.title}
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`mt-5 rounded-xl py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
                      tag?.featured
                        ? "bg-primary text-on-primary hover:opacity-90"
                        : "border border-primary text-primary hover:bg-primary/5"
                    }`}
                    disabled={loadingPlan === p.plan}
                    onClick={() => handleBuy(p.plan)}
                  >
                    {loadingPlan === p.plan ? "Đang chuyển..." : isPro ? "Gia hạn" : "Nâng cấp ngay"}
                  </button>
                </div>
              );
            })}
          </div>
          <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-on-surface-variant">
            <ShieldCheck size={14} className="text-primary" />
            Thanh toán an toàn qua cổng VNPay
          </p>
        </section>

        {/* So sánh Free vs Pro */}
        <section className="mt-12">
          <h2 className="mb-5 text-center text-xl font-bold text-on-surface">So sánh thường & Pro</h2>
          <div className="overflow-hidden rounded-2xl border border-surface-variant/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-container-high text-on-surface">
                  <th className="px-4 py-3 text-left font-semibold">Tính năng</th>
                  <th className="px-4 py-3 text-center font-semibold">Thường</th>
                  <th className="px-4 py-3 text-center font-semibold text-primary">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant/40 bg-surface-container-lowest">
                {[
                  { label: "Số bài đăng hoạt động", free: "Tối đa 5", pro: "Không giới hạn" },
                  { label: "Ưu tiên hiển thị trên Chợ", free: false, pro: true },
                  { label: "Huy hiệu Pro cạnh tên", free: false, pro: true },
                ].map((row) => (
                  <tr key={row.label}>
                    <td className="px-4 py-3 text-on-surface">{row.label}</td>
                    <td className="px-4 py-3 text-center text-on-surface-variant">
                      {typeof row.free === "boolean"
                        ? row.free
                          ? <Check size={16} className="mx-auto text-primary" />
                          : <span className="text-on-surface-variant/50">—</span>
                        : row.free}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-on-surface">
                      {typeof row.pro === "boolean"
                        ? row.pro
                          ? <Check size={16} className="mx-auto text-primary" />
                          : <span className="text-on-surface-variant/50">—</span>
                        : row.pro}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-12">
          <h2 className="mb-5 text-center text-xl font-bold text-on-surface">Câu hỏi thường gặp</h2>
          <div className="flex flex-col gap-3">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="group rounded-xl border border-surface-variant/40 bg-surface-container-lowest px-4 py-3"
              >
                <summary className="cursor-pointer list-none text-sm font-semibold text-on-surface marker:hidden">
                  {f.q}
                </summary>
                <p className="mt-2 text-sm text-on-surface-variant">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Footer điều hướng */}
        <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/marketplaces"
            className="inline-flex items-center gap-1.5 rounded-lg border border-surface-variant px-4 py-2 text-sm font-medium text-on-surface transition hover:bg-surface-container-low"
          >
            <ArrowLeft size={16} />
            Về Chợ
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:opacity-90"
          >
            <Home size={16} />
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
