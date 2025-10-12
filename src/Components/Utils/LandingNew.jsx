import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../App";
import { jwtDecode } from "jwt-decode";

// Import role-specific dashboards
import SalesStaffDashboard from "./RoleDashboards/SalesStaffDashboard";
import PurchasesStaffDashboard from "./RoleDashboards/PurchasesStaffDashboard";
import WarehouseStaffDashboard from "./RoleDashboards/WarehouseStaffDashboard";
import ManagerDashboard from "./RoleDashboards/ManagerDashboard";
import CustomerDashboard from "./RoleDashboards/CustomerDashboard";

// Import common components
import SearchBar from "./CommonComponents/SearchBar";
import FunctionGrid from "./CommonComponents/FunctionGrid";
import OdooAppButton from "./CommonComponents/OdooAppButton";

// Import configs
import { salesStaffFunctions } from "./RoleConfigs/salesStaffConfig.jsx";
import { purchasesStaffFunctions } from "./RoleConfigs/purchasesStaffConfig.jsx";
import { warehouseStaffFunctions } from "./RoleConfigs/warehouseStaffConfig.jsx";
import { managerFunctions } from "./RoleConfigs/managerConfig.jsx";
import { customerFunctions } from "./RoleConfigs/customerConfig.jsx";

// Utility functions
const safeLocalStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }
};

// Hàm helper để lấy vai trò người dùng
const getUserRole = () => {
  const token = safeLocalStorage.getItem("authToken");
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    if (token.startsWith('demo-token-')) {
      const userId = token.split('-')[2];
      if (userId === '1' || userId === '6') return 'sales_staff';
      if (userId === '3') return 'purchases_staff';
      if (userId === '5') return 'warehouse_staff';
      if (userId === '4') return 'manager';
      return 'customer';
    }
    if (decoded.roleId === 1) return 'sales_staff';
    if (decoded.roleId === 2) return 'purchases_staff';
    if (decoded.roleId === 3) return 'warehouse_staff';
    if (decoded.roleId === 4) return 'customer';
    if (decoded.roleId === 5) return 'manager';
    return 'customer';
  } catch (error) {
    console.error("Không thể giải mã token:", error);
    return null;
  }
};

const LandingNew = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [searchTerm, setSearchTerm] = useState("");
  
  const userRole = getUserRole();

  const handleNavigate = useCallback((path) => {
    navigate(path);
  }, [navigate]);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  // Memoized accessible functions
  const accessibleFunctions = useMemo(() => {
    const currentRole = userRole || getUserRole();
    
    let functions = [];
    switch (currentRole) {
      case 'sales_staff':
        functions = salesStaffFunctions;
        break;
      case 'purchases_staff':
        functions = purchasesStaffFunctions;
        break;
      case 'warehouse_staff':
        functions = warehouseStaffFunctions;
        break;
      case 'manager':
        functions = managerFunctions;
        break;
      case 'customer':
        functions = customerFunctions;
        break;
      default:
        functions = [];
    }
    
    return functions;
  }, [userRole]);

  // Render role-specific dashboard
  const renderRoleDashboard = () => {
    const currentRole = userRole || getUserRole();
    
    switch (currentRole) {
      case 'sales_staff':
        return <SalesStaffDashboard />;
      case 'purchases_staff':
        return <PurchasesStaffDashboard />;
      case 'warehouse_staff':
        return <WarehouseStaffDashboard />;
      case 'manager':
        return <ManagerDashboard />;
      case 'customer':
        return <CustomerDashboard />;
      default:
        return null;
    }
  };

  // Nếu có dashboard riêng cho role, render dashboard đó
  const roleDashboard = renderRoleDashboard();
  if (roleDashboard) {
    return roleDashboard;
  }

  // Fallback: render landing page chung
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #155E64 0%, #0D4F52 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1, py: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography
            variant="h3"
            sx={{
              color: "white",
              fontWeight: "bold",
              mb: 2,
              textShadow: "0 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            Hệ thống quản lý nhà thuốc
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "rgba(255,255,255,0.8)",
              fontWeight: "normal",
            }}
          >
            Chào mừng bạn đến với hệ thống quản lý nhà thuốc
          </Typography>
        </Box>

        {/* Search Bar */}
        <SearchBar
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Tìm kiếm chức năng..."
        />

        {/* Function Grid */}
        <FunctionGrid
          functions={accessibleFunctions}
          onNavigate={handleNavigate}
          searchTerm={searchTerm}
        />
      </Container>
    </Box>
  );
};

export default LandingNew;
