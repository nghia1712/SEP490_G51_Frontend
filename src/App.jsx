import React, { useState, useEffect, createContext, useContext } from "react";
import getUserRoleFromToken from "./Utils/getUserRoleFromToken.jsx";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import Header from "./Components/Utils/Header";
import Footer from "./Components/Utils/Footer";
import Landing from "./Components/Utils/Landing";
import ProtectedRoute from "./Components/Utils/ProtectedRoute";
import DevelopmentPage from "./Components/Utils/CommonComponents/DevelopmentPage";
import Login from "./Components/Login_Components/Login";
import Register from "./Components/Login_Components/Register";
import ConfirmEmail from "./Components/Login_Components/ConfirmEmail";
import {
  ResetPasswordWithSimpleHeader,
  ForgotPasswordWithSimpleHeader,
  GuestPageWithSimpleHeader,
  LoginWithSimpleHeader,
  RegisterWithSimpleHeader,
  ConfirmEmailWithSimpleHeader,
} from "./Components/Utils/SimpleHeaderWrapper";
import ChangePassword from "./Components/User_Components/ChangePassword";
import ViewProfile from "./Components/User_Components/ViewProfile";
import EditProfile from "./Components/User_Components/EditProfile";
import SearchMedicine from "./Components/Guest_Components/SearchMedicine";
import useAuth from "./Hooks/useAuth";
import ListAllUsers from "./Components/Admin_Components/ListAllUsers";
import CreateStaff from "./Components/Admin_Components/CreateStaff";
import ListProduct from "./Components/Product_Components/ListProduct";
import ListCategory from "./Components/Category_Components/ListCategory";
import SupplierList from "./Components/Supplier_Components/SupplierList";
import ManageSupplierProducts from "./Components/Supplier_Components/ManageSupplierProducts";
import SalesDashboard from "./Components/Sales_Components/SalesDashboard";
import ListRSQ from "./Components/Sales_Components/ListRSQ";
import CreateRSQ from "./Components/Sales_Components/CreateRSQ";
import SalesQuotationList from "./Components/Sales_Components/SalesQuotationList";
import SalesOrderList from "./Components/Sales_Components/SalesOrderList";
import AccountantOrderList from "./Components/Accountant_Components/AccountantOrderList";
import AccountantTaxPolicy from "./Components/Accountant_Components/AccountantTaxPolicy";
import InvoiceList from "./Components/Invoice_Components/InvoiceList";
import RequestQuotationDetails from "./Components/Sales_Components/RequestQuotationDetails";
import CreateSalesQuotation from "./Components/Sales_Components/CreateSalesQuotation";
import CustomerOrderList from "./Components/Customer_Components/CustomerOrderList";
import CustomerInvoiceList from "./Components/Customer_Components/CustomerInvoiceList";
import PurchasesDashboard from "./Components/Purchases_Components/PurchasesDashboard";
import WarehouseList from "./Components/Warehouse_Components/WarehouseList";
import WarehouseDetailPage from "./Components/Warehouse_Components/WarehouseDetails.jsx";
import WarehouseDashboard from "./Components/Warehouse_Components/WarehouseDashboard";
import ManagerDashboard from "./Components/Utils/RoleDashboards/ManagerDashboard";
import ProductWarehouse from "./Components/Warehouse_Components/ProductWarehouse";
import Stocktaking from "./Components/Inventory_Components/Stocktaking";
import sessionManager from "./Utils/sessionManager";
import CustomerAdditionalInfoForm from "./Components/Customer_Components/CustomerAdditionalInfoForm";
import CustomerStatusCheck from "./Components/Customer_Components/CustomerStatusCheck";
import CustomerUnauthenticatedPage from "./Components/Customer_Components/CustomerUnauthenticatedPage";
import userAPI from "./API/userAPI";
import CustomerApprovalList from "./Components/Manager_Components/CustomerApprovalList";
import CustomerRequestQuotationList from "./Components/Customer_Components/CustomerRequestQuotationList";
import PRFQList from "./Components/Purchases_Components/PRFQ/PRFQList";
import PRFQCreate from "./Components/Purchases_Components/PRFQ/PRFQCreate";
import PQList from "./Components/Purchases_Components/PQ/PQList.jsx";
import POList from "./Components/Purchases_Components/PO/POList";
import GRNList from "./Components/Warehouse_Components/GRN/GRNList";
import GRNManualCreatePage from "./Components/Warehouse_Components/GRN/GRNManualCreatePage.jsx";
import WarehouseLocationDetailPage from "./Components/Warehouse_Components/Location/WarehouseLocationDetails.jsx";
import InventoryReportPage from "./Components/Warehouse_Components/Location/InventoryReportPage.jsx";
import StockExportList from "./Components/Warehouse_Components/GIN/StockExportList.jsx";
import StockExportForm from "./Components/Warehouse_Components/GIN/StockExportForm.jsx";
import GINList from "./Components/Warehouse_Components/GIN/GINList.jsx";
import DebtList from "./Components/Debt_Components/DebtList.jsx";
import PaymentRemainList from "./Components/PaymentRemain/PaymentRemainList.jsx";

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
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};

// Component để kiểm tra customer status và redirect
const CustomerHomeRedirect = () => {
  const [loading, setLoading] = React.useState(true);
  const [redirectTo, setRedirectTo] = React.useState(null);

  React.useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        const response = await userAPI.getCustomerStatus();
        const status = response.data.data;
        
        console.log('Customer status:', status);
        console.log('UserStatus value:', status?.userStatus, 'Type:', typeof status?.userStatus);
        
        // UserStatus = 2 (Active) → redirect đến /customer
        // UserStatus = 1 (Inactive) → redirect đến /customer-unauthenticated
        // Kiểm tra cả string và số vì backend có thể trả về enum dạng số
        const userStatus = status?.userStatus;
        if (status && (userStatus === 'Active' || userStatus === 2 || userStatus === '2')) {
          setRedirectTo('/customer');
        } else {
          setRedirectTo('/customer-unauthenticated');
        }
      } catch (error) {
        console.error('Error checking customer status:', error);
        // Nếu có lỗi, mặc định redirect đến customer-unauthenticated
        setRedirectTo('/customer-unauthenticated');
      } finally {
        setLoading(false);
      }
    };

    checkAndRedirect();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Redirect sau khi đã kiểm tra status
  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  return null;
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
    if (roleFromToken === "admin") {
      return <Navigate to="/admin/users/manager" replace />;
    }

    // User đã đăng nhập: redirect về trang phù hợp với role
    if (roleFromToken === "purchases_staff") {
      return <Navigate to="/purchase-staff" replace />;
    } else if (roleFromToken === "customer") {
      // Customer: kiểm tra status và redirect phù hợp
      return <CustomerHomeRedirect />;
    } else if (roleFromToken === "sales_staff") {
      return <Navigate to="/sales-staff" replace />;
    } else if (roleFromToken === "warehouse_staff") {
      return <Navigate to="/warehouse-staff" replace />;
    } else if (roleFromToken === "accountant_staff") {
      return <Navigate to="/accountant-staff" replace />;
    } else if (roleFromToken === "manager") {
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
  <Box
    sx={{
      backgroundImage: "url('/images/backgroundLogin.jpg')",
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
      minHeight: "calc(100vh - 120px)", // Trừ đi chiều cao header và footer
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "60px 0", // Padding trên dưới để căn giữa
    }}
  >
    <Login />
  </Box>
);

const RegisterWithBackground = () => (
  <Box
    sx={{
      backgroundImage: "url('/images/backgroundLogin.jpg')",
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
      minHeight: "calc(100vh - 120px)", // Trừ đi chiều cao header và footer
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "60px 0", // Padding trên dưới để căn giữa
    }}
  >
    <Register />
  </Box>
);

const ForgotPasswordWithBackground = () => (
  <Box
    sx={{
      backgroundImage: "url('/images/backgroundLogin.jpg')",
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
      minHeight: "calc(100vh - 120px)", // Trừ đi chiều cao header và footer
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "60px 0", // Padding trên dưới để căn giữa
    }}
  >
    <ForgotPassword />
  </Box>
);

const ChangePasswordWithBackground = () => (
  <Box
    sx={{
      backgroundImage: "url('/images/backgroundLogin.jpg')",
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
      minHeight: "calc(100vh - 120px)", // Trừ đi chiều cao header và footer
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "60px 0", // Padding trên dưới để căn giữa
    }}
  >
    <ChangePassword />
  </Box>
);

function App() {
  return (
    <AuthProvider>
      <NotificationWrapper>
        <Router
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <Routes>
            {/* Route đặc biệt - reset-password và forgot-password có header riêng */}
            <Route
              path="/reset-password"
              element={<ResetPasswordWithSimpleHeader />}
            />
            <Route
              path="/forgot-password"
              element={<ForgotPasswordWithSimpleHeader />}
            />

            {/* Routes cho Guest và Auth - sử dụng SimpleHeader riêng (giống forgot-password) */}
            <Route path="/" element={<ConditionalHome />} />
            <Route
              path="/search-medicine"
              element={
                <GuestPageWithSimpleHeader>
                  <SearchMedicine />
                </GuestPageWithSimpleHeader>
              }
            />
            <Route path="/login" element={<LoginWithSimpleHeader />} />
            <Route path="/register" element={<RegisterWithSimpleHeader />} />
            <Route
              path="/confirm-email"
              element={<ConfirmEmailWithSimpleHeader />}
            />

            {/* Route cho customer chưa bổ sung thông tin */}
            <Route
              path="/customer-unauthenticated"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <CustomerUnauthenticatedPage />
                </ProtectedRoute>
              }
            />

            {/* Routes với Header và Footer cho authenticated users */}
            <Route
              path="/*"
              element={
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    minHeight: "100vh",
                  }}
                >
                  <Header />
                  <Box
                    component="main"
                    sx={{
                      flexGrow: 1,
                      backgroundImage: "url('/images/backgroundMedical2.jpg')",
                      backgroundSize: "cover",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "center",
                      backgroundAttachment: "fixed",
                    }}
                  >
                    <Routes>
                      {/* Route mặc định đã được xử lý ở routes chính */}

                      {/* Landing page cho authenticated users */}
                      <Route path="/landing" element={<Landing />} />
                      {/* Customer Orders routes - specific routes first */}
                      <Route
                        path="/customer/orders"
                        element={
                          <ProtectedRoute allowedRoles={["customer"]}>
                            <CustomerStatusCheck>
                              <Box
                                sx={{
                                  minHeight: "100vh",
                                  backgroundImage:
                                    "url('/images/backgroundMedical2.jpg')",
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                  backgroundRepeat: "no-repeat",
                                  position: "relative",
                                  "&::before": {
                                    content: '""',
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: "rgba(255, 255, 255, 0.3)",
                                    zIndex: 1,
                                  },
                                }}
                              >
                                <Box sx={{ position: "relative", zIndex: 2 }}>
                                  <CustomerOrderList />
                                </Box>
                              </Box>
                            </CustomerStatusCheck>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/customer/invoices"
                        element={
                          <ProtectedRoute allowedRoles={["customer"]}>
                            <CustomerStatusCheck>
                              <Box
                                sx={{
                                  minHeight: "100vh",
                                  backgroundImage:
                                    "url('/images/backgroundMedical2.jpg')",
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                  backgroundRepeat: "no-repeat",
                                  position: "relative",
                                  "&::before": {
                                    content: '""',
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: "rgba(255, 255, 255, 0.3)",
                                    zIndex: 1,
                                  },
                                }}
                              >
                                <Box sx={{ position: "relative", zIndex: 2 }}>
                                  <CustomerInvoiceList />
                                </Box>
                              </Box>
                            </CustomerStatusCheck>
                          </ProtectedRoute>
                        }
                      />

                      {/* Role-specific landing pages */}
                      <Route path="/purchase-staff" element={<Landing />} />
                      <Route
                        path="/customer"
                        element={
                          <ProtectedRoute allowedRoles={["customer"]}>
                            <CustomerStatusCheck>
                              <SearchMedicine />
                            </CustomerStatusCheck>
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/sales-staff" element={<Landing />} />
                      <Route path="/warehouse-staff" element={<Landing />} />
                      <Route path="/accountant-staff" element={<Landing />} />
                      <Route path="/manager" element={<Landing />} />

                      {/* Customer Additional Info Route */}
                      <Route
                        path="/customer/additional-info"
                        element={
                          <ProtectedRoute allowedRoles={["customer"]}>
                            <CustomerAdditionalInfoForm />
                          </ProtectedRoute>
                        }
                      />

                      {/* Customer Request Quotation Route */}
                      <Route
                        path="/customer/request-quotation"
                        element={
                          <ProtectedRoute allowedRoles={["customer"]}>
                            <CustomerStatusCheck>
                              <Box
                                sx={{
                                  minHeight: "100vh",
                                  backgroundImage:
                                    "url('/images/backgroundMedical2.jpg')",
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                  backgroundRepeat: "no-repeat",
                                  position: "relative",
                                  "&::before": {
                                    content: '""',
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: "rgba(255, 255, 255, 0.3)",
                                    zIndex: 1,
                                  },
                                }}
                              >
                                <Box sx={{ position: "relative", zIndex: 2 }}>
                                  <CustomerRequestQuotationList />
                                </Box>
                              </Box>
                            </CustomerStatusCheck>
                          </ProtectedRoute>
                        }
                      />

                      {/* Routes cho Guest và Auth đã được xử lý ở routes chính */}
                      <Route
                        path="/change-password"
                        element={<ChangePasswordWithBackground />}
                      />

                      {/* Routes cho Guest đã được xử lý ở routes chính */}

                      {/* Routes cho Sales Staff */}
                      <Route
                        path="/sales"
                        element={
                          <ProtectedRoute
                            allowedRoles={["manager", "sales_staff", "admin"]}
                          >
                            <SalesDashboard />
                          </ProtectedRoute>
                        }
                      />

                      {/* Routes cho Sales Staff */}
                      <Route
                        path="/sales-dashboard"
                        element={
                          <ProtectedRoute
                            allowedRoles={["manager", "sales_staff", "admin"]}
                          >
                            <SalesDashboard />
                          </ProtectedRoute>
                        }
                      />

                      {/* Routes cho Purchases Staff */}
                      <Route
                        path="/purchases-dashboard"
                        element={
                          <ProtectedRoute
                            allowedRoles={[
                              "manager",
                              "purchases_staff",
                              "admin",
                            ]}
                          >
                            <PurchasesDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/purchases"
                        element={
                          <ProtectedRoute
                            allowedRoles={[
                              "manager",
                              "purchases_staff",
                              "admin",
                            ]}
                          >
                            <PurchasesDashboard />
                          </ProtectedRoute>
                        }
                      />

                      {/* Routes cho PRFQ */}
                      <Route
                        path="/purchase/prfq"
                        element={
                          <ProtectedRoute
                            allowedRoles={[
                              "manager",
                              "purchases_staff",
                              "admin",
                            ]}
                          >
                            <PRFQList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/purchase/prfq/form"
                        element={
                          <ProtectedRoute
                            allowedRoles={[
                              "manager",
                              "purchases_staff",
                              "admin",
                            ]}
                          >
                            <PRFQCreate />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/purchase/prfq/form/:id"
                        element={
                          <ProtectedRoute
                            allowedRoles={[
                              "manager",
                              "purchases_staff",
                              "admin",
                            ]}
                          >
                            <PRFQCreate />
                          </ProtectedRoute>
                        }
                      />

                      {/* Routes cho PQ */}
                      <Route
                        path="/purchase/pq"
                        element={
                          <ProtectedRoute
                            allowedRoles={[
                              "manager",
                              "purchases_staff",
                              "admin",
                            ]}
                          >
                            <PQList />
                          </ProtectedRoute>
                        }
                      />

                      {/* Routes cho PO */}
                      <Route
                        path="/po"
                        element={
                          <ProtectedRoute
                            allowedRoles={[
                              "manager",
                              "purchases_staff",
                              "admin",
                              "accountant_staff",
                              "warehouse_staff",
                            ]}
                          >
                            <POList />
                          </ProtectedRoute>
                        }
                      />

                      {/* Routes cho GRN */}
                      <Route
                        path="/grn"
                        element={
                          <ProtectedRoute
                            allowedRoles={[
                              "manager",
                              "warehouse_staff",
                              "admin",
                            ]}
                          >
                            <GRNList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/grn/manual-create"
                        element={
                          <ProtectedRoute
                            allowedRoles={[
                              "manager",
                              "warehouse_staff",
                              "admin",
                            ]}
                          >
                            <GRNManualCreatePage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Routes cho Manager Dashboard */}
                      <Route
                        path="/manager-dashboard"
                        element={
                          <ProtectedRoute
                            allowedRoles={[
                              "manager",
                              "accountant_staff",
                              "admin",
                            ]}
                          >
                            <ManagerDashboard />
                          </ProtectedRoute>
                        }
                      />

                      {/* Routes cho Warehouse Staff */}
                      <Route
                        path="/warehouse-dashboard"
                        element={
                          <ProtectedRoute
                            allowedRoles={[
                              "manager",
                              "warehouse_staff",
                              "accountant_staff",
                              "admin",
                            ]}
                          >
                            <WarehouseDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/warehouse"
                        element={
                          <ProtectedRoute
                            allowedRoles={[
                              "manager",
                              "warehouse_staff",
                              "admin",
                            ]}
                          >
                            <WarehouseList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/warehouse-products"
                        element={
                          <ProtectedRoute
                            allowedRoles={[
                              "manager",
                              "warehouse_staff",
                              "accountant_staff",
                              "admin",
                            ]}
                          >
                            <ProductWarehouse />
                          </ProtectedRoute>
                        }
                      />
                      {/* Warehouse detail routes */}
                      <Route
                        path="/warehouse/details/:id"
                        element={
                          <ProtectedRoute
                            allowedRoles={[
                              "manager",
                              "warehouse_staff",
                              "admin",
                            ]}
                          >
                            <WarehouseDetailPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/warehouse-location/details/:id"
                        element={
                          <ProtectedRoute
                            allowedRoles={[
                              "manager",
                              "warehouse_staff",
                              "admin",
                            ]}
                          >
                            <WarehouseLocationDetailPage />
                          </ProtectedRoute>
                        }
                      />
                      {/* Inventory report */}
                      <Route
                        path="/inventory-report"
                        element={
                          <ProtectedRoute
                            allowedRoles={[
                              "manager",
                              "warehouse_staff",
                              "accountant_staff",
                              "admin",
                            ]}
                          >
                            <InventoryReportPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/inventory-report/:id"
                        element={
                          <ProtectedRoute
                            allowedRoles={[
                              "manager",
                              "warehouse_staff",
                              "accountant_staff",
                              "admin",
                            ]}
                          >
                            <InventoryReportPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Stock Export / GIN */}
                      <Route
                        path="/stock-export"
                        element={
                          <ProtectedRoute
                            allowedRoles={[
                              "sales_staff",
                              "warehouse_staff",
                              "admin",
                            ]}
                          >
                            <StockExportList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/stock-export/create"
                        element={
                          <ProtectedRoute
                            allowedRoles={[
                              "sales_staff",
                              "warehouse_staff",
                              "admin",
                            ]}
                          >
                            <StockExportForm />
                          </ProtectedRoute>
                        }
                      />

                      {/* Cập nhật lệnh xuất kho theo id */}
                      <Route
                        path="/stock-export/edit/:id"
                        element={
                          <ProtectedRoute
                            allowedRoles={[
                              "sales_staff",
                              "warehouse_staff",
                              "admin",
                            ]}
                          >
                            <StockExportForm />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/gin"
                        element={
                          <ProtectedRoute
                            allowedRoles={[
                              "manager",
                              "warehouse_staff",
                              "accountant_staff",
                              "admin",
                            ]}
                          >
                            <GINList />
                          </ProtectedRoute>
                        }
                      />

                      {/* Debt list */}
                      <Route
                        path="/debt"
                        element={
                          <ProtectedRoute
                            allowedRoles={[
                              "manager",
                              "accountant_staff",
                              "admin",
                            ]}
                          >
                            <DebtList />
                          </ProtectedRoute>
                        }
                      />

                      {/* Routes cho tất cả Staff */}
                      <Route
                        path="/product"
                        element={
                          <ProtectedRoute
                            allowedRoles={[
                              "manager",
                              "sales_staff",
                              "purchases_staff",
                              "warehouse_staff",
                              "accountant_staff",
                              "admin",
                            ]}
                          >
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
                        path="/stocktaking"
                        element={
                          <ProtectedRoute
                            allowedRoles={[
                              "manager",
                              "warehouse_staff",
                              "accountant_staff",
                              "admin",
                            ]}
                          >
                            <Stocktaking />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/receipts"
                        element={<div>Nhập hàng - Đang phát triển</div>}
                      />
                      <Route
                        path="/export"
                        element={<div>Xuất hàng - Đang phát triển</div>}
                      />

                      {/* Routes cho Customer */}
                      <Route
                        path="/my-orders"
                        element={<div>Đơn hàng của tôi - Đang phát triển</div>}
                      />
                      <Route
                        path="/purchase-history"
                        element={<div>Lịch sử mua hàng - Đang phát triển</div>}
                      />

                      {/* Routes cho Manager/Staff */}
                      <Route
                        path="/category"
                        element={
                          <ProtectedRoute
                            allowedRoles={[
                              "manager",
                              "sales_staff",
                              "purchases_staff",
                              "warehouse_staff",
                              "accountant_staff",
                            ]}
                          >
                            <ListCategory />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/payment-remain"
                        element={<PaymentRemainList />}
                      />

                      <Route
                        path="/request-quotation"
                        element={
                          <ProtectedRoute
                            allowedRoles={["manager", "sales_staff"]}
                          >
                            <ListRSQ />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/request-quotation/create"
                        element={
                          <ProtectedRoute
                            allowedRoles={["manager", "sales_staff"]}
                          >
                            <CreateRSQ />
                          </ProtectedRoute>
                        }
                      />
                      {/* Sales Quotation routes - specific routes first */}
                      <Route
                        path="/sales-quotation/create/:id"
                        element={
                          <ProtectedRoute
                            allowedRoles={["manager", "sales_staff"]}
                          >
                            <CreateSalesQuotation />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/sales-quotation/details/:id"
                        element={
                          <ProtectedRoute
                            allowedRoles={["manager", "sales_staff"]}
                          >
                            <RequestQuotationDetails />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/sales/orders"
                        element={
                          <ProtectedRoute
                            allowedRoles={["manager", "sales_staff"]}
                          >
                            <SalesOrderList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/accountant/orders"
                        element={
                          <ProtectedRoute
                            allowedRoles={["manager", "accountant_staff"]}
                          >
                            <AccountantOrderList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/accountant/invoices"
                        element={
                          <ProtectedRoute
                            allowedRoles={["manager", "accountant_staff"]}
                          >
                            <InvoiceList />
                          </ProtectedRoute>
                        }
                      />
                      <Route 
                        path="/accountant/tax-policy" 
                        element={
                          <ProtectedRoute allowedRoles={['accountant_staff']}>
                            <AccountantTaxPolicy />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/sales-quotation" 
                        element={
                          <ProtectedRoute
                            allowedRoles={["manager", "sales_staff"]}
                          >
                            <SalesQuotationList />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/list-transaction" element={<div>Giao dịch - Đang phát triển</div>} />

                      {/* Removed legacy /admin/users route */}
                      <Route
                        path="/admin/users/customer"
                        element={
                          <ProtectedRoute allowedRoles={["manager", "admin"]}>
                            <ListAllUsers roleGroup="customer" />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/users/staff"
                        element={
                          <ProtectedRoute allowedRoles={["manager", "admin"]}>
                            <ListAllUsers roleGroup="staff" />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/users/manager"
                        element={
                          <ProtectedRoute allowedRoles={["manager", "admin"]}>
                            <ListAllUsers roleGroup="manager" />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/create-staff"
                        element={
                          <ProtectedRoute allowedRoles={["manager", "admin"]}>
                            <CreateStaff />
                          </ProtectedRoute>
                        }
                      />

                      {/* Routes cho Supplier Management */}
                      <Route
                        path="/supplier"
                        element={
                          <ProtectedRoute
                            allowedRoles={[
                              "manager",
                              "purchases_staff",
                              "admin",
                            ]}
                          >
                            <SupplierList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/manager/add-suppliers"
                        element={
                          <ProtectedRoute
                            allowedRoles={["manager", "purchases_staff"]}
                          >
                            <Navigate to="/supplier" replace />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/manager/manage-supplier-products"
                        element={
                          <ProtectedRoute allowedRoles={["manager", "admin"]}>
                            <ManageSupplierProducts />
                          </ProtectedRoute>
                        }
                      />

                      {/* Manager Customer Approval */}
                      <Route
                        path="/manager/customer-approval"
                        element={
                          <ProtectedRoute allowedRoles={["manager", "admin"]}>
                            <CustomerApprovalList />
                          </ProtectedRoute>
                        }
                      />

                      {/* Routes được bảo vệ - chỉ user đã đăng nhập mới truy cập được */}
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute
                            allowedRoles={[
                              "sales_staff",
                              "purchases_staff",
                              "warehouse_staff",
                              "accountant_staff",
                              "customer",
                              "manager",
                              "admin",
                            ]}
                          >
                            <ViewProfile />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/edit-profile"
                        element={
                          <ProtectedRoute
                            allowedRoles={[
                              "sales_staff",
                              "purchases_staff",
                              "warehouse_staff",
                              "accountant_staff",
                              "customer",
                              "manager",
                              "admin",
                            ]}
                          >
                            <EditProfile />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/change-password"
                        element={
                          <ProtectedRoute
                            allowedRoles={[
                              "sales_staff",
                              "purchases_staff",
                              "warehouse_staff",
                              "accountant_staff",
                              "customer",
                              "manager",
                              "admin",
                            ]}
                          >
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
              }
            />
          </Routes>
        </Router>
      </NotificationWrapper>
    </AuthProvider>
  );
}

export default App;
