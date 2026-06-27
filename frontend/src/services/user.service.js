import api from "./api";

const userService = {

  // Lấy hồ sơ cá nhân hiện tại
  getMyProfile: () => api.get("/users/me").then((r) => r.data),

  // Cập nhật hồ sơ cá nhân hiện tại
  updateProfile: (data) => api.put("/users/me", data).then((r) => r.data),

  updateMyProfile: (data) => api.put("/users/me", data).then((r) => r.data),

  // Hồ sơ công khai của 1 user
  getPublicProfile: (id) => api.get(`/users/${id}`).then((r) => r.data),

  getReputationHistory: (userId) =>
    api.get(`/reputation/${userId}`).then((r) => r.data),

  getAdminReputationHistory: (userId) =>
    api.get(`/reputation/admin/${userId}/history`).then((r) => r.data),

  getUsers: (params) =>
    api.get("/users/admin", { params }).then((r) => r.data),

  getUserById: (id) =>
    api.get(`/users/admin/${id}`).then((r) => r.data),
};

export default userService;
