import authorApi from "./baseAPI/authorAPI";
import formDataApi from "./baseAPI/formDataAPI";

const API_URL = "/products";

const productAPI = {
  getAll: () => authorApi.get(`${API_URL}/getAllProducts`),
  getById: (id) => authorApi.get(`${API_URL}/getProductById/${id}`),
  create: (formData) => formDataApi.post(`${API_URL}/createProduct`, formData),
  update: (id, formData) =>
    formDataApi.put(`${API_URL}/updateProduct/${id}`, formData),
  inactivate: (id, status) =>
    authorApi.put(`${API_URL}/inactivateProduct/${id}`, { status }),
  checkProductName: (name) =>
    authorApi.get(
      `${API_URL}/checkProductName?name=${encodeURIComponent(name)}`
    ),
  getProductSupplier: (productId) =>
    authorApi.get(`${API_URL}/getProductSupplier/${productId}`),
  updateWithSupplier: (id, formData) =>
    formDataApi.put(`${API_URL}/updateProductWithSupplier/${id}`, formData),
};

export default productAPI;
