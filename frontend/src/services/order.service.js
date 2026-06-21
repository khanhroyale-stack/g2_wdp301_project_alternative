import api from "./api";

const orderService = {
  getCheckoutPreview: async (productId, quantity = 1) => {
    const response = await api.get(`/orders/checkout/${productId}`, { params: { quantity } });
    return response.data;
  },
  createOrder: async (data) => {
    const response = await api.post("/orders", data);
    return response.data;
  },
  getMyOrders: async () => {
    const response = await api.get("/orders/my-orders");
    return response.data;
  },
  getMySales: async () => {
    const response = await api.get("/orders/my-sales");
    return response.data;
  },
  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
  getOrder: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
  updateOrderStatus: async (id, status, extra = {}) => {
    const response = await api.patch(`/orders/${id}/status`, { status, ...extra });
    return response.data;
  },
};

export default orderService;
