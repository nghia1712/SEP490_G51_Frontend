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
  Snackbar,
  Alert,
  Portal,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import warehouseAPI from "../../API/warehouseAPI";
import supllierAPI from "../../API/supplierAPI";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import getUserRoleFromToken from "../../Utils/getUserRoleFromToken";

/* ----------------- HÀM XỬ LÝ NGÀY ------------------ */
/* Hỗ trợ cả dd/MM/yyyy và yyyy-MM-dd */
const parseDate = (dateStr) => {
  if (!dateStr) return null;

  // Nếu format yyyy-MM-dd → JS parse được
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return new Date(dateStr);
  }

  // Nếu format dd/MM/yyyy → chuyển sang yyyy-MM-dd
  if (dateStr.includes("/")) {
    const [day, month, year] = dateStr.split("/");
    return new Date(`${year}-${month}-${day}`);
  }

  return new Date(dateStr);
};

const ProductLotsModal = ({ open, onClose, productName, lots, loading }) => {
  const [localLots, setLocalLots] = useState([]);
  const [editingLotId, setEditingLotId] = useState(null);
  const [updatingLotId, setUpdatingLotId] = useState(null);
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [supplierNames, setSupplierNames] = useState({});
  const [warehouseNames, setWarehouseNames] = useState({});
  useEffect(() => {
    const fetchNames = async () => {
      const supplierIds = [...new Set(localLots.map((lot) => lot.supplierID))];
      // Lấy tên supplier
      const supplierMap = {};
      for (const id of supplierIds) {
        try {
          const res = await supllierAPI.getById(id);
          supplierMap[id] = res.data?.data?.name || "Không xác định";
        } catch {
          supplierMap[id] = "Không xác định";
        }
      }
      setSupplierNames(supplierMap);
    };

    if (localLots.length > 0) fetchNames();
  }, [localLots]);

  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    const role = getUserRoleFromToken();
    setCanEdit(role === "sales_staff");
  }, []);

  useEffect(() => {
    setLocalLots(lots);
    setEditingLotId(null);
  }, [lots]);

  const handleSalePriceChange = (lotId, value) => {
    setLocalLots((prev) =>
      prev.map((lot) =>
        lot.lotID === lotId ? { ...lot, salePrice: value } : lot
      )
    );
  };

  const handleUpdateClick = async (lot) => {
    if (editingLotId !== lot.lotID) {
      setEditingLotId(lot.lotID);
      return;
    }

    if (isNaN(lot.salePrice) || lot.salePrice <= 0) {
      setSnack({
        open: true,
        message: "Giá bán không hợp lệ",
        severity: "error",
      });
      return;
    }

    if (lot.salePrice <= lot.inputPrice) {
      setSnack({
        open: true,
        message: "Giá bán phải lớn hơn giá nhập",
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
      setEditingLotId(null);
    } catch (err) {
      setSnack({
        open: true,
        message: "Cập nhật thất bại",
        severity: "error",
      });
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
          <span>
            Danh sách lô hàng của{" "}
            <Box
              component="span"
              sx={{ fontWeight: 700, color: "primary.main" }}
            >
              {productName}
            </Box>
          </span>

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
                <TableRow
                  sx={{
                    "& .MuiTableCell-root": {
                      whiteSpace: "nowrap",
                      fontWeight: 600,
                    },
                  }}
                >
                  <TableCell>Lô hàng</TableCell>
                  <TableCell>Ngày nhập</TableCell>
                  <TableCell align="right">Giá nhập</TableCell>
                  <TableCell align="right">Giá bán</TableCell>
                  <TableCell align="right">Số lượng</TableCell>
                  <TableCell>Hạn sử dụng</TableCell>
                  <TableCell>Vị trí kho</TableCell>
                  <TableCell>Nhà cung cấp</TableCell>
                  {/* <TableCell>Mã sản phẩm</TableCell> */}
                  <TableCell>Ngày kiểm tra cuối</TableCell>
                  {canEdit && <TableCell>Hành động</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {localLots.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={canEdit ? 11 : 10}
                      align="center"
                      sx={{ fontStyle: "italic", color: "#555" }}
                    >
                      Sản phẩm hiện không có sẵn trong kho
                    </TableCell>
                  </TableRow>
                ) : (
                  localLots.map((lot) => {
                    const inputDate = parseDate(lot.inputDate);
                    const expiredDate = parseDate(lot.expiredDate);
                    const lastChecked = parseDate(lot.lastCheckedDate);

                    return (
                      <TableRow key={lot.lotID}>
                        <TableCell>{lot.lotID}</TableCell>
                        <TableCell>
                          {inputDate
                            ? inputDate.toLocaleDateString("vi-VN")
                            : "-"}
                        </TableCell>
                        <TableCell align="right">
                          {lot.inputPrice?.toLocaleString("vi-VN")} ₫
                        </TableCell>
                        <TableCell align="right">
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
                            <span>
                              {lot.salePrice?.toLocaleString("vi-VN")} ₫
                            </span>
                          )}
                        </TableCell>
                        <TableCell align="right">{lot.lotQuantity}</TableCell>
                        <TableCell>
                          {expiredDate
                            ? expiredDate.toLocaleDateString("vi-VN")
                            : "-"}
                        </TableCell>
                        <TableCell>{lot.warehouseName}</TableCell>
                        <TableCell>
                          {supplierNames[lot.supplierID] || lot.supplierID}
                        </TableCell>
                        {/* <TableCell align="center">{lot.productID}</TableCell> */}
                        <TableCell>
                          {lastChecked && lastChecked.getFullYear() !== 1
                            ? lastChecked.toLocaleDateString("vi-VN")
                            : "-"}
                        </TableCell>
                        {canEdit && (
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
                        )}
                      </TableRow>
                    );
                  })
                )}
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
