import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Divider
} from '@mui/material';
import {
  CloudUpload,
  Business,
  CheckCircle,
  Error as ErrorIcon,
  Info,
  HealthAndSafety,
  Description
} from '@mui/icons-material';
import userAPI from '../../API/userAPI';
import notificationAPI from '../../API/notificationAPI';

const steps = ['Thông tin cơ bản', 'Upload tài liệu', 'Xác nhận'];

const CustomerAdditionalInfoForm = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    mst: '',
    mshkd: '',
    imageCnkd: null,
    imageByt: null
  });
  
  const [previews, setPreviews] = useState({
    imageCnkd: null,
    imageByt: null
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [customerStatus, setCustomerStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [previewDialog, setPreviewDialog] = useState({ open: false, image: null, title: '' });
  const [declineReason, setDeclineReason] = useState('');
  const [declineNotificationId, setDeclineNotificationId] = useState(null);

  useEffect(() => {
    checkCustomerStatus();
    fetchDeclineNotification();
  }, []);

  const checkCustomerStatus = async () => {
    try {
      setStatusLoading(true);
      const response = await userAPI.getCustomerStatus();
      setCustomerStatus(response.data.data);
    } catch (error) {
      console.error('Error checking customer status:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  const fetchDeclineNotification = async () => {
    try {
      const response = await notificationAPI.getUserNotifications();
      const notifications = response?.data?.data || response?.data || [];
      if (Array.isArray(notifications)) {
        const declineNoti = notifications.find((n) => {
          const title = n.title || n.Title;
          const isRead = n.isRead ?? n.IsRead;
          // Chỉ quan tâm tới thông báo từ chối chưa đọc
          return title === 'Thông báo phản hồi duyệt tài khoản' && isRead === false;
        });

        if (declineNoti) {
          const msg = declineNoti.message || declineNoti.Message || '';
          setDeclineReason(msg);
          setDeclineNotificationId(declineNoti.id || declineNoti.Id);
        } else {
          setDeclineReason('');
          setDeclineNotificationId(null);
        }
      } else {
        setDeclineReason('');
        setDeclineNotificationId(null);
      }
    } catch (error) {
      console.error('Error loading decline notification:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Chỉ cho phép nhập số
    if (name === 'mst' || name === 'mshkd') {
      const numericValue = value.replace(/\D/g, '');
      // Cho phép nhập từ 9 đến 13 chữ số, nhưng không chặn khi người dùng chưa đủ 9 số
      if (numericValue.length <= 13) {
        setFormData(prev => ({
          ...prev,
          [name]: numericValue
        }));
      }
    } else {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chọn file ảnh hợp lệ (JPG, PNG, etc.)');
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
      setError(''); // Clear error when file is selected
    }
  };

  const validateStep = (step) => {
    setError('');
    
    if (step === 0) {
      // Validate step 1: Thông tin cơ bản
      if (!formData.mst || formData.mst.length < 9 || formData.mst.length > 13) {
        setError('Mã số thuế phải có từ 9 đến 13 chữ số');
        return false;
      }
      if (!formData.mshkd || formData.mshkd.length < 9 || formData.mshkd.length > 13) {
        setError('Mã số kinh doanh phải có từ 9 đến 13 chữ số');
        return false;
      }
    } else if (step === 1) {
      // Validate step 2: Upload tài liệu
      if (!formData.imageCnkd) {
        setError('Vui lòng upload ảnh Chứng nhận kinh doanh');
        return false;
      }
      if (!formData.imageByt) {
        setError('Vui lòng upload ảnh Chứng nhận của Bộ Y tế');
        return false;
      }
    }
    
    return true;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Final validation
      if (!validateStep(0) || !validateStep(1)) {
        setActiveStep(0);
        return;
      }

      // Prepare data for API
      const submitData = {
        mst: formData.mst,
        mshkd: formData.mshkd,
        imageCnkd: formData.imageCnkd,
        imageByt: formData.imageByt
      };

      const response = await userAPI.updateCustomerProfile(submitData);

      if (response.data.success || response.data.data || response.status === 200) {
        // Nếu có thông báo từ chối trước đó thì đánh dấu đã đọc,
        // để lần đăng nhập sau không bị trả về form nữa
        if (declineNotificationId) {
          try {
            await notificationAPI.markAsRead(declineNotificationId);
          } catch (markErr) {
            console.error('Error marking decline notification as read:', markErr);
          }
        }

        // Sau khi cập nhật thành công, chuyển sang màn hình chờ duyệt
        await checkCustomerStatus();
        navigate('/customer-unauthenticated', { replace: true });
      } else {
        throw new Error(response.data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setError(
        error.response?.data?.message || 
        error.message || 
        'Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại.'
      );
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
  if (customerStatus && !customerStatus.needsAdditionalInfo && !declineReason) {
    return (
      <Box maxWidth="900px" mx="auto" p={3}>
        <Card>
          <CardContent>
            <Box textAlign="center" mb={3}>
              <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Thông tin đã được gửi
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={3}>
                {customerStatus.message || 'Thông tin của bạn đã được gửi thành công.'}
              </Typography>
            </Box>
            
            {customerStatus.userStatus === 'Inactive' && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Lưu ý quan trọng:</strong> Thông tin của bạn đang chờ admin duyệt. 
                  <strong> Bạn sẽ không thể truy cập vào hệ thống cho đến khi được duyệt.</strong>
                  Admin sẽ xem xét thông tin MST, MSHKD và hình ảnh đính kèm của bạn.
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>
      </Box>
    );
  }

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
  return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
                Thông tin mã số
          </Typography>
              <Divider sx={{ mb: 3 }} />
            </Grid>
            
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
              label="Mã số thuế (MST)"
                  name="mst"
                  value={formData.mst}
                  onChange={handleInputChange}
                placeholder="Nhập 9 - 13 chữ số"
                  required
                helperText="Mã số thuế phải có từ 9 đến 13 chữ số"
              error={
                  formData.mst.length > 0 &&
                  (formData.mst.length < 9 || formData.mst.length > 13)
                }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
              label="Mã số hộ kinh doanh (MSHKD)"
                  name="mshkd"
                  value={formData.mshkd}
                  onChange={handleInputChange}
                placeholder="Nhập 9 - 13 chữ số"
                  required
                helperText="Mã số kinh doanh phải có từ 9 đến 13 chữ số"
              error={
                  formData.mshkd.length > 0 &&
                  (formData.mshkd.length < 9 || formData.mshkd.length > 13)
                }
                />
              </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
              <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                <CloudUpload sx={{ mr: 1, verticalAlign: 'middle' }} />
                Upload tài liệu
              </Typography>
              <Divider sx={{ mb: 3 }} />
              </Grid>

              {/* Upload ảnh chứng nhận kinh doanh */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Business color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Chứng nhận kinh doanh
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Upload ảnh chứng nhận đăng ký kinh doanh
                  </Typography>
                  
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
                    variant={formData.imageCnkd ? "outlined" : "contained"}
                        component="span"
                    fullWidth
                        startIcon={<CloudUpload />}
                        disabled={loading}
                    sx={{ mb: 2 }}
                      >
                    {formData.imageCnkd ? 'Thay đổi ảnh' : 'Chọn ảnh'}
                      </Button>
                    </label>
                    
                    {formData.imageCnkd && (
                  <Box>
                    <Typography variant="body2" color="success.main" mb={1}>
                        ✓ {formData.imageCnkd.name}
                      </Typography>
                  {previews.imageCnkd && (
                      <Box
                        component="img"
                        src={previews.imageCnkd}
                        alt="Preview CNKD"
                        onClick={() => openPreview(previews.imageCnkd, 'Chứng nhận kinh doanh')}
                        sx={{
                          width: '100%',
                          maxHeight: '200px',
                          objectFit: 'contain',
                          cursor: 'pointer',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          mt: 1
                        }}
                      />
                    )}
                    </Box>
                  )}
                </Paper>
              </Grid>

            {/* Upload ảnh chứng nhận Bộ Y tế */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <HealthAndSafety color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Chứng nhận Bộ Y tế
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Upload ảnh chứng nhận của Bộ Y tế
                </Typography>
                
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="imageByt"
                  type="file"
                  onChange={(e) => handleFileChange(e)}
                  name="imageByt"
                />
                <label htmlFor="imageByt">
                  <Button
                    variant={formData.imageByt ? "outlined" : "contained"}
                    component="span"
                    fullWidth
                    startIcon={<CloudUpload />}
                    disabled={loading}
                    sx={{ mb: 2 }}
                  >
                    {formData.imageByt ? 'Thay đổi ảnh' : 'Chọn ảnh'}
                  </Button>
                </label>
                
                {formData.imageByt && (
                  <Box>
                    <Typography variant="body2" color="success.main" mb={1}>
                      ✓ {formData.imageByt.name}
                    </Typography>
                    {previews.imageByt && (
                      <Box
                        component="img"
                        src={previews.imageByt}
                        alt="Preview BYT"
                        onClick={() => openPreview(previews.imageByt, 'Chứng nhận Bộ Y tế')}
                        sx={{
                          width: '100%',
                          maxHeight: '200px',
                          objectFit: 'contain',
                          cursor: 'pointer',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          mt: 1
                        }}
                      />
                    )}
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom color="primary" mb={3}>
              <CheckCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
              Xác nhận thông tin
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Mã số thuế:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formData.mst}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Mã số hộ kinh doanh:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formData.mshkd}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Ảnh CNKD:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="success.main">
                    ✓ Đã upload
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Ảnh BYT:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="success.main">
                    ✓ Đã upload
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Vui lòng kiểm tra lại thông tin trước khi gửi. Sau khi gửi, thông tin của bạn sẽ được gửi đến admin để duyệt.
              </Typography>
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box maxWidth="1000px" mx="auto" p={3}>
      <Card elevation={3}>
        <CardContent>
          <Box textAlign="center" mb={4}>
            <Typography variant="h4" gutterBottom color="primary" fontWeight="bold">
              Đăng Ký Thông Tin Bổ Sung
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Để sử dụng đầy đủ các tính năng của hệ thống, bạn cần bổ sung thông tin mã số thuế và mã số kinh doanh
            </Typography>
          </Box>

          {declineReason && (
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="body2">
                {declineReason}
              </Typography>
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box component="form" onSubmit={handleSubmit}>
            {renderStepContent(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0 || loading}
                onClick={handleBack}
                variant="outlined"
              >
                Quay lại
              </Button>
              
              {activeStep === steps.length - 1 ? (
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
                  sx={{
                    backgroundColor: '#155E64',
                    '&:hover': {
                      backgroundColor: '#104c50',
                    },
                  }}
                >
                  {loading ? 'Đang xử lý...' : 'Gửi thông tin'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  sx={{
                    backgroundColor: '#155E64',
                    '&:hover': {
                      backgroundColor: '#104c50',
                    },
                  }}
                >
                  Tiếp theo
                  </Button>
              )}
                </Box>
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
