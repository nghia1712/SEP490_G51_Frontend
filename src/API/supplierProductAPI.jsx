import authorApi from "./baseAPI/authorAPI";
import formDataApi from "./baseAPI/formDataAPI";
const API_URL = "/supplierProduct";

const supplierProductAPI = {
  getAll: () => authorApi.get(`${API_URL}/getAllSupplierProducts`),
  getProductsBySupplier: (supplierId) => authorApi.get(`${API_URL}/getProductsBySupplier/${supplierId}`),
  create: (formData) => formDataApi.post(`${API_URL}/create`, formData),
  update: (id, formData) => formDataApi.put(`${API_URL}/update/${id}`, formData),
  delete: (id) => authorApi.delete(`${API_URL}/delete/${id}`),
};

export default supplierProductAPI;