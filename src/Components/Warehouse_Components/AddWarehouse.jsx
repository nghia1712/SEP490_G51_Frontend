import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  CircularProgress,
  Modal,
} from "@mui/material";
import useWarehouse from "../../Hooks/useWarehouse";

const AddWarehouse = ({ open, onClose, onSuccess }) => {
  const { createWarehouse, loading } = useWarehouse();
  
  const [formData, setFormData] = useState({
    name: "",
    address: "",
  });
  const [formErrors, setFormErrors] = useState({});

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
      // Chỉ gửi các trường cần thiết cho CreateWarehouse DTO
      const createData = {
        name: formData.name,
        address: formData.address
      };
      
      const success = await createWarehouse(createData);
      
      if (success) {
        // Reset form
        setFormData({
          name: "",
          address: "",
        });
        setFormErrors({});
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error("Lỗi khi tạo warehouse:", error);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      address: "",
    });
    setFormErrors({});
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="add-warehouse-modal"
      aria-describedby="add-warehouse-description"
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
          id="add-warehouse-modal"
          variant="h5"
          component="h2"
          sx={{ mb: 3, fontWeight: "bold", color: "#1976d2" }}
        >
          Thêm kho mới
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
            sx={{ mb: 3 }}
            required
          />

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
                backgroundColor: "#1976d2",
                "&:hover": { backgroundColor: "#1565c0" },
              }}
            >
              {loading ? <CircularProgress size={20} /> : "Thêm kho"}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Modal>
  );
};

export default AddWarehouse;
