import React from "react";
import { Box, Container, Typography, Link, IconButton } from "@mui/material";
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

  if (location.pathname === "/login") return null;
  if (location.pathname === "/register") return null;

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: palette.dark,
        color: palette.white,
        py: 0.3,
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Bên trái: tên, địa chỉ, hotline */}
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 12 }}>
            NHÀ THUỐC DƯỢC PHẨM SỐ 17
          </Typography>
          <Typography variant="caption" sx={{ fontSize: 12 }}>
            <strong>Địa chỉ:</strong> 165 Dư Hàng Kênh, Tp Hải Phòng
          </Typography>
          <Typography variant="caption" sx={{ fontSize: 12 }}>
            <strong>Hotline:</strong> 0398233047
          </Typography>
        </Box>

        {/* Bên phải: link Giới thiệu + copyright */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            height: "100%",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/about-me"
            underline="hover"
            sx={{
              color: palette.accent,
              fontWeight: 500,
              fontSize: 12,
              "&:hover": { color: "#ffffff" },
            }}
          >
            ➤ Giới thiệu
          </Link>

          <Typography
            variant="caption"
            sx={{ opacity: 0.8, fontSize: 10, mt: 1.5 }}
          >
            © {new Date().getFullYear()} Pharmacy Management System. All Rights
            Reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
