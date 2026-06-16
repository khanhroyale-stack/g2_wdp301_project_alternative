import api from "./api";

const adminService = {
  getUsers: async (params) => {
    const response = await api.get("/users", { params });
    return response.data;
  },
  approveUser: async (id) => {
    const response = await api.patch(`/users/${id}/approve`);
    return response.data;
  },
  rejectUser: async (id, reason) => {
    const response = await api.patch(`/users/${id}/reject`, { reason });
    return response.data;
  },
  banUser: async (id) => {
    const response = await api.patch(`/users/${id}/ban`);
    return response.data;
  },
  unbanUser: async (id) => {
    const response = await api.patch(`/users/${id}/unban`);
    return response.data;
  },
  getReputationHistory: async (id) => {
    const response = await api.get(`/users/${id}/reputation-history`);
    return response.data;
  },
  deductReputation: async (id, data) => {
    const response = await api.patch(`/users/${id}/deduct-reputation`, data);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get("/admin/stats");
    return response.data;
  },
  getOrders: async (params) => {
    const response = await api.get("/admin/orders", { params });
    return response.data;
  },
  getRentals: async (params) => {
    const response = await api.get("/admin/rentals", { params });
    return response.data;
  }
};

export default adminService;
