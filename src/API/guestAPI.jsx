import unauthorApi from "./baseAPI/unauthorAPI";

// Guest API - sử dụng API thực không cần authentication
const guestAPI = {
  // Lấy danh sách thuốc đang bán (public API)
  getActiveProducts: () => unauthorApi.get("/Product/active"),
  
  // Lấy danh sách danh mục (public API) 
  getCategories: () => unauthorApi.get("/Category/all"),
  
  // Lấy chi tiết thuốc theo ID (public API)
  getProductById: (id) => unauthorApi.get(`/Product/getbyid/${id}`),
  
  // Lấy chi tiết danh mục theo ID (public API)
  getCategoryById: (id) => unauthorApi.get(`/Category/getbyid/${id}`),
};

export default guestAPI;
