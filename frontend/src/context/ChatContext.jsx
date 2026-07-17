import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getSocket } from "../services/socket";
import { useAuth } from "./AuthContext";
import chatService from "../services/chat.service";

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const countedMessageIdsRef = useRef(new Set());

  const fetchUnreadChatCount = useCallback(async () => {
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
  }, [user]);

  useEffect(() => {
    if (user) {
      const s = getSocket();
      setSocket(s);
      fetchUnreadChatCount();
    } else {
      setSocket(null);
      setUnreadChatCount(0);
    }
  }, [user, fetchUnreadChatCount]);

  useEffect(() => {
    if (socket && user?.role === "user") {
      const handleNewMessage = (newMsg) => {
        if (newMsg?._id && countedMessageIdsRef.current.has(String(newMsg._id))) return;
        if (newMsg?._id) countedMessageIdsRef.current.add(String(newMsg._id));
        const senderId = newMsg.senderId?._id || newMsg.senderId || newMsg.sender;
        if (String(senderId) !== String(user.id || user._id)) {
          setUnreadChatCount((prev) => prev + 1);
        }
      };

      const handleRoomUpdated = (payload) => {
        const newMsg = payload?.message || payload;
        handleNewMessage(newMsg);
      };

      socket.on("new_message", handleNewMessage);
      socket.on("chat_room_updated", handleRoomUpdated);
      return () => {
        socket.off("new_message", handleNewMessage);
        socket.off("chat_room_updated", handleRoomUpdated);
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
