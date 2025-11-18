// src/Pages/WarehouseDetailPage/Location/AddWarehouseLocation.jsx
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
import useWarehouseLocation from "../../../Hooks/useWarehouseLocation";

const AddWarehouseLocation = ({ open, onClose, onSuccess, warehouseId }) => {
  const { createWarehouseLocation, loading } = useWarehouseLocation();

  const [locationName, setLocationName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!locationName.trim()) {
      setError("Tên vị trí là bắt buộc");
      return;
    }
    setError("");

    const success = await createWarehouseLocation({
      warehouseId,
      locationName: locationName.trim(),
    });

    if (success) {
      setLocationName("");
      onClose();
      if (onSuccess) onSuccess();
    }
  };

  const handleClose = () => {
    setLocationName("");
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
        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", color: "#1976d2" }}>
          Thêm vị trí kho
        </Typography>

        <TextField
          fullWidth
          label="Tên vị trí"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          error={!!error}
          helperText={error}
          sx={{ mb: 3 }}
        />

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
            {loading ? <CircularProgress size={20} /> : "Thêm"}
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
};

export default AddWarehouseLocation;
