import { useEffect, useState } from "react";
import { ArrowLeft, CircleAlert, Info, ShieldCheck } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import EcoTradeLayout from "../../components/ecotrade/EcoTradeLayout";
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
          <span className="text-lg font-extrabold">{checked ? "DAT" : "KHONG DAT"}</span>
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
        if (location.pathname.startsWith("/inspections/")) {
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
        alert(error.response?.data?.message || "Khong the tai bien ban kiem tra");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    fetchSource();
  }, [id, location.pathname, navigate]);

  const handleSubmit = async () => {
    if (inspection) {
      navigate(`/deliveries/${delivery?._id || delivery?.id}`);
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
      if (res.success) navigate(`/deliveries/${id}`);
    } catch (error) {
      alert(error.response?.data?.message || "Khong the luu bien ban");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <EcoTradeLayout>
        <div className="flex min-h-[70vh] items-center justify-center text-lg font-medium text-muted-foreground">Dang tai bien ban kiem tra...</div>
      </EcoTradeLayout>
    );
  }

  if (!delivery) return null;

  const order = delivery.orderId || {};
  const product = order.postId || {};
  const readOnly = Boolean(inspection);

  return (
    <EcoTradeLayout>
      <div className="w-full">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <Link to={`/deliveries/${delivery._id}`} className="mt-2 rounded-full border border-border p-2 text-muted-foreground transition hover:bg-muted">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-[2.9rem]">Bien ban kiem tra</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-lg text-muted-foreground">
                <Badge variant="outline">#{String(id).slice(-6).toUpperCase()}</Badge>
                <span>•</span>
                <span>Kiem tra san pham sau khi da lay hang tu seller</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-lg">
            <Info className="h-5 w-5" />
            Inspection la buoc bat buoc truoc khi giao
          </div>
        </div>

        <Card className="mb-6 border-success/20 bg-[#f3fcf7]">
          <CardContent className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center">
            <div className="h-20 w-20 overflow-hidden rounded-[18px] bg-muted">
              {product.images?.[0] ? <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" /> : null}
            </div>
            <div className="flex-1">
              <div className="text-[1.55rem] font-extrabold text-success">{product.title || "San pham EcoTrade"}</div>
              <div className="mt-1 flex flex-wrap gap-5 text-base text-muted-foreground">
                <span>Nguoi ban: {order.sellerId?.fullName || "Seller"}</span>
                <span>Phi van chuyen: {formatPrice(delivery.deliveryFee)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[2rem]">Chi tiet kiem dinh</CardTitle>
            <p className="text-lg text-muted-foreground">Shipper can xac nhan dung san pham, dung hinh anh, dung model, dung tinh trang va du phu kien.</p>
          </CardHeader>
          <CardContent className="space-y-7">
            <CheckRow label="Dung san pham?" checked={form.isCorrectProduct} onChange={(value) => setForm((prev) => ({ ...prev, isCorrectProduct: value }))} disabled={readOnly} />
            <CheckRow label="Dung hinh anh?" checked={form.isCorrectImage} onChange={(value) => setForm((prev) => ({ ...prev, isCorrectImage: value }))} disabled={readOnly} />
            <CheckRow label="Dung model?" checked={form.isCorrectModel} onChange={(value) => setForm((prev) => ({ ...prev, isCorrectModel: value }))} disabled={readOnly} />
            <CheckRow label="Dung tinh trang?" checked={form.isCorrectCondition} onChange={(value) => setForm((prev) => ({ ...prev, isCorrectCondition: value }))} disabled={readOnly} />
            <CheckRow label="Du phu kien?" checked={form.isAccessoriesEnough} onChange={(value) => setForm((prev) => ({ ...prev, isAccessoriesEnough: value }))} disabled={readOnly} />

            <div className="space-y-3">
              <label className="text-[1.1rem] font-semibold">Ket luan inspection</label>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  { value: "passed", label: "Passed", variant: "success" },
                  { value: "failed_seller_fault", label: "Failed do seller", variant: "warning" },
                  { value: "failed_shipper_fault", label: "Failed do shipper", variant: "danger" },
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
              <label className="text-[1.1rem] font-semibold">Ghi chu tinh trang san pham</label>
              <Textarea
                value={form.conditionNote}
                onChange={(e) => setForm({ ...form, conditionNote: e.target.value })}
                placeholder="Mo ta tinh trang thuc te, loi neu co, cac diem can luu y khi giao."
                className="min-h-[120px]"
                disabled={readOnly}
              />
            </div>

            <div className="border-t border-border pt-6">
              <div className="mb-5 flex items-start justify-center gap-3 text-sm text-muted-foreground">
                <CircleAlert className="mt-0.5 h-4 w-4" />
                Bang viec luu bien ban, shipper xac nhan ket qua inspection va chap nhan tiep tuc hoac dung luong giao.
              </div>
              <Button size="lg" className="w-full text-[1.25rem]" onClick={handleSubmit} disabled={submitting}>
                {inspection ? "Quay lai van don" : submitting ? "Dang luu..." : "Luu bien ban kiem tra"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Card>
            <CardContent className="flex items-start gap-4 pt-6">
              <div className="rounded-full bg-success-soft p-3 text-success"><ShieldCheck className="h-5 w-5" /></div>
              <div>
                <div className="text-[1.35rem] font-bold">Khi inspection dat</div>
                <div className="mt-1 text-base leading-7 text-muted-foreground">Shipper se duoc phep quay lai van don va chuyen tiep sang buoc bat dau giao hang.</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start gap-4 pt-6">
              <div className="rounded-full bg-sky-soft p-3 text-sky"><Info className="h-5 w-5" /></div>
              <div>
                <div className="text-[1.35rem] font-bold">Khi inspection that bai</div>
                <div className="mt-1 text-base leading-7 text-muted-foreground">He thong se dung delivery va dong bo trang thai order de buyer/seller nhin thay ngay tren man chi tiet.</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </EcoTradeLayout>
  );
}
