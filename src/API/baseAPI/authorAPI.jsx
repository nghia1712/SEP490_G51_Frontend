import axios from 'axios';
import authAPI from '../authAPI';
import tokenManager from '../../Utils/tokenManager';

// Create Axios instance (proxied to backend via Vite at /api)
const authorApi = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
});

// Request Interceptor
authorApi.interceptors.request.use(async config => {
    // Sử dụng TokenManager để lấy token hợp lệ
    const token = await tokenManager.getValidToken();
    
    console.log("=== REQUEST INTERCEPTOR ===");
    console.log("URL:", config.url);
    console.log("Token exists:", !!token);
    console.log("Token preview:", token ? token.substring(0, 50) + "..." : "No token");
    
    if (token) {
        // Attach the token to the Authorization header
        config.headers['Authorization'] = `Bearer ${token}`;
        console.log("Authorization header set:", `Bearer ${token.substring(0, 20)}...`);
    } else {
        console.log("No token available, request will fail");
    }
    
    return config;
}, (error) => {
    console.log("Request interceptor error:", error);
    return Promise.reject(error);
});

// Response Interceptor
authorApi.interceptors.response.use(
    response => {
        console.log("=== RESPONSE INTERCEPTOR ===");
        console.log("URL:", response.config?.url);
        console.log("Status:", response.status);
        console.log("Response data:", response.data);
        return response;
    },
    async error => {
        console.log("=== RESPONSE ERROR INTERCEPTOR ===");
        console.log("URL:", error.config?.url);
        console.log("Status:", error.response?.status);
        console.log("Error message:", error.message);
        console.log("Error response:", error.response);
        console.log("Error response data:", error.response?.data);
        const originalRequest = error.config;

        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // Prevent infinite loops

            try {
                console.log('Token hết hạn, đang refresh token...');
                
                // Backend returns plain string access token
                const newAccessToken = await authAPI.refreshToken();

                if (newAccessToken && typeof newAccessToken === 'string') {
                    console.log('Refresh token thành công');
                    localStorage.setItem('authToken', newAccessToken);
                    originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                    return authorApi(originalRequest);
                } else {
                    console.error('Refresh token response không hợp lệ');
                    localStorage.removeItem('authToken');
                    // Clear any user data
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
            } catch (refreshError) {
                console.error('Refresh token failed:', refreshError);
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                
                // Show notification to user if available
                if (window.showNotification) {
                    window.showNotification('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'warning');
                }
                
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default authorApi;