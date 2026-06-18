import { useEffect, useState } from "react";
import { Clock3, Package, Printer, ShoppingBag, Truck, UserRoundSearch } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import EcoTradeLayout from "../../components/ecotrade/EcoTradeLayout";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useAuth } from "../../context/AuthContext";
import { buildOrderTimeline, getDeliveryStatusInfo, getOrderStatusInfo } from "../../lib/orderFlow";
import { formatDateTime, formatPrice } from "../../lib/utils";
import orderService from "../../services/order.service";

function PersonCard({ title, name, subtitle, fallback }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <Avatar className="h-14 w-14">
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-success">{title}</div>
          <div className="truncate text-[1.5rem] font-bold">{name}</div>
          <div className="truncate text-base text-muted-foreground">{subtitle}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [processing, setProcessing] = useState(false);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await orderService.getOrderById(id);
      if (res.success) setOrder(res.data);
    } catch (error) {
      alert(error.response?.data?.message || "Khong the tai thong tin don hang");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleOrderAction = async (status) => {
    setProcessing(true);
    try {
      let extra = {};
      if (status === "cancelled") {
        const reason = window.prompt("Nhap ly do huy don", "");
        if (reason === null) {
          setProcessing(false);
          return;
        }
        extra = { cancelReason: reason };
      }

      const res = await orderService.updateOrderStatus(id, status, extra);
      if (res.success) {
        await fetchOrder();
      }
    } catch (error) {
      alert(error.response?.data?.message || "Khong the cap nhat don hang");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <EcoTradeLayout>
        <div className="flex min-h-[70vh] items-center justify-center text-lg font-medium text-muted-foreground">Dang tai chi tiet don hang...</div>
      </EcoTradeLayout>
    );
  }

  if (!order) return null;

  const product = order.postId || {};
  const delivery = order.delivery;
  const orderStatusInfo = getOrderStatusInfo(order.orderStatus);
  const deliveryStatusInfo = getDeliveryStatusInfo(delivery?.deliveryStatus);
  const timeline = buildOrderTimeline(order);
  const isBuyerView = order.actions?.isBuyer ?? String(order.buyerId?._id) === String(user?._id);
  const primaryActionLabel = order.actions?.canBuyerComplete
    ? "Da nhan hang"
    : order.actions?.canSellerConfirm
      ? "Xac nhan don"
      : null;

  return (
    <EcoTradeLayout>
      <div className="w-full">
        <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-[3rem]">Chi tiet don hang #{String(order._id).slice(-6).toUpperCase()}</h1>
              <Badge variant={orderStatusInfo.variant}>{orderStatusInfo.label}</Badge>
              {delivery ? <Badge variant={deliveryStatusInfo.variant}>{deliveryStatusInfo.label}</Badge> : null}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xl text-muted-foreground">
              <Clock3 className="h-5 w-5" />
              Dat luc: {formatDateTime(order.createdAt)}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {order.actions?.canBuyerCancel || order.actions?.canSellerReject ? (
              <Button variant="danger" onClick={() => handleOrderAction("cancelled")} disabled={processing}>
                {processing ? "Dang xu ly..." : "Huy / Tu choi don"}
              </Button>
            ) : null}
            {primaryActionLabel ? (
              <Button
                onClick={() => handleOrderAction(order.actions?.canBuyerComplete ? "completed" : "confirmed")}
                disabled={processing}
              >
                {processing ? "Dang xu ly..." : primaryActionLabel}
              </Button>
            ) : null}
            <Button variant="outline">
              <Printer className="h-4 w-4" />
              In hoa don
            </Button>
            <Button asChild>
              <Link to="/products">
                <ShoppingBag className="h-4 w-4" />
                Tiep tuc mua sam
              </Link>
            </Button>
          </div>
        </div>

        <div className="mb-8 grid gap-5 xl:grid-cols-3">
          <PersonCard title="Nguoi ban" name={order.sellerId?.fullName || "Seller"} subtitle={order.sellerId?.address || "Chua cap nhat dia chi"} fallback="NB" />
          <PersonCard title="Nguoi mua" name={order.buyerId?.fullName || "Buyer"} subtitle={order.buyerAddress || "Chua cap nhat dia chi"} fallback="NM" />
          <PersonCard title="Shipper" name={delivery?.shipperId?.fullName || "Dang cho phan cong"} subtitle={delivery?.shipperId?.phone || "He thong se gan khi co nguoi nhan"} fallback="SP" />
        </div>

        <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_348px]">
          <div className="space-y-7">
            <div>
              <div className="flex items-center gap-3 text-[2rem] font-extrabold">
                <Truck className="h-6 w-6 text-success" />
                Hanh trinh don hang
              </div>
              <p className="mt-2 text-xl text-muted-foreground">
                {isBuyerView ? "Theo doi cac cot moc buyer can biet." : "Theo doi cac cot moc seller can giam sat."}
              </p>
            </div>

            <Card>
              <CardContent className="pt-8">
                <div className="space-y-8">
                  {timeline.map((step, index) => (
                    <div key={`${step.kind}-${index}-${step.label}`} className="relative flex gap-4 pl-2">
                      {index < timeline.length - 1 ? <div className="absolute left-[21px] top-11 h-[calc(100%+18px)] w-px bg-success" /> : null}
                      <div className="relative mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-success bg-success text-white">
                        <div className="h-2.5 w-2.5 rounded-full bg-white" />
                      </div>
                      <div className="pb-1">
                        <div className="flex flex-wrap items-center gap-3 text-[1.15rem] font-bold text-foreground">
                          <span>{step.label}</span>
                          <Badge variant="outline" className="font-medium normal-case">{formatDateTime(step.timestamp)}</Badge>
                        </div>
                        <p className="mt-1 text-lg text-muted-foreground">{step.note || "Cap nhat trang thai don hang."}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-[2rem]">Tom tat don hang</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex gap-4 border-b border-border pb-5">
                  <div className="h-16 w-16 overflow-hidden rounded-[18px] bg-muted">
                    {product.images?.[0] ? <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[1.2rem] font-bold">{product.title || "San pham EcoTrade"}</div>
                    <div className="text-base text-muted-foreground">SL: 1</div>
                    <div className="mt-1 text-[1.45rem] font-extrabold text-success">{formatPrice(order.productPrice)}</div>
                  </div>
                </div>
                <div className="space-y-3 text-[1.05rem]">
                  <div className="flex justify-between"><span className="text-muted-foreground">Tam tinh:</span><span>{formatPrice(order.productPrice)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Phi van chuyen:</span><span>{formatPrice(order.shippingFee)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Thanh toan:</span><span>COD</span></div>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <span className="text-[1.3rem] font-bold">Tong cong:</span>
                  <span className="text-[2.1rem] font-extrabold text-success">{formatPrice(order.totalAmount)}</span>
                </div>
                {order.cancelReason ? (
                  <div className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
                    Ly do huy don: {order.cancelReason}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-[1.7rem]">
                  <UserRoundSearch className="h-5 w-5" />
                  Thong tin nhan hang
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-[1.02rem]">
                <div>
                  <div className="text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">Nguoi nhan</div>
                  <div className="mt-1">{order.recipientName}</div>
                </div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">Dia chi</div>
                  <div className="mt-1 leading-7">{order.buyerAddress}</div>
                </div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">So dien thoai</div>
                  <div className="mt-1">{order.buyerPhone}</div>
                </div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">Ghi chu</div>
                  <div className="mt-1">{order.note || "Khong co ghi chu"}</div>
                </div>
                {delivery?.failureReason ? (
                  <div>
                    <div className="text-sm font-bold uppercase tracking-[0.12em] text-danger">Su co delivery</div>
                    <div className="mt-1 text-danger">{delivery.failureReason}</div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {delivery ? (
              <Card className="border-success/20 bg-[#f5fdf8]">
                <CardContent className="pt-6">
                  <div className="text-sm font-bold uppercase tracking-[0.12em] text-success">Delivery</div>
                  <div className="mt-2 text-[1.5rem] font-extrabold">{deliveryStatusInfo.label}</div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {delivery.shipperId ? `Shipper: ${delivery.shipperId.fullName}` : "He thong dang cho shipper nhan don."}
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </EcoTradeLayout>
  );
}
