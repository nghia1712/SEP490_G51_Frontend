// File: ListCategory.js
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Container, Box, Typography, TextField, Button, ButtonGroup, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TableFooter, Paper, Checkbox, IconButton, Stack, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TableSortLabel,
  CircularProgress, Card, CardContent, Grid, useMediaQuery, useTheme,
  Pagination, Chip,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { categories, getAllCategories, createCategory, inactivateCategory, loading, error: hookError } = useCategory();
  const [filterText, setFilterText] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'categoryName', direction: 'asc' });
  const [statusFirst, setStatusFirst] = useState('active'); // 'active' hoặc 'inactive'
  const [statusFilter, setStatusFilter] = useState(null); // null | true(active) | false(inactive)
  const [error, setError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(7);

  // States để quản lý các dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const fetchCategories = useCallback(async () => {
    console.log('Fetching categories...'); // Debug log
    await getAllCategories();
  }, []);

  useEffect(() => {
    console.log('ListCategory mounted, fetching categories...'); // Debug log
    fetchCategories();
  }, [fetchCategories]);

  const handleSort = (key) => {
    const isAsc = sortConfig.key === key && sortConfig.direction === 'asc';
    setSortConfig({ key, direction: isAsc ? 'desc' : 'asc' });
  };

  const handleUpdateStatus = async (id, currentStatus) => {
    if (!window.confirm(`Bạn có chắc muốn ${currentStatus === 'active' ? 'vô hiệu hóa' : 'kích hoạt'} danh mục này?`)) return;
    
    console.log(`Cập nhật trạng thái danh mục ${id}`);
    try {
      const response = await categoryAPI.toggleStatus(id);
      console.log('Toggle status response:', response);
      
      if (response.data && response.data.success) {
        // Refresh danh sách sau khi cập nhật thành công
        await fetchCategories();
      } else {
        setError(response.data?.message || "Không thể cập nhật trạng thái danh mục.");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
      setError(error.response?.data?.message || "Không thể cập nhật trạng thái danh mục.");
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
    console.log('Categories in filteredCategories:', categories); // Debug log
    console.log('Categories type:', typeof categories); // Debug log
    console.log('Is categories array:', Array.isArray(categories)); // Debug log
    
    // Đảm bảo categories là array trước khi spread và filter ra các item undefined/null
    const categoriesArray = Array.isArray(categories) ? categories.filter(cat => cat && typeof cat === 'object') : [];
    
    // Debug log để xem structure của từng category
    if (categoriesArray.length > 0) {
      console.log('First category structure:', categoriesArray[0]);
      console.log('All properties:', Object.keys(categoriesArray[0]));
      console.log('Category name field:', categoriesArray[0].categoryName || categoriesArray[0].name || categoriesArray[0].CategoryName);
    }
    
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
        const products = item?.products || item?.Products || item?.productList || item?.ProductList || item?.items || item?.Items || [];
        const productCount = products?.length || 0;
        // Khi có sản phẩm > 0 thì luôn là "Hoạt động", khi = 0 thì theo trạng thái backend
        const status = productCount > 0 ? 'active' : (item?.status || item?.isActive ? 'active' : 'inactive');
        
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
      } else {
        // Sorting by other fields
        if (sortConfig.key === 'categoryName') {
          // Sử dụng field name thực tế từ data
          aValue = (a.categoryName || a.name || a.CategoryName || '').toLowerCase();
          bValue = (b.categoryName || b.name || b.CategoryName || '').toLowerCase();
        } else {
          aValue = a[sortConfig.key] || '';
          bValue = b[sortConfig.key] || '';
        }
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
    console.log('Category object for details:', category);
    console.log('Products field:', category?.products);
    console.log('Products length:', category?.products?.length);
    console.log('All category properties:', Object.keys(category));
    
    setSelectedCategory(category);
    setIsDetailsDialogOpen(true);
    
    // Gọi API để lấy thông tin chi tiết với products
    try {
      const categoryId = category?.categoryID || category?.CategoryID || category?._id || category?.id;
      if (categoryId) {
        console.log('Fetching detailed category info for ID:', categoryId);
        const response = await categoryAPI.get(categoryId);
        console.log('Detailed category response:', response);
        
        if (response.data && response.data.success && response.data.data) {
          // Cập nhật selectedCategory với thông tin chi tiết
          setSelectedCategory(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching category details:', error);
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
                sx={{ fontWeight: 'bold' }}
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
                sx={{ fontWeight: 'bold' }}
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
              <TableCell sx={{ fontWeight: 'bold' }}>Mô tả</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Sản phẩm</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Trạng thái</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Hành động</TableCell>
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
                         <TableCell align="center" component="th" scope="row" sx={{ cursor: 'pointer' }}>
                           <Typography variant="body2" color="text.secondary">
                             {cat?.categoryID || cat?.CategoryID || cat?._id || cat?.id || 'N/A'}
                           </Typography>
                         </TableCell>
                        <TableCell sx={{ cursor: 'pointer' }}>
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
                        <TableCell sx={{maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer'}} title={cat?.description || 'Không có mô tả'}>
                          <Typography variant="body2" color="text.secondary">
                            {cat?.description || 'Không có mô tả'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ cursor: 'pointer' }}>
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            {(() => {
                              const products = cat?.products || cat?.Products || cat?.productList || cat?.ProductList || cat?.items || cat?.Items || [];
                              return products?.length || 0;
                            })()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ cursor: 'pointer' }}>
                          {(() => {
                            const products = cat?.products || cat?.Products || cat?.productList || cat?.ProductList || cat?.items || cat?.Items || [];
                            const productCount = products?.length || 0;
                            // Khi có sản phẩm > 0 thì luôn là "Hoạt động", khi = 0 thì theo trạng thái backend
                            const status = productCount > 0 ? 'active' : (cat?.status || cat?.isActive ? 'active' : 'inactive');
                            return renderStatusChip(status);
                          })()}
                        </TableCell>
                        <TableCell align="center" sx={{ cursor: 'pointer' }}>
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Button
                              variant="outlined"
                              color="warning"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditDialog(cat);
                              }}
                            >
                              Sửa
                            </Button>
                            {(() => {
                              const products = cat?.products || cat?.Products || cat?.productList || cat?.ProductList || cat?.items || cat?.Items || [];
                              const productCount = products?.length || 0;
                              
                              // Chỉ hiển thị nút khi sản phẩm = 0
                              if (productCount > 0) {
                                return null; // Không hiển thị nút khi có sản phẩm
                              }
                              
                              const status = cat?.status || cat?.isActive ? 'active' : 'inactive';
                              
                              return (
                                <Button
                                  variant="contained"
                                  color={status === 'active' ? "error" : "success"}
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(cat?.categoryID || cat?.CategoryID || cat?._id || cat?.id, status);
                                  }}
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
        onCategoryAdded={fetchCategories}
        onAdd={createCategory}
      />

      {selectedCategory && (
        <EditCategoryDialog
          open={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          category={selectedCategory}
          onCategoryUpdated={fetchCategories}
        />
      )}

      {/* Category Details Dialog */}
      {selectedCategory && (
        <Dialog 
          open={isDetailsDialogOpen} 
          onClose={() => setIsDetailsDialogOpen(false)} 
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle>
            Chi tiết danh mục: {selectedCategory?.name || selectedCategory?.categoryName || 'Không có tên'}
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  ID danh mục
                </Typography>
                <Typography variant="body1">
                  {selectedCategory?.categoryID || selectedCategory?.CategoryID || selectedCategory?._id || selectedCategory?.id || 'N/A'}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Tên danh mục
                </Typography>
                <Typography variant="body1">
                  {selectedCategory?.name || selectedCategory?.categoryName || selectedCategory?.CategoryName || 'Không có tên'}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Mô tả
                </Typography>
                <Typography variant="body1">
                  {selectedCategory?.description || 'Không có mô tả'}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Số sản phẩm
                </Typography>
                <Typography variant="body1" fontWeight="bold" color="primary">
                  {(() => {
                    const products = selectedCategory?.products || 
                                   selectedCategory?.Products || 
                                   selectedCategory?.productList || 
                                   selectedCategory?.ProductList ||
                                   selectedCategory?.items ||
                                   selectedCategory?.Items ||
                                   [];
                    
                    const productCount = products?.length || 0;
                    
                    // Hiển thị trạng thái dựa trên số sản phẩm
                    if (productCount > 0) {
                      return (
                        <span style={{ color: '#4caf50' }}>
                          {productCount} sản phẩm (Luôn hoạt động)
                        </span>
                      );
                    }
                    
                    return (
                      <span style={{ color: '#ff9800' }}>
                        {productCount} sản phẩm (Có thể kích hoạt/ngừng hoạt động)
                      </span>
                    );
                  })()}
                </Typography>
              </Box>
              
              {/* Hiển thị danh sách sản phẩm nếu có */}
              {(() => {
                const products = selectedCategory?.products || 
                               selectedCategory?.Products || 
                               selectedCategory?.productList || 
                               selectedCategory?.ProductList ||
                               selectedCategory?.items ||
                               selectedCategory?.Items ||
                               [];
                
                if (products && products.length > 0) {
                  return (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Danh sách sản phẩm
                      </Typography>
                      <Box sx={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {products.map((product, index) => (
                          <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                            • {product?.productName || product?.ProductName || product?.name || 'Tên không xác định'}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  );
                }
                return null;
              })()}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsDetailsDialogOpen(false)}>
              Đóng
            </Button>
          </DialogActions>
        </Dialog>
      )}
        </motion.div>
      </Container>
    </Box>
  );
}

export default ListCategory;