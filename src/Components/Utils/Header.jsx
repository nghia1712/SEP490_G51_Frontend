import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// import { jwtDecode } from "jwt-decode";
import useUser from "../../Hooks/useUser";
import getUserRoleFromToken from "../../Utils/getUserRoleFromToken.jsx";

// MUI Imports (thêm responsive & drawer)
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Menu,
  MenuItem,
  Avatar,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Badge,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import MenuIcon from "@mui/icons-material/Menu";


// Bảng màu của bạn
const palette = {
  dark: "#155E64",
  medium: "#75B39C",
  light: "#A0E4D0",
  white: "#FFFFFF",
  black: "#000000",
};

const navButtonHoverStyle = {
  "&:hover": {
    backgroundColor: palette.dark,
    color: palette.white,
  },
  letterSpacing: "0.08em",
};

// Active state for the current route
const activeNavStyle = {
  backgroundColor: "#1B6B6F",
  color: palette.white,
  fontWeight: 700,
  borderRadius: "8px",
  px: 2,
  "&:hover": {
    backgroundColor: "#155E64",
    color: palette.white,
  },
};

// Parser dành cho demo token dạng "demo-token-<id>"
const getUserRole = () => getUserRoleFromToken();

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentToken = localStorage.getItem("authToken");
  const userRole = getUserRole();
  // Cả guest và user đều có trang chủ là "/"
  const isHomePage = location.pathname === "/";
  
  // Ẩn header khi user có vai trò manager, trừ route /manager
  if (userRole === 'manager' && location.pathname !== '/manager') {
    return null;
  }
  // --- STATE MANAGEMENT ---
  const [profile, setProfile] = useState(null);
  const [transactionMenuAnchor, setTransactionMenuAnchor] = useState(null);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const [partnerMenuAnchor, setPartnerMenuAnchor] = useState(null);
  // Mobile drawer
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { getProfile } = useUser();
  useEffect(() => {
    if (currentToken) {
      getProfile().then((response) => {
        const data = response?.data || response;
        setProfile(data);
      }).catch((error) => {
        console.error("Error fetching profile:", error);
      });
    }
  }, [currentToken, getProfile]);

  // Function to check if nav item is active
  const isActiveNavItem = (path) => {
    // Special case for /sales-dashboard (Tổng quan) - không highlight
    if (path === "/sales-dashboard") {
      return false;
    }
    // Special case for /warehouse to avoid matching /warehouse-staff
    if (path === "/warehouse") {
      return location.pathname === "/warehouse";
    }
    // Special case for /sales to avoid matching /sales-staff
    if (path === "/sales") {
      return location.pathname === "/sales" || location.pathname.startsWith("/sales/");
    }
    // Special case for /customer/request-quotation to avoid matching /request-quotation
    if (path === "/customer/request-quotation") {
      return location.pathname === "/customer/request-quotation";
    }
    // For other paths, use startsWith logic
    return location.pathname.startsWith(path);
  };

  // --- HANDLERS ---
  const handleTransactionMenuClick = (event) =>
    setTransactionMenuAnchor(event.currentTarget);
  const handleTransactionMenuClose = () => setTransactionMenuAnchor(null);
  const handleProfileMenuOpen = (event) =>
    setProfileMenuAnchor(event.currentTarget);
  const handleProfileMenuClose = () => setProfileMenuAnchor(null);
  const handlePartnerMenuClick = (event) =>
    setPartnerMenuAnchor(event.currentTarget);
  const handlePartnerMenuClose = () => setPartnerMenuAnchor(null);
  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const handleNavigate = (path) => {
    navigate(path);
    handleTransactionMenuClose();
    handleProfileMenuClose();
    handlePartnerMenuClose();
    if (mobileOpen) handleDrawerToggle();
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setProfile(null);
    handleProfileMenuClose();
    navigate("/");
    // Force reload to render guest homepage immediately
    setTimeout(() => {
      window.location.replace("/");
    }, 0);
  };

  const avatarUrl = profile?.profile?.avatar
    ? `http://localhost:9999${profile.profile.avatar}`
    : "/images/avatar/default.png";

  // --- NAVIGATION ITEMS ---
  const navItems = [
    { label: "Tổng quan", path: "/sales-dashboard", allowedRoles: ["manager", "sales_staff", "purchases_staff", "warehouse_staff", "admin"] },
    { label: "Thống kê", path: "/dashboard", allowedRoles: ["manager", "admin"] },
    { label: "Thuốc", path: "/product", allowedRoles: ["manager", "sales_staff", "purchases_staff", "admin"] },
    { label: "Nhà cung cấp", path: "/supplier", allowedRoles: ["manager", "purchases_staff", "admin"] },
    { label: "Kiểm kê", path: "/stocktaking", allowedRoles: ["manager", "admin"] },
    { label: "Kệ hàng", path: "/inventory-check", allowedRoles: ["manager", "warehouse_staff", "admin"] },
    { label: "Kho hàng", path: "/warehouse", allowedRoles: ["manager", "warehouse_staff", "admin"] },
    { label: "Yêu cầu báo giá", path: "/request-quotation", allowedRoles: ["manager", "admin"] },
    { label: "Danh sách yêu cầu báo giá", path: "/request-quotation", allowedRoles: ["sales_staff"] },
    { label: "Danh sách báo giá", path: "/sales-quotation", allowedRoles: ["manager", "sales_staff", "admin"] },
    { label: "Danh sách đơn hàng", path: "/sales/orders", allowedRoles: ["sales_staff"] },
    { label: "Danh sách đơn hàng", path: "/accountant/orders", allowedRoles: ["accountant_staff", "manager"] },
    { label: "Yêu cầu báo giá", path: "/customer/request-quotation", allowedRoles: ["customer"] },
    { label: "Đơn hàng của tôi", path: "/customer/orders", allowedRoles: ["customer"] },
  ];

  const partnerMenuItems = [
    { label: "Quản lý Nhà cung cấp - Sản phẩm", path: "/manager/manage-supplier-products", allowedRoles: ["manager"] },
    { label: "Khách hàng", path: "/listcustomer", allowedRoles: ["manager", "sales_staff"] },
  ];

  const transactionMenuItems = [
    { label: "Xuất Kho", path: "/export", allowedRoles: ["manager"] },
    { label: "Danh Sách Giao Dịch", path: "/list-transaction", allowedRoles: ["manager"] },
  ];

  // Determine visible items based on role.
  // For admin: show three user account categories, hide partner/transaction menus.
  const adminNavItems = [
    { label: "Tài khoản khách hàng", path: "/admin/users/customer" },
    { label: "Tài khoản nhân viên", path: "/admin/users/staff" },
    { label: "Tài khoản quản lý", path: "/admin/users/manager" },
  ];
  // Role-specific single entry for non-admins
  const getRoleAccountItem = (role) => {
    // Chỉ admin mới thấy menu tài khoản
    if (role === "admin") return null; // Admin sẽ sử dụng adminNavItems
    return null; // Tất cả role khác không thấy menu tài khoản
  };

  const baseVisible = navItems.filter((item) => userRole && item.allowedRoles.includes(userRole));
  const roleAccountItem = getRoleAccountItem(userRole);

  const visibleNavItems =
    userRole === "admin"
      ? adminNavItems
      : roleAccountItem
        ? [roleAccountItem, ...baseVisible]
        : baseVisible;

  const visiblePartnerItems =
    userRole === "admin"
      ? []
      : partnerMenuItems.filter((item) => userRole && item.allowedRoles.includes(userRole));

  const visibleTransactionItems =
    userRole === "admin"
      ? []
      : transactionMenuItems.filter((item) => userRole && item.allowedRoles.includes(userRole));

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: "center" }}>
      <Typography variant="h6" sx={{ my: 2, color: palette.dark }}>
        Pharmacy
      </Typography>
      <Divider />
      <List>
        {/* Guest navigation */}
        {!currentToken && (
          <>
            <ListItem disablePadding>
              <ListItemButton sx={{ textAlign: "left" }} onClick={() => handleNavigate("/search-medicine")}>
                <ListItemText primary="Tìm kiếm thuốc" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton sx={{ textAlign: "left" }} onClick={() => handleNavigate("/medicine-categories")}>
                <ListItemText primary="Danh mục thuốc" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton sx={{ textAlign: "left" }} onClick={() => handleNavigate("/contact")}>
                <ListItemText primary="Liên hệ" />
              </ListItemButton>
            </ListItem>
          </>
        )}
        
        {/* Authenticated user navigation */}
        {currentToken && (
          <>
            {visibleNavItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  selected={isActiveNavItem(item.path)}
                  sx={{ textAlign: "left" }}
                  onClick={() => handleNavigate(item.path)}
                >
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
            {visibleTransactionItems.length > 0 && <Divider>Giao dịch</Divider>}
            {visibleTransactionItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton sx={{ textAlign: "left" }} onClick={() => handleNavigate(item.path)}>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </>
        )}
      </List>
    </Box>
  );

  return (
    <>
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
            {/* Mobile hamburger - admin luôn thấy menu kể cả ở trang chủ */}
            {isMobile && (userRole === "admin" || !isHomePage) && (
              <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={handleDrawerToggle}>
                <MenuIcon />
              </IconButton>
            )}

            {/* Logo */}
            <Typography
              variant="h6"
              onClick={() => {
                // Admin: refresh trang hiện tại thay vì chuyển hướng
                if (userRole === "admin") {
                  window.location.reload();
                } else {
                  navigate("/");
                }
              }}
              sx={{
                fontWeight: "bold",
                cursor: "pointer",
                "&:hover": { opacity: 0.9 },
                flexGrow: isMobile ? 1 : 0,
                textAlign: isMobile ? "center" : "left",
              }}
            >
              Pharmacy
            </Typography>

            {/* Desktop nav buttons - admin luôn thấy menu kể cả ở trang chủ */}
            {!isMobile && currentToken && (userRole === "admin" || !isHomePage) && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 3 }}>
                {visibleNavItems.map((item) => (
                  <Button
                    key={item.path}
                    color="inherit"
                    onClick={() => handleNavigate(item.path)}
                    sx={{ ...(isActiveNavItem(item.path) ? activeNavStyle : navButtonHoverStyle) }}
                  >
                    {item.label}
                  </Button>
                ))}

                {visibleTransactionItems.length > 0 && (
                  <>
                    <Button color="inherit" onClick={handleTransactionMenuClick} endIcon={<ArrowDropDownIcon />} sx={navButtonHoverStyle}>
                      Giao Dịch
                    </Button>
                    <Menu anchorEl={transactionMenuAnchor} open={Boolean(transactionMenuAnchor)} onClose={handleTransactionMenuClose}>
                      {visibleTransactionItems.map((item) => (
                        <MenuItem key={item.path} onClick={() => handleNavigate(item.path)}>
                          {item.label}
                        </MenuItem>
                      ))}
                    </Menu>
                  </>
                )}
              </Box>
            )}

            {/* Guest navigation - chỉ hiển thị khi chưa đăng nhập */}
            {!isMobile && !currentToken && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 3 }}>
                <Button color="inherit" onClick={() => navigate("/search-medicine")} sx={navButtonHoverStyle}>
                  Tìm kiếm thuốc
                </Button>
                <Button color="inherit" onClick={() => navigate("/medicine-categories")} sx={navButtonHoverStyle}>
                  Danh mục thuốc
                </Button>
                <Button color="inherit" onClick={() => navigate("/contact")} sx={navButtonHoverStyle}>
                  Liên hệ
                </Button>
              </Box>
            )}

            {/* Spacer to push profile right */}
            {!isMobile && <Box sx={{ flexGrow: 1 }} />}

            {/* Profile/Login */}
            <Box>
              {currentToken ? (
                <>
                  {userRole !== "admin" && (
                    <Tooltip title="Thông báo">
                      <IconButton color="inherit" aria-label="show notifications">
                        <Badge badgeContent={4} color="error">
                          <NotificationsIcon sx={{ color: isHomePage ? "action" : "inherit" }} />
                        </Badge>
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title={profile?.fullName || "Tài khoản"}>
                    <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0.5, borderRadius: "8px" }}>
                      <Avatar alt={profile?.fullName} src={avatarUrl} sx={{ width: 32, height: 32 }} />
                      <ArrowDropDownIcon sx={{ color: palette.white }} />
                    </IconButton>
                  </Tooltip>
                  <Menu
                    sx={{ mt: "45px" }}
                    anchorEl={profileMenuAnchor}
                    anchorOrigin={{ vertical: "top", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                    open={Boolean(profileMenuAnchor)}
                    onClose={handleProfileMenuClose}
                  >
                    {userRole !== "admin" && <MenuItem onClick={() => handleNavigate("/profile")}>Tài khoản</MenuItem>}
                    <MenuItem onClick={handleLogout}>Đăng xuất</MenuItem>
                  </Menu>
                </>
              ) : (
                <Box sx={{ display: "flex" }}>
                  <Button
                    variant="contained"
                    sx={{ backgroundColor: palette.dark, "&:hover": { backgroundColor: "#104c50" }, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                    onClick={() => navigate("/login")}
                  >
                    Đăng nhập
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate("/register")}
                    sx={{ ml: { xs: 1, sm: 2 }, color: palette.white, borderColor: palette.white, "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" }, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                  >
                    Đăng ký
                  </Button>
                </Box>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Drawer for mobile */}
      <nav>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { boxSizing: "border-box", width: 240 } }}
        >
          {drawer}
        </Drawer>
      </nav>
    </>
  );
}

export default Header;