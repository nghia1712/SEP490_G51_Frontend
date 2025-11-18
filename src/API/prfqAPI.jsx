import authorApi from "./baseAPI/authorAPI";

const API_URL = "/PRFQ";

const prfqAPI = {
  // 🔹 Lấy tất cả PRFQ
  getAll: () => authorApi.get(`${API_URL}/getAll`),

  // 🔹 Lấy chi tiết PRFQ
  getDetail: (id) => authorApi.get(`${API_URL}/detail/${id}`),

  // 🔹 Tạo mới PRFQ (gửi mail báo giá tới supplier)
  create: (data) => authorApi.post(`${API_URL}/quotationforsupplier`, data),

  // 🔹 Xem trước PRFQ Excel theo ID
  previewExcel: (id) => authorApi.get(`${API_URL}/preview/${id}`),

  // 🔹 Tải xuống file Excel PRFQ
  downloadExcel: (id) =>
    authorApi.get(`${API_URL}/download/${id}`, { responseType: "blob" }),

  // 🔹 Xóa PRFQ ở trạng thái draft
  delete: (id) => authorApi.delete(`${API_URL}/deletePRFQ/${id}`),

  // 🔹 Upload file Excel báo giá từ supplier để xem trước
  uploadSupplierExcel: (file) => {
    const formData = new FormData();
    formData.append("excelFile", file);
    return authorApi.post(`${API_URL}/previewSupplierQuotaionExcel`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // 🔹 Chuyển Excel báo giá đã preview thành đơn hàng PO
  convertToPo: (data) =>
    authorApi.post(`${API_URL}/convertToPo`, data, {
      headers: { "Content-Type": "application/json" },
    }),

  // 🔹 Cập nhật trạng thái PRFQ
  changeStatus: (id, status) =>
    authorApi.put(`${API_URL}/${id}/status`, status, {
      headers: { "Content-Type": "application/json" },
    }),

  // 🔹 Tiếp tục chỉnh sửa PRFQ draft
  continueEdit: (id, data) =>
    authorApi.put(`${API_URL}/${id}/continue`, data, {
      headers: { "Content-Type": "application/json" },
    }),

  // 🔹 Tạo Purchase Order từ Quotation có sẵn
  createFromQuotation: (data) =>
    authorApi.post(`${API_URL}/create-from-quotation`, data, {
      headers: { "Content-Type": "application/json" },
    }),
  // 🔹 Cập nhật PO draft
  updateDraftPO: (id, data) =>
    authorApi.put(`${API_URL}/continue-edit/${id}`, data, {
      headers: { "Content-Type": "application/json-patch+json" },
    }),
};

export default prfqAPI;
