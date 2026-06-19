import api from "./api";

const orderService = {
  getCheckoutPreview: async (productId) => {
    const response = await api.get(`/orders/checkout/${productId}`);
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
  getOrder: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
  updateOrderStatus: async (id, orderStatus) => {
    const response = await api.patch(`/orders/${id}/status`, { orderStatus });
    return response.data;
  }
};

export default orderService;
