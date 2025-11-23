import authorApi from "./baseAPI/authorAPI";
import formDataApi from "./baseAPI/formDataAPI";
// Không cần import axios vì đang dùng fetch API cho updateCustomerProfile

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
    
    // Upload business certificate (chứng nhận kinh doanh)
    uploadBusinessCertificate: (file) => {
        console.log('Uploading business certificate:', file);
        const formData = new FormData();
        formData.append('file', file);
        console.log('FormData created, sending to /User/upload-business-certificate');
        return formDataApi.post('/User/upload-business-certificate', formData);
    },
    getAllUsers: () => authorApi.get(`${API_URL}/get-all-user`),
    changePassword: (data) => authorApi.post('/User/changePassword', data),
    updateUser: (userId, data) => authorApi.put(`${API_URL}/update-user/${userId}`, data),
    banUser: (id) => authorApi.put(`${API_URL}/banUser/${id}`),
    
    // Customer additional info APIs
    submitAdditionalInfo: (data) => authorApi.post('/User/submit-additional-info', data),
    getCustomerStatus: () => authorApi.get('/User/customer-status'),
    
    // Customer profile update API (multipart/form-data)
    updateCustomerProfile: async (data) => {
        const formData = new FormData();
        
        // Backend expects: Mst (long?), Mshkd (long?), ImageCnkd (IFormFile), ImageByt (IFormFile)
        // Append Mst - backend sẽ parse string thành long
        if (data.mst) {
            formData.append('Mst', data.mst);
        }
        
        // Append Mshkd
        if (data.mshkd) {
            formData.append('Mshkd', data.mshkd);
        }
        
        // Append files - phải là File object
        if (data.imageCnkd) {
            formData.append('ImageCnkd', data.imageCnkd);
        }
        
        if (data.imageByt) {
            formData.append('ImageByt', data.imageByt);
        }
        
        // Debug: log FormData contents
        console.log('FormData contents:');
        for (let pair of formData.entries()) {
            console.log(pair[0] + ': ', pair[1]);
        }
        
        // Sử dụng formDataApi.put() giống như supplierProductAPI đang dùng
        // formDataApi đã được cấu hình để xử lý FormData đúng cách với PUT request
        console.log('Using formDataApi.put() for PUT request with FormData');
        console.log('FormData entries:', Array.from(formData.entries()).map(([k, v]) => [k, v instanceof File ? `File: ${v.name}` : v]));
        
        return formDataApi.put('/User/CustomerProfileUpdate', formData);
    },
    
    // Admin APIs for customer approval
    updateCustomerStatus: (customerId) => authorApi.put(`/Admin/activate/${customerId}`),
};

export default userAPI;