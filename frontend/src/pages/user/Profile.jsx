import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import EcoTradeLayout from "../../components/ecotrade/EcoTradeLayout";
import AccountStatusCard from "../../components/ui/AccountStatusCard";
import userService from "../../services/user.service";
import { authService } from "../../services/auth.service";
import uploadService from "../../services/upload.service";

const AVATAR_SIZE = 512;
const AVATAR_PREVIEW_SIZE = 192;

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState(null);
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [avatarEditor, setAvatarEditor] = useState({
    file: null,
    previewUrl: "",
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });
  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    avatarUrl: "",
    dateOfBirth: "",
    gender: "",
    bankAccountNumber: "",
    bankName: "",
    bankAccountHolder: ""
  });

  useEffect(() => {
    if (user) {
      setEditForm({
        fullName: user.fullName || "",
        phone: user.phone || "",
        address: user.address || "",
        avatarUrl: user.avatarUrl || "",
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
        gender: user.gender || "",
        bankAccountNumber: user.bankAccountNumber || "",
        bankName: user.bankName || "",
        bankAccountHolder: user.bankAccountHolder || ""
      });
    }
  }, [user]);

  useEffect(() => () => {
    if (avatarEditor.previewUrl) URL.revokeObjectURL(avatarEditor.previewUrl);
  }, [avatarEditor.previewUrl]);

  const displayName = user?.fullName || user?.name || "";

  const fetchHistory = useCallback(async () => {
    setHistLoading(true);
    try {
      const res = await userService.getReputationHistory(user._id || user.id);
      if (res.success) setHistory(res.logs || res.data || []);
    } catch {
      setHistory([]);
    } finally {
      setHistLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "reputation" && user) fetchHistory();
  }, [activeTab, user, fetchHistory]);

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
      let nextAvatarUrl = editForm.avatarUrl;
      if (avatarEditor.file) {
        const croppedBlob = await createCroppedAvatarBlob(avatarEditor);
        const croppedFile = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
        const uploadRes = await uploadService.uploadImages([croppedFile], "other");
        nextAvatarUrl = uploadRes.urls?.[0] || nextAvatarUrl;
      }

      await userService.updateProfile({ ...editForm, avatarUrl: nextAvatarUrl });
      await refreshUser();
      clearAvatarEditor();
      setActiveTab("overview");
    } catch (err) {
      console.error(err);
    } finally {
      setEditLoading(false);
    }
  };

  const clearAvatarEditor = () => {
    setAvatarEditor((prev) => {
      if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return { file: null, previewUrl: "", offsetX: 0, offsetY: 0, scale: 1 };
    });
  };

  const handleAvatarFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;

    setAvatarEditor((prev) => {
      if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return {
        file,
        previewUrl: URL.createObjectURL(file),
        offsetX: 0,
        offsetY: 0,
        scale: 1,
      };
    });
  };

  const createCroppedAvatarBlob = ({ file, offsetX, offsetY, scale }) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = AVATAR_SIZE;
        canvas.height = AVATAR_SIZE;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);

        const imageRatio = image.naturalWidth / image.naturalHeight;
        const baseWidth = imageRatio >= 1 ? AVATAR_SIZE * imageRatio : AVATAR_SIZE;
        const baseHeight = imageRatio >= 1 ? AVATAR_SIZE : AVATAR_SIZE / imageRatio;
        const drawWidth = baseWidth * scale;
        const drawHeight = baseHeight * scale;
        const previewToCanvas = AVATAR_SIZE / AVATAR_PREVIEW_SIZE;
        const drawX = (AVATAR_SIZE - drawWidth) / 2 + offsetX * previewToCanvas;
        const drawY = (AVATAR_SIZE - drawHeight) / 2 + offsetY * previewToCanvas;

        ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
        URL.revokeObjectURL(objectUrl);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Không thể xử lý ảnh đại diện."));
        }, "image/jpeg", 0.92);
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Không thể đọc ảnh đại diện."));
      };
      image.src = objectUrl;
    });

  const tabs = [
    { key: "overview", label: "Tổng quan", icon: "person" },
    { key: "edit", label: "Chỉnh sửa", icon: "edit" },
    { key: "security", label: "Bảo mật", icon: "lock" },
    { key: "reputation", label: "Điểm uy tín", icon: "history" },
  ];

  return (
    <EcoTradeLayout>
        <div className="mx-auto max-w-5xl">
          {/* Premium Hero Section */}
          <div className="relative mb-12 overflow-hidden rounded-organic bg-gradient-to-br from-primary to-primary-container p-12 shadow-apple-md">
            {/* Animated Blobs */}
            <div className="absolute -right-20 -top-20 h-64 w-64 animate-blob rounded-full bg-white/10 blur-3xl"></div>
            <div className="absolute -left-20 -bottom-20 h-64 w-64 animate-blob animation-delay-2000 rounded-full bg-secondary/20 blur-3xl"></div>
            
            <div className="relative z-10 flex flex-col justify-between gap-10 lg:flex-row lg:items-center">
              <div className="flex flex-col items-center gap-8 md:flex-row">
                <div className="group relative">
                  <div className="absolute -inset-2 animate-pulse-slow rounded-full bg-white/20 blur-lg transition-all group-hover:bg-white/30"></div>
                  <div className="relative flex h-32 w-32 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white/50 bg-white/20 text-5xl font-display font-black text-white shadow-2xl backdrop-blur-sm">
                    {user?.avatarUrl
                      ? <img src={user.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                      : displayName.charAt(0).toUpperCase() || "U"}
                  </div>
                  {user?.verificationStatus === "verified" && (
                    <div className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white text-primary shadow-lg border-2 border-primary/20">
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                    </div>
                  )}
                </div>
                
                <div className="text-center md:text-left">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/80 backdrop-blur-md border border-white/10">
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse"></span>
                    Tài khoản {user?.role === "admin" ? "Quản trị" : user?.role === "shipper" ? "Vận chuyển" : "Người dùng"}
                  </div>
                  <h1 className="text-4xl font-display font-black leading-tight text-white md:text-5xl tracking-tight">{displayName}</h1>
                  <p className="mt-2 text-lg font-medium text-white/70">{user?.email}</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="relative min-w-[200px] overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-6 text-center backdrop-blur-xl shadow-inner">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.15em] text-white/60">Chỉ số tin cậy</p>
                  <p className="text-5xl font-display font-black text-white leading-none mb-4">{user?.reputationScore ?? 100}</p>
                  <div className="h-2 overflow-hidden rounded-full bg-white/20 p-0.5">
                    <div className="h-full rounded-full bg-secondary shadow-[0_0_15px_rgba(224,122,95,0.5)] transition-all duration-1000" style={{ width: `${Math.min(user?.reputationScore ?? 100, 100)}%` }} />
                  </div>
                  <p className="mt-4 text-[11px] font-bold text-white/60 uppercase tracking-widest">Tuyệt vời</p>
                </div>
              </div>
            </div>
          </div>

          <AccountStatusCard className="mb-10" />

          {/* Pill Tabs */}
          <div className="mb-10 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 rounded-pill px-8 py-3.5 text-sm font-bold transition-all ${
                  activeTab === tab.key 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "bg-white text-on-surface-variant hover:bg-primary/5 hover:text-primary border border-primary/5 shadow-sm"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="panel-surface overflow-hidden bg-white p-2">
            <div className="rounded-[1.5rem] border border-primary/5 bg-background/30 overflow-hidden">
              {activeTab === "overview" ? (
                <div>
                  <div className="border-b border-primary/5 bg-white px-10 py-6">
                    <h2 className="flex items-center gap-3 font-display text-xl font-black text-foreground">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary">
                        <span className="material-symbols-outlined text-[20px]">person</span>
                      </div>
                      Thông tin hồ sơ
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-6 p-10 md:grid-cols-2">
                    {[
                      { label: "Họ và tên", value: displayName, icon: "badge" },
                      { label: "Email liên hệ", value: user?.email, icon: "mail" },
                      { label: "Số điện thoại", value: user?.phone || "Chưa cập nhật", icon: "phone" },
                      { label: "Địa chỉ nhận hàng", value: user?.address || "Chưa cập nhật", icon: "location_on" },
                      { label: "Ngày sinh", value: user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString("vi-VN") : "Chưa cập nhật", icon: "cake" },
                      { label: "Giới tính", value: user?.gender ? { male: "Nam", female: "Nữ", other: "Khác" }[user.gender] : "Chưa cập nhật", icon: "transgender" },
                      { label: "Số tài khoản", value: user?.bankAccountNumber || "Chưa cập nhật", icon: "account_balance" },
                      { label: "Ngân hàng", value: user?.bankName || "Chưa cập nhật", icon: "account_balance_wallet" },
                      { label: "Chủ tài khoản", value: user?.bankAccountHolder || "Chưa cập nhật", icon: "person" },
                    ].map((item) => (
                      <div key={item.label} className="group">
                        <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.15em] text-primary/40 group-hover:text-primary transition-colors">
                          {item.label}
                        </label>
                        <div className="flex items-center gap-4 rounded-2xl border border-primary/5 bg-white px-5 py-4 text-sm font-bold text-foreground shadow-sm transition-all group-hover:border-primary/20 group-hover:shadow-apple">
                          <span className="material-symbols-outlined text-[18px] text-primary/30">{item.icon}</span>
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {activeTab === "edit" && (
                <div>
                  <div className="px-10 py-6 border-b border-primary/5 bg-white">
                    <h2 className="font-display text-xl font-black text-foreground flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </div>
                      Chỉnh sửa thông tin
                    </h2>
                  </div>
                  <form onSubmit={handleEditProfile} className="p-10">
                    <div className="mb-8 rounded-3xl border border-primary/10 bg-white p-6 shadow-sm">
                      <div className="mb-5 flex items-center justify-between gap-4">
                        <div>
                          <label className="block text-xs font-black uppercase tracking-widest text-foreground/40">
                            Ảnh đại diện
                          </label>
                          <p className="mt-1 text-sm font-medium text-on-surface-variant">
                            Chọn ảnh từ máy và căn chỉnh để khớp với khung tròn.
                          </p>
                        </div>
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-primary/90">
                          <span className="material-symbols-outlined text-[18px]">upload</span>
                          Chọn ảnh
                          <input type="file" accept="image/*" onChange={handleAvatarFileChange} className="hidden" />
                        </label>
                      </div>

                      <div className="grid gap-8 lg:grid-cols-[240px,1fr]">
                        <div className="flex flex-col items-center gap-4">
                          <div className="relative h-48 w-48 overflow-hidden rounded-full border-4 border-primary/20 bg-primary/5 shadow-inner">
                            {avatarEditor.previewUrl || editForm.avatarUrl ? (
                              <img
                                src={avatarEditor.previewUrl || editForm.avatarUrl}
                                alt="Ảnh đại diện"
                                className="h-full w-full object-cover"
                                style={avatarEditor.previewUrl ? {
                                  transform: `translate(${avatarEditor.offsetX}px, ${avatarEditor.offsetY}px) scale(${avatarEditor.scale})`,
                                } : undefined}
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-5xl font-black text-primary">
                                {displayName.charAt(0).toUpperCase() || "U"}
                              </div>
                            )}
                            <div className="pointer-events-none absolute inset-0 rounded-full ring-4 ring-white/80" />
                          </div>
                          {avatarEditor.previewUrl && (
                            <button
                              type="button"
                              onClick={clearAvatarEditor}
                              className="text-xs font-black uppercase tracking-widest text-error/70 hover:text-error"
                            >
                              Hủy ảnh mới
                            </button>
                          )}
                        </div>

                        <div className="flex flex-col justify-center gap-5">
                          <div>
                            <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-widest text-foreground/40">
                              <span>Phóng to</span>
                              <span>{avatarEditor.scale.toFixed(1)}x</span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="3"
                              step="0.05"
                              value={avatarEditor.scale}
                              disabled={!avatarEditor.previewUrl}
                              onChange={(e) => setAvatarEditor((prev) => ({ ...prev, scale: Number(e.target.value) }))}
                              className="w-full accent-primary disabled:opacity-40"
                            />
                          </div>
                          <div>
                            <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-widest text-foreground/40">
                              <span>Trái / phải</span>
                              <span>{avatarEditor.offsetX}px</span>
                            </div>
                            <input
                              type="range"
                              min="-80"
                              max="80"
                              step="1"
                              value={avatarEditor.offsetX}
                              disabled={!avatarEditor.previewUrl}
                              onChange={(e) => setAvatarEditor((prev) => ({ ...prev, offsetX: Number(e.target.value) }))}
                              className="w-full accent-primary disabled:opacity-40"
                            />
                          </div>
                          <div>
                            <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-widest text-foreground/40">
                              <span>Trên / dưới</span>
                              <span>{avatarEditor.offsetY}px</span>
                            </div>
                            <input
                              type="range"
                              min="-80"
                              max="80"
                              step="1"
                              value={avatarEditor.offsetY}
                              disabled={!avatarEditor.previewUrl}
                              onChange={(e) => setAvatarEditor((prev) => ({ ...prev, offsetY: Number(e.target.value) }))}
                              className="w-full accent-primary disabled:opacity-40"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      {[
                        { key: "fullName", label: "Họ và tên", ph: "Nguyễn Văn A", required: true },
                        { key: "phone", label: "Số điện thoại", ph: "0901234567" },
                        { key: "address", label: "Địa chỉ hiện tại", ph: "Khu Công nghệ cao Hòa Lạc, Hà Nội", fullWidth: true },
                        { key: "bankAccountNumber", label: "Số tài khoản ngân hàng", ph: "0123456789" },
                        { key: "bankName", label: "Ngân hàng", ph: "Vietcombank" },
                        { key: "bankAccountHolder", label: "Chủ tài khoản", ph: "NGUYEN VAN A", fullWidth: true },
                      ].map((f) => (
                        <div key={f.key} className={f.fullWidth ? "md:col-span-2" : ""}>
                          <label className="block text-xs font-black uppercase tracking-widest text-foreground/40 mb-2">
                            {f.label} {f.required && <span className="text-secondary">*</span>}
                          </label>
                          <input
                            type="text"
                            required={!!f.required}
                            placeholder={f.ph}
                            value={editForm[f.key]}
                            onChange={(e) => setEditForm({ ...editForm, [f.key]: e.target.value })}
                            className="w-full px-5 py-4 border border-primary/10 rounded-2xl text-sm font-bold bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-foreground/20"
                          />
                        </div>
                      ))}

                      <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-foreground/40 mb-2">Ngày sinh</label>
                        <input
                          type="date"
                          max={new Date().toISOString().split("T")[0]}
                          value={editForm.dateOfBirth}
                          onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                          className="w-full px-5 py-4 border border-primary/10 rounded-2xl text-sm font-bold bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-foreground/40 mb-2">Giới tính</label>
                        <select
                          value={editForm.gender}
                          onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                          className="w-full px-5 py-4 border border-primary/10 rounded-2xl text-sm font-bold bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all appearance-none cursor-pointer"
                        >
                          <option value="">-- Chọn --</option>
                          <option value="male">Nam</option>
                          <option value="female">Nữ</option>
                          <option value="other">Khác</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                      <button type="button" onClick={() => setActiveTab("overview")}
                        className="flex-1 py-4 border-2 border-primary/10 rounded-pill text-sm font-black uppercase tracking-widest text-primary hover:bg-primary/5 transition-all">
                        Hủy bỏ
                      </button>
                      <button type="submit" disabled={editLoading}
                        className="flex-1 py-4 bg-primary text-white rounded-pill text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-60">
                        {editLoading ? "Đang lưu..." : "Cập nhật hồ sơ"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === "security" ? (
                <div>
                  <div className="border-b border-primary/5 bg-white px-10 py-6">
                    <h2 className="flex items-center gap-3 font-display text-xl font-black text-foreground">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary">
                        <span className="material-symbols-outlined text-[20px]">lock</span>
                      </div>
                      Bảo mật tài khoản
                    </h2>
                  </div>
                  <form onSubmit={handleChangePassword} className="max-w-xl p-10">
                    {passMsg ? (
                      <div className={`mb-8 flex items-center gap-3 rounded-2xl border p-5 text-sm font-bold ${passMsg.type === "success"
                        ? "border-primary/20 bg-primary/5 text-primary"
                        : "border-secondary/20 bg-secondary/5 text-secondary"
                        }`}>
                        <span className="material-symbols-outlined text-[20px]">
                          {passMsg.type === "success" ? "check_circle" : "error"}
                        </span>
                        {passMsg.text}
                      </div>
                    ) : null}
                    {[
                      { key: "current", label: "Mật khẩu hiện tại", ph: "••••••••" },
                      { key: "newPass", label: "Mật khẩu mới", ph: "Tối thiểu 6 ký tự" },
                      { key: "confirm", label: "Xác nhận mật khẩu mới", ph: "Nhập lại mật khẩu mới" },
                    ].map((field) => (
                      <div key={field.key} className="mb-6">
                        <label className="mb-2 block text-xs font-black uppercase tracking-widest text-foreground/40">{field.label}</label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          placeholder={field.ph}
                          value={passwords[field.key]}
                          onChange={(e) => setPasswords({ ...passwords, [field.key]: e.target.value })}
                          className="w-full rounded-2xl border border-primary/10 bg-white px-5 py-4 text-sm font-bold outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
                        />
                      </div>
                    ))}
                    <button
                      type="submit"
                      disabled={passLoading}
                      className="mt-2 w-full md:w-auto rounded-pill bg-primary px-12 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
                    >
                      {passLoading ? "Đang xử lý..." : "Đổi mật khẩu"}
                    </button>
                  </form>
                </div>
              ) : null}

              {activeTab === "reputation" ? (
                <div>
                  <div className="border-b border-primary/5 bg-white px-10 py-6">
                    <h2 className="flex items-center gap-3 font-display text-xl font-black text-foreground">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary">
                        <span className="material-symbols-outlined text-[20px]">history</span>
                      </div>
                      Lịch sử điểm uy tín
                    </h2>
                  </div>
                  {histLoading ? (
                    <div className="flex justify-center p-20">
                      <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    </div>
                  ) : history.length === 0 ? (
                    <div className="flex flex-col items-center gap-6 p-20 text-center">
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/5 text-primary/20">
                        <span className="material-symbols-outlined text-6xl">verified_user</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-display font-black text-foreground mb-2">Hồ sơ tuyệt vời!</h3>
                        <p className="text-on-surface-variant font-medium">Bạn chưa từng bị trừ điểm uy tín nào.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-primary/5">
                      {history.map((item, index) => (
                        <div key={index} className="flex items-start gap-6 px-10 py-8 hover:bg-primary/5 transition-colors">
                          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-lg font-black text-secondary border border-secondary/20 shadow-sm shadow-secondary/10">
                            {item.changeAmount}
                          </div>
                          <div className="flex-1">
                            <p className="text-base font-bold text-foreground mb-2">{item.reason}</p>
                            <div className="flex flex-wrap gap-6 text-[10px] font-black uppercase tracking-[0.1em] text-on-surface-variant/40">
                              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[14px]">calendar_today</span> {new Date(item.createdAt).toLocaleDateString("vi-VN")}</span>
                              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[14px]">person</span> {item.changedBy?.fullName || "Hệ thống"}</span>
                              <span className="flex items-center gap-2 text-secondary/60"><span className="material-symbols-outlined text-[14px]">warning</span> Vi phạm: {item.violationLevel}</span>
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
        </div>
    </EcoTradeLayout>
  );
};

export default Profile;
