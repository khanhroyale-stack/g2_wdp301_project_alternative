import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Sidebar";
import userService from "../../services/user.service";
import toast from "react-hot-toast";

const STATUS_MAP = {
  PENDING: { label: "Chờ xác minh", color: "bg-surface-container text-on-surface-variant" },
  APPROVED: { label: "Đã xác minh", color: "bg-secondary-container text-on-secondary-container" },
  REJECTED: { label: "Bị từ chối", color: "bg-error-container text-on-error-container" },
  BANNED: { label: "Bị khóa", color: "bg-error text-on-error" },
};

const HoSo = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Password state
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Reputation history state
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const isBanned = user?.reputationScore === 0;
  const currentStatus = isBanned ? "BANNED" : (user?.accountStatus || "PENDING");
  const status = STATUS_MAP[currentStatus] || STATUS_MAP.PENDING;

  useEffect(() => {
    if (activeTab === "reputation") {
      fetchReputationHistory();
    }
  }, [activeTab]);

  const fetchReputationHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const res = await userService.getReputationHistory(user._id);
      if (res.success) setHistory(res.data);
    } catch (err) {
      toast.error("Lỗi lấy lịch sử uy tín");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) return toast.error("Mật khẩu xác nhận không khớp");
    setIsChangingPass(true);
    try {
      const res = await userService.changePassword(user._id, {
        currentPassword: passwords.current,
        newPassword: passwords.newPass
      });
      if (res.success) {
        toast.success("Đổi mật khẩu thành công!");
        setPasswords({ current: "", newPass: "", confirm: "" });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi đổi mật khẩu");
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F5F5F7] font-sans">
      <Sidebar variant="user" />
      <main className="flex-1 md:ml-64 px-4 md:px-10 py-10 w-full max-w-6xl mx-auto">
        
        {/* Header section with gradient */}
        <div className="relative bg-gradient-to-r from-primary to-primary-fixed rounded-3xl p-8 md:p-10 mb-8 overflow-hidden shadow-lg">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-[-10%] left-[10%] w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-white/20 border-4 border-white/30 p-1 backdrop-blur-sm shadow-xl">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user?.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-white text-primary flex items-center justify-center text-3xl font-black">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="text-white/80 font-medium mb-1 uppercase tracking-wider text-sm">Hồ sơ của tôi</p>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">{user?.name}</h1>
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold inline-block shadow-sm ${
                  currentStatus === "APPROVED" ? "bg-white text-primary" :
                  currentStatus === "PENDING" ? "bg-yellow-400 text-yellow-900" : "bg-red-500 text-white"
                }`}>
                  {status.label}
                </span>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 text-center min-w-[160px] shadow-lg">
              <p className="text-white/80 text-sm font-medium mb-1">Điểm uy tín</p>
              <div className="text-4xl font-black text-white">{user?.reputationScore || 100}</div>
              <div className="mt-3 w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full shadow-[0_0_10px_white]" style={{ width: `${Math.min(user?.reputationScore || 100, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Warning nếu chưa xác minh */}
        {user?.accountStatus === "PENDING" && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-8 flex items-start gap-4 shadow-sm animate-pulse-slow">
            <span className="material-symbols-outlined text-orange-500 text-3xl">warning</span>
            <div>
              <p className="font-bold text-orange-900 text-lg">Tài khoản chưa được xác minh</p>
              <p className="text-orange-800 mt-1">
                Bạn cần <a href="/xac-minh-tai-khoan" className="text-primary font-bold underline decoration-primary/40 underline-offset-4">tải lên giấy tờ xác minh</a> để đăng bài và mua bán.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex bg-surface-container-lowest p-1.5 rounded-2xl mb-8 shadow-sm border border-surface-variant/30 w-fit">
          <button onClick={() => setActiveTab("overview")} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "overview" ? "bg-white text-primary shadow" : "text-on-surface-variant hover:text-on-surface"}`}>
            Tổng quan
          </button>
          <button onClick={() => setActiveTab("security")} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "security" ? "bg-white text-primary shadow" : "text-on-surface-variant hover:text-on-surface"}`}>
            Bảo mật
          </button>
          <button onClick={() => setActiveTab("reputation")} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "reputation" ? "bg-white text-primary shadow" : "text-on-surface-variant hover:text-on-surface"}`}>
            Lịch sử uy tín
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-surface-container-lowest rounded-3xl shadow-apple border border-surface-variant/30 overflow-hidden">
          {activeTab === "overview" && (
            <div>
              <div className="p-6 md:p-8 border-b border-surface-variant/30 bg-surface-bright/30">
                <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">person</span>
                  Thông tin liên hệ
                </h2>
              </div>
              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Họ và tên</label>
                  <div className="px-4 py-3 bg-surface-container-lowest border border-surface-variant/50 rounded-xl text-on-surface font-medium">{user?.name}</div>
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Email</label>
                  <div className="px-4 py-3 bg-surface-container-lowest border border-surface-variant/50 rounded-xl text-on-surface font-medium">{user?.email}</div>
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Số điện thoại</label>
                  <div className="px-4 py-3 bg-surface-container-lowest border border-surface-variant/50 rounded-xl text-on-surface font-medium">{user?.phone || "Chưa cập nhật"}</div>
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Vai trò</label>
                  <div className="px-4 py-3 bg-surface-container-lowest border border-surface-variant/50 rounded-xl text-on-surface font-medium">
                    {{ admin: "Quản trị viên", shipper: "Shipper", user: "Người dùng" }[user?.role]}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div>
              <div className="p-6 md:p-8 border-b border-surface-variant/30 bg-surface-bright/30">
                <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary">lock</span>
                  Đổi mật khẩu
                </h2>
              </div>
              <form onSubmit={handleChangePassword} className="p-6 md:p-8 max-w-xl">
                <div className="space-y-5 mb-8">
                  <div>
                    <label className="text-sm font-bold text-on-surface mb-2 block">Mật khẩu hiện tại</label>
                    <input type="password" required value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})}
                      className="w-full px-4 py-3 bg-surface-container-lowest border border-surface-variant/50 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-on-surface mb-2 block">Mật khẩu mới</label>
                    <input type="password" required minLength="6" value={passwords.newPass} onChange={e => setPasswords({...passwords, newPass: e.target.value})}
                      className="w-full px-4 py-3 bg-surface-container-lowest border border-surface-variant/50 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-on-surface mb-2 block">Xác nhận mật khẩu mới</label>
                    <input type="password" required minLength="6" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                      className="w-full px-4 py-3 bg-surface-container-lowest border border-surface-variant/50 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                  </div>
                </div>
                <button type="submit" disabled={isChangingPass}
                  className="px-8 py-3.5 bg-gradient-to-r from-primary to-primary-fixed text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95 disabled:opacity-50">
                  {isChangingPass ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "reputation" && (
            <div>
              <div className="p-6 md:p-8 border-b border-surface-variant/30 bg-surface-bright/30">
                <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">history</span>
                  Lịch sử điểm uy tín
                </h2>
              </div>
              <div className="p-0">
                {loadingHistory ? (
                  <div className="p-10 flex justify-center text-primary"><span className="material-symbols-outlined animate-spin text-4xl">refresh</span></div>
                ) : history.length === 0 ? (
                  <div className="p-10 text-center text-on-surface-variant flex flex-col items-center">
                    <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-4">
                       <span className="material-symbols-outlined text-3xl">verified</span>
                    </div>
                    <p className="font-medium">Bạn chưa từng bị trừ điểm uy tín.</p>
                    <p className="text-sm mt-1">Hãy tiếp tục giữ phong độ tốt nhé!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-surface-variant/30">
                    {history.map((h, i) => (
                      <div key={i} className="p-6 flex items-start gap-4 hover:bg-surface-bright/40 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center font-black flex-shrink-0">
                          -{h.pointsDeducted}
                        </div>
                        <div>
                          <p className="font-bold text-on-surface mb-1">{h.reason}</p>
                          <div className="flex gap-4 text-xs text-on-surface-variant">
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">calendar_today</span>{new Date(h.createdAt).toLocaleDateString("vi-VN")}</span>
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>Xử lý bởi: {h.processedBy?.name || "Admin"}</span>
                          </div>
                          <p className="mt-2 text-sm text-on-surface bg-surface-container-low px-3 py-1.5 rounded-lg inline-block font-medium">Điểm sau khi trừ: <strong className="text-primary">{h.scoreAfter}</strong></p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
export default HoSo;
