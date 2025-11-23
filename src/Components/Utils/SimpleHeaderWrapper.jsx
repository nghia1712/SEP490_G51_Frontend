import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Avatar, IconButton, Tooltip, Menu, MenuItem } from "@mui/material";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import useUser from "../../Hooks/useUser";
import ResetPassword from "../Login_Components/ResetPassword";
import ForgotPassword from "../Login_Components/ForgotPassword";
import Login from "../Login_Components/Login";
import Register from "../Login_Components/Register";
import ConfirmEmail from "../Login_Components/ConfirmEmail";
import Footer from "./Footer";

// Bảng màu của bạn
const palette = {
  dark: "#155E64",
  medium: "#75B39C",
  light: "#A0E4D0",
  white: "#FFFFFF",
  black: "#000000",
};

// SimpleHeader component
const SimpleHeader = () => {
  const navigate = useNavigate();
  const currentToken = localStorage.getItem("authToken");
  const [profile, setProfile] = useState(null);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const { getProfile } = useUser();

  useEffect(() => {
    if (currentToken) {
      getProfile()
        .then((response) => {
          const data = response?.data || response;
          setProfile(data);
        })
        .catch((error) => {
          console.error("Error fetching profile:", error);
        });
    }
  }, [currentToken, getProfile]);

  const handleProfileMenuOpen = (event) =>
    setProfileMenuAnchor(event.currentTarget);
  const handleProfileMenuClose = () => setProfileMenuAnchor(null);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setProfile(null);
    handleProfileMenuClose();
    navigate("/");
    setTimeout(() => {
      window.location.replace("/");
    }, 0);
  };

  const avatarUrl = profile?.profile?.avatar
    ? `http://localhost:9999${profile.profile.avatar}`
    : "/images/avatar/default.png";

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
          {/* Logo */}
          <Typography
            variant="h6"
            onClick={() => navigate("/")}
            sx={{
              fontWeight: "bold",
              cursor: "pointer",
              "&:hover": { opacity: 0.9 },
              flexGrow: 0,
              textAlign: "left",
            }}
          >
            Pharmacy
          </Typography>

          {/* Spacer to push buttons right */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Profile menu nếu đã đăng nhập, Login/Register nếu chưa */}
          <Box>
            {currentToken ? (
              <>
                <Tooltip title={profile?.fullName || "Tài khoản"}>
                  <IconButton
                    onClick={handleProfileMenuOpen}
                    sx={{ p: 0.5, borderRadius: "8px" }}
                  >
                    <Avatar
                      alt={profile?.fullName}
                      src={avatarUrl}
                      sx={{ width: 32, height: 32 }}
                    />
                    <ArrowDropDownIcon sx={{ color: palette.white }} />
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={profileMenuAnchor}
                  open={Boolean(profileMenuAnchor)}
                  onClose={handleProfileMenuClose}
                >
                  <MenuItem onClick={() => navigate("/profile")}>
                    Tài khoản
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>Đăng xuất</MenuItem>
                </Menu>
              </>
            ) : (
              <Box sx={{ display: "flex" }}>
                <Button
                  variant="contained"
                  sx={{ 
                    backgroundColor: palette.dark, 
                    "&:hover": { backgroundColor: "#104c50" }, 
                    fontSize: { xs: "0.75rem", sm: "0.875rem" } 
                  }}
                  onClick={() => navigate("/login")}
                >
                  Đăng nhập
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/register")}
                  sx={{ 
                    ml: { xs: 1, sm: 2 }, 
                    color: palette.white, 
                    borderColor: palette.white, 
                    "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" }, 
                    fontSize: { xs: "0.75rem", sm: "0.875rem" } 
                  }}
                >
                  Đăng ký
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

// ResetPassword wrapper
export const ResetPasswordWithSimpleHeader = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <SimpleHeader />
    <Box component="main" sx={{ 
      flexGrow: 1, 
      backgroundImage: "url('/images/backgroundLogin.jpg')", 
      backgroundSize: 'cover', 
      backgroundRepeat: 'no-repeat', 
      backgroundPosition: 'center', 
      backgroundAttachment: 'fixed',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 0'
    }}>
      <ResetPassword />
    </Box>
    <Footer />
  </Box>
);

// ForgotPassword wrapper
export const ForgotPasswordWithSimpleHeader = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <SimpleHeader />
    <Box component="main" sx={{ 
      flexGrow: 1, 
      backgroundImage: "url('/images/backgroundLogin.jpg')", 
      backgroundSize: 'cover', 
      backgroundRepeat: 'no-repeat', 
      backgroundPosition: 'center', 
      backgroundAttachment: 'fixed',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 0'
    }}>
      <ForgotPassword />
    </Box>
    <Footer />
  </Box>
);

// Guest pages wrapper với SimpleHeader
export const GuestPageWithSimpleHeader = ({ children }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <SimpleHeader />
    <Box component="main" sx={{ 
      flexGrow: 1, 
      backgroundImage: "url('/images/backgroundMedical2.jpg')", 
      backgroundSize: 'cover', 
      backgroundRepeat: 'no-repeat', 
      backgroundPosition: 'center', 
      backgroundAttachment: 'fixed' 
    }}>
      {children}
    </Box>
    <Footer />
  </Box>
);

// Login wrapper với SimpleHeader
export const LoginWithSimpleHeader = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <SimpleHeader />
    <Box component="main" sx={{ 
      flexGrow: 1, 
      backgroundImage: "url('/images/backgroundLogin.jpg')", 
      backgroundSize: 'cover', 
      backgroundRepeat: 'no-repeat', 
      backgroundPosition: 'center', 
      backgroundAttachment: 'fixed',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 0'
    }}>
      <Login />
    </Box>
    <Footer />
  </Box>
);

// Register wrapper với SimpleHeader
export const RegisterWithSimpleHeader = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <SimpleHeader />
    <Box component="main" sx={{ 
      flexGrow: 1, 
      backgroundImage: "url('/images/backgroundLogin.jpg')", 
      backgroundSize: 'cover', 
      backgroundRepeat: 'no-repeat', 
      backgroundPosition: 'center', 
      backgroundAttachment: 'fixed',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 0'
    }}>
      <Register />
    </Box>
    <Footer />
  </Box>
);

// ConfirmEmail wrapper với SimpleHeader
export const ConfirmEmailWithSimpleHeader = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <SimpleHeader />
    <Box component="main" sx={{ 
      flexGrow: 1, 
      backgroundImage: "url('/images/backgroundLogin.jpg')", 
      backgroundSize: 'cover', 
      backgroundRepeat: 'no-repeat', 
      backgroundPosition: 'center', 
      backgroundAttachment: 'fixed',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 0'
    }}>
      <ConfirmEmail />
    </Box>
    <Footer />
  </Box>
);

// Export SimpleHeader for potential future use
export { SimpleHeader };
