// src/API/paymentRemainAPI.js

import authorApi from "./baseAPI/authorAPI";

const API_URL = "/PaymentRemain";

const paymentRemainAPI = {
  // 🔹 1. Tạo yêu cầu thanh toán phần còn lại
  createPaymentRemainRequest: (data) =>
    authorApi.post(`${API_URL}/pay-remain-request`, data),

  // 🔹 2. Lấy danh sách payment remain
  getList: (params) =>
    authorApi.get(`${API_URL}/list-payment-remain`, { params }),

  // 🔹 3. Lấy chi tiết payment remain theo Id
  getDetail: (id) => authorApi.get(`${API_URL}/payment-remain-detail/${id}`),

  // 🔹 4. Lấy danh sách PaymentRemainId theo SalesOrderId
  getIdsBySalesOrder: (salesOrderId) =>
    authorApi.get(`${API_URL}/ids-by-sales-order/${salesOrderId}`),

  // 🔹 5. Mark payment success
  markSuccess: (id, data) => authorApi.post(`${API_URL}/${id}/success`, data),

  // 🔹 6. Init VNPay for Invoice
  initVnPayForInvoice: (invoiceId, data) =>
    authorApi.post(`${API_URL}/invoices/${invoiceId}/vnpay/init`, data),

  // 🔹 7. Create bank transfer check request for Invoice
  createBankTransferCheckRequest: (invoiceId, data) =>
    authorApi.post(`${API_URL}/invoices/${invoiceId}/bank-transfer/check-request`, data),
};

export default paymentRemainAPI;
