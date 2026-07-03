import api from "./api";

const subscriptionService = {
  getPlans: async () => {
    const response = await api.get("/subscriptions/plans");
    return response.data;
  },
  createPayment: async (plan) => {
    const response = await api.post("/subscriptions/create", { plan });
    return response.data;
  },
  getMySubscriptions: async () => {
    const response = await api.get("/subscriptions/me");
    return response.data;
  },
  getStatus: async () => {
    const response = await api.get("/subscriptions/status");
    return response.data;
  },
};

export default subscriptionService;
