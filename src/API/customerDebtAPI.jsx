import authorApi from "./baseAPI/authorAPI";

const API_URL = "/CustomerDebt";

const customerDebtApi = {
  // GET: Lấy toàn bộ danh sách CustomerDebt
  getAll: () => authorApi.get(`${API_URL}/customer-debt-list`),

  // GET: Lấy số tiền khách nợ theo từng tháng, lọc theo năm
  getByMonth: (year) =>
    authorApi.get(`${API_URL}/by-month`, {
      params: { year },
    }),
};

export default customerDebtApi;
