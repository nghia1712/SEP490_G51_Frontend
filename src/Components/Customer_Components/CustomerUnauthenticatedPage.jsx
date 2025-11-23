import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Button,
} from '@mui/material';
import { Info, HourglassEmpty } from '@mui/icons-material';
import userAPI from '../../API/userAPI';
import { SimpleHeader } from '../Utils/SimpleHeaderWrapper';
import Footer from '../Utils/Footer';

const CustomerUnauthenticatedPage = () => {
  const [customerStatus, setCustomerStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    checkCustomerStatus();
  }, []);

  const checkCustomerStatus = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getCustomerStatus();
      const status = response.data.data;
      setCustomerStatus(status);
      
      // Chỉ redirect về /customer khi đã bổ sung thông tin VÀ đã được admin duyệt (userStatus === 'Active' hoặc 2)
      // Kiểm tra cả string và số vì backend có thể trả về enum dạng số
      const userStatus = status?.userStatus;
      if (!status.needsAdditionalInfo && (userStatus === 'Active' || userStatus === 2 || userStatus === '2')) {
        navigate('/customer', { replace: true });
      }
    } catch (error) {
      console.error('Error checking customer status:', error);
      setError('Không thể kiểm tra trạng thái tài khoản');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <SimpleHeader />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            backgroundImage: "url('/images/backgroundMedical2.jpg')",
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
          }}
        >
          <CircularProgress />
        </Box>
        <Footer />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <SimpleHeader />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            backgroundImage: "url('/images/backgroundMedical2.jpg')",
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 3,
          }}
        >
          <Box maxWidth="600px" width="100%">
            <Alert severity="error">{error}</Alert>
          </Box>
        </Box>
        <Footer />
      </Box>
    );
  }

  // Nếu đã bổ sung thông tin và được duyệt, sẽ redirect (đã xử lý trong checkCustomerStatus)
  // Nếu chưa bổ sung thông tin hoặc chưa được duyệt, hiển thị modal
  if (!customerStatus) {
    return null; // Đang loading hoặc có lỗi
  }

  // Nếu đã bổ sung thông tin nhưng chưa được duyệt, hiển thị thông báo chờ duyệt
  if (!customerStatus.needsAdditionalInfo && customerStatus.userStatus !== 'Active') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <SimpleHeader />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            backgroundImage: "url('/images/backgroundMedical2.jpg')",
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 3,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              zIndex: 1,
            },
          }}
        >
          <Box
            sx={{
              position: 'relative',
              zIndex: 2,
              maxWidth: '800px',
              width: '100%',
            }}
          >
            <Card>
              <CardContent>
                <Box textAlign="center" mb={3}>
                  <HourglassEmpty color="warning" sx={{ fontSize: 64, mb: 2 }} />
                  <Typography variant="h5" gutterBottom>
                    Đang Chờ Duyệt
                  </Typography>
                  <Typography variant="body1" color="text.secondary" mb={3}>
                    Thông tin của bạn đã được gửi và đang chờ admin duyệt.
                    <br />
                    <strong>Bạn chưa thể truy cập vào hệ thống cho đến khi được duyệt.</strong>
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
        <Footer />
      </Box>
    );
  }

  // Nếu chưa bổ sung thông tin, hiển thị modal yêu cầu bổ sung
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <SimpleHeader />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          backgroundImage: "url('/images/backgroundMedical2.jpg')",
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: 3,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            zIndex: 1,
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            maxWidth: '800px',
            width: '100%',
          }}
        >
          <Card>
            <CardContent>
              <Box textAlign="center" mb={3}>
                <Info color="info" sx={{ fontSize: 64, mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Cần Bổ Sung Thông Tin
                </Typography>
                <Typography variant="body1" color="text.secondary" mb={3}>
                  Để sử dụng đầy đủ các tính năng của hệ thống, bạn cần bổ sung thông tin mã số thuế và mã số kinh doanh
                </Typography>

                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/customer/additional-info')}
                  sx={{
                    backgroundColor: '#155E64',
                    '&:hover': {
                      backgroundColor: '#104c50',
                    },
                  }}
                >
                  BỔ SUNG THÔNG TIN NGAY
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
      <Footer />
    </Box>
  );
};

export default CustomerUnauthenticatedPage;

