import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import notificationService from "../../services/notification.service";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const getIconData = (type) => {
    switch (type) {
      case "ORDER": return { icon: "shopping_bag", bg: "bg-primary-fixed-dim text-on-primary-fixed" };
      case "RENTAL": return { icon: "handshake", bg: "bg-secondary-container text-on-secondary-container" };
      case "SYSTEM": return { icon: "info", bg: "bg-surface-container-high text-on-surface" };
      default: return { icon: "notifications", bg: "bg-surface-variant text-on-surface" };
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')} ${d.toLocaleDateString("vi-VN")}`;
  };

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <Sidebar variant="user" />
      <main className="flex-1 md:ml-64 px-4 md:px-10 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-on-surface">Thông báo</h1>
            <button onClick={handleMarkAllAsRead} className="text-primary text-sm font-medium hover:underline">
              Đánh dấu tất cả đã đọc
            </button>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl shadow-apple border border-surface-variant/30 overflow-hidden divide-y divide-surface-variant/30">
            {loading ? (
              <div className="p-8 text-center text-on-surface-variant">Đang tải...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant">Chưa có thông báo nào.</div>
            ) : (
              notifications.map((n) => {
                const iconData = getIconData(n.type);
                return (
                  <div key={n._id} onClick={() => !n.read && handleMarkAsRead(n._id)}
                    className={`flex items-start gap-4 p-5 transition-colors hover:bg-surface-bright/40 cursor-pointer ${!n.read ? "bg-secondary-container/10" : ""}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconData.bg}`}>
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{iconData.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!n.read ? "font-semibold text-on-surface" : "font-medium text-on-surface"}`}>{n.title}</p>
                        {!n.read && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />}
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{n.message}</p>
                      <p className="text-xs text-on-surface-variant mt-1.5">{formatDate(n.createdAt)}</p>
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
