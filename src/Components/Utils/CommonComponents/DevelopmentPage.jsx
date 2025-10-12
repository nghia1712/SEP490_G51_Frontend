import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import {
  Construction,
  ArrowBack,
  Code,
  BugReport,
  Schedule,
} from "@mui/icons-material";

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

// Hàm lấy theme màu theo vai trò
const getRoleTheme = (role) => {
  const themes = {
    sales_staff: {
      primary: "#155E64",
      secondary: "#0D4F52",
      accent: "#4CAF50"
    },
    purchases_staff: {
      primary: "#1976d2",
      secondary: "#1565c0",
      accent: "#2196F3"
    },
    warehouse_staff: {
      primary: "#388e3c",
      secondary: "#2e7d32",
      accent: "#4CAF50"
    },
    manager: {
      primary: "#7b1fa2",
      secondary: "#6a1b9a",
      accent: "#9C27B0"
    },
    customer: {
      primary: "#ff6b35",
      secondary: "#f7931e",
      accent: "#FF9800"
    }
  };
  return themes[role] || themes.customer;
};

// Hàm lấy tên vai trò
const getRoleName = (role) => {
  const names = {
    sales_staff: "Nhân Viên Bán Hàng",
    purchases_staff: "Nhân Viên Mua Hàng",
    warehouse_staff: "Nhân Viên Kho",
    manager: "Quản Lý",
    customer: "Khách Hàng"
  };
  return names[role] || "Người Dùng";
};

const DevelopmentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userRole = getUserRole();
  const theme = getRoleTheme(userRole);
  const roleName = getRoleName(userRole);
  
  // Lấy tên chức năng từ URL params
  const functionName = searchParams.get('function') || "Chức năng này";

  const handleGoBack = () => {
    // Quay về landing page của role hiện tại
    navigate("/");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
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
            <Construction sx={{ fontSize: 48, mr: 2, verticalAlign: "middle" }} />
            Đang Phát Triển
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "rgba(255,255,255,0.8)",
              fontWeight: "normal",
            }}
          >
            {functionName} đang được phát triển
          </Typography>
        </Box>

        {/* Main Content */}
        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} md={8}>
            <Card
              sx={{
                backgroundColor: "rgba(255,255,255,0.95)",
                backdropFilter: "blur(10px)",
                borderRadius: "16px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ textAlign: "center", mb: 4 }}>
                  <Construction
                    sx={{
                      fontSize: 80,
                      color: theme.accent,
                      mb: 2,
                    }}
                  />
                  <Typography variant="h4" color="text.primary" gutterBottom>
                    Tính năng đang phát triển
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Chúng tôi đang nỗ lực phát triển tính năng <strong>{functionName}</strong> để mang đến trải nghiệm tốt nhất cho bạn.
                  </Typography>
                </Box>

                {/* Development Info */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: "center" }}>
                      <Code
                        sx={{
                          fontSize: 40,
                          color: theme.accent,
                          mb: 1,
                        }}
                      />
                      <Typography variant="h6" color="text.primary">
                        Đang Code
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tính năng đang được phát triển
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: "center" }}>
                      <BugReport
                        sx={{
                          fontSize: 40,
                          color: theme.accent,
                          mb: 1,
                        }}
                      />
                      <Typography variant="h6" color="text.primary">
                        Testing
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Đang kiểm tra và sửa lỗi
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: "center" }}>
                      <Schedule
                        sx={{
                          fontSize: 40,
                          color: theme.accent,
                          mb: 1,
                        }}
                      />
                      <Typography variant="h6" color="text.primary">
                        Sắp Ra Mắt
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Dự kiến ra mắt sớm
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Action Buttons */}
                <Box sx={{ textAlign: "center" }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<ArrowBack />}
                    onClick={handleGoBack}
                    sx={{
                      backgroundColor: theme.accent,
                      color: "white",
                      px: 4,
                      py: 1.5,
                      borderRadius: "12px",
                      fontSize: "1.1rem",
                      fontWeight: "bold",
                      "&:hover": {
                        backgroundColor: theme.secondary,
                        transform: "translateY(-2px)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                      },
                      transition: "all 0.3s ease-in-out",
                    }}
                  >
                    Quay Về Dashboard {roleName}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Footer */}
        <Box sx={{ textAlign: "center", mt: 6 }}>
          <Typography
            variant="body2"
            sx={{
              color: "rgba(255,255,255,0.7)",
            }}
          >
            Cảm ơn bạn đã kiên nhẫn chờ đợi. Chúng tôi sẽ thông báo khi tính năng sẵn sàng!
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default DevelopmentPage;
