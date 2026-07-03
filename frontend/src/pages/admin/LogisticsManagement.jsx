import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import adminService from "../../services/admin.service";
import shipperReportService from "../../services/shipper-report.service";
import { formatDateTime } from "../../lib/utils";
import { getDeliveryStatusInfo } from "../../lib/orderFlow";

const CONFIG = {
  shippers: { title: "Quản lý shipper", description: "Theo dõi tài khoản và hiệu suất giao hàng." },
  deliveries: { title: "Lịch sử giao hàng", description: "Giám sát toàn bộ vòng đời delivery." },
  inspections: { title: "Biên bản kiểm định", description: "Theo dõi kết quả kiểm tra sản phẩm của shipper." },
  reports: { title: "Báo cáo giao hàng", description: "Tiếp nhận và xử lý sự cố do shipper báo cáo." },
};

export default function LogisticsManagement({ mode }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const config = CONFIG[mode];

  const load = async () => {
    setLoading(true);
    try {
      const response = mode === "shippers"
        ? await adminService.getShippers()
        : mode === "deliveries"
          ? await adminService.getDeliveries()
          : mode === "inspections"
            ? await adminService.getInspections()
            : await shipperReportService.getAdmin();
      if (response.success) setItems(response.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const resolveReport = async (id, status) => {
    await shipperReportService.resolve(id, { status });
    await load();
  };

  const toggleShipper = async (shipper) => {
    if (shipper.accountStatus === "banned") await adminService.unbanUser(shipper._id);
    else await adminService.banUser(shipper._id);
    await load();
  };

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <Sidebar variant="admin" />
      <main className="flex-1 px-4 py-10 md:ml-72 md:px-10">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold">{config.title}</h1>
          <p className="mt-2 text-muted-foreground">{config.description}</p>
          {loading ? <div className="py-20 text-center">Đang tải...</div> : (
            <div className="mt-8 space-y-4">
              {items.length === 0 ? <Card><CardContent className="py-16 text-center text-muted-foreground">Chưa có dữ liệu.</CardContent></Card> : null}
              {items.map((item) => (
                <Card key={item._id}>
                  <CardContent className="flex flex-col gap-4 pt-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 space-y-1">
                      {mode === "shippers" ? <>
                        <div className="text-lg font-bold">{item.fullName}</div>
                        <div className="text-sm text-muted-foreground">{item.email} · {item.phone || "Chưa có SĐT"}</div>
                        <div className="text-sm">Tổng đơn: {item.deliveryStats?.total || 0} · Thành công: {item.deliveryStats?.completed || 0} · Thất bại: {item.deliveryStats?.failed || 0}</div>
                      </> : null}
                      {mode === "deliveries" ? <>
                        <div className="text-lg font-bold">{item.orderId?.postId?.title || "Vận đơn"} #{String(item._id).slice(-8).toUpperCase()}</div>
                        <div className="text-sm text-muted-foreground">Shipper: {item.shipperId?.fullName || "Chưa có"} · {formatDateTime(item.createdAt)}</div>
                        <div className="text-sm">{item.pickupAddress} → {item.deliveryAddress}</div>
                      </> : null}
                      {mode === "inspections" ? <>
                        <div className="text-lg font-bold">{item.deliveryId?.orderId?.postId?.title || "Biên bản kiểm định"}</div>
                        <div className="text-sm text-muted-foreground">Shipper: {item.shipperId?.fullName} · {formatDateTime(item.createdAt)}</div>
                        <div className="text-sm">{item.conditionNote || "Không có ghi chú"}</div>
                        <div className="mt-2 flex gap-2">
                          {(item.images || []).map((image) => image.imageUrl ? <img key={image.imageType} src={image.imageUrl} alt={image.imageType} className="h-16 w-16 rounded-lg object-cover" /> : null)}
                        </div>
                      </> : null}
                      {mode === "reports" ? <>
                        <div className="text-lg font-bold">Sự cố: {item.issueType}</div>
                        <div className="text-sm text-muted-foreground">Shipper: {item.shipperId?.fullName} · {formatDateTime(item.createdAt)}</div>
                        <div className="text-sm">{item.description}</div>
                      </> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      {mode === "deliveries" ? <Badge variant={getDeliveryStatusInfo(item.deliveryStatus).variant}>{getDeliveryStatusInfo(item.deliveryStatus).label}</Badge> : null}
                      {mode === "inspections" ? <Badge variant={item.result === "passed" ? "success" : "danger"}>{item.result}</Badge> : null}
                      {mode === "shippers" ? <>
                        <Badge variant={item.accountStatus === "active" ? "success" : "danger"}>{item.accountStatus}</Badge>
                        <Button size="sm" variant={item.accountStatus === "banned" ? "outline" : "danger"} onClick={() => toggleShipper(item)}>
                          {item.accountStatus === "banned" ? "Mở khóa" : "Khóa"}
                        </Button>
                      </> : null}
                      {mode === "reports" ? <>
                        <Badge variant={item.status === "resolved" ? "success" : "warning"}>{item.status}</Badge>
                        {item.status !== "resolved" ? <Button size="sm" onClick={() => resolveReport(item._id, "resolved")}>Đánh dấu đã xử lý</Button> : null}
                      </> : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
