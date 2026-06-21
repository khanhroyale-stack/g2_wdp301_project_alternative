import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Sidebar";
import userService from "../../services/user.service";
import { authService } from "../../services/auth.service";
import toast from "react-hot-toast";

const VER_BADGE = {
  unverified: { label: "Chưa xác minh", cls: "bg-surface-container text-on-surface-variant" },
  pending: { label: "Chờ duyệt KYC", cls: "bg-surface-container-high text-on-surface" },
  verified: { label: "Đã xác minh", cls: "bg-white text-primary" },
  rejected: { label: "Bị từ chối", cls: "bg-error text-on-error" },
};

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Password state
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState(null); // { type: "success"|"error", text }

  // Edit profile state
  const [editForm, setEditForm] = useState({ fullName: "", phone: "", address: "", avatarUrl: "" });
  const [editLoading, setEditLoading] = useState(false);

  // Reputation history
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(false);

  const displayName = user?.fullName || user?.name || "";
  const verBadge = VER_BADGE[user?.verificationStatus] || VER_BADGE.unverified;

  useEffect(() => {
    if (activeTab === "reputation" && user) fetchHistory();
    if (activeTab === "edit" && user) {
      setEditForm({
        fullName: user.fullName || "",
        phone: user.phone || "",
        address: user.address || "",
        avatarUrl: user.avatarUrl || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchHistory = async () => {
    setHistLoading(true);
    try {
      const res = await userService.getReputationHistory(user._id || user.id);
      if (res.success) setHistory(res.logs || res.data || []);
    } catch { setHistory([]); }
    finally { setHistLoading(false); }
  };

  const handleEditProfile = async (e) => {
    e.preventDefault();
    if (!editForm.fullName.trim()) return toast.error("Họ tên không được để trống");
    setEditLoading(true);
    try {
      await userService.updateProfile(editForm);
      await refreshUser();
      toast.success("Cập nhật thông tin thành công!");
      setActiveTab("overview");
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi cập nhật thông tin");
    } finally {
      setEditLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMsg(null);
    if (passwords.newPass !== passwords.confirm) {
      setPassMsg({ type: "error", text: "Mật khẩu xác nhận không khớp." });
      return;
    }
    setPassLoading(true);
    try {
      await authService.changePassword({ currentPassword: passwords.current, newPassword: passwords.newPass });
      setPassMsg({ type: "success", text: "Đổi mật khẩu thành công!" });
      setPasswords({ current: "", newPass: "", confirm: "" });
    } catch (err) {
      setPassMsg({ type: "error", text: err.response?.data?.message || "Lỗi khi đổi mật khẩu." });
    } finally { setPassLoading(false); }
  };

  const TABS = [
    { key: "overview", label: "Tổng quan", icon: "person" },
    { key: "edit", label: "Chỉnh sửa", icon: "edit" },
    { key: "security", label: "Bảo mật", icon: "lock" },
    { key: "reputation", label: "Lịch sử uy tín", icon: "history" },
  ];

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <Sidebar variant="user" />
      <main className="flex-1 md:ml-64 px-4 md:px-10 py-10">
        <div className="max-w-4xl mx-auto">

          {/* Hero card */}
          <div className="relative bg-gradient-to-r from-primary to-primary-fixed rounded-2xl p-8 mb-8 overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-white text-3xl font-black shadow-lg flex-shrink-0">
                  {user?.avatarUrl
                    ? <img src={user.avatarUrl} alt={displayName} className="w-full h-full rounded-full object-cover" />
                    : displayName.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">Hồ sơ cá nhân</p>
                  <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">{displayName}</h1>
                  <p className="text-white/70 text-sm mt-0.5">{user?.email}</p>
                  <span className={`mt-2 px-3 py-1 rounded-full text-xs font-bold inline-block ${verBadge.cls}`}>
                    {verBadge.label}
                  </span>
                </div>
              </div>
              {/* Reputation score */}
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-5 text-center min-w-[140px]">
                <p className="text-white/70 text-xs font-medium mb-1">Điểm uy tín</p>
                <p className="text-4xl font-black text-white">{user?.reputationScore ?? 100}</p>
                <div className="mt-2 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full"
                    style={{ width: `${Math.min(user?.reputationScore ?? 100, 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Warning chưa xác minh */}
          {user?.verificationStatus === "unverified" && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-8 flex items-start gap-3">
              <span className="material-symbols-outlined text-orange-500 flex-shrink-0">warning</span>
              <div>
                <p className="font-semibold text-orange-900">Tài khoản chưa xác minh</p>
                <p className="text-sm text-orange-800 mt-0.5">
                  Vui lòng <Link to="/xac-minh-tai-khoan" className="font-bold underline">tải lên giấy tờ</Link> để bắt đầu giao dịch.
                </p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex bg-surface-container-lowest p-1 rounded-xl mb-6 shadow-sm border border-surface-variant/30 w-fit gap-0.5">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${activeTab === t.key
                    ? "bg-white text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                  }`}>
                <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-apple border border-surface-variant/30 overflow-hidden">

            {/* Overview */}
            {activeTab === "overview" && (
              <div>
                <div className="px-6 py-4 border-b border-surface-variant/30 bg-surface-bright/40">
                  <h2 className="font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">person</span>
                    Thông tin liên hệ
                  </h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[
                    { label: "Họ và tên", value: displayName },
                    { label: "Email", value: user?.email },
                    { label: "Số điện thoại", value: user?.phone || "Chưa cập nhật" },
                    { label: "Địa chỉ", value: user?.address || "Chưa cập nhật" },
                    { label: "Vai trò", value: { admin: "Quản trị viên", shipper: "Shipper", user: "Người dùng" }[user?.role] || "Người dùng" },
                    { label: "Trạng thái TK", value: user?.accountStatus === "active" ? "Đang hoạt động" : "Bị khóa" },
                  ].map((item) => (
                    <div key={item.label}>
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                        {item.label}
                      </label>
                      <div className="px-4 py-3 bg-surface-container-low border border-surface-variant/30 rounded-xl text-on-surface text-sm font-medium">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Edit profile */}
            {activeTab === "edit" && (
              <div>
                <div className="px-6 py-4 border-b border-surface-variant/30 bg-surface-bright/40">
                  <h2 className="font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">edit</span>
                    Chỉnh sửa thông tin cá nhân
                  </h2>
                </div>
                <form onSubmit={handleEditProfile} className="p-6 max-w-lg">
                  <div className="flex flex-col gap-4">
                    {[
                      { key: "fullName", label: "Họ và tên", ph: "Nguyễn Văn A", required: true },
                      { key: "phone", label: "Số điện thoại", ph: "0901234567" },
                      { key: "address", label: "Địa chỉ", ph: "Khu Công nghệ cao Hòa Lạc, Hà Nội" },
                      { key: "avatarUrl", label: "URL ảnh đại diện", ph: "https://..." },
                    ].map((f) => (
                      <div key={f.key}>
                        <label className="block text-sm font-medium text-on-surface mb-1.5">
                          {f.label} {f.required && <span className="text-error">*</span>}
                        </label>
                        <input
                          type="text"
                          required={!!f.required}
                          placeholder={f.ph}
                          value={editForm[f.key]}
                          onChange={(e) => setEditForm({ ...editForm, [f.key]: e.target.value })}
                          className="w-full px-4 py-3 border border-surface-variant rounded-xl text-sm bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                        />
                      </div>
                    ))}

                    {editForm.avatarUrl && (
                      <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl border border-surface-variant/30">
                        <img src={editForm.avatarUrl} alt="preview"
                          className="w-12 h-12 rounded-full object-cover border-2 border-surface-variant"
                          onError={(e) => { e.target.style.display = "none"; }} />
                        <p className="text-xs text-on-surface-variant">Xem trước ảnh đại diện</p>
                      </div>
                    )}

                    <div className="flex gap-3 mt-2">
                      <button type="button" onClick={() => setActiveTab("overview")}
                        className="flex-1 py-3 border border-surface-variant rounded-xl text-sm font-medium hover:bg-surface-container-low transition-all">
                        Hủy
                      </button>
                      <button type="submit" disabled={editLoading}
                        className="flex-1 py-3 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-60">
                        {editLoading ? "Đang lưu..." : "Lưu thay đổi"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Security */}
            {activeTab === "security" && (
              <div>
                <div className="px-6 py-4 border-b border-surface-variant/30 bg-surface-bright/40">
                  <h2 className="font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                    Đổi mật khẩu
                  </h2>
                </div>
                <form onSubmit={handleChangePassword} className="p-6 max-w-md">
                  {passMsg && (
                    <div className={`flex items-center gap-2 p-3.5 rounded-xl text-sm mb-5 border ${passMsg.type === "success"
                        ? "bg-secondary-container/30 text-on-secondary-container border-secondary-container"
                        : "bg-error-container/30 text-error border-error/20"
                      }`}>
                      <span className="material-symbols-outlined text-[16px]">
                        {passMsg.type === "success" ? "check_circle" : "error"}
                      </span>
                      {passMsg.text}
                    </div>
                  )}
                  {[
                    { key: "current", label: "Mật khẩu hiện tại", ph: "••••••••" },
                    { key: "newPass", label: "Mật khẩu mới", ph: "Tối thiểu 6 ký tự" },
                    { key: "confirm", label: "Xác nhận mật khẩu", ph: "Nhập lại mật khẩu mới" },
                  ].map((f) => (
                    <div key={f.key} className="mb-4">
                      <label className="block text-sm font-medium text-on-surface mb-1.5">{f.label}</label>
                      <input type="password" required minLength={6} placeholder={f.ph}
                        value={passwords[f.key]}
                        onChange={(e) => setPasswords({ ...passwords, [f.key]: e.target.value })}
                        className="w-full px-4 py-3 border border-surface-variant rounded-xl text-sm bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" />
                    </div>
                  ))}
                  <button type="submit" disabled={passLoading}
                    className="mt-2 px-7 py-3 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-60">
                    {passLoading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                  </button>
                </form>
              </div>
            )}

            {/* Reputation history */}
            {activeTab === "reputation" && (
              <div>
                <div className="px-6 py-4 border-b border-surface-variant/30 bg-surface-bright/40">
                  <h2 className="font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">history</span>
                    Lịch sử điểm uy tín
                  </h2>
                </div>
                {histLoading ? (
                  <div className="p-10 flex justify-center">
                    <span className="material-symbols-outlined animate-spin text-2xl text-primary">refresh</span>
                  </div>
                ) : history.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center gap-3 text-on-surface-variant">
                    <span className="material-symbols-outlined text-5xl opacity-30">verified</span>
                    <p className="font-medium text-on-surface">Chưa từng bị trừ điểm uy tín.</p>
                    <p className="text-sm">Hãy tiếp tục duy trì phong độ tốt!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-surface-variant/30">
                    {history.map((h, i) => (
                      <div key={i} className="px-6 py-5 flex items-start gap-4">
                        <div className="w-11 h-11 rounded-full bg-error/10 text-error flex items-center justify-center font-black text-sm flex-shrink-0">
                          {h.changeAmount}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-on-surface text-sm">{h.reason}</p>
                          <div className="flex flex-wrap gap-4 text-xs text-on-surface-variant mt-1.5">
                            <span>{new Date(h.createdAt).toLocaleDateString("vi-VN")}</span>
                            <span>Bởi: {h.changedBy?.fullName || "Admin"}</span>
                            <span className="font-medium text-on-surface">
                              Mức vi phạm: {h.violationLevel}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};
export default Profile;
