import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useUser from "../../Hooks/useUser";
import getUserRoleFromToken from "../../Utils/getUserRoleFromToken.jsx";
import NotificationMenu from "./NotificationMenu";
import userAPI from "../../API/userAPI";
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
  Chip,
  IconButton,
  Avatar,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import InventoryIcon from "@mui/icons-material/Inventory";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";

const palette = {
  dark: "#155E64",
  medium: "#5A9B7F",
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

const getUserRole = () => getUserRoleFromToken();

const getRoleInfo = (role) => {
  const roleMap = {
    admin: {
      label: "Admin",
      color: "#d32f2f",
      bgColor: "#ffebee",
      IconComponent: AdminPanelSettingsIcon,
    },
    manager: {
      label: "Quản Lý",
      color: "#1976d2",
      bgColor: "#e3f2fd",
      IconComponent: SupervisorAccountIcon,
    },
    sales_staff: {
      label: "Nhân viên Bán Hàng",
      color: "#388e3c",
      bgColor: "#e8f5e9",
      IconComponent: ShoppingCartIcon,
    },
    purchases_staff: {
      label: "Nhân viên Mua Hàng",
      color: "#f57c00",
      bgColor: "#fff3e0",
      IconComponent: InventoryIcon,
    },
    warehouse_staff: {
      label: "Nhân viên Kho",
      color: "#7b1fa2",
      bgColor: "#f3e5f5",
      IconComponent: WarehouseIcon,
    },
    accountant_staff: {
      label: "Nhân viên Kế Toán",
      color: "#0288d1",
      bgColor: "#e1f5fe",
      IconComponent: AccountBalanceIcon,
    },
    customer: {
      label: "Khách Hàng",
      color: "#616161",
      bgColor: "#f5f5f5",
      IconComponent: PersonIcon,
    },
  };
  return (
    roleMap[role] || {
      label: role || "Unknown",
      color: "#757575",
      bgColor: "#f5f5f5",
      IconComponent: PersonIcon,
    }
  );
};

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentToken = localStorage.getItem("authToken");
  const userRole = getUserRole() || "guest";

  const [profile, setProfile] = useState(null);
  const [customerStatus, setCustomerStatus] = useState(null);
  const [productMenuAnchor, setProductMenuAnchor] = useState(null);
  const [orderMenuAnchor, setOrderMenuAnchor] = useState(null);

  const { getProfile } = useUser();

  useEffect(() => {
    if (currentToken) {
      getProfile()
        .then((response) => {
          // useUser.getProfile trả về { data: { data: {...} } }
          const profileData = response?.data?.data || response?.data || response;
          setProfile(profileData);
        })
        .catch(console.error);
    }
  }, [currentToken, getProfile]);

  useEffect(() => {
    if (currentToken && userRole === "customer") {
      userAPI
        .getCustomerStatus()
        .then((res) => setCustomerStatus(res.data.data))
        .catch(console.error);
    }
  }, [currentToken, userRole]);

  // Helper để lấy avatar URL - giống với ViewProfile
  const getAvatarUrl = (avatarPath) => {
    console.log("Header getAvatarUrl called with:", avatarPath);
    
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

  const shouldHideCustomerNav =
    location.pathname === "/customer-unauthenticated" ||
    location.pathname.startsWith("/customer/additional-info") ||
    (userRole === "customer" &&
      customerStatus &&
      customerStatus.needsAdditionalInfo);

  const isActiveNavItem = (path) => location.pathname.startsWith(path);

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    // Lưu role trước khi xóa token
    const currentRole = getUserRole();
    localStorage.removeItem("authToken");
    setProfile(null);
    // Điều hướng theo role: customer về trang chủ, các role khác về login-staff
    const redirectPath = currentRole === "customer" ? "/" : "/login-staff";
    window.location.href = redirectPath;
  };

  const navItems = [
    {
      label: "Giới thiệu",
      path: "/about-me",
      allowedRoles: ["customer"],
    },
    {
      label: "Tổng quan",
      path: "/sales-dashboard",
      allowedRoles: ["sales_staff"],
    },
    {
      label: "Tổng quan",
      path: "/purchases-dashboard",
      allowedRoles: ["purchases_staff"],
    },
        {
      label: "Tổng quan",
      path: "/warehouse-dashboard",
      allowedRoles: ["warehouse_staff"],
    },
    // Nhóm trang quản lý tài khoản dành riêng cho ADMIN
    {
      label: "Tài khoản nhân viên",
      path: "/admin/users/staff",
      allowedRoles: ["admin"],
    },
    {
      label: "Tài khoản khách hàng",
      path: "/admin/users/customer",
      allowedRoles: ["admin", "manager"],
    },
    {
      label: "Tài khoản quản lý",
      path: "/admin/users/manager",
      allowedRoles: ["admin"],
    },
    {
      label: "Thuốc",
      path: "/product",
      allowedRoles: ["sales_staff", "purchases_staff"],
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
      allowedRoles: ["purchases_staff"],
    },
    {
      label: "Báo giá nhập",
      path: "/purchase/pq",
      allowedRoles: ["purchases_staff"],
    },
    {
      label: "Đơn hàng nhập",
      path: "/po",
      allowedRoles: ["purchases_staff", "warehouse_staff", "accountant_staff"],
    },
    {
      label: "Báo cáo kiểm kê",
      path: "/inventory-report",
      allowedRoles: ["warehouse_staff"],
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
      allowedRoles: ["sales_staff"],
    },
    {
      label: "Báo giá",
      path: "/sales-quotation",
      allowedRoles: ["sales_staff"],
    },
    {
      label: "Đơn hàng",
      path: "/sales/orders",
      allowedRoles: ["sales_staff"],
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
      label: "Công nợ nhà cung cấp",
      path: "/debt",
      allowedRoles: ["accountant_staff"],
    },
    {
      label: "Công nợ khách hàng",
      path: "/customer-debt",
      allowedRoles: ["accountant_staff"],
    },
    {
      label: "Thống kê",
      path: "/manager-dashboard",
      allowedRoles: ["manager"],
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
    {
      label: "Yêu cầu thanh toán",
      path: "/payment-remain",
      allowedRoles: ["accountant_staff", "customer"],
    },
  ];

  const visibleNavItems = navItems.filter(
    (item) => item.allowedRoles.includes(userRole) && !shouldHideCustomerNav
  );

  // Menu items cho PURCHASES_STAFF với dropdown
  const purchasesStaffMenuItems = {
    overview: {
      label: "Tổng quan",
      path: "/purchases-dashboard",
    },
    productManagement: {
      label: "Quản lý thuốc",
      items: [
        { label: "Thuốc", path: "/product" },
        { label: "Danh mục thuốc", path: "/category" },
        { label: "Nhà cung cấp", path: "/supplier" },
      ],
    },
    orderManagement: {
      label: "Quản lý đơn hàng nhập",
      items: [
        { label: "Yêu cầu báo giá nhập", path: "/purchase/prfq" },
        { label: "Báo giá nhập", path: "/purchase/pq" },
        { label: "Đơn hàng nhập", path: "/po" },
      ],
    },
  };

  const handleProductMenuOpen = (e) => setProductMenuAnchor(e.currentTarget);
  const handleProductMenuClose = () => setProductMenuAnchor(null);
  const handleOrderMenuOpen = (e) => setOrderMenuAnchor(e.currentTarget);
  const handleOrderMenuClose = () => setOrderMenuAnchor(null);

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
          <Typography
            variant="h6"
            onClick={() =>
              userRole === "admin" ? window.location.reload() : navigate("/")
            }
            sx={{ fontWeight: "bold", cursor: "pointer" }}
          >
            Nhà thuốc số 17
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 3 }}>
            {userRole === "purchases_staff" ? (
              <>
                {/* Tổng quan */}
                <Button
                  color="inherit"
                  onClick={() => handleNavigate(purchasesStaffMenuItems.overview.path)}
                  sx={
                    isActiveNavItem(purchasesStaffMenuItems.overview.path)
                      ? activeNavStyle
                      : navButtonHoverStyle
                  }
                >
                  {purchasesStaffMenuItems.overview.label}
                </Button>

                {/* Quản lý thuốc - Dropdown */}
                <Button
                  color="inherit"
                  onClick={handleProductMenuOpen}
                  endIcon={<ArrowDropDownIcon />}
                  sx={
                    purchasesStaffMenuItems.productManagement.items.some(item =>
                      isActiveNavItem(item.path)
                    )
                      ? activeNavStyle
                      : navButtonHoverStyle
                  }
                >
                  {purchasesStaffMenuItems.productManagement.label}
                </Button>
                <Menu
                  anchorEl={productMenuAnchor}
                  open={Boolean(productMenuAnchor)}
                  onClose={handleProductMenuClose}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "left",
                  }}
                  PaperProps={{
                    sx: {
                      minWidth: 180,
                      mt: 1,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                      borderRadius: 2,
                      "& .MuiMenuItem-root": {
                        px: 2.5,
                        py: 1.5,
                        fontSize: "0.95rem",
                        "&:hover": {
                          backgroundColor: "#f5f5f5",
                        },
                        "&.Mui-selected": {
                          backgroundColor: "#e3f2fd",
                          color: "#1976d2",
                          fontWeight: 500,
                          "&:hover": {
                            backgroundColor: "#e3f2fd",
                          },
                        },
                      },
                    },
                  }}
                >
                  {purchasesStaffMenuItems.productManagement.items.map((item) => (
                    <MenuItem
                      key={item.path}
                      onClick={() => {
                        handleNavigate(item.path);
                        handleProductMenuClose();
                      }}
                      selected={isActiveNavItem(item.path)}
                    >
                      {item.label}
                    </MenuItem>
                  ))}
                </Menu>

                {/* Quản lý đơn hàng nhập - Dropdown */}
                <Button
                  color="inherit"
                  onClick={handleOrderMenuOpen}
                  endIcon={<ArrowDropDownIcon />}
                  sx={
                    purchasesStaffMenuItems.orderManagement.items.some(item =>
                      isActiveNavItem(item.path)
                    )
                      ? activeNavStyle
                      : navButtonHoverStyle
                  }
                >
                  {purchasesStaffMenuItems.orderManagement.label}
                </Button>
                <Menu
                  anchorEl={orderMenuAnchor}
                  open={Boolean(orderMenuAnchor)}
                  onClose={handleOrderMenuClose}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "left",
                  }}
                  PaperProps={{
                    sx: {
                      width: orderMenuAnchor ? `${orderMenuAnchor.offsetWidth}px` : 'auto',
                      mt: 1,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                      borderRadius: 2,
                      "& .MuiMenuItem-root": {
                        px: 2.5,
                        py: 1.5,
                        fontSize: "0.95rem",
                        "&:hover": {
                          backgroundColor: "#f5f5f5",
                        },
                        "&.Mui-selected": {
                          backgroundColor: "#e3f2fd",
                          color: "#1976d2",
                          fontWeight: 500,
                          "&:hover": {
                            backgroundColor: "#e3f2fd",
                          },
                        },
                      },
                    },
                  }}
                >
                  {purchasesStaffMenuItems.orderManagement.items.map((item) => (
                    <MenuItem
                      key={item.path}
                      onClick={() => {
                        handleNavigate(item.path);
                        handleOrderMenuClose();
                      }}
                      selected={isActiveNavItem(item.path)}
                    >
                      {item.label}
                    </MenuItem>
                  ))}
                </Menu>
              </>
            ) : (
              visibleNavItems.map((item) => (
              <Button
                key={item.path}
                color="inherit"
                onClick={() => handleNavigate(item.path)}
                sx={
                  isActiveNavItem(item.path)
                    ? activeNavStyle
                    : navButtonHoverStyle
                }
              >
                {item.label}
              </Button>
              ))
            )}
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {currentToken ? (
              <>
                <NotificationMenu />
                {userRole &&
                  (() => {
                    const roleInfo = getRoleInfo(userRole);
                    const IconComponent = roleInfo.IconComponent;
                    return (
                      <>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Tooltip
                            title={`${profile?.fullName || profile?.FullName || "Tài khoản"} - ${roleInfo.label
                              }`}
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
                      </>
                    );
                  })()}
              </>
            ) : (
              <>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: palette.dark,
                    "&:hover": { backgroundColor: "#104c50" },
                  }}
                  onClick={() => navigate("/login")}
                >
                  Đăng nhập
                </Button>
                <Button
                  variant="outlined"
                  sx={{
                    ml: 2,
                    color: palette.white,
                    borderColor: palette.white,
                  }}
                  onClick={() => navigate("/register")}
                >
                  Đăng ký
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Header;
