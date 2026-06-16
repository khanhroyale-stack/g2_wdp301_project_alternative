import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import orderService from "../../services/order.service";
import toast from "react-hot-toast";

const CreateOrder = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({
    recipientName: "",
    buyerPhone: "",
    buyerAddress: "",
    note: "",
  });

  useEffect(() => {
    const fetchPreview = async () => {
      setLoading(true);
      try {
        const res = await orderService.getCheckoutPreview(productId);
        if (res.success) {
          setPreview(res.data);
          setForm({
            recipientName: res.data.customer?.recipientName || "",
            buyerPhone: res.data.customer?.phone || "",
            buyerAddress: res.data.customer?.address || "",
            note: "",
          });
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Không thể tải thông tin đơn hàng");
        navigate(`/san-pham/${productId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [navigate, productId]);

  const product = preview?.product;

  const expectedDeliveryDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
    });
  }, []);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.recipientName || !form.buyerPhone || !form.buyerAddress) {
      toast.error("Vui lòng điền đầy đủ thông tin nhận hàng");
      return;
    }

    setSubmitting(true);
    try {
      const res = await orderService.createOrder({
        productId,
        recipientName: form.recipientName,
        buyerPhone: form.buyerPhone,
        buyerAddress: form.buyerAddress,
        note: form.note,
        shippingFee: preview?.shippingFee || 0,
      });

      if (res.success) {
        toast.success("Đặt hàng thành công");
        navigate("/don-hang");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể tạo đơn hàng");
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (value) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);

  const getImageUrl = (src) => {
    if (!src) return "https://placehold.co/200x200?text=EcoTrade";
    if (src.startsWith("http")) return src;
    return `http://localhost:5000${src}`;
  };

  const inputClass =
    "w-full rounded-2xl border border-surface-variant/70 bg-white px-4 py-3 text-[15px] text-on-surface outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10";

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#f6f8fb]">
        <Sidebar variant="user" />
        <main className="flex-1 md:ml-64 flex items-center justify-center">
          <span className="material-symbols-outlined animate-spin text-5xl text-primary">refresh</span>
        </main>
      </div>
    );
  }

  if (!preview || !product) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#f5f7fb] text-on-surface">
      <Sidebar variant="user" />

      <main className="flex-1 md:ml-64">
        <div className="border-b border-surface-variant/60 bg-white/90 px-5 py-4 backdrop-blur md:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-sm">
                <span className="material-symbols-outlined">shopping_cart_checkout</span>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">EcoTrade</p>
                <h1 className="text-lg font-bold">Xác nhận đơn hàng</h1>
              </div>
            </div>

            <div className="hidden items-center gap-3 rounded-full border border-surface-variant/60 bg-surface-container-low px-4 py-2 text-sm text-on-surface-variant lg:flex lg:min-w-[360px]">
              <span className="material-symbols-outlined text-[18px]">search</span>
              <span>Tìm sản phẩm, đơn hàng hoặc mã giao vận...</span>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-surface-variant/60 bg-white px-3 py-2 shadow-sm">
              <div className="text-right">
                <p className="text-sm font-semibold">{user?.name || user?.fullName}</p>
                <p className="text-xs text-on-surface-variant">Premium Trader</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                {(user?.name || user?.fullName || "U").charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 md:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Checkout</p>
              <h2 className="text-4xl font-black tracking-tight">Xác nhận Đơn hàng</h2>
              <p className="mt-2 text-base text-on-surface-variant">
                Vui lòng kiểm tra kỹ thông tin trước khi hoàn tất giao dịch.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm font-semibold">
              <Link to={`/san-pham/${productId}`} className="text-primary">Giỏ hàng</Link>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
              <span className="text-primary">Xác nhận</span>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
              <span className="text-on-surface-variant">Hoàn tất</span>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="space-y-6">
              <article className="rounded-[28px] border border-surface-variant/40 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-7">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <span className="material-symbols-outlined">location_on</span>
                  </div>
                  <h3 className="text-2xl font-bold">Thông tin nhận hàng</h3>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">Họ và tên người nhận</label>
                    <input className={inputClass} value={form.recipientName} onChange={handleChange("recipientName")} />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">Số điện thoại</label>
                    <input className={inputClass} value={form.buyerPhone} onChange={handleChange("buyerPhone")} />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">Địa chỉ giao hàng</label>
                    <textarea
                      className={`${inputClass} min-h-[116px] resize-none`}
                      value={form.buyerAddress}
                      onChange={handleChange("buyerAddress")}
                    />
                    <p className="mt-2 text-sm text-on-surface-variant">
                      Vui lòng nhập chính xác để shipper giao hàng thuận lợi hơn.
                    </p>
                  </div>
                </div>
              </article>

              <article className="rounded-[28px] border border-surface-variant/40 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-7">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <span className="material-symbols-outlined">inventory_2</span>
                  </div>
                  <h3 className="text-2xl font-bold">Chi tiết sản phẩm</h3>
                </div>

                <div className="flex flex-col gap-5 rounded-3xl bg-surface-container-low/50 p-4 md:flex-row md:items-center">
                  <img
                    src={getImageUrl(product.images?.[0])}
                    alt={product.title}
                    className="h-28 w-28 rounded-3xl object-cover shadow-sm"
                  />

                  <div className="flex-1">
                    <p className="text-2xl font-bold">{product.title}</p>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {product.category?.name || "Danh mục"} / {product.seller?.name || "Người bán"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full bg-white px-3 py-1 font-semibold text-primary shadow-sm">
                        {product.condition}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-on-surface-variant shadow-sm">Số lượng: 1</span>
                    </div>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-sm text-on-surface-variant">Giá sản phẩm</p>
                    <p className="text-3xl font-black text-primary">{formatPrice(preview.subtotal)}</p>
                  </div>
                </div>
              </article>

              <article className="rounded-[28px] border border-surface-variant/40 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-7">
                <label className="mb-3 block text-xl font-bold">Ghi chú cho người bán</label>
                <textarea
                  className={`${inputClass} min-h-[140px] resize-none`}
                  placeholder="Ví dụ: giao trong giờ hành chính, gọi trước khi đến..."
                  value={form.note}
                  onChange={handleChange("note")}
                />
              </article>
            </section>

            <aside className="space-y-5">
              <article className="rounded-[28px] border border-surface-variant/40 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <h3 className="text-2xl font-bold">Tóm tắt đơn hàng</h3>

                <div className="mt-6 space-y-4 text-[15px]">
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">Tạm tính (1 sản phẩm)</span>
                    <span>{formatPrice(preview.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">Phí vận chuyển</span>
                    <span>{formatPrice(preview.shippingFee)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">Mã giảm giá</span>
                    <span className="text-error">-0đ</span>
                  </div>
                </div>

                <div className="mt-5 border-t border-dashed border-surface-variant/70 pt-5">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-on-surface-variant">Tổng cộng</p>
                      <p className="mt-1 text-xs text-on-surface-variant">Đã bao gồm VAT</p>
                    </div>
                    <p className="text-4xl font-black text-[#22c55e]">{formatPrice(preview.totalAmount)}</p>
                  </div>
                </div>

                <div className="mt-7 rounded-3xl bg-surface-container-low p-4">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-on-surface-variant">Phương thức thanh toán</p>
                  <div className="mt-3 flex items-center justify-between rounded-2xl border border-primary/40 bg-white px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary">payments</span>
                      <span className="font-semibold">Thanh toán khi nhận hàng (COD)</span>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="mt-7 w-full rounded-2xl bg-[#22c55e] px-5 py-4 text-lg font-bold text-white shadow-[0_18px_40px_rgba(34,197,94,0.28)] transition-all hover:translate-y-[-1px] hover:shadow-[0_22px_45px_rgba(34,197,94,0.34)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? "Đang xử lý..." : "Đặt hàng"}
                </button>

                <p className="mt-4 text-sm leading-6 text-on-surface-variant">
                  Bằng việc nhấn đặt hàng, bạn đồng ý với Điều khoản và Chính sách bảo mật của EcoTrade.
                </p>
              </article>

              <article className="rounded-[24px] border border-[#cdeed8] bg-[#f1fbf4] p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                    <span className="material-symbols-outlined">local_shipping</span>
                  </div>
                  <div>
                    <p className="font-bold text-primary">Giao hàng dự kiến</p>
                    <p className="mt-1 text-sm text-[#4b7b5b]">Nhận hàng vào {expectedDeliveryDate}</p>
                  </div>
                </div>
              </article>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateOrder;
