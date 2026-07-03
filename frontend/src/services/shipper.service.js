import api from "./api";

const shipperService = {
  getAvailableOrders: async () => {
    const response = await api.get("/deliveries/available");
    return response.data;
  },
  acceptOrder: async (id) => {
    const response = await api.post(`/deliveries/${id}/accept`);
    return response.data;
  },
  getMyDeliveries: async () => {
    const response = await api.get("/deliveries/my-deliveries");
    return response.data;
  },
  updateDeliveryStatus: async (id, status, note, failureReason) => {
    const response = await api.patch(`/deliveries/${id}/status`, { status, note, failureReason });
    return response.data;
  }
};

export default shipperService;
