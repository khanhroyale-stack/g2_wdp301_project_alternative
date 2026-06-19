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
  getOrderById: async (id) => {
    return orderService.getOrder(id);
  },
  sellerConfirmOrder: async (id) => {
    const response = await api.patch(`/orders/${id}/confirm`);
    return response.data;
  },
  sellerRejectOrder: async (id, reason) => {
    const response = await api.patch(`/orders/${id}/reject`, { reason });
    return response.data;
  },
  cancelOrder: async (id, reason) => {
    const response = await api.patch(`/orders/${id}/cancel`, { reason });
    return response.data;
  },
  buyerConfirmDelivery: async (id) => {
    const response = await api.patch(`/orders/${id}/confirm-delivery`);
    return response.data;
  },
  updateOrderStatus: async (id, orderStatus) => {
    const response = await api.patch(`/orders/${id}/status`, { orderStatus });
    return response.data;
  }
};

export default orderService;
