import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Tự động đính token vào mỗi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Xử lý lỗi 401 toàn cục
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.dispatchEvent(new CustomEvent("auth-unauthorized"));
      // Không chuyển hướng nếu lỗi 401 đến từ trang đăng nhập
      if (error.config && !error.config.url.includes("/auth/login")) {
        window.location.href = "/dang-nhap";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
