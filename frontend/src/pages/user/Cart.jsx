import { useEffect, useState } from "react";
import { Archive, ShoppingCart, Trash2, Truck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import EcoTradeLayout from "../../components/ecotrade/EcoTradeLayout";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { formatPrice } from "../../lib/utils";
import cartService from "../../services/cart.service";

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
      alert(error.response?.data?.message || "Khong the xoa san pham khoi gio hang");
    }
  };

  const handleCheckout = async () => {
    if (!form.recipientName || !form.buyerPhone || !form.buyerAddress) {
      alert("Vui long dien day du thong tin nhan hang");
      return;
    }

    setSubmitting(true);
    try {
      const res = await cartService.checkoutCart(form);
      if (res.success) {
        navigate("/orders/my-orders");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Khong the checkout gio hang");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <EcoTradeLayout>
        <div className="flex min-h-[70vh] items-center justify-center text-lg font-medium text-muted-foreground">
          Dang tai gio hang...
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
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-[3rem]">Gio hang cua toi</h1>
            <p className="mt-3 text-xl text-muted-foreground">
              Xem lai cac san pham da chon truoc khi tao don hang.
            </p>
          </div>
          <Card className="border-success/20 bg-[#f5fdf8]">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-2xl bg-success-soft p-3 text-success">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <div className="text-lg font-bold">{summary.itemCount} san pham</div>
                <div className="text-sm text-muted-foreground">San sang checkout khi thong tin nhan hang day du.</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-4 pt-6 text-center">
              <Archive className="h-10 w-10 text-muted-foreground" />
              <div className="text-2xl font-bold">Gio hang dang trong</div>
              <div className="max-w-md text-muted-foreground">Ban chua them san pham nao vao gio hang.</div>
              <Button asChild>
                <Link to="/marketplace">Tiep tuc mua sam</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              {items.map((item) => (
                <Card key={item.productId}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col gap-5 sm:flex-row">
                      <div className="h-24 w-24 overflow-hidden rounded-[18px] bg-muted">
                        {item.product?.thumbnailUrl ? (
                          <img src={item.product.thumbnailUrl} alt={item.product.title} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="text-[1.45rem] font-bold">{item.product?.title || "San pham EcoTrade"}</div>
                            <div className="mt-1 text-sm text-muted-foreground">
                              {item.product?.categoryId?.name || "Khac"} • {item.product?.ownerId?.fullName || "Nguoi ban"}
                            </div>
                            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                              <Truck className="h-4 w-4" />
                              Phi ship du kien {formatPrice(35000)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[1.7rem] font-extrabold text-success">
                              {formatPrice(item.product?.salePrice)}
                            </div>
                            <Button variant="outline" className="mt-3" onClick={() => handleRemove(item.productId)}>
                              <Trash2 className="h-4 w-4" />
                              Xoa
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-6 xl:sticky xl:top-[112px] xl:self-start">
              <Card>
                <CardHeader>
                  <CardTitle className="text-[1.8rem]">Thong tin nhan hang</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Ho va ten nguoi nhan" value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} />
                  <Input placeholder="So dien thoai" value={form.buyerPhone} onChange={(e) => setForm({ ...form, buyerPhone: e.target.value })} />
                  <Textarea placeholder="Dia chi giao hang" value={form.buyerAddress} onChange={(e) => setForm({ ...form, buyerAddress: e.target.value })} className="min-h-[110px]" />
                  <Textarea placeholder="Ghi chu cho nguoi ban (khong bat buoc)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="min-h-[90px]" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-[1.8rem]">Tom tat gio hang</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">So san pham</span><span>{summary.itemCount}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tam tinh</span><span>{formatPrice(summary.subtotal)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Phi van chuyen</span><span>{formatPrice(summary.shippingFee)}</span></div>
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <span className="text-[1.25rem] font-bold">Tong cong</span>
                    <span className="text-[2rem] font-extrabold text-success">{formatPrice(summary.totalAmount)}</span>
                  </div>
                  <Button size="lg" className="w-full text-[1.2rem]" onClick={handleCheckout} disabled={submitting}>
                    {submitting ? "Dang checkout..." : "Checkout gio hang"}
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
