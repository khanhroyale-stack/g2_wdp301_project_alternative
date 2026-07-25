import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, MapPin, Navigation, Package, Package2, ShieldCheck, Truck } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import ShipperLayout from "../../components/shipper/ShipperLayout";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import useRealtimeRefresh from "../../hooks/useRealtimeRefresh";
import { getDeliveryStatusInfo, normalizeVietnameseNote, buildDeliveryTimeline } from "../../lib/orderFlow";
import { formatDateTime, formatPrice } from "../../lib/utils";
import deliveryService from "../../services/delivery.service";

const nextActionMap = {
  accepted: { label: "Đang đến lấy hàng", nextStatus: "picking_up", variant: "sky", opensInspection: true },
  picked_up: { label: "Bắt đầu giao hàng", nextStatus: "in_transit", variant: "sky" },
  received: { label: "Bắt đầu giao hàng", nextStatus: "in_transit", variant: "sky" },
  in_transit: { label: "Đã giao thành công", nextStatus: "delivered", variant: "success" },
};

const inspectionCheckRows = [
  ["isCorrectProduct", "Đúng sản phẩm"],
  ["isCorrectCategoryBrandModel", "Đúng danh mục/thương hiệu/model"],
  ["isCorrectCondition", "Đúng tình trạng mô tả"],
  ["isCorrectQuantity", "Đúng số lượng"],
  ["isCorrectColorSizeVersion", "Đúng màu/kích thước/phiên bản"],
  ["isAccessoriesEnough", "Đủ phụ kiện"],
  ["hasNoNewDamage", "Không hư hỏng phát sinh"],
  ["hasNoCounterfeitSigns", "Không nghi ngờ hàng giả"],
  ["isSerialMatched", "IMEI/Serial khớp"],
  ["isCorrectImage", "Khớp ảnh đăng bán"],
  ["isBasicFunctionWorking", "Hoạt động cơ bản"],
];

const getStepIcon = (status = "") => {
  const s = String(status).toUpperCase();
  if (s === "WAITING_SHIPPER" || s === "PENDING") {
    return { Icon: Package, bg: "bg-warning/15 text-warning border border-warning/30" };
  }
  if (s === "SHIPPER_ACCEPTED" || s === "ACCEPTED") {
    return { Icon: Truck, bg: "bg-sky/15 text-sky border border-sky/30" };
  }
  if (s === "PICKING_UP" || s === "PICKED_UP") {
    return { Icon: Navigation, bg: "bg-primary/15 text-primary border border-primary/30" };
  }
  if (s === "READY_FOR_DELIVERY" || s === "RECEIVED") {
    return { Icon: ShieldCheck, bg: "bg-teal-500/15 text-teal-600 border border-teal-500/30" };
  }
  if (s === "DELIVERING" || s === "IN_TRANSIT" || s === "SHIPPING") {
    return { Icon: Truck, bg: "bg-blue-500/15 text-blue-600 border border-blue-500/30" };
  }
  if (s === "DELIVERED" || s === "COMPLETED") {
    return { Icon: CheckCircle2, bg: "bg-success/15 text-success border border-success/30" };
  }
  if (s === "FAILED" || s === "INSPECTION_FAILED" || s === "CANCELLED") {
    return { Icon: AlertTriangle, bg: "bg-danger/15 text-danger border border-danger/30" };
  }
  return { Icon: Clock3, bg: "bg-muted text-muted-foreground border border-border" };
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
      toast.error(error.response?.data?.message || "Không thể tải vận đơn.");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchDelivery();
  }, [fetchDelivery]);
  useRealtimeRefresh("delivery", fetchDelivery);

  const handleNextAction = async () => {
    if (!nextAction) return;

    setUpdating(true);
    try {
      const res = await deliveryService.updateDeliveryStatus(id, nextAction.nextStatus);
      if (res.success && nextAction.opensInspection) {
        navigate(`/shipper/don/${id}/inspection`);
        return;
      }
      if (res.success) {
        await fetchDelivery();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể cập nhật trạng thái.");
    } finally {
      setUpdating(false);
    }
  };

  const history = useMemo(() => delivery?.history || [], [delivery]);
  const timelineSteps = useMemo(() => buildDeliveryTimeline(delivery), [delivery]);

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
  const mustInspect = ["picking_up", "picked_up", "ready_for_delivery", "inspection_failed"].includes(delivery.deliveryStatus);

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
            {!(["delivered", "completed", "inspection_failed", "failed"].includes(delivery.deliveryStatus)) && (
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
            {nextAction && (!mustInspect || pickupInspection?.result === "passed" || nextAction.opensInspection) && (
              <Button
                variant={nextAction.variant === "default" ? undefined : nextAction.variant}
                size="lg"
                onClick={handleNextAction}
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
                      Khi đến điểm lấy hàng, shipper phải lập biên bản kiểm tra trước khi nhận hàng từ seller. Chỉ khi kiểm tra đạt, hệ thống mới xác nhận đã lấy hàng và cho phép bắt đầu giao.
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
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
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
                  <div className="flex-1 min-w-0 space-y-3">
                    <div>
                      <h4 className="text-lg font-bold truncate">
                        {product.title || "Sản phẩm EcoTrade"}
                      </h4>
                      <p className="text-muted-foreground text-sm mt-0.5">
                        Tình trạng: <span className="font-medium text-on-surface">{product.conditionStatus === "new" ? "Mới 100%" : product.conditionStatus === "good" ? "Đã sử dụng - Còn tốt" : product.conditionStatus || "Tốt"}</span>
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="rounded-xl bg-muted/40 px-3 py-2.5">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Mã đơn</p>
                        <p className="text-sm font-bold text-on-surface">#{String(order._id || "").slice(-8).toUpperCase()}</p>
                      </div>
                      <div className="rounded-xl bg-muted/40 px-3 py-2.5">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">SKU sản phẩm</p>
                        <p className="text-sm font-bold text-on-surface">#{String(product._id || "").slice(-8).toUpperCase()}</p>
                      </div>
                      <div className="rounded-xl bg-muted/40 px-3 py-2.5">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Số lượng</p>
                        <p className="text-sm font-bold text-on-surface">{order.quantity || 1} sản phẩm</p>
                      </div>
                      <div className="rounded-xl bg-muted/40 px-3 py-2.5">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Thanh toán</p>
                        <p className="text-sm font-bold text-on-surface">{order.paymentMethod || "COD"}</p>
                      </div>
                      <div className="rounded-xl bg-muted/40 px-3 py-2.5">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Phí giao hàng</p>
                        <p className="text-sm font-bold text-success">{formatPrice(delivery.deliveryFee || 0)}</p>
                      </div>
                      <div className="rounded-xl bg-muted/40 px-3 py-2.5">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Loại giao</p>
                        <p className="text-sm font-bold text-on-surface capitalize">{delivery.deliveryType || "Standard"}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-border">
                      <span className="text-sm text-muted-foreground">Tổng giá trị đơn</span>
                      <p className="text-2xl font-extrabold text-primary">
                        {formatPrice(order.totalAmount || order.productPrice)}
                      </p>
                    </div>
                    {order.buyerNote && (
                      <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 px-3 py-2.5">
                        <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Ghi chú người mua</p>
                        <p className="text-sm text-on-surface leading-relaxed">{order.buyerNote}</p>
                      </div>
                    )}
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
                {timelineSteps.length === 0 ? (
                  <p className="text-muted-foreground py-4">Chưa có lịch sử trạng thái.</p>
                ) : (
                  <div className="space-y-5">
                    {timelineSteps.map((item, index) => {
                      const { Icon: StepIcon, bg: stepBg } = getStepIcon(item.status);
                      return (
                        <div
                          key={`${item.status}-${index}`}
                          className="flex items-start gap-4"
                        >
                          <div className="mt-1">
                            <div className={`p-2 rounded-full ${stepBg}`}>
                              <StepIcon className="h-4 w-4" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-base">{item.label}</p>
                              <Badge variant={item.variant} className="shrink-0">
                                {item.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.note || "Cập nhật tiến độ vận chuyển"}
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
                  {inspectionCheckRows.map(([key, label], index) => {
                    const value = key === "isCorrectCategoryBrandModel"
                      ? pickupInspection.isCorrectCategoryBrandModel ?? pickupInspection.isCorrectModel
                      : pickupInspection[key];
                    return (
                      <div key={key} className={`flex items-center justify-between gap-3 py-2 ${index < inspectionCheckRows.length - 1 ? "border-b border-border" : ""}`}>
                        <span className="text-muted-foreground">{label}</span>
                        <span className={value === false ? "font-semibold text-danger" : "font-semibold text-success"}>
                          {value === false ? "FAIL" : "PASS"}
                        </span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ShipperLayout>
  );
}
