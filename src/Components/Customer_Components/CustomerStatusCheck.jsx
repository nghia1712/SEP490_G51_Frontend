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
  Chip
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Info,
  HourglassEmpty,
  Block
} from '@mui/icons-material';
import userAPI from '../../API/userAPI';

const CustomerStatusCheck = ({ children }) => {
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
      setCustomerStatus(response.data.data);
    } catch (error) {
      console.error('Error checking customer status:', error);
      setError('Không thể kiểm tra trạng thái tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active':
        return <CheckCircle color="success" />;
      case 'Inactive':
        return <HourglassEmpty color="warning" />;
      case 'Block':
        return <Block color="error" />;
      default:
        return <Info color="info" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Inactive':
        return 'warning';
      case 'Block':
        return 'error';
      default:
        return 'info';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Active':
        return 'Đã kích hoạt';
      case 'Inactive':
        return 'Chờ duyệt';
      case 'Block':
        return 'Bị khóa';
      default:
        return 'Không xác định';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box maxWidth="600px" mx="auto" p={3}>
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    );
  }

  if (!customerStatus) {
    return children; // Fallback to children if no status
  }

  // Nếu customer cần bổ sung thông tin, redirect đến form
  if (customerStatus.needsAdditionalInfo) {
    return (
      <Box maxWidth="800px" mx="auto" p={3}>
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
              >
                Bổ Sung Thông Tin Ngay
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Nếu customer đã submit nhưng chưa được duyệt - NGĂN CHẶN TRUY CẬP LANDING PAGE
  if (customerStatus.userStatus === 'Inactive' && customerStatus.hasAdditionalInfo) {
    return (
      <Box maxWidth="800px" mx="auto" p={3}>
        <Card>
          <CardContent>
            <Box textAlign="center" mb={3}>
              <HourglassEmpty color="warning" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Đang Chờ Duyệt
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={3}>
                Thông tin của bạn đã được gửi và đang chờ manager duyệt. 
                <strong> Bạn chưa thể truy cập vào hệ thống cho đến khi được duyệt.</strong>
              </Typography>
              
              <Chip
                icon={getStatusIcon(customerStatus.userStatus)}
                label={getStatusText(customerStatus.userStatus)}
                color={getStatusColor(customerStatus.userStatus)}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Lưu ý:</strong> Tài khoản của bạn đang ở trạng thái chờ duyệt. 
                  Manager sẽ xem xét thông tin MST và MSHKD cùng hình ảnh đính kèm của bạn. 
                  Sau khi được duyệt, bạn mới có thể sử dụng đầy đủ các tính năng của hệ thống.
                </Typography>
              </Alert>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Vui lòng kiên nhẫn chờ đợi. Quá trình duyệt thường mất 1-2 ngày làm việc.
                </Typography>
              </Alert>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Nếu customer bị khóa
  if (customerStatus.userStatus === 'Block') {
    return (
      <Box maxWidth="800px" mx="auto" p={3}>
        <Card>
          <CardContent>
            <Box textAlign="center" mb={3}>
              <Block color="error" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Tài Khoản Bị Khóa
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={3}>
                Tài khoản của bạn đã bị khóa. Vui lòng liên hệ với quản trị viên để được hỗ trợ.
              </Typography>
              
              <Chip
                icon={getStatusIcon(customerStatus.userStatus)}
                label={getStatusText(customerStatus.userStatus)}
                color={getStatusColor(customerStatus.userStatus)}
                variant="outlined"
                sx={{ mb: 2 }}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Nếu customer đã được kích hoạt, hiển thị children (dashboard bình thường)
  if (customerStatus.userStatus === 'Active') {
    return children;
  }

  // Fallback
  return children;
};

export default CustomerStatusCheck;
