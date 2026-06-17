import api from "./api";

const orderService = {
  // Get checkout preview
  getCheckoutPreview: async (productId) => {
    const response = await api.get(`/orders/checkout/${productId}`);
    return response.data;
  },

  // Create new order
  createOrder: async (data) => {
    const response = await api.post("/orders", data);
    return response.data;
  },

  // Get my orders (buyer)
  getMyOrders: async () => {
    const response = await api.get("/orders/my-orders");
    return response.data;
  },

  // Get my sales (seller)
  getMySales: async () => {
    const response = await api.get("/orders/my-sales");
    return response.data;
  },

  // Get order by ID
  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  // Update order status
  updateOrderStatus: async (id, status) => {
    const response = await api.patch(`/orders/${id}/status`, { status });
    return response.data;
  },
};

export default orderService;
