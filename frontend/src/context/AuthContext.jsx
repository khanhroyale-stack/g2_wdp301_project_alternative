import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authService } from "../services/auth.service";
import notificationService from "../services/notification.service";
import { connectSocket, disconnectSocket, getSocket } from "../services/socket";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const setupSocket = useCallback((userData) => {
    connectSocket(userData._id || userData.id);
    const socket = getSocket();

    socket.on("new_notification", (data) => {
      setUnreadCount((count) => count + 1);
      setNotifications((prev) => [data, ...prev]);
    });

  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return () => {
        disconnectSocket();
      };
    }

    authService
      .getMe()
      .then((data) => {
        setUser(data.user);
        setupSocket(data.user);
        return notificationService.getUnreadCount();
      })
      .then((res) => {
        if (res?.count !== undefined) {
          setUnreadCount(res.count);
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      disconnectSocket();
    };
  }, [setupSocket]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener("auth-unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth-unauthorized", handleUnauthorized);
  }, []);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    localStorage.setItem("token", data.token);
    setUser(data.user);
    setupSocket(data.user);
    return data;
  };

  const register = async (credentials) => {
    const data = await authService.register(credentials);
    // Register doesn't return token yet, user needs to verify OTP first
    return data;
  };

  const verifyEmail = async (credentials) => {
    const data = await authService.verifyEmail(credentials);
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
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        verifyEmail,
        logout,
        refreshUser,
        unreadCount,
        clearUnread,
        notifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth phai duoc dung trong AuthProvider");
  }
  return ctx;
};
