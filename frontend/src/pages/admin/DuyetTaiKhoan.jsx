import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import adminService from "../../services/admin.service";

const TABS = ["Chờ duyệt", "Đã duyệt", "Từ chối", "Bị khóa"];
const STATUS_FILTER = ["PENDING", "APPROVED", "REJECTED", "BANNED"];

const STATUS_MAP = {
  PENDING: { label: "Chờ duyệt", color: "bg-surface-container text-on-surface-variant" },
  APPROVED: { label: "Đã duyệt", color: "bg-secondary-container text-on-secondary-container" },
  REJECTED: { label: "Từ chối", color: "bg-error-container text-on-error-container" },
  BANNED: { label: "Bị khóa", color: "bg-error text-on-error" },
};

const DuyetTaiKhoan = () => {
  const [tab, setTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers({ status: STATUS_FILTER[tab] });
      if (res.success) setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleApprove = async (id) => {
    if (!window.confirm("Xác nhận duyệt tài khoản này?")) return;
    try {
      const res = await adminService.approveUser(id);
      if (res.success) fetchUsers();
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || err.message));
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Lý do từ chối?");
    if (!reason) return;
    try {
      const res = await adminService.rejectUser(id, reason);
      if (res.success) fetchUsers();
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
          <h1 className="text-2xl font-bold text-on-surface mb-8">Duyệt tài khoản (KYC)</h1>

          {/* Tabs */}
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
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl block mb-3">inbox</span>
              <p className="text-sm">Không có tài khoản nào trong mục này.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {users.map((user) => {
                const statusKey = user.accountStatus || "PENDING";
                const s = STATUS_MAP[statusKey] || STATUS_MAP.PENDING;
                return (
                  <div key={user._id} className="bg-surface-container-lowest rounded-2xl shadow-apple border border-surface-variant/30 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base uppercase">
                          {user.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="font-semibold text-on-surface">{user.name}</p>
                          <p className="text-sm text-on-surface-variant">{user.email} • {user.phone}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            Điểm uy tín: {user.reputationScore} • Đăng ký: {formatDate(user.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${s.color}`}>{s.label}</span>
                        {/* We would show ID card photos here if uploaded */}
                      </div>
                    </div>
                    {statusKey === "PENDING" && (
                      <div className="flex gap-3 mt-4 pt-4 border-t border-surface-variant/40">
                        <button onClick={() => handleApprove(user._id)} className="px-5 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:opacity-90 transition-all">
                          ✓ Duyệt tài khoản
                        </button>
                        <button onClick={() => handleReject(user._id)} className="px-5 py-2 border border-error/30 text-error rounded-lg text-sm font-semibold hover:bg-error/5 transition-all">
                          ✗ Từ chối
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
export default DuyetTaiKhoan;
