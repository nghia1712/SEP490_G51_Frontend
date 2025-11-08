// File: ListRSQ.jsx - Danh sách yêu cầu báo giá
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TableSortLabel,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SendIcon from '@mui/icons-material/Send';
import requestSalesQuotationAPI from '../../API/requestSalesQuotationAPI';

const ListRSQ = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Map status enum
  const getStatusLabel = (status) => {
    switch (status) {
      case 0:
        return 'Nháp';
      case 1:
        return 'Đã gửi';
      case 2:
        return 'Đã báo giá';
      default:
        return 'Không xác định';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 0:
        return { backgroundColor: '#fff3cd', color: '#856404' }; // Draft - Yellow
      case 1:
        return { backgroundColor: '#d1ecf1', color: '#0c5460' }; // Sent - Blue
      case 2:
        return { backgroundColor: '#d4edda', color: '#155724' }; // Quoted - Green
      default:
        return { backgroundColor: '#e3f2fd', color: '#1976d2' };
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch (error) {
      return '-';
    }
  };

  // Fetch data from API
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await requestSalesQuotationAPI.viewList();
      
      if (response.data && response.data.data) {
        const data = Array.isArray(response.data.data) 
          ? response.data.data 
          : [];
        
        // Map data from API to component format
        const mappedData = data.map((item) => ({
          id: item.id,
          code: item.requestCode || '',
          createdDate: item.requestDate || null,
          sentDate: item.status === 1 || item.status === 2 ? item.requestDate : null, // Ngày gửi = requestDate nếu đã gửi
          status: item.status,
        }));
        
        setRequests(mappedData);
      } else {
        setRequests([]);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể tải danh sách yêu cầu báo giá';
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSort = (key) => {
    const isAsc = sortConfig.key === key && sortConfig.direction === 'asc';
    setSortConfig({ key, direction: isAsc ? 'desc' : 'asc' });
  };

  const handleCreate = () => {
    navigate('/request-quotation/create');
  };

  const handleEdit = (id) => {
    // TODO: Implement edit
    console.log('Edit request:', id);
  };

  const handleDelete = (id) => {
    // TODO: Implement delete
    if (window.confirm('Bạn có chắc muốn xóa yêu cầu này?')) {
      console.log('Delete request:', id);
    }
  };

  const handleViewDetails = (id) => {
    // TODO: Implement view details
    console.log('View details:', id);
  };

  const handleSend = (id) => {
    // TODO: Implement send
    console.log('Send request:', id);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Title */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 'bold',
            color: '#155E64',
            mb: 2,
          }}
        >
          Danh sách yêu cầu báo giá
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Create Button */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-start' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
          sx={{
            backgroundColor: '#155E64',
            '&:hover': {
              backgroundColor: '#0D4F52',
            },
            borderRadius: '8px',
            px: 3,
            py: 1.5,
          }}
        >
          Tạo yêu cầu
        </Button>
      </Box>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Table */}
      {!loading && (
        <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
          <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ width: '50px' }}></TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === 'code'}
                  direction={sortConfig.key === 'code' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('code')}
                >
                  Mã báo giá
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === 'createdDate'}
                  direction={sortConfig.key === 'createdDate' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('createdDate')}
                >
                  Ngày tạo
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === 'sentDate'}
                  direction={sortConfig.key === 'sentDate' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('sentDate')}
                >
                  Ngày gửi
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === 'status'}
                  direction={sortConfig.key === 'status' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('status')}
                >
                  Trạng thái
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <span>Thao tác</span>
                  <IconButton size="small" disabled sx={{ p: 0, minWidth: 'auto' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', fontSize: '0.7rem', lineHeight: 0.8 }}>
                      <span>▲</span>
                      <span>▼</span>
                    </Box>
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map((request, index) => (
              <TableRow key={request.id} hover>
                <TableCell>{index + 1}</TableCell>
                <TableCell sx={{ fontWeight: 500 }}>{request.code}</TableCell>
                <TableCell>{formatDate(request.createdDate)}</TableCell>
                <TableCell>{formatDate(request.sentDate)}</TableCell>
                <TableCell>
                  {request.status !== undefined && request.status !== null ? (
                    <Chip
                      label={getStatusLabel(request.status)}
                      size="small"
                      sx={getStatusColor(request.status)}
                    />
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleEdit(request.id)}
                      sx={{
                        color: '#1976d2',
                        textDecoration: 'underline',
                        minWidth: 'auto',
                        '&:hover': {
                          textDecoration: 'underline',
                          backgroundColor: 'transparent',
                        },
                      }}
                    >
                      Sửa
                    </Button>
                    <Button
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDelete(request.id)}
                      sx={{
                        color: '#d32f2f',
                        textDecoration: 'underline',
                        minWidth: 'auto',
                        '&:hover': {
                          textDecoration: 'underline',
                          backgroundColor: 'transparent',
                        },
                      }}
                    >
                      Xóa
                    </Button>
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleViewDetails(request.id)}
                      sx={{
                        color: '#1976d2',
                        textDecoration: 'underline',
                        minWidth: 'auto',
                        '&:hover': {
                          textDecoration: 'underline',
                          backgroundColor: 'transparent',
                        },
                      }}
                    >
                      Xem chi tiết
                    </Button>
                    <Button
                      size="small"
                      startIcon={<SendIcon />}
                      onClick={() => handleSend(request.id)}
                      sx={{
                        color: '#1976d2',
                        textDecoration: 'underline',
                        minWidth: 'auto',
                        '&:hover': {
                          textDecoration: 'underline',
                          backgroundColor: 'transparent',
                        },
                      }}
                    >
                      Gửi
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Chưa có yêu cầu báo giá nào
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default ListRSQ;

