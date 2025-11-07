import authorApi from "./baseAPI/authorAPI";

const API_URL = "/Quotation";

const pqApi = {
  getAllBasic: () => authorApi.get(`${API_URL}/getAllSupplierResponseQuotation`),

  getAllWithStatus: () => authorApi.get(`${API_URL}/getAllWithStatus`),

  getDetail: (id) => authorApi.get(`${API_URL}/detailSupplierResponseQuotation/${id}`),
};

export default pqApi;
