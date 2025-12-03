import React from "react";
import { Box, Container, Typography, Link, IconButton } from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import InstagramIcon from "@mui/icons-material/Instagram";
import getUserRoleFromToken from "../../Utils/getUserRoleFromToken.jsx";
import { useLocation } from "react-router-dom";

const palette = {
  dark: "#155E64",
  white: "#FFFFFF",
  accent: "#A0E4D0",
};

const Footer = () => {
  const userRole = getUserRoleFromToken();
  const location = useLocation();

  // Ẩn footer khi user có vai trò manager, trừ route /manager
  if (userRole === "manager" && location.pathname !== "/manager") {
    return null;
  }

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: palette.dark,
        color: palette.white,
        py: 6,
        mt: "auto",
      }}
    >
      <Container maxWidth="xl">
        {/* STORE INFO + ABOUT */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 2,
            mb: 4,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            NHÀ THUỐC DƯỢC PHẨM SỐ 17
          </Typography>
          <Typography variant="body2">
            <strong>Địa chỉ:</strong> 165 Dư Hàng Kênh, Tp Hải Phòng
          </Typography>
          <Typography variant="body2">
            <strong>Hotline:</strong> 0398233047
          </Typography>

          {/* ABOUT LINK */}
          <Link
            href="/about-me"
            underline="hover"
            sx={{
              color: palette.accent,
              fontWeight: 500,
              fontSize: 16,
              mt: 2,
              "&:hover": { color: "#ffffff" },
            }}
          >
            ➤ Giới thiệu
          </Link>
        </Box>

        {/* COPYRIGHT */}
        <Typography
          variant="body2"
          align="center"
          sx={{ opacity: 0.8, mt: 3 }}
        >
          © {new Date().getFullYear()} Pharmacy Management System. All Rights
          Reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
