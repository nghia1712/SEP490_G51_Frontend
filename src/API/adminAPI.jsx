import authorApi from './baseAPI/authorAPI';

const adminAPI = {
  createStaffAccount: (payload) => authorApi.post('/Admin/create-staff-account', payload),
  getAccountList: (params) => authorApi.get('/Admin/get-account-list', { params }),
  getAccountDetails: (accountId) => authorApi.get('/Admin/get-account-details', { params: { accountId } }),
  updateStaffAccount: (payload) => authorApi.put('/Admin/update-staff-account', payload),
  suspendAccount: (userId) => authorApi.post(`/Admin/suspend-account?userId=${userId}`),
  activeAccount: (userId) => authorApi.post(`/Admin/active-account?userID=${userId}`),
  resetPassword: (userId) => authorApi.post('/Admin/reset-password', { userId })
};

export default adminAPI;


