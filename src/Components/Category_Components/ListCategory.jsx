// File: ListCategory.js
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Container, Box, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Checkbox, IconButton, Stack, Alert, ButtonGroup,
  Dialog, DialogTitle, DialogContent, DialogActions, TableSortLabel,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';

// MUI Icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';

// Import các dialog đã tạo
import AddCategoryDialog from './AddCategory';
import EditCategoryDialog from './EditCategory';

import useCategory from '../../Hooks/useCategory';
function ListCategory() {
  const { categories, getAllCategories, createCategory, inactivateCategory } = useCategory();
  const [filterText, setFilterText] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'categoryName', direction: 'asc' });
  const [statusFirst, setStatusFirst] = useState('active'); // 'active' hoặc 'inactive'
  const [statusFilter, setStatusFilter] = useState(null); // null | true(active) | false(inactive)
  const [error, setError] = useState(null);

  // States để quản lý các dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubcategoryDialogOpen, setIsSubcategoryDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const fetchCategories = useCallback(async () => {
    await getAllCategories();
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSort = (key) => {
    const isAsc = sortConfig.key === key && sortConfig.direction === 'asc';
    setSortConfig({ key, direction: isAsc ? 'desc' : 'asc' });
  };

  const handleUpdateStatus = async (id, currentStatus) => {
    if (!window.confirm(`Bạn có chắc muốn ${currentStatus === 'active' ? 'vô hiệu hóa' : 'kích hoạt'} danh mục này?`)) return;
    
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    console.log(`Cập nhật trạng thái danh mục ${id} thành ${newStatus}`);
    try {
      await inactivateCategory(id, { status: newStatus });
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
      setError("Không thể cập nhật trạng thái danh mục.");
    }
  };

  const filteredCategories = useMemo(() => {
    let sortableItems = [...categories];

    // Lọc theo text
    if (filterText) {
      sortableItems = sortableItems.filter(item =>
        item.categoryName.toLowerCase().includes(filterText.toLowerCase())
      );
    }
    // Lọc theo trạng thái (nếu có)
    if (statusFilter !== null) {
      sortableItems = sortableItems.filter(item => item.status === (statusFilter ? 'active' : 'inactive'));
    }
    
    // Sắp xếp theo cột
    sortableItems.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    // Sắp xếp ưu tiên trạng thái
    sortableItems.sort((a, b) => {
      if (a.status === statusFirst && b.status !== statusFirst) return -1;
      if (a.status !== statusFirst && b.status === statusFirst) return 1;
      return 0;
    });

    return sortableItems;
  }, [categories, filterText, sortConfig, statusFirst]);

  const handleOpenEditDialog = (category) => {
    setSelectedCategory(category);
    setIsEditDialogOpen(true);
  };

  const handleOpenSubcategoryDialog = (category) => {
    setSelectedCategory(category);
    setIsSubcategoryDialogOpen(true);
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
      <Container maxWidth={false} disableGutters sx={{ p: { xs: 1, sm: 2, md: 3 }, position: 'relative', zIndex: 1, pt: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" color="white" fontWeight="bold" sx={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)', mb: 2 }}>
            Quản Lý Danh Mục
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between" sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsAddDialogOpen(true)}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
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
                variant={statusFilter === true ? 'contained' : 'outlined'}
                sx={{
                  backgroundColor: statusFilter === true ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.5)' },
                }}
              >
                Kích Hoạt
              </Button>
              <Button
                onClick={() => setStatusFilter(false)}
                variant={statusFilter === false ? 'contained' : 'outlined'}
                sx={{
                  backgroundColor: statusFilter === false ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.5)' },
                }}
              >
                Vô Hiệu
              </Button>
              <Button
                onClick={() => setStatusFilter(null)}
                variant={statusFilter === null ? 'contained' : 'outlined'}
                sx={{
                  backgroundColor: statusFilter === null ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.5)' },
                }}
              >
                Tất Cả
              </Button>
            </ButtonGroup>
          </Stack>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Paper sx={{ width: '100%', overflow: 'hidden', backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)' }}>
            <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sortDirection={sortConfig.key === 'categoryName' ? sortConfig.direction : false}>
                <TableSortLabel
                  active={sortConfig.key === 'categoryName'}
                  direction={sortConfig.key === 'categoryName' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('categoryName')}
                >
                  Tên danh mục
                  {sortConfig.key === 'categoryName' ? (<Box component="span" sx={visuallyHidden}>{sortConfig.direction}</Box>) : null}
                </TableSortLabel>
              </TableCell>
              <TableCell>Danh mục con</TableCell>
              <TableCell>
                 <Stack direction="row" alignItems="center">
                    <Typography variant="body2" sx={{ mr: 1 }}>Trạng thái</Typography>
                    <Checkbox
                        checked={statusFirst === 'active'}
                        onChange={(e) => setStatusFirst(e.target.checked ? 'active' : 'inactive')}
                        title={statusFirst === 'active' ? "Ưu tiên Kích hoạt" : "Ưu tiên Vô hiệu"}
                    />
                 </Stack>
              </TableCell>
              <TableCell>Mô tả</TableCell>
              <TableCell align="center">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCategories.map((cat) => (
              <TableRow key={cat._id} hover>
                <TableCell component="th" scope="row">
                  <Typography variant="body1" fontWeight="medium">{cat.categoryName}</Typography>
                </TableCell>
                <TableCell>
                  {cat.classifications.length > 0 ? (
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2">{cat.classifications[0].name}</Typography>
                        {cat.classifications.length > 1 &&
                            <IconButton size="small" onClick={() => handleOpenSubcategoryDialog(cat)} title="Xem tất cả">
                                <VisibilityIcon fontSize='small' />
                            </IconButton>
                        }
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">Không có</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Box component="span" sx={{ color: 'white', bgcolor: cat.status === 'active' ? 'success.main' : 'error.main', p: '4px 10px', borderRadius: '16px', display: 'inline-block', fontSize: '0.75rem', fontWeight: 'bold', textAlign: 'center' }}>
                    {cat.status === 'active' ? 'Kích Hoạt' : 'Vô Hiệu'}
                  </Box>
                </TableCell>
                <TableCell sx={{maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={cat.description}>
                  {cat.description}
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Button
                      variant="outlined"
                      color="warning"
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenEditDialog(cat)}
                    >
                      Sửa
                    </Button>
                    <Button
                      variant="outlined"
                      color={cat.status === 'active' ? "error" : "success"}
                      size="small"
                      onClick={() => handleUpdateStatus(cat._id, cat.status)}
                    >
                      {cat.status === 'active' ? "Vô hiệu" : "Kích hoạt"}
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
        </Paper>

      {/* --- Dialogs --- */}
      <AddCategoryDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
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

      {selectedCategory && (
         <Dialog open={isSubcategoryDialogOpen} onClose={() => setIsSubcategoryDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Danh mục con của "{selectedCategory.name}"</DialogTitle>
            <DialogContent dividers>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Tên</TableCell>
                                <TableCell>Mô tả</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {selectedCategory.classifications.map((sub) => (
                                <TableRow key={sub._id}>
                                    <TableCell>{sub.name}</TableCell>
                                    <TableCell>{sub.description}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setIsSubcategoryDialogOpen(false)}>Đóng</Button>
            </DialogActions>
        </Dialog>
      )}
      </Container>
    </Box>
  );
}

export default ListCategory;