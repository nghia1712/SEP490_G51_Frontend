// File: AddCategory.js
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Stack, Box, Typography, IconButton, Alert, CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const AddCategoryDialog = ({ open, onClose, onCategoryAdded, onAdd }) => {
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [subcategories, setSubcategories] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Hàm để reset form khi dialog đóng hoặc sau khi lưu thành công
  const resetForm = () => {
    setCategoryName('');
    setDescription('');
    setSubcategories([]);
    setError('');
    setLoading(false);
  };

  useEffect(() => {
    if (!open) {
      // Đảm bảo form luôn được reset khi dialog đóng lại
      const timer = setTimeout(() => resetForm(), 300); // Thêm delay nhỏ để tránh giật
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleAddSubcategory = () => {
    // Kiểm tra xem có danh mục con nào chưa điền tên không
    if (subcategories.some(sub => !sub.name.trim())) {
      setError("Vui lòng điền tên cho các danh mục con hiện có trước khi thêm mới.");
      return;
    }
    setSubcategories([...subcategories, { name: '', description: '' }]);
    setError(''); // Xóa lỗi nếu có
  };

  const handleUpdateSubcategory = (index, key, value) => {
    const updated = [...subcategories];
    updated[index][key] = value;
    setSubcategories(updated);
  };

  const handleRemoveSubcategory = (index) => {
    setSubcategories(subcategories.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!categoryName.trim()) {
      setError("Tên danh mục không được để trống.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onAdd({
        categoryName,
        description,
        // Chỉ gửi các danh mục con có tên, loại bỏ các dòng trống
        classifications: subcategories.filter(sub => sub.name.trim()),
      });
      onClose(); // Đóng dialog
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi thêm danh mục. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Thêm Danh Mục Mới</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            autoFocus
            label="Tên danh mục"
            fullWidth
            required
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          />
          <TextField
            label="Mô tả"
            fullWidth
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
                    <TableRow key={index}>
                      <TableCell><TextField variant="standard" fullWidth placeholder="Tên" value={sub.name} onChange={(e) => handleUpdateSubcategory(index, 'name', e.target.value)} /></TableCell>
                      <TableCell><TextField variant="standard" fullWidth placeholder="Mô tả ngắn" value={sub.description} onChange={(e) => handleUpdateSubcategory(index, 'description', e.target.value)} /></TableCell>
                      <TableCell align="right"><IconButton size="small" color="error" onClick={() => handleRemoveSubcategory(index)}><DeleteIcon /></IconButton></TableCell>
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
          {loading ? <CircularProgress size={24} /> : "Lưu"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddCategoryDialog;