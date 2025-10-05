// File: EditCategory.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Stack, Box, Typography, IconButton, Alert, CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const EditCategoryDialog = ({ open, onClose, category, onCategoryUpdated }) => {
  const [formData, setFormData] = useState({ categoryName: '', description: '' });
  const [subcategories, setSubcategories] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // Lưu ID của sub cần xóa

  useEffect(() => {
    if (open && category) {
      setFormData({
        categoryName: category.categoryName,
        description: category.description,
      });
      // Tạo bản sao sâu để tránh thay đổi state gốc khi người dùng chỉnh sửa
      setSubcategories(JSON.parse(JSON.stringify(category.classifications || [])));
    } else {
      // Reset khi dialog đóng
      setError('');
      setLoading(false);
      setConfirmDelete(null);
    }
  }, [open, category]);

  const handleAddSubcategory = () => {
    if (subcategories.some(sub => !sub.name.trim())) {
      setError("Vui lòng điền tên cho các danh mục con hiện có trước khi thêm mới.");
      return;
    }
    setSubcategories([...subcategories, { _id: `temp_${Date.now()}`, name: "", description: "" }]);
    setError('');
  };

  const handleUpdateSubcategory = (index, key, value) => {
    const updated = [...subcategories];
    updated[index][key] = value;
    setSubcategories(updated);
  };

  const handleTriggerDelete = (subId) => {
    setConfirmDelete(subId);
  };

  const handleConfirmDelete = async () => {
    const subIdToDelete = confirmDelete;
    if (!subIdToDelete) return;

    // Nếu là sub mới (chưa có _id từ DB), chỉ xóa khỏi state
    if (subIdToDelete.toString().startsWith("temp_")) {
      setSubcategories(subcategories.filter(sub => sub._id !== subIdToDelete));
      setConfirmDelete(null);
      return;
    }

    // Nếu là sub đã có, gọi API để xóa
    try {
      await axios.delete(`http://localhost:9999/categories/${category._id}/sub/delete/${subIdToDelete}`);
      setSubcategories(subcategories.filter(sub => sub._id !== subIdToDelete));
    } catch (error) {
      setError("Lỗi khi xóa danh mục con. Vui lòng thử lại.");
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleSave = async () => {
    if (!formData.categoryName.trim()) {
      setError("Tên danh mục không được để trống.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      // 1. Cập nhật thông tin danh mục cha
      await axios.put(`http://localhost:9999/categories/updateCategory/${category._id}`, formData);

      // 2. Xử lý danh mục con (thêm mới hoặc cập nhật)
      for (const sub of subcategories) {
        if (sub.name.trim()) { // Chỉ xử lý nếu có tên
          if (sub._id.toString().startsWith("temp_")) { // Thêm mới
            await axios.post(`http://localhost:9999/categories/${category._id}/sub/add`, { name: sub.name, description: sub.description });
          } else { // Cập nhật
            await axios.put(`http://localhost:9999/categories/${category._id}/sub/update/${sub._id}`, { name: sub.name, description: sub.description });
          }
        }
      }
      onCategoryUpdated(); // Refresh danh sách
      onClose(); // Đóng dialog
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi cập nhật danh mục.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>Chỉnh Sửa Danh Mục</DialogTitle>
        <DialogContent dividers>
          {/* Giao diện tương tự AddCategoryDialog */}
           <Stack spacing={3} sx={{ pt: 1 }}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                autoFocus
                label="Tên danh mục"
                fullWidth
                required
                value={formData.categoryName}
                onChange={(e) => setFormData({...formData, categoryName: e.target.value})}
              />
              <TextField
                label="Mô tả"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
              <Box>
                <Typography variant="h6" gutterBottom>Danh mục con</Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tên danh mục con</TableCell>
                        <TableCell>Mô tả</TableCell>
                        <TableCell align="right">Hành động</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {subcategories.map((sub, index) => (
                        <TableRow key={sub._id}>
                          <TableCell><TextField variant="standard" fullWidth value={sub.name} onChange={(e) => handleUpdateSubcategory(index, 'name', e.target.value)} /></TableCell>
                          <TableCell><TextField variant="standard" fullWidth value={sub.description} onChange={(e) => handleUpdateSubcategory(index, 'description', e.target.value)} /></TableCell>
                          <TableCell align="right"><IconButton size="small" color="error" onClick={() => handleTriggerDelete(sub._id)}><DeleteIcon /></IconButton></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Button startIcon={<AddIcon />} onClick={handleAddSubcategory} sx={{ mt: 1 }}>
                  Thêm dòng
                </Button>
              </Box>
            </Stack>
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={onClose} disabled={loading} color="inherit">Hủy</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Lưu Thay Đổi"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog xác nhận xóa */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} maxWidth="xs">
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>Bạn có chắc chắn muốn xóa danh mục con này không?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Hủy</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">Xóa</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EditCategoryDialog;