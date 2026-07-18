import api from "./api";

const deliveryService = {
  // Get available deliveries (for shippers)
  getAvailableDeliveries: async () => {
    const response = await api.get("/deliveries/available");
    return response.data;
  },

  // Accept delivery
  acceptDelivery: async (id) => {
    const response = await api.post(`/deliveries/${id}/accept`);
    return response.data;
  },

  // Get my deliveries
  getMyDeliveries: async (status) => {
    const params = status ? { status } : {};
    const response = await api.get("/deliveries/my-deliveries", { params });
    return response.data;
  },

  // Get delivery by ID
  getDeliveryById: async (id) => {
    const response = await api.get(`/deliveries/${id}`);
    return response.data;
  },

  // Update delivery status
  updateDeliveryStatus: async (id, status, extra = {}) => {
    const response = await api.patch(`/deliveries/${id}/status`, { status, ...extra });
    return response.data;
  },
};

export default deliveryService;
