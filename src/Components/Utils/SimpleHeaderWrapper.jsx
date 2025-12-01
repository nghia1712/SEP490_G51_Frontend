import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Avatar, IconButton, Tooltip, Menu, MenuItem, Chip, Typography, Divider } from "@mui/material";
import {
  AppBar,
  Toolbar,
  Typography as MuiTypography,
  Button,
  Container,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import InventoryIcon from "@mui/icons-material/Inventory";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PersonIcon from "@mui/icons-material/Person";
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
  medium: "#75B39C",
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
      label: "Bán Hàng",
      color: "#388e3c", // Xanh lá
      bgColor: "#e8f5e9",
      IconComponent: ShoppingCartIcon,
    },
    purchases_staff: {
      label: "Mua Hàng",
      color: "#f57c00", // Cam
      bgColor: "#fff3e0",
      IconComponent: InventoryIcon,
    },
    warehouse_staff: {
      label: "Kho",
      color: "#7b1fa2", // Tím
      bgColor: "#f3e5f5",
      IconComponent: WarehouseIcon,
    },
    accountant_staff: {
      label: "Kế Toán",
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
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const { getProfile } = useUser();

  useEffect(() => {
    if (currentToken) {
      getProfile()
        .then((response) => {
          const data = response?.data || response;
          setProfile(data);
        })
        .catch((error) => {
          console.error("Error fetching profile:", error);
        });
    }
  }, [currentToken, getProfile]);

  const handleProfileMenuOpen = (event) =>
    setProfileMenuAnchor(event.currentTarget);
  const handleProfileMenuClose = () => setProfileMenuAnchor(null);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setProfile(null);
    handleProfileMenuClose();
    navigate("/");
    setTimeout(() => {
      window.location.replace("/");
    }, 0);
  };

  const avatarUrl = profile?.profile?.avatar
    ? `http://localhost:9999${profile.profile.avatar}`
    : "/images/avatar/default.png";

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
            Pharmacy
          </MuiTypography>

          {/* Spacer to push buttons right */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Profile menu nếu đã đăng nhập, Login/Register nếu chưa */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {currentToken ? (
            <>
                {/* Notification bell */}
                <NotificationMenu />

                {/* Role Badge */}
                {userRole && (() => {
                  const roleInfo = getRoleInfo(userRole);
                  const IconComponent = roleInfo.IconComponent;
                  return (
                    <Chip
                      icon={<IconComponent />}
                      label={roleInfo.label}
                      size="small"
                      sx={{
                        backgroundColor: roleInfo.bgColor,
                        color: roleInfo.color,
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        height: "24px",
                        border: `1px solid ${roleInfo.color}20`,
                        "& .MuiChip-icon": {
                          color: roleInfo.color,
                          fontSize: "16px",
                        },
                      }}
                    />
                  );
                })()}
                <Tooltip title={`${profile?.fullName || "Tài khoản"} - ${getRoleInfo(userRole).label}`}>
                  <IconButton
                    onClick={handleProfileMenuOpen}
                    sx={{ p: 0.5, borderRadius: "8px" }}
                  >
                    <Avatar
                      alt={profile?.fullName}
                      src={avatarUrl}
                      sx={{ width: 32, height: 32 }}
                    />
                    <ArrowDropDownIcon sx={{ color: palette.white }} />
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={profileMenuAnchor}
                  open={Boolean(profileMenuAnchor)}
                  onClose={handleProfileMenuClose}
                >
                  {/* Hiển thị role trong menu */}
                  {(() => {
                    const roleInfo = getRoleInfo(userRole);
                    const IconComponent = roleInfo.IconComponent;
                    return (
                      <MenuItem disabled sx={{ opacity: 1, cursor: "default" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                          <IconComponent sx={{ fontSize: 16, color: roleInfo.color }} />
                          <Typography variant="body2" sx={{ fontWeight: 600, color: roleInfo.color }}>
                            {roleInfo.label}
                          </Typography>
                        </Box>
                      </MenuItem>
                    );
                  })()}
                  <Divider />
                  {userRole !== "admin" && userRole !== "manager" && (
                    <MenuItem onClick={() => navigate("/profile")}>
                      Tài khoản
                    </MenuItem>
                  )}
                  <MenuItem onClick={handleLogout}>Đăng xuất</MenuItem>
                </Menu>
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
