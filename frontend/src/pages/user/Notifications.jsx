import { useEffect, useState } from "react";
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
      if (res.success) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

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
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkOne = async (id) => {
    try {
      await notificationService.markOneRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClick = async (notification) => {
    if (!notification.isRead) {
      await handleMarkOne(notification._id);
    }

    if (notification.link) {
      navigate(notification.link);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <Sidebar variant="user" />
      <main className="flex-1 px-4 py-10 md:ml-72 md:px-10">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-on-surface">Thông báo</h1>
              {unreadCount > 0 ? (
                <p className="mt-0.5 text-sm text-on-surface-variant">{unreadCount} thông báo chưa đọc</p>
              ) : null}
            </div>
            {unreadCount > 0 ? (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                <span className="material-symbols-outlined text-[16px]">done_all</span>
                Đánh dấu tất cả đã đọc
              </button>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-2xl border border-surface-variant/30 bg-surface-container-lowest shadow-apple">
            {loading ? (
              <div className="flex flex-col items-center gap-3 p-8 text-center text-on-surface-variant">
                <span className="material-symbols-outlined animate-spin text-3xl text-primary">refresh</span>
                <p className="text-sm">Đang tải thông báo...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-3 p-12 text-center">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">
                  notifications_off
                </span>
                <p className="text-sm text-on-surface-variant">Chưa có thông báo nào.</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-variant/30">
                {notifications.map((notification) => {
                  const iconData = TYPE_ICON[notification.notificationType] || TYPE_ICON.system;

                  return (
                    <div
                      key={notification._id}
                      onClick={() => handleClick(notification)}
                      className={`flex cursor-pointer items-start gap-4 p-5 transition-colors hover:bg-surface-bright/40 ${
                        !notification.isRead ? "bg-secondary-container/10" : ""
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${iconData.bg}`}
                      >
                        <span
                          className="material-symbols-outlined text-[20px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          {iconData.icon}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm leading-snug ${
                              !notification.isRead ? "font-semibold text-on-surface" : "font-medium text-on-surface"
                            }`}
                          >
                            {notification.title}
                          </p>
                          {!notification.isRead ? (
                            <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">{notification.content}</p>
                        <div className="mt-1.5 flex items-center justify-between">
                          <p className="text-xs text-on-surface-variant">{formatDate(notification.createdAt)}</p>
                          {notification.link ? (
                            <span className="flex items-center gap-0.5 text-xs font-medium text-primary opacity-70">
                              Xem chi tiết
                              <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Notifications;
