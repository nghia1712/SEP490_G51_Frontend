// import { jwtDecode } from 'jwt-decode'; // Tạm thời comment để tránh xung đột
import { useNavigate, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Hàm jwtDecode giả lập để tránh xung đột
const jwtDecode = (token) => {
    if (token && token.startsWith('demo-token-')) {
        const userId = token.split('-')[2];
        let roleId = 2; // default customer
        if (userId === '1' || userId === '3') roleId = 1; // staff
        if (userId === '4') roleId = 3; // manager
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
            console.log('Checking auth with token:', token);
            
            if (!token) {
                console.log('No token found');
                setIsAuthenticated(false);
                setIsLoading(false);
                return;
            }

            // Đơn giản hóa: chỉ cần có token là được
            try {
                const decodedToken = jwtDecode(token);
                console.log('Decoded token:', decodedToken);
                
                if (decodedToken && decodedToken.roleId) {
                    let userRole;
                    if (decodedToken.roleId === 1) userRole = 'sales_staff';
                    else if (decodedToken.roleId === 2) userRole = 'purchases_staff';
                    else if (decodedToken.roleId === 3) userRole = 'warehouse_staff';
                    else if (decodedToken.roleId === 4) userRole = 'customer';
                    else if (decodedToken.roleId === 5) userRole = 'manager';
                    else userRole = 'customer';
                    
                    console.log('User role:', userRole, 'Allowed roles:', allowedRoles);
                    
                    if (allowedRoles.includes(userRole)) {
                        setIsAuthenticated(true);
                    } else {
                        setIsAuthenticated(false);
                    }
                } else {
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error('Token decode error:', error);
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
    return isAuthenticated ? children : <Navigate to={redirectTo} replace />;
};

export default ProtectedRoute;
