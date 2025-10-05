import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../App";
import { jwtDecode } from "jwt-decode";

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
// import useUser from "../../Hooks/useUser"; // Đã xóa do lỗi phân giải

// --- HÀM HELPER ---


// --- DỮ LIỆU CHỨC NĂNG ---
const mainFunctions = [
  {
    title: "Quản lý thuốc",
    icon: <Inventory2Icon />,
    path: "/product",
    allowedRoles: ["staff"],
  },
  {
    title: "Danh mục thuốc",
    icon: <CategoryIcon />,
    path: "/medicine-categories",
    allowedRoles: ["guest", "staff", "customer"],
  },
  {
    title: "Thông tin thuốc",
    icon: <ViewListIcon />,
    path: "/medicine-info",
    allowedRoles: ["guest", "staff", "customer"],
  },
  {
    title: "Liên hệ",
    icon: <HandshakeIcon />,
    path: "/contact",
    allowedRoles: ["guest", "staff", "customer"],
  },
  {
    title: "Nhập hàng",
    icon: <MoveToInboxIcon />,
    path: "/receipts",
    allowedRoles: ["staff"],
  },
  {
    title: "Xuất hàng",
    icon: <OutputIcon />,
    path: "/export",
    allowedRoles: ["staff"],
  },
  {
    title: "Kiểm kê",
    icon: <FactCheckIcon />,
    path: "/stocktaking",
    allowedRoles: ["staff"],
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

// Hàm helper để lấy vai trò người dùng
const getUserRole = () => {
  const token = safeLocalStorage.getItem("authToken");
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    // Xử lý token từ mock data hoặc real token
    if (token.startsWith('demo-token-')) {
      const userId = token.split('-')[2];
      return userId === '1' || userId === '3' ? 'staff' : 'customer';
    }
    return decoded.roleId === 1 ? 'staff' : 'customer';
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


  // Lấy role từ user nếu có - memoized để tránh re-render
  const userRole = useMemo(() => {
    if (!user) return null;
    return user?.role?.name || null;
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
    console.log('Navigating to:', path);
    try {
      setProfileMenuAnchor(null); // Đóng menu trực tiếp
      navigate(path);
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback navigation
      window.location.href = path;
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    handleProfileMenuClose();
    navigate("/login");
  };

  // Memoized accessible functions để tránh re-calculate không cần thiết
  const accessibleFunctions = useMemo(() => {
    // Xác định role hiện tại
    const currentRole = userRole || getUserRole();
    
    const filtered = mainFunctions
      .filter((func) => {
        // Nếu user đã đăng nhập, kiểm tra role
        if (currentRole) {
          return func.allowedRoles.includes(currentRole);
        }
        // Nếu là guest, chỉ hiển thị chức năng public
        return func.allowedRoles.includes('guest');
      })
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
        minHeight: "100vh",
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
              Hệ thống quản lý nhà thuốc
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
              Hệ thống quản lý nhà thuốc
            </Typography>

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

