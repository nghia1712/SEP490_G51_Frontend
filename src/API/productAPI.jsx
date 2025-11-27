import authorApi from "./baseAPI/authorAPI";
import formDataApi from "./baseAPI/formDataAPI";

// Backend controller: /api/Product
const API_URL = "/Product";

const productAPI = {
  search: (keyword) =>
    authorApi.get(`${API_URL}/search`, { params: { keyword } }),
  getAll: () => authorApi.get(`${API_URL}/all`),
  getActive: () => authorApi.get(`${API_URL}/active`),
  getById: (id) => authorApi.get(`${API_URL}/getbyid/${id}`),
  // Create/Update use multipart/form-data per backend
  create: (data) => formDataApi.post(`${API_URL}/create`, data),
  createJson: (data) => authorApi.post(`${API_URL}/create`, data),
  update: (id, data) => formDataApi.put(`${API_URL}/update/${id}`, data),
  // Backend expects raw boolean in body, not an object
  setStatus: (id, statusBool) =>
    authorApi.put(`${API_URL}/${id}/status`, statusBool),
  
  searchLotByProductId: (poid) =>
    authorApi.get(`${API_URL}/SearchLotProductByproductId/${poid}`),
};

export default productAPI;
