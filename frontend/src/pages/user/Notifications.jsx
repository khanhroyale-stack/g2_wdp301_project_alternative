import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import notificationService from "../../services/notification.service";
import { useAuth } from "../../context/AuthContext";

const TYPE_ICON = {
  order_update: { icon: "shopping_bag", bg: "bg-primary-fixed-dim text-on-primary-fixed" },
  rental_update: { icon: "handshake", bg: "bg-secondary-container text-on-secondary-container" },
  payment: { icon: "payments", bg: "bg-secondary-container text-on-secondary-container" },
  report_update: { icon: "report", bg: "bg-error-container text-on-error-container" },
  verification_update: { icon: "verified_user", bg: "bg-secondary-container text-on-secondary-container" },
  review: { icon: "star", bg: "bg-surface-container-high text-on-surface" },
  chat: { icon: "chat_bubble", bg: "bg-surface-container text-on-surface-variant" },
  system: { icon: "info", bg: "bg-surface-container text-on-surface-variant" },
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 172800) return "Hôm qua";
  return d.toLocaleDateString("vi-VN");
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { clearUnread, notifications: realtimeNotifs } = useAuth();
  const navigate = useNavigate();

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await notificationService.getMyNotifications();
      if (res.success) setNotifications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  // Khi có notification realtime mới từ AuthContext, thêm vào đầu danh sách
  useEffect(() => {
    if (realtimeNotifs.length > 0) {
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n._id));
        const newOnes = realtimeNotifs.filter((n) => n._id && !existingIds.has(n._id));
        return newOnes.length > 0 ? [...newOnes, ...prev] : prev;
      });
    }
  }, [realtimeNotifs]);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      clearUnread();
    } catch (err) { console.error(err); }
  };

  const handleMarkOne = async (id) => {
    try {
      await notificationService.markOneRead(id);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) { console.error(err); }
  };

  // Click vào notification: đánh dấu đọc + điều hướng nếu có link
  const handleClick = async (n) => {
    if (!n.isRead) {
      await handleMarkOne(n._id);
    }
    if (n.link) {
      navigate(n.link);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <Sidebar variant="user" />
      <main className="flex-1 md:ml-64 px-4 md:px-10 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-on-surface">Thông báo</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-on-surface-variant mt-0.5">{unreadCount} thông báo chưa đọc</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead}
                className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">done_all</span>
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div className="bg-surface-container-lowest rounded-2xl shadow-apple border border-surface-variant/30 overflow-hidden divide-y divide-surface-variant/30">
            {loading ? (
              <div className="p-8 text-center text-on-surface-variant flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-3xl animate-spin text-primary">refresh</span>
                <p className="text-sm">Đang tải thông báo...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">notifications_off</span>
                <p className="text-on-surface-variant text-sm">Chưa có thông báo nào.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const iconData = TYPE_ICON[n.notificationType] || TYPE_ICON.system;
                return (
                  <div key={n._id}
                    onClick={() => handleClick(n)}
                    className={`flex items-start gap-4 p-5 transition-colors hover:bg-surface-bright/40 cursor-pointer ${!n.isRead ? "bg-secondary-container/10" : ""}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconData.bg}`}>
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {iconData.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-snug ${!n.isRead ? "font-semibold text-on-surface" : "font-medium text-on-surface"}`}>
                          {n.title}
                        </p>
                        {!n.isRead && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />}
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{n.content}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <p className="text-xs text-on-surface-variant">{formatDate(n.createdAt)}</p>
                        {n.link && (
                          <span className="text-xs text-primary font-medium flex items-center gap-0.5 opacity-70">
                            Xem chi tiết
                            <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
export default Notifications;
