import React, { createContext, useContext, useEffect, useState } from "react";
import { useChat } from "./ChatContext";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { socket } = useChat();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (socket && user) {
      socket.emit("join_user", user._id);

      socket.on("new_notification", (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });

      return () => {
        socket.off("new_notification");
      };
    }
  }, [socket, user]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, setUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
