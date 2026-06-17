import api from "./api";

const userService = {
  // Cập nhật thông tin profile
  updateProfile: (data) =>
    api.put(`/users/${data.id || data._id}`, data).then((r) => r.data),

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
