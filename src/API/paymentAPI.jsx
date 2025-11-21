import api from "./baseAPI/authorAPI";

const API_URL = "/Payment";

const paymentAPI = {
  // 🔹 Khởi tạo thanh toán VNPay (deposit/full)
  init: (data) =>
    api.post(`${API_URL}/init`, data, {
      headers: { "Content-Type": "application/json" },
    }),

  // 🔹 ReturnUrl (VNPay redirect sau khi thanh toán)
  handleReturn: (queryParams) =>
    api.get(`${API_URL}/return`, {
      params: queryParams,
    }),

  // 🔹 IPN (Instant Payment Notification) - server to server
  handleIpn: (queryParams) =>
    api.get(`${API_URL}/vnpay/ipn`, {
      params: queryParams,
    }),
};

export default paymentAPI;
