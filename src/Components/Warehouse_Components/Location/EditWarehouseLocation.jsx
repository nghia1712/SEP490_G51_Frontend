// src/Pages/WarehouseDetailPage/Location/EditWarehouseLocation.jsx
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
import useWarehouseLocation from "../../../Hooks/useWarehouseLocation";

const EditWarehouseLocation = ({ open, onClose, onSuccess, location }) => {
  const { updateWarehouseLocation, loading } = useWarehouseLocation();

  const [formData, setFormData] = useState({
    locationName: "",
    status: true,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (location) {
      setFormData({
        locationName: location.locationName || "",
        status: location.status ?? true,
      });
    }
  }, [location]);

  const handleSubmit = async () => {
    if (!formData.locationName.trim()) {
      setError("Tên vị trí là bắt buộc");
      return;
    }
    setError("");

    const success = await updateWarehouseLocation({
      id: location.id,
      locationName: formData.locationName.trim(),
      status: formData.status,
    });

    if (success) {
      onClose();
      if (onSuccess) onSuccess();
    }
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "90%", sm: 400 },
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
        }}
      >
        <Typography
          variant="h6"
          sx={{ mb: 2, fontWeight: "bold", color: "#1976d2" }}
        >
          Chỉnh sửa vị trí kho
        </Typography>

        <TextField
          fullWidth
          label="Tên vị trí"
          value={formData.locationName}
          onChange={(e) =>
            setFormData({ ...formData, locationName: e.target.value })
          }
          error={!!error}
          helperText={error}
          sx={{ mb: 2 }}
        />

        <TextField
          select
          fullWidth
          label="Trạng thái"
          value={formData.status.toString()}
          onChange={(e) =>
            setFormData({ ...formData, status: e.target.value === "true" })
          }
          sx={{ mb: 3 }}
        >
          <MenuItem value="true">Còn cung cấp</MenuItem>
          <MenuItem value="false">Ngừng cung cấp</MenuItem>
        </TextField>

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button variant="outlined" onClick={handleClose}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            sx={{
              backgroundColor: "#1976d2",
              "&:hover": { backgroundColor: "#1565c0" },
            }}
          >
            {loading ? <CircularProgress size={20} /> : "Lưu"}
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
};

export default EditWarehouseLocation;
