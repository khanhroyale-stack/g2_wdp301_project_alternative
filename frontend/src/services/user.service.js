import api from "./api";

const userService = {
  changePassword: async (id, data) => {
    const res = await api.patch(`/users/${id}/change-password`, data);
    return res.data;
  },
  getReputationHistory: async (id) => {
    const res = await api.get(`/users/${id}/reputation-history`);
    return res.data;
  },
  updateProfile: async (id, data) => {
    const res = await api.put(`/users/${id}`, data);
    return res.data;
  },
  uploadCccd: async (id, data) => {
    const res = await api.patch(`/users/${id}/upload-cccd`, data);
    return res.data;
  }
};

export default userService;
