import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Avatar,
  Divider
} from '@mui/material';
import {
  CheckCircle,
  Visibility,
  Business,
  Receipt,
  Person,
  Email,
  Phone,
  PendingActions,
  Cancel
} from '@mui/icons-material';
import userAPI from '../../API/userAPI';
import adminAPI from '../../API/adminAPI';

const CustomerApprovalList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      // Lấy tất cả account từ Admin API
      const response = await adminAPI.getAccountList();
      console.log('API Response:', response);
      
      if (response.data && Array.isArray(response.data)) {
        // Filter: chỉ lấy customer có status Inactive
        const inactiveCustomers = response.data.filter(
          account => account.isCustomer === true && account.userStatus === 'Inactive'
        );
        
        // Lấy thông tin chi tiết cho mỗi customer (mst, mshkd, imageCnkd, imageByt)
        const customersWithDetails = await Promise.all(
          inactiveCustomers.map(async (account) => {
            try {
              const detailResponse = await adminAPI.getAccountDetails(account.userId);
              const details = detailResponse.data?.data || detailResponse.data;
              
              return {
                id: account.userId,
                userName: account.fullName || account.email || '',
                email: account.email || '',
                phoneNumber: account.phoneNumber || '',
                mst: details?.mst || null,
                mshkd: details?.mshkd || null,
                imageCnkd: details?.imageCnkd || null,
                imageByt: details?.imageByt || null,
                userStatus: account.userStatus
              };
            } catch (error) {
              console.error(`Error fetching details for ${account.userId}:`, error);
              // Trả về thông tin cơ bản nếu không lấy được chi tiết
              return {
                id: account.userId,
                userName: account.fullName || account.email || '',
                email: account.email || '',
                phoneNumber: account.phoneNumber || '',
                mst: null,
                mshkd: null,
                imageCnkd: null,
                imageByt: null,
                userStatus: account.userStatus
              };
            }
          })
        );
        
        setCustomers(customersWithDetails);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Không thể tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (customerId) => {
    try {
      setActionLoading(true);
      const response = await userAPI.updateCustomerStatus(customerId);
      console.log('Approve response:', response);
      
      if (response.data && response.data.data) {
        setSuccess('Duyệt khách hàng thành công');
        await fetchCustomers(); // Refresh list
        setDetailDialogOpen(false);
      } else {
        setError(response.data?.message || 'Có lỗi xảy ra khi duyệt');
      }
    } catch (error) {
      console.error('Error approving customer:', error);
      setError('Có lỗi xảy ra khi duyệt khách hàng');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    setDetailDialogOpen(true);
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      'Inactive': { color: 'warning', label: 'Chờ duyệt', icon: <PendingActions /> },
      'Active': { color: 'success', label: 'Đã kích hoạt', icon: <CheckCircle /> },
      'Block': { color: 'error', label: 'Bị khóa', icon: <Cancel /> }
    };
    
    const config = statusConfig[status] || { color: 'default', label: status, icon: <PendingActions /> };
    return (
      <Chip 
        color={config.color} 
        label={config.label} 
        size="small" 
        icon={config.icon}
        variant="outlined"
      />
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box maxWidth="1400px" mx="auto" p={3}>
      {/* Header - Simplified */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#333' }}>
          Quản lý tài khoản khách hàng
        </Typography>
        <Button
          variant="outlined"
          onClick={fetchCustomers}
          sx={{ minWidth: '120px' }}
        >
          Làm mới
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}


      {/* Main Content */}
      <Card>
        <CardContent>
          {customers.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                Không có khách hàng nào cần duyệt
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tên khách hàng</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Số điện thoại</TableCell>
                    <TableCell>Mã số thuế</TableCell>
                    <TableCell>Mã số kinh doanh</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell align="center">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>{customer.userName}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phoneNumber}</TableCell>
                      <TableCell>{customer.mst || 'Chưa có'}</TableCell>
                      <TableCell>{customer.mshkd || 'Chưa có'}</TableCell>
                      <TableCell>{getStatusChip(customer.userStatus)}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          onClick={() => handleViewDetails(customer)}
                        >
                          <Visibility />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Chi tiết thông tin khách hàng
        </DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Thông tin cơ bản
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Tên đăng nhập:</TableCell>
                      <TableCell>{selectedCustomer.userName}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Email:</TableCell>
                      <TableCell>{selectedCustomer.email}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Số điện thoại:</TableCell>
                      <TableCell>{selectedCustomer.phoneNumber}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Mã số thuế:</TableCell>
                      <TableCell>{selectedCustomer.mst || 'Chưa có'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Mã số kinh doanh:</TableCell>
                      <TableCell>{selectedCustomer.mshkd || 'Chưa có'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              
              {(selectedCustomer.imageCnkd || selectedCustomer.imageByt) && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Ảnh đính kèm
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {selectedCustomer.imageCnkd && (
                      <Box>
                        <Typography variant="body2" gutterBottom>
                          Ảnh chứng nhận kinh doanh
                        </Typography>
                        <img
                          src={`http://localhost:9999${selectedCustomer.imageCnkd}`}
                          alt="Chứng nhận kinh doanh"
                          style={{ width: '200px', height: '150px', objectFit: 'contain', border: '1px solid #ddd' }}
                        />
                      </Box>
                    )}
                    {selectedCustomer.imageByt && (
                      <Box>
                        <Typography variant="body2" gutterBottom>
                          Ảnh báo cáo thuế
                        </Typography>
                        <img
                          src={`http://localhost:9999${selectedCustomer.imageByt}`}
                          alt="Báo cáo thuế"
                          style={{ width: '200px', height: '150px', objectFit: 'contain', border: '1px solid #ddd' }}
                        />
                      </Box>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>
            Đóng
          </Button>
          {selectedCustomer && selectedCustomer.userStatus === 'Inactive' && (
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={() => handleApprove(selectedCustomer.id)}
              disabled={actionLoading}
            >
              {actionLoading ? 'Đang xử lý...' : 'Duyệt'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerApprovalList;
