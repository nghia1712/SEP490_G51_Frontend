import authorApi from "./baseAPI/authorAPI";
import formDataApi from "./baseAPI/formDataAPI";
const API_URL = "/supplierProduct";

const supplierProductAPI = {
  getAll: () => authorApi.get(`${API_URL}/getAllSupplierProducts`),
  getProductsBySupplier: (supplierId) => {
    // Thử endpoint mới: /api/Supplier/detail?id=...
    // Nếu không có, sẽ fallback về endpoint cũ
    return authorApi.get(`/Supplier/detail?id=${supplierId}`);
  },
  create: (formData) => formDataApi.post(`${API_URL}/create`, formData),
  update: (id, formData) => formDataApi.put(`${API_URL}/update/${id}`, formData),
  delete: (id) => authorApi.delete(`${API_URL}/delete/${id}`),
};

export default supplierProductAPI;