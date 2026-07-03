import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ShipperLayout from "../../components/shipper/ShipperLayout";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Textarea } from "../../components/ui/textarea";
import deliveryService from "../../services/delivery.service";
import shipperReportService from "../../services/shipper-report.service";
import { ArrowLeft } from "lucide-react";

const ISSUE_OPTIONS = [
  ["buyer_unavailable", "Không liên hệ được buyer"],
  ["wrong_address", "Sai địa chỉ giao hàng"],
  ["seller_unavailable", "Seller không giao hàng"],
  ["product_damaged", "Sản phẩm hư hỏng"],
  ["vehicle_issue", "Sự cố phương tiện"],
  ["other", "Sự cố khác"],
];

export default function ShipperReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState(null);
  const [issueType, setIssueType] = useState("buyer_unavailable");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    deliveryService.getDeliveryById(id).then((res) => res.success && setDelivery(res.data)).catch(() => navigate(-1));
  }, [id, navigate]);

  const submit = async (event) => {
    event.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      await shipperReportService.create({ deliveryId: id, issueType, description });
      await deliveryService.updateDeliveryStatus(id, "failed", { failureReason: description });
      navigate(`/shipper/don/${id}`);
    } catch (error) {
      alert(error.response?.data?.message || "Không thể gửi báo cáo sự cố.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ShipperLayout>
      <div className="max-w-2xl mx-auto w-full">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6 pl-0"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>

        <Card>
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-extrabold">
              Báo cáo sự cố giao hàng
            </CardTitle>
            <p className="text-muted-foreground">
              Vận đơn #{String(delivery?._id || id).slice(-8).toUpperCase()}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-6">
              {/* Issue Type */}
              <div className="space-y-3">
                <label className="text-sm font-semibold flex items-center gap-1">
                  Loại sự cố
                  <span className="text-destructive">*</span>
                </label>
                <select
                  value={issueType}
                  onChange={(event) => setIssueType(event.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                >
                  {ISSUE_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <label className="text-sm font-semibold flex items-center gap-1">
                  Mô tả chi tiết
                  <span className="text-destructive">*</span>
                </label>
                <Textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  required
                  className="min-h-[140px] resize-none"
                  placeholder="Mô tả thời gian, địa điểm và tình trạng hiện tại..."
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  disabled={submitting}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !description.trim()}
                  className="min-w-[140px]"
                >
                  {submitting ? "Đang gửi..." : "Gửi báo cáo"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ShipperLayout>
  );
}
