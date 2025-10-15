import { useState, useEffect, useCallback } from "react";
import authAPI from "../API/authAPI";
import tokenManager from "../Utils/tokenManager";
import sessionManager from "../Utils/sessionManager";

const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // Thêm function để lấy thông tin user từ token, sử dụng useCallback để tránh tạo lại hàm mỗi khi component render
  const getCurrentUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return null;

      setLoading(true);
      // Tạm thời decode payload từ JWT để lấy thông tin cơ bản
      const [, payload] = token.split(".");
      const data = JSON.parse(atob(payload));
      setUser(data);
      setLoading(false);
      return data;
    } catch (err) {
      console.error("Lỗi khi lấy thông tin người dùng:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to get user info"
      );
      setLoading(false);
    }
  }, []);

  // Tự động kiểm tra user khi hook được gọi và thiết lập auto-refresh
  useEffect(() => {
    if (!user && localStorage.getItem("authToken")) {
      getCurrentUser();
    }
    
    // Thiết lập auto-refresh token
    tokenManager.setupAutoRefresh();
    
    // Thiết lập session manager với token manager
    tokenManager.setSessionManager(sessionManager);
  }, [getCurrentUser]);

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const accessToken = await authAPI.login(credentials);
      localStorage.setItem("authToken", accessToken);
      
      // Thiết lập auto-refresh sau khi login thành công
      tokenManager.setupAutoRefresh();
      
      // Khởi tạo session sau khi login thành công
      sessionManager.updateActivity();
      
      await getCurrentUser();
      setLoading(false);
      return { token: accessToken };
    } catch (err) {
      setError(err.message || "Login failed");
      setLoading(false);
      throw err;
    }
  };

  const register = async (form) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authAPI.register(form);
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message || "Register failed");
      setLoading(false);
      throw err;
    }
  };

  const refreshToken = async () => {
    setLoading(true);
    setError(null);
    try {
      const newToken = await authAPI.refreshToken();
      if (newToken) localStorage.setItem("authToken", newToken);
      setLoading(false);
      return newToken;
    } catch (err) {
      setError(err.message || "Token refresh failed");
      setLoading(false);
      return null;
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authAPI.logout();
      setUser(null);
      
      // Sử dụng TokenManager để clear tokens
      tokenManager.clearTokens();
      
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message || "Logout failed");
      setLoading(false);
      throw err;
    }
  };

  const forgotPassword = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authAPI.forgotPassword(data);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message || "Forgot password failed");
      setLoading(false);
      throw err;
    }
  };

  return {
    user,
    loading,
    error,
    login,
    register,
    refreshToken,
    logout,
    getCurrentUser,
    forgotPassword,
  };
};

export default useAuth;
