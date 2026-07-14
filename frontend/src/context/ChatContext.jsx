import { createContext, useContext, useEffect, useState } from "react";
import { getSocket } from "../services/socket";
import { useAuth } from "./AuthContext";
import chatService from "../services/chat.service";

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const fetchUnreadChatCount = async () => {
    if (!user || user.role !== "user") return;
    try {
      const res = await chatService.getMyRooms();
      if (res.success) {
        const count = res.data.reduce((acc, r) => acc + (r.unreadCount || 0), 0);
        setUnreadChatCount(count);
      }
    } catch (err) {
      console.error("Lỗi lấy số tin nhắn chưa đọc:", err);
    }
  };

  useEffect(() => {
    if (user) {
      const s = getSocket();
      setSocket(s);
      fetchUnreadChatCount();
    } else {
      setSocket(null);
      setUnreadChatCount(0);
    }
  }, [user]);

  useEffect(() => {
    if (socket && user?.role === "user") {
      const handleNewMessage = (newMsg) => {
        const senderId = newMsg.senderId?._id || newMsg.senderId || newMsg.sender;
        if (String(senderId) !== String(user.id || user._id)) {
          setUnreadChatCount((prev) => prev + 1);
        }
      };
      socket.on("new_message", handleNewMessage);
      return () => {
        socket.off("new_message", handleNewMessage);
      };
    }
  }, [socket, user]);

  return (
    <ChatContext.Provider value={{ socket, unreadChatCount, setUnreadChatCount, fetchUnreadChatCount }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat phải được dùng trong ChatProvider");
  return ctx;
};
