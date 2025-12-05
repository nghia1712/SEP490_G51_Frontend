import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Divider,
} from "@mui/material";

const AddSupplier = ({
  open,
  onClose,
  formData,
  setFormData,
  formErrors,
  onSubmit,
  palette,
  loading = false,
  successMessage = "",
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Thêm nhà cung cấp mới</DialogTitle>
      <Divider sx={{ opacity: 0.5 }} />
      <DialogContent sx={{ p: 3 }}>
        {(() => {
          // Debug: log values để kiểm tra
          if (successMessage) {
            console.log('Rendering success message:', successMessage);
            console.log('formErrors:', formErrors);
            console.log('formErrors.submit:', formErrors?.submit);
          }
          return null;
        })()}
        {successMessage && !formErrors?.submit && (
          <Alert 
            severity="success"
            sx={{ 
              mb: 2,
            }}
          >
            {successMessage}
          </Alert>
        )}
        {formErrors?.submit && !successMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formErrors.submit}
          </Alert>
        )}
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Tên nhà cung cấp"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={!!formErrors.name}
              helperText={formErrors.name}
              required
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": {
                    borderColor: palette.dark,
                  },
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: palette.dark,
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Số điện thoại"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              error={!!formErrors.contact}
              helperText={formErrors.contact}
              required
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": {
                    borderColor: palette.dark,
                  },
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: palette.dark,
                },
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={!!formErrors.email}
              helperText={formErrors.email}
              required
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": {
                    borderColor: palette.dark,
                  },
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: palette.dark,
                },
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Địa chỉ"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              error={!!formErrors.address}
              helperText={formErrors.address}
              required
              multiline
              rows={2}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": {
                    borderColor: palette.dark,
                  },
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: palette.dark,
                },
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Mô tả (tùy chọn)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": {
                    borderColor: palette.dark,
                  },
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: palette.dark,
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel sx={{ "&.Mui-focused": { color: palette.dark } }}>
                Trạng thái
              </InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                label="Trạng thái"
                sx={{
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: palette.dark,
                  },
                }}
              >
                <MenuItem value="active">Còn cung cấp</MenuItem>
                <MenuItem value="inactive">Ngừng cung cấp</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <Divider sx={{ opacity: 0.5 }} />
      <DialogActions sx={{ p: "16px 24px" }}>
        <Button
          onClick={onClose}
          disabled={loading || !!successMessage}
          sx={{ color: "#000" }}
          variant="text"
        >
          Hủy
        </Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? "Đang tạo..." : "Thêm nhà cung cấp"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddSupplier;
