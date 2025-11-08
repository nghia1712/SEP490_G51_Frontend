import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  CloudUpload,
  Business,
  CheckCircle,
  Error as ErrorIcon,
  Info
} from '@mui/icons-material';
import userAPI from '../../API/userAPI';

const CustomerAdditionalInfoForm = () => {
  const [formData, setFormData] = useState({
    mst: '',
    mshkd: '',
    address: '',
    imageCnkd: null
  });
  
  const [previews, setPreviews] = useState({
    imageCnkd: null
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [customerStatus, setCustomerStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [previewDialog, setPreviewDialog] = useState({ open: false, image: null, title: '' });

  // Kiểm tra trạng thái customer và load address khi component mount
  useEffect(() => {
    checkCustomerStatus();
    loadUserAddress();
  }, []);

  const checkCustomerStatus = async () => {
    try {
      setStatusLoading(true);
      const response = await userAPI.getCustomerStatus();
      setCustomerStatus(response.data.data);
    } catch (error) {
      console.error('Error checking customer status:', error);
      setError('Không thể kiểm tra trạng thái tài khoản');
    } finally {
      setStatusLoading(false);
    }
  };

  const loadUserAddress = async () => {
    try {
      const response = await userAPI.getProfile();
      const profile = response.data?.data || response.data;
      if (profile?.address || profile?.Address) {
        setFormData(prev => ({
          ...prev,
          address: profile.address || profile.Address || ''
        }));
      }
    } catch (error) {
      console.error('Error loading user address:', error);
      // Không hiển thị lỗi nếu không load được address, chỉ để trống
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chọn file ảnh hợp lệ');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Kích thước file không được vượt quá 5MB');
        return;
      }

      setFormData(prev => ({
        ...prev,
        [name]: file
      }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => ({
          ...prev,
          [name]: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate form
      if (!formData.mst || !formData.mshkd) {
        throw new Error('Vui lòng nhập đầy đủ mã số thuế và mã số kinh doanh');
      }

      if (!formData.address || formData.address.trim() === '') {
        throw new Error('Vui lòng nhập địa chỉ');
      }

      if (formData.address.length > 256) {
        throw new Error('Địa chỉ không được vượt quá 256 ký tự');
      }

      if (!formData.imageCnkd) {
        throw new Error('Vui lòng upload ảnh chứng nhận kinh doanh');
      }

      // Validate MST and MSHKD format (10 digits)
      if (!/^\d{10}$/.test(formData.mst)) {
        throw new Error('Mã số thuế phải có đúng 10 chữ số');
      }

      if (!/^\d{10}$/.test(formData.mshkd)) {
        throw new Error('Mã số kinh doanh phải có đúng 10 chữ số');
      }

      // Upload image chứng nhận kinh doanh
      const imageCnkdResponse = await userAPI.uploadBusinessCertificate(formData.imageCnkd);

      if (!imageCnkdResponse.data.success) {
        throw new Error('Lỗi khi upload ảnh chứng nhận kinh doanh');
      }

      // Submit additional info
      const submitData = {
        mst: parseInt(formData.mst),
        mshkd: parseInt(formData.mshkd),
        address: formData.address.trim(),
        imageCnkd: imageCnkdResponse.data.data
      };

      const response = await userAPI.submitAdditionalInfo(submitData);
      
      if (response.data.success || response.data.data) {
        setSuccess(response.data.message || 'Gửi thông tin thành công');
        // Refresh customer status
        await checkCustomerStatus();
        // Reset form (giữ lại address)
        setFormData(prev => ({
          mst: '',
          mshkd: '',
          address: prev.address, // Giữ lại address
          imageCnkd: null
        }));
        setPreviews({
          imageCnkd: null
        });
      } else {
        throw new Error(response.data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      setError(error.message || 'Có lỗi xảy ra khi submit thông tin');
    } finally {
      setLoading(false);
    }
  };

  const openPreview = (image, title) => {
    setPreviewDialog({ open: true, image, title });
  };

  const closePreview = () => {
    setPreviewDialog({ open: false, image: null, title: '' });
  };

  if (statusLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Nếu customer đã submit thông tin bổ sung, hiển thị trạng thái
  if (customerStatus && !customerStatus.needsAdditionalInfo) {
    return (
      <Box maxWidth="800px" mx="auto" p={3}>
        <Card>
          <CardContent>
            <Box textAlign="center" mb={3}>
              <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Thông tin đã được gửi
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {customerStatus.message}
              </Typography>
            </Box>
            
            {customerStatus.userStatus === 'Inactive' && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Lưu ý quan trọng:</strong> Thông tin của bạn đang chờ manager duyệt. 
                  <strong> Bạn sẽ không thể truy cập vào hệ thống cho đến khi được duyệt.</strong>
                  Manager sẽ xem xét thông tin MST, MSHKD và hình ảnh đính kèm của bạn.
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box maxWidth="800px" mx="auto" p={3}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom textAlign="center" color="primary">
            Đăng Ký Thông Tin Bổ Sung
          </Typography>
          
          <Typography variant="body1" color="text.secondary" textAlign="center" mb={4}>
            Để sử dụng đầy đủ các tính năng của hệ thống, bạn cần bổ sung thông tin mã số thuế và mã số kinh doanh
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Mã số thuế */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Mã số thuế"
                  name="mst"
                  value={formData.mst}
                  onChange={handleInputChange}
                  placeholder="Nhập 10 chữ số"
                  inputProps={{ maxLength: 10 }}
                  required
                  helperText="Mã số thuế phải có đúng 10 chữ số"
                />
              </Grid>

              {/* Mã số kinh doanh */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Mã số kinh doanh"
                  name="mshkd"
                  value={formData.mshkd}
                  onChange={handleInputChange}
                  placeholder="Nhập 10 chữ số"
                  inputProps={{ maxLength: 10 }}
                  required
                  helperText="Mã số kinh doanh phải có đúng 10 chữ số"
                />
              </Grid>

              {/* Địa chỉ */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Địa chỉ"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Nhập địa chỉ của bạn"
                  inputProps={{ maxLength: 256 }}
                  required
                  multiline
                  rows={3}
                  helperText="Địa chỉ không được vượt quá 256 ký tự"
                />
              </Grid>

              {/* Upload ảnh chứng nhận kinh doanh */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Ảnh Chứng Nhận Kinh Doanh
                  </Typography>
                  
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="imageCnkd"
                      type="file"
                      onChange={(e) => handleFileChange(e)}
                      name="imageCnkd"
                    />
                    <label htmlFor="imageCnkd">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<CloudUpload />}
                        disabled={loading}
                      >
                        Chọn ảnh
                      </Button>
                    </label>
                    
                    {formData.imageCnkd && (
                      <Typography variant="body2" color="success.main">
                        ✓ {formData.imageCnkd.name}
                      </Typography>
                    )}
                  </Box>

                  {previews.imageCnkd && (
                    <Box>
                      <img
                        src={previews.imageCnkd}
                        alt="Preview"
                        style={{
                          maxWidth: '200px',
                          maxHeight: '200px',
                          cursor: 'pointer',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                        onClick={() => openPreview(previews.imageCnkd, 'Ảnh Chứng Nhận Kinh Doanh')}
                      />
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Submit button */}
              <Grid item xs={12}>
                <Box textAlign="center">
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
                  >
                    {loading ? 'Đang xử lý...' : 'Gửi Thông Tin'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewDialog.open} onClose={closePreview} maxWidth="md" fullWidth>
        <DialogTitle>{previewDialog.title}</DialogTitle>
        <DialogContent>
          <Box textAlign="center">
            <img
              src={previewDialog.image}
              alt="Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '500px',
                objectFit: 'contain'
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closePreview}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerAdditionalInfoForm;
