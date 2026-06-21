import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock3, MapPin, Package2, ShieldCheck, Truck } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ShipperLayout from "../../components/shipper/ShipperLayout";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { getDeliveryStatusInfo } from "../../lib/orderFlow";
import { formatDateTime, formatPrice } from "../../lib/utils";
import deliveryService from "../../services/delivery.service";

const nextActionMap = {
  accepted: { label: "Đang đến lấy hàng", nextStatus: "picking_up", variant: "sky" },
  picking_up: { label: "Đã lấy hàng", nextStatus: "picked_up", variant: "default" },
  in_transit: { label: "Đã giao thành công", nextStatus: "delivered", variant: "success" },
};

export default function DeliveryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [delivery, setDelivery] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchDelivery = async () => {
    setLoading(true);
    try {
      const res = await deliveryService.getDeliveryById(id);
      if (res.success) setDelivery(res.data);
    } catch (error) {
      alert(error.response?.data?.message || "Không thể tải vận đơn.");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDelivery();
  }, [id]);

  const updateStatus = async (status, extra = {}) => {
    setUpdating(true);
    try {
      const res = await deliveryService.updateDeliveryStatus(id, status, extra);
      if (res.success) {
        await fetchDelivery();
      }
    } catch (error) {
      alert(error.response?.data?.message || "Không thể cập nhật trạng thái.");
    } finally {
      setUpdating(false);
    }
  };

  const handleFail = async () => {
    const reason = window.prompt("Nhập lý do giao thất bại hoặc báo cáo sự cố", "");
    if (reason === null) return;
    await updateStatus("failed", { failureReason: reason });
  };

  const history = useMemo(() => delivery?.history || [], [delivery]);

  if (loading) {
    return (
      <ShipperLayout>
        <div className="flex min-h-[70vh] items-center justify-center text-lg font-medium text-muted-foreground">Đang tải chi tiết vận đơn...</div>
      </ShipperLayout>
    );
  }

  if (!delivery) return null;

  const order = delivery.orderId || {};
  const product = order.postId || {};
  const statusInfo = getDeliveryStatusInfo(delivery.deliveryStatus);
  const nextAction = nextActionMap[delivery.deliveryStatus];
  const pickupInspection = delivery.inspections?.find((item) => item.inspectionType === "pickup");
  const mustInspect = delivery.deliveryStatus === "picked_up";

  return (
    <ShipperLayout>
      <div className="w-full">
        <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-[20px] bg-success-soft p-4 text-success">
              <Truck className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-[2.7rem]">Vận đơn #{String(delivery._id).slice(-8).toUpperCase()}</h1>
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              </div>
              <div className="mt-2 text-xl text-muted-foreground">Tạo lúc: {formatDateTime(delivery.createdAt)}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {mustInspect ? (
              <Button asChild size="lg">
                <Link to={pickupInspection ? `/shipper/inspection/${pickupInspection._id}` : `/shipper/don/${delivery._id}/inspection`}>
                  Mở biên bản kiểm tra
                </Link>
              </Button>
            ) : null}
            {nextAction ? (
              <Button
                variant={nextAction.variant === "default" ? undefined : nextAction.variant}
                size="lg"
                onClick={() => updateStatus(nextAction.nextStatus)}
                disabled={updating}
              >
                {updating ? "Đang xử lý..." : nextAction.label}
              </Button>
            ) : null}
            <Button variant="danger" size="lg" onClick={handleFail} disabled={updating || ["delivered", "completed", "failed"].includes(delivery.deliveryStatus)}>
              Báo cáo sự cố
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-t-[3px] border-t-warning">
            <CardContent className="pt-8">
              <div className="mb-4 flex items-center justify-between">
                <Badge variant="warning">Điểm lấy hàng</Badge>
                <span className="text-sm font-semibold text-muted-foreground">Seller</span>
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
                <Badge variant="success">Điểm giao hàng</Badge>
                <span className="text-sm font-semibold text-muted-foreground">Buyer</span>
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
                <div className="text-[1.8rem] font-extrabold text-success">Kiểm tra trước khi giao</div>
                <div className="mt-1 max-w-2xl text-lg text-muted-foreground">
                  Sau khi đã lấy hàng, shipper phải lập biên bản kiểm tra. Chỉ khi kiểm tra đạt, hệ thống mới cho phép bắt đầu giao hàng.
                </div>
              </div>
            </div>
            <Button asChild size="lg" className="min-w-[220px]">
              <Link to={pickupInspection ? `/shipper/inspection/${pickupInspection._id}` : `/shipper/don/${delivery._id}/inspection`}>
                {pickupInspection ? "Xem biên bản" : "Mở biên bản"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-[2rem] font-extrabold">
              <Package2 className="h-6 w-6 text-muted-foreground" />
              Chi tiết đơn hàng
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 py-2 sm:flex-row sm:items-center">
                  <div className="h-16 w-16 overflow-hidden rounded-[18px] bg-muted">
                    {product.images?.[0] ? <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="flex-1">
                    <div className="text-[1.3rem] font-bold">{product.title || "Sản phẩm EcoTrade"}</div>
                    <div className="text-base text-muted-foreground">{product.conditionStatus || "Tình trạng tốt"}</div>
                    <div className="mt-1 text-base font-semibold text-success">SL: 1</div>
                  </div>
                  <div className="text-right text-[1.7rem] font-extrabold">{formatPrice(order.totalAmount || order.productPrice)}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[1.7rem]">Tiến độ vận chuyển</CardTitle>
              </CardHeader>
              <CardContent className="space-y-7">
                {history.length === 0 ? (
                  <div className="text-muted-foreground">Chưa có lịch sử trạng thái.</div>
                ) : history.map((item, index) => {
                  const itemInfo = getDeliveryStatusInfo(item.status);
                  return (
                    <div key={`${item.status}-${index}`} className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="rounded-full bg-success-soft p-3 text-success"><Clock3 className="h-5 w-5" /></div>
                        <div>
                          <div className="text-[1.25rem] font-bold">{itemInfo.label}</div>
                          <div className="text-base text-muted-foreground">{item.note || "Cập nhật delivery"}</div>
                          <div className="mt-1 text-sm text-muted-foreground">{formatDateTime(item.timestamp)}</div>
                        </div>
                      </div>
                      <Badge variant={itemInfo.variant}>{itemInfo.label}</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {pickupInspection ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-[1.6rem]">Kết quả kiểm tra</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Kết quả</span><span className="font-semibold">{pickupInspection.result}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Đúng sản phẩm</span><span>{pickupInspection.isCorrectProduct ? "Có" : "Không"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Đúng hình ảnh</span><span>{pickupInspection.isCorrectImage ? "Có" : "Không"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Đúng model</span><span>{pickupInspection.isCorrectModel ? "Có" : "Không"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Đúng tình trạng</span><span>{pickupInspection.isCorrectCondition ? "Có" : "Không"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Đủ phụ kiện</span><span>{pickupInspection.isAccessoriesEnough ? "Có" : "Không"}</span></div>
                </CardContent>
              </Card>
            ) : null}

            {delivery.failureReason ? (
              <Card className="border-danger/20 bg-danger-soft/40">
                <CardContent className="flex items-start gap-4 pt-6">
                  <div className="rounded-full bg-danger-soft p-3 text-danger"><AlertTriangle className="h-5 w-5" /></div>
                  <div>
                    <div className="text-[1.2rem] font-bold text-danger">Lý do thất bại</div>
                    <div className="mt-1 text-sm text-danger">{delivery.failureReason}</div>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle className="text-[1.6rem]">Thông tin nhanh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 text-success" /><span>{delivery.pickupAddress}</span></div>
                <div className="flex items-start gap-3"><Truck className="mt-0.5 h-4 w-4 text-sky" /><span>{delivery.deliveryAddress}</span></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ShipperLayout>
  );
}
