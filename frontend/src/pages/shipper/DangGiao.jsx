import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import shipperService from "../../services/shipper.service";
import toast from "react-hot-toast";

const STEP_MAP = {
  PICKING_UP: { label: "Đang lấy hàng", color: "bg-purple-50 text-purple-600 border-purple-200" },
  PICKED_UP: { label: "Đã lấy hàng", color: "bg-indigo-50 text-indigo-600 border-indigo-200" },
  DELIVERING: { label: "Đang giao hàng", color: "bg-cyan-50 text-cyan-600 border-cyan-200" },
  DELIVERED: { label: "Đã giao hàng", color: "bg-teal-50 text-teal-600 border-teal-200" },
};

const DangGiao = () => {
  const [orders, setOrders] = useState([]);
  const [inspectOpen, setInspectOpen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Inspection form
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("PASS");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await shipperService.getMyDeliveries();
      if (res.success) {
        // filter out COMPLETED/CANCELLED
        const active = res.data.filter(o => ["PICKING_UP", "PICKED_UP", "DELIVERING", "DELIVERED"].includes(o.status));
        setOrders(active);
      }
    } catch (err) {
      toast.error("Lỗi tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    setProcessingId(id);
    try {
      const res = await shipperService.updateDeliveryStatus(id, newStatus);
      if (res.success) {
        toast.success("Cập nhật trạng thái thành công!");
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi cập nhật");
    } finally {
      setProcessingId(null);
    }
  };

  const handleInspectSubmit = async () => {
    if (!inspectOpen) return;
    setIsSubmitting(true);
    try {
      const res = await shipperService.createInspection({
        orderId: inspectOpen._id,
        inspectionType: "PICKUP",
        status: status,
        notes: notes,
        images: [] // TODO: implement file upload
      });
      if (res.success) {
        toast.success("Đã lưu biên bản kiểm tra!");
        setInspectOpen(null);
        setNotes("");
        setStatus("PASS");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi lưu biên bản");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F5F5F7] font-sans">
      <Sidebar variant="shipper" />
      <main className="flex-1 md:ml-64 px-4 md:px-10 py-10">
        <div className="max-w-4xl mx-auto">
          <header className="mb-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-on-surface mb-2 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-4xl">local_shipping</span>
              Quản lý Giao Hàng
            </h1>
            <p className="text-on-surface-variant text-base">Theo dõi tiến độ các đơn hàng bạn đang phụ trách.</p>
          </header>

          {loading ? (
             <div className="flex justify-center items-center py-20">
                <span className="material-symbols-outlined text-primary text-5xl animate-spin">refresh</span>
             </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-3xl py-20 text-center border border-surface-variant/20 shadow-sm flex flex-col items-center">
              <div className="w-24 h-24 bg-surface-container-low rounded-full flex items-center justify-center mb-6">
                 <span className="material-symbols-outlined text-6xl text-primary/50">inbox</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">Không có đơn đang giao</h3>
              <p className="text-on-surface-variant">Bạn đã hoàn thành tất cả đơn hàng hiện tại.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {orders.map((order) => {
                const s = STEP_MAP[order.status] || { label: order.status, color: "bg-surface-variant text-on-surface" };
                const isProcessing = processingId === order._id;

                return (
                  <div key={order._id} className="bg-white rounded-3xl shadow-sm hover:shadow-apple transition-all border border-surface-variant/20 overflow-hidden relative">
                    {isProcessing && (
                       <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-3xl animate-spin">refresh</span>
                       </div>
                    )}
                    
                    {/* Header */}
                    <div className="p-6 md:p-8 border-b border-surface-variant/30 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-on-surface text-lg">{order.product?.title}</h3>
                          <span className={`text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider border ${s.color}`}>
                            {s.label}
                          </span>
                        </div>
                        <p className="text-sm text-on-surface-variant font-mono">Mã ĐH: {order._id.substring(0, 8).toUpperCase()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-on-surface-variant mb-0.5">Tiền thu hộ (COD)</p>
                        <p className="font-black text-primary text-xl">{order.totalAmount?.toLocaleString('vi-VN')}đ</p>
                      </div>
                    </div>

                    {/* Địa chỉ */}
                    <div className="p-6 md:p-8 bg-surface-bright/30">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                        {/* Connecting line on desktop */}
                        <div className="hidden md:block absolute top-1/2 left-[calc(50%-10px)] right-[calc(50%+10px)] h-0.5 border-t-2 border-dashed border-surface-variant/50 -translate-y-1/2 z-0"></div>
                        
                        <div className="bg-white p-5 rounded-2xl border border-surface-variant/40 shadow-sm relative z-10 flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined">store</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Điểm lấy hàng</p>
                            <p className="font-bold text-on-surface text-base">{order.seller?.name}</p>
                            <p className="text-sm text-on-surface-variant mt-1 flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[16px]">call</span> {order.seller?.phone}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-surface-variant/40 shadow-sm relative z-10 flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined">home_pin</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Điểm giao hàng</p>
                            <p className="font-bold text-on-surface text-base">{order.buyer?.name}</p>
                            <p className="text-sm text-on-surface-variant mt-1 flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[16px]">call</span> {order.buyer?.phone}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="px-6 py-5 md:px-8 bg-surface-container-lowest flex flex-wrap gap-4 items-center justify-between border-t border-surface-variant/30">
                      <button
                        onClick={() => setInspectOpen(order)}
                        className="flex items-center gap-1.5 px-5 py-2.5 bg-surface-container text-on-surface rounded-xl text-sm font-bold hover:bg-surface-variant transition-all"
                      >
                        <span className="material-symbols-outlined text-[18px]">fact_check</span>
                        Biên bản kiểm tra
                      </button>
                      
                      <div className="flex gap-3">
                        {order.status === "PICKING_UP" && (
                          <button
                            onClick={() => handleUpdateStatus(order._id, "PICKED_UP")} disabled={isProcessing}
                            className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-fixed text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95 disabled:opacity-50"
                          >
                            Đã lấy hàng thành công
                          </button>
                        )}
                        {order.status === "PICKED_UP" && (
                          <button
                            onClick={() => handleUpdateStatus(order._id, "DELIVERING")} disabled={isProcessing}
                            className="px-6 py-2.5 bg-cyan-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
                          >
                            Bắt đầu đi giao
                          </button>
                        )}
                        {order.status === "DELIVERING" && (
                          <button
                            onClick={() => handleUpdateStatus(order._id, "DELIVERED")} disabled={isProcessing}
                            className="px-6 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
                          >
                            Xác nhận đã giao đến nơi
                          </button>
                        )}
                        {order.status === "DELIVERED" && (
                          <div className="px-6 py-2.5 bg-surface-container text-on-surface-variant rounded-xl text-sm font-bold border border-surface-variant/50">
                            Chờ người mua xác nhận hoàn tất
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal chụp ảnh kiểm tra */}
      {inspectOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-xl animate-scale-up border border-surface-variant/20">
            <h3 className="font-extrabold text-on-surface text-2xl mb-1">Biên bản kiểm tra hàng</h3>
            <p className="text-sm text-on-surface-variant mb-6 pb-4 border-b border-surface-variant/30">{inspectOpen.product?.title}</p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {["Mặt trước", "Mặt sau", "Phụ kiện"].map((label) => (
                <label key={label} className="flex flex-col items-center justify-center aspect-square rounded-2xl border-2 border-dashed border-surface-variant hover:border-primary hover:bg-primary/5 cursor-pointer transition-all">
                  <span className="material-symbols-outlined text-3xl text-primary/50 mb-2">add_a_photo</span>
                  <span className="text-xs font-bold text-on-surface-variant text-center">{label}</span>
                  <input type="file" accept="image/*" className="hidden" />
                </label>
              ))}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold text-on-surface mb-2">Đánh giá tình trạng</label>
              <div className="flex gap-4">
                 <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" name="status" value="PASS" checked={status === "PASS"} onChange={() => setStatus("PASS")} className="w-4 h-4 text-primary focus:ring-primary accent-primary" />
                    <span className={`text-sm font-semibold ${status === "PASS" ? "text-primary" : "text-on-surface-variant group-hover:text-on-surface"}`}>Đạt yêu cầu</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" name="status" value="REJECTED" checked={status === "REJECTED"} onChange={() => setStatus("REJECTED")} className="w-4 h-4 text-error focus:ring-error accent-error" />
                    <span className={`text-sm font-semibold ${status === "REJECTED" ? "text-error" : "text-on-surface-variant group-hover:text-on-surface"}`}>Không đạt (Từ chối)</span>
                 </label>
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-bold text-on-surface mb-2">Ghi chú chi tiết</label>
              <textarea
                className="w-full px-4 py-3 border border-surface-variant/50 rounded-2xl text-sm bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none min-h-[100px] transition-all"
                placeholder="Ghi nhận tình trạng, vết xước, thiếu phụ kiện..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-4">
              <button onClick={() => setInspectOpen(null)} disabled={isSubmitting}
                className="flex-1 py-3.5 border-2 border-surface-variant/30 rounded-full text-base font-bold hover:bg-surface-container transition-all">
                Hủy
              </button>
              <button className="flex-1 py-3.5 bg-gradient-to-r from-primary to-primary-fixed text-white rounded-full text-base font-bold hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95 disabled:opacity-50"
                onClick={handleInspectSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Đang xử lý..." : "Lưu biên bản"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DangGiao;
