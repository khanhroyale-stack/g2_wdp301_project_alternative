import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import adminService from "../../services/admin.service";
import toast from "react-hot-toast";

const STATUS_MAP = {
  APPROVED: { label: "Hoạt động", color: "bg-secondary-container text-on-secondary-container" },
  PENDING: { label: "Chờ duyệt", color: "bg-surface-container text-on-surface-variant" },
  REJECTED: { label: "Từ chối", color: "bg-error-container text-on-error-container" },
  BANNED: { label: "Bị khóa", color: "bg-error text-on-error" },
};
const ROLE_MAP = { user: "Người dùng", admin: "Quản trị", shipper: "Shipper" };

const QuanLyNguoiDung = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showDeduct, setShowDeduct] = useState(null);
  const [points, setPoints] = useState("10");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers();
      if (res.success) {
        setUsers(res.data);
      }
    } catch (err) {
      toast.error("Lỗi lấy danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeduct = async () => {
    if (!reason.trim()) return toast.error("Vui lòng nhập lý do");
    setIsSubmitting(true);
    try {
      const res = await adminService.deductReputation(showDeduct._id, { points: Number(points), reason });
      if (res.success) {
        toast.success("Đã trừ điểm uy tín");
        setShowDeduct(null);
        setReason("");
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi trừ điểm");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleBan = async (user) => {
    const isBanned = user.accountStatus === "BANNED";
    if (!window.confirm(`Bạn có chắc muốn ${isBanned ? "mở khóa" : "khóa"} tài khoản này?`)) return;
    try {
      let res;
      if (isBanned) {
        res = await adminService.unbanUser(user._id);
      } else {
        res = await adminService.banUser(user._id);
      }
      if (res.success) {
        toast.success(`${isBanned ? "Mở khóa" : "Khóa"} thành công`);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi hệ thống");
    }
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <Sidebar variant="admin" />
      <main className="flex-1 md:ml-64 px-4 md:px-10 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-on-surface">Quản lý người dùng</h1>
            <div className="flex items-center bg-surface-container-lowest border border-surface-variant rounded-xl px-4 py-2.5 gap-2 w-72">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
              <input className="bg-transparent outline-none text-sm flex-1 placeholder:text-on-surface-variant"
                placeholder="Tìm theo tên hoặc email..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl shadow-apple border border-surface-variant/30 overflow-hidden">
            {loading ? (
              <div className="p-10 flex justify-center text-primary">
                <span className="material-symbols-outlined animate-spin text-4xl">refresh</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-bright/70 border-b border-surface-variant/50">
                    <tr>
                      {["Người dùng", "Vai trò", "Điểm uy tín", "Giao dịch", "Tham gia", "Trạng thái", "Hành động"].map((h) => (
                        <th key={h} className="px-4 py-3.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-variant/30">
                    {filtered.map((user) => {
                      const s = STATUS_MAP[user.accountStatus] || STATUS_MAP.PENDING;
                      return (
                        <tr key={user._id} className="hover:bg-surface-bright/40 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              {user.avatar ? (
                                <img src={user.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-on-surface text-sm">{user.name}</p>
                                <p className="text-xs text-on-surface-variant">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-xs px-2.5 py-1 bg-surface-container text-on-surface-variant rounded-full">
                              {ROLE_MAP[user.role] || user.role}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${user.reputationScore < 50 ? 'bg-error' : 'bg-primary'}`} style={{ width: `${Math.min(user.reputationScore, 100)}%` }} />
                              </div>
                              <span className="text-sm font-semibold text-on-surface">{user.reputationScore}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-on-surface-variant text-center">--</td>
                          <td className="px-4 py-4 text-xs text-on-surface-variant">{new Date(user.createdAt).toLocaleDateString("vi-VN")}</td>
                          <td className="px-4 py-4">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${s.color}`}>{s.label}</span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex gap-1">
                              <button onClick={() => setShowDeduct(user)} className="p-1.5 text-on-surface-variant hover:text-error transition-colors" title="Trừ điểm">
                                <span className="material-symbols-outlined text-[18px]">remove_circle</span>
                              </button>
                              <button onClick={() => handleToggleBan(user)} className="p-1.5 text-on-surface-variant hover:text-error transition-colors" title={user.accountStatus === "BANNED" ? "Mở khóa" : "Khóa tài khoản"}>
                                <span className="material-symbols-outlined text-[18px]">{user.accountStatus === "BANNED" ? "lock_open" : "block"}</span>
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

      {/* Modal trừ điểm */}
      {showDeduct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-apple-md border border-surface-variant w-full max-w-md">
            <h3 className="font-bold text-on-surface mb-1">Trừ điểm uy tín</h3>
            <p className="text-sm text-on-surface-variant mb-5">{showDeduct.name} — Hiện có {showDeduct.reputationScore} điểm</p>
            <div className="flex gap-3 mb-4">
              {[10, 20, 50].map((p) => (
                <button key={p} onClick={() => setPoints(String(p))}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${points === String(p) ? "border-error bg-error/5 text-error" : "border-surface-variant text-on-surface-variant hover:border-error/40"
                    }`}>
                  -{p} điểm
                </button>
              ))}
            </div>
            <textarea className="w-full px-4 py-3 border border-surface-variant rounded-xl text-sm bg-surface-bright focus:border-error outline-none resize-none min-h-[80px] mb-4"
              placeholder="Lý do trừ điểm..." value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => setShowDeduct(null)} disabled={isSubmitting}
                className="flex-1 py-2.5 border border-surface-variant rounded-xl text-sm font-medium hover:bg-surface-container-low transition-all">Hủy</button>
              <button className="flex-1 py-2.5 bg-error text-on-error rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                onClick={handleDeduct} disabled={isSubmitting}>
                {isSubmitting ? "Đang xử lý..." : "Xác nhận trừ điểm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default QuanLyNguoiDung;
