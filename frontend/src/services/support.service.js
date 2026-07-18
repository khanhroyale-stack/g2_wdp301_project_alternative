import api from "./api";

const supportService = {
  getMessages: async (customerId = null) => {
    let url = "/support-chat";
    if (customerId) url += `?customerId=${customerId}`;
    const response = await api.get(url);
    return response.data;
  },

  sendMessage: async (content, customerId = null) => {
    const payload = { content };
    if (customerId) payload.customerId = customerId;
    const response = await api.post("/support-chat", payload);
    return response.data;
  },

  getActiveCustomers: async () => {
    const response = await api.get("/support-chat/admin/users");
    return response.data;
  },
};

export default supportService;
