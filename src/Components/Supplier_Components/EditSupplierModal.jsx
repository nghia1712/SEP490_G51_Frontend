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
} from "@mui/material";
import { Edit as EditIcon, Close as CloseIcon, Save as SaveIcon } from "@mui/icons-material";

const EditSupplierModal = ({
  open,
  onClose,
  formData,
  setFormData,
  formErrors,
  onSubmit,
  palette,
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
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: palette.medium,
          color: palette.dark,
          display: "flex",
          alignItems: "center",
          pb: 2,
        }}
      >
        <EditIcon sx={{ mr: 1 }} />
        Chỉnh sửa nhà cung cấp
        <IconButton
          onClick={onClose}
          sx={{
            ml: "auto",
            color: palette.dark,
            "&:hover": { backgroundColor: "rgba(0,0,0,0.1)" },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
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
          sx={{
            backgroundColor: palette.medium,
            color: palette.dark,
            "&:hover": {
              backgroundColor: palette.dark,
              color: palette.white,
            },
            borderRadius: 2,
            px: 3,
          }}
        >
          Cập nhật
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditSupplierModal;
