import React, { useState, useEffect, createContext, useContext } from "react";
import getUserRoleFromToken from "./Utils/getUserRoleFromToken.jsx";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Box } from "@mui/material";
import Header from "./Components/Utils/Header";
import Footer from "./Components/Utils/Footer";
import Landing from "./Components/Utils/Landing";
import ProtectedRoute from "./Components/Utils/ProtectedRoute";
import DevelopmentPage from "./Components/Utils/CommonComponents/DevelopmentPage";
import Login from "./Components/Login_Components/Login";
import Register from "./Components/Login_Components/Register";
import ConfirmEmail from "./Components/Login_Components/ConfirmEmail";
import ResetPassword from "./Components/Login_Components/ResetPassword";
import ForgotPassword from "./Components/Login_Components/ForgotPassword";
import ChangePassword from "./Components/User_Components/ChangePassword";
import ViewProfile from "./Components/User_Components/ViewProfile";
import EditProfile from "./Components/User_Components/EditProfile";
import SearchMedicine from "./Components/Guest_Components/SearchMedicine";
import useAuth from "./Hooks/useAuth";
import ListAllUsers from "./Components/Admin_Components/ListAllUsers";
import CreateStaff from "./Components/Admin_Components/CreateStaff";
import ProductList from "./Components/Product_Components/ProductList";
import ListCategory from "./Components/Category_Components/ListCategory";
import SupplierListAdvanced from "./Components/Supplier_Components/SupplierListAdvanced";
import AddNewSupplier from "./Components/Supplier_Components/AddNewSupplier";
import ManageSupplierProducts from "./Components/Supplier_Components/ManageSupplierProducts";
import SupplierProductDetail from "./Components/Supplier_Components/SupplierProductDetail";
import SalesDashboard from "./Components/Sales_Components/SalesDashboard";
import PurchasesDashboard from "./Components/Purchases_Components/PurchasesDashboard";
import WarehouseDashboard from "./Components/Warehouse_Components/WarehouseDashboard";
import ManagerDashboard from "./Components/Utils/RoleDashboards/ManagerDashboard";
import ProductWarehouse from "./Components/Warehouse_Components/ProductWarehouse";
import InventoryCheck from "./Components/Inventory_Components/InventoryCheck";
import Stocktaking from "./Components/Inventory_Components/Stocktaking";
import sessionManager from "./Utils/sessionManager";

// Tạo AuthContext để quản lý trạng thái xác thực toàn cục
const AuthContext = createContext();

// AuthProvider component để cung cấp context cho toàn bộ app
const AuthProvider = ({ children }) => {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

// NotificationWrapper component để thiết lập global notification
const NotificationWrapper = ({ children }) => {
  useEffect(() => {
    // Khởi tạo session manager
    sessionManager.init();
  }, []);
  
  return children;
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
  const currentToken = localStorage.getItem("authToken");
  
  // Đơn giản hóa logic: chỉ kiểm tra token, không phụ thuộc vào useAuthContext
  if (!currentToken) {
    // Guest: hiển thị SearchMedicine
    return <SearchMedicine />;
  }
  
  try {
    // Đọc vai trò từ token để điều hướng admin về trang quản trị
    const roleFromToken = getUserRoleFromToken();
    
    // Admin: đưa về danh sách quản lý người dùng - quản lý
    if (roleFromToken === 'admin') {
      return <Navigate to="/admin/users/manager" replace />;
    }
    
    // User đã đăng nhập: hiển thị Landing page
    return <Landing />;
  } catch (error) {
    console.error("Error parsing token:", error);
    // Nếu có lỗi với token, xóa token và hiển thị guest page
    localStorage.removeItem("authToken");
    return <SearchMedicine />;
  }
};

// Wrapper components với backgroundLogin cho các trang authentication
const LoginWithBackground = () => (
  <Box sx={{ 
    backgroundImage: "url('/images/backgroundLogin.jpg')", 
    backgroundSize: 'cover', 
    backgroundRepeat: 'no-repeat', 
    backgroundPosition: 'center', 
    backgroundAttachment: 'fixed',
    minHeight: 'calc(100vh - 120px)', // Trừ đi chiều cao header và footer
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 0', // Padding trên dưới để căn giữa
  }}>
    <Login />
  </Box>
);

const RegisterWithBackground = () => (
  <Box sx={{ 
    backgroundImage: "url('/images/backgroundLogin.jpg')", 
    backgroundSize: 'cover', 
    backgroundRepeat: 'no-repeat', 
    backgroundPosition: 'center', 
    backgroundAttachment: 'fixed',
    minHeight: 'calc(100vh - 120px)', // Trừ đi chiều cao header và footer
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 0', // Padding trên dưới để căn giữa
  }}>
    <Register />
  </Box>
);

const ForgotPasswordWithBackground = () => (
  <Box sx={{ 
    backgroundImage: "url('/images/backgroundLogin.jpg')", 
    backgroundSize: 'cover', 
    backgroundRepeat: 'no-repeat', 
    backgroundPosition: 'center', 
    backgroundAttachment: 'fixed',
    minHeight: 'calc(100vh - 120px)', // Trừ đi chiều cao header và footer
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 0', // Padding trên dưới để căn giữa
  }}>
    <ForgotPassword />
  </Box>
);

const ChangePasswordWithBackground = () => (
  <Box sx={{ 
    backgroundImage: "url('/images/backgroundLogin.jpg')", 
    backgroundSize: 'cover', 
    backgroundRepeat: 'no-repeat', 
    backgroundPosition: 'center', 
    backgroundAttachment: 'fixed',
    minHeight: 'calc(100vh - 120px)', // Trừ đi chiều cao header và footer
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 0', // Padding trên dưới để căn giữa
  }}>
    <ChangePassword />
  </Box>
);

function App() {
  return (
    <AuthProvider>
      <NotificationWrapper>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            {/* Box chính bao bọc toàn bộ ứng dụng để đảm bảo Footer luôn ở cuối trang */}
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Header />
              <Box component="main" sx={{ 
                flexGrow: 1, 
                backgroundImage: "url('/images/backgroundMedical2.jpg')", 
                backgroundSize: 'cover', 
                backgroundRepeat: 'no-repeat', 
                backgroundPosition: 'center', 
                backgroundAttachment: 'fixed' 
              }}>
            <Routes>
              {/* Route mặc định - hiển thị SearchMedicine cho guest, Landing cho user đã đăng nhập */}
              <Route path="/" element={<ConditionalHome />} />
              
              {/* Routes cho xác thực - sử dụng backgroundLogin */}
              <Route path="/login" element={<LoginWithBackground />} />
              <Route path="/register" element={<RegisterWithBackground />} />
              <Route path="/confirm-email" element={<ConfirmEmail />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/forgot-password" element={<ForgotPasswordWithBackground />} />
              <Route path="/change-password" element={<ChangePasswordWithBackground />} />
              
              {/* Routes cho Guest (không cần đăng nhập) */}
              <Route path="/search-medicine" element={<SearchMedicine />} />
              <Route path="/medicine-categories" element={<div>Danh mục thuốc - Đang phát triển</div>} />
              <Route path="/medicine-info" element={<div>Thông tin thuốc - Đang phát triển</div>} />
              <Route path="/contact" element={<div>Liên hệ - Đang phát triển</div>} />
              
              {/* Routes cho Sales Staff */}
              <Route 
                path="/sales" 
                element={
                  <ProtectedRoute allowedRoles={['manager', 'sales_staff', 'admin']}>
                    <SalesDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Routes cho Sales Staff */}
              <Route 
                path="/sales-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['manager', 'sales_staff', 'admin']}>
                    <SalesDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Routes cho Purchases Staff */}
              <Route 
                path="/purchases-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['manager', 'purchases_staff', 'admin']}>
                    <PurchasesDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/purchases" 
                element={
                  <ProtectedRoute allowedRoles={['manager', 'purchases_staff', 'admin']}>
                    <PurchasesDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Routes cho Manager Dashboard */}
              <Route 
                path="/manager-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['manager', 'accountant_staff', 'admin']}>
                    <ManagerDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Routes cho Warehouse Staff */}
              <Route 
                path="/warehouse-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['manager', 'warehouse_staff', 'accountant_staff', 'admin']}>
                    <WarehouseDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/warehouse" 
                element={
                  <ProtectedRoute allowedRoles={['manager', 'warehouse_staff', 'accountant_staff', 'admin']}>
                    <WarehouseDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/warehouse-products" 
                element={
                  <ProtectedRoute allowedRoles={['manager', 'warehouse_staff', 'accountant_staff', 'admin']}>
                    <ProductWarehouse />
                  </ProtectedRoute>
                } 
              />
              
              {/* Routes cho tất cả Staff */}
              <Route 
                path="/product" 
                element={
                  <ProtectedRoute allowedRoles={['manager', 'sales_staff', 'purchases_staff', 'warehouse_staff', 'accountant_staff', 'admin']}>
                    <ProductList />
                  </ProtectedRoute>
                } 
              />
              
              {/* Route cho trang đang phát triển */}
              <Route 
                path="/development" 
                element={<DevelopmentPage />} 
              />
              <Route 
                path="/inventory-check" 
                element={
                  <ProtectedRoute allowedRoles={['manager', 'warehouse_staff', 'accountant_staff', 'admin']}>
                    <InventoryCheck />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/stocktaking" 
                element={
                  <ProtectedRoute allowedRoles={['manager', 'warehouse_staff', 'accountant_staff', 'admin']}>
                    <Stocktaking />
                  </ProtectedRoute>
                } 
              />
              <Route path="/receipts" element={<div>Nhập hàng - Đang phát triển</div>} />
              <Route path="/export" element={<div>Xuất hàng - Đang phát triển</div>} />
              
              {/* Routes cho Customer */}
              <Route path="/my-orders" element={<div>Đơn hàng của tôi - Đang phát triển</div>} />
              <Route path="/purchase-history" element={<div>Lịch sử mua hàng - Đang phát triển</div>} />
              
              {/* Routes cho Manager/Staff */}
              <Route 
                path="/category" 
                element={
                  <ProtectedRoute allowedRoles={['manager', 'sales_staff', 'purchases_staff', 'warehouse_staff', 'accountant_staff']}>
                    <ListCategory />
                  </ProtectedRoute>
                } 
              />
              <Route path="/list-transaction" element={<div>Giao dịch - Đang phát triển</div>} />
              {/* Removed legacy /admin/users route */}
              <Route 
                path="/admin/users/customer" 
                element={
                  <ProtectedRoute allowedRoles={['manager', 'admin']}>
                    <ListAllUsers roleGroup="customer" />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/admin/users/staff" 
                element={
                  <ProtectedRoute allowedRoles={['manager', 'admin']}>
                    <ListAllUsers roleGroup="staff" />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/admin/users/manager" 
                element={
                  <ProtectedRoute allowedRoles={['manager', 'admin']}>
                    <ListAllUsers roleGroup="manager" />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/admin/create-staff" 
                element={
                  <ProtectedRoute allowedRoles={['manager', 'admin']}>
                    <CreateStaff />
                  </ProtectedRoute>
                }
              />
              
              {/* Routes cho Supplier Management */}
              <Route 
                path="/suppliers" 
                element={
                  <ProtectedRoute allowedRoles={['manager', 'purchases_staff', 'admin']}>
                    <SupplierListAdvanced />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/manager/add-suppliers" 
                element={
                  <ProtectedRoute allowedRoles={['manager', 'purchases_staff']}>
                    <AddNewSupplier />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/manager/manage-supplier-products" 
                element={
                  <ProtectedRoute allowedRoles={['manager', 'admin']}> 
                    <ManageSupplierProducts />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/manager/supplier-products/:id" 
                element={
                  <ProtectedRoute allowedRoles={['manager', 'purchases_staff', 'admin']}>
                    <SupplierProductDetail />
                  </ProtectedRoute>
                }
              />
              
              {/* Routes được bảo vệ - chỉ user đã đăng nhập mới truy cập được */}
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute allowedRoles={['sales_staff', 'purchases_staff', 'warehouse_staff', 'accountant_staff', 'customer', 'manager', 'admin']}>
                    <ViewProfile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/edit-profile" 
                element={
                  <ProtectedRoute allowedRoles={['sales_staff', 'purchases_staff', 'warehouse_staff', 'accountant_staff', 'customer', 'manager', 'admin']}>
                    <EditProfile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/change-password" 
                element={
                  <ProtectedRoute allowedRoles={['sales_staff', 'purchases_staff', 'warehouse_staff', 'accountant_staff', 'customer', 'manager', 'admin']}>
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
      </NotificationWrapper>
    </AuthProvider>
  );
}

export default App;