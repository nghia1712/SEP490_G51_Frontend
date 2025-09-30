import axios from 'axios';
import authAPI from '../authAPI';

// Create Axios instance
const authorApi = axios.create({
    baseURL: 'http://localhost:9999',
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true // Ensures cookies are sent with requests
});

// Request Interceptor
authorApi.interceptors.request.use(config => {
    // Get the token from localStorage or cookies
    const token = localStorage.getItem('authToken');
    console.log("Token from localStorage:", token);
    if (token) {
        // Attach the token to the Authorization header
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    // Optionally, you can log the request or modify it further
    // Return the modified config
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response Interceptor
authorApi.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // Prevent infinite loops

            try {
                const response = await authAPI.refreshToken();

                // ✅ SỬA: Kiểm tra response và accessToken trước khi sử dụng
                if (response && response.data && response.data.accessToken) {
                    localStorage.setItem('authToken', response.data.accessToken);
                    // Cập nhật token cho request hiện tại
                    originalRequest.headers['Authorization'] = `Bearer ${response.data.accessToken}`;
                    return authorApi(originalRequest);
                } else if (response && response.accessToken) {
                    // Trường hợp response.accessToken trực tiếp
                    localStorage.setItem('authToken', response.accessToken);
                    originalRequest.headers['Authorization'] = `Bearer ${response.accessToken}`;
                    return authorApi(originalRequest);
                } else {
                    // Không có accessToken, chuyển về login
                    console.error('Refresh token response không có accessToken');
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

export default authorApi;
