import React from "react";
import { Box, Container, Typography, Link, IconButton, Tooltip } from "@mui/material";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import getUserRoleFromToken from "../../Utils/getUserRoleFromToken.jsx";
import { useLocation } from "react-router-dom";

const palette = {
  dark: "#155E64",
  medium: "#5A9B7F",
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
      className="app-footer-mui"
      sx={{
        backgroundColor: palette.medium,
        color: palette.white,
        pt: 3,
        pb: 1.5,
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: { xs: 3, md: 6 },
        }}
      >
        {/* Cột 1: Giới thiệu nhà thuốc */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              mb: 1,
              letterSpacing: 0.5,
            }}
          >
            VỀ NHÀ THUỐC
          </Typography>
          <Box
            sx={{
              width: 32,
              height: 2,
              backgroundColor: palette.accent,
              mb: 1.5,
            }}
          />
          <Typography
            variant="body2"
            sx={{
              fontSize: 12,
              opacity: 0.9,
              lineHeight: 1.6,
              mb: 1,
            }}
          >
            NHÀ THUỐC DƯỢC PHẨM SỐ 17 là một trong những nhà thuốc uy tín tại Hải
            Phòng, hoạt động nhiều năm trong lĩnh vực dược phẩm. Chúng tôi cam kết
            cung cấp các sản phẩm chất lượng cao, an toàn và đáng tin cậy, với đội
            ngũ dược sĩ giàu kinh nghiệm luôn tư vấn tận tâm và hỗ trợ khách hàng
            một cách chuyên nghiệp.
          </Typography>
          <Link
            href="/about-me"
            underline="hover"
            sx={{
              color: palette.white,
              fontSize: 12,
              display: "inline-block",
              "&:hover": { color: palette.accent },
            }}
          >
            ➤ Giới thiệu nhà thuốc
          </Link>
        </Box>

        {/* Cột 2: Thông tin & liên kết nhanh */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            pl: { md: 4 },
            borderLeft: {
              md: "1px solid rgba(255,255,255,0.15)",
            },
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              mb: 1,
              letterSpacing: 0.5,
            }}
          >
            THÔNG TIN
          </Typography>
          <Box
            sx={{
              width: 32,
              height: 2,
              backgroundColor: palette.accent,
              mb: 1.5,
            }}
          />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Typography variant="body2" sx={{ fontSize: 12 }}>
              Giờ làm việc: 7:30 - 22:00 (tất cả các ngày)
            </Typography>
            <Typography variant="body2" sx={{ fontSize: 12 }}>
              Địa chỉ: Kiot số 17, Phường Lê Thanh Nghị, TP Hải Phòng
            </Typography>
          </Box>
        </Box>

        {/* Cột 3: Liên hệ */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            pl: { md: 4 },
            borderLeft: {
              md: "1px solid rgba(255,255,255,0.15)",
            },
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              mb: 1,
              letterSpacing: 0.5,
            }}
          >
            LIÊN HỆ
          </Typography>
          <Box
            sx={{
              width: 32,
              height: 2,
              backgroundColor: palette.accent,
              mb: 1.5,
            }}
          />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            {/* Hotline */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 34,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <PhoneIcon sx={{ fontSize: 16 }} />
              </Box>
              <Typography variant="body2" sx={{ fontSize: 12 }}>
                Hotline: <strong>0398 233 047</strong>
              </Typography>
            </Box>

            {/* Zalo */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 34,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Tooltip title="Chat Zalo 0398233047">
                  <IconButton
                    size="small"
                    sx={{
                      p: 0.2,
                      color: palette.white,
                      backgroundColor: "rgba(0,0,0,0.08)",
                      "&:hover": {
                        backgroundColor: "rgba(0,0,0,0.18)",
                      },
                    }}
                    onClick={() => {
                      window.open(
                        "https://zalo.me/0398233047",
                        "_blank",
                        "noopener,noreferrer"
                      );
                    }}
                  >
                    <Box
                      component="img"
                      src="/images/icon-zalo.jpg"
                      alt="Zalo"
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        display: "block",
                      }}
                    />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography variant="body2" sx={{ fontSize: 12 }}>
                Zalo: 0398 233 047
              </Typography>
            </Box>

            {/* Email */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 34,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <EmailIcon sx={{ fontSize: 16 }} />
              </Box>
              <Typography variant="body2" sx={{ fontSize: 12 }}>
                Email:{" "}
                <Link
                  href="mailto:info@nhathuoc17.vn"
                  sx={{ color: palette.white }}
                >
                  info@nhathuoc17.vn
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Dòng bản quyền dưới cùng */}
      <Box sx={{ mt: 2 }}>
        <Container maxWidth="xl">
          <Typography
            variant="caption"
            sx={{
              opacity: 0.9,
              fontSize: 11,
              textAlign: "right",
              display: "block",
            }}
          >
            © {new Date().getFullYear()} Pharmacy Management System. All Rights
            Reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Footer;
