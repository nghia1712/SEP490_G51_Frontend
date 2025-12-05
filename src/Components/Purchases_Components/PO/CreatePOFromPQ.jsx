import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  IconButton,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import usePQ from "../../../Hooks/usePQ";
import { useNavigate } from "react-router-dom";
import prfqApi from "../../../API/prfqAPI";

export default function CreatePOFromPQ() {
  const {
    quotations,
    quotationToCreatePo,
    openCreatePO,
    changeQuantity,
    removeItem,
    snackbar,
    setSnackbar,
  } = usePQ();
  const navigate = useNavigate();

  const [selectedPQId, setSelectedPQId] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSelectPQ = (qid) => {
    setSelectedPQId(qid);
    const q = quotations.find((item) => item.quotationId === qid);
    setSelectedSupplier({
      name: q?.supplierName,
      email: q?.supplierEmail,
      phoneNumber: q?.supplierPhone,
      address: q?.supplierAddress,
    });
    openCreatePO(qid);
  };

  const [sending, setSending] = useState(false);

  const handleCreatePO = async (status) => {
    if (!quotationToCreatePo || sending) return;

    setSending(true);

    // Chuyển đổi ngày sang ISO 8601
    const payload = {
      qid: Number(quotationToCreatePo.quotationId),
      details: quotationToCreatePo.items.map((item) => {
        let dateISO = null;
        if (item.productDate) {
          const parts = item.productDate.split("/");
          if (parts.length === 3) {
            const [day, month, year] = parts;
            dateISO = new Date(`${year}-${month}-${day}`).toISOString();
          } else {
            dateISO = new Date(item.productDate).toISOString();
          }
        }
        return {
          productID: Number(item.productID),
          date: dateISO,
          quantity: Number(item.quantity),
        };
      }),
      status: Number(status),
    };

    try {
      // Gọi API
      await prfqApi.createFromQuotation(payload);

      setSnackbar({
        open: true,
        message:
          status === 6 ? "Gửi yêu cầu thành công!" : "Tạo bản nháp thành công!",
        severity: "success",
      });

      setTimeout(() => {
        navigate("/po");
      }, 900);
    } catch (err) {
      console.error("❌ Lỗi tạo PO:", err.response?.data || err);
      setSnackbar({
        open: true,
        message:
          status === 6 ? "Gửi yêu cầu thất bại" : "Tạo bản nháp thất bại",
        severity: "error",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        Tạo đơn hàng
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        {/* Chọn PQ */}
        <FormControl fullWidth size="small" sx={{ mb: 3, width: 200 }}>
          <InputLabel>Chọn báo giá</InputLabel>
          <Select
            value={selectedPQId}
            label="Chọn báo giá"
            onChange={(e) => handleSelectPQ(e.target.value)}
          >
            {quotations.map((q) => (
              <MenuItem key={q.quotationId} value={q.quotationId}>
                PQ-{q.quotationId}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Danh sách sản phẩm */}
        <TableContainer
          component={Paper}
          sx={{ borderRadius: 2, maxHeight: 500 }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mt: 2,
            }}
          >
            <Typography sx={{ fontWeight: "bold" }}>
              Danh sách sản phẩm:
            </Typography>

            <Button
              color="info"
              onClick={() => openCreatePO(quotationToCreatePo?.quotationId)}
              disabled={processing}
            >
              {processing ? <CircularProgress size={20} /> : "Tải lại"}
            </Button>
          </Box>

          <Table size="small" stickyHeader>
            <TableHead
              sx={{
                backgroundColor: "#f5f5f5",
                "& .MuiTableCell-root": { fontWeight: "bold" },
              }}
            >
              <TableRow>
                <TableCell>Tên sản phẩm</TableCell>
                <TableCell>Mô tả</TableCell>
                <TableCell>ĐVT</TableCell>
                <TableCell align="right">Đơn giá</TableCell>
                <TableCell>Thuế</TableCell>
                <TableCell>Số lượng</TableCell>
                <TableCell>Gợi ý</TableCell>
                <TableCell>Tối thiểu</TableCell>
                <TableCell>Hiện tại</TableCell>
                <TableCell>Tối đa</TableCell>
                <TableCell>Hạn dùng</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {(quotationToCreatePo?.items || []).length > 0 ? (
                quotationToCreatePo.items.map((item, i) => (
                  <TableRow key={i} sx={{ height: 60 }}>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell
                      sx={{
                        maxWidth: 200,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={item.productDescription}
                    >
                      {item.productDescription}
                    </TableCell>
                    <TableCell align="center">{item.productUnit}</TableCell>
                    <TableCell align="right">
                      {item.unitPrice?.toLocaleString()} đ
                    </TableCell>
                    <TableCell align="center">{item.tax * 100} %</TableCell>
                    <TableCell
                      align="center"
                      sx={{ position: "relative", pb: 3 }}
                    >
                      <TextField
                        size="small"
                        type="number"
                        value={item.quantity === 0 ? "" : item.quantity}
                        onChange={(e) => {
                          const val = e.target.value;
                          const newQty = val === "" ? "" : Number(val);

                          const oldQty = quotationToCreatePo.items[i].quantity;
                          const limit = item.maxQty * 5;

                          // Không cho nhập < 1 (trừ khi empty)
                          if (newQty !== "" && newQty < 1) {
                            changeQuantity(i, 1);
                            return;
                          }

                          // Nếu vượt quá LIMIT → reset về oldQty
                          if (newQty > limit) {
                            setSnackbar({
                              open: true,
                              message: `Số lượng "${item.productName}" chỉ có thể nhập tối đa ${limit} (5 lần số lượng tối đa).`,
                              severity: "error",
                            });

                            changeQuantity(i, oldQty);

                            return;
                          }

                          changeQuantity(i, newQty);

                          if (newQty > item.suggestedQty) {
                            setSnackbar({
                              open: true,
                              message: `Số lượng "${item.productName}" vượt quá số lượng gợi ý (${item.suggestedQty})`,
                              severity: "warning",
                            });
                          }
                        }}
                        sx={{ width: 100, position: "relative" }}
                        disabled={processing}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {item.suggestedQty ?? "-"}
                    </TableCell>
                    <TableCell align="center">{item.minQty ?? "-"}</TableCell>
                    <TableCell align="center">
                      {item.currentQty ?? "-"}
                    </TableCell>
                    <TableCell align="center">{item.maxQty ?? "-"}</TableCell>
                    <TableCell align="center">{item.productDate}</TableCell>
                    <TableCell align="center">
                      <IconButton color="error" onClick={() => removeItem(i)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={12} align="center">
                    Không có sản phẩm nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Nút thao tác */}
        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}
        >
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => handleCreatePO(0)}
            disabled={!quotationToCreatePo?.items?.length || sending}
          >
            {sending ? <CircularProgress size={20} /> : "Lưu nháp"}
          </Button>
          <Button
            variant="contained"
            onClick={() => handleCreatePO(6)}
            disabled={!quotationToCreatePo?.items?.length || sending}
          >
            {sending ? <CircularProgress size={20} /> : "Gửi yêu cầu"}
          </Button>
        </Box>
      </Paper>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity || "info"}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
