import api from "./api";

const userService = {
  // Lấy hồ sơ cá nhân hiện tại
  getMyProfile: () => api.get("/users/me").then((r) => r.data),

  // Cập nhật hồ sơ cá nhân hiện tại
  updateProfile: (data) => api.put("/users/me", data).then((r) => r.data),

  updateMyProfile: (data) => api.put("/users/me", data).then((r) => r.data),

  // Lịch sử điểm uy tín (gọi reputation routes)
  getReputationHistory: (userId) =>
    api.get(`/reputation/admin/${userId}/history`).then((r) => r.data),

  // Admin: lấy users theo filter
  getUsers: (params) =>
    api.get("/users", { params }).then((r) => r.data),

  // Admin: xem chi tiết 1 user
  getUserById: (id) =>
    api.get(`/users/${id}`).then((r) => r.data),
};

export default userService;
