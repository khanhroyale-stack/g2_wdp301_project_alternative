import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

const AccountVerification = () => {
  const [cccdFile, setCccdFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCccdFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cccdFile) { setError("Vui lòng tải lên ảnh CCCD hoặc thẻ sinh viên."); return; }
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("citizenId", cccdFile);
      
      const res = await api.post("/verification/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      if (res.data.success) {
        setSubmitted(true);
      } else {
        setError(res.data.message || "Lỗi tải lên.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-surface-container-low flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center bg-surface-container-lowest rounded-2xl p-10 shadow-apple-md border border-surface-variant/30">
          <div className="w-16 h-16 bg-secondary-container rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="material-symbols-outlined text-3xl text-on-secondary-container">check_circle</span>
          </div>
          <h2 className="text-xl font-bold text-on-surface mb-3">Đã gửi hồ sơ xác minh!</h2>
          <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
            Hồ sơ của bạn đang chờ Admin duyệt. Quá trình thường mất 1–2 ngày làm việc. Bạn sẽ nhận thông báo qua email khi được duyệt.
          </p>
          <Link to="/" className="inline-block px-6 py-3 bg-primary text-on-primary rounded-full font-semibold text-sm hover:opacity-90 transition-all">
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-low flex items-center justify-center px-4 py-10">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <Link to="/" className="text-xl font-bold text-primary tracking-tight">EcoTrade</Link>
          <h2 className="text-2xl font-bold text-on-surface mt-3">Xác minh tài khoản</h2>
          <p className="text-on-surface-variant text-sm mt-1">Tải lên giấy tờ để xác minh danh tính và bắt đầu giao dịch</p>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl shadow-apple-md p-8 border border-surface-variant/30">
          {/* Tại sao cần xác minh */}
          <div className="bg-secondary-container/30 rounded-xl p-4 mb-6 flex gap-3">
            <span className="material-symbols-outlined text-on-secondary-container mt-0.5 flex-shrink-0">info</span>
            <p className="text-sm text-on-surface-variant">
              Xác minh giúp đảm bảo an toàn cho mọi giao dịch. Thông tin giấy tờ chỉ được Admin kiểm tra và không chia sẻ cho bên thứ ba.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-error mb-5 p-3.5 bg-error-container/30 rounded-xl text-sm border border-error/20">
              <span className="material-symbols-outlined text-[18px]">error</span>{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-3">
                Ảnh CCCD hoặc Thẻ sinh viên <span className="text-error">*</span>
              </label>
              <label className={`flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed cursor-pointer transition-all ${preview ? "border-primary/40 bg-primary/5" : "border-surface-variant hover:border-primary/40 hover:bg-surface-container-low"
                } p-6`}>
                {preview ? (
                  <div className="w-full">
                    <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                    <p className="text-center text-xs text-primary mt-3 font-medium">
                      <span className="material-symbols-outlined text-[14px] align-middle">check_circle</span>{" "}
                      Đã chọn: {cccdFile?.name}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3 block">upload_file</span>
                    <p className="text-sm font-medium text-on-surface">Nhấn để tải ảnh lên</p>
                    <p className="text-xs text-on-surface-variant mt-1">PNG, JPG, JPEG — Tối đa 5MB</p>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>

            {/* Yêu cầu ảnh */}
            <div className="bg-surface-container-low rounded-xl p-4">
              <p className="text-sm font-medium text-on-surface mb-2">Yêu cầu đối với ảnh:</p>
              <ul className="space-y-1">
                {["Ảnh rõ nét, đủ sáng, không bị mờ", "Thấy rõ toàn bộ giấy tờ", "Không chỉnh sửa hoặc che khuất thông tin"].map((req) => (
                  <li key={req} className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-[14px] text-primary">check</span>{req}
                  </li>
                ))}
              </ul>
            </div>

            <button type="submit" disabled={loading || !cccdFile}
              className="w-full py-3.5 bg-primary text-on-primary font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  Đang gửi...
                </span>
              ) : "Gửi hồ sơ xác minh"}
            </button>
          </form>
        </div>

        <div className="text-center mt-5">
          <Link to="/" className="text-sm text-on-surface-variant hover:text-primary flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>Làm sau
          </Link>
        </div>
      </div>
    </div>
  );
};
export default AccountVerification;
