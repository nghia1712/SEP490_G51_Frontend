import React from 'react';
import { Box, Container, Typography, Link, IconButton } from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import getUserRoleFromToken from '../../Utils/getUserRoleFromToken.jsx';
import { useLocation } from 'react-router-dom';

const palette = {
  dark: '#155E64',
  medium: '#75B39C',
  light: '#A0E4D0',
  white: '#FFFFFF',
};

const Footer = () => {
  // Ẩn footer khi user có vai trò manager, trừ route /manager
  const userRole = getUserRoleFromToken();
  const location = useLocation();
  if (userRole === 'manager' && location.pathname !== '/manager') {
    return null;
  }
  
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: 'rgba(0, 0, 0, 0.2)', // Nền tối hơn một chút
        color: palette.white,
        py: 1,
        mt: 'auto', // Đẩy footer xuống cuối trang
      }}
    >
      <Container maxWidth="xl">
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
        }}>
          {/* Copyright Section */}
          <Typography variant="body2" align="center">
            {'© '}
            {new Date().getFullYear()}
            {' '}
            <Link color="inherit" href="#">
              Pharmacy Management System
            </Link>
            . All Rights Reserved.
          </Typography>

          {/* Social Media Section */}
          <Box>
            <IconButton
              component="a"
              href="https://facebook.com"
              target="_blank"
              sx={{
                color: 'inherit',
                '&:hover': {
                  color: palette.light
                }
              }}
            >
              <FacebookIcon />
            </IconButton>
            <IconButton
              component="a"
              href="https://twitter.com"
              target="_blank"
              sx={{
                color: 'inherit',
                '&:hover': {
                  color: palette.light
                }
              }}
            >
              <TwitterIcon />
            </IconButton>
            <IconButton
              component="a"
              href="https://instagram.com"
              target="_blank"
              sx={{
                color: 'inherit',
                '&:hover': {
                  color: palette.light
                }
              }}
            >
              <InstagramIcon />
            </IconButton>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
