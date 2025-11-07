import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../App";
import { jwtDecode } from "jwt-decode";
import getUserRoleFromToken from "../../Utils/getUserRoleFromToken.jsx";

// Utility functions để tối ưu performance
const safeLocalStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },
  
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
  
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }
};
import {
  Box,
  Container,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DashboardIcon from '@mui/icons-material/Dashboard';
// Removed profile chip dropdown on homepage

// Icons cho các chức năng
import Inventory2Icon from "@mui/icons-material/Inventory2";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import MoveToInboxIcon from "@mui/icons-material/MoveToInbox";
import OutputIcon from "@mui/icons-material/Output";
import PeopleIcon from "@mui/icons-material/People";
import HandshakeIcon from "@mui/icons-material/Handshake";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import CategoryIcon from "@mui/icons-material/Category";
import ViewListIcon from "@mui/icons-material/ViewList";
import GridViewIcon from "@mui/icons-material/GridView";
import BusinessIcon from "@mui/icons-material/Business";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
// import useUser from "../../Hooks/useUser"; // Đã xóa do lỗi phân giải

// --- HÀM HELPER ---


// --- DỮ LIỆU CHỨC NĂNG ---
const mainFunctions = [
  // Dashboard cho từng vai trò - đặt ở đầu để hiển thị trước
  {
    title: "Tổng quan",
    icon: <DashboardIcon />,
    path: "/purchases-dashboard",
    allowedRoles: ["purchases_staff", "manager"],
  },
  {
    title: "Tổng quan",
    icon: <DashboardIcon />,
    path: "/sales-dashboard",
    allowedRoles: ["sales_staff", "manager"],
  },
  {
    title: "Tổng quan",
    icon: <DashboardIcon />,
    path: "/warehouse-dashboard",
    allowedRoles: ["warehouse_staff", "accountant_staff", "manager"],
  },
  {
    title: "Tổng quan",
    icon: <DashboardIcon />,
    path: "/manager-dashboard",
    allowedRoles: ["accountant_staff", "manager"],
  },
  // Các chức năng chung
  {
    title: "Quản lý thuốc",
    icon: <Inventory2Icon />,
    path: "/product",
    allowedRoles: ["sales_staff", "purchases_staff", "warehouse_staff", "accountant_staff", "manager"],
  },
  {
    title: "Báo giá",
    icon: <RequestQuoteIcon />,
    path: "/request-quotation",
    allowedRoles: ["sales_staff", "manager"],
  },
  {
    title: "Danh mục thuốc",
    icon: <CategoryIcon />,
    path: "/category",
    allowedRoles: ["purchases_staff", "warehouse_staff", "accountant_staff"],
  },
  {
    title: "Nhà Cung Cấp",
    icon: <BusinessIcon />,
    path: "/supplier",
    allowedRoles: ["sales_staff", "purchases_staff", "warehouse_staff", "accountant_staff", "manager"],
  },
  {
    title: "Quản lý kho",
    icon: <WarehouseIcon />,
    path: "/warehouse",
    allowedRoles: ["warehouse_staff", "manager"],
  },
  {
    title: "Liên hệ",
    icon: <HandshakeIcon />,
    path: "/contact",
    allowedRoles: ["guest", "sales_staff", "purchases_staff", "warehouse_staff", "customer", "manager"],
  },
  {
    title: "Nhập hàng",
    icon: <MoveToInboxIcon />,
    path: "/receipts",
    allowedRoles: ["purchases_staff", "warehouse_staff", "manager"],
  },
  {
    title: "Xuất hàng",
    icon: <OutputIcon />,
    path: "/export",
    allowedRoles: ["sales_staff", "warehouse_staff", "manager"],
  },
  {
    title: "Kiểm kê",
    icon: <FactCheckIcon />,
    path: "/stocktaking",
    allowedRoles: ["warehouse_staff", "manager"],
  },
  
  // Chức năng cho Customer (cần đăng nhập)
  {
    title: "Đơn hàng của tôi",
    icon: <ViewListIcon />,
    path: "/my-orders",
    allowedRoles: ["customer"],
  },
  {
    title: "Lịch sử mua hàng",
    icon: <AnalyticsIcon />,
    path: "/purchase-history",
    allowedRoles: ["customer"],
  },
  // {
  //   title: "Kệ hàng",
  //   icon: <GridViewIcon />,
  //   path: "/inventory-check",
  //   allowedRoles: ["manager", "employee"],
  // },
  {
    title: "Giao dịch",
    icon: <ViewListIcon />,
    path: "/list-transaction",
    allowedRoles: ["manager"],
  },
];

// Chỉ hiển thị các tính năng đã có API BE kết nối để tránh lỗi UI
const enabledPaths = new Set([
  	"/product",
  	"/category",
	"/supplier",
	"/warehouse",
  	"/contact",
]);

// Hàm helper để lấy vai trò người dùng
const getUserRole = () => {
  const token = safeLocalStorage.getItem("authToken");
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    // Xử lý token từ mock data hoặc real token
    if (token.startsWith('demo-token-')) {
      const userId = token.split('-')[2];
      if (userId === '1' || userId === '6') return 'sales_staff';
      if (userId === '3') return 'purchases_staff';
      if (userId === '5') return 'warehouse_staff';
      if (userId === '4') return 'manager';
      return 'customer';
    }
    if (decoded.roleId === 0) return 'sales_staff';
    if (decoded.roleId === 1) return 'purchases_staff';
    if (decoded.roleId === 2) return 'warehouse_staff';
    if (decoded.roleId === 3) return 'accountant_staff';
    if (decoded.roleId === 4) return 'customer';
    if (decoded.roleId === 5) return 'manager';
    return 'customer';
  } catch (error) {
    console.error("Không thể giải mã token:", error);
    return null;
  }
};

// --- COMPONENT CON CHO NÚT APP KIỂU ODOO ---
const OdooAppButton = ({ title, icon, onClick, isMain = false }) => {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        cursor: "pointer",
        p: isMain ? 3 : 2,
        borderRadius: "12px",
        transition: "all 0.3s ease-in-out",
        border: isMain ? "2px solid rgba(255, 255, 255, 0.3)" : "none",
        backgroundColor: isMain ? "rgba(255, 255, 255, 0.1)" : "transparent",
        "&:hover": {
          backgroundColor: isMain ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 255, 255, 0.15)",
          transform: isMain ? "translateY(-5px) scale(1.05)" : "translateY(-3px)",
          border: isMain ? "2px solid rgba(255, 255, 255, 0.5)" : "none",
        },
      }}
    >
      <Box
        sx={{
          width: isMain ? 84 : 72,
          height: isMain ? 84 : 72,
          borderRadius: "16px",
          backgroundColor: isMain ? "#fff" : "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 1,
          boxShadow: isMain ? "0 6px 12px rgba(0,0,0,0.2)" : "0 4px 8px rgba(0,0,0,0.15)",
          color: isMain ? "#1976d2" : "#155E64",
          border: isMain ? "3px solid #1976d2" : "none",
        }}
      >
        {React.cloneElement(icon, { sx: { fontSize: isMain ? 48 : 40 } })}
      </Box>
      <Typography
        variant={isMain ? "body1" : "body2"}
        sx={{
          fontWeight: isMain ? "600" : "500",
          color: "#fff",
          width: isMain ? "120px" : "100px",
          whiteSpace: "normal",
          textAlign: "center",
          lineHeight: 1.2,
          textShadow: isMain ? "0 2px 4px rgba(0,0,0,0.3)" : "none",
        }}
      >
        {title}
      </Typography>
    </Box>
  );
};

function Landing() {
  const navigate = useNavigate();
  const { user, loading } = useAuthContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);

  // Xác định trạng thái đăng nhập: có user hoặc có token
  const isAuthenticated = useMemo(() => {
    return !!user || !!safeLocalStorage.getItem("authToken");
  }, [user]);


  // Lấy role từ user hoặc token - memoized để tránh re-render
  const userRole = useMemo(() => {
    if (user?.role?.name) {
      return user.role.name;
    }
    
    // Fallback: lấy role từ token
    try {
      return getUserRoleFromToken();
    } catch (error) {
      console.error("Error getting role from token:", error);
      return null;
    }
  }, [user]);

  // Handler cho search input - đơn giản hóa
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
  }, []);

  const handleProfileMenuOpen = useCallback((event) => {
    setProfileMenuAnchor(event.currentTarget);
  }, []);

  const handleProfileMenuClose = useCallback(() => {
    setProfileMenuAnchor(null);
  }, []);

  // Navigation đơn giản để tránh lỗi đơ
  const handleNavigate = useCallback((path) => {
    setProfileMenuAnchor(null); // Đóng menu trực tiếp
    navigate(path);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    handleProfileMenuClose();
    navigate("/login");
  };

  // Memoized accessible functions để tránh re-calculate không cần thiết
  const accessibleFunctions = useMemo(() => {
    // Xác định role hiện tại
    const currentRole = userRole || getUserRoleFromToken();
    
    // Logic đặc biệt cho từng role staff để có giao diện nhất quán
    let roleSpecificEnabledPaths = enabledPaths;
    
    if (currentRole === 'purchases_staff') {
      roleSpecificEnabledPaths = new Set(['/purchases-dashboard', '/product', '/category', '/supplier']);
    } else if (currentRole === 'sales_staff') {
      roleSpecificEnabledPaths = new Set(['/sales-dashboard', '/product', '/category', '/request-quotation']);
    } else if (currentRole === 'warehouse_staff') {
      roleSpecificEnabledPaths = new Set(['/warehouse-dashboard', '/warehouse']);
    } else if (currentRole === 'accountant_staff') {
      roleSpecificEnabledPaths = new Set(['/manager-dashboard', '/product', '/category']);
    } else if (currentRole === 'customer') {
      // Customer chỉ có thể truy cập các chức năng cơ bản khi đã được duyệt
      // Logic này sẽ được kiểm tra bởi CustomerStatusCheck component
      roleSpecificEnabledPaths = new Set(['/contact']);
    }

    const filtered = mainFunctions
      .filter((func) => {
        // Nếu user đã đăng nhập, kiểm tra role
        if (currentRole) {
          return func.allowedRoles.includes(currentRole);
        }
        // Nếu là guest, chỉ hiển thị chức năng public
        return func.allowedRoles.includes('guest');
      })
      // Ẩn các chức năng chưa có API BE
      .filter((func) => roleSpecificEnabledPaths.has(func.path))
      .filter((func) =>
        func.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    // Trả về danh sách đã lọc mà không sắp xếp đặc biệt
    return filtered;
  }, [userRole, searchTerm]);

  const avatarUrl = user?.profile?.avatar
    ? `http://localhost:9999${user.profile.avatar}`
    : "/images/avatar/image1.png";

  return (
    <Box
      id="landing-root"
      sx={{
        minHeight: "85vh",
        backgroundImage: "url('/images/backgroundMedical2.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        pt: 2,
        pb: 6,
        position: "relative",
        transition: "opacity 0.4s cubic-bezier(0.4,0,0.2,1)",
        opacity: 1,
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.45)",
          backdropFilter: "blur(1.5px)",
          pointerEvents: "none",
          zIndex: 0,
        },
      }}
    >
      <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1 }}>
        {/* Ẩn thẻ thông tin người dùng trên trang chủ để gọn gàng hơn */}

        {/* Hiển thị cho user chưa đăng nhập */}
        {!isAuthenticated && (
          <Box
            sx={{
              mb: 6,
              textAlign: "center",
              maxWidth: 900,
              mx: "auto",
              px: { xs: 2, sm: 3 },
              py: { xs: 2.5, sm: 3 },
            }}
          >
            <Typography
              variant="h4"
              component="h1"
              color="white"
              fontWeight="bold"
              sx={{
                textShadow: "0 2px 8px rgba(0,0,0,0.25)",
                letterSpacing: 0.4,
                lineHeight: 1.25,
                mb: 1.5,
                fontSize: { xs: "1.8rem", sm: "2.2rem", md: "2.6rem" },
              }}
            >
              Hệ Thống Quản Lý Nhà Thuốc
            </Typography>
      
            <Typography
              variant="h6"
              color="rgba(255,255,255,0.9)"
              sx={{
                mb: 2,
                fontWeight: 400,
                fontSize: { xs: "1rem", sm: "1.1rem" },
                textShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}
            >
              Khám phá thông tin thuốc và dịch vụ của chúng tôi
            </Typography>
            <Typography
              variant="body1"
              color="rgba(255,255,255,0.85)"
              sx={{
                mb: 0,
                fontSize: { xs: "0.925rem", sm: "1rem" },
                opacity: 0.95,
              }}
            >
              Hoặc sử dụng các chức năng bên dưới mà không cần đăng nhập
            </Typography>
          </Box>
        )}

        {/* Tiêu đề và ô tìm kiếm - chỉ hiển thị khi user đã đăng nhập */}
        {isAuthenticated && (
          <Box sx={{ mb: 5, textAlign: "center" }}>
            <Typography
              variant="h3"
              component="h1"
              color="white"
              fontWeight="bold"
              sx={{
                textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
                mb: 3,
              }}
            >
              {userRole === 'manager' ? 'Quản lý tài khoản khách hàng' : 'Hệ Thống Quản Lý Nhà Thuốc'}
            </Typography>

            {/* Thông tin vai trò */}
            {isAuthenticated && userRole && (
              <Typography
                variant="h2"
                component="h2"
                color="white"
                sx={{
                  mb: 3,
                  textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
                  fontSize: { xs: "1rem", sm: "1.5rem", md: "2rem" },
                }}
              >
                {userRole === 'purchases_staff' && 'Nhân Viên Mua Hàng'}
                {userRole === 'sales_staff' && 'Nhân Viên Bán Hàng'}
                {userRole === 'warehouse_staff' && 'Nhân Viên Kho'}
                {userRole === 'accountant_staff' && 'Nhân Viên Kế Toán'}
                {userRole === 'manager' && 'Quản Lý'}
                {userRole === 'customer' && 'Khách Hàng'}
                {userRole === 'admin' && 'Quản Trị Viên'}
                {/* Fallback: hiển thị role gốc nếu không match */}
                {!['purchases_staff', 'sales_staff', 'warehouse_staff', 'accountant_staff', 'manager', 'customer', 'admin'].includes(userRole) && userRole}
                {/* Debug: hiển thị role hiện tại */}
                {console.log('Current userRole:', userRole)}
                {console.log('isAuthenticated:', isAuthenticated)}
              </Typography>
            )}

          <TextField
            fullWidth
            variant="outlined"
            placeholder="Tìm kiếm chức năng..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "rgba(255,255,255,0.8)" }} />
                </InputAdornment>
              ),
              sx: {
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: "16px",
                color: "white",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.3)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.5)",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "white",
                },
                "& input::placeholder": {
                  color: "rgba(255,255,255,0.7)",
                  opacity: 1,
                },
                "& input": {
                  color: "white",
                },
              },
            }}
            sx={{
              maxWidth: "500px",
              mx: "auto",
              mb: 4,
            }}
          />
          </Box>
        )}


        {/* Lưới chức năng chung */}
        <Grid
          container
          spacing={3}
          justifyContent="center"
        >
          {accessibleFunctions
            .map((func) => (
              <Grid item key={func.title} md={2}>
                <OdooAppButton
                  title={func.title}
                  icon={func.icon}
                  onClick={() => handleNavigate(func.path)}
                  isMain={false}
                />
              </Grid>
            ))}
        </Grid>

        {/* Thông báo không tìm thấy chức năng */}
        {accessibleFunctions.length === 0 && (
          <Box sx={{ textAlign: "center", mt: 5 }}>
            <Typography variant="h5" color="white">
              Không tìm thấy chức năng phù hợp
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}

export default Landing;

