// File: ListCategory.js
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, TextField, Button, ButtonGroup, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TableFooter, Paper, Checkbox, IconButton, Stack, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TableSortLabel,
  CircularProgress, Card, CardContent, Grid, useMediaQuery, useTheme,
  Pagination, Chip, Snackbar,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { motion, AnimatePresence } from "framer-motion";

// MUI Icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CategoryIcon from '@mui/icons-material/Category';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

// Import các dialog đã tạo
import AddCategoryDialog from './AddCategory';
import EditCategoryDialog from './EditCategory';
import CategoryDetails from './CategoryDetails';

import useCategory from '../../Hooks/useCategory';
import categoryAPI from '../../API/categoryAPI';

// Animation variants
const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
  exit: {
    y: -20,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

function ListCategory() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { categories: hookCategories, getAllCategories, createCategory, inactivateCategory, loading, error: hookError } = useCategory();
  const [categories, setCategories] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'categoryName', direction: 'asc' });
  const [statusFirst, setStatusFirst] = useState('active'); // 'active' hoặc 'inactive'
  const [statusFilter, setStatusFilter] = useState(null); // null | true(active) | false(inactive)
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  // States để quản lý các dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const fetchCategories = useCallback(async () => {
    console.log('🔄 Fetching categories...');
    await getAllCategories();
  }, [getAllCategories]);

  // Đồng bộ dữ liệu từ hook vào state local
  useEffect(() => {
    console.log('📊 Categories from hook:', hookCategories);
    setCategories(hookCategories || []);
  }, [hookCategories]);

  useEffect(() => {
    console.log('🚀 ListCategory mounted, fetching categories...');
    fetchCategories();
  }, []);

  const handleSort = (key) => {
    const isAsc = sortConfig.key === key && sortConfig.direction === 'asc';
    setSortConfig({ key, direction: isAsc ? 'desc' : 'asc' });
  };

  // Function để xử lý navigation và API calls
  const handleApiCall = async (apiCall, successMessage, errorMessage, redirectPath = null) => {
    try {
      const response = await apiCall();
      
      if (response.data && response.data.success) {
        setSnackbarMessage(successMessage);
        setSnackbarOpen(true);
        setError(null);
        
        // Nếu có redirectPath thì chuyển hướng ngay lập tức
        if (redirectPath) {
          navigate(redirectPath);
        }
        
        return response;
      } else {
        const errorMsg = response.data?.message || errorMessage;
        setError(errorMsg);
        setSnackbarMessage(errorMsg);
        setSnackbarOpen(true);
        return null;
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || errorMessage;
      setError(errorMsg);
      setSnackbarMessage(errorMsg);
      setSnackbarOpen(true);
      return null;
    }
  };

  const handleUpdateStatus = async (id, currentStatus, productCount) => {
    // Check if trying to deactivate a category with products
    if (currentStatus === 'active' && productCount > 0) {
      const errorMsg = "Có thuốc nằm trong danh mục này, không thể ngừng hoạt động";
      setError(errorMsg);
      setSnackbarMessage(errorMsg);
      setSnackbarOpen(true);
      return;
    }
    
    if (!window.confirm(`Bạn có chắc muốn ${currentStatus === 'active' ? 'vô hiệu hóa' : 'kích hoạt'} danh mục này?`)) return;
    
    const response = await handleApiCall(
      () => categoryAPI.toggleStatus(id),
      'Cập nhật trạng thái danh mục thành công!',
      'Không thể cập nhật trạng thái danh mục.'
    );
    
    if (response) {
      // Cập nhật trạng thái trực tiếp trong state thay vì refresh trang
      setCategories(prevCategories => 
        prevCategories.map(cat => {
          const catId = cat?.categoryID || cat?.CategoryID || cat?._id || cat?.id;
          if (String(catId) === String(id)) {
            return {
              ...cat,
              status: !cat.status,
              isActive: !cat.isActive
            };
          }
          return cat;
        })
      );
    }
  };

  // Render status chip giống như trong ProductList
  const renderStatusChip = (status) => (
    <Box
      component="span"
      sx={{
        color: "white",
        bgcolor: status === "active" ? "success.main" : "error.main",
        p: "4px 10px",
        borderRadius: "16px",
        display: "inline-block",
        fontSize: "0.75rem",
        fontWeight: "bold",
        textAlign: "center",
      }}
    >
      {status === "active" ? "Hoạt động" : "Ngừng hoạt động"}
    </Box>
  );

  const filteredCategories = useMemo(() => {
    // Đảm bảo categories là array trước khi spread và filter ra các item undefined/null
    const categoriesArray = Array.isArray(categories) ? categories.filter(cat => cat && typeof cat === 'object') : [];
    
    let sortableItems = [...categoriesArray];

    // Lọc theo text
    if (filterText) {
      sortableItems = sortableItems.filter(item => {
        const searchText = filterText.toLowerCase();
        const categoryName = (item.categoryName || item.name || item.CategoryName || '').toLowerCase();
        const description = (item.description || '').toLowerCase();
        
        return categoryName.includes(searchText) || description.includes(searchText);
      });
    }
    
    // Lọc theo status
    if (statusFilter !== null) {
      sortableItems = sortableItems.filter(item => {
        // Sử dụng trạng thái thực từ backend, không phụ thuộc vào productCount
        const backendStatus = item?.status !== undefined ? item.status : item?.isActive;
        const status = backendStatus ? 'active' : 'inactive';
        
        return status === (statusFilter ? 'active' : 'inactive');
      });
    }
    
    // Sắp xếp theo cột
    sortableItems.sort((a, b) => {
      let aValue, bValue;
      
      if (sortConfig.key === 'index') {
        // Sorting by categoryID - sử dụng categoryID thực tế
        aValue = a.categoryID || a.CategoryID || a._id || a.id || 0;
        bValue = b.categoryID || b.CategoryID || b._id || b.id || 0;
      } else if (sortConfig.key === 'categoryName') {
        // Sử dụng field name thực tế từ data
        aValue = (a.categoryName || a.name || a.CategoryName || '').toLowerCase();
        bValue = (b.categoryName || b.name || b.CategoryName || '').toLowerCase();
      } else if (sortConfig.key === 'productCount') {
        // Sorting by product count
        const aProducts = a?.products || a?.Products || a?.productList || a?.ProductList || a?.items || a?.Items || [];
        const bProducts = b?.products || b?.Products || b?.productList || b?.ProductList || b?.items || b?.Items || [];
        aValue = aProducts?.length || 0;
        bValue = bProducts?.length || 0;
      } else if (sortConfig.key === 'status') {
        // Sorting by status - sử dụng trạng thái thực từ backend
        const aBackendStatus = a?.status !== undefined ? a.status : a?.isActive;
        const bBackendStatus = b?.status !== undefined ? b.status : b?.isActive;
        const aStatus = aBackendStatus ? 'active' : 'inactive';
        const bStatus = bBackendStatus ? 'active' : 'inactive';
        aValue = aStatus;
        bValue = bStatus;
      } else {
        aValue = a[sortConfig.key] || '';
        bValue = b[sortConfig.key] || '';
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    // Sắp xếp ưu tiên trạng thái (chỉ khi không có sorting theo cột)
    if (sortConfig.key === 'categoryName') {
      // Chỉ sắp xếp theo trạng thái khi sorting theo tên danh mục
      sortableItems.sort((a, b) => {
        const aStatus = a.status || 'inactive';
        const bStatus = b.status || 'inactive';
        
        if (aStatus === statusFirst && bStatus !== statusFirst) return -1;
        if (aStatus !== statusFirst && bStatus === statusFirst) return 1;
        return 0;
      });
    }

    return sortableItems;
  }, [categories, filterText, sortConfig, statusFirst, statusFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

  const handleOpenEditDialog = (category) => {
    setSelectedCategory(category);
    setIsEditDialogOpen(true);
  };

  const handleOpenDetailsDialog = async (category) => {
    setSelectedCategory(category);
    setIsDetailsDialogOpen(true);
    
    // Gọi API để lấy thông tin chi tiết với products
    try {
      const categoryId = category?.categoryID || category?.CategoryID || category?._id || category?.id;
      if (categoryId) {
        const response = await categoryAPI.get(categoryId);
        
        if (response.data && response.data.success && response.data.data) {
          // Cập nhật selectedCategory với thông tin chi tiết
          setSelectedCategory(response.data.data);
        }
      }
    } catch (error) {
      // Vẫn hiển thị dialog với thông tin cơ bản
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundImage: "url('/images/backgroundMedical2.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.10)',
          backdropFilter: 'blur(0.5px)',
          pointerEvents: 'none',
          zIndex: 0,
        },
      }}
    >
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, py: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={listContainerVariants}
        >
          {/* Header Section */}
          <motion.div variants={itemVariants}>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Typography
                variant="h3"
                component="h1"
                color="white"
                fontWeight="bold"
                sx={{ 
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)', 
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2
                }}
              >
                <CategoryIcon sx={{ fontSize: '2.5rem' }} />
                Quản Lý Danh Mục Thuốc
              </Typography>
            </Box>
          </motion.div>

          {/* Controls Section */}
          <motion.div variants={itemVariants}>
            <Stack 
              direction={{ xs: 'column', md: 'row' }} 
              spacing={2} 
              alignItems={{ xs: 'stretch', md: 'center' }} 
              justifyContent="space-between" 
              sx={{ mb: 4 }}
            >
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setIsAddDialogOpen(true)}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': { 
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Thêm Danh Mục
              </Button>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ width: { xs: '100%', md: 'auto' } }}>
                <TextField
                  placeholder={filterText ? '' : 'Tìm tên danh mục...'}
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  sx={{
                    minWidth: { sm: 250, md: 300 },
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(10px)',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                      '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                      '&.Mui-focused fieldset': { borderColor: 'white' },
                    },
                    '& input::placeholder': { color: 'rgba(0, 0, 0, 0.6)', opacity: 1 },
                  }}
                />
                <ButtonGroup variant="outlined" fullWidth>
                  <Button
                    onClick={() => setStatusFilter(true)}
                    variant={statusFilter === true ? "contained" : "outlined"}
                    sx={{
                      backgroundColor: statusFilter === true ? "rgba(255, 255, 255, 0.2)" : "transparent",
                      color: "white",
                      borderColor: "rgba(255, 255, 255, 0.3)",
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        borderColor: "rgba(255, 255, 255, 0.5)",
                      },
                      fontWeight: 'bold',
                      textTransform: 'none',
                    }}
                  >
                    Hoạt động
                  </Button>
                  <Button
                    onClick={() => setStatusFilter(false)}
                    variant={statusFilter === false ? "contained" : "outlined"}
                    sx={{
                      backgroundColor: statusFilter === false ? "rgba(255, 255, 255, 0.2)" : "transparent",
                      color: "white",
                      borderColor: "rgba(255, 255, 255, 0.3)",
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        borderColor: "rgba(255, 255, 255, 0.5)",
                      },
                      fontWeight: 'bold',
                      textTransform: 'none',
                    }}
                  >
                    Ngừng hoạt động
                  </Button>
                  <Button
                    onClick={() => setStatusFilter(null)}
                    variant={statusFilter === null ? "contained" : "outlined"}
                    sx={{
                      backgroundColor: statusFilter === null ? "rgba(255, 255, 255, 0.2)" : "transparent",
                      color: "white",
                      borderColor: "rgba(255, 255, 255, 0.3)",
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        borderColor: "rgba(255, 255, 255, 0.5)",
                      },
                      fontWeight: 'bold',
                      textTransform: 'none',
                    }}
                  >
                    Tất cả
                  </Button>
                </ButtonGroup>
              </Stack>
            </Stack>
          </motion.div>

          {/* Status Messages */}
          <motion.div variants={itemVariants}>
            {(error || hookError) && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 2, 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                {error || hookError}
              </Alert>
            )}

            {/* Loading state */}
            {loading && (
              <Alert 
                severity="info" 
                sx={{ 
                  mb: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <CircularProgress size={20} />
                  <Typography>Đang tải danh sách danh mục...</Typography>
                </Stack>
              </Alert>
            )}

            {/* Empty state */}
            {!loading && !error && !hookError && filteredCategories.length === 0 && (
              <Alert 
                severity="warning" 
                sx={{ 
                  mb: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                {categories.length === 0 ? 'Chưa có danh mục nào. Hãy thêm danh mục đầu tiên!' : 'Không tìm thấy danh mục phù hợp với bộ lọc.'}
              </Alert>
            )}
          </motion.div>

          {/* Table Section */}
          <motion.div variants={itemVariants}>
            <Paper sx={{ 
              width: '100%', 
              overflow: 'hidden', 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              borderRadius: 3,
              minHeight: '600px'
            }}>
              <TableContainer sx={{ 
                maxHeight: 'calc(100vh - 350px)',
                minHeight: '500px'
              }}>
                <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell 
                align="center" 
                sx={{ fontWeight: 'bold', width: '60px' }}
                sortDirection={sortConfig.key === 'index' ? sortConfig.direction : false}
              >
                <TableSortLabel
                  active={sortConfig.key === 'index'}
                  hideSortIcon
                  direction={sortConfig.key === 'index' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('index')}
                >
                  #
                  {sortConfig.key === 'index' ? (
                    <Box component="span" sx={visuallyHidden}>
                      {sortConfig.direction === "desc" ? "sorted descending" : "sorted ascending"}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </TableCell>
              <TableCell 
                sortDirection={sortConfig.key === 'categoryName' ? sortConfig.direction : false}
                sx={{ fontWeight: 'bold', width: '200px' }}
              >
                <TableSortLabel
                  active={sortConfig.key === 'categoryName'}
                  hideSortIcon
                  direction={sortConfig.key === 'categoryName' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('categoryName')}
                >
                  Tên danh mục
                  {sortConfig.key === 'categoryName' ? (
                    <Box component="span" sx={visuallyHidden}>
                      {sortConfig.direction === "desc" ? "sorted descending" : "sorted ascending"}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '200px' }}>Mô tả</TableCell>
              <TableCell 
                align="center" 
                sx={{ fontWeight: 'bold', width: '100px' }}
                sortDirection={sortConfig.key === 'productCount' ? sortConfig.direction : false}
              >
                <TableSortLabel
                  active={sortConfig.key === 'productCount'}
                  hideSortIcon
                  direction={sortConfig.key === 'productCount' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('productCount')}
                >
                  Sản phẩm
                  {sortConfig.key === 'productCount' ? (
                    <Box component="span" sx={visuallyHidden}>
                      {sortConfig.direction === "desc" ? "sorted descending" : "sorted ascending"}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </TableCell>
              <TableCell 
                align="center" 
                sx={{ fontWeight: 'bold', width: '120px' }}
                sortDirection={sortConfig.key === 'status' ? sortConfig.direction : false}
              >
                <TableSortLabel
                  active={sortConfig.key === 'status'}
                  hideSortIcon
                  direction={sortConfig.key === 'status' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('status')}
                >
                  Trạng thái
                  {sortConfig.key === 'status' ? (
                    <Box component="span" sx={visuallyHidden}>
                      {sortConfig.direction === "desc" ? "sorted descending" : "sorted ascending"}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', width: '280px' }}>Hành động</TableCell>
            </TableRow>
          </TableHead>
                <TableBody>
                  <AnimatePresence>
                    {paginatedCategories.filter(cat => cat && typeof cat === 'object').map((cat, index) => (
                      <motion.tr
                        key={cat._id || cat.id || `category-${index}`}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ 
                          delay: index * 0.05,
                          type: "spring",
                          stiffness: 100,
                          damping: 15
                        }}
                        component={TableRow}
                        layout // Prop quan trọng giúp animation mượt mà khi lọc/sắp xếp
                        hover
                        onClick={() => handleOpenDetailsDialog(cat)}
                        sx={{ 
                          cursor: 'pointer !important',
                          '&:hover': { 
                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                            transform: 'scale(1.01)',
                            transition: 'all 0.2s ease'
                          },
                          '& *': {
                            cursor: 'pointer !important'
                          }
                        }}
                      >
                         <TableCell align="center" component="th" scope="row" sx={{ cursor: 'pointer', width: '60px' }}>
                           <Typography variant="body2" color="text.secondary">
                             {cat?.categoryID || cat?.CategoryID || cat?._id || cat?.id || 'N/A'}
                           </Typography>
                         </TableCell>
                        <TableCell sx={{ cursor: 'pointer', width: '200px' }}>
                          <Button
                            variant="text"
                            sx={{
                              color: '#1976d2',
                              textTransform: 'none',
                              fontWeight: 'bold',
                              justifyContent: 'flex-start',
                              padding: 0,
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: 'transparent',
                                textDecoration: 'underline',
                              },
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetailsDialog(cat);
                            }}
                          >
                            {cat?.categoryName || cat?.name || cat?.CategoryName || 'Tên không xác định'}
                          </Button>
                        </TableCell>
                        <TableCell sx={{maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', width: '200px'}} title={cat?.description || 'Không có mô tả'}>
                          <Typography variant="body2" color="text.secondary">
                            {(() => {
                              const description = cat?.description || 'Không có mô tả';
                              return description.length > 30 ? description.substring(0, 30) + '...' : description;
                            })()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ cursor: 'pointer', width: '100px' }}>
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            {(() => {
                              const products = cat?.products || cat?.Products || cat?.productList || cat?.ProductList || cat?.items || cat?.Items || [];
                              return products?.length || 0;
                            })()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ cursor: 'pointer', width: '120px' }}>
                          {(() => {
                            const products = cat?.products || cat?.Products || cat?.productList || cat?.ProductList || cat?.items || cat?.Items || [];
                            const productCount = products?.length || 0;
                            // Sử dụng trạng thái thực từ backend, không phụ thuộc vào productCount
                            const backendStatus = cat?.status !== undefined ? cat.status : cat?.isActive;
                            const status = backendStatus ? 'active' : 'inactive';
                            return renderStatusChip(status);
                          })()}
                        </TableCell>
                        <TableCell align="center" sx={{ cursor: 'pointer', width: '280px' }}>
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="center"
                            alignItems="center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="outlined"
                              color="warning"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditDialog(cat);
                              }}
                              sx={{ width: '80px', height: '32px' }}
                            >
                              Sửa
                            </Button>
                            {(() => {
                              const products = cat?.products || cat?.Products || cat?.productList || cat?.ProductList || cat?.items || cat?.Items || [];
                              const productCount = products?.length || 0;
                              const categoryId = cat?.categoryID || cat?.CategoryID || cat?._id || cat?.id;
                              const canDelete = productCount === 0;
                              return (
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  disabled={!canDelete}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (!canDelete) return;
                                    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này? Hành động không thể hoàn tác.')) return;
                                    const resp = await handleApiCall(
                                      () => categoryAPI.delete(categoryId),
                                      'Xóa danh mục thành công!',
                                      'Không thể xóa danh mục.'
                                    );
                                    if (resp) {
                                      setCategories(prev => prev.filter(c => (c?.categoryID || c?.CategoryID || c?._id || c?.id) !== categoryId));
                                    }
                                  }}
                                  sx={{ width: '80px', height: '32px' }}
                                  title={canDelete ? '' : 'Không thể xóa: danh mục này đang có sản phẩm'}
                                >
                                  Xóa
                                </Button>
                              );
                            })()}
                            {(() => {
                              const products = cat?.products || cat?.Products || cat?.productList || cat?.ProductList || cat?.items || cat?.Items || [];
                              const productCount = products?.length || 0;
                              // Sử dụng trạng thái thực từ backend, không phụ thuộc vào productCount
                              const backendStatus = cat?.status !== undefined ? cat.status : cat?.isActive;
                              const status = backendStatus ? 'active' : 'inactive';
                              
                              return (
                                <Button
                                  variant="contained"
                                  color={status === 'active' ? "error" : "success"}
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(cat?.categoryID || cat?.CategoryID || cat?._id || cat?.id, status, productCount);
                                  }}
                                  sx={{ width: '160px', height: '32px' }}
                                >
                                  {status === 'active' ? "Ngừng hoạt động" : "Kích hoạt"}
                                </Button>
                              );
                            })()}
                          </Stack>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Pagination inside Paper */}
            <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end" }}>
              <Pagination 
                count={totalPages} 
                page={currentPage} 
                onChange={(_, v) => setCurrentPage(v)} 
                color="primary" 
              />
            </Box>
          </Paper>
        </motion.div>

      {/* --- Dialogs --- */}
      <AddCategoryDialog
        open={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false);
          fetchCategories(); // Refresh danh sách sau khi đóng dialog
        }}
        onCategoryAdded={(newCategory) => {
          // Thêm category mới vào state local
          setCategories(prev => [...prev, newCategory]);
          setSnackbarMessage('Thêm danh mục thành công!');
          setSnackbarOpen(true);
          // Có thể redirect đến trang khác nếu cần
          // navigate('/some-other-page');
        }}
        onAdd={createCategory}
      />

      {selectedCategory && (
        <EditCategoryDialog
          open={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            fetchCategories(); // Refresh danh sách sau khi đóng dialog
          }}
          category={selectedCategory}
          onCategoryUpdated={(updatedCategory) => {
            // Cập nhật category trong state local
            setCategories(prev => 
              prev.map(cat => 
                (cat?.categoryID || cat?.CategoryID || cat?._id || cat?.id) === 
                (updatedCategory?.categoryID || updatedCategory?.CategoryID || updatedCategory?._id || updatedCategory?.id)
                  ? updatedCategory 
                  : cat
              )
            );
            setSnackbarMessage('Cập nhật danh mục thành công!');
            setSnackbarOpen(true);
            // Có thể redirect đến trang khác nếu cần
            // navigate('/some-other-page');
          }}
        />
      )}

      {/* Category Details Dialog */}
      <CategoryDetails
        open={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        category={selectedCategory}
      />
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ 
          zIndex: 9999,
          '& .MuiSnackbar-root': {
            zIndex: 9999
          }
        }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={error ? "error" : "success"}
          sx={{ 
            width: '100%',
            zIndex: 9999,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
        </motion.div>
      </Container>
    </Box>
  );
}

export default ListCategory;