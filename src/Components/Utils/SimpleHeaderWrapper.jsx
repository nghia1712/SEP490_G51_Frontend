import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Avatar, IconButton, Tooltip, Chip, Typography } from "@mui/material";
import {
  AppBar,
  Toolbar,
  Typography as MuiTypography,
  Button,
  Container,
} from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import InventoryIcon from "@mui/icons-material/Inventory";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import useUser from "../../Hooks/useUser";
import getUserRoleFromToken from "../../Utils/getUserRoleFromToken.jsx";
import ResetPassword from "../Login_Components/ResetPassword";
import ForgotPassword from "../Login_Components/ForgotPassword";
import Login from "../Login_Components/Login";
import Register from "../Login_Components/Register";
import ConfirmEmail from "../Login_Components/ConfirmEmail";
import Footer from "./Footer";
import NotificationMenu from "./NotificationMenu";

// Bảng màu của bạn
const palette = {
  dark: "#155E64",
  medium: "#5A9B7F",
  light: "#A0E4D0",
  white: "#FFFFFF",
  black: "#000000",
};

// Helper function để lấy thông tin role (màu sắc, label, icon component)
const getRoleInfo = (role) => {
  const roleMap = {
    admin: {
      label: "Admin",
      color: "#d32f2f", // Đỏ đậm
      bgColor: "#ffebee",
      IconComponent: AdminPanelSettingsIcon,
    },
    manager: {
      label: "Quản Lý",
      color: "#1976d2", // Xanh dương
      bgColor: "#e3f2fd",
      IconComponent: SupervisorAccountIcon,
    },
    sales_staff: {
      label: "Nhân viên Bán Hàng",
      color: "#388e3c", // Xanh lá
      bgColor: "#e8f5e9",
      IconComponent: ShoppingCartIcon,
    },
    purchases_staff: {
      label: "Nhân viên Mua Hàng",
      color: "#f57c00", // Cam
      bgColor: "#fff3e0",
      IconComponent: InventoryIcon,
    },
    warehouse_staff: {
      label: "Nhân viên Kho",
      color: "#7b1fa2", // Tím
      bgColor: "#f3e5f5",
      IconComponent: WarehouseIcon,
    },
    accountant_staff: {
      label: "Nhân viên Kế Toán",
      color: "#0288d1", // Xanh nhạt
      bgColor: "#e1f5fe",
      IconComponent: AccountBalanceIcon,
    },
    customer: {
      label: "Khách Hàng",
      color: "#616161", // Xám
      bgColor: "#f5f5f5",
      IconComponent: PersonIcon,
    },
  };

  return roleMap[role] || {
    label: role || "Unknown",
    color: "#757575",
    bgColor: "#f5f5f5",
    IconComponent: PersonIcon,
  };
};

// SimpleHeader component
const SimpleHeader = () => {
  const navigate = useNavigate();
  const currentToken = localStorage.getItem("authToken");
  const userRole = getUserRoleFromToken();
  const [profile, setProfile] = useState(null);
  const { getProfile } = useUser();

  useEffect(() => {
    if (currentToken) {
      getProfile()
        .then((response) => {
          // useUser.getProfile trả về { data: { data: {...} } }
          const profileData = response?.data?.data || response?.data || response;
          setProfile(profileData);
        })
        .catch((error) => {
          console.error("Error fetching profile:", error);
        });
    }
  }, [currentToken, getProfile]);

  const handleLogout = () => {
    // Lưu role trước khi xóa token
    const currentRole = userRole;
    localStorage.removeItem("authToken");
    setProfile(null);
    // Điều hướng theo role: customer về trang chủ, các role khác về login-staff
    const redirectPath = currentRole === "customer" ? "/" : "/login-staff";
    window.location.href = redirectPath;
  };

  // Helper để lấy avatar URL - giống với ViewProfile
  const getAvatarUrl = (avatarPath) => {
    console.log("SimpleHeader getAvatarUrl called with:", avatarPath);
    
    if (!avatarPath) {
      console.log("No avatar path, returning default");
      return "/images/avatar/image1.png";
    }
    
    if (typeof avatarPath === "string" && (avatarPath.startsWith("http://") || avatarPath.startsWith("https://"))) {
      console.log("Full URL detected:", avatarPath);
      return avatarPath;
    }
    
    if (typeof avatarPath === "string" && avatarPath.startsWith("/images/")) {
      console.log("Local images path detected:", avatarPath);
      const hasExtension = /\.(jpg|jpeg|png|gif|webp)$/i.test(avatarPath);
      if (hasExtension) {
        const fullUrl = `https://api.bbpharmacy.site${avatarPath}`;
        console.log("Generated avatar URL:", fullUrl);
        return fullUrl;
      } else {
        const fullUrl = `https://api.bbpharmacy.site${avatarPath}.jpg`;
        console.log("Using default extension .jpg:", fullUrl);
        return fullUrl;
      }
    }
    
    // Ảnh do backend trả về (đường dẫn tĩnh), bổ sung host
    const normalized = typeof avatarPath === "string" && avatarPath.startsWith("/") ? avatarPath : `/${avatarPath || ""}`;
    const fullUrl = `https://api.bbpharmacy.site${normalized}`;
    console.log("Normalized path:", fullUrl);
    return fullUrl;
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        top: 0,
        zIndex: 1100,
        backgroundColor: palette.medium,
        color: palette.white,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Logo */}
          <MuiTypography
            variant="h6"
            onClick={() => navigate("/")}
            sx={{
              fontWeight: "bold",
              cursor: "pointer",
              "&:hover": { opacity: 0.9 },
              flexGrow: 0,
              textAlign: "left",
            }}
          >
            Nhà thuốc số 17
          </MuiTypography>

          {/* Spacer to push buttons right */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Profile menu nếu đã đăng nhập, Login/Register nếu chưa */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {currentToken ? (
            <>
                {/* Notification bell */}
                <NotificationMenu />

                {/* Badge role + menu giống header chính, KHÔNG dùng avatar trắng */}
                {userRole && (() => {
                  const roleInfo = getRoleInfo(userRole);
                  const IconComponent = roleInfo.IconComponent;
                  return (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Tooltip
                title={`${profile?.fullName || profile?.FullName || "Tài khoản"} - ${roleInfo.label}`}
              >
                {userRole === "customer" ? (
                  <Avatar
                    src={getAvatarUrl(profile?.avatar || profile?.Avatar)}
                    alt={profile?.fullName || profile?.FullName || "Khách hàng"}
                    onClick={() => navigate("/profile")}
                    onError={(e) => {
                      console.log("Failed to load avatar:", getAvatarUrl(profile?.avatar || profile?.Avatar));
                      e.target.src = "/images/avatar/image1.png";
                    }}
                    sx={{
                      cursor: "pointer",
                      width: 40,
                      height: 40,
                      border: `2px solid ${roleInfo.color}`,
                      "&:hover": {
                        opacity: 0.8,
                      },
                    }}
                  />
                ) : (
                  <Chip
                    icon={<IconComponent />}
                    label={roleInfo.label}
                    onClick={userRole !== "admin" && userRole !== "manager" ? () => navigate("/profile") : undefined}
                    size="medium"
                    sx={{
                      backgroundColor: roleInfo.bgColor,
                      color: roleInfo.color,
                      fontWeight: 600,
                      cursor: userRole !== "admin" && userRole !== "manager" ? "pointer" : "default",
                      "& .MuiChip-icon": { color: roleInfo.color },
                    }}
                  />
                )}
              </Tooltip>
                      <Tooltip title="Đăng xuất">
                        <IconButton
                          size="small"
                          onClick={handleLogout}
                          sx={{
                            color: roleInfo.color,
                            backgroundColor: roleInfo.bgColor,
                            "&:hover": {
                              backgroundColor: roleInfo.bgColor,
                              opacity: 0.9,
                            },
                          }}
                        >
                          <LogoutIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  );
                })()}
              </>
            ) : (
              <Box sx={{ display: "flex" }}>
                <Button
                  variant="contained"
                  sx={{ 
                    backgroundColor: palette.dark, 
                    "&:hover": { backgroundColor: "#104c50" }, 
                    fontSize: { xs: "0.75rem", sm: "0.875rem" } 
                  }}
                  onClick={() => navigate("/login")}
                >
                  Đăng nhập
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/register")}
                  sx={{ 
                    ml: { xs: 1, sm: 2 }, 
                    color: palette.white, 
                    borderColor: palette.white, 
                    "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" }, 
                    fontSize: { xs: "0.75rem", sm: "0.875rem" } 
                  }}
                >
                  Đăng ký
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

// ResetPassword wrapper
export const ResetPasswordWithSimpleHeader = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <SimpleHeader />
    <Box component="main" sx={{ 
      flexGrow: 1, 
      backgroundImage: "url('/images/backgroundLogin.jpg')", 
      backgroundSize: 'cover', 
      backgroundRepeat: 'no-repeat', 
      backgroundPosition: 'center', 
      backgroundAttachment: 'fixed',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 0'
    }}>
      <ResetPassword />
    </Box>
    <Footer />
  </Box>
);

// ForgotPassword wrapper
export const ForgotPasswordWithSimpleHeader = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <SimpleHeader />
    <Box component="main" sx={{ 
      flexGrow: 1, 
      backgroundImage: "url('/images/backgroundLogin.jpg')", 
      backgroundSize: 'cover', 
      backgroundRepeat: 'no-repeat', 
      backgroundPosition: 'center', 
      backgroundAttachment: 'fixed',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 0'
    }}>
      <ForgotPassword />
    </Box>
    <Footer />
  </Box>
);

// Guest pages wrapper với SimpleHeader
export const GuestPageWithSimpleHeader = ({ children }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <SimpleHeader />
    <Box component="main" sx={{ 
      flexGrow: 1, 
      backgroundImage: "url('/images/backgroundMedical2.jpg')", 
      backgroundSize: 'cover', 
      backgroundRepeat: 'no-repeat', 
      backgroundPosition: 'center', 
      backgroundAttachment: 'fixed' 
    }}>
      {children}
    </Box>
    <Footer />
  </Box>
);

// Login wrapper với SimpleHeader
export const LoginWithSimpleHeader = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <SimpleHeader />
    <Box component="main" sx={{ 
      flexGrow: 1, 
      backgroundImage: "url('/images/backgroundLogin.jpg')", 
      backgroundSize: 'cover', 
      backgroundRepeat: 'no-repeat', 
      backgroundPosition: 'center', 
      backgroundAttachment: 'fixed',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 0'
    }}>
      <Login />
    </Box>
    <Footer />
  </Box>
);

// Login staff wrapper KHÔNG header/footer
export const StaffLoginBare = () => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      backgroundImage: "url('/images/backgroundLogin.jpg')",
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
    }}
  >
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 0",
      }}
    >
      <Login mode="staff" />
    </Box>
  </Box>
);

// Register wrapper với SimpleHeader
export const RegisterWithSimpleHeader = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <SimpleHeader />
    <Box component="main" sx={{ 
      flexGrow: 1, 
      backgroundImage: "url('/images/backgroundLogin.jpg')", 
      backgroundSize: 'cover', 
      backgroundRepeat: 'no-repeat', 
      backgroundPosition: 'center', 
      backgroundAttachment: 'fixed',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 0'
    }}>
      <Register />
    </Box>
    <Footer />
  </Box>
);

// ConfirmEmail wrapper với SimpleHeader
export const ConfirmEmailWithSimpleHeader = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <SimpleHeader />
    <Box component="main" sx={{ 
      flexGrow: 1, 
      backgroundImage: "url('/images/backgroundLogin.jpg')", 
      backgroundSize: 'cover', 
      backgroundRepeat: 'no-repeat', 
      backgroundPosition: 'center', 
      backgroundAttachment: 'fixed',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 0'
    }}>
      <ConfirmEmail />
    </Box>
    <Footer />
  </Box>
);

// Export SimpleHeader for potential future use
export { SimpleHeader };
