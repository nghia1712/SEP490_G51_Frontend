import authorApi from "./baseAPI/authorAPI";
import formDataApi from "./baseAPI/formDataAPI";

const API_URL = "/users";

const userAPI = {
    // Align FE with BE endpoint: GET /api/Admin/get-account-details
    getProfile: () => {
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error('Chưa đăng nhập');
        
        try {
            const [, payload] = token.split('.');
            const tokenData = JSON.parse(atob(payload));
            const userId = tokenData.userId || tokenData.id || tokenData.sub;
            
            if (!userId) throw new Error('Không tìm thấy userId trong token');
            
            return authorApi.get(`/Admin/get-account-details?userId=${userId}`);
        } catch (error) {
            throw new Error('Không thể parse token: ' + error.message);
        }
    },
    // Update profile using Admin update-staff-account endpoint
    editProfile: (data) => {
        // Extract userId from token
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error('Chưa đăng nhập');
        
        try {
            const [, payload] = token.split('.');
            const tokenData = JSON.parse(atob(payload));
            const userId = tokenData.userId || tokenData.id || tokenData.sub;
            
            if (!userId) throw new Error('Không tìm thấy userId trong token');
            
            // Add userId to data
            const requestData = {
                ...data,
                userId: userId
            };
            
            // Always use JSON (authorApi) to avoid 415 error
            return authorApi.put('/Admin/update-staff-account', requestData);
        } catch (error) {
            throw new Error('Không thể parse token: ' + error.message);
        }
    },
    // Upload avatar file
    uploadAvatar: (file) => {
        console.log('Uploading avatar file:', file);
        const formData = new FormData();
        formData.append('file', file);
        console.log('FormData created, sending to /User/upload-avatar');
        return formDataApi.post('/User/upload-avatar', formData);
    },
    getAllUsers: () => authorApi.get(`${API_URL}/get-all-user`),
    changePassword: (data) => authorApi.post('/User/changePassword', data),
    updateUser: (userId, data) => authorApi.put(`${API_URL}/update-user/${userId}`, data),
    banUser: (id) => authorApi.put(`${API_URL}/banUser/${id}`),
};

export default userAPI;