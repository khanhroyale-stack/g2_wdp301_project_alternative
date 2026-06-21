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

    socket.on("new_message", () => { });
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
      })
      .finally(() => {
        setLoading(false);
      });

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
    return authService.register(credentials);
  };

  const verifyEmail = async ({ email, otp }) => {
    const data = await authService.verifyEmail({ email, otp });
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

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        verifyEmail,
        logout,
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
