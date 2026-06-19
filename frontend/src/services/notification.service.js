import api from "./api";

const notificationService = {
  getMyNotifications: () => api.get("/notifications").then((r) => r.data),
  getUnreadCount: () => api.get("/notifications/unread-count").then((r) => r.data),
  markAllRead: () => api.patch("/notifications/read-all").then((r) => r.data),
  markOneRead: (id) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
};

export default notificationService;
