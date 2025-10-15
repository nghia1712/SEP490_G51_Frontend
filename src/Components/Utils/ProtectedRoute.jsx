// import { jwtDecode } from 'jwt-decode'; // Tạm thời comment để tránh xung đột
import { useNavigate, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import getUserRoleFromToken from '../../Utils/getUserRoleFromToken.jsx';

// Hàm jwtDecode giả lập và trích xuất role từ token thực nếu có
const jwtDecode = (token) => {
    // Ưu tiên: Token JWT thật (có 2 dấu chấm)
    if (token && token.includes('.')) {
        try {
            const [, payload] = token.split('.');
            const data = JSON.parse(atob(payload));
            return data;
        } catch (e) {
            // fallback demo token bên dưới
        }
    }
    if (token && token.startsWith('demo-token-')) {
        const userId = token.split('-')[2];
        let roleId = 2; // default customer
        if (userId === '1' || userId === '3') roleId = 1; // staff
        if (userId === '4') roleId = 3; // manager
        if (userId === '9') roleId = 6; // admin demo
        return { 
          roleId,
          userId: parseInt(userId),
          exp: Date.now() / 1000 + 3600 // Token hết hạn sau 1 giờ
        };
    }
    return {};
};

const checkTokenExpiration = () => {
    const token = localStorage.getItem('authToken');
    if (token) {
        try {
            const { exp } = jwtDecode(token);
            const currentTime = Date.now() / 1000;

            // ✅ THÊM: Kiểm tra nếu token sắp hết hạn trong 30 phút tới
            const timeUntilExpiry = exp - currentTime;
            if (timeUntilExpiry < 1800) { // 30 phút = 1800 seconds
                console.warn('⚠️ Token sắp hết hạn trong 30 phút');
                // Có thể thêm logic refresh token tại đây
            }

            if (currentTime >= exp) {
                console.warn('🚨 Token đã hết hạn');
                localStorage.removeItem('authToken');
                return true; // Token hết hạn
            }
        } catch (error) {
            console.error('Invalid token format:', error);
            localStorage.removeItem('authToken');
            return true;
        }
    }
    return !token; // Token không tồn tại hoặc hợp lệ
};

const ProtectedRoute = ({ children, allowedRoles, redirectTo = '/login' }) => {
    const token = localStorage.getItem("authToken");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            if (!token) {
                setIsAuthenticated(false);
                setIsLoading(false);
                return;
            }

            try {
                // Nếu token đã hết hạn -> logout cứng và báo message
                if (checkTokenExpiration()) {
                    // Lưu thông báo để hiển thị sau redirect
                    sessionStorage.setItem('postLogoutMessage', 'Vui lòng đăng nhập để tiếp tục sử dụng các chức năng');
                    setIsAuthenticated(false);
                    setIsLoading(false);
                    return;
                }
                const userRole = getUserRoleFromToken();
                setIsAuthenticated(allowedRoles.includes(userRole));
            } catch (error) {
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [token, allowedRoles]);

    if (isLoading) {
        return <div>Đang kiểm tra quyền truy cập...</div>;
    }

    console.log('ProtectedRoute - isAuthenticated:', isAuthenticated);
    if (isAuthenticated) return children;
    // Nếu có thông điệp sau logout, chuyển kèm state để màn hình login hiện notice
    return <Navigate to={redirectTo} replace state={{ notice: sessionStorage.getItem('postLogoutMessage') }} />;
};

export default ProtectedRoute;
