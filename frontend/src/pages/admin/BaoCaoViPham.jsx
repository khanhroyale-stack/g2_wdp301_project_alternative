import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import reportService from "../../services/report.service";

const TABS = ["Chờ xử lý", "Đang xử lý", "Đã giải quyết", "Từ chối"];
const STATUS_FILTER = ["PENDING", "PROCESSING", "RESOLVED", "REJECTED"];

const TYPE_COLORS = {
  "Sai mô tả": "bg-surface-container-high text-on-surface",
  "Lừa đảo": "bg-error-container text-on-error-container",
  "Thiếu phụ kiện": "bg-surface-container text-on-surface-variant",
  "Hư hỏng": "bg-error-container text-on-error-container",
};

const BaoCaoViPham = () => {
  const [tab, setTab] = useState(0);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await reportService.getAdminReports(STATUS_FILTER[tab]);
      if (res.success) setReports(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleResolve = async (id, status) => {
    let adminNote = "";
    if (status === "RESOLVED" || status === "REJECTED") {
      adminNote = window.prompt("Ghi chú của Admin về cách giải quyết (không bắt buộc):");
      if (adminNote === null) return; // User cancelled
    }
    
    try {
      const res = await reportService.resolveReport(id, status, adminNote);
      if (res.success) fetchReports();
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || err.message));
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <Sidebar variant="admin" />
      <main className="flex-1 md:ml-64 px-4 md:px-10 py-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-on-surface mb-8">Báo cáo vi phạm</h1>
          <div className="flex gap-1 bg-surface-container rounded-xl p-1 w-fit mb-8">
            {TABS.map((t, i) => (
              <button key={t} onClick={() => setTab(i)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === i ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                  }`}>
                {t}
              </button>
            ))}
          </div>

          {loading ? (
             <div className="text-center py-16 text-on-surface-variant">Đang tải...</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl block mb-3">shield_check</span>
              <p className="text-sm">Không có báo cáo nào.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {reports.map((r) => (
                <div key={r._id} className="bg-surface-container-lowest rounded-2xl shadow-apple border border-surface-variant/30 p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${TYPE_COLORS[r.violationType] || "bg-surface-container text-on-surface-variant"}`}>
                          {r.violationType}
                        </span>
                        <span className="text-xs text-on-surface-variant">{formatDate(r.createdAt)}</span>
                      </div>
                      <p className="text-sm text-on-surface leading-relaxed">{r.content}</p>
                      <p className="text-xs font-medium text-primary mt-1">Sản phẩm: {r.product?.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-surface-variant/40">
                    <div className="flex gap-6 text-xs text-on-surface-variant">
                      <span>Người báo cáo: <b className="text-on-surface">{r.reporter?.name}</b></span>
                      <span>Bị báo cáo: <b className="text-on-surface">{r.reportedUser?.name}</b></span>
                    </div>
                    {r.status === "PENDING" && (
                      <div className="flex gap-2">
                        <button onClick={() => handleResolve(r._id, "PROCESSING")} className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:opacity-90 transition-all">
                          Bắt đầu xử lý
                        </button>
                        <button onClick={() => handleResolve(r._id, "REJECTED")} className="px-4 py-2 border border-error/30 text-error rounded-lg text-xs font-medium hover:bg-error/5 transition-all">
                          Từ chối
                        </button>
                      </div>
                    )}
                    {r.status === "PROCESSING" && (
                       <div className="flex gap-2">
                        <button onClick={() => handleResolve(r._id, "RESOLVED")} className="px-4 py-2 bg-secondary-container text-on-secondary-container rounded-lg text-xs font-semibold hover:opacity-90 transition-all">
                          Đã giải quyết
                        </button>
                       </div>
                    )}
                  </div>
                  {r.adminNote && (
                    <div className="mt-4 p-3 bg-surface-container-low rounded-xl text-xs">
                      <span className="font-semibold">Admin ghi chú:</span> {r.adminNote}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
export default BaoCaoViPham;
