import authorApi from "./baseAPI/authorAPI";

const API_URL = "/Invoice";

const invoiceAPI = {
  generateFromGoodsIssueNotes: (payload) =>
    authorApi.post(`${API_URL}/generate-from-goods-issue-note`, payload),

  getInvoicePdf: (id) =>
    authorApi.get(`${API_URL}/${id}/pdf`, { responseType: "blob" }),

  sendInvoiceEmail: (id) => authorApi.post(`${API_URL}/${id}/send-email`),

  getInvoiceList: () => authorApi.get(`${API_URL}/get-all/invoices`),

  getInvoiceById: (id) => authorApi.get(`${API_URL}/${id}/invoice/details`),

  updateDraftInvoice: (id, data) =>
    authorApi.put(`${API_URL}/${id}/update/draft-invoice`, data),

  getSalesOrderCodes: () => authorApi.get(`${API_URL}/sales-order-codes`),

  getGoodsIssueNoteCodesBySalesOrder: (salesOrderCode) =>
    authorApi.get(
      `${API_URL}/${encodeURIComponent(
        salesOrderCode,
      )}/goods-issue-note-codes`,
    ),

  getMyInvoices: () => authorApi.get(`${API_URL}/my-invoices`),
};

export default invoiceAPI;

