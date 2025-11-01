import authorApi from "./baseAPI/authorAPI";

const API_URL = "/PRFQ";

const prfqApi = {
  getAll: () => authorApi.get(`${API_URL}/getAll`),
  getDetail: (id) => authorApi.get(`${API_URL}/detail/${id}`),
  create: (data) => authorApi.post(`${API_URL}/quotationforsupplier`, data),
  previewExcel: (id) => authorApi.get(`${API_URL}/preview/${id}`),
  downloadExcel: (id) =>
    authorApi.get(`${API_URL}/download/${id}`, { responseType: "blob" }),
  delete: (id) => authorApi.delete(`${API_URL}/deletePRFQ/${id}`),
  uploadSupplierExcel: (file) => {
    const formData = new FormData();
    formData.append("excelFile", file);
    return authorApi.post(`${API_URL}/previewSupplierQuotaionExcel`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  convertToPo: (data) => authorApi.post(`${API_URL}/convertToPo`, data),
  changeStatus: (id, status) =>
    authorApi.put(`${API_URL}/${id}/status`, status, {
      headers: { "Content-Type": "application/json" },
    }),
};

export default prfqApi;
