import { useState, useEffect, useCallback } from "react";
import authAPI from "../API/authAPI";
import tokenManager from "../Utils/tokenManager";
import sessionManager from "../Utils/sessionManager";
import getUserRoleFromToken from "../Utils/getUserRoleFromToken.jsx";

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
      // Decode payload từ JWT (chịu lỗi base64url, kiểm tra định dạng)
      const parts = token.split(".");
      if (parts.length < 2) {
        setLoading(false);
        return null;
      }
      const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = b64 + "===".slice((b64.length + 3) % 4);
      let data = null;
      try {
        data = JSON.parse(atob(padded));
      } catch (_) {
        // Token không phải JWT hợp lệ -> bỏ qua, không ném lỗi
        setLoading(false);
        return null;
      }
      if (data) setUser(data);
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

  const loginStaff = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const accessToken = await authAPI.loginStaff(credentials);
      localStorage.setItem("authToken", accessToken);

      tokenManager.setupAutoRefresh();
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
      setError(err.response?.data?.message || err.message || "Register failed");
      setLoading(false);
      // Throw lại lỗi với đầy đủ thông tin để Register component có thể xử lý
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
    // Lưu role trước khi xóa token
    const currentRole = getUserRoleFromToken();
    try {
      await authAPI.logout();
    } catch (err) {
      // Không chặn logout nếu API lỗi
      console.error("Logout API error:", err);
      setError(err.message || "Logout failed");
    } finally {
      setUser(null);
      tokenManager.clearTokens();
      setLoading(false);
      // Điều hướng theo role: customer về trang chủ, các role khác về login-staff
      const redirectPath = currentRole === "customer" ? "/" : "/login-staff";
      window.location.replace(redirectPath);
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
      setError(err.response?.data?.message || err.message || "Forgot password failed");
      setLoading(false);
      throw err;
    }
  };

  return {
    user,
    loading,
    error,
    login,
    loginStaff,
    register,
    refreshToken,
    logout,
    getCurrentUser,
    forgotPassword,
  };
};

export default useAuth;
