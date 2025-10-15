import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Container, Typography, Grid } from "@mui/material";
import { useAuthContext } from "../../../App";
import { jwtDecode } from "jwt-decode";

// Import configs
import { managerFunctions, managerQuickActions } from "../RoleConfigs/managerConfig.jsx";

// Import common components
import SearchBar from "../CommonComponents/SearchBar";
import FunctionGrid from "../CommonComponents/FunctionGrid";
import OdooAppButton from "../CommonComponents/OdooAppButton";

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

const ManagerDashboard = () => {
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
    
    if (currentRole !== 'manager') {
      return [];
    }
    
    return managerFunctions;
  }, [userRole]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 100%)",
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
            Dashboard Quản Lý
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "rgba(255,255,255,0.8)",
              fontWeight: "normal",
            }}
          >
            Quản lý toàn bộ hệ thống nhà thuốc
          </Typography>
        </Box>

        {/* Quick Actions */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h5"
            sx={{
              color: "white",
              mb: 3,
              textAlign: "center",
            }}
          >
            Hành động nhanh
          </Typography>
          <Grid container spacing={3} justifyContent="center">
            {managerQuickActions.map((action) => (
              <Grid item key={action.title} md={3}>
                <OdooAppButton
                  title={action.title}
                  icon={action.icon}
                  onClick={() => handleNavigate(action.path)}
                  isMain={true}
                />
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Search Bar */}
        <SearchBar
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Tìm kiếm chức năng quản lý..."
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

export default ManagerDashboard;
