import React from 'react';
import { Box, Container, Typography, Link, IconButton } from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';

const palette = {
  dark: '#155E64',
  medium: '#75B39C',
  light: '#A0E4D0',
  white: '#FFFFFF',
};

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: 'rgba(0, 0, 0, 0.2)', // Nền tối hơn một chút
        color: palette.white,
        py: 3,
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
