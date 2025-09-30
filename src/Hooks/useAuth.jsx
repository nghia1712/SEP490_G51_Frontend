import { useState, useEffect, useCallback } from "react";
import authAPI from "../API/authAPI";
import { mockAPI } from "../mockAPI";

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
      // Sử dụng mock API thay vì API thật
      const data = await mockAPI.getCurrentUser(token);
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

  // Tự động kiểm tra user khi hook được gọi
  useEffect(() => {
    if (!user && localStorage.getItem("authToken")) {
      getCurrentUser();
    }
  }, [getCurrentUser]);

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      // Sử dụng mock API thay vì API thật
      const data = await mockAPI.login(credentials);
      setUser(data.user);
      localStorage.setItem("authToken", data.token);
      setLoading(false);
      return data;
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
      // Sử dụng mock API thay vì API thật
      const data = await mockAPI.register(form);
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
      // Sử dụng mock API thay vì API thật
      const data = await mockAPI.refreshToken();
      setLoading(false);
      return data;
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
      // Sử dụng mock API thay vì API thật
      const data = await mockAPI.logout();
      setUser(null);
      localStorage.removeItem("authToken");
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
      // Sử dụng mock API thay vì API thật
      const result = await mockAPI.forgotPassword(data);
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
