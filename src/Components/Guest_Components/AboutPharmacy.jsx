// src/Pages/Guest/AboutPharmacy.jsx
import React from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Avatar,
  Link,
} from "@mui/material";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";

const palette = {
  dark: "#155E64",
  white: "#FFFFFF",
  accent: "#A0E4D0",
};

const AboutPharmacy = () => {
  const pharmacyInfo = {
    name: "NHÀ THUỐC DƯỢC PHẨM SỐ 17",
    address: "Kiot số 17, Phường Lê Thanh Nghị, TP Hải Phòng",
    hotline: "0398233047",
    email: "contact@bbpharmacy.com",
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundImage: "url('/images/backgroundMedical2.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.3)",
          zIndex: 1,
        },
      }}
    >
      <Container sx={{ py: 8, position: "relative", zIndex: 2 }}>
        <Paper
          sx={{
            p: { xs: 3, md: 6 },
            borderRadius: 4,
            backgroundColor: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(6px)",
            textAlign: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            textAlign: "left",
          }}
        >
          {/* Avatar */}
          <Avatar
            sx={{
              bgcolor: "primary.main",
              width: 100,
              height: 100,
              mx: "auto",
              mb: 3,
            }}
          >
            <LocalHospitalIcon sx={{ fontSize: 50 }} />
          </Avatar>

          {/* Tên nhà thuốc */}
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 700, textAlign: "center" }}
          >
            {pharmacyInfo.name}
          </Typography>

          {/* Giới thiệu chung */}
          <Typography
            variant="body1"
            sx={{ mb: 3, color: "text.secondary", lineHeight: 1.8 }}
          >
            {pharmacyInfo.name} là một trong những nhà thuốc uy tín tại Hải
            Phòng, hoạt động nhiều năm trong lĩnh vực dược phẩm. Chúng tôi cam
            kết cung cấp các sản phẩm chất lượng cao, an toàn và đáng tin cậy,
            với đội ngũ dược sĩ giàu kinh nghiệm luôn tư vấn tận tâm và hỗ trợ
            khách hàng một cách chuyên nghiệp.
          </Typography>

          {/* Ảnh minh họa */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Box
                component="img"
                src="/images/about1.jpg"
                alt="about1"
                sx={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 2,
                  boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box
                component="img"
                src="/images/about2.jpg"
                alt="about2"
                sx={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 2,
                  boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                }}
              />
            </Grid>
          </Grid>
          {/* Giới thiệu về chứng chỉ và tiêu chuẩn */}
          <Typography
            variant="body1"
            sx={{ mb: 3, color: "text.secondary", lineHeight: 1.8 }}
          >
            Nhà thuốc hoạt động theo tiêu chuẩn GPP (Good Pharmacy Practice),
            đảm bảo quản lý và phân phối dược phẩm đúng quy định. Chúng tôi tuân
            thủ nghiêm ngặt các quy định về an toàn thuốc, chất lượng dịch vụ và
            thường xuyên được cơ quan chức năng kiểm tra, đánh giá nhằm duy trì
            chất lượng cao nhất.
          </Typography>

          {/* Sứ mệnh & Tầm nhìn */}
          <Typography
            variant="body1"
            sx={{ mb: 3, color: "text.secondary", lineHeight: 1.8 }}
          >
            <strong>Sứ mệnh:</strong> Cung cấp dịch vụ chăm sóc sức khỏe tốt
            nhất cho cộng đồng, mang đến sản phẩm dược phẩm an toàn, uy tín và
            tư vấn chuyên nghiệp. <br />
            <strong>Tầm nhìn:</strong> Trở thành nhà thuốc hàng đầu về chất
            lượng, uy tín và sự hài lòng của khách hàng.
          </Typography>

          {/* Thông tin liên hệ */}
          <Grid container spacing={3} justifyContent="center" sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  justifyContent: "center",
                }}
              >
                <LocationOnIcon color="primary" />
                <Typography>{pharmacyInfo.address}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  justifyContent: "center",
                }}
              >
                <PhoneIcon color="primary" />
                <Typography>{pharmacyInfo.hotline}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  justifyContent: "center",
                }}
              >
                <EmailIcon color="primary" />
                <Typography>{pharmacyInfo.email}</Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Link xem thêm */}
          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Link
              href="/"
              underline="hover"
              sx={{
                color: "#1976D2",
                fontWeight: 500,
                fontSize: 16,
                "&:hover": { color: "#000" },
              }}
            >
              ➤ Trở thành khách hàng của chúng tôi
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default AboutPharmacy;
