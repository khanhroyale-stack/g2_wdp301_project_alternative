import { useEffect, useState } from "react";
import { ArrowLeft, Camera, CircleAlert, ImagePlus, Info, ShieldCheck } from "lucide-react";
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

export default function DeliveryInspection() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [delivery, setDelivery] = useState(null);
  const [inspection, setInspection] = useState(null);
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState({
    isMatchDescription: true,
    conditionNote: "",
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
              isMatchDescription: inspectionRes.data.isMatchDescription !== false,
              conditionNote: inspectionRes.data.conditionNote || "",
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
        alert(error.response?.data?.message || "Không thể tải biên bản kiểm tra");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    fetchSource();
  }, [id, location.pathname, navigate]);

  const handleFileChange = (event) => {
    const selected = Array.from(event.target.files || []).slice(0, 4);
    const nextFiles = selected.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setFiles(nextFiles);
  };

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
        isMatchDescription: form.isMatchDescription,
      });
      if (res.success) navigate(`/deliveries/${id}`);
    } catch (error) {
      alert(error.response?.data?.message || "Không thể lưu biên bản");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <EcoTradeLayout>
        <div className="flex min-h-[70vh] items-center justify-center text-lg font-medium text-muted-foreground">Đang tải biên bản kiểm tra...</div>
      </EcoTradeLayout>
    );
  }

  if (!delivery) return null;

  const order = delivery.orderId || {};
  const product = order.postId || {};

  return (
    <EcoTradeLayout>
      <div className="w-full">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <Link to={`/deliveries/${delivery._id}`} className="mt-2 rounded-full border border-border p-2 text-muted-foreground transition hover:bg-muted">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-[2.9rem]">Biên Bản Kiểm Tra</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-lg text-muted-foreground">
                <Badge variant="outline">#{String(id).slice(-6).toUpperCase()}</Badge>
                <span>•</span>
                <span>Đang kiểm tra hiện trạng bàn giao</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-lg">
            <Info className="h-5 w-5" />
            Yêu cầu tối thiểu 2 ảnh
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
                <span>Người bán: {order.sellerId?.fullName || "Minh Trần"}</span>
                <span>Phí vận chuyển: {formatPrice(delivery.deliveryFee)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[2rem]">Chi tiết kiểm định</CardTitle>
            <p className="text-lg text-muted-foreground">Vui lòng xác nhận tình trạng thực tế của sản phẩm trước khi giao.</p>
          </CardHeader>
          <CardContent className="space-y-7">
            <div className="rounded-[24px] bg-muted p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[1.35rem] font-bold">Khớp với mô tả người bán</div>
                  <div className="mt-1 text-base text-muted-foreground">Sản phẩm không có hư hỏng ngoài mô tả ban đầu.</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xl font-extrabold">{form.isMatchDescription ? "ĐÚNG" : "KHÔNG"}</span>
                  <Switch checked={form.isMatchDescription} onCheckedChange={(checked) => setForm({ ...form, isMatchDescription: checked })} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[1.1rem] font-semibold">Ghi chú tình trạng sản phẩm</label>
              <Textarea
                value={form.conditionNote}
                onChange={(e) => setForm({ ...form, conditionNote: e.target.value })}
                placeholder="Ví dụ: Sản phẩm có vết xước nhẹ ở chân trái, đóng gói cẩn thận bằng xốp nổ..."
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="text-[1.1rem] font-semibold">Ảnh chụp hiện trạng (Tối thiểu 2 ảnh)</label>
                <div className="text-sm italic text-muted-foreground">Yêu cầu ảnh rõ nét, đủ sáng</div>
              </div>
              <label className="block cursor-pointer">
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {["Mặt trước", "Mặt sau", "Chi tiết lỗi", "Góc nghiêng"].map((slot, index) => {
                    const current = files[index];
                    return (
                      <div key={slot} className="relative flex h-[140px] flex-col items-center justify-center overflow-hidden rounded-[22px] border border-dashed border-border bg-white">
                        {current ? <img src={current.preview} alt={slot} className="absolute inset-0 h-full w-full object-cover" /> : null}
                        <div className={`absolute inset-x-0 bottom-0 px-3 py-2 text-center text-sm font-semibold ${current ? "bg-black/55 text-white" : "text-muted-foreground"}`}>
                          {current ? slot : null}
                        </div>
                        {!current ? (
                          <div className="flex flex-col items-center gap-3 text-muted-foreground">
                            <div className="rounded-full bg-muted p-4">
                              <Camera className="h-6 w-6" />
                            </div>
                            <span>{slot}</span>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </label>
            </div>

            <div className="border-t border-border pt-6">
              <div className="mb-5 flex items-start justify-center gap-3 text-sm text-muted-foreground">
                <CircleAlert className="mt-0.5 h-4 w-4" />
                Bằng việc nhấn "Lưu biên bản", bạn xác nhận đã kiểm tra kỹ sản phẩm.
              </div>
              <Button size="lg" className="w-full text-[1.25rem]" onClick={handleSubmit} disabled={submitting}>
                {inspection ? "Quay lại vận đơn" : submitting ? "Đang lưu..." : "Lưu Biên Bản"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Card>
            <CardContent className="flex items-start gap-4 pt-6">
              <div className="rounded-full bg-success-soft p-3 text-success"><ImagePlus className="h-5 w-5" /></div>
              <div>
                <div className="text-[1.35rem] font-bold">Chụp ảnh rõ nét</div>
                <div className="mt-1 text-base leading-7 text-muted-foreground">Luôn đảm bảo ảnh chụp không bị rung mờ để bảo vệ quyền lợi của bạn khi có khiếu nại.</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start gap-4 pt-6">
              <div className="rounded-full bg-sky-soft p-3 text-sky"><Info className="h-5 w-5" /></div>
              <div>
                <div className="text-[1.35rem] font-bold">Báo cáo bất thường</div>
                <div className="mt-1 text-base leading-7 text-muted-foreground">Nếu sản phẩm hư hỏng nặng, hãy liên hệ ngay với bộ phận hỗ trợ trước khi tiếp tục giao.</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </EcoTradeLayout>
  );
}
