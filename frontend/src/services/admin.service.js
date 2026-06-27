import api from "./api";

const adminService = {
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
  getUsers: async (params) => {
    const response = await api.get("/users/admin", { params });
    return response.data.users
      ? response.data
      : { success: response.data.success, data: response.data.users || [] };
  },
  approveUser: async (id) => {
    const response = await api.patch(`/verification/admin/${id}/approve`);
    return response.data;
  },
  rejectUser: async (id, reason) => {
    const response = await api.patch(`/verification/admin/${id}/reject`, { reason });
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
  deductReputation: async (id, data) => {
    const response = await api.post("/reputation/admin/deduct", { userId: id, ...data });
    return response.data;
  },
  getReputationHistory: async (id) => {
    const response = await api.get(`/reputation/admin/${id}/history`);
    return response.data;
  },
  getShippers: async () => (await api.get("/admin/shippers")).data,
  getDeliveries: async (params) => (await api.get("/admin/deliveries", { params })).data,
  getInspections: async (params) => (await api.get("/admin/inspections", { params })).data,
};

export default adminService;
