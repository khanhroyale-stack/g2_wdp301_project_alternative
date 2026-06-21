import { useEffect, useState } from "react";
import { ArrowLeft, CircleAlert, Info, ShieldCheck } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import ShipperLayout from "../../components/shipper/ShipperLayout";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Switch } from "../../components/ui/switch";
import { Textarea } from "../../components/ui/textarea";
import deliveryService from "../../services/delivery.service";
import inspectionService from "../../services/inspection.service";
import { formatPrice } from "../../lib/utils";

function CheckRow({ label, checked, onChange, disabled }) {
  return (
    <div className="rounded-[24px] bg-muted p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-[1.15rem] font-bold">{label}</div>
        <div className="flex items-center gap-4">
          <span className="text-lg font-extrabold">{checked ? "ĐẠT" : "KHÔNG ĐẠT"}</span>
          <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
        </div>
      </div>
    </div>
  );
}

export default function DeliveryInspection() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [delivery, setDelivery] = useState(null);
  const [inspection, setInspection] = useState(null);
  const [form, setForm] = useState({
    isCorrectProduct: true,
    isCorrectImage: true,
    isCorrectModel: true,
    isCorrectCondition: true,
    isAccessoriesEnough: true,
    conditionNote: "",
    result: "passed",
  });

  useEffect(() => {
    const fetchSource = async () => {
      setLoading(true);
      try {
        if (location.pathname.startsWith("/shipper/inspection/")) {
          const inspectionRes = await inspectionService.getInspectionById(id);
          if (inspectionRes.success) {
            setInspection(inspectionRes.data);
            setForm({
              isCorrectProduct: inspectionRes.data.isCorrectProduct !== false,
              isCorrectImage: inspectionRes.data.isCorrectImage !== false,
              isCorrectModel: inspectionRes.data.isCorrectModel !== false,
              isCorrectCondition: inspectionRes.data.isCorrectCondition !== false,
              isAccessoriesEnough: inspectionRes.data.isAccessoriesEnough !== false,
              conditionNote: inspectionRes.data.conditionNote || "",
              result: inspectionRes.data.result || "passed",
            });

            const deliveryId = inspectionRes.data.deliveryId?._id || inspectionRes.data.deliveryId;
            if (deliveryId) {
              const deliveryRes = await deliveryService.getDeliveryById(deliveryId);
              if (deliveryRes.success) setDelivery(deliveryRes.data);
            }
          }
        } else {
          const res = await deliveryService.getDeliveryById(id);
          if (res.success) setDelivery(res.data);
        }
      } catch (error) {
        alert(error.response?.data?.message || "Không thể tải biên bản kiểm tra.");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    fetchSource();
  }, [id, location.pathname, navigate]);

  const handleSubmit = async () => {
    if (inspection) {
      navigate(`/shipper/don/${delivery?._id || delivery?.id}`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await inspectionService.createInspection({
        deliveryId: id,
        inspectionType: "pickup",
        conditionNote: form.conditionNote,
        isMatchDescription: form.result === "passed",
        isDamagedByShipper: form.result === "failed_shipper_fault",
        isCorrectProduct: form.isCorrectProduct,
        isCorrectImage: form.isCorrectImage,
        isCorrectModel: form.isCorrectModel,
        isCorrectCondition: form.isCorrectCondition,
        isAccessoriesEnough: form.isAccessoriesEnough,
        result: form.result,
      });
      if (res.success) navigate(`/shipper/don/${id}`);
    } catch (error) {
      alert(error.response?.data?.message || "Không thể lưu biên bản.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ShipperLayout>
        <div className="flex min-h-[70vh] items-center justify-center text-lg font-medium text-muted-foreground">Đang tải biên bản kiểm tra...</div>
      </ShipperLayout>
    );
  }

  if (!delivery) return null;

  const order = delivery.orderId || {};
  const product = order.postId || {};
  const readOnly = Boolean(inspection);

  return (
    <ShipperLayout>
      <div className="w-full">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <Link to={`/shipper/don/${delivery._id}`} className="mt-2 rounded-full border border-border p-2 text-muted-foreground transition hover:bg-muted">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-[2.9rem]">Biên bản kiểm tra</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-lg text-muted-foreground">
                <Badge variant="outline">#{String(id).slice(-6).toUpperCase()}</Badge>
                <span>•</span>
                <span>Kiểm tra sản phẩm sau khi đã lấy hàng từ seller</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-lg">
            <Info className="h-5 w-5" />
            Đây là bước bắt buộc trước khi giao
          </div>
        </div>

        <Card className="mb-6 border-success/20 bg-[#f3fcf7]">
          <CardContent className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center">
            <div className="h-20 w-20 overflow-hidden rounded-[18px] bg-muted">
              {product.images?.[0] ? <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" /> : null}
            </div>
            <div className="flex-1">
              <div className="text-[1.55rem] font-extrabold text-success">{product.title || "Sản phẩm EcoTrade"}</div>
              <div className="mt-1 flex flex-wrap gap-5 text-base text-muted-foreground">
                <span>Người bán: {order.sellerId?.fullName || "Seller"}</span>
                <span>Phí vận chuyển: {formatPrice(delivery.deliveryFee)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[2rem]">Chi tiết kiểm định</CardTitle>
            <p className="text-lg text-muted-foreground">Shipper cần xác nhận đúng sản phẩm, đúng hình ảnh, đúng model, đúng tình trạng và đủ phụ kiện.</p>
          </CardHeader>
          <CardContent className="space-y-7">
            <CheckRow label="Đúng sản phẩm?" checked={form.isCorrectProduct} onChange={(value) => setForm((prev) => ({ ...prev, isCorrectProduct: value }))} disabled={readOnly} />
            <CheckRow label="Đúng hình ảnh?" checked={form.isCorrectImage} onChange={(value) => setForm((prev) => ({ ...prev, isCorrectImage: value }))} disabled={readOnly} />
            <CheckRow label="Đúng model?" checked={form.isCorrectModel} onChange={(value) => setForm((prev) => ({ ...prev, isCorrectModel: value }))} disabled={readOnly} />
            <CheckRow label="Đúng tình trạng?" checked={form.isCorrectCondition} onChange={(value) => setForm((prev) => ({ ...prev, isCorrectCondition: value }))} disabled={readOnly} />
            <CheckRow label="Đủ phụ kiện?" checked={form.isAccessoriesEnough} onChange={(value) => setForm((prev) => ({ ...prev, isAccessoriesEnough: value }))} disabled={readOnly} />

            <div className="space-y-3">
              <label className="text-[1.1rem] font-semibold">Kết luận kiểm tra</label>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  { value: "passed", label: "Đạt", variant: "success" },
                  { value: "failed_seller_fault", label: "Lỗi từ seller", variant: "warning" },
                  { value: "failed_shipper_fault", label: "Lỗi từ shipper", variant: "danger" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={readOnly}
                    onClick={() => setForm((prev) => ({ ...prev, result: option.value }))}
                    className={`rounded-[20px] border px-4 py-4 text-left transition ${
                      form.result === option.value ? "border-success bg-success-soft" : "border-border bg-white"
                    } ${readOnly ? "cursor-default" : "cursor-pointer"}`}
                  >
                    <Badge variant={option.variant}>{option.label}</Badge>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[1.1rem] font-semibold">Ghi chú tình trạng sản phẩm</label>
              <Textarea
                value={form.conditionNote}
                onChange={(e) => setForm({ ...form, conditionNote: e.target.value })}
                placeholder="Mô tả tình trạng thực tế, lỗi nếu có, các điểm cần lưu ý khi giao."
                className="min-h-[120px]"
                disabled={readOnly}
              />
            </div>

            <div className="border-t border-border pt-6">
              <div className="mb-5 flex items-start justify-center gap-3 text-sm text-muted-foreground">
                <CircleAlert className="mt-0.5 h-4 w-4" />
                Bằng việc lưu biên bản, shipper xác nhận kết quả kiểm tra và chấp nhận tiếp tục hoặc dừng luồng giao.
              </div>
              <Button size="lg" className="w-full text-[1.25rem]" onClick={handleSubmit} disabled={submitting}>
                {inspection ? "Quay lại vận đơn" : submitting ? "Đang lưu..." : "Lưu biên bản kiểm tra"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Card>
            <CardContent className="flex items-start gap-4 pt-6">
              <div className="rounded-full bg-success-soft p-3 text-success"><ShieldCheck className="h-5 w-5" /></div>
              <div>
                <div className="text-[1.35rem] font-bold">Khi kiểm tra đạt</div>
                <div className="mt-1 text-base leading-7 text-muted-foreground">Shipper sẽ được phép quay lại vận đơn và chuyển tiếp sang bước bắt đầu giao hàng.</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start gap-4 pt-6">
              <div className="rounded-full bg-sky-soft p-3 text-sky"><Info className="h-5 w-5" /></div>
              <div>
                <div className="text-[1.35rem] font-bold">Khi kiểm tra thất bại</div>
                <div className="mt-1 text-base leading-7 text-muted-foreground">Hệ thống sẽ dừng delivery và đồng bộ trạng thái order để buyer hoặc seller nhìn thấy ngay trên màn chi tiết.</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ShipperLayout>
  );
}
