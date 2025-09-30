import authorApi from "./baseAPI/authorAPI";
import formDataApi from "./baseAPI/formDataAPI";

const API_URL = "/users";

const userAPI = {
    getProfile: () => authorApi.get(`${API_URL}/view-profile`),
    editProfile: (formData) => formDataApi.put(`${API_URL}/edit-profile`, formData),
    getAllUsers: () => authorApi.get(`${API_URL}/get-all-user`),
    changePassword: (data) => authorApi.put(`${API_URL}/change-password`, data),
    updateUser: (userId, data) => authorApi.put(`${API_URL}/update-user/${userId}`, data),
    banUser: (id) => authorApi.put(`${API_URL}/banUser/${id}`),
};

export default userAPI;