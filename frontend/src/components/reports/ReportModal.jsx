import React, { useState } from "react";
import toast from "react-hot-toast";
import reportService from "../../services/report.service";

const REPORT_TYPES = [
  { value: "product_issue", label: "Hàng không đúng mô tả" },
  { value: "fraud", label: "Có dấu hiệu lừa đảo" },
  { value: "damage", label: "Hàng bị hư hỏng" },
  { value: "missing_item", label: "Thiếu hàng" },
  { value: "other", label: "Lý do khác" }
];

const ReportModal = ({ 
  isOpen, 
  onClose, 
  reportedUserId, 
  orderId, 
  rentalContractId, 
  postId, 
  onSuccess 
}) => {
  const [reportType, setReportType] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reportType) {
      toast.error("Vui lòng chọn lý do báo cáo");
      return;
    }
    if (!description.trim()) {
      toast.error("Vui lòng nhập chi tiết báo cáo");
      return;
    }

    setLoading(true);
    try {
      await reportService.createReport({
        reportedUserId,
        orderId,
        rentalContractId,
        postId,
        reportType,
        description
      });
      toast.success("Báo cáo đã được gửi cho Admin xử lý");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra khi gửi báo cáo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-apple-md w-full max-w-md animate-scale-up">
        <div className="flex justify-between items-center mb-5 border-b border-surface-variant/30 pb-3">
          <h2 className="text-xl font-bold text-error flex items-center gap-2">
            <span className="material-symbols-outlined">warning</span>
            Báo cáo vi phạm
          </h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-error transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2">
              Lý do báo cáo <span className="text-error">*</span>
            </label>
            <div className="grid gap-2">
              {REPORT_TYPES.map(type => (
                <label 
                  key={type.value} 
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    reportType === type.value 
                      ? "border-error bg-error/5 text-error" 
                      : "border-surface-variant/50 hover:bg-surface-container-low text-on-surface"
                  }`}
                >
                  <input 
                    type="radio" 
                    name="reportType" 
                    value={type.value} 
                    checked={reportType === type.value}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-4 h-4 text-error focus:ring-error"
                  />
                  <span className="text-sm font-medium">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2">
              Mô tả chi tiết <span className="text-error">*</span>
            </label>
            <textarea
              className="w-full bg-surface-container-low border border-surface-variant/50 rounded-xl p-3 text-sm outline-none focus:border-error focus:ring-1 focus:ring-error transition-all resize-none h-28 placeholder:text-on-surface-variant/50"
              placeholder="Cung cấp chi tiết vấn đề bạn gặp phải để Admin dễ dàng xử lý..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>

          <div className="bg-error-container/30 rounded-xl p-3 flex gap-2 items-start">
            <span className="material-symbols-outlined text-[18px] text-error flex-shrink-0 mt-0.5">info</span>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Các báo cáo sai sự thật có thể dẫn đến việc tài khoản của bạn bị cảnh cáo hoặc khóa.
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2.5 bg-surface-container text-on-surface rounded-xl font-medium hover:bg-surface-variant transition-colors"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-5 py-2.5 bg-error text-on-error rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-on-error/30 border-t-on-error rounded-full animate-spin"></span>}
              Gửi báo cáo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
