import React, { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Box } from "@mui/material";
import Header from "./Components/Utils/Header";
import Footer from "./Components/Utils/Footer";
import Landing from "./Components/Utils/Landing";
import ProtectedRoute from "./Components/Utils/ProtectedRoute";
import Login from "./Components/Login_Components/Login";
import Register from "./Components/Login_Components/Register";
import ForgotPassword from "./Components/Login_Components/ForgotPassword";
import ViewProfile from "./Components/User_Components/ViewProfile";
import EditProfile from "./Components/User_Components/EditProfile";
import ChangePassword from "./Components/User_Components/ChangePassword";
import SearchMedicine from "./Components/Guest_Components/SearchMedicine";
import useAuth from "./Hooks/useAuth";
import ListAllUsers from "./Components/Manager_Components/ListAllUsers";
import CreateEmployee from "./Components/Manager_Components/CreateEmployee";
import ProductList from "./Components/Product_Components/ProductList";
import ListCategory from "./Components/Category_Components/ListCategory";

// Tạo AuthContext để quản lý trạng thái xác thực toàn cục
const AuthContext = createContext();

// AuthProvider component để cung cấp context cho toàn bộ app
const AuthProvider = ({ children }) => {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

// Hook để sử dụng AuthContext
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

// Component để hiển thị trang chủ phù hợp với từng loại user
const ConditionalHome = () => {
  const { user, loading } = useAuthContext();
  const currentToken = localStorage.getItem("authToken");
  
  // Nếu đang loading, hiển thị loading
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Nếu có user hoặc token, hiển thị Landing page
  if (user || currentToken) {
    return <Landing />;
  }
  
  // Nếu là guest, hiển thị SearchMedicine
  return <SearchMedicine />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Box chính bao bọc toàn bộ ứng dụng để đảm bảo Footer luôn ở cuối trang */}
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Header />
          <Box component="main" sx={{ flexGrow: 1 }}>
            <Routes>
              {/* Route mặc định - hiển thị SearchMedicine cho guest, Landing cho user đã đăng nhập */}
              <Route path="/" element={<ConditionalHome />} />
              
              {/* Routes cho xác thực */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              
              {/* Routes cho Guest (không cần đăng nhập) */}
              <Route path="/search-medicine" element={<SearchMedicine />} />
              <Route path="/medicine-categories" element={<div>Danh mục thuốc - Đang phát triển</div>} />
              <Route path="/medicine-info" element={<div>Thông tin thuốc - Đang phát triển</div>} />
              <Route path="/contact" element={<div>Liên hệ - Đang phát triển</div>} />
              
              {/* Routes cho Staff */}
              <Route 
                path="/product" 
                element={
                  <ProtectedRoute allowedRoles={['staff']}>
                    <ProductList />
                  </ProtectedRoute>
                } 
              />
              <Route path="/receipts" element={<div>Nhập hàng - Đang phát triển</div>} />
              <Route path="/export" element={<div>Xuất hàng - Đang phát triển</div>} />
              <Route path="/stocktaking" element={<div>Kiểm kê - Đang phát triển</div>} />
              
              {/* Routes cho Customer */}
              <Route path="/my-orders" element={<div>Đơn hàng của tôi - Đang phát triển</div>} />
              <Route path="/purchase-history" element={<div>Lịch sử mua hàng - Đang phát triển</div>} />
              
              {/* Routes cho Manager/Employee */}
              <Route 
                path="/category" 
                element={
                  <ProtectedRoute allowedRoles={['staff']}>
                    <ListCategory />
                  </ProtectedRoute>
                } 
              />
              <Route path="/list-transaction" element={<div>Giao dịch - Đang phát triển</div>} />
              <Route 
                path="/manager/get-all-user" 
                element={
                  <ProtectedRoute allowedRoles={['manager']}>
                    <ListAllUsers />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/manager/create-employee" 
                element={
                  <ProtectedRoute allowedRoles={['manager']}>
                    <CreateEmployee />
                  </ProtectedRoute>
                }
              />
              
              {/* Routes được bảo vệ - chỉ user đã đăng nhập mới truy cập được */}
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute allowedRoles={['staff', 'customer', 'manager']}>
                    <ViewProfile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/edit-profile" 
                element={
                  <ProtectedRoute allowedRoles={['staff', 'customer', 'manager']}>
                    <EditProfile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/change-password" 
                element={
                  <ProtectedRoute allowedRoles={['staff', 'customer', 'manager']}>
                    <ChangePassword />
                  </ProtectedRoute>
                } 
              />
              
              {/* Route fallback - chuyển hướng về trang chủ nếu không tìm thấy */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
          <Footer />
        </Box>
      </Router>
    </AuthProvider>
  );
}

export default App;
