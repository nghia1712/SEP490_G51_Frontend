import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  CircularProgress,
  Modal,
  MenuItem,
} from "@mui/material";
import useWarehouse from "../../Hooks/useWarehouse";

const EditWarehouse = ({ open, onClose, warehouse, onSuccess }) => {
  const { updateWarehouse, loading } = useWarehouse();
  
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    status: "active",
  });
  const [formErrors, setFormErrors] = useState({});

  // Update form data when warehouse prop changes
  useEffect(() => {
    if (warehouse) {
      setFormData({
        name: warehouse.name || "",
        address: warehouse.address || "",
        status: warehouse.status === 1 ? "active" : "inactive",
      });
    }
  }, [warehouse]);

  // Form validation
  const validateForm = (data) => {
    const errors = {};

    if (!data.name.trim()) errors.name = "Tên kho là bắt buộc";
    if (!data.address.trim()) errors.address = "Địa chỉ là bắt buộc";

    return errors;
  };

  // Handle form submission
  const handleSubmit = async () => {
    const errors = validateForm(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    
    try {
      // Chỉ gửi các trường cần thiết cho UpdateWarehouse DTO
      const updateData = {
        id: warehouse.id,
        name: formData.name,
        address: formData.address,
        status: formData.status === "active" ? 1 : 0 // Convert to number as required by backend
      };
      
      const success = await updateWarehouse(updateData);
      
      if (success) {
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật warehouse:", error);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      address: "",
      status: "active",
    });
    setFormErrors({});
    onClose();
  };

  if (!warehouse) return null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="edit-warehouse-modal"
      aria-describedby="edit-warehouse-description"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "90%", sm: 500 },
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <Typography
          id="edit-warehouse-modal"
          variant="h5"
          component="h2"
          sx={{ mb: 3, fontWeight: "bold", color: "#ff9800" }}
        >
          Chỉnh sửa kho
        </Typography>

        <Box component="form" noValidate>
          <TextField
            fullWidth
            label="Tên kho"
            name="name"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            error={!!formErrors.name}
            helperText={formErrors.name}
            sx={{ mb: 2 }}
            required
          />

          <TextField
            fullWidth
            label="Địa chỉ"
            name="address"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            error={!!formErrors.address}
            helperText={formErrors.address}
            sx={{ mb: 2 }}
            required
          />

          <TextField
            fullWidth
            select
            label="Trạng thái"
            name="status"
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
            sx={{ mb: 3 }}
          >
            <MenuItem value="active">Hoạt động</MenuItem>
            <MenuItem value="inactive">Ngừng hoạt động</MenuItem>
          </TextField>

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={handleClose}
              sx={{ px: 3 }}
            >
              Hủy
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              sx={{
                px: 3,
                backgroundColor: "#ff9800",
                "&:hover": { backgroundColor: "#f57c00" },
              }}
            >
              {loading ? <CircularProgress size={20} /> : "Cập nhật"}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Modal>
  );
};

export default EditWarehouse;
