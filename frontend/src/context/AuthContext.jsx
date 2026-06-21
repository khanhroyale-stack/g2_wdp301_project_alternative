import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authService } from "../services/auth.service";
import notificationService from "../services/notification.service";
import { connectSocket, disconnectSocket, getSocket } from "../services/socket";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  // Kết nối socket và lắng nghe notification realtime
  const setupSocket = useCallback((userData) => {
    connectSocket(userData._id || userData.id);
    const socket = getSocket();

    socket.on("new_notification", (data) => {
      setUnreadCount((c) => c + 1);
      setNotifications((prev) => [data, ...prev]);
    });

    socket.on("new_message", () => {
      // Page TinNhan tự handle — ở đây chỉ tăng badge nếu cần
    });
  }, []);

  // Load user từ token đã lưu
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      authService
        .getMe()
        .then((data) => {
          setUser(data.user);
          setupSocket(data.user);
          return notificationService.getUnreadCount();
        })
        .then((res) => { if (res?.count !== undefined) setUnreadCount(res.count); })
        .catch(() => localStorage.removeItem("token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    return () => {
      disconnectSocket();
    };
  }, [setupSocket]);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    localStorage.setItem("token", data.token);
    setUser(data.user);
    setupSocket(data.user);
    return data;
  };

  const register = async (credentials) => {
    const data = await authService.register(credentials);
    // Register chỉ gửi OTP, chưa có token — KHÔNG set user
    return data;
  };

  const verifyEmail = async ({ email, otp }) => {
    const data = await authService.verifyEmail({ email, otp });
    // Sau verify mới có token
    localStorage.setItem("token", data.token);
    setUser(data.user);
    setupSocket(data.user);
    return data;
  };

  const logout = () => {
    disconnectSocket();
    localStorage.removeItem("token");
    setUser(null);
    setUnreadCount(0);
    setNotifications([]);
  };

  const clearUnread = () => setUnreadCount(0);

  const refreshUser = async () => {
    try {
      const data = await authService.getMe();
      setUser(data.user);
    } catch { /* token invalid — already handled by interceptor */ }
  };

  return (
    <AuthContext.Provider value={{
      user, loading,
      login, register, verifyEmail, logout,
      refreshUser,
      unreadCount, clearUnread,
      notifications,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải được dùng trong AuthProvider");
  return ctx;
};
