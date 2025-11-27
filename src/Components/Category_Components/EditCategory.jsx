// File: EditCategory.js
import React, { useState, useEffect } from 'react';
import categoryAPI from '../../API/categoryAPI';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Stack, Alert, CircularProgress,
} from '@mui/material';

const EditCategoryDialog = ({
  open,
  onClose,
  category,
  onCategoryUpdated,
  categories = [],
}) => {
  const [formData, setFormData] = useState({ categoryName: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && category) {
      console.log('EditCategoryDialog - category object:', category);
      console.log('Category fields:', Object.keys(category));
      
      // Thử nhiều field name khác nhau cho tên danh mục
      const categoryName = category.name || 
                          category.categoryName || 
                          category.CategoryName || 
                          category.Name || '';
      
      // Thử nhiều field name khác nhau cho mô tả
      const description = category.description || 
                         category.Description || '';
      
      console.log('Using categoryName:', categoryName);
      console.log('Using description:', description);
      
      setFormData({
        categoryName: categoryName,
        description: description,
      });
    } else {
      // Reset khi dialog đóng
      setFormData({ categoryName: '', description: '' });
      setError('');
      setLoading(false);
    }
  }, [open, category]);


  const handleSave = async () => {
    if (!formData.categoryName.trim()) {
      setError("Tên danh mục không được để trống.");
      return;
    }

    const normalizedNewName = formData.categoryName.trim().toLowerCase();
    const currentCategoryId =
      category.categoryID ||
      category.CategoryID ||
      category.id ||
      category.Id ||
      category._id ||
      0;

    const isDuplicate = categories.some((cat) => {
      const existingId =
        cat?.categoryID ||
        cat?.CategoryID ||
        cat?.id ||
        cat?.Id ||
        cat?._id ||
        0;
      if (existingId === currentCategoryId) return false;
      const existingName =
        (cat?.name ||
          cat?.categoryName ||
          cat?.CategoryName ||
          cat?.Name ||
          "") +
        "";
      return existingName.trim().toLowerCase() === normalizedNewName;
    });

    if (isDuplicate) {
      setError("Tên danh mục đã tồn tại.");
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Thử nhiều field name khác nhau cho CategoryID
      const categoryId = currentCategoryId;
      
      console.log('Using CategoryID:', categoryId);
      
      const payload = {
        CategoryID: categoryId,
        Name: formData.categoryName,
        Description: formData.description,
      };
      
      console.log('Sending payload:', payload);
      
      await categoryAPI.update(payload);
      onCategoryUpdated && onCategoryUpdated();
      onClose && onClose();
    } catch (err) {
      console.error('Error updating category:', err);
      setError(err.response?.data?.message || 'Lỗi khi cập nhật danh mục.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
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
                value={formData.categoryName || ''}
                onChange={(e) => setFormData({...formData, categoryName: e.target.value})}
              />
              <TextField
                label="Mô tả"
                fullWidth
                multiline
                rows={3}
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </Stack>
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={onClose} disabled={loading} color="inherit">Hủy</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Lưu Thay Đổi"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EditCategoryDialog;