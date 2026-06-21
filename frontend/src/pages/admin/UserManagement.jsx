import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import adminService from "../../services/admin.service";
import userService from "../../services/user.service";
import toast from "react-hot-toast";

// accountStatus trong model: "active" | "inactive" | "banned"
// verificationStatus:        "unverified" | "pending" | "verified" | "rejected"
const ACC_BADGE = {
  active: { label: "Hoạt động", color: "bg-secondary-container text-on-secondary-container" },
  inactive: { label: "Chưa kích hoạt", color: "bg-surface-container text-on-surface-variant" },
  banned: { label: "Bị khóa", color: "bg-error text-on-error" },
};
const VER_BADGE = {
  unverified: { label: "Chưa XM", color: "bg-surface-container text-on-surface-variant" },
  pending: { label: "Chờ duyệt", color: "bg-surface-container-high text-on-surface" },
  verified: { label: "Đã XM", color: "bg-secondary-container text-on-secondary-container" },
  rejected: { label: "Từ chối", color: "bg-error-container text-on-error-container" },
};
const ROLE_MAP = { user: "Người dùng", admin: "Quản trị", shipper: "Shipper" };

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Deduct modal
  const [showDeduct, setShowDeduct] = useState(null);
  const [violationLevel, setViolationLevel] = useState("warning");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Change role modal
  const [showRole, setShowRole] = useState(null);
  const [newRole, setNewRole] = useState("user");
  const [roleSubmitting, setRoleSubmitting] = useState(false);

  // Reputation history modal
  const [showHistory, setShowHistory] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers();
      // Backend /users/admin trả về { success, users, total }
      if (res.success) setUsers(res.users || res.data || []);
    } catch {
      toast.error("Lỗi lấy danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // Trừ điểm qua reputation controller
  const handleDeduct = async () => {
    if (!reason.trim()) return toast.error("Vui lòng nhập lý do");
    setIsSubmitting(true);
    try {
      const res = await adminService.deductReputation(showDeduct._id, { violationLevel, reason });
      if (res.success) {
        toast.success(`Đã trừ điểm uy tín`);
        setShowDeduct(null);
        setReason("");
        setViolationLevel("warning");
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi trừ điểm");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Đổi vai trò
  const handleChangeRole = async () => {
    setRoleSubmitting(true);
    try {
      const res = await adminService.updateUser(showRole._id, { role: newRole });
      if (res.success) {
        toast.success(`Đã đổi vai trò thành ${ROLE_MAP[newRole]}`);
        setShowRole(null);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi đổi vai trò");
    } finally {
      setRoleSubmitting(false);
    }
  };

  // Xem lịch sử uy tín
  const handleViewHistory = async (u) => {
    setShowHistory(u);
    setHistoryLogs([]);
    setHistoryLoading(true);
    try {
      const res = await userService.getAdminReputationHistory(u._id);
      if (res.success) setHistoryLogs(res.logs || []);
    } catch {
      toast.error("Không thể tải lịch sử uy tín");
    } finally {
      setHistoryLoading(false);
    }
  };

  // Khóa / Mở khóa tài khoản
  const handleToggleBan = async (u) => {
    const isBanned = u.accountStatus === "banned";
    if (!window.confirm(`${isBanned ? "Mở khóa" : "Khóa"} tài khoản "${u.fullName || u.name}"?`)) return;
    try {
      const res = isBanned ? await adminService.unbanUser(u._id) : await adminService.banUser(u._id);
      if (res.success) {
        toast.success(`${isBanned ? "Mở khóa" : "Khóa"} thành công`);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi hệ thống");
    }
  };

  const POINTS = { warning: 10, minor: 20, major: 50 };

  const filtered = users.filter((u) => {
    const name = (u.fullName || u.name || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <Sidebar variant="admin" />
      <main className="flex-1 md:ml-72 px-4 md:px-10 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
            <h1 className="text-2xl font-bold text-on-surface">Quản lý người dùng</h1>
            <div className="flex items-center bg-surface-container-lowest border border-surface-variant rounded-xl px-4 py-2.5 gap-2 w-72">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
              <input className="bg-transparent outline-none text-sm flex-1 placeholder:text-on-surface-variant"
                placeholder="Tìm theo tên hoặc email..."
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl shadow-apple border border-surface-variant/30 overflow-hidden">
            {loading ? (
              <div className="p-10 flex justify-center">
                <span className="material-symbols-outlined animate-spin text-3xl text-primary">refresh</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center text-on-surface-variant text-sm">Không tìm thấy người dùng nào.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-bright/70 border-b border-surface-variant/50">
                    <tr>
                      {["Người dùng", "Vai trò", "Xác minh", "Uy tín", "Tài khoản", "Tham gia", ""].map((h) => (
                        <th key={h} className="px-4 py-3.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-variant/30">
                    {filtered.map((u) => {
                      const accBadge = ACC_BADGE[u.accountStatus] || ACC_BADGE.active;
                      const verBadge = VER_BADGE[u.verificationStatus] || VER_BADGE.unverified;
                      const displayName = u.fullName || u.name || "";
                      return (
                        <tr key={u._id} className="hover:bg-surface-bright/40 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              {u.avatarUrl
                                ? <img src={u.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                                : <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                                  {displayName.charAt(0).toUpperCase() || "U"}
                                </div>
                              }
                              <div>
                                <p className="font-semibold text-on-surface text-sm">{displayName}</p>
                                <p className="text-xs text-on-surface-variant">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-xs px-2.5 py-1 bg-surface-container text-on-surface-variant rounded-full">
                              {ROLE_MAP[u.role] || u.role}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${verBadge.color}`}>
                              {verBadge.label}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-14 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${u.reputationScore < 50 ? "bg-error" : "bg-primary"}`}
                                  style={{ width: `${Math.min(u.reputationScore, 100)}%` }} />
                              </div>
                              <span className="text-sm font-semibold text-on-surface">{u.reputationScore}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${accBadge.color}`}>
                              {accBadge.label}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-xs text-on-surface-variant">
                            {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex gap-1">
                              <button onClick={() => handleViewHistory(u)}
                                className="p-1.5 text-on-surface-variant hover:text-primary transition-colors" title="Lịch sử uy tín">
                                <span className="material-symbols-outlined text-[18px]">history</span>
                              </button>
                              <button onClick={() => { setShowRole(u); setNewRole(u.role); }}
                                className="p-1.5 text-on-surface-variant hover:text-secondary transition-colors" title="Đổi vai trò">
                                <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                              </button>
                              <button onClick={() => setShowDeduct(u)}
                                className="p-1.5 text-on-surface-variant hover:text-error transition-colors" title="Trừ điểm">
                                <span className="material-symbols-outlined text-[18px]">remove_circle</span>
                              </button>
                              <button onClick={() => handleToggleBan(u)}
                                className="p-1.5 text-on-surface-variant hover:text-error transition-colors"
                                title={u.accountStatus === "banned" ? "Mở khóa" : "Khóa"}>
                                <span className="material-symbols-outlined text-[18px]">
                                  {u.accountStatus === "banned" ? "lock_open" : "block"}
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal đổi vai trò */}
      {showRole && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-apple-md border border-surface-variant w-full max-w-sm">
            <h3 className="font-bold text-on-surface mb-1">Đổi vai trò</h3>
            <p className="text-sm text-on-surface-variant mb-5">
              {showRole.fullName || showRole.name} — Hiện tại: <strong>{ROLE_MAP[showRole.role]}</strong>
            </p>

            <div className="grid grid-cols-3 gap-2 mb-6">
              {[
                { v: "user", label: "Người dùng", icon: "person" },
                { v: "shipper", label: "Shipper", icon: "local_shipping" },
                { v: "admin", label: "Quản trị", icon: "admin_panel_settings" },
              ].map((opt) => (
                <button key={opt.v} type="button" onClick={() => setNewRole(opt.v)}
                  className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all flex flex-col items-center gap-1 ${newRole === opt.v
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-surface-variant text-on-surface-variant hover:border-primary/40"
                    }`}>
                  <span className="material-symbols-outlined text-[20px]">{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowRole(null)} disabled={roleSubmitting}
                className="flex-1 py-2.5 border border-surface-variant rounded-xl text-sm font-medium hover:bg-surface-container-low transition-all">
                Hủy
              </button>
              <button onClick={handleChangeRole} disabled={roleSubmitting || newRole === showRole.role}
                className="flex-1 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50">
                {roleSubmitting ? "Đang lưu..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal lịch sử uy tín */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-surface-container-lowest rounded-2xl shadow-apple-md border border-surface-variant w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-surface-variant/30 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-on-surface">Lịch sử điểm uy tín</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {showHistory.fullName || showHistory.name} — Điểm hiện tại: <strong>{showHistory.reputationScore}</strong>
                </p>
              </div>
              <button onClick={() => setShowHistory(null)}
                className="p-1.5 text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {historyLoading ? (
                <div className="p-10 flex justify-center">
                  <span className="material-symbols-outlined animate-spin text-2xl text-primary">refresh</span>
                </div>
              ) : historyLogs.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl opacity-30">verified_user</span>
                  <p className="text-sm">Chưa có lần trừ điểm nào.</p>
                </div>
              ) : (
                <div className="divide-y divide-surface-variant/30">
                  {historyLogs.map((log, i) => (
                    <div key={i} className="px-6 py-4 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-error/10 text-error flex items-center justify-center font-black text-sm flex-shrink-0">
                        {log.changeAmount}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-on-surface text-sm">{log.reason}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-on-surface-variant mt-1">
                          <span>{new Date(log.createdAt).toLocaleDateString("vi-VN")}</span>
                          <span>Bởi: {log.changedBy?.fullName || "Admin"}</span>
                          <span className={`font-semibold ${
                            log.violationLevel === "major" ? "text-error"
                            : log.violationLevel === "minor" ? "text-amber-600"
                            : "text-on-surface-variant"
                          }`}>
                            {log.violationLevel === "major" ? "Vi phạm nặng"
                              : log.violationLevel === "minor" ? "Vi phạm vừa"
                              : "Cảnh báo"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal trừ điểm */}
      {showDeduct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-apple-md border border-surface-variant w-full max-w-md">
            <h3 className="font-bold text-on-surface mb-1">Trừ điểm uy tín</h3>
            <p className="text-sm text-on-surface-variant mb-5">
              {showDeduct.fullName || showDeduct.name} — Hiện có <strong>{showDeduct.reputationScore}</strong> điểm
            </p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { v: "warning", label: "Nhẹ", pts: 10 },
                { v: "minor", label: "Vừa", pts: 20 },
                { v: "major", label: "Nặng", pts: 50 },
              ].map((opt) => (
                <button key={opt.v} type="button" onClick={() => setViolationLevel(opt.v)}
                  className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all flex flex-col items-center ${violationLevel === opt.v
                    ? "border-error bg-error/5 text-error"
                    : "border-surface-variant text-on-surface-variant hover:border-error/40"
                    }`}>
                  <span>{opt.label}</span>
                  <span className="text-[10px] font-normal">-{opt.pts} điểm</span>
                </button>
              ))}
            </div>

            <textarea
              className="w-full px-4 py-3 border border-surface-variant rounded-xl text-sm bg-surface-bright focus:border-error outline-none resize-none min-h-[80px] mb-4 transition-all"
              placeholder="Lý do trừ điểm..." value={reason}
              onChange={(e) => setReason(e.target.value)} />

            <div className="flex gap-3">
              <button onClick={() => { setShowDeduct(null); setReason(""); }} disabled={isSubmitting}
                className="flex-1 py-2.5 border border-surface-variant rounded-xl text-sm font-medium hover:bg-surface-container-low transition-all">
                Hủy
              </button>
              <button onClick={handleDeduct} disabled={isSubmitting}
                className="flex-1 py-2.5 bg-error text-on-error rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50">
                {isSubmitting ? "Đang xử lý..." : `Trừ ${POINTS[violationLevel]} điểm`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default UserManagement;
