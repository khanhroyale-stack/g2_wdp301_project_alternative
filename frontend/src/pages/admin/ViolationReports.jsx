import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import reportService from "../../services/report.service";

const TABS = ["Chờ xử lý", "Đang điều tra", "Đã giải quyết", "Từ chối"];
// Phải khớp với enum trong Report model: "pending" | "investigating" | "resolved" | "dismissed"
const STATUS_FILTER = ["pending", "investigating", "resolved", "dismissed"];

const REPORT_TYPE_LABEL = {
  product_issue: "Lỗi sản phẩm",
  fraud: "Lừa đảo",
  damage: "Hư hỏng",
  missing_item: "Thiếu phụ kiện",
  other: "Khác",
};

const REPORT_TYPE_COLOR = {
  product_issue: "bg-surface-container-high text-on-surface",
  fraud: "bg-error-container text-on-error-container",
  damage: "bg-error-container text-on-error-container",
  missing_item: "bg-surface-container text-on-surface-variant",
  other: "bg-surface-container text-on-surface-variant",
};

const STATUS_BADGE = {
  pending: "bg-surface-container text-on-surface-variant",
  investigating: "bg-primary-fixed-dim text-on-primary-fixed",
  resolved: "bg-secondary-container text-on-secondary-container",
  dismissed: "bg-error-container text-on-error-container",
};
const STATUS_LABEL = {
  pending: "Chờ xử lý", investigating: "Đang điều tra",
  resolved: "Đã giải quyết", dismissed: "Từ chối",
};

// ── Modal xem chi tiết báo cáo ──────────────────────────────────────
const DetailModal = ({ reportId, onClose }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportService.getReportById(reportId)
      .then((res) => { if (res.success) setDetail(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [reportId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 py-8 overflow-auto">
      <div className="bg-surface-container-lowest rounded-2xl shadow-apple-md border border-surface-variant w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-on-surface text-lg">Chi tiết báo cáo</h3>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">close</span>
            </button>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <span className="material-symbols-outlined animate-spin text-2xl text-primary">refresh</span>
            </div>
          ) : !detail ? (
            <p className="text-center text-on-surface-variant py-8">Không tải được chi tiết báo cáo.</p>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Loại + trạng thái */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${REPORT_TYPE_COLOR[detail.reportType] || "bg-surface-container text-on-surface-variant"}`}>
                  {REPORT_TYPE_LABEL[detail.reportType] || detail.reportType}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_BADGE[detail.status]}`}>
                  {STATUS_LABEL[detail.status] || detail.status}
                </span>
                <span className="text-xs text-on-surface-variant ml-auto">
                  {new Date(detail.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>

              {/* Người liên quan */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container-low rounded-xl p-3">
                  <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Người báo cáo</p>
                  <p className="font-semibold text-sm text-on-surface">{detail.reporterId?.fullName || "—"}</p>
                  <p className="text-xs text-on-surface-variant">{detail.reporterId?.email || ""}</p>
                  <p className="text-xs text-on-surface-variant">{detail.reporterId?.phone || ""}</p>
                </div>
                <div className="bg-error/5 rounded-xl p-3 border border-error/10">
                  <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Bị báo cáo</p>
                  <p className="font-semibold text-sm text-on-surface">{detail.reportedUserId?.fullName || "—"}</p>
                  <p className="text-xs text-on-surface-variant">{detail.reportedUserId?.email || ""}</p>
                  <p className="text-xs text-error font-medium">Uy tín: {detail.reportedUserId?.reputationScore ?? "—"}</p>
                </div>
              </div>

              {/* Sản phẩm liên quan (nếu có) */}
              {detail.postId && (
                <div className="bg-surface-container-low rounded-xl p-3 flex items-center gap-3">
                  {detail.postId.images?.[0] && (
                    <img src={detail.postId.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  )}
                  <div>
                    <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-0.5">Bài đăng liên quan</p>
                    <p className="text-sm font-semibold text-on-surface">{detail.postId.title}</p>
                  </div>
                </div>
              )}

              {/* Nội dung báo cáo */}
              <div>
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Nội dung báo cáo</p>
                <p className="text-sm text-on-surface leading-relaxed bg-surface-container-low rounded-xl p-3">{detail.description}</p>
              </div>

              {/* Bằng chứng */}
              {detail.evidences && detail.evidences.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                    Bằng chứng ({detail.evidences.length})
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {detail.evidences.map((ev) => (
                      <a key={ev._id} href={ev.mediaId?.publicUrl} target="_blank" rel="noopener noreferrer">
                        <img
                          src={ev.mediaId?.publicUrl}
                          alt="Bằng chứng"
                          className="w-full aspect-square object-cover rounded-xl border border-surface-variant hover:opacity-80 transition-opacity"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin note */}
              {detail.adminNote && (
                <div className="bg-surface-container-low rounded-xl p-3">
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Ghi chú xử lý</p>
                  <p className="text-sm text-on-surface">{detail.adminNote}</p>
                  {detail.adminId && (
                    <p className="text-xs text-on-surface-variant mt-1">Admin: {detail.adminId.fullName}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Modal xử lý báo cáo
const ResolveModal = ({ report, onClose, onSuccess }) => {
  const [status, setStatus] = useState("resolved");
  const [adminNote, setAdminNote] = useState("");
  const [violationLevel, setViolationLevel] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await reportService.resolveReport(report._id, {
        status,
        adminNote,
        violationLevel: status === "resolved" && violationLevel ? violationLevel : undefined,
      });
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        alert(res.message || "Lỗi xử lý báo cáo");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi xử lý báo cáo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-apple-md border border-surface-variant w-full max-w-md">
        <h3 className="font-bold text-on-surface text-lg mb-1">Xử lý báo cáo</h3>
        <p className="text-sm text-on-surface-variant mb-5 line-clamp-2">{report.description}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Kết quả xử lý</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: "investigating", label: "Điều tra thêm" },
                { v: "resolved", label: "Đã giải quyết" },
                { v: "dismissed", label: "Từ chối báo cáo" },
              ].map((opt) => (
                <button key={opt.v} type="button" onClick={() => setStatus(opt.v)}
                  className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${status === opt.v
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-surface-variant text-on-surface-variant hover:border-primary/40"
                    }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {status === "resolved" && (
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">
                Mức vi phạm (trừ điểm uy tín)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: "warning", label: "Nhẹ", points: "-10" },
                  { v: "minor", label: "Vừa", points: "-20" },
                  { v: "major", label: "Nặng", points: "-50" },
                ].map((opt) => (
                  <button key={opt.v} type="button"
                    onClick={() => setViolationLevel(violationLevel === opt.v ? "" : opt.v)}
                    className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all flex flex-col items-center ${violationLevel === opt.v
                      ? "border-error bg-error/5 text-error"
                      : "border-surface-variant text-on-surface-variant hover:border-error/40"
                      }`}>
                    <span>{opt.label}</span>
                    <span className="text-[10px] font-normal">{opt.points} điểm</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-on-surface-variant mt-1.5">
                Bỏ trống nếu không muốn trừ điểm.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Ghi chú Admin</label>
            <textarea
              className="w-full px-4 py-3 border border-surface-variant rounded-xl text-sm bg-surface-bright focus:border-primary outline-none resize-none min-h-[80px] transition-all"
              placeholder="Ghi chú lý do xử lý..."
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-surface-variant rounded-xl text-sm font-medium hover:bg-surface-container-low transition-all">
              Hủy
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60">
              {loading ? "Đang xử lý..." : "Xác nhận"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ViolationReports = () => {
  const [tab, setTab] = useState(0);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resolveTarget, setResolveTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);

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

  useEffect(() => { fetchReports(); }, [tab]); // eslint-disable-line

  const formatDate = (d) => new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <Sidebar variant="admin" />
      <main className="flex-1 md:ml-72 px-4 md:px-10 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-on-surface">Báo cáo vi phạm</h1>
            <p className="text-on-surface-variant text-sm mt-1">Xem xét và xử lý báo cáo từ người dùng</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-surface-container rounded-xl p-1 w-fit mb-8 overflow-x-auto">
            {TABS.map((t, i) => (
              <button key={t} onClick={() => setTab(i)}
                className={`px-5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${tab === i ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                  }`}>
                {t}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-16 flex flex-col items-center gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-3xl animate-spin">refresh</span>
              <p className="text-sm">Đang tải...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl opacity-30">shield_check</span>
              <p className="text-sm">Không có báo cáo nào trong mục này.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {reports.map((r) => (
                <div key={r._id} className="bg-surface-container-lowest rounded-2xl shadow-apple border border-surface-variant/30 p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${REPORT_TYPE_COLOR[r.reportType] || "bg-surface-container text-on-surface-variant"}`}>
                          {REPORT_TYPE_LABEL[r.reportType] || r.reportType}
                        </span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_BADGE[r.status]}`}>
                          {STATUS_LABEL[r.status] || r.status}
                        </span>
                        <span className="text-xs text-on-surface-variant ml-auto">{formatDate(r.createdAt)}</span>
                      </div>
                      <p className="text-sm text-on-surface leading-relaxed line-clamp-3">{r.description}</p>
                    </div>
                  </div>

                  {/* Parties */}
                  <div className="grid grid-cols-2 gap-4 py-3 border-y border-surface-variant/40 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant flex-shrink-0">
                        <span className="material-symbols-outlined text-[16px]">person</span>
                      </div>
                      <div>
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Người báo cáo</p>
                        <p className="text-sm font-semibold text-on-surface truncate">
                          {r.reporterId?.fullName || r.reporterId?.name || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-error-container flex items-center justify-center text-on-error-container flex-shrink-0">
                        <span className="material-symbols-outlined text-[16px]">person_alert</span>
                      </div>
                      <div>
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Bị báo cáo</p>
                        <p className="text-sm font-semibold text-on-surface truncate">
                          {r.reportedUserId?.fullName || r.reportedUserId?.name || "—"}
                        </p>
                        {r.reportedUserId?.reputationScore !== undefined && (
                          <p className="text-[10px] text-on-surface-variant">Điểm UY TÍN: {r.reportedUserId.reputationScore}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Admin note (nếu đã xử lý) */}
                  {r.adminNote && (
                    <div className="mb-4 p-3 bg-surface-container-low rounded-xl text-xs">
                      <span className="font-semibold text-on-surface">Admin ghi chú: </span>
                      <span className="text-on-surface-variant">{r.adminNote}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setDetailTarget(r._id)}
                      className="px-4 py-2 border border-surface-variant text-on-surface-variant rounded-lg text-xs font-medium hover:bg-surface-container-low transition-all">
                      Xem chi tiết
                    </button>
                    {(r.status === "pending" || r.status === "investigating") && (
                      <button
                        onClick={() => setResolveTarget(r)}
                        className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:opacity-90 transition-all">
                        Xử lý báo cáo
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {resolveTarget && (
        <ResolveModal
          report={resolveTarget}
          onClose={() => setResolveTarget(null)}
          onSuccess={fetchReports}
        />
      )}

      {detailTarget && (
        <DetailModal
          reportId={detailTarget}
          onClose={() => setDetailTarget(null)}
        />
      )}
    </div>
  );
};
export default ViolationReports;
