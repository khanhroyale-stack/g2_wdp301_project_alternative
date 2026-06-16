import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "../services/auth.service";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      authService
        .getMe()
        .then((data) => setUser(data.user))
        .catch(() => localStorage.removeItem("token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data;
  };

  // register chỉ tạo tài khoản + gửi OTP, KHÔNG trả token — phải verify-email trước
  const register = async (credentials) => {
    // Only return data, don't set token here because we need OTP verification
    const data = await authService.register(credentials);
    return data;
  };

  const verifyEmail = async (credentials) => {
    const data = await authService.verifyEmail(credentials);
    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
