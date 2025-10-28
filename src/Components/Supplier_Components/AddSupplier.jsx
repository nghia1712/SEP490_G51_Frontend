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
  IconButton,
  Alert,
} from "@mui/material";
import { Add as AddIcon, Save as SaveIcon } from "@mui/icons-material";

const AddSupplier = ({
  open,
  onClose,
  formData,
  setFormData,
  formErrors,
  onSubmit,
  palette,
  loading = false,
  successMessage = '',
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          backgroundColor: "#ffffff",
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: "#ffffff",
          color: "#000000",
          display: "flex",
          alignItems: "center",
          pb: 2,
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <AddIcon sx={{ mr: 1 }} />
        Thêm nhà cung cấp mới
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        {console.log("AddSupplier formErrors:", formErrors)}
        {console.log("AddSupplier formData:", formData)}
        {console.log("AddSupplier successMessage:", successMessage)}
        {console.log("formErrors.submit:", formErrors.submit)}
        {console.log("successMessage exists:", !!successMessage)}
        {console.log("Should show error:", !!formErrors.submit)}
        {console.log("Should show success:", !!successMessage)}
        {formErrors.submit && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formErrors.submit}
          </Alert>
        )}
        {successMessage && !formErrors.submit && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 2,
              backgroundColor: '#e8f5e8 !important',
              color: '#2e7d32 !important',
              border: '1px solid #4caf50 !important',
              '& .MuiAlert-icon': {
                color: '#2e7d32 !important'
              },
              '& .MuiAlert-message': {
                color: '#2e7d32 !important'
              }
            }}
          >
            {successMessage}
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
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Số tài khoản ngân hàng"
              value={formData.bankAccountNumber}
              onChange={(e) => {
                console.log("Bank account number changed to:", e.target.value);
                console.log("Current formData:", formData);
                setFormData({ ...formData, bankAccountNumber: e.target.value });
              }}
              error={!!formErrors.bankAccountNumber}
              helperText={formErrors.bankAccountNumber}
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
              label="Số nợ của tôi"
              value={formData.myDebt}
              onChange={(e) => setFormData({ ...formData, myDebt: e.target.value })}
              error={!!formErrors.myDebt}
              helperText={formErrors.myDebt}
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
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3, backgroundColor: "#f8fafc" }}>
        <Button
          onClick={onClose}
          sx={{
            color: "text.secondary",
            "&:hover": { backgroundColor: "grey.100" },
          }}
        >
          Hủy
        </Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          startIcon={<SaveIcon />}
          disabled={loading}
          sx={{
            backgroundColor: palette.dark,
            "&:hover": {
              backgroundColor: palette.medium,
              color: palette.dark,
            },
            borderRadius: 2,
            px: 3,
          }}
        >
          {loading ? "Đang tạo..." : "Thêm nhà cung cấp"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddSupplier;
