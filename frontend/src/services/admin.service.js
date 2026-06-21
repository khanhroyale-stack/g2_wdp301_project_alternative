import api from "./api";

const adminService = {
  // Users
  getUsers: async (params) => {
    const response = await api.get("/users/admin", { params });
    return response.data;
  },
  updateUser: async (id, data) => {
    const response = await api.put(`/users/admin/${id}`, data);
    return response.data;
  },
  banUser: async (id) => {
    const response = await api.put(`/users/admin/${id}`, { accountStatus: "banned" });
    return response.data;
  },
  unbanUser: async (id) => {
    const response = await api.put(`/users/admin/${id}`, { accountStatus: "active" });
    return response.data;
  },

  // Reputation
  deductReputation: async (id, data) => {
    const response = await api.post("/reputation/admin/deduct", { userId: id, ...data });
    return response.data;
  },
  getReputationHistory: async (id) => {
    const response = await api.get(`/reputation/admin/${id}/history`);
    return response.data;
  },

  // Stats
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
  },
};

export default adminService;
