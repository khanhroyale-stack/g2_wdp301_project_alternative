import api from "./api";

const shipperService = {
  getAvailableOrders: async () => {
    const response = await api.get("/orders/shipper/available");
    return response.data;
  },
  acceptOrder: async (id) => {
    const response = await api.patch(`/orders/shipper/${id}/accept`);
    return response.data;
  },
  getMyDeliveries: async () => {
    const response = await api.get("/orders/shipper/my-deliveries");
    return response.data;
  },
  updateDeliveryStatus: async (id, status) => {
    // We can reuse the order update status endpoint
    const response = await api.patch(`/orders/${id}/status`, { status });
    return response.data;
  }
};

export default shipperService;
