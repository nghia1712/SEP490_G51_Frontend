import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Container,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import warehouseLocationApi from "../../API/warehouseLocationAPI";
import warehouseApi from "../../API/warehouseAPI";
import renderStatusChip from "../../Utils/renderStatusChip";

export default function WarehouseLocationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [openInventoryModal, setOpenInventoryModal] = useState(false);
  const [openPriceModal, setOpenPriceModal] = useState(false);
  const [selectedLot, setSelectedLot] = useState(null);
  const [physicalQty, setPhysicalQty] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    const loadLocation = async () => {
      setLoading(true);
      try {
        const res = await warehouseLocationApi.getDetail(id);
        setLocation(res.data.data);
        setError(null);
      } catch (err) {
        console.error("Lỗi khi tải chi tiết location:", err);
        setError("Không thể tải chi tiết location");
      } finally {
        setLoading(false);
      }
    };
    loadLocation();
  }, [id]);

  const handleInventoryCheck = (lot) => {
    setSelectedLot(lot);
    setPhysicalQty(lot.lotQuantity);
    setOpenInventoryModal(true);
  };

  const handleChangePrice = (lot) => {
    setSelectedLot(lot);
    setNewPrice(lot.salePrice);
    setOpenPriceModal(true);
  };

  const submitInventoryCheck = async () => {
    if (!selectedLot?.lotID || !physicalQty) {
      setSnackbar({
        open: true,
        message: "Vui lòng nhập số lượng thực tế",
        severity: "error",
      });
      return;
    }

    const whlcid = location?.locationID || Number(id);
    console.log("Gửi cập nhật kiểm kê vật lý:", {
      whlcid,
      payload: [
        {
          lotID: Number(selectedLot.lotID),
          realQuantity: Number(physicalQty),
          note: selectedLot?.note || "",
        },
      ],
    });

    try {
      await warehouseApi.updatePhysicalInventory(whlcid, [
        {
          lotID: Number(selectedLot.lotID),
          realQuantity: Number(physicalQty),
          note: selectedLot?.note || "",
        },
      ]);

      setSnackbar({
        open: true,
        message: "Cập nhật kiểm kê thành công",
        severity: "success",
      });
      setOpenInventoryModal(false);

      const res = await warehouseLocationApi.getDetail(id);
      setLocation(res.data.data);
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message:
          err?.response?.data?.message || err?.message || "Cập nhật thất bại",
        severity: "error",
      });
    }
  };

  const submitChangePrice = async () => {
    if (!selectedLot?.lotID || !newPrice) {
      setSnackbar({
        open: true,
        message: "Vui lòng nhập giá bán mới",
        severity: "error",
      });
      return;
    }
    const whlcid = location?.locationID || Number(id);
    console.log("Gửi cập nhật giá bán:", {
      whlcid,
      lotID: selectedLot.lotID,
      newPrice: Number(newPrice),
    });

    try {
      await warehouseApi.updateLotSalePrice(
        whlcid,
        selectedLot.lotID,
        Number(newPrice)
      );

      setSnackbar({
        open: true,
        message: "Cập nhật giá bán thành công",
        severity: "success",
      });
      setOpenPriceModal(false);

      // refresh lại dữ liệu
      const res = await warehouseLocationApi.getDetail(id);
      setLocation(res.data.data);
    } catch (err) {
      console.error(err);

      const apiMsg =
        err?.response?.data?.message || err?.message || "Cập nhật thất bại";

      setSnackbar({
        open: true,
        message: apiMsg,
        severity: "error",
      });
    }
  };

  const InfoRow = ({ label, value }) => (
    <Box>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 500 }}>
        {value ?? "-"}
      </Typography>
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ pt: 4, pb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} color="primary">
          🔙
        </IconButton>
        <Typography variant="h5" component="span" sx={{ ml: 1 }}>
          Quay lại
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : location ? (
        <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
          <Card sx={{ borderRadius: 2, width: "1500px" }}>
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ mb: 1, color: "#1976d2" }}>
                  Chi tiết vị trí: {location.locationName}
                </Typography>
                {renderStatusChip(location.status ? "active" : "inactive")}
              </Box>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4, mb: 3 }}>
                <Typography variant="body1">
                  <strong>Số lô sản phẩm:</strong>{" "}
                  {location.lotProduct?.length || 0}
                </Typography>
                <Typography variant="body1">
                  <strong>Tổng số lượng:</strong>{" "}
                  {location.lotProduct?.reduce(
                    (sum, lot) => sum + lot.lotQuantity,
                    0
                  ) || 0}
                </Typography>
              </Box>

              <Typography variant="h6" sx={{ mb: 2 }}>
                Danh sách lô sản phẩm
              </Typography>

              <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Sản phẩm</TableCell>
                      <TableCell>Nhà cung cấp</TableCell>
                      <TableCell>Số lượng</TableCell>
                      <TableCell>Giá nhập</TableCell>
                      <TableCell>Giá bán</TableCell>
                      <TableCell>Ngày nhập</TableCell>
                      <TableCell>Hạn sử dụng</TableCell>
                      <TableCell>Chênh lệch</TableCell>
                      <TableCell>Ghi chú</TableCell>
                      <TableCell>Hành động</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {location.lotProduct && location.lotProduct.length > 0 ? (
                      location.lotProduct.map((lot, index) => (
                        <TableRow key={lot.lotID} hover>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{lot.productName}</TableCell>
                          <TableCell>{lot.supplierName}</TableCell>
                          <TableCell>{lot.lotQuantity}</TableCell>
                          <TableCell>
                            {lot.inputPrice.toLocaleString()} đ
                          </TableCell>
                          <TableCell>
                            {lot.salePrice.toLocaleString()} đ
                          </TableCell>
                          <TableCell>
                            {new Date(lot.inputDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {new Date(lot.expiredDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell align="center">
                            {lot.diffQuantity}
                          </TableCell>
                          <TableCell>{lot.note || "-"}</TableCell>
                          <TableCell>
                            <Tooltip title="Kiểm kê">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleInventoryCheck(lot)}
                              >
                                <Inventory2Icon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Thay đổi giá">
                              <IconButton
                                size="small"
                                color="secondary"
                                onClick={() => handleChangePrice(lot)}
                              >
                                <AttachMoneyIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={11} align="center">
                          Không có lô sản phẩm nào
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      ) : (
        <Typography>Không có dữ liệu</Typography>
      )}

      <Dialog
        open={openInventoryModal}
        onClose={() => setOpenInventoryModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Kiểm kê lô: {selectedLot?.productName}</DialogTitle>

        <DialogContent sx={{ mt: 1 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              rowGap: 1.5,
              columnGap: 3,
              mb: 2,
            }}
          >
            <InfoRow label="Nhà cung cấp" value={selectedLot?.supplierName} />
            <InfoRow
              label="Ngày nhập"
              value={new Date(selectedLot?.inputDate).toLocaleDateString()}
            />
            <InfoRow
              label="Hạn sử dụng"
              value={new Date(selectedLot?.expiredDate).toLocaleDateString()}
            />
            <InfoRow
              label="Tồn kho hiện tại"
              value={selectedLot?.lotQuantity}
            />
          </Box>

          <TextField
            label="Số lượng thực tế"
            type="number"
            fullWidth
            value={physicalQty}
            onChange={(e) => setPhysicalQty(e.target.value)}
          />
          <TextField
            label="Ghi chú"
            fullWidth
            multiline
            rows={3}
            sx={{ mt: 2 }}
            value={selectedLot?.note || ""}
            onChange={(e) =>
              setSelectedLot({ ...selectedLot, note: e.target.value })
            }
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenInventoryModal(false)}>Hủy</Button>
          <Button variant="contained" onClick={submitInventoryCheck}>
            Cập nhật
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openPriceModal}
        onClose={() => setOpenPriceModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Thay đổi giá lô: {selectedLot?.productName}</DialogTitle>

        <DialogContent sx={{ mt: 1 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              rowGap: 1.5,
              columnGap: 3,
              mb: 2,
            }}
          >
            <InfoRow label="Nhà cung cấp" value={selectedLot?.supplierName} />
            <InfoRow
              label="Tồn kho hiện tại"
              value={selectedLot?.lotQuantity}
            />
            <InfoRow
              label="Ngày nhập"
              value={new Date(selectedLot?.inputDate).toLocaleDateString()}
            />
            <InfoRow
              label="Hạn sử dụng"
              value={new Date(selectedLot?.expiredDate).toLocaleDateString()}
            />
            <InfoRow
              label="Giá nhập"
              value={selectedLot?.inputPrice.toLocaleString() + " đ"}
            />
            <InfoRow
              label="Giá bán hiện tại"
              value={selectedLot?.salePrice.toLocaleString() + " đ"}
            />
          </Box>

          <TextField
            label="Giá bán mới"
            type="number"
            fullWidth
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenPriceModal(false)}>Hủy</Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={submitChangePrice}
          >
            Cập nhật
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar thông báo */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
