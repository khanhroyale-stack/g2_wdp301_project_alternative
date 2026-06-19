import { useState } from "react";
import reportService from "../services/report.service";
import uploadService from "../services/upload.service";
import toast from "react-hot-toast";

const REPORT_TYPES = [
  { value: "product_issue", label: "Sản phẩm sai mô tả" },
  { value: "fraud", label: "Lừa đảo" },
  { value: "damage", label: "Hư hỏng / Thiệt hại" },
  { value: "missing_item", label: "Thiếu phụ kiện" },
  { value: "other", label: "Khác" },
];

/**
 * Modal báo cáo vi phạm dùng chung
 *
 * Props:
 *   onClose()          — đóng modal
 *   reportedUserId     — ID người bị báo cáo (bắt buộc)
 *   postId?            — ID bài đăng liên quan (tuỳ chọn)
 *   orderId?           — ID đơn hàng liên quan (tuỳ chọn)
 *   rentalContractId?  — ID hợp đồng thuê liên quan (tuỳ chọn)
 *   contextLabel?      — Label hiển thị ở header (VD: tên sản phẩm)
 */
const ReportModal = ({
  onClose,
  reportedUserId,
  postId,
  orderId,
  rentalContractId,
  contextLabel,
}) => {
  const [step, setStep] = useState(1); // 1 = điền form, 2 = thành công
  const [reportType, setReportType] = useState("");
  const [description, setDescription] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImageFiles(files);
    setImagePreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const removeImage = (idx) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reportedUserId) return toast.error("Không tìm thấy thông tin người bị báo cáo.");
    if (!reportType) return toast.error("Vui lòng chọn loại vi phạm");
    if (!description.trim()) return toast.error("Vui lòng nhập mô tả");

    setLoading(true);
    try {
      // Bước 1: Tạo báo cáo (kèm evidenceMediaIds nếu đã upload trước)
      // — upload ảnh trước nếu có
      let mediaIds = [];
      if (imageFiles.length > 0) {
        const uploadRes = await uploadService.uploadImages(imageFiles);
        if (uploadRes.success) mediaIds = uploadRes.mediaIds || [];
      }

      const res = await reportService.createReport({
        reportedUserId,
        postId: postId || undefined,
        orderId: orderId || undefined,
        rentalContractId: rentalContractId || undefined,
        reportType,
        description: description.trim(),
        evidenceMediaIds: mediaIds,
      });

      if (!res.success) throw new Error(res.message);

      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Gửi báo cáo thất bại");
    } finally {
      setLoading(false);
    }
  };

  // ── Bước 2: Thành công ───────────────────────────────────
  if (step === 2) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
        <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-apple-md border border-surface-variant w-full max-w-sm text-center">
          <div className="w-14 h-14 bg-secondary-container rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-on-secondary-container">task_alt</span>
          </div>
          <h3 className="font-bold text-on-surface text-lg mb-2">Báo cáo đã gửi</h3>
          <p className="text-sm text-on-surface-variant mb-6">
            Admin sẽ xem xét và xử lý trong thời gian sớm nhất. Cảm ơn bạn đã phản ánh.
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:opacity-90 transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  // ── Bước 1: Form ─────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 py-8 overflow-auto">
      <div className="bg-surface-container-lowest rounded-2xl shadow-apple-md border border-surface-variant w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-surface-variant/30">
          <div>
            <h3 className="font-bold text-on-surface text-lg">Báo cáo vi phạm</h3>
            {contextLabel && (
              <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">{contextLabel}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Loại vi phạm */}
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2">
              Loại vi phạm <span className="text-error">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {REPORT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setReportType(t.value)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 text-left transition-all ${reportType === t.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-surface-variant text-on-surface-variant hover:border-primary/40"
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2">
              Mô tả chi tiết <span className="text-error">*</span>
            </label>
            <textarea
              className="w-full px-4 py-3 border border-surface-variant rounded-xl text-sm bg-surface-bright focus:border-primary outline-none resize-none min-h-[100px] transition-all"
              placeholder="Mô tả rõ vấn đề bạn gặp phải..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
            />
            <p className="text-xs text-on-surface-variant text-right mt-1">{description.length}/1000</p>
          </div>

          {/* Upload ảnh bằng chứng */}
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2">
              Ảnh bằng chứng
              <span className="text-xs font-normal text-on-surface-variant ml-2">(tuỳ chọn, tối đa 5 ảnh)</span>
            </label>

            {/* Previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mb-2">
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="relative aspect-square">
                    <img
                      src={src}
                      alt=""
                      className="w-full h-full object-cover rounded-lg border border-surface-variant"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-error text-on-error rounded-full flex items-center justify-center shadow-sm hover:opacity-80 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-[12px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            {imagePreviews.length < 5 && (
              <label className="flex items-center gap-3 w-full px-4 py-3 border-2 border-dashed border-surface-variant rounded-xl cursor-pointer hover:border-primary/40 hover:bg-surface-container-low transition-all">
                <span className="material-symbols-outlined text-on-surface-variant text-2xl">add_photo_alternate</span>
                <div>
                  <p className="text-sm font-medium text-on-surface">Thêm ảnh bằng chứng</p>
                  <p className="text-xs text-on-surface-variant">PNG, JPG — Tối đa 5MB/ảnh</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>

          {/* Lưu ý */}
          <div className="flex items-start gap-2 p-3 bg-surface-container-low rounded-xl">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant mt-0.5 flex-shrink-0">info</span>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Báo cáo sai hoặc thiếu căn cứ có thể ảnh hưởng đến điểm uy tín của bạn.
              Chỉ báo cáo khi có đủ bằng chứng.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-surface-variant rounded-xl text-sm font-medium hover:bg-surface-container-low transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-error text-on-error rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-error/30 border-t-on-error rounded-full animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">flag</span>
                  Gửi báo cáo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
