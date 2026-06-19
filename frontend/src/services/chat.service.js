import api from "./api";

const chatService = {
  // Tạo hoặc lấy phòng chat
  getOrCreateRoom: (otherUserId, postId) =>
    api.post("/chat", { otherUserId, postId }).then((r) => r.data),

  // Danh sách phòng chat của tôi
  getMyRooms: () =>
    api.get("/chat").then((r) => r.data),

  // Lấy tin nhắn của 1 phòng
  getMessages: (roomId, page = 1, limit = 50) =>
    api.get(`/chat/${roomId}/messages`, { params: { page, limit } }).then((r) => r.data),

  // Gửi tin nhắn
  sendMessage: (roomId, content, messageType = "text") =>
    api.post(`/chat/${roomId}/messages`, { content, messageType }).then((r) => r.data),
};

export default chatService;
