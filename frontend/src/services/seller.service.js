import api from "./api";

const sellerService = {
  // Thống kê doanh thu của người bán hiện tại
  getStats: () => api.get("/seller/stats").then((r) => r.data),
};

export default sellerService;
