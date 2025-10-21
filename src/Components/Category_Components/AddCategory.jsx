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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Hàm để reset form khi dialog đóng hoặc sau khi lưu thành công
  const resetForm = () => {
    setCategoryName('');
    setDescription('');
    setError('');
    setLoading(false);
    setSuccess(false);
  };

  useEffect(() => {
    if (!open) {
      // Đảm bảo form luôn được reset khi dialog đóng lại
      const timer = setTimeout(() => resetForm(), 300); // Thêm delay nhỏ để tránh giật
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleSave = async () => {
    // Reset các state trước khi validate
    setError('');
    setSuccess(false);
    
    if (!categoryName.trim()) {
      setError("Tên danh mục không được để trống.");
      return; // Giữ nguyên màn hình với thông báo lỗi
    }
    
    if (categoryName.trim().length < 6) {
      setError("Thêm thất bại, tên danh mục phải có 6 ký tự trở lên");
      return; // Giữ nguyên màn hình với thông báo lỗi
    }
    
    setLoading(true);
    try {
      await onAdd({
        Name: categoryName,
        Description: description,
      });
      // Chỉ khi thành công mới hiển thị thông báo và đợi 3 giây
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        onClose(); // Đóng dialog sau 3 giây
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi thêm danh mục. Vui lòng thử lại.');
      setLoading(false);
      // Giữ nguyên màn hình với thông báo lỗi
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Thêm Danh Mục Mới</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">Thêm danh mục thành công!</Alert>}
          <TextField
            autoFocus
            label="Tên"
            fullWidth
            required
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="Nhập tên danh mục (tối thiểu 6 ký tự)"
          />
          <TextField
            label="Mô tả"
            fullWidth
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Nhập mô tả danh mục (tối đa 300 ký tự)"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: '16px 24px' }}>
        <Button onClick={onClose} disabled={loading || success} color="inherit">Hủy</Button>
        <Button onClick={handleSave} variant="contained" disabled={loading || success}>
          {loading ? <CircularProgress size={24} /> : success ? "Đã lưu" : "Lưu"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddCategoryDialog;