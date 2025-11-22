import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Stack,
  TextField,
  Button,
  IconButton,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  FormHelperText,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import useStockExport from "../../../Hooks/useStockExport";
import salesOrderAPI from "../../../API/salesOrderAPI";

export default function StockExportForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [originalDetails, setOriginalDetails] = useState([]);

  const {
    data: stockDetail,
    loading: loadingStock,
    createOrder,
    updateOrder,
    sendOrder,
    getOrderInfor,
  } = useStockExport(id);

  const [loading, setLoading] = useState(false);
  const [salesOrderList, setSalesOrderList] = useState([]);
  const [form, setForm] = useState({
    salesOrderId: "",
    dueDate: "",
    details: [],
  });
  const [errors, setErrors] = useState({});
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    console.log("StockExport ID nhận được:", id);
    console.log("SalesOrderId từ state:", location.state?.salesOrderId);
  }, [id, location]);

  const fetchSalesOrders = async () => {
    try {
      const res = await salesOrderAPI.listNotDelivered();
      const allOrders = res.data?.data || [];
      const filteredOrders = allOrders.filter((o) => o.isDeposited === true);
      setSalesOrderList(filteredOrders);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSalesOrders();
  }, []);

  const loadOrderLots = async (salesOrderId, existedDetails = []) => {
    try {
      const res = await getOrderInfor(salesOrderId);
      const lots = Array.isArray(res.data?.data) ? res.data.data : [];

      const details = lots
        .filter((lot) => lot.avaiable > 0)
        .map((lot) => {
          const existed = existedDetails.find((i) => i.lotId === lot.lotId);
          return {
            lotId: lot.lotId,
            productName: lot.productName,
            expiredDate: lot.expiredDate,
            unit: lot.unit,
            available: lot.avaiable,
            quantity: existed ? existed.quantity : lot.avaiable,
          };
        });

      setForm((prev) => ({ ...prev, details }));
      setOriginalDetails(details);
    } catch (err) {
      console.error(err);
      setForm((prev) => ({ ...prev, details: [] }));
    }
  };

  const handleSelectOrder = (salesOrderId) => {
    setForm((prev) => ({ ...prev, salesOrderId }));
    loadOrderLots(salesOrderId);
  };

  useEffect(() => {
    if (!id || !stockDetail) return;

    const loadForm = async () => {
      setLoading(true);
      try {
        const salesOrderIdFromState =
          location.state?.salesOrderId || stockDetail.salesOrderId;

        const details = (stockDetail.details || []).map((d) => ({
          lotId: d.lotId,
          productName: d.productName,
          expiredDate: d.expiredDate,
          unit: d.unit || "",
          available: d.available,
          quantity: d.quantity,
        }));

        setForm({
          salesOrderId: salesOrderIdFromState,
          dueDate: stockDetail.dueDate?.split("T")[0] || "",
          details,
        });
        setOriginalDetails(details);
      } catch (err) {
        console.error(err);
        setForm((prev) => ({ ...prev, details: [] }));
      } finally {
        setLoading(false);
      }
    };

    loadForm();
  }, [id, stockDetail, location]);

  const handleChangeQuantity = (index, value) => {
    const newValue = Math.max(0, Number(value));
    const details = [...form.details];
    details[index].quantity = newValue;
    setForm({ ...form, details });
  };

  const handleDeleteLot = (index) => {
    const details = [...form.details];
    details.splice(index, 1);
    setForm({ ...form, details });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.salesOrderId) newErrors.salesOrderId = "Vui lòng chọn đơn hàng";
    if (!form.dueDate) newErrors.dueDate = "Vui lòng chọn Ngày giao hàng";

    form.details.forEach((d, index) => {
      if (!d.quantity || d.quantity <= 0)
        newErrors[`q_${index}`] = "Số lượng phải lớn hơn 0";
      if (d.quantity > d.available)
        newErrors[`q_${index}`] = "Không được vượt quá số lượng hiện có";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (action) => {
    if (!validateForm()) {
      setSnack({ open: true, severity: "error", message: "Form chưa hợp lệ!" });
      return;
    }

    setLoading(true);
    try {
      if (!id) {
        const payload = {
          ...form,
          status: action === "Send" ? 1 : 0,
          details: form.details.map((d) => ({
            lotId: d.lotId,
            quantity: d.quantity,
          })),
        };
        console.log("CREATE PAYLOAD:", JSON.stringify(payload, null, 2));
        await createOrder(payload);
      } else {
        if (action === "Send") {
          const payload = {
            stockExportOrderId: id,
            dueDate: form.dueDate,
            status: 1,
            details: form.details.map((d) => ({
              lotId: d.lotId,
              quantity: d.quantity,
            })),
          };
          console.log("PAYLOAD UPDATE =", payload);
          await updateOrder(payload);
        } else {
          const payload = {
            stockExportOrderId: id,
            dueDate: form.dueDate,
            staus: 0,
            details: form.details.map((d) => ({
              lotId: d.lotId,
              quantity: d.quantity,
            })),
          };
          console.log("PAYLOAD UPDATE =", payload);
          await updateOrder(payload);
        }
      }

      setSnack({
        open: true,
        severity: "success",
        message: action === "Send" ? "Gửi thành công!" : "Lưu thành công!",
      });

      setTimeout(() => navigate("/stock-export"), 1000);
    } catch (err) {
      console.error(err);
      setSnack({ open: true, severity: "error", message: "Lỗi khi xử lý!" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>
        {id ? "Cập nhật yêu cầu xuất kho" : "Tạo yêu cầu xuất kho"}
      </Typography>

      <Paper sx={{ p: 3 }}>
        {loading || loadingStock ? (
          <Stack alignItems="center">
            <CircularProgress />
          </Stack>
        ) : (
          <Stack spacing={3}>
            {/* Chọn Sales Order & Due Date */}
            <Stack direction="row" spacing={3}>
              <FormControl
                size="small"
                sx={{ width: 260 }}
                error={!!errors.salesOrderId}
              >
                <InputLabel>Đơn hàng</InputLabel>
                <Select
                  value={form.salesOrderId || ""}
                  label="Đơn hàng"
                  onChange={(e) => handleSelectOrder(e.target.value)}
                  renderValue={(selected) => {
                    if (!selected) {
                      return "Chọn đơn hàng";
                    }
                    const selectedOrder = salesOrderList.find(
                      (s) => s.salesOrderId === selected
                    );
                    return selectedOrder ? selectedOrder.salesOrderCode : "";
                  }}
                >
                  {salesOrderList.length === 0 ? (
                    <MenuItem value="" disabled>
                      Không có đơn hàng nào
                    </MenuItem>
                  ) : (
                    salesOrderList.map((s) => (
                      <MenuItem key={s.salesOrderId} value={s.salesOrderId}>
                        {s.salesOrderCode}
                      </MenuItem>
                    ))
                  )}
                </Select>

                {errors.salesOrderId && (
                  <FormHelperText>{errors.salesOrderId}</FormHelperText>
                )}
              </FormControl>

              <FormControl
                size="small"
                sx={{ width: 200 }}
                error={!!errors.dueDate}
              >
                <TextField
                  label="Ngày giao hàng"
                  type="date"
                  value={form.dueDate}
                  InputLabelProps={{ shrink: true }}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                />
                {errors.dueDate && (
                  <FormHelperText>{errors.dueDate}</FormHelperText>
                )}
              </FormControl>
            </Stack>

            {/* Chi tiết lô */}
            <Typography variant="h6">Chi tiết lô hàng</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>STT</TableCell>
                    <TableCell>Sản phẩm</TableCell>
                    <TableCell>Đơn vị</TableCell>
                    <TableCell>Lô</TableCell>
                    <TableCell>Hạn dùng</TableCell>
                    <TableCell>Số lượng</TableCell>
                    <TableCell align="center">Số lượng có thể xuất</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {form.details.map((d, i) => (
                    <TableRow key={d.lotId || i}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{d.productName}</TableCell>
                      <TableCell>{d.unit}</TableCell>

                      <TableCell>{d.lotId}</TableCell>
                      <TableCell>
                        {d.expiredDate
                          ? new Date(d.expiredDate).toLocaleDateString("vi-VN")
                          : ""}
                      </TableCell>
                      <TableCell>
                        <FormControl
                          error={!!errors[`q_${i}`]}
                          fullWidth
                          size="small"
                        >
                          <TextField
                            type="number"
                            size="small"
                            value={d.quantity}
                            onChange={(e) =>
                              handleChangeQuantity(i, e.target.value)
                            }
                            variant="outlined"
                          />
                          {errors[`q_${i}`] && (
                            <FormHelperText>{errors[`q_${i}`]}</FormHelperText>
                          )}
                        </FormControl>
                      </TableCell>

                      <TableCell align="center">{d.available}</TableCell>
                      <TableCell>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteLot(i)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Buttons */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button onClick={() => navigate("/stock-export")}>Hủy</Button>
              <Button variant="contained" onClick={() => handleSubmit("Draft")}>
                Lưu nháp
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() =>
                  setForm((prev) => ({ ...prev, details: originalDetails }))
                }
              >
                Khôi phục
              </Button>

              <Button
                variant="contained"
                color="success"
                onClick={() => handleSubmit("Send")}
              >
                Gửi
              </Button>
            </Stack>
          </Stack>
        )}
      </Paper>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snack.severity} variant="filled">
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
