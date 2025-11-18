import authorApi from "./baseAPI/authorAPI";

const API_URL = "/Notifications";

const notificationAPI = {
  // 🔹 Lấy tất cả notification của user
  getUserNotifications: () => authorApi.get(`${API_URL}/GetUserNotifi`),

  // 🔹 Gửi notification cho các role
  sendNotification: (data) =>
    authorApi.post(`${API_URL}/send`, data, {
      headers: { "Content-Type": "application/json" },
    }),

  // 🔹 Đánh dấu notification đã đọc
  markAsRead: (notificationId) =>
    authorApi.post(`${API_URL}/read/${notificationId}`, null),
};

export default notificationAPI;
