import api from "./api";

const chatService = {
  getOrCreateChat: async (otherUserId, productId) => {
    const response = await api.post("/chat", { otherUserId, productId });
    return response.data;
  },
  getMyChats: async () => {
    const response = await api.get("/chat/my-chats");
    return response.data;
  },
  sendMessage: async (chatId, content, image = "") => {
    const response = await api.post(`/chat/${chatId}/messages`, { content, image });
    return response.data;
  }
};

export default chatService;
