import api from "./api";

const rentalService = {
  // Kiểm tra lịch trống của sản phẩm
  getAvailability: async (productId) => {
    const response = await api.get(`/rentals/availability/${productId}`);
    return response.data;
  },

  // Tạo yêu cầu thuê
  createRentalRequest: async (data) => {
    const response = await api.post("/rentals", data);
    return response.data;
  },

  // Renter xem danh sách đồ mình đang thuê
  getMyRentals: async () => {
    const response = await api.get("/rentals/my-rentals");
    return response.data;
  },

  // Owner xem danh sách đồ mình cho thuê
  getMyLendings: async () => {
    const response = await api.get("/rentals/my-lendings");
    return response.data;
  },

  // Alias để tương thích với code cũ
  getMyLends: async () => {
    const response = await api.get("/rentals/my-lendings");
    return response.data;
  },

  // Xem chi tiết rental/contract
  getRental: async (id) => {
    const response = await api.get(`/rentals/${id}`);
    return response.data;
  },

  // Cập nhật trạng thái (chấp nhận / từ chối / hủy)
  updateRentalStatus: async (id, data) => {
    // data có thể là string hoặc object { status, reason }
    const payload = typeof data === "string" ? { status: data } : data;
    const response = await api.patch(`/rentals/${id}/status`, payload);
    return response.data;
  },

  // Gia hạn thuê — renter gửi yêu cầu, chờ owner duyệt
  extendRental: async (id, extraDays) => {
    const response = await api.post(`/rentals/${id}/extend`, { extraDays });
    return response.data;
  },

  // Owner xác nhận hoặc từ chối gia hạn
  confirmExtend: async (id, action) => {
    // action: "approve" | "reject"
    const response = await api.post(`/rentals/${id}/extend/confirm`, { action });
    return response.data;
  },

  // Renter gửi yêu cầu trả đồ
  requestReturn: async (id) => {
    const response = await api.post(`/rentals/${id}/return`);
    return response.data;
  },

  // Xử lý tiền cọc sau khi trả đồ
  resolveDeposit: async (id, data) => {
    // data: { compensationAmount, compensationReason }
    const response = await api.post(`/rentals/${id}/resolve-deposit`, data);
    return response.data;
  },
};

export default rentalService;
