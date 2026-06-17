import { useEffect, useState } from "react";
import { Clock3, Package, Printer, ShoppingBag, Truck, UserRound, UserRoundSearch } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import EcoTradeLayout from "../../components/ecotrade/EcoTradeLayout";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import orderService from "../../services/order.service";
import { formatDateTime, formatPrice } from "../../lib/utils";

const statusMap = {
  pending: { label: "Chờ xác nhận", variant: "warning" },
  confirmed: { label: "Đã xác nhận", variant: "success" },
  shipping: { label: "Đang vận chuyển", variant: "success" },
  delivered: { label: "Đã giao", variant: "sky" },
  completed: { label: "Hoàn tất", variant: "success" },
  cancelled: { label: "Đã hủy", variant: "danger" },
};

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
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const res = await orderService.getOrderById(id);
        if (res.success) setOrder(res.data);
      } catch (error) {
        alert(error.response?.data?.message || "Không thể tải thông tin đơn hàng");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, navigate]);

  if (loading) {
    return (
      <EcoTradeLayout>
        <div className="flex min-h-[70vh] items-center justify-center text-lg font-medium text-muted-foreground">Đang tải chi tiết đơn hàng...</div>
      </EcoTradeLayout>
    );
  }

  if (!order) return null;

  const product = order.postId || {};
  const statusInfo = statusMap[order.orderStatus] || { label: order.orderStatus, variant: "muted" };
  const delivery = order.delivery;
  const timeline = [
    { label: "Chờ người bán xác nhận", active: true, description: "Đơn hàng đã được tạo và đang chờ phản hồi từ cửa hàng.", time: formatDateTime(order.createdAt) },
    { label: "Người bán đã xác nhận", active: ["confirmed", "shipping", "delivered", "completed"].includes(order.orderStatus), description: "Người bán đã chấp nhận đơn hàng và chuẩn bị hàng.", time: delivery?.updatedAt ? formatDateTime(delivery.updatedAt) : "Đang chờ" },
    { label: "Chờ shipper", active: !!delivery, description: "Yêu cầu giao hàng đã được gửi đến mạng lưới vận chuyển.", time: delivery?.createdAt ? formatDateTime(delivery.createdAt) : "Đang chờ" },
    { label: "Shipper đã nhận đơn", active: !!delivery?.shipperId, description: "Shipper đã nhận đơn và bắt đầu hành trình giao hàng.", time: delivery?.shipperId ? "Đã nhận đơn" : "Đang chờ" },
    { label: "Đã lấy hàng", active: ["shipping", "delivered", "completed"].includes(order.orderStatus), description: "Shipper đã lấy hàng từ người bán.", time: ["shipping", "delivered", "completed"].includes(order.orderStatus) ? "Đang thực hiện" : "Đang chờ" },
    { label: "Đang giao hàng", active: ["shipping", "delivered", "completed"].includes(order.orderStatus), description: "Đơn hàng đang trên đường tới người nhận.", time: order.orderStatus === "shipping" ? "Đang thực hiện" : "Đang chờ" },
    { label: "Hoàn tất", active: ["delivered", "completed"].includes(order.orderStatus), description: "Đơn hàng đã bàn giao thành công.", time: ["delivered", "completed"].includes(order.orderStatus) ? "Đã xong" : "Đang chờ" },
  ];

  return (
    <EcoTradeLayout>
      <div className="w-full">
        <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-[3rem]">Chi tiết đơn hàng #{String(order._id).slice(-6).toUpperCase()}</h1>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xl text-muted-foreground">
              <Clock3 className="h-5 w-5" />
              Đặt lúc: {formatDateTime(order.createdAt)}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline">
              <Printer className="h-4 w-4" />
              In hóa đơn
            </Button>
            <Button asChild>
              <Link to="/products">
                <ShoppingBag className="h-4 w-4" />
                Tiếp tục mua sắm
              </Link>
            </Button>
          </div>
        </div>

        <div className="mb-8 grid gap-5 xl:grid-cols-3">
          <PersonCard title="Người bán" name={order.sellerId?.fullName || "Green Life Store"} subtitle={order.sellerId?.address || "Cửa hàng 4.9★ - TP. Hồ Chí Minh"} fallback="NB" />
          <PersonCard title="Người mua" name={order.buyerId?.fullName || "Alex Nguyen"} subtitle={order.buyerAddress || "Khách hàng thân thiết"} fallback="NM" />
          <PersonCard title="Shipper" name={delivery?.shipperId?.fullName || "Đang chờ phân công"} subtitle={delivery?.shipperId?.phone || "Hệ thống sẽ gán ngay khi có người nhận"} fallback="SP" />
        </div>

        <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_348px]">
          <div className="space-y-7">
            <div>
              <div className="flex items-center gap-3 text-[2rem] font-extrabold">
                <Truck className="h-6 w-6 text-success" />
                Hành trình đơn hàng
              </div>
              <p className="mt-2 text-xl text-muted-foreground">Theo dõi các cột mốc quan trọng của quy trình vận chuyển</p>
            </div>

            <Card>
              <CardContent className="pt-8">
                <div className="space-y-8">
                  {timeline.map((step, index) => (
                    <div key={step.label} className="relative flex gap-4 pl-2">
                      {index < timeline.length - 1 ? <div className={`absolute left-[21px] top-11 h-[calc(100%+18px)] w-px ${step.active ? "bg-success" : "bg-border"}`} /> : null}
                      <div className={`relative mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${step.active ? "border-success bg-success text-white" : "border-border bg-white text-muted-foreground"}`}>
                        <div className={`h-2.5 w-2.5 rounded-full ${step.active ? "bg-white" : "bg-border"}`} />
                      </div>
                      <div className="pb-1">
                        <div className={`flex flex-wrap items-center gap-3 text-[1.15rem] font-bold ${step.active ? "text-foreground" : "text-muted-foreground"}`}>
                          <span>{step.label}</span>
                          <Badge variant="outline" className="font-medium normal-case">{step.time}</Badge>
                        </div>
                        <p className="mt-1 text-lg text-muted-foreground">{step.description}</p>
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
                <CardTitle className="text-[2rem]">Tóm tắt đơn hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex gap-4 border-b border-border pb-5">
                  <div className="h-16 w-16 overflow-hidden rounded-[18px] bg-muted">
                    {product.images?.[0] ? <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[1.2rem] font-bold">{product.title || "Sản phẩm EcoTrade"}</div>
                    <div className="text-base text-muted-foreground">SL: 1</div>
                    <div className="mt-1 text-[1.45rem] font-extrabold text-success">{formatPrice(order.productPrice)}</div>
                  </div>
                </div>
                <div className="space-y-3 text-[1.05rem]">
                  <div className="flex justify-between"><span className="text-muted-foreground">Tạm tính:</span><span>{formatPrice(order.productPrice)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Phí vận chuyển:</span><span>{formatPrice(order.shippingFee)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Khuyến mãi:</span><span>-0 đ</span></div>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <span className="text-[1.3rem] font-bold">Tổng cộng:</span>
                  <span className="text-[2.1rem] font-extrabold text-success">{formatPrice(order.totalAmount)}</span>
                </div>
                <Button className="w-full text-[1.25rem]">{order.orderStatus === "pending" ? "Chờ xác nhận" : "Tiếp tục thanh toán"}</Button>
                <div className="text-center text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground">Đơn hàng của bạn được bảo mật bởi EcoTrade Protection</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-[1.7rem]">
                  <UserRoundSearch className="h-5 w-5" />
                  Thông tin nhận hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-[1.02rem]">
                <div>
                  <div className="text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">Địa chỉ</div>
                  <div className="mt-1 leading-7">{order.buyerAddress}</div>
                </div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">Số điện thoại</div>
                  <div className="mt-1">{order.buyerPhone}</div>
                </div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">Phương thức thanh toán</div>
                  <div className="mt-1 flex items-center gap-3">
                    <span>Ví điện tử EcoPay</span>
                    <Badge variant="outline">Đã trả</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </EcoTradeLayout>
  );
}
