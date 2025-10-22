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
import { ResetPasswordWithSimpleHeader, ForgotPasswordWithSimpleHeader, GuestPageWithSimpleHeader, LoginWithSimpleHeader, RegisterWithSimpleHeader, ConfirmEmailWithSimpleHeader } from "./Components/Utils/SimpleHeaderWrapper";
import ChangePassword from "./Components/User_Components/ChangePassword";
import ViewProfile from "./Components/User_Components/ViewProfile";
import EditProfile from "./Components/User_Components/EditProfile";
import SearchMedicine from "./Components/Guest_Components/SearchMedicine";
import useAuth from "./Hooks/useAuth";
import ListAllUsers from "./Components/Admin_Components/ListAllUsers";
import CreateStaff from "./Components/Admin_Components/CreateStaff";
import ListProduct from "./Components/Product_Components/ListProduct";
import ListCategory from "./Components/Category_Components/ListCategory";
import SupplierListAdvanced from "./Components/Supplier_Components/SupplierListAdvanced";
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
    // Guest: hiển thị SearchMedicine với Simple Header
    return (
      <GuestPageWithSimpleHeader>
        <SearchMedicine />
      </GuestPageWithSimpleHeader>
    );
  }
  
  try {
    // Đọc vai trò từ token để điều hướng admin về trang quản trị
    const roleFromToken = getUserRoleFromToken();
    
    // Admin: đưa về danh sách quản lý người dùng - quản lý
    if (roleFromToken === 'admin') {
      return <Navigate to="/admin/users/manager" replace />;
    }
    
    // User đã đăng nhập: redirect về trang phù hợp với role
    if (roleFromToken === 'purchases_staff') {
      return <Navigate to="/purchase-staff" replace />;
    } else if (roleFromToken === 'customer') {
      return <Navigate to="/customer" replace />;
    } else if (roleFromToken === 'sales_staff') {
      return <Navigate to="/sales-staff" replace />;
    } else if (roleFromToken === 'warehouse_staff') {
      return <Navigate to="/warehouse-staff" replace />;
    } else if (roleFromToken === 'accountant_staff') {
      return <Navigate to="/accountant-staff" replace />;
    } else if (roleFromToken === 'manager') {
      return <Navigate to="/manager" replace />;
    }
    
    // Fallback: redirect về landing page
    return <Navigate to="/landing" replace />;
  } catch (error) {
    console.error("Error parsing token:", error);
    // Nếu có lỗi với token, xóa token và hiển thị guest page
    localStorage.removeItem("authToken");
    return (
      <GuestPageWithSimpleHeader>
        <SearchMedicine />
      </GuestPageWithSimpleHeader>
    );
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
            <Routes>
              {/* Route đặc biệt - reset-password và forgot-password có header riêng */}
              <Route path="/reset-password" element={<ResetPasswordWithSimpleHeader />} />
              <Route path="/forgot-password" element={<ForgotPasswordWithSimpleHeader />} />
              
              {/* Routes cho Guest và Auth - sử dụng SimpleHeader riêng (giống forgot-password) */}
              <Route path="/" element={<ConditionalHome />} />
              <Route path="/search-medicine" element={
                <GuestPageWithSimpleHeader>
                  <SearchMedicine />
                </GuestPageWithSimpleHeader>
              } />
              <Route path="/login" element={<LoginWithSimpleHeader />} />
              <Route path="/register" element={<RegisterWithSimpleHeader />} />
              <Route path="/confirm-email" element={<ConfirmEmailWithSimpleHeader />} />
              
              {/* Routes với Header và Footer cho authenticated users */}
              <Route path="/*" element={
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
                      {/* Route mặc định đã được xử lý ở routes chính */}
                      
                      {/* Landing page cho authenticated users */}
                      <Route path="/landing" element={<Landing />} />
                      
                      {/* Role-specific landing pages */}
                      <Route path="/purchase-staff" element={<Landing />} />
                      <Route path="/customer" element={<Landing />} />
                      <Route path="/sales-staff" element={<Landing />} />
                      <Route path="/warehouse-staff" element={<Landing />} />
                      <Route path="/accountant-staff" element={<Landing />} />
                      <Route path="/manager" element={<Landing />} />
                      
                      {/* Routes cho Guest và Auth đã được xử lý ở routes chính */}
                      <Route path="/change-password" element={<ChangePasswordWithBackground />} />
                      
                      {/* Routes cho Guest đã được xử lý ở routes chính */}
                      
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
                            <ListProduct />
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
                            <Navigate to="/suppliers" replace />
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
              } />
            </Routes>
        </Router>
      </NotificationWrapper>
    </AuthProvider>
  );
}

export default App;