import { useEffect, useState } from "react";
import { ChevronDown, Clock3, MapPin, ShieldCheck, Truck } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import EcoTradeLayout from "../../components/ecotrade/EcoTradeLayout";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import deliveryService from "../../services/delivery.service";
import { formatDateTime, formatPrice } from "../../lib/utils";

export default function DeliveryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [delivery, setDelivery] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchDelivery = async () => {
      setLoading(true);
      try {
        const res = await deliveryService.getDeliveryById(id);
        if (res.success) setDelivery(res.data);
      } catch (error) {
        alert(error.response?.data?.message || "Không thể tải vận đơn");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    fetchDelivery();
  }, [id, navigate]);

  const updateStatus = async (status) => {
    setUpdating(true);
    try {
      const res = await deliveryService.updateDeliveryStatus(id, status);
      if (res.success) {
        const refreshed = await deliveryService.getDeliveryById(id);
        if (refreshed.success) setDelivery(refreshed.data);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Không thể cập nhật trạng thái");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <EcoTradeLayout>
        <div className="flex min-h-[70vh] items-center justify-center text-lg font-medium text-muted-foreground">Đang tải chi tiết vận đơn...</div>
      </EcoTradeLayout>
    );
  }

  if (!delivery) return null;

  const order = delivery.orderId || {};
  const product = order.postId || {};
  const status = delivery.deliveryStatus;
  const canStartTransit = status === "picking_up";
  const canComplete = status === "in_transit";
  const inspectionId = delivery.inspections?.[0]?._id;

  return (
    <EcoTradeLayout>
      <div className="w-full">
        <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-[20px] bg-success-soft p-4 text-success">
              <Truck className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-[2.7rem]">Vận đơn #{String(delivery._id).slice(-8).toUpperCase()}</h1>
                <Badge variant="success">{status === "delivered" ? "Đã hoàn tất" : "Đã nhận đơn"}</Badge>
              </div>
              <div className="mt-2 text-xl text-muted-foreground">Tạo lúc: {formatDateTime(delivery.createdAt)}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {canStartTransit ? (
              <Button variant="sky" size="lg" onClick={() => updateStatus("in_transit")} disabled={updating}>Bắt đầu giao hàng</Button>
            ) : null}
            {canComplete ? (
              <Button size="lg" onClick={() => updateStatus("delivered")} disabled={updating}>Đã giao thành công</Button>
            ) : null}
            <Button variant="outline" size="lg">Hỗ trợ</Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-t-[3px] border-t-warning">
            <CardContent className="pt-8">
              <div className="mb-4 flex items-center justify-between">
                <Badge variant="warning">Điểm Lấy Hàng</Badge>
                <span className="text-sm font-semibold text-muted-foreground">Xem bản đồ</span>
              </div>
              <div className="mb-5 flex items-center gap-4">
                <Avatar className="h-14 w-14"><AvatarFallback>NB</AvatarFallback></Avatar>
                <div>
                  <div className="text-[1.5rem] font-bold">{order.sellerId?.fullName || "Người bán"}</div>
                  <div className="text-lg text-muted-foreground">{order.sellerId?.phone || "Chưa có số điện thoại"}</div>
                </div>
              </div>
              <div className="rounded-[24px] border border-dashed border-border px-5 py-5">
                <div className="mb-2 text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">Địa chỉ chi tiết</div>
                <div className="text-[1.18rem] font-semibold leading-8">{delivery.pickupAddress || order.sellerId?.address || "Chưa cập nhật"}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-[3px] border-t-success">
            <CardContent className="pt-8">
              <div className="mb-4 flex items-center justify-between">
                <Badge variant="success">Điểm Giao Hàng</Badge>
                <span className="text-sm font-semibold text-muted-foreground">Xem bản đồ</span>
              </div>
              <div className="mb-5 flex items-center gap-4">
                <Avatar className="h-14 w-14"><AvatarFallback>NM</AvatarFallback></Avatar>
                <div>
                  <div className="text-[1.5rem] font-bold">{order.buyerId?.fullName || "Người mua"}</div>
                  <div className="text-lg text-muted-foreground">{order.buyerId?.phone || "Chưa có số điện thoại"}</div>
                </div>
              </div>
              <div className="rounded-[24px] border border-dashed border-border px-5 py-5">
                <div className="mb-2 text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">Địa chỉ chi tiết</div>
                <div className="text-[1.18rem] font-semibold leading-8">{delivery.deliveryAddress || order.buyerId?.address || "Chưa cập nhật"}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 border-success/20 bg-[#f3fcf7]">
          <CardContent className="flex flex-col gap-5 pt-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-success-soft p-4 text-success">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="text-[1.8rem] font-extrabold text-success">Yêu cầu kiểm định hàng hóa</div>
                <div className="mt-1 max-w-2xl text-lg text-muted-foreground">Để đảm bảo quyền lợi, vui lòng thực hiện kiểm tra tình trạng sản phẩm và chụp ảnh xác nhận trước khi rời điểm lấy hàng.</div>
              </div>
            </div>
            <Button asChild size="lg" className="min-w-[220px]">
              <Link to={inspectionId ? `/inspections/${inspectionId}` : `/deliveries/${delivery._id}/inspection`}>Mở Biên Bản Kiểm Định</Link>
            </Button>
          </CardContent>
        </Card>

        <div className="mt-8 space-y-6">
          <div className="flex items-center gap-3 text-[2rem] font-extrabold">
            <Package2 className="h-6 w-6 text-muted-foreground" />
            Chi tiết đơn hàng
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-[1.5rem] font-bold">Danh sách sản phẩm</div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Khối lượng: ~4.5kg</Badge>
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              <div className="mt-5 divide-y divide-border">
                <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center">
                  <div className="h-16 w-16 overflow-hidden rounded-[18px] bg-muted">
                    {product.images?.[0] ? <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="flex-1">
                    <div className="text-[1.3rem] font-bold">{product.title || "Sản phẩm EcoTrade"}</div>
                    <div className="text-base text-muted-foreground">{product.conditionStatus || "Tình trạng tốt"}</div>
                    <div className="mt-1 text-base font-semibold text-success">SL: 1</div>
                  </div>
                  <div className="text-right text-[1.7rem] font-extrabold">{formatPrice(order.productPrice)}</div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-5">
                <span className="text-xl text-muted-foreground">Tổng giá trị đơn hàng (Tạm tính):</span>
                <span className="text-[2rem] font-extrabold">{formatPrice(order.totalAmount || order.productPrice)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[1.7rem]">Tiến độ vận chuyển</CardTitle>
            </CardHeader>
            <CardContent className="space-y-7">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-success-soft p-3 text-success"><ShieldCheck className="h-5 w-5" /></div>
                  <div>
                    <div className="text-[1.25rem] font-bold">Shipper xác nhận nhận đơn</div>
                    <div className="text-base text-muted-foreground">{formatDateTime(delivery.createdAt)}</div>
                  </div>
                </div>
                <Badge variant="outline">Hoàn tất</Badge>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-muted p-3 text-muted-foreground"><Clock3 className="h-5 w-5" /></div>
                  <div>
                    <div className="text-[1.25rem] font-bold">Đã lấy hàng & Kiểm định</div>
                    <div className="text-base text-muted-foreground">Dự kiến: 15:00</div>
                  </div>
                </div>
                <Badge variant={inspectionId ? "success" : "sky"}>{inspectionId ? "Hoàn tất" : "Đang thực hiện"}</Badge>
              </div>
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-muted p-3 text-muted-foreground"><Truck className="h-5 w-5" /></div>
                <div>
                  <div className="text-[1.25rem] font-bold">Đang giao đến người mua</div>
                  <div className="text-base text-muted-foreground">Dự kiến: 16:00</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 text-right text-[1.15rem] font-bold text-danger">Hủy đơn / Trả lại đơn</div>
      </div>
    </EcoTradeLayout>
  );
}
