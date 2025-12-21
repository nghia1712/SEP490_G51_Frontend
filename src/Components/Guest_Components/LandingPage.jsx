import React from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Paper,
  Link as MuiLink,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  Search as SearchIcon,
  LocalHospital as LocalHospitalIcon,
  ShoppingCart as ShoppingCartIcon,
  Assignment as AssignmentIcon,
  Receipt as ReceiptIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationOnIcon,
  ArrowForward as ArrowForwardIcon,
  VerifiedUser as VerifiedUserIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import getUserRoleFromToken from "../../Utils/getUserRoleFromToken";

const palette = {
  dark: "#155E64",
  medium: "#5A9B7F",
  light: "#A0E4D0",
  white: "#FFFFFF",
  black: "#000000",
};

const LandingPage = () => {
  const navigate = useNavigate();
  const currentToken = localStorage.getItem("authToken");
  const userRole = currentToken ? getUserRoleFromToken() : null;
  const isCustomer = userRole === "customer";

  const features = [
    {
      icon: <SearchIcon sx={{ fontSize: 50 }} />,
      title: "Tìm kiếm thuốc",
      description: "Tra cứu thông tin thuốc nhanh chóng và chính xác",
      path: "/search-medicine",
      color: "#1976d2",
    },
    {
      icon: <ShoppingCartIcon sx={{ fontSize: 50 }} />,
      title: "Đặt hàng trực tuyến",
      description: "Yêu cầu báo giá và đặt hàng thuận tiện",
      path: isCustomer ? "/customer/request-quotation" : "/login",
      color: "#388e3c",
    },
    {
      icon: <AssignmentIcon sx={{ fontSize: 50 }} />,
      title: "Theo dõi đơn hàng",
      description: "Kiểm tra trạng thái đơn hàng của bạn mọi lúc",
      path: isCustomer ? "/customer/orders" : "/login",
      color: "#f57c00",
    },
    {
      icon: <ReceiptIcon sx={{ fontSize: 50 }} />,
      title: "Hóa đơn mua hàng",
      description: "Xem và tải xuống hóa đơn mua hàng dễ dàng",
      path: isCustomer ? "/customer/invoices" : "/login",
      color: "#7b1fa2",
    },
  ];

  const benefits = [
    {
      icon: <VerifiedUserIcon />,
      title: "Uy tín & Chất lượng",
      description: "Hoạt động theo tiêu chuẩn GPP, đảm bảo chất lượng dược phẩm",
    },
    {
      icon: <SpeedIcon />,
      title: "Dịch vụ nhanh chóng",
      description: "Xử lý đơn hàng và giao hàng nhanh chóng, tiện lợi",
    },
    {
      icon: <SecurityIcon />,
      title: "An toàn & Bảo mật",
      description: "Thông tin khách hàng được bảo mật tuyệt đối",
    },
  ];

  const handleFeatureClick = (path) => {
    if (path === "/login" && !currentToken) {
      navigate("/login");
    } else {
      navigate(path);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", position: "relative" }}>
      {/* Hero Section */}
      <Box
        sx={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          backgroundImage: "url('/images/backgroundMedical2.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(135deg, rgba(21, 94, 100, 0.85) 0%, rgba(90, 155, 127, 0.75) 100%)",
            zIndex: 1,
          },
          "&::after": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(160, 228, 208, 0.1) 0%, transparent 50%),
                              radial-gradient(circle at 80% 80%, rgba(160, 228, 208, 0.1) 0%, transparent 50%)`,
            zIndex: 1,
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 2, py: { xs: 6, md: 10 } }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
              >
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="h3"
                    component="h1"
                    gutterBottom
                    sx={{
                      fontWeight: 800,
                      color: palette.white,
                      mb: 1,
                      fontSize: { xs: "2rem", sm: "2.5rem", md: "3.5rem" },
                      lineHeight: 1.2,
                      textShadow: "0 4px 20px rgba(0,0,0,0.3)",
                      letterSpacing: "-0.02em",
                      fontFamily: 'monospace'
                    }}
                  >
                    Nhà Thuốc Dược Phẩm Số 17
                  </Typography>
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    color: palette.light,
                    mb: 5,
                    fontSize: { xs: "1rem", md: "1.25rem" },
                    lineHeight: 1.8,
                    fontWeight: 400,
                    textShadow: "0 2px 10px rgba(0,0,0,0.2)",
                    maxWidth: "90%",
                  }}
                >
                  Cung cấp dịch vụ chăm sóc sức khỏe tốt nhất cho cộng đồng
                </Typography>
                <Box sx={{ display: "flex", gap: 2.5, flexWrap: "wrap", mt: 4 }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<SearchIcon />}
                    onClick={() => navigate("/search-medicine")}
                    sx={{
                      backgroundColor: palette.medium,
                      color: palette.white,
                      px: { xs: 3, md: 5 },
                      py: { xs: 1.25, md: 1.75 },
                      fontSize: { xs: "0.95rem", md: "1.1rem" },
                      fontWeight: 600,
                      borderRadius: 3,
                      boxShadow: "0 8px 24px rgba(90, 155, 127, 0.4)",
                      textTransform: "none",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        backgroundColor: palette.dark,
                        transform: "translateY(-2px)",
                        boxShadow: "0 12px 32px rgba(90, 155, 127, 0.5)",
                      },
                    }}
                  >
                    Tìm kiếm thuốc
                  </Button>
                  {!currentToken && (
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => navigate("/register")}
                      sx={{
                        borderWidth: 2,
                        borderColor: palette.white,
                        color: palette.white,
                        px: { xs: 3, md: 5 },
                        py: { xs: 1.25, md: 1.75 },
                        fontSize: { xs: "0.95rem", md: "1.1rem" },
                        fontWeight: 600,
                        borderRadius: 3,
                        textTransform: "none",
                        backdropFilter: "blur(10px)",
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          borderColor: palette.light,
                          backgroundColor: "rgba(255, 255, 255, 0.2)",
                          transform: "translateY(-2px)",
                          boxShadow: "0 8px 24px rgba(255, 255, 255, 0.2)",
                        },
                      }}
                    >
                      Đăng ký ngay
                    </Button>
                  )}
                </Box>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 50 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              >
                <Box
                  sx={{
                    position: "relative",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  {/* First Image - Overlapping */}
                  <Box
                    component="img"
                    src="/images/about1.jpg"
                    alt="Nhà thuốc"
                    sx={{
                      width: { xs: "100%", sm: "55%", md: "52%" },
                      maxWidth: "380px",
                      borderRadius: 4,
                      boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
                      transform: "rotate(-3deg)",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "rotate(0deg) scale(1.05)",
                        zIndex: 3,
                      },
                      position: "relative",
                      zIndex: 2,
                    }}
                  />
                  {/* Second Image - Overlapping */}
                  <Box
                    component="img"
                    src="/images/about2.jpg"
                    alt="Nhà thuốc"
                    sx={{
                      width: { xs: "100%", sm: "55%", md: "52%" },
                      maxWidth: "380px",
                      borderRadius: 4,
                      boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
                      transform: "rotate(3deg)",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "rotate(0deg) scale(1.05)",
                        zIndex: 3,
                      },
                      position: "relative",
                      zIndex: 1,
                      mt: { xs: 2, md: 4 },
                    }}
                  />
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h3"
          component="h2"
          align="center"
          gutterBottom
          sx={{ fontWeight: 700, color: palette.dark, mb: 6 }}
        >
          Dịch vụ của chúng tôi
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  sx={{
                    height: "100%",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: "0 12px 24px rgba(0,0,0,0.15)",
                    },
                  }}
                  onClick={() => handleFeatureClick(feature.path)}
                >
                  <CardContent
                    sx={{
                      textAlign: "center",
                      p: 3,
                      "&:last-child": { pb: 3 },
                    }}
                  >
                    <Box
                      sx={{
                        color: feature.color,
                        mb: 2,
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ fontWeight: 600, color: palette.dark }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {feature.description}
                    </Typography>
                    <Button
                      size="small"
                      endIcon={<ArrowForwardIcon />}
                      sx={{ color: feature.color }}
                    >
                      Xem thêm
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Benefits Section */}
      <Box
        sx={{
          backgroundColor: palette.light,
          py: 8,
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h2"
            align="center"
            gutterBottom
            sx={{ fontWeight: 700, color: palette.dark, mb: 6 }}
          >
            Tại sao chọn chúng tôi?
          </Typography>
          <Grid container spacing={4}>
            {benefits.map((benefit, index) => (
              <Grid item xs={12} md={4} key={index} sx={{ display: "flex" }}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  style={{ width: "100%", display: "flex" }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      textAlign: "center",
                      backgroundColor: palette.white,
                      borderRadius: 3,
                      height: "100%",
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Box
                      sx={{
                        color: palette.dark,
                        mb: 2,
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      {React.cloneElement(benefit.icon, {
                        sx: { fontSize: 50 },
                      })}
                    </Box>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ fontWeight: 600, color: palette.dark }}
                    >
                      {benefit.title}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ flexGrow: 1 }}
                    >
                      {benefit.description}
                    </Typography>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* About Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography
              variant="h4"
              component="h2"
              gutterBottom
              sx={{ fontWeight: 700, color: palette.dark, mb: 3 }}
            >
              Về Nhà Thuốc Số 17
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Nhà Thuốc Dược Phẩm Số 17 là một trong những nhà thuốc uy tín tại
              Hải Phòng, hoạt động nhiều năm trong lĩnh vực dược phẩm. Chúng tôi
              cam kết cung cấp các sản phẩm chất lượng cao, an toàn và đáng tin
              cậy.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Nhà thuốc hoạt động theo tiêu chuẩn GPP (Good Pharmacy Practice),
              đảm bảo quản lý và phân phối dược phẩm đúng quy định.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/about-me")}
              sx={{
                backgroundColor: palette.medium,
                "&:hover": { backgroundColor: palette.dark },
              }}
            >
              Tìm hiểu thêm
            </Button>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box
              component="img"
              src="/images/about1.jpg"
              alt="Về nhà thuốc"
              sx={{
                width: "100%",
                borderRadius: 3,
                boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              }}
            />
          </Grid>
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          position: "relative",
          background: `linear-gradient(135deg, ${palette.dark} 0%, ${palette.medium} 100%)`,
          color: palette.white,
          py: { xs: 8, md: 10 },
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `radial-gradient(circle at 30% 50%, rgba(160, 228, 208, 0.15) 0%, transparent 50%),
                              radial-gradient(circle at 70% 50%, rgba(160, 228, 208, 0.15) 0%, transparent 50%)`,
            zIndex: 1,
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 2 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={8}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <Typography
                  variant="h3"
                  component="h2"
                  gutterBottom
                  sx={{
                    fontWeight: 700,
                    mb: 2,
                    fontSize: { xs: "1.75rem", md: "2.5rem" },
                    lineHeight: 1.2,
                  }}
                >
                  Sẵn sàng bắt đầu?
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: palette.light,
                    mb: 4,
                    fontSize: { xs: "1rem", md: "1.25rem" },
                    lineHeight: 1.6,
                    fontWeight: 400,
                    maxWidth: "90%",
                  }}
                >
                  Khám phá các dịch vụ của chúng tôi ngay hôm nay và trải nghiệm
                  dịch vụ chăm sóc sức khỏe chuyên nghiệp, tiện lợi.
                </Typography>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<SearchIcon />}
                    onClick={() => navigate("/search-medicine")}
                    sx={{
                      backgroundColor: palette.light,
                      color: palette.dark,
                      px: { xs: 4, md: 5 },
                      py: { xs: 1.5, md: 2 },
                      fontSize: { xs: "1rem", md: "1.1rem" },
                      fontWeight: 600,
                      borderRadius: 3,
                      boxShadow: "0 8px 24px rgba(160, 228, 208, 0.4)",
                      textTransform: "none",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        backgroundColor: palette.white,
                        transform: "translateY(-2px)",
                        boxShadow: "0 12px 32px rgba(160, 228, 208, 0.5)",
                      },
                    }}
                  >
                    Tìm kiếm thuốc ngay
                  </Button>
                  {!currentToken && (
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => navigate("/register")}
                      sx={{
                        borderWidth: 2,
                        borderColor: palette.light,
                        color: palette.light,
                        px: { xs: 4, md: 5 },
                        py: { xs: 1.5, md: 2 },
                        fontSize: { xs: "1rem", md: "1.1rem" },
                        fontWeight: 600,
                        borderRadius: 3,
                        textTransform: "none",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          borderColor: palette.white,
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                          transform: "translateY(-2px)",
                          boxShadow: "0 8px 24px rgba(255, 255, 255, 0.2)",
                        },
                      }}
                    >
                      Đăng ký tài khoản
                    </Button>
                  )}
                  {isCustomer && (
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => navigate("/customer/request-quotation")}
                      sx={{
                        borderWidth: 2,
                        borderColor: palette.light,
                        color: palette.light,
                        px: { xs: 4, md: 5 },
                        py: { xs: 1.5, md: 2 },
                        fontSize: { xs: "1rem", md: "1.1rem" },
                        fontWeight: 600,
                        borderRadius: 3,
                        textTransform: "none",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          borderColor: palette.white,
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                          transform: "translateY(-2px)",
                          boxShadow: "0 8px 24px rgba(255, 255, 255, 0.2)",
                        },
                      }}
                    >
                      Yêu cầu báo giá
                    </Button>
                  )}
                </Box>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(10px)",
                    borderRadius: 3,
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                  }}
                >
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: 600, mb: 3 }}
                  >
                    Thông tin nhanh
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                      <PhoneIcon sx={{ fontSize: 20, mt: 0.5, color: palette.light }} />
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                          Hotline
                        </Typography>
                        <MuiLink
                          href="tel:0398233047"
                          sx={{
                            color: palette.white,
                            textDecoration: "none",
                            fontWeight: 600,
                            "&:hover": { color: palette.light },
                          }}
                        >
                          0398 233 047
                        </MuiLink>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                      <LocationOnIcon sx={{ fontSize: 20, mt: 0.5, color: palette.light }} />
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                          Địa chỉ
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Kiot số 17, Phường Lê Thanh Nghị
                        </Typography>
                        <Typography variant="body2">TP Hải Phòng</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                      <LocalHospitalIcon sx={{ fontSize: 20, mt: 0.5, color: palette.light }} />
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                          Giờ làm việc
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          7:30 - 22:00
                        </Typography>
                        <Typography variant="body2">(Tất cả các ngày)</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;

