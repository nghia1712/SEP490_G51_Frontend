// src/API/paymentRemainAPI.js

import authorApi from "./baseAPI/authorAPI";

const API_URL = "/PaymentRemain";

const paymentRemainAPI = {
  // 🔹 1. Tạo yêu cầu thanh toán phần còn lại
  // POST: /PaymentRemain/pay-remain-request/{goodsIssueNoteId}
  createPaymentRemainRequest: (goodsIssueNoteId) =>
    authorApi.post(`${API_URL}/pay-remain-request/${goodsIssueNoteId}`),

  // 🔹 2. Lấy danh sách payment remain
  // GET: /PaymentRemain/list-payment-remain?filters...
  getList: (params) =>
    authorApi.get(`${API_URL}/list-payment-remain`, { params }),

  // 🔹 3. Lấy chi tiết payment remain theo Id
  // GET: /PaymentRemain/payment-remain-detail/{id}
  getDetail: (id) =>
    authorApi.get(`${API_URL}/payment-remain-detail/${id}`),

  // 🔹 4. Lấy danh sách PaymentRemainId theo SalesOrderId
  // GET: /PaymentRemain/ids-by-sales-order/{salesOrderId}
  getIdsBySalesOrder: (salesOrderId) =>
    authorApi.get(`${API_URL}/ids-by-sales-order/${salesOrderId}`),
};

export default paymentRemainAPI;
