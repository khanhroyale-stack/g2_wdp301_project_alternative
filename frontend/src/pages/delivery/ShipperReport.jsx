import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ShipperLayout from "../../components/shipper/ShipperLayout";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Textarea } from "../../components/ui/textarea";
import deliveryService from "../../services/delivery.service";
import shipperReportService from "../../services/shipper-report.service";

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
      const res = await shipperReportService.create({ deliveryId: id, issueType, description });
      if (res.success) navigate(`/shipper/don/${id}`);
    } catch (error) {
      alert(error.response?.data?.message || "Không thể gửi báo cáo sự cố.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ShipperLayout>
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl">Báo cáo sự cố giao hàng</CardTitle>
          <p className="text-muted-foreground">Vận đơn #{String(delivery?._id || id).slice(-8).toUpperCase()}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-2">
              <label className="font-semibold">Loại sự cố</label>
              <select value={issueType} onChange={(event) => setIssueType(event.target.value)} className="w-full rounded-xl border border-border bg-white px-4 py-3">
                {ISSUE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="font-semibold">Mô tả chi tiết</label>
              <Textarea value={description} onChange={(event) => setDescription(event.target.value)} required className="min-h-40" placeholder="Mô tả thời gian, địa điểm và tình trạng hiện tại..." />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Quay lại</Button>
              <Button type="submit" disabled={submitting || !description.trim()}>{submitting ? "Đang gửi..." : "Gửi báo cáo"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </ShipperLayout>
  );
}
