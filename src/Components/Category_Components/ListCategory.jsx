// File: ListCategory.js
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Container, Box, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Checkbox, IconButton, Stack, Alert,
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
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Stack direction={{xs: 'column', sm: 'row'}} justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          Quản Lý Danh Mục
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIsAddDialogOpen(true)}>
          Tạo mới
        </Button>
      </Stack>

      <Box sx={{ mb: 2 }}>
        <TextField
          label="Tìm theo tên danh mục"
          variant="outlined"
          size="small"
          fullWidth
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
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
                  <Box
                    sx={{
                      bgcolor: cat.status === 'active' ? 'success.light' : 'error.light',
                      color: 'white',
                      p: '4px 8px',
                      borderRadius: '12px',
                      display: 'inline-block',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}
                  >
                    {cat.status === "active" ? "Kích hoạt" : "Vô hiệu"}
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
  );
}

export default ListCategory;