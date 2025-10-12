import authorApi from "./baseAPI/authorAPI";
import formDataApi from "./baseAPI/formDataAPI";

const API_URL = "/inventory";

// Lưu ý: Các endpoint dưới đây dựa trên inventory.router.js và controller bạn cung cấp.
// Nếu có endpoint nhận file, hãy dùng formDataApi, còn lại dùng authorApi.

const inventoryAPI = {
  getAll: () => authorApi.get(`${API_URL}/`),
  getLayout: () => authorApi.get(`${API_URL}/layout`),
  create: (data) => authorApi.post(`${API_URL}/add`, data),
  addProduct: (data) => authorApi.post(`${API_URL}/add-product`, data),
  addProductWithQuantity: (data) =>
    authorApi.post(`${API_URL}/add-product-with-quantity`, data),
  removeProduct: (data) => authorApi.post(`${API_URL}/remove-product`, data),
  importAuto: (data) => authorApi.post(`${API_URL}/import-auto`, data),
  delete: (id) => authorApi.delete(`${API_URL}/delete/${id}`),
  
  // Methods for useWarehouse hook
  getShelfById: (id) => authorApi.get(`${API_URL}/shelf/${id}`),
  addProductToShelf: (data) => authorApi.post(`${API_URL}/add-product`, data),
  removeProductFromShelf: (data) => authorApi.post(`${API_URL}/remove-product`, data),
  createShelf: (data) => authorApi.post(`${API_URL}/shelf/create`, data),
  updateShelf: (id, data) => authorApi.put(`${API_URL}/shelf/update/${id}`, data),
  deleteShelf: (id) => authorApi.delete(`${API_URL}/shelf/delete/${id}`),
  getWarehouseStats: () => authorApi.get(`${API_URL}/stats`),
  searchProductsInWarehouse: (query) => authorApi.get(`${API_URL}/search?q=${encodeURIComponent(query)}`),
};

export default inventoryAPI;
