import api from "./api";

export const authService = {
  // Đăng ký — trả về token + user trực tiếp
  register: async (data) => {
    const res = await api.post("/auth/register", data);
    return res.data;
  },

  // Đăng nhập — trả về token + user trực tiếp
  login: async (data) => {
    const res = await api.post("/auth/login", data);
    return res.data;
  },

  // Lấy thông tin user hiện tại
  getMe: async () => {
    const res = await api.get("/auth/me");
    return res.data;
  },

  // Quên mật khẩu — gửi OTP về email
  forgotPassword: async (email) => {
    const res = await api.post("/auth/forgot-password", { email });
    return res.data;
  },

  // Reset mật khẩu bằng OTP
  resetPassword: async ({ email, otp, newPassword }) => {
    const res = await api.post("/auth/reset-password", { email, otp, newPassword });
    return res.data;
  },

  // Đổi mật khẩu (đã đăng nhập)
  changePassword: async ({ currentPassword, newPassword }) => {
    const res = await api.put("/auth/change-password", { currentPassword, newPassword });
    return res.data;
  },
};
