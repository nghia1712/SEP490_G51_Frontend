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
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import viLocale from "date-fns/locale/vi";
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

  // Lắng nghe state truyền từ màn hình đơn hàng (SalesOrderList)
  // để tự động chọn đơn hàng tương ứng khi tạo mới yêu cầu xuất kho
  useEffect(() => {
    // Chỉ xử lý khi đang ở chế độ tạo mới (không có id trên URL)
    if (id) return;

    const preselectedId = location.state?.preselectedSalesOrderId;
    if (!preselectedId) return;

    setForm((prev) => ({
      ...prev,
      salesOrderId: preselectedId,
    }));
  }, [id, location.state]);

  const fetchSalesOrders = async () => {
    try {
      const res = await salesOrderAPI.listNotDelivered();
      const allOrders = res.data?.data || [];

      const filteredOrders = [];

      for (const order of allOrders) {
        if (!order.isDeposited) continue;

        const detailRes = await getOrderInfor(order.salesOrderId);
        const details = detailRes.data?.data?.details || [];

        if (details.some((lot) => lot.avaiable > 0)) {
          filteredOrders.push(order);
        }
      }

      setSalesOrderList(filteredOrders);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSalesOrders();
  }, []);

  // Sau khi danh sách đơn hàng được load, nếu có đơn được chọn sẵn
  // từ màn hình trước thì load luôn chi tiết lô tương ứng
  useEffect(() => {
    if (id) return; // chỉ áp dụng cho màn hình create

    const preselectedId = location.state?.preselectedSalesOrderId;
    if (!preselectedId) return;

    if (!salesOrderList || salesOrderList.length === 0) return;

    const existedOrder = salesOrderList.find(
      (s) => s.salesOrderId === preselectedId
    );

    if (existedOrder) {
      loadOrderLots(preselectedId);
    }
  }, [id, location.state, salesOrderList]);

  const loadOrderLots = async (salesOrderId, existedDetails = []) => {
    try {
      const res = await getOrderInfor(salesOrderId);

      const result = res.data?.data || {};
      const lots = Array.isArray(result.details) ? result.details : [];

      console.log("LOTS NHẬN:", lots);

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
            warehouse: lot.warehouseName,
            quantity: existed ? existed.quantity : lot.avaiable,
          };
        });

      setForm((prev) => ({
        ...prev,
        details,
        apiDueDate: result.dueDate ? result.dueDate.split("T")[0] : "",
      }));

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
    const newErrors = [];

    if (!form.salesOrderId) newErrors.push("Vui lòng chọn đơn hàng");
    if (!form.dueDate) newErrors.push("Vui lòng chọn Ngày xuất");

    if (form.dueDate && form.apiDueDate) {
      const selected = new Date(form.dueDate);
      const maxDate = new Date(form.apiDueDate);

      if (selected > maxDate) {
        newErrors.push(
          `Ngày xuất không được vượt quá ngày giao hàng dự kiến ${maxDate.toLocaleDateString(
            "vi-VN"
          )}`
        );
      }
    }

    form.details.forEach((d, index) => {
      if (!d.quantity || d.quantity <= 0)
        newErrors.push(`Số lượng "${d.productName}" phải lớn hơn 0`);
      if (d.quantity > d.available)
        newErrors.push(
          `Số lượng "${d.productName}" không được vượt quá ${d.available}`
        );
    });

    return { isValid: newErrors.length === 0, errors: newErrors };
  };

  // const groupDetailsByWarehouse = (details) => {
  //   const grouped = {};
  //   details.forEach((d) => {
  //     if (!grouped[d.warehouse]) grouped[d.warehouse] = [];
  //     grouped[d.warehouse].push(d);
  //   });
  //   return grouped;
  // };

  const handleSubmit = async (action) => {
    const { isValid, errors } = validateForm();

    if (!isValid) {
      setSnack({
        open: true,
        severity: "error",
        message: errors.join(" | "),
      });
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

        // console.log("CREATE PAYLOAD =", payload);
        await createOrder(payload);
      } else {
        const payload = {
          stockExportOrderId: id,
          dueDate: form.dueDate,
          status: action === "Send" ? 1 : 0,
          details: form.details.map((d) => ({
            lotId: d.lotId,
            quantity: d.quantity,
          })),
        };
        // console.log("PAYLOAD UPDATE =", payload);
        await updateOrder(payload);
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

              <LocalizationProvider
                dateAdapter={AdapterDateFns}
                locale={viLocale}
              >
                <DatePicker
                  label="Ngày xuất"
                  value={form.dueDate ? new Date(form.dueDate) : null}
                  onChange={(newValue) => {
                    if (!newValue) return;
                    const value = newValue.toISOString().split("T")[0];
                    setForm((prev) => ({ ...prev, dueDate: value }));
                  }}
                  minDate={new Date()}
                  maxDate={
                    form.apiDueDate ? new Date(form.apiDueDate) : undefined
                  }
                  format="dd/MM/yyyy"
                  slotProps={{
                    textField: { size: "small", fullWidth: false },
                  }}
                />
              </LocalizationProvider>
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
                    {/* <TableCell>Lô</TableCell>
                    <TableCell>Kho</TableCell> */}
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
                      {/* <TableCell>{d.lotId}</TableCell>
                      <TableCell>{d.warehouse}</TableCell> */}
                      <TableCell>
                        {d.expiredDate
                          ? new Date(d.expiredDate).toLocaleDateString("vi-VN")
                          : ""}
                      </TableCell>
                      <TableCell sx={{ width: 110, minWidth: 110 }}>
                        <FormControl
                          error={!!errors[`q_${i}`]}
                          fullWidth
                          size="small"
                        >
                          <TextField
                            type="number"
                            size="small"
                            value={d.quantity}
                            onChange={(e) => {
                              const value = e.target.value;
                              const newValue =
                                value === "" ? "" : Number(value);
                              handleChangeQuantity(i, newValue);

                              if (newValue > d.available) {
                                setSnack({
                                  open: true,
                                  severity: "warning",
                                  message: `Số lượng "${d.productName}" vượt quá số lượng có thể xuất (${d.available})`,
                                });
                              }
                            }}
                            variant="outlined"
                          />
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
                Tải lại
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
