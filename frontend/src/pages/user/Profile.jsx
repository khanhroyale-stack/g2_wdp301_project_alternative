import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Sidebar";
import userService from "../../services/user.service";
import { authService } from "../../services/auth.service";

const VER_BADGE = {
  unverified: { label: "Chưa xác minh", cls: "bg-surface-container text-on-surface-variant" },
  pending: { label: "Chờ duyệt KYC", cls: "bg-surface-container-high text-on-surface" },
  verified: { label: "Đã xác minh", cls: "bg-white text-primary" },
  rejected: { label: "Bị từ chối", cls: "bg-error text-on-error" },
};

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState(null);
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    avatarUrl: "",
    dateOfBirth: "",
    gender: ""
  });

  useEffect(() => {
    if (user) {
      setEditForm({
        fullName: user.fullName || "",
        phone: user.phone || "",
        address: user.address || "",
        avatarUrl: user.avatarUrl || "",
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
        gender: user.gender || ""
      });
    }
  }, [user]);

  const displayName = user?.fullName || user?.name || "";
  const verBadge = VER_BADGE[user?.verificationStatus] || VER_BADGE.unverified;

  useEffect(() => {
    if (activeTab === "reputation" && user) fetchHistory();
  }, [activeTab, user]);

  const fetchHistory = async () => {
    setHistLoading(true);
    try {
      const res = await userService.getReputationHistory(user._id || user.id);
      if (res.success) setHistory(res.logs || res.data || []);
    } catch {
      setHistory([]);
    } finally {
      setHistLoading(false);
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
      setPassMsg({ type: "success", text: "Đổi mật khẩu thành công." });
      setPasswords({ current: "", newPass: "", confirm: "" });
    } catch (err) {
      setPassMsg({ type: "error", text: err.response?.data?.message || "Lỗi khi đổi mật khẩu." });
    } finally {
      setPassLoading(false);
    }
  };

  const handleEditProfile = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await userService.updateProfile(editForm);
      await refreshUser();
      setActiveTab("overview");
    } catch (err) {
      console.error(err);
    } finally {
      setEditLoading(false);
    }
  };

  const tabs = [
    { key: "overview", label: "Tổng quan", icon: "person" },
    { key: "edit", label: "Chỉnh sửa", icon: "edit" },
    { key: "security", label: "Bảo mật", icon: "lock" },
    { key: "reputation", label: "Lịch sử uy tín", icon: "history" },
  ];

  return (
    <div className="app-shell flex">
      <Sidebar variant="user" />
      <main className="flex-1 px-4 py-10 md:ml-72 md:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#146c43_0%,#56d892_100%)] p-8 shadow-[0px_20px_50px_rgba(20,108,67,0.16)]">
            <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div className="flex items-center gap-5">
                <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/40 bg-white/20 text-3xl font-black text-white shadow-lg">
                  {user?.avatarUrl
                    ? <img src={user.avatarUrl} alt={displayName} className="h-full w-full rounded-full object-cover" />
                    : displayName.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-white/75">Hồ sơ cá nhân</p>
                  <h1 className="text-2xl font-black leading-tight text-white md:text-3xl">{displayName}</h1>
                  <p className="mt-0.5 text-sm text-white/75">{user?.email}</p>
                  <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${verBadge.cls}`}>
                    {verBadge.label}
                  </span>
                </div>
              </div>
              <div className="min-w-[150px] rounded-2xl border border-white/20 bg-white/10 p-5 text-center backdrop-blur">
                <p className="mb-1 text-xs font-medium text-white/75">Điểm uy tín</p>
                <p className="text-4xl font-black text-white">{user?.reputationScore ?? 100}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
                  <div className="h-full rounded-full bg-white" style={{ width: `${Math.min(user?.reputationScore ?? 100, 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {user?.verificationStatus === "unverified" ? (
            <div className="mb-8 flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4">
              <span className="material-symbols-outlined flex-shrink-0 text-orange-500">warning</span>
              <div>
                <p className="font-semibold text-orange-900">Tài khoản chưa xác minh</p>
                <p className="text-sm text-orange-800 mt-0.5">
                  Vui lòng <Link to="/xac-minh-tai-khoan" className="font-bold underline">tải lên giấy tờ</Link> để bắt đầu giao dịch.
                </p>
              </div>
            </div>
          ) : null}

          <div className="mb-6 flex w-fit gap-0.5 rounded-2xl border border-surface-variant/30 bg-surface-container-lowest p-1 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${activeTab === tab.key ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                  }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="panel-surface overflow-hidden">
            {activeTab === "overview" ? (
              <div>
                <div className="border-b border-surface-variant/30 bg-surface-bright/40 px-6 py-4">
                  <h2 className="flex items-center gap-2 font-bold text-on-surface">
                    <span className="material-symbols-outlined text-[20px] text-primary">person</span>
                    Thông tin liên hệ
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
                  {[
                    { label: "Họ và tên", value: displayName },
                    { label: "Email", value: user?.email },
                    { label: "Số điện thoại", value: user?.phone || "Chưa cập nhật" },
                    { label: "Địa chỉ", value: user?.address || "Chưa cập nhật" },
                    { label: "Ngày sinh", value: user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString("vi-VN") : "Chưa cập nhật" },
                    { label: "Giới tính", value: user?.gender ? { male: "Nam", female: "Nữ", other: "Khác" }[user.gender] : "Chưa cập nhật" },
                    { label: "Vai trò", value: { admin: "Quản trị viên", shipper: "Shipper", user: "Người dùng" }[user?.role] || "Người dùng" },
                    { label: "Trạng thái tài khoản", value: user?.accountStatus === "active" ? "Đang hoạt động" : "Bị khóa" },
                  ].map((item) => (
                    <div key={item.label}>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {item.label}
                      </label>
                      <div className="rounded-xl border border-surface-variant/30 bg-surface-container-low px-4 py-3 text-sm font-medium text-on-surface">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {activeTab === "edit" && (
              <div>
                <div className="px-6 py-4 border-b border-surface-variant/30 bg-surface-bright/40">
                  <h2 className="font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                    Chỉnh sửa hồ sơ
                  </h2>
                </div>
                <form onSubmit={handleEditProfile} className="p-6">
                  {[
                    { key: "fullName", label: "Họ và tên", ph: "Nguyễn Văn A", required: true },
                    { key: "phone", label: "Số điện thoại", ph: "0901234567" },
                    { key: "address", label: "Địa chỉ", ph: "Khu Công nghệ cao Hòa Lạc, Hà Nội" },
                    { key: "avatarUrl", label: "URL ảnh đại diện", ph: "https://..." },
                  ].map((f) => (
                    <div key={f.key} className="mb-4">
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

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-on-surface mb-1.5">Ngày sinh</label>
                      <input
                        type="date"
                        max={new Date().toISOString().split("T")[0]}
                        value={editForm.dateOfBirth}
                        onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                        className="w-full px-4 py-3 border border-surface-variant rounded-xl text-sm bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-on-surface mb-1.5">Giới tính</label>
                      <select
                        value={editForm.gender}
                        onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                        className="w-full px-4 py-3 border border-surface-variant rounded-xl text-sm bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                      >
                        <option value="">-- Chọn --</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>
                  </div>

                  {editForm.avatarUrl && (
                    <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl border border-surface-variant/30 mb-4">
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
                </form>
              </div>
            )}

            {activeTab === "security" ? (
              <div>
                <div className="border-b border-surface-variant/30 bg-surface-bright/40 px-6 py-4">
                  <h2 className="flex items-center gap-2 font-bold text-on-surface">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                    Đổi mật khẩu
                  </h2>
                </div>
                <form onSubmit={handleChangePassword} className="max-w-md p-6">
                  {passMsg ? (
                    <div className={`mb-5 flex items-center gap-2 rounded-xl border p-3.5 text-sm ${passMsg.type === "success"
                      ? "border-secondary-container bg-secondary-container/30 text-on-secondary-container"
                      : "border-error/20 bg-error-container/30 text-error"
                      }`}>
                      <span className="material-symbols-outlined text-[16px]">
                        {passMsg.type === "success" ? "check_circle" : "error"}
                      </span>
                      {passMsg.text}
                    </div>
                  ) : null}
                  {[
                    { key: "current", label: "Mật khẩu hiện tại", ph: "••••••••" },
                    { key: "newPass", label: "Mật khẩu mới", ph: "Tối thiểu 6 ký tự" },
                    { key: "confirm", label: "Xác nhận mật khẩu", ph: "Nhập lại mật khẩu mới" },
                  ].map((field) => (
                    <div key={field.key} className="mb-4">
                      <label className="mb-1.5 block text-sm font-medium text-on-surface">{field.label}</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder={field.ph}
                        value={passwords[field.key]}
                        onChange={(e) => setPasswords({ ...passwords, [field.key]: e.target.value })}
                        className="w-full rounded-xl border border-surface-variant bg-surface-bright px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </div>
                  ))}
                  <button
                    type="submit"
                    disabled={passLoading}
                    className="mt-2 rounded-xl bg-primary px-7 py-3 text-sm font-semibold text-on-primary transition-all hover:opacity-90 disabled:opacity-60"
                  >
                    {passLoading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                  </button>
                </form>
              </div>
            ) : null}

            {activeTab === "reputation" ? (
              <div>
                <div className="border-b border-surface-variant/30 bg-surface-bright/40 px-6 py-4">
                  <h2 className="flex items-center gap-2 font-bold text-on-surface">
                    <span className="material-symbols-outlined text-[20px]">history</span>
                    Lịch sử điểm uy tín
                  </h2>
                </div>
                {histLoading ? (
                  <div className="flex justify-center p-10">
                    <span className="material-symbols-outlined animate-spin text-2xl text-primary">refresh</span>
                  </div>
                ) : history.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 p-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-5xl opacity-30">verified</span>
                    <p className="font-medium text-on-surface">Chưa từng bị trừ điểm uy tín.</p>
                    <p className="text-sm">Hãy tiếp tục duy trì chất lượng giao dịch tốt.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-surface-variant/30">
                    {history.map((item, index) => (
                      <div key={index} className="flex items-start gap-4 px-6 py-5">
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-error/10 text-sm font-black text-error">
                          {item.changeAmount}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-on-surface">{item.reason}</p>
                          <div className="mt-1.5 flex flex-wrap gap-4 text-xs text-on-surface-variant">
                            <span>{new Date(item.createdAt).toLocaleDateString("vi-VN")}</span>
                            <span>Bởi: {item.changedBy?.fullName || "Admin"}</span>
                            <span className="font-medium text-on-surface">Mức vi phạm: {item.violationLevel}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
