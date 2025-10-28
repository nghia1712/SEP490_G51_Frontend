import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Modal,
  Grid,
  CircularProgress,
} from "@mui/material";
import useWarehouse from "../../Hooks/useWarehouse";
import renderStatusChip from "../../Utils/renderStatusChip";

const WarehouseDetails = ({ open, onClose, warehouse }) => {
  const { getWarehouseDetails, loading } = useWarehouse();
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);

  // Load warehouse details when modal opens
  useEffect(() => {
    if (open && warehouse) {
      const loadDetails = async () => {
        try {
          const details = await getWarehouseDetails(warehouse.id);
          setSelectedWarehouse({ ...warehouse, ...details });
        } catch (error) {
          console.error("Lỗi khi lấy chi tiết warehouse:", error);
          // Fallback: hiển thị thông tin cơ bản nếu không lấy được chi tiết
          setSelectedWarehouse(warehouse);
        }
      };
      loadDetails();
    }
  }, [open, warehouse, getWarehouseDetails]);

  const handleClose = () => {
    setSelectedWarehouse(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="warehouse-details-modal"
      aria-describedby="warehouse-details-description"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "90%", sm: 600 },
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <Typography
          id="warehouse-details-modal"
          variant="h5"
          component="h2"
          sx={{ mb: 3, fontWeight: "bold", color: "#1976d2" }}
        >
          Chi tiết kho
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : selectedWarehouse ? (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Tên kho
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedWarehouse.name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Trạng thái
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {renderStatusChip(selectedWarehouse.status === 1 ? "active" : "inactive")}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Địa chỉ
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedWarehouse.address}
                </Typography>
              </Grid>
              {selectedWarehouse.warehouseLocationLists && selectedWarehouse.warehouseLocationLists.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Danh sách vị trí kho ({selectedWarehouse.warehouseLocationLists.length} vị trí)
                  </Typography>
                  <Box sx={{ maxHeight: 200, overflow: "auto", border: "1px solid #e0e0e0", borderRadius: 1, p: 1 }}>
                    {selectedWarehouse.warehouseLocationLists.map((location, index) => (
                      <Box key={location.id} sx={{ mb: 1, p: 1, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
                        <Typography variant="body2">
                          Vị trí {index + 1}: Hàng {location.rowNo}, Cột {location.columnNo}, Tầng {location.levelNo}
                          <span style={{ marginLeft: 8, color: location.status === 1 ? "#4caf50" : "#f44336" }}>
                            ({location.status === 1 ? "Hoạt động" : "Ngừng hoạt động"})
                          </span>
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        ) : (
          <Typography variant="body1" color="textSecondary">
            Không có thông tin để hiển thị
          </Typography>
        )}

        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            onClick={handleClose}
            sx={{
              px: 3,
              backgroundColor: "#1976d2",
              "&:hover": { backgroundColor: "#1565c0" },
            }}
          >
            Đóng
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default WarehouseDetails;
