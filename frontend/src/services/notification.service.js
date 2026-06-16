import api from "./api";

const notificationService = {
  getMyNotifications: async () => {
    const response = await api.get("/notifications/my");
    return response.data;
  },
  markAsRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },
  markAllAsRead: async () => {
    const response = await api.patch("/notifications/read-all");
    return response.data;
  }
};

export default notificationService;
