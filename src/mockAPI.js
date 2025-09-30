// Mock API service để thay thế các API calls thật
import { mockResponses, mockTokens } from './mockData';

// Simulate network delay
const delay = (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms));

export const mockAPI = {
  // Mock login
  login: async (credentials) => {
    await delay(800);
    return mockResponses.login(credentials);
  },
  
  // Mock register
  register: async (form) => {
    await delay(1200);
    return mockResponses.register(form);
  },
  
  // Mock get current user
  getCurrentUser: async (token) => {
    await delay(500);
    return mockResponses.getCurrentUser(token);
  },
  
  // Mock forgot password
  forgotPassword: async (data) => {
    await delay(1000);
    return mockResponses.forgotPassword(data);
  },
  
  // Mock edit profile
  editProfile: async (token, formData) => {
    await delay(1500);
    return mockResponses.editProfile(token, formData);
  },
  
  // Mock change password
  changePassword: async (token, data) => {
    await delay(1000);
    return mockResponses.changePassword(token, data);
  },
  
  // Mock logout
  logout: async () => {
    await delay(500);
    return { success: true, message: "Đăng xuất thành công!" };
  },
  
  // Mock refresh token
  refreshToken: async () => {
    await delay(300);
    const token = localStorage.getItem("authToken");
    if (!token || !mockTokens[token]) {
      throw new Error("Token không hợp lệ!");
    }
    return { token: token, success: true };
  }
};
