import { useEffect, useState } from "react";
import { CircleAlert, CreditCard, MapPin, ShieldCheck, Truck } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import EcoTradeLayout from "../../components/ecotrade/EcoTradeLayout";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import orderService from "../../services/order.service";
import { formatDateOnly, formatPrice } from "../../lib/utils";

export default function CreateOrder() {
  const { productId } = useParams();
  const navigate = useNavigate();
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
    const fetchCheckoutPreview = async () => {
      setLoading(true);
      try {
        const res = await orderService.getCheckoutPreview(productId);
        if (res.success) {
          setPreview(res.data);
          setForm({
            recipientName: res.data.buyer?.fullName || "",
            buyerPhone: res.data.buyer?.phone || "",
            buyerAddress: res.data.buyer?.address || "",
            note: "",
          });
        }
      } catch (error) {
        alert(error.response?.data?.message || "Không thể tải thông tin sản phẩm");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    fetchCheckoutPreview();
  }, [navigate, productId]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.recipientName || !form.buyerPhone || !form.buyerAddress) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setSubmitting(true);
    try {
      const res = await orderService.createOrder({ productId, ...form });
      if (res.success) {
        navigate("/don-hang");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Không thể tạo đơn hàng");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <EcoTradeLayout>
        <div className="flex min-h-[70vh] items-center justify-center text-lg font-medium text-muted-foreground">Đang tải dữ liệu đơn hàng...</div>
      </EcoTradeLayout>
    );
  }

  if (!preview) return null;

  const product = preview.product;

  return (
    <EcoTradeLayout>
      <div className="w-full">
        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-[3.2rem]">Xác nhận Đơn hàng</h1>
            <p className="mt-3 text-xl text-muted-foreground">Vui lòng kiểm tra kỹ thông tin trước khi hoàn tất giao dịch.</p>
          </div>
          <div className="flex items-center gap-3 text-sm font-semibold">
            <span className="text-success">Giỏ hàng</span>
            <span className="text-muted-foreground">›</span>
            <span className="text-success">Xác nhận</span>
            <span className="text-muted-foreground">›</span>
            <span className="text-muted-foreground">Hoàn tất</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-7">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-[1.95rem]">
                  <MapPin className="h-6 w-6 text-success" />
                  Thông tin nhận hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-base font-semibold">Họ và tên người nhận</label>
                  <Input value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-base font-semibold">Số điện thoại</label>
                  <Input value={form.buyerPhone} onChange={(e) => setForm({ ...form, buyerPhone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-base font-semibold">Địa chỉ giao hàng</label>
                  <Textarea value={form.buyerAddress} onChange={(e) => setForm({ ...form, buyerAddress: e.target.value })} className="min-h-[120px]" />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CircleAlert className="h-4 w-4" />
                  Vui lòng nhập chính xác để shipper dễ dàng tìm thấy bạn.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-[1.95rem]">
                  <ShieldCheck className="h-6 w-6 text-success" />
                  Chi tiết sản phẩm
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-5 sm:flex-row">
                  <div className="h-24 w-24 overflow-hidden rounded-[18px] bg-muted">
                    {product.images?.[0] ? <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-[1.7rem] font-bold leading-tight">{product.title}</h3>
                        <p className="mt-1 text-base text-muted-foreground">
                          {product.categoryId?.name || "Điện tử"} / {product.brand || "EcoTrade"}
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                          <Badge variant="muted">{product.conditionStatus || "Mới 95%"}</Badge>
                          <span className="text-base italic text-muted-foreground">Số lượng: 1</span>
                        </div>
                      </div>
                      <div className="text-right text-[1.9rem] font-extrabold">{formatPrice(product.salePrice)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <label className="text-[1.1rem] font-semibold">Ghi chú cho người bán (Không bắt buộc)</label>
                  <Textarea
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    placeholder="Ví dụ: Giao hàng vào giờ hành chính, gọi trước khi đến..."
                    className="min-h-[126px]"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-7 xl:sticky xl:top-[112px] xl:self-start">
            <Card>
              <CardHeader>
                <CardTitle className="text-[2rem]">Tóm tắt đơn hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 text-[1.05rem]">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tạm tính (1 sản phẩm)</span>
                    <span>{formatPrice(preview.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Phí vận chuyển</span>
                    <span>{formatPrice(preview.shippingFee)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Mã giảm giá</span>
                    <Badge variant="success">ECONOW</Badge>
                  </div>
                </div>
                <div className="border-t border-dashed border-border pt-5">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-[1.1rem] font-bold">Tổng cộng</div>
                      <div className="text-sm text-muted-foreground">(Đã bao gồm VAT)</div>
                    </div>
                    <div className="text-[2.35rem] font-extrabold text-success">{formatPrice(preview.totalAmount)}</div>
                  </div>
                </div>

                <div className="rounded-[20px] bg-muted p-4">
                  <div className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">Phương thức thanh toán</div>
                  <div className="flex items-center justify-between rounded-2xl border border-success/50 bg-white px-4 py-3">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-success" />
                      <div className="text-base font-semibold">Thanh toán khi nhận hàng (COD)</div>
                    </div>
                    <span className="text-xl text-muted-foreground">›</span>
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full text-[1.4rem]" disabled={submitting}>
                  {submitting ? "Đang xử lý..." : "Đặt hàng"}
                </Button>

                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-4 w-4" />
                  <span>Bằng việc nhấn đặt hàng, bạn đồng ý với các Điều khoản và Chính sách bảo mật của EcoTrade.</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-success/20 bg-[#f5fdf8]">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-2xl bg-success-soft p-3 text-success">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-lg font-bold text-success">Giao hàng dự kiến</div>
                  <div className="text-base text-muted-foreground">Nhận hàng vào {formatDateOnly(Date.now() + 7 * 24 * 60 * 60 * 1000)}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </EcoTradeLayout>
  );
}
