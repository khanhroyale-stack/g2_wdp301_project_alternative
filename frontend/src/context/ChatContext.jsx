import { createContext, useContext, useEffect, useState } from "react";
import { getSocket } from "../services/socket";
import { useAuth } from "./AuthContext";

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (user) {
      // Lấy socket đã được khởi tạo bởi AuthContext
      const s = getSocket();
      setSocket(s);
    } else {
      setSocket(null);
    }
  }, [user]);

  return (
    <ChatContext.Provider value={{ socket }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat phải được dùng trong ChatProvider");
  return ctx;
};
