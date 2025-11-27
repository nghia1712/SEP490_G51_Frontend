import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// import { jwtDecode } from "jwt-decode";
import useUser from "../../Hooks/useUser";
import getUserRoleFromToken from "../../Utils/getUserRoleFromToken.jsx";
import NotificationMenu from "./NotificationMenu";
import userAPI from "../../API/userAPI";
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
  Chip,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import MenuIcon from "@mui/icons-material/Menu";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import InventoryIcon from "@mui/icons-material/Inventory";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PersonIcon from "@mui/icons-material/Person";

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

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentToken = localStorage.getItem("authToken");
  const userRole = getUserRole();
  // Cả guest và user đều có trang chủ là "/"
  const isHomePage = location.pathname === "/";
  // --- STATE MANAGEMENT ---
  const [profile, setProfile] = useState(null);
  const [customerStatus, setCustomerStatus] = useState(null);
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

  // Check customer status if user is customer
  useEffect(() => {
    if (currentToken && userRole === "customer") {
      userAPI.getCustomerStatus()
        .then((response) => {
          setCustomerStatus(response.data.data);
        })
        .catch((error) => {
          console.error("Error fetching customer status:", error);
        });
    }
  }, [currentToken, userRole]);

  // Ẩn navigation items cho customer khi chưa bổ sung thông tin hoặc ở route customer-unauthenticated
  const shouldHideCustomerNav = 
    location.pathname === "/customer-unauthenticated" ||
    (userRole === "customer" && customerStatus?.needsAdditionalInfo);

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
      return (
        location.pathname === "/sales" ||
        location.pathname.startsWith("/sales/")
      );
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


  // --- NAVIGATION ITEMS ---
  const navItems = [
    {
      label: "Tổng quan",
      path: "/sales-dashboard",
      allowedRoles: [
        "manager",
        "sales_staff"
      ],
    },
    {
      label: "Thống kê",
      path: "/dashboard",
      allowedRoles: ["manager", "admin"],
    },
    {
      label: "Thuốc",
      path: "/product",
      allowedRoles: [
        "sales_staff",
        "purchases_staff",
      ],
    },
    {
      label: "Danh mục",
      path: "/category",
      allowedRoles: ["purchases_staff"],
    },
    {
      label: "Nhà cung cấp",
      path: "/supplier",
      allowedRoles: ["purchases_staff"],
    },
    {
      label: "Yêu cầu báo giá nhập",
      path: "/purchase/prfq",
      allowedRoles: ["purchases_staff", "admin"],
    },
    {
      label: "Báo giá(PQ)",
      path: "/purchase/pq",
      allowedRoles: [ "purchases_staff"],
    },
    {
      label: "Đơn hàng nhập",
      path: "/po",
      allowedRoles: [
        "purchases_staff",
        "warehouse_staff",
        "accountant_staff",
      ],
    },
    {
      label: "Báo cáo kiểm kê",
      path: "/inventory-report",
      allowedRoles: [
        "warehouse_staff", "accountant_staff"
      ],
    },
    {
      label: "Kho hàng",
      path: "/warehouse",
      allowedRoles: ["warehouse_staff"],
    },
    {
      label: "Nhập kho",
      path: "/grn",
      allowedRoles: ["warehouse_staff"],
    },
    {
      label: "Yêu cầu xuất kho",
      path: "/stock-export",
      allowedRoles: ["warehouse_staff", "sales_staff"],
    },
    {
      label: "Xuất kho",
      path: "/gin",
      allowedRoles: ["warehouse_staff", "accountant_staff"],
    },
    {
      label: "Yêu cầu báo giá",
      path: "/request-quotation",
      allowedRoles: ["manager", "sales_staff"],
    },
    {
      label: "Báo giá",
      path: "/sales-quotation",
      allowedRoles: ["manager", "sales_staff"],
    },
    {
      label: "Đơn hàng (Sales)",
      path: "/sales/orders",
      allowedRoles: ["sales_staff"],
    },
    {
      label: "Đơn hàng (Kế toán)",
      path: "/accountant/orders",
      allowedRoles: ["accountant_staff", "manager"],
    },
    {
      label: "Thuế sản phẩm",
      path: "/accountant/tax-policy",
      allowedRoles: ["accountant_staff"],
    },
    {
      label: "Hóa đơn",
      path: "/accountant/invoices",
      allowedRoles: ["accountant_staff"],
    },
    {
      label: "Công nợ",
      path: "/debt",
      allowedRoles: ["accountant_staff"],
    },
    {
      label: "Yêu cầu thanh toán",
      path: "/payment-remain",
      allowedRoles: ["accountant_staff", "customer"],
    },
    {
      label: "Yêu cầu báo giá",
      path: "/customer/request-quotation",
      allowedRoles: ["customer"],
    },
    {
      label: "Đơn hàng",
      path: "/customer/orders",
      allowedRoles: ["customer"],
    },
    {
      label: "Hóa đơn",
      path: "/customer/invoices",
      allowedRoles: ["customer"],
    },
  ];

  const partnerMenuItems = [
    {
      label: "Quản lý Nhà cung cấp - Sản phẩm",
      path: "/manager/manage-supplier-products",
      allowedRoles: ["manager"],
    },
    {
      label: "Khách hàng",
      path: "/listcustomer",
      allowedRoles: ["sales_staff"],
    },
  ];

  // Đã bỏ menu "Giao dịch" cho tất cả role nên mảng này để trống
  const transactionMenuItems = [];

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

  const baseVisible = navItems.filter(
    (item) => {
      if (!userRole || !item.allowedRoles.includes(userRole)) {
        return false;
      }
      // Ẩn các navigation items cho customer khi chưa bổ sung thông tin
      if (shouldHideCustomerNav && item.allowedRoles.includes("customer")) {
        return false;
      }
      return true;
    }
  );
  const roleAccountItem = getRoleAccountItem(userRole);

  const visibleNavItems =
    userRole === "admin"
      ? adminNavItems
      : userRole === "manager"
      ? [adminNavItems[0]] // Manager chỉ thấy Tài khoản khách hàng
      : roleAccountItem
      ? [roleAccountItem, ...baseVisible]
      : baseVisible;

  const visiblePartnerItems =
    userRole === "admin"
      ? []
      : partnerMenuItems.filter(
          (item) => userRole && item.allowedRoles.includes(userRole)
        );

  const visibleTransactionItems =
    userRole === "admin"
      ? []
      : transactionMenuItems.filter(
          (item) => userRole && item.allowedRoles.includes(userRole)
        );

  // Items thực tế sẽ render trên header/drawer
  const navItemsForRender = visibleNavItems;
  const transactionItemsForRender = visibleTransactionItems;

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
              <ListItemButton
                sx={{ textAlign: "left" }}
                onClick={() => handleNavigate("/search-medicine")}
              >
                <ListItemText primary="Tìm kiếm thuốc" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                sx={{ textAlign: "left" }}
                onClick={() => handleNavigate("/medicine-categories")}
              >
                <ListItemText primary="Danh mục thuốc" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                sx={{ textAlign: "left" }}
                onClick={() => handleNavigate("/contact")}
              >
                <ListItemText primary="Liên hệ" />
              </ListItemButton>
            </ListItem>
          </>
        )}

        {/* Authenticated user navigation */}
        {/* Ẩn navigation khi customer chưa bổ sung thông tin */}
        {currentToken && !shouldHideCustomerNav && (
          <>
            {navItemsForRender.map((item) => (
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
            {transactionItemsForRender.length > 0 && <Divider>Giao dịch</Divider>}
            {transactionItemsForRender.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  sx={{ textAlign: "left" }}
                  onClick={() => handleNavigate(item.path)}
                >
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
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
              >
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
            {/* Ẩn navigation khi customer chưa bổ sung thông tin */}
            {!isMobile &&
              currentToken &&
              (userRole === "admin" || !isHomePage) &&
              !shouldHideCustomerNav && (
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, ml: 3 }}
                >
                  {visibleNavItems.map((item) => (
                    <Button
                      key={item.path}
                      color="inherit"
                      onClick={() => handleNavigate(item.path)}
                      sx={{
                                ...(isActiveNavItem(item.path)
                          ? activeNavStyle
                          : navButtonHoverStyle),
                      }}
                    >
                      {item.label}
                    </Button>
                  ))}

                  {visibleTransactionItems.length > 0 && (
                    <>
                      <Button
                        color="inherit"
                        onClick={handleTransactionMenuClick}
                        endIcon={<ArrowDropDownIcon />}
                        sx={navButtonHoverStyle}
                      >
                        Giao Dịch
                      </Button>
                      <Menu
                        anchorEl={transactionMenuAnchor}
                        open={Boolean(transactionMenuAnchor)}
                        onClose={handleTransactionMenuClose}
                      >
                        {visibleTransactionItems.map((item) => (
                          <MenuItem
                            key={item.path}
                            onClick={() => handleNavigate(item.path)}
                          >
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
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, ml: 3 }}
              >
                <Button
                  color="inherit"
                  onClick={() => navigate("/search-medicine")}
                  sx={navButtonHoverStyle}
                >
                  Tìm kiếm thuốc
                </Button>
                <Button
                  color="inherit"
                  onClick={() => navigate("/medicine-categories")}
                  sx={navButtonHoverStyle}
                >
                  Danh mục thuốc
                </Button>
                <Button
                  color="inherit"
                  onClick={() => navigate("/contact")}
                  sx={navButtonHoverStyle}
                >
                  Liên hệ
                </Button>
              </Box>
            )}

            {/* Spacer to push profile right */}
            {!isMobile && <Box sx={{ flexGrow: 1 }} />}

            {/* Profile/Login */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {currentToken ? (
                <>
                  <NotificationMenu />
                  {/* Role Badge với dropdown */}
                  {userRole && (() => {
                    const roleInfo = getRoleInfo(userRole);
                    const IconComponent = roleInfo.IconComponent;
                    return (
                      <>
                        <Tooltip title={`${profile?.fullName || "Tài khoản"} - ${roleInfo.label}`}>
                          <Chip
                            icon={<IconComponent />}
                            label={roleInfo.label}
                            onClick={handleProfileMenuOpen}
                            deleteIcon={<ArrowDropDownIcon />}
                            onDelete={handleProfileMenuOpen}
                            size="medium"
                            sx={{
                              backgroundColor: roleInfo.bgColor,
                              color: roleInfo.color,
                              fontWeight: 600,
                              fontSize: "0.8rem",
                              height: "30px",
                              paddingX: "5px",
                              border: `1px solid ${roleInfo.color}20`,
                              cursor: "pointer",
                              "& .MuiChip-icon": {
                                color: roleInfo.color,
                                fontSize: "20px",
                                marginLeft: "8px",
                              },
                              "& .MuiChip-label": {
                                paddingLeft: "8px",
                                paddingRight: "4px",
                              },
                              "& .MuiChip-deleteIcon": {
                                color: roleInfo.color,
                                fontSize: "22px",
                                marginRight: "4px",
                                "&:hover": {
                                  color: roleInfo.color,
                                },
                              },
                              "&:hover": {
                                backgroundColor: roleInfo.bgColor,
                                opacity: 0.9,
                              },
                            }}
                          />
                        </Tooltip>
                        <Menu
                          anchorEl={profileMenuAnchor}
                          open={Boolean(profileMenuAnchor)}
                          onClose={handleProfileMenuClose}
                          anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "right",
                          }}
                          transformOrigin={{
                            vertical: "top",
                            horizontal: "right",
                          }}
                        >
                          {userRole !== "admin" && userRole !== "manager" && (
                            <MenuItem onClick={() => { handleProfileMenuClose(); navigate("/profile"); }}>
                              Tài khoản
                            </MenuItem>
                          )}
                          <MenuItem onClick={handleLogout}>Đăng xuất</MenuItem>
                        </Menu>
                      </>
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
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
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
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                      },
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
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

      {/* Drawer for mobile */}
      <nav>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: 240 },
          }}
        >
          {drawer}
        </Drawer>
      </nav>
    </>
  );
}

export default Header;