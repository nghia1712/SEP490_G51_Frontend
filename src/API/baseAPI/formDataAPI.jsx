//create a base API for multipart/form-data
import axios from 'axios';
import authAPI from '../authAPI';

// Create Axios instance
const formDataApi = axios.create({
    baseURL: '/api',
    headers: {
        "Content-Type": "multipart/form-data"
    },
    withCredentials: true
});

// Request Interceptor
formDataApi.interceptors.request.use(config => {
    // THÊM: Lấy token từ localStorage và gắn vào header
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
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