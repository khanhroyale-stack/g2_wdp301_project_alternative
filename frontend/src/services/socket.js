import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace("/api", "")
  : "http://localhost:5000";

let socket = null;
let currentUserId = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export const connectSocket = (userId) => {
  currentUserId = userId;
  const s = getSocket();
  s.off("connect");
  s.on("connect", () => {
    if (currentUserId) s.emit("join_user", currentUserId);
  });
  if (!s.connected) {
    s.connect();
  } else {
    s.emit("join_user", userId);
  }
};

export const disconnectSocket = () => {
  currentUserId = null;
  if (socket?.connected) {
    socket.disconnect();
  }
};

export const joinChatRoom = (roomId) => {
  getSocket().emit("join_chat", roomId);
};

export const leaveChatRoom = (roomId) => {
  getSocket().emit("leave_chat", roomId);
};
