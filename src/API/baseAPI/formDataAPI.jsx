//create a base API for multipart/form-data
import axios from 'axios';
import authAPI from '../authAPI';

// Create Axios instance
const formDataApi = axios.create({
    baseURL: '/api',
    // KHÔNG set Content-Type ở đây, để axios tự động set với boundary khi gửi FormData
    withCredentials: true,
    // Đảm bảo axios xử lý FormData đúng cách
    transformRequest: [(data, headers) => {
        // Nếu data là FormData, để axios tự động xử lý
        if (data instanceof FormData) {
            // Xóa Content-Type để axios tự động set với boundary
            delete headers['Content-Type'];
            delete headers['content-type'];
            // Return FormData để axios tự động detect và set Content-Type đúng
            return data;
        }
        return data;
    }]
});

// Request Interceptor
formDataApi.interceptors.request.use(config => {
    // THÊM: Lấy token từ localStorage và gắn vào header
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    // Để axios tự động set Content-Type với boundary cho multipart/form-data
    // Xóa Content-Type nếu là FormData để axios tự động thêm boundary
    if (config.data instanceof FormData) {
        // Xóa Content-Type để axios tự động thêm boundary
        // Phải xóa cả trong headers object và trong config.headers
        if (config.headers) {
            delete config.headers['Content-Type'];
            delete config.headers['content-type'];
        }
        // Đảm bảo axios xử lý FormData đúng cách
        // Với PUT request, axios có thể không tự động detect FormData
        // Nên cần đảm bảo config được set đúng
        // Không cần set lại data vì transformRequest đã xử lý
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response Interceptor
formDataApi.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // Prevent infinite loops

            try {
                const newAccessToken = await authAPI.refreshToken();

                if (newAccessToken && typeof newAccessToken === 'string') {
                    localStorage.setItem('authToken', newAccessToken);
                    originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                    return formDataApi(originalRequest);
                } else {
                    console.error('Refresh token response không hợp lệ');
                    localStorage.removeItem('authToken');
                    window.location.href = '/login';
                }
            } catch (refreshError) {
                console.error('Refresh token failed:', refreshError);
                localStorage.removeItem('authToken');
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default formDataApi;