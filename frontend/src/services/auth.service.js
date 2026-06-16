import api from "./api";

export const authService = {
  register: async (data) => {
    const res = await api.post("/auth/register", data);
    return res.data;
  },

  verifyEmail: async (data) => {
    const res = await api.post("/auth/verify-email", data);
    return res.data;
  },

  resendOTP: async (data) => {
    const res = await api.post("/auth/resend-otp", data);
    return res.data;
  },
  login: async (data) => {
    const res = await api.post("/auth/login", data);
    return res.data;
  },

  forgotPassword: async (data) => {
    const res = await api.post("/auth/forgot-password", data);
    return res.data;
  },

  resetPassword: async (data) => {
    const res = await api.post("/auth/reset-password", data);
    return res.data;
  },

  changePassword: async (data) => {
    const res = await api.put("/auth/change-password", data);
    return res.data;
  },

  getMe: async () => {
    const res = await api.get("/auth/me");
    return res.data;
  },

};
