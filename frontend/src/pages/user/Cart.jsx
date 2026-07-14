import { useEffect, useState } from "react";
import {
  Archive,
  Leaf,
  MapPin,
  MessageSquare,
  Minus,
  PackageCheck,
  Phone,
  Plus,
  Receipt,
  ShoppingCart,
  Trash2,
  Truck,
  User,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import EcoTradeLayout from "../../components/ecotrade/EcoTradeLayout";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { formatPrice } from "../../lib/utils";
import cartService from "../../services/cart.service";
import toast from "react-hot-toast";

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    recipientName: "",
    buyerPhone: "",
    buyerAddress: "",
    note: "",
  });

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await cartService.getMyCart();
      if (res.success) {
        setCart(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleRemove = async (productId) => {
    try {
      const res = await cartService.removeCartItem(productId);
      if (res.success) {
        setCart(res.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Khong the xoa san pham khoi gio hang");
    }
  };

  const handleQuantityChange = async (productId, quantity) => {
    try {
      const res = await cartService.addCartItem(productId, quantity);
      if (res.success) {
        setCart(res.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Khong the cap nhat so luong san pham");
    }
  };

  // Wrapper tien loi cho nut +/-, tai su dung nguyen ven handleQuantityChange o tren
  const handleStep = (item, delta) => {
    const maxQty = Math.max(Number(item.product?.quantity) || 1, 1);
    const nextQty = Math.min(Math.max((Number(item.quantity) || 1) + delta, 1), maxQty);
    if (nextQty !== item.quantity) {
      handleQuantityChange(item.productId, nextQty);
    }
  };

  const handleCheckout = async () => {
    if (!form.recipientName || !form.buyerPhone || !form.buyerAddress) {
      toast.error("Vui long dien day du thong tin nhan hang");
      return;
    }

    setSubmitting(true);
    try {
      const res = await cartService.checkoutCart(form);
      if (res.success) {
        navigate("/orders/my-orders");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Khong the checkout gio hang");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <EcoTradeLayout>
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-muted-foreground">
          <div className="h-11 w-11 animate-spin rounded-full border-4 border-success/20 border-t-success" />
          <div className="text-lg font-medium">Dang tai gio hang...</div>
        </div>
      </EcoTradeLayout>
    );
  }

  const items = cart?.items || [];
  const summary = cart?.summary || { itemCount: 0, subtotal: 0, shippingFee: 0, totalAmount: 0 };

  return (
    <EcoTradeLayout>
      <div className="w-full">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-success">
              <Leaf className="h-3.5 w-3.5" />
              EcoTrade
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-[3rem]">Giỏ hàng của tôi</h1>
            <p className="mt-3 text-xl text-muted-foreground">
              Xem lại các sản phẩm đã chọn trước khi tạo đơn hàng.
            </p>
          </div>
          <Card className="border-success/20 bg-gradient-to-br from-[#f5fdf8] to-success-soft/50 shadow-sm">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-2xl bg-success-soft p-3 text-success">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <div className="text-lg font-bold">{summary.itemCount} sản phẩm</div>
                <div className="text-sm text-muted-foreground">Sẵn sàng checkout khi thông tin nhận hàng đầy đủ.</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-5 pt-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success-soft">
                <Archive className="h-9 w-9 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold">Giỏ hàng đang trống</div>
                <div className="mt-2 max-w-md text-muted-foreground">Bạn chưa thêm sản phẩm nào vào giỏ hàng.</div>
              </div>
              <Button asChild size="lg" className="mt-1 gap-2">
                <Link to="/marketplaces">
                  <ShoppingCart className="h-4 w-4" />
                  Tiếp tục mua sắm
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              {items.map((item) => {
                const maxQty = Math.max(Number(item.product?.quantity) || 1, 1);
                return (
                  <Card key={item.productId} className="overflow-hidden transition-shadow hover:shadow-md">
                    <CardContent className="pt-6">
                      <div className="flex flex-col gap-5 sm:flex-row">
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[18px] border border-border bg-muted">
                          {item.product?.thumbnailUrl ? (
                            <img
                              src={item.product.thumbnailUrl}
                              alt={item.product.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <Archive className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="text-[1.45rem] font-bold">
                                {item.product?.title || "Sản phẩm EcoTrade"}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                                  {item.product?.categoryId?.name || "Khác"}
                                </span>
                                <span>•</span>
                                <span>{item.product?.ownerId?.fullName || "Người bán"}</span>
                              </div>
                              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                                <Truck className="h-4 w-4" />
                                Phí ship dự kiến {formatPrice(35000)}
                              </div>
                              <div className="mt-4 flex flex-wrap items-center gap-3">
                                <span className="text-sm font-medium text-muted-foreground">Số lượng</span>
                                <div className="flex items-center overflow-hidden rounded-lg border border-border">
                                  <button
                                    type="button"
                                    onClick={() => handleStep(item, -1)}
                                    disabled={Number(item.quantity) <= 1}
                                    className="flex h-10 w-9 items-center justify-center text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    <Minus className="h-3.5 w-3.5" />
                                  </button>
                                  <Input
                                    type="number"
                                    min="1"
                                    max={maxQty}
                                    value={item.quantity}
                                    onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                                    className="h-10 w-14 rounded-none border-0 text-center focus-visible:ring-0"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleStep(item, 1)}
                                    disabled={Number(item.quantity) >= maxQty}
                                    className="flex h-10 w-9 items-center justify-center text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  Còn lại {Math.max(Number(item.product?.quantity) || 0, 0)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[1.7rem] font-extrabold text-success">
                                {formatPrice((Number(item.product?.salePrice) || 0) * (Number(item.quantity) || 1))}
                              </div>
                              <Button
                                variant="outline"
                                className="mt-3 gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => handleRemove(item.productId)}
                              >
                                <Trash2 className="h-4 w-4" />
                                Xóa
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="space-y-6 xl:sticky xl:top-[112px] xl:self-start">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[1.8rem]">
                    <PackageCheck className="h-5 w-5 text-success" />
                    Thông tin nhận hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Họ và tên người nhận"
                      value={form.recipientName}
                      onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                      className="pl-9"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Số điện thoại"
                      value={form.buyerPhone}
                      onChange={(e) => setForm({ ...form, buyerPhone: e.target.value })}
                      className="pl-9"
                    />
                  </div>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      placeholder="Địa chỉ giao hàng"
                      value={form.buyerAddress}
                      onChange={(e) => setForm({ ...form, buyerAddress: e.target.value })}
                      className="min-h-[110px] pl-9"
                    />
                  </div>
                  <div className="relative">
                    <MessageSquare className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      placeholder="Ghi chú cho người bán (không bắt buộc)"
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      className="min-h-[90px] pl-9"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[1.8rem]">
                    <Receipt className="h-5 w-5 text-success" />
                    Tóm tắt giỏ hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">Số sản phẩm</span>
                    <span className="font-medium whitespace-nowrap">{summary.itemCount}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">Tạm tính</span>
                    <span className="font-medium whitespace-nowrap">{formatPrice(summary.subtotal)}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">Phí vận chuyển</span>
                    <span className="font-medium whitespace-nowrap">{formatPrice(summary.shippingFee)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-success-soft/60 px-4 py-4">
                    <span className="text-[1.15rem] font-bold">Tổng cộng</span>
                    <span className="text-2xl font-extrabold text-success whitespace-nowrap">
                      {formatPrice(summary.totalAmount)}
                    </span>
                  </div>
                  <Button size="lg" className="w-full gap-2 text-[1.15rem]" onClick={handleCheckout} disabled={submitting}>
                    {submitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Đang checkout...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4" />
                        Checkout giỏ hàng
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </EcoTradeLayout>
  );
}