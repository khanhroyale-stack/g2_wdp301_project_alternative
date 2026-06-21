import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, MapPin, Package2, ShieldCheck, Truck, User } from "lucide-react";
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
  picked_up: { label: "Bắt đầu giao hàng", nextStatus: "in_transit", variant: "sky" },
  in_transit: { label: "Đã giao thành công", nextStatus: "delivered", variant: "success" },
};

export default function DeliveryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [delivery, setDelivery] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchDelivery = useCallback(async () => {
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
  }, [id, navigate]);

  useEffect(() => {
    fetchDelivery();
  }, [fetchDelivery]);

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

  const history = useMemo(() => delivery?.history || [], [delivery]);

  if (loading) {
    return (
      <ShipperLayout>
        <div className="flex min-h-[70vh] items-center justify-center text-lg font-medium text-muted-foreground">
          Đang tải chi tiết vận đơn...
        </div>
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
      <div className="max-w-7xl mx-auto w-full space-y-8 pb-8">
        {/* Header Section */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-primary/10 p-4 text-primary">
              <Truck className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight">
                  Vận đơn #{String(delivery._id).slice(-8).toUpperCase()}
                </h1>
                <Badge variant={statusInfo.variant} className="text-sm px-3 py-1">
                  {statusInfo.label}
                </Badge>
              </div>
              <p className="text-lg text-muted-foreground">
                Tạo lúc: {formatDateTime(delivery.createdAt)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {!(["delivered", "completed", "failed"].includes(delivery.deliveryStatus)) && (
              <Button asChild variant="outline" size="lg">
                <Link to={`/shipper/don/${delivery._id}/bao-cao`}>Báo cáo sự cố</Link>
              </Button>
            )}
            {mustInspect && (
              <Button asChild size="lg">
                <Link to={pickupInspection ? `/shipper/inspection/${pickupInspection._id}` : `/shipper/don/${delivery._id}/inspection`}>
                  {pickupInspection ? "Xem biên bản" : "Mở biên bản"}
                </Link>
              </Button>
            )}
            {nextAction && (!mustInspect || pickupInspection?.result === "passed") && (
              <Button
                variant={nextAction.variant === "default" ? undefined : nextAction.variant}
                size="lg"
                onClick={() => updateStatus(nextAction.nextStatus)}
                disabled={updating}
                className="min-w-[180px]"
              >
                {updating ? "Đang xử lý..." : nextAction.label}
              </Button>
            )}
          </div>
        </div>

        {/* Top Section: Pickup & Delivery Addresses */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pickup Address */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-warning/10 text-warning">
                  <MapPin className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl font-bold">Điểm lấy hàng (Seller)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {(order.sellerId?.fullName || "N").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">
                    {order.sellerId?.fullName || "Người bán"}
                  </p>
                  <p className="text-muted-foreground">
                    {order.sellerId?.phone || "Chưa có số điện thoại"}
                  </p>
                </div>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 border border-dashed border-border">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Địa chỉ chi tiết
                </p>
                <p className="font-medium leading-relaxed">
                  {delivery.pickupAddress || order.sellerId?.address || "Chưa cập nhật"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-success/10 text-success">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl font-bold">Điểm giao hàng (Buyer)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {(order.buyerId?.fullName || "N").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">
                    {order.buyerId?.fullName || "Người mua"}
                  </p>
                  <p className="text-muted-foreground">
                    {order.buyerId?.phone || "Chưa có số điện thoại"}
                  </p>
                </div>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 border border-dashed border-border">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Địa chỉ chi tiết
                </p>
                <p className="font-medium leading-relaxed">
                  {delivery.deliveryAddress || order.buyerId?.address || "Chưa cập nhật"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inspection Reminder (if applicable) */}
        {mustInspect && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/10 text-primary shrink-0">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-primary">
                      Kiểm tra trước khi giao
                    </h3>
                    <p className="text-muted-foreground mt-1 max-w-2xl">
                      Sau khi đã lấy hàng, shipper phải lập biên bản kiểm tra. Chỉ khi kiểm tra đạt, hệ thống mới cho phép bắt đầu giao hàng.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bottom Section: Product & History */}
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
          {/* Left Column: Product & Timeline */}
          <div className="space-y-6">
            {/* Product Info */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Package2 className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-xl font-bold">Chi tiết đơn hàng</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                        <Package2 className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold truncate">
                      {product.title || "Sản phẩm EcoTrade"}
                    </h4>
                    <p className="text-muted-foreground text-sm mt-1">
                      {product.conditionStatus || "Tình trạng tốt"}
                    </p>
                    <p className="text-sm font-semibold text-success mt-1">
                      Số lượng: 1
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-extrabold text-primary">
                      {formatPrice(order.totalAmount || order.productPrice)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Timeline */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-xl font-bold">Tiến độ vận chuyển</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-muted-foreground py-4">Chưa có lịch sử trạng thái.</p>
                ) : (
                  <div className="space-y-5">
                    {history.map((item, index) => {
                      const itemInfo = getDeliveryStatusInfo(item.status);
                      return (
                        <div
                          key={`${item.status}-${index}`}
                          className="flex items-start gap-4"
                        >
                          <div className="mt-1">
                            <div className={`p-2 rounded-full ${item.status === "delivered" || item.status === "completed"
                                ? "bg-success/10 text-success"
                                : item.status === "failed"
                                  ? "bg-danger/10 text-danger"
                                  : "bg-muted"
                              }`}>
                              <Clock3 className="h-4 w-4" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-base">{itemInfo.label}</p>
                              <Badge variant={itemInfo.variant} className="shrink-0">
                                {itemInfo.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.note || "Cập nhật delivery"}
                            </p>
                            <p className="text-xs text-muted-foreground/80 mt-1">
                              {formatDateTime(item.timestamp)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Side Cards */}
          <div className="space-y-6">
            {/* Failure Reason (if failed) */}
            {delivery.failureReason && (
              <Card className="border-danger/20 bg-danger-soft/40">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-danger-soft text-danger shrink-0">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-danger">Lý do thất bại</h3>
                      <p className="text-sm text-danger/90 mt-1 leading-relaxed">
                        {delivery.failureReason}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Inspection Results (if exists) */}
            {pickupInspection && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-xl font-bold">Kết quả kiểm tra</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Kết quả</span>
                    <span className={`font-bold ${pickupInspection.result === "passed" ? "text-success" : "text-danger"
                      }`}>
                      {pickupInspection.result}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Đúng sản phẩm</span>
                    <span>{pickupInspection.isCorrectProduct ? "Có" : "Không"}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Đúng hình ảnh</span>
                    <span>{pickupInspection.isCorrectImage ? "Có" : "Không"}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Đúng model</span>
                    <span>{pickupInspection.isCorrectModel ? "Có" : "Không"}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Đúng tình trạng</span>
                    <span>{pickupInspection.isCorrectCondition ? "Có" : "Không"}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Đủ phụ kiện</span>
                    <span>{pickupInspection.isAccessoriesEnough ? "Có" : "Không"}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ShipperLayout>
  );
}
