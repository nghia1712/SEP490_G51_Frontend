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
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
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
import MenuIcon from "@mui/icons-material/Menu";

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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [profile, setProfile] = useState(null);
  const [customerStatus, setCustomerStatus] = useState(null);
  const [productMenuAnchor, setProductMenuAnchor] = useState(null);
  const [orderMenuAnchor, setOrderMenuAnchor] = useState(null);
  const [salesMenuAnchor, setSalesMenuAnchor] = useState(null);
  const [warehouseMenuAnchor, setWarehouseMenuAnchor] = useState(null);
  const [importMenuAnchor, setImportMenuAnchor] = useState(null);
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [supplierMenuAnchor, setSupplierMenuAnchor] = useState(null);
  const [customerMenuAnchor, setCustomerMenuAnchor] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileProductMenuOpen, setMobileProductMenuOpen] = useState(false);
  const [mobileOrderMenuOpen, setMobileOrderMenuOpen] = useState(false);
  const [mobileSalesMenuOpen, setMobileSalesMenuOpen] = useState(false);
  const [mobileWarehouseMenuOpen, setMobileWarehouseMenuOpen] = useState(false);
  const [mobileImportMenuOpen, setMobileImportMenuOpen] = useState(false);
  const [mobileExportMenuOpen, setMobileExportMenuOpen] = useState(false);
  const [mobileSupplierMenuOpen, setMobileSupplierMenuOpen] = useState(false);
  const [mobileCustomerMenuOpen, setMobileCustomerMenuOpen] = useState(false);

  const { getProfile } = useUser();

  useEffect(() => {
    if (currentToken) {
      getProfile()
        .then((response) => {
          // useUser.getProfile trả về { data: { data: {...} } }
          const profileData =
            response?.data?.data || response?.data || response;
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

    if (
      typeof avatarPath === "string" &&
      (avatarPath.startsWith("http://") || avatarPath.startsWith("https://"))
    ) {
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
    const normalized =
      typeof avatarPath === "string" && avatarPath.startsWith("/")
        ? avatarPath
        : `/${avatarPath || ""}`;
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
      label: "Tìm kiếm thuốc",
      path: "/search-medicines",
      allowedRoles: ["customer"],
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
      path: "/customer/payment-remain",
      allowedRoles: ["customer"],
    },
    {
      label: "Yêu cầu thanh toán",
      path: "/payment-remain",
      allowedRoles: ["accountant_staff"],
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
      label: "Quản lý nhập hàng",
      items: [
        { label: "Yêu cầu báo giá nhập", path: "/purchase/prfq" },
        { label: "Báo giá nhập", path: "/purchase/pq" },
        { label: "Đơn hàng nhập", path: "/po" },
      ],
    },
  };

  // Menu items cho SALES_STAFF với dropdown
  const salesStaffMenuItems = {
    overview: {
      label: "Tổng quan",
      path: "/sales-dashboard",
    },
    product: {
      label: "Thuốc",
      path: "/product",
    },
    salesManagement: {
      label: "Quản lý bán hàng",
      items: [
        { label: "Yêu cầu báo giá", path: "/request-quotation" },
        { label: "Báo giá", path: "/sales-quotation" },
        { label: "Đơn hàng", path: "/sales/orders" },
        { label: "Yêu cầu xuất kho", path: "/stock-export" },
      ],
    },
  };

  // Menu items cho WAREHOUSE_STAFF với dropdown
  const warehouseStaffMenuItems = {
    overview: {
      label: "Tổng quan",
      path: "/warehouse-dashboard",
    },
    warehouseManagement: {
      label: "Quản lý kho",
      items: [
        { label: "Kho hàng", path: "/warehouse" },
        { label: "Báo cáo kiểm kê", path: "/inventory-report" },
        {
          label: "Tra cứu sản phẩm",
          path: "/product-lot-lookup",
        },
      ],
    },
    importManagement: {
      label: "Nhập kho",
      items: [
        { label: "Đơn hàng nhập", path: "/po" },
        { label: "Phiếu nhập kho", path: "/grn" },
      ],
    },
    exportManagement: {
      label: "Xuất kho",
      items: [
        { label: "Yêu cầu xuất kho", path: "/stock-export" },
        { label: "Phiếu xuất kho", path: "/gin" },
      ],
    },
  };

  // Menu items cho ACCOUNTANT_STAFF với dropdown
  const accountantStaffMenuItems = {
    overview: {
      label: "Tổng quan",
      path: "/accountant-dashboard",
    },
    supplierManagement: {
      label: "Nhà cung cấp",
      items: [
        { label: "Đơn hàng nhập", path: "/po" },
        { label: "Thuế sản phẩm", path: "/accountant/tax-policy" },
        { label: "Công nợ nhà cung cấp", path: "/debt" },
      ],
    },
    customerManagement: {
      label: "Khách hàng",
      items: [
        { label: "Xác nhận thanh toán", path: "/accountant/deposit-checks" },
        { label: "Phiếu xuất kho", path: "/gin" },
        { label: "Hóa đơn", path: "/accountant/invoices" },
        { label: "Yêu cầu thanh toán", path: "/payment-remain" },
        { label: "Công nợ khách hàng", path: "/customer-debt" },
      ],
    },
  };

  const handleProductMenuOpen = (e) => setProductMenuAnchor(e.currentTarget);
  const handleProductMenuClose = () => setProductMenuAnchor(null);
  const handleOrderMenuOpen = (e) => setOrderMenuAnchor(e.currentTarget);
  const handleOrderMenuClose = () => setOrderMenuAnchor(null);
  const handleSalesMenuOpen = (e) => setSalesMenuAnchor(e.currentTarget);
  const handleSalesMenuClose = () => setSalesMenuAnchor(null);
  const handleWarehouseMenuOpen = (e) =>
    setWarehouseMenuAnchor(e.currentTarget);
  const handleWarehouseMenuClose = () => setWarehouseMenuAnchor(null);
  const handleImportMenuOpen = (e) => setImportMenuAnchor(e.currentTarget);
  const handleImportMenuClose = () => setImportMenuAnchor(null);
  const handleExportMenuOpen = (e) => setExportMenuAnchor(e.currentTarget);
  const handleExportMenuClose = () => setExportMenuAnchor(null);
  const handleSupplierMenuOpen = (e) => setSupplierMenuAnchor(e.currentTarget);
  const handleSupplierMenuClose = () => setSupplierMenuAnchor(null);
  const handleCustomerMenuOpen = (e) => setCustomerMenuAnchor(e.currentTarget);
  const handleCustomerMenuClose = () => setCustomerMenuAnchor(null);

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
    setMobileProductMenuOpen(false);
    setMobileOrderMenuOpen(false);
    setMobileSalesMenuOpen(false);
    setMobileWarehouseMenuOpen(false);
    setMobileImportMenuOpen(false);
    setMobileExportMenuOpen(false);
    setMobileSupplierMenuOpen(false);
    setMobileCustomerMenuOpen(false);
  };

  const handleMobileNavigate = (path) => {
    handleNavigate(path);
    handleMobileMenuClose();
  };

  return (
    <AppBar
      position="sticky"
      className="app-header-mui"
      sx={{
        top: 0,
        zIndex: 1100,
        backgroundColor:
          userRole === "customer" ? "#5A9B7F" : palette.medium,
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

          {/* Desktop Navigation */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 1,
              ml: 3,
            }}
          >
            {userRole === "purchases_staff" ? (
              <>
                {/* Tổng quan */}
                <Button
                  color="inherit"
                  onClick={() =>
                    handleNavigate(purchasesStaffMenuItems.overview.path)
                  }
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
                    purchasesStaffMenuItems.productManagement.items.some(
                      (item) => isActiveNavItem(item.path)
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
                      width: productMenuAnchor
                        ? `${productMenuAnchor.offsetWidth}px`
                        : "auto",
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
                  {purchasesStaffMenuItems.productManagement.items.map(
                    (item) => (
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
                    )
                  )}
                </Menu>

                {/* Quản lý nhập hàng - Dropdown */}
                <Button
                  color="inherit"
                  onClick={handleOrderMenuOpen}
                  endIcon={<ArrowDropDownIcon />}
                  sx={
                    purchasesStaffMenuItems.orderManagement.items.some((item) =>
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
                      width: orderMenuAnchor
                        ? `${orderMenuAnchor.offsetWidth}px`
                        : "auto",
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
            ) : userRole === "sales_staff" ? (
              <>
                {/* Tổng quan */}
                <Button
                  color="inherit"
                  onClick={() =>
                    handleNavigate(salesStaffMenuItems.overview.path)
                  }
                  sx={
                    isActiveNavItem(salesStaffMenuItems.overview.path)
                      ? activeNavStyle
                      : navButtonHoverStyle
                  }
                >
                  {salesStaffMenuItems.overview.label}
                </Button>

                {/* Thuốc */}
                <Button
                  color="inherit"
                  onClick={() =>
                    handleNavigate(salesStaffMenuItems.product.path)
                  }
                  sx={
                    isActiveNavItem(salesStaffMenuItems.product.path)
                      ? activeNavStyle
                      : navButtonHoverStyle
                  }
                >
                  {salesStaffMenuItems.product.label}
                </Button>

                {/* Quản lý bán hàng - Dropdown */}
                <Button
                  color="inherit"
                  onClick={handleSalesMenuOpen}
                  endIcon={<ArrowDropDownIcon />}
                  sx={
                    salesStaffMenuItems.salesManagement.items.some((item) =>
                      isActiveNavItem(item.path)
                    )
                      ? activeNavStyle
                      : navButtonHoverStyle
                  }
                >
                  {salesStaffMenuItems.salesManagement.label}
                </Button>
                <Menu
                  anchorEl={salesMenuAnchor}
                  open={Boolean(salesMenuAnchor)}
                  onClose={handleSalesMenuClose}
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
                      width: salesMenuAnchor
                        ? `${salesMenuAnchor.offsetWidth}px`
                        : "auto",
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
                  {salesStaffMenuItems.salesManagement.items.map((item) => (
                    <MenuItem
                      key={item.path}
                      onClick={() => {
                        handleNavigate(item.path);
                        handleSalesMenuClose();
                      }}
                      selected={isActiveNavItem(item.path)}
                    >
                      {item.label}
                    </MenuItem>
                  ))}
                </Menu>
              </>
            ) : userRole === "warehouse_staff" ? (
              <>
                {/* Tổng quan */}
                <Button
                  color="inherit"
                  onClick={() =>
                    handleNavigate(warehouseStaffMenuItems.overview.path)
                  }
                  sx={
                    isActiveNavItem(warehouseStaffMenuItems.overview.path)
                      ? activeNavStyle
                      : navButtonHoverStyle
                  }
                >
                  {warehouseStaffMenuItems.overview.label}
                </Button>

                {/* Quản lý kho - Dropdown */}
                <Button
                  color="inherit"
                  onClick={handleWarehouseMenuOpen}
                  endIcon={<ArrowDropDownIcon />}
                  sx={{
                    ...(warehouseStaffMenuItems.warehouseManagement.items.some(
                      (item) =>
                        isActiveNavItem(item.path) &&
                        location.pathname !==
                          warehouseStaffMenuItems.overview.path
                    )
                      ? activeNavStyle
                      : navButtonHoverStyle),
                    minWidth: "150px",
                  }}
                >
                  {warehouseStaffMenuItems.warehouseManagement.label}
                </Button>
                <Menu
                  anchorEl={warehouseMenuAnchor}
                  open={Boolean(warehouseMenuAnchor)}
                  onClose={handleWarehouseMenuClose}
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
                      width: warehouseMenuAnchor
                        ? `${warehouseMenuAnchor.offsetWidth}px`
                        : "auto",
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
                  {warehouseStaffMenuItems.warehouseManagement.items.map(
                    (item) => (
                      <MenuItem
                        key={item.path}
                        onClick={() => {
                          handleNavigate(item.path);
                          handleWarehouseMenuClose();
                        }}
                        selected={isActiveNavItem(item.path)}
                      >
                        {item.label}
                      </MenuItem>
                    )
                  )}
                </Menu>

                {/* Nhập kho - Dropdown */}
                <Button
                  color="inherit"
                  onClick={handleImportMenuOpen}
                  endIcon={<ArrowDropDownIcon />}
                  sx={{
                    ...(warehouseStaffMenuItems.importManagement.items.some(
                      (item) => isActiveNavItem(item.path)
                    )
                      ? activeNavStyle
                      : navButtonHoverStyle),
                    minWidth: "150px",
                  }}
                >
                  {warehouseStaffMenuItems.importManagement.label}
                </Button>
                <Menu
                  anchorEl={importMenuAnchor}
                  open={Boolean(importMenuAnchor)}
                  onClose={handleImportMenuClose}
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
                      width: warehouseMenuAnchor
                        ? `${warehouseMenuAnchor.offsetWidth}px`
                        : importMenuAnchor
                        ? `${importMenuAnchor.offsetWidth}px`
                        : "auto",
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
                  {warehouseStaffMenuItems.importManagement.items.map(
                    (item) => (
                      <MenuItem
                        key={item.path}
                        onClick={() => {
                          handleNavigate(item.path);
                          handleImportMenuClose();
                        }}
                        selected={isActiveNavItem(item.path)}
                      >
                        {item.label}
                      </MenuItem>
                    )
                  )}
                </Menu>

                {/* Xuất kho - Dropdown */}
                <Button
                  color="inherit"
                  onClick={handleExportMenuOpen}
                  endIcon={<ArrowDropDownIcon />}
                  sx={{
                    ...(warehouseStaffMenuItems.exportManagement.items.some(
                      (item) => isActiveNavItem(item.path)
                    )
                      ? activeNavStyle
                      : navButtonHoverStyle),
                    minWidth: "150px",
                  }}
                >
                  {warehouseStaffMenuItems.exportManagement.label}
                </Button>
                <Menu
                  anchorEl={exportMenuAnchor}
                  open={Boolean(exportMenuAnchor)}
                  onClose={handleExportMenuClose}
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
                      width: warehouseMenuAnchor
                        ? `${warehouseMenuAnchor.offsetWidth}px`
                        : exportMenuAnchor
                        ? `${exportMenuAnchor.offsetWidth}px`
                        : "auto",
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
                  {warehouseStaffMenuItems.exportManagement.items.map(
                    (item) => (
                      <MenuItem
                        key={item.path}
                        onClick={() => {
                          handleNavigate(item.path);
                          handleExportMenuClose();
                        }}
                        selected={isActiveNavItem(item.path)}
                      >
                        {item.label}
                      </MenuItem>
                    )
                  )}
                </Menu>
              </>
            ) : userRole === "accountant_staff" ? (
              <>
                {/* Tổng quan */}
                <Button
                  color="inherit"
                  onClick={() =>
                    handleNavigate(accountantStaffMenuItems.overview.path)
                  }
                  sx={
                    isActiveNavItem(accountantStaffMenuItems.overview.path)
                      ? activeNavStyle
                      : navButtonHoverStyle
                  }
                >
                  {accountantStaffMenuItems.overview.label}
                </Button>

                {/* Nhà cung cấp - Dropdown */}
                <Button
                  color="inherit"
                  onClick={handleSupplierMenuOpen}
                  endIcon={<ArrowDropDownIcon />}
                  sx={{
                    ...(accountantStaffMenuItems.supplierManagement.items.some(
                      (item) => isActiveNavItem(item.path)
                    )
                      ? activeNavStyle
                      : navButtonHoverStyle),
                    width: "200px",
                  }}
                >
                  {accountantStaffMenuItems.supplierManagement.label}
                </Button>
                <Menu
                  anchorEl={supplierMenuAnchor}
                  open={Boolean(supplierMenuAnchor)}
                  onClose={handleSupplierMenuClose}
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
                      width: supplierMenuAnchor
                        ? `${supplierMenuAnchor.offsetWidth}px`
                        : "auto",
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
                  {accountantStaffMenuItems.supplierManagement.items.map(
                    (item) => (
                      <MenuItem
                        key={item.path}
                        onClick={() => {
                          handleNavigate(item.path);
                          handleSupplierMenuClose();
                        }}
                        selected={isActiveNavItem(item.path)}
                      >
                        {item.label}
                      </MenuItem>
                    )
                  )}
                </Menu>

                {/* Khách hàng - Dropdown */}
                <Button
                  color="inherit"
                  onClick={handleCustomerMenuOpen}
                  endIcon={<ArrowDropDownIcon />}
                  sx={{
                    ...(accountantStaffMenuItems.customerManagement.items.some(
                      (item) => isActiveNavItem(item.path)
                    )
                      ? activeNavStyle
                      : navButtonHoverStyle),
                    width: "200px",
                  }}
                >
                  {accountantStaffMenuItems.customerManagement.label}
                </Button>
                <Menu
                  anchorEl={customerMenuAnchor}
                  open={Boolean(customerMenuAnchor)}
                  onClose={handleCustomerMenuClose}
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
                      width: supplierMenuAnchor
                        ? `${supplierMenuAnchor.offsetWidth}px`
                        : customerMenuAnchor
                        ? `${customerMenuAnchor.offsetWidth}px`
                        : "auto",
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
                  {accountantStaffMenuItems.customerManagement.items.map(
                    (item) => (
                      <MenuItem
                        key={item.path}
                        onClick={() => {
                          handleNavigate(item.path);
                          handleCustomerMenuClose();
                        }}
                        selected={isActiveNavItem(item.path)}
                      >
                        {item.label}
                      </MenuItem>
                    )
                  )}
                </Menu>
              </>
            ) : userRole === "customer" ? (
              <>
                {/* Customer Navigation - Special Style */}
                {visibleNavItems.map((item) => (
                  <Button
                    key={item.path}
                    color="inherit"
                    onClick={() => handleNavigate(item.path)}
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      px: 2.5,
                      py: 1,
                      borderRadius: "8px",
                      ...(isActiveNavItem(item.path)
                        ? {
                            backgroundColor: "#1B6B6F",
                            color: palette.white,
                            "&:hover": {
                              backgroundColor: "#155E64",
                              color: palette.white,
                            },
                          }
                        : {
                            color: palette.white,
                            "&:hover": {
                              backgroundColor: palette.dark,
                              color: palette.white,
                            },
                          }),
                    }}
                  >
                    {item.label.toUpperCase()}
                  </Button>
                ))}
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

          {/* Right Section - Always Visible (Desktop & Mobile) */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* Hamburger Menu Button - Mobile Only */}
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                onClick={handleMobileMenuToggle}
                sx={{ padding: "4px" }}
              >
                <MenuIcon />
              </IconButton>
            )}

            {currentToken ? (
              <>
                <NotificationMenu />
                {userRole &&
                  (() => {
                    const roleInfo = getRoleInfo(userRole);
                    const IconComponent = roleInfo.IconComponent;
                    return (
                      <>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Tooltip
                            title={`${
                              profile?.fullName ||
                              profile?.FullName ||
                              "Tài khoản"
                            } - ${roleInfo.label}`}
                          >
                            {userRole === "customer" ? (
                              <Avatar
                                src={getAvatarUrl(
                                  profile?.avatar || profile?.Avatar
                                )}
                                alt={
                                  profile?.fullName ||
                                  profile?.FullName ||
                                  "Khách hàng"
                                }
                                onClick={() => navigate("/profile")}
                                onError={(e) => {
                                  console.log(
                                    "Failed to load avatar:",
                                    getAvatarUrl(
                                      profile?.avatar || profile?.Avatar
                                    )
                                  );
                                  e.target.src = "/images/avatar/image1.png";
                                }}
                                sx={{
                                  cursor: "pointer",
                                  width: { xs: 32, md: 40 },
                                  height: { xs: 32, md: 40 },
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
                                onClick={
                                  userRole !== "admin" && userRole !== "manager"
                                    ? () => navigate("/profile")
                                    : undefined
                                }
                                size={isMobile ? "small" : "medium"}
                                sx={{
                                  backgroundColor: roleInfo.bgColor,
                                  color: roleInfo.color,
                                  fontWeight: 600,
                                  cursor:
                                    userRole !== "admin" &&
                                    userRole !== "manager"
                                      ? "pointer"
                                      : "default",
                                  "& .MuiChip-icon": { color: roleInfo.color },
                                  fontSize: { xs: "0.7rem", md: "0.875rem" },
                                  height: { xs: 24, md: 32 },
                                  display: { xs: "none", md: "flex" }, // Ẩn badge trên mobile cho các role khác customer
                                }}
                              />
                            )}
                          </Tooltip>
                          <Tooltip title="Đăng xuất">
                            <IconButton
                              size={isMobile ? "small" : "medium"}
                              onClick={handleLogout}
                              sx={{
                                color: roleInfo.color,
                                backgroundColor: roleInfo.bgColor,
                                "&:hover": {
                                  backgroundColor: roleInfo.bgColor,
                                  opacity: 0.9,
                                },
                                padding: { xs: "4px", md: "8px" },
                              }}
                            >
                              <LogoutIcon
                                fontSize={isMobile ? "small" : "medium"}
                              />
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
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    backgroundColor: palette.dark,
                    "&:hover": { backgroundColor: "#104c50" },
                    fontSize: { xs: "0.75rem", md: "0.875rem" },
                    padding: { xs: "4px 8px", md: "6px 16px" },
                  }}
                  onClick={() => navigate("/login")}
                >
                  Đăng nhập
                </Button>
                <Button
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    ml: { xs: 1, md: 2 },
                    color: palette.white,
                    borderColor: palette.white,
                    fontSize: { xs: "0.75rem", md: "0.875rem" },
                    padding: { xs: "4px 8px", md: "6px 16px" },
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

      {/* Mobile Drawer Menu */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={handleMobileMenuClose}
        className="mobile-header-drawer"
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: 220,
            boxSizing: "border-box",
            backgroundColor: "#f5f5f5",
          },
        }}
      >
        <Box sx={{ width: 220, pt: 2 }}>
          {/* User Info Section */}
          {currentToken && profile && (
            <>
              <Box sx={{ px: 2, pb: 2, borderBottom: "1px solid #e0e0e0" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {(() => {
                    const roleInfo = getRoleInfo(userRole);
                    const IconComponent = roleInfo.IconComponent;
                    return userRole === "customer" ? (
                      <Avatar
                        src={getAvatarUrl(profile?.avatar || profile?.Avatar)}
                        alt={
                          profile?.fullName || profile?.FullName || "Khách hàng"
                        }
                        sx={{
                          width: 40,
                          height: 40,
                          border: `2px solid ${roleInfo.color}`,
                        }}
                      />
                    ) : (
                      <Chip
                        icon={<IconComponent />}
                        label={roleInfo.label}
                        size="small"
                        sx={{
                          backgroundColor: roleInfo.bgColor,
                          color: roleInfo.color,
                          fontWeight: 600,
                        }}
                      />
                    );
                  })()}
                </Box>
              </Box>
            </>
          )}

          {/* Navigation Items */}
          <List>
            {userRole === "purchases_staff" ? (
              <>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() =>
                      handleMobileNavigate(
                        purchasesStaffMenuItems.overview.path
                      )
                    }
                    selected={isActiveNavItem(
                      purchasesStaffMenuItems.overview.path
                    )}
                  >
                    <ListItemText
                      primary={purchasesStaffMenuItems.overview.label}
                    />
                  </ListItemButton>
                </ListItem>

                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() =>
                      setMobileProductMenuOpen(!mobileProductMenuOpen)
                    }
                  >
                    <ListItemText
                      primary={purchasesStaffMenuItems.productManagement.label}
                    />
                    <ArrowDropDownIcon
                      sx={{
                        transform: mobileProductMenuOpen
                          ? "rotate(180deg)"
                          : "none",
                      }}
                    />
                  </ListItemButton>
                </ListItem>
                {mobileProductMenuOpen && (
                  <List component="div" disablePadding>
                    {purchasesStaffMenuItems.productManagement.items.map(
                      (item) => (
                        <ListItem key={item.path} disablePadding>
                          <ListItemButton
                            sx={{ pl: 4 }}
                            onClick={() => handleMobileNavigate(item.path)}
                            selected={isActiveNavItem(item.path)}
                          >
                            <ListItemText primary={item.label} />
                          </ListItemButton>
                        </ListItem>
                      )
                    )}
                  </List>
                )}

                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => setMobileOrderMenuOpen(!mobileOrderMenuOpen)}
                  >
                    <ListItemText
                      primary={purchasesStaffMenuItems.orderManagement.label}
                    />
                    <ArrowDropDownIcon
                      sx={{
                        transform: mobileOrderMenuOpen
                          ? "rotate(180deg)"
                          : "none",
                      }}
                    />
                  </ListItemButton>
                </ListItem>
                {mobileOrderMenuOpen && (
                  <List component="div" disablePadding>
                    {purchasesStaffMenuItems.orderManagement.items.map(
                      (item) => (
                        <ListItem key={item.path} disablePadding>
                          <ListItemButton
                            sx={{ pl: 4 }}
                            onClick={() => handleMobileNavigate(item.path)}
                            selected={isActiveNavItem(item.path)}
                          >
                            <ListItemText primary={item.label} />
                          </ListItemButton>
                        </ListItem>
                      )
                    )}
                  </List>
                )}
              </>
            ) : userRole === "sales_staff" ? (
              <>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() =>
                      handleMobileNavigate(salesStaffMenuItems.overview.path)
                    }
                    selected={isActiveNavItem(
                      salesStaffMenuItems.overview.path
                    )}
                  >
                    <ListItemText
                      primary={salesStaffMenuItems.overview.label}
                    />
                  </ListItemButton>
                </ListItem>

                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() =>
                      handleMobileNavigate(salesStaffMenuItems.product.path)
                    }
                    selected={isActiveNavItem(salesStaffMenuItems.product.path)}
                  >
                    <ListItemText primary={salesStaffMenuItems.product.label} />
                  </ListItemButton>
                </ListItem>

                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => setMobileSalesMenuOpen(!mobileSalesMenuOpen)}
                    selected={salesStaffMenuItems.salesManagement.items.some(
                      (item) => isActiveNavItem(item.path)
                    )}
                  >
                    <ListItemText
                      primary={salesStaffMenuItems.salesManagement.label}
                    />
                    <ArrowDropDownIcon
                      sx={{
                        transform: mobileSalesMenuOpen
                          ? "rotate(180deg)"
                          : "none",
                      }}
                    />
                  </ListItemButton>
                </ListItem>
                {mobileSalesMenuOpen && (
                  <List component="div" disablePadding>
                    {salesStaffMenuItems.salesManagement.items.map((item) => (
                      <ListItem key={item.path} disablePadding>
                        <ListItemButton
                          sx={{ pl: 4 }}
                          onClick={() => handleMobileNavigate(item.path)}
                          selected={isActiveNavItem(item.path)}
                        >
                          <ListItemText primary={item.label} />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                )}
              </>
            ) : userRole === "warehouse_staff" ? (
              <>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() =>
                      handleMobileNavigate(
                        warehouseStaffMenuItems.overview.path
                      )
                    }
                    selected={isActiveNavItem(
                      warehouseStaffMenuItems.overview.path
                    )}
                  >
                    <ListItemText
                      primary={warehouseStaffMenuItems.overview.label}
                    />
                  </ListItemButton>
                </ListItem>

                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() =>
                      setMobileWarehouseMenuOpen(!mobileWarehouseMenuOpen)
                    }
                    selected={warehouseStaffMenuItems.warehouseManagement.items.some(
                      (item) =>
                        isActiveNavItem(item.path) &&
                        location.pathname !==
                          warehouseStaffMenuItems.overview.path
                    )}
                  >
                    <ListItemText
                      primary={
                        warehouseStaffMenuItems.warehouseManagement.label
                      }
                    />
                    <ArrowDropDownIcon
                      sx={{
                        transform: mobileWarehouseMenuOpen
                          ? "rotate(180deg)"
                          : "none",
                      }}
                    />
                  </ListItemButton>
                </ListItem>
                {mobileWarehouseMenuOpen && (
                  <List component="div" disablePadding>
                    {warehouseStaffMenuItems.warehouseManagement.items.map(
                      (item) => (
                        <ListItem key={item.path} disablePadding>
                          <ListItemButton
                            sx={{ pl: 4 }}
                            onClick={() => handleMobileNavigate(item.path)}
                            selected={isActiveNavItem(item.path)}
                          >
                            <ListItemText primary={item.label} />
                          </ListItemButton>
                        </ListItem>
                      )
                    )}
                  </List>
                )}

                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() =>
                      setMobileImportMenuOpen(!mobileImportMenuOpen)
                    }
                    selected={warehouseStaffMenuItems.importManagement.items.some(
                      (item) => isActiveNavItem(item.path)
                    )}
                  >
                    <ListItemText
                      primary={warehouseStaffMenuItems.importManagement.label}
                    />
                    <ArrowDropDownIcon
                      sx={{
                        transform: mobileImportMenuOpen
                          ? "rotate(180deg)"
                          : "none",
                      }}
                    />
                  </ListItemButton>
                </ListItem>
                {mobileImportMenuOpen && (
                  <List component="div" disablePadding>
                    {warehouseStaffMenuItems.importManagement.items.map(
                      (item) => (
                        <ListItem key={item.path} disablePadding>
                          <ListItemButton
                            sx={{ pl: 4 }}
                            onClick={() => handleMobileNavigate(item.path)}
                            selected={isActiveNavItem(item.path)}
                          >
                            <ListItemText primary={item.label} />
                          </ListItemButton>
                        </ListItem>
                      )
                    )}
                  </List>
                )}

                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() =>
                      setMobileExportMenuOpen(!mobileExportMenuOpen)
                    }
                    selected={warehouseStaffMenuItems.exportManagement.items.some(
                      (item) => isActiveNavItem(item.path)
                    )}
                  >
                    <ListItemText
                      primary={warehouseStaffMenuItems.exportManagement.label}
                    />
                    <ArrowDropDownIcon
                      sx={{
                        transform: mobileExportMenuOpen
                          ? "rotate(180deg)"
                          : "none",
                      }}
                    />
                  </ListItemButton>
                </ListItem>
                {mobileExportMenuOpen && (
                  <List component="div" disablePadding>
                    {warehouseStaffMenuItems.exportManagement.items.map(
                      (item) => (
                        <ListItem key={item.path} disablePadding>
                          <ListItemButton
                            sx={{ pl: 4 }}
                            onClick={() => handleMobileNavigate(item.path)}
                            selected={isActiveNavItem(item.path)}
                          >
                            <ListItemText primary={item.label} />
                          </ListItemButton>
                        </ListItem>
                      )
                    )}
                  </List>
                )}
              </>
            ) : userRole === "accountant_staff" ? (
              <>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() =>
                      handleMobileNavigate(
                        accountantStaffMenuItems.overview.path
                      )
                    }
                    selected={isActiveNavItem(
                      accountantStaffMenuItems.overview.path
                    )}
                  >
                    <ListItemText
                      primary={accountantStaffMenuItems.overview.label}
                    />
                  </ListItemButton>
                </ListItem>

                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() =>
                      setMobileSupplierMenuOpen(!mobileSupplierMenuOpen)
                    }
                    selected={accountantStaffMenuItems.supplierManagement.items.some(
                      (item) => isActiveNavItem(item.path)
                    )}
                  >
                    <ListItemText
                      primary={
                        accountantStaffMenuItems.supplierManagement.label
                      }
                    />
                    <ArrowDropDownIcon
                      sx={{
                        transform: mobileSupplierMenuOpen
                          ? "rotate(180deg)"
                          : "none",
                      }}
                    />
                  </ListItemButton>
                </ListItem>
                {mobileSupplierMenuOpen && (
                  <List component="div" disablePadding>
                    {accountantStaffMenuItems.supplierManagement.items.map(
                      (item) => (
                        <ListItem key={item.path} disablePadding>
                          <ListItemButton
                            sx={{ pl: 4 }}
                            onClick={() => handleMobileNavigate(item.path)}
                            selected={isActiveNavItem(item.path)}
                          >
                            <ListItemText primary={item.label} />
                          </ListItemButton>
                        </ListItem>
                      )
                    )}
                  </List>
                )}

                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() =>
                      setMobileCustomerMenuOpen(!mobileCustomerMenuOpen)
                    }
                    selected={accountantStaffMenuItems.customerManagement.items.some(
                      (item) => isActiveNavItem(item.path)
                    )}
                  >
                    <ListItemText
                      primary={
                        accountantStaffMenuItems.customerManagement.label
                      }
                    />
                    <ArrowDropDownIcon
                      sx={{
                        transform: mobileCustomerMenuOpen
                          ? "rotate(180deg)"
                          : "none",
                      }}
                    />
                  </ListItemButton>
                </ListItem>
                {mobileCustomerMenuOpen && (
                  <List component="div" disablePadding>
                    {accountantStaffMenuItems.customerManagement.items.map(
                      (item) => (
                        <ListItem key={item.path} disablePadding>
                          <ListItemButton
                            sx={{ pl: 4 }}
                            onClick={() => handleMobileNavigate(item.path)}
                            selected={isActiveNavItem(item.path)}
                          >
                            <ListItemText primary={item.label} />
                          </ListItemButton>
                        </ListItem>
                      )
                    )}
                  </List>
                )}
              </>
            ) : userRole === "customer" ? (
              <>
                {visibleNavItems.map((item) => (
                  <ListItem key={item.path} disablePadding>
                    <ListItemButton
                      onClick={() => handleMobileNavigate(item.path)}
                      selected={isActiveNavItem(item.path)}
                    >
                      <ListItemText primary={item.label.toUpperCase()} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </>
            ) : (
              visibleNavItems.map((item) => (
                <ListItem key={item.path} disablePadding>
                  <ListItemButton
                    onClick={() => handleMobileNavigate(item.path)}
                    selected={isActiveNavItem(item.path)}
                  >
                    <ListItemText primary={item.label} />
                  </ListItemButton>
                </ListItem>
              ))
            )}
          </List>

          <Divider />

          {/* Actions Section - Only Profile Link (Logout is in header) */}
          {currentToken && userRole !== "admin" && userRole !== "manager" && (
            <List>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => handleMobileNavigate("/profile")}
                >
                  <ListItemText primary="Tài khoản" />
                </ListItemButton>
              </ListItem>
            </List>
          )}
        </Box>
      </Drawer>
    </AppBar>
  );
}

export default Header;
