import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  IconButton,
  TextField,
  Button,
  Snackbar,
  Alert,
  Portal,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import warehouseAPI from "../../API/warehouseAPI";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";

const ProductLotsModal = ({ open, onClose, productName, lots, loading }) => {
  const [localLots, setLocalLots] = useState([]);
  const [editingLotId, setEditingLotId] = useState(null);
  const [updatingLotId, setUpdatingLotId] = useState(null);
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    setLocalLots(lots);
    setEditingLotId(null); // reset edit khi mở popup
  }, [lots]);

  const handleSalePriceChange = (lotId, value) => {
    setLocalLots((prev) =>
      prev.map((lot) =>
        lot.lotID === lotId ? { ...lot, salePrice: value } : lot
      )
    );
  };

  const handleUpdateClick = async (lot) => {
    // Bật chế độ edit nếu chưa edit
    if (editingLotId !== lot.lotID) {
      setEditingLotId(lot.lotID);
      return;
    }

    // Kiểm tra giá hợp lệ
    if (isNaN(lot.salePrice) || lot.salePrice <= 0) {
      setSnack({
        open: true,
        message: "Giá bán không hợp lệ",
        severity: "error",
      });
      return;
    }

    try {
      setUpdatingLotId(lot.lotID);
      await warehouseAPI.updateLotSalePrice(
        lot.warehouselocationID,
        lot.lotID,
        Number(lot.salePrice)
      );
      setSnack({
        open: true,
        message: "Cập nhật giá bán thành công",
        severity: "success",
      });
      setEditingLotId(null); // tắt chế độ edit sau khi lưu
    } catch (err) {
      setSnack({ open: true, message: "Cập nhật thất bại", severity: "error" });
    } finally {
      setUpdatingLotId(null);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth={false}
        sx={{
          "& .MuiDialog-paper": {
            width: "1400px",
            maxWidth: "1400px",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Danh sách lô của {productName}
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {loading ? (
            <CircularProgress />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Lô hàng</TableCell>
                  <TableCell>Ngày nhập</TableCell>
                  <TableCell>Giá nhập</TableCell>
                  <TableCell>Giá bán</TableCell>
                  <TableCell>Số lượng</TableCell>
                  <TableCell>Hạn sử dụng</TableCell>
                  <TableCell>Vị trí kho</TableCell>
                  <TableCell>Nhà cung cấp</TableCell>
                  <TableCell>Mã sản phẩm</TableCell>
                  <TableCell>Ngày kiểm tra cuối</TableCell>
                  <TableCell>Hành động</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {localLots.map((lot) => (
                  <TableRow key={lot.lotID}>
                    <TableCell>{lot.lotID}</TableCell>
                    <TableCell>
                      {new Date(lot.inputDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {lot.inputPrice?.toLocaleString("vi-VN")} ₫
                    </TableCell>

                    <TableCell>
                      {editingLotId === lot.lotID ? (
                        <TextField
                          size="small"
                          value={lot.salePrice}
                          onChange={(e) =>
                            handleSalePriceChange(lot.lotID, e.target.value)
                          }
                          disabled={updatingLotId === lot.lotID}
                          variant="outlined"
                          style={{ width: 80 }}
                        />
                      ) : (
                        <span>{lot.salePrice?.toLocaleString("vi-VN")} ₫</span>
                      )}
                    </TableCell>

                    <TableCell>{lot.lotQuantity}</TableCell>
                    <TableCell>
                      {new Date(lot.expiredDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{lot.warehouselocationID}</TableCell>
                    <TableCell>{lot.supplierID}</TableCell>
                    <TableCell>{lot.productID}</TableCell>
                    <TableCell>
                      {lot.lastCheckedDate &&
                      new Date(lot.lastCheckedDate).getFullYear() !== 1
                        ? new Date(lot.lastCheckedDate).toLocaleDateString()
                        : "-"}
                    </TableCell>

                    <TableCell>
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleUpdateClick(lot)}
                        disabled={updatingLotId === lot.lotID}
                      >
                        {editingLotId === lot.lotID ? (
                          <SaveIcon />
                        ) : (
                          <EditIcon />
                        )}
                      </IconButton>
                      {updatingLotId === lot.lotID && (
                        <CircularProgress size={20} sx={{ ml: 1 }} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      <Portal>
        <Snackbar
          open={snack.open}
          onClose={() => setSnack({ ...snack, open: false })}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          sx={{ zIndex: 999999999 }}
        >
          <Alert severity={snack.severity} variant="filled">
            {snack.message}
          </Alert>
        </Snackbar>
      </Portal>
    </>
  );
};

export default ProductLotsModal;
