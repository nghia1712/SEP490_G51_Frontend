import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Typography,
  Checkbox,
  ListItemText,
} from "@mui/material";
import invoiceAPI from "../../API/invoiceAPI";

const InvoiceCreationDialog = ({
  open,
  onClose,
  defaultSalesOrderCode = "",
  defaultGoodsIssueNoteCode = "",
  onSuccess,
}) => {
  const navigate = useNavigate();
  const [salesOrderCodes, setSalesOrderCodes] = useState([]);
  const [salesOrderLoading, setSalesOrderLoading] = useState(false);
  const [selectedSalesOrder, setSelectedSalesOrder] = useState(
    defaultSalesOrderCode || "",
  );

  const [goodsIssueCodes, setGoodsIssueCodes] = useState([]);
  const [goodsIssueLoading, setGoodsIssueLoading] = useState(false);
  const [selectedGoodsCodes, setSelectedGoodsCodes] = useState(
    defaultGoodsIssueNoteCode ? [defaultGoodsIssueNoteCode] : [],
  );

  const [submitting, setSubmitting] = useState(false);
  const [alertState, setAlertState] = useState(null);

  const resetState = useCallback(() => {
    setAlertState(null);
    // Không set selectedSalesOrder ở đây, sẽ set sau khi load xong danh sách
    setSelectedSalesOrder("");
    setSelectedGoodsCodes(
      defaultGoodsIssueNoteCode ? [defaultGoodsIssueNoteCode] : [],
    );
  }, [defaultGoodsIssueNoteCode]);

  useEffect(() => {
    if (open) {
      resetState();
      fetchSalesOrderCodes();
    } else {
      // Reset khi đóng dialog
      setSelectedSalesOrder("");
      setSelectedGoodsCodes([]);
      setSalesOrderCodes([]);
    }
  }, [open, resetState]);

  // Cập nhật selectedSalesOrder khi defaultSalesOrderCode thay đổi và salesOrderCodes đã được load
  useEffect(() => {
    if (open && defaultSalesOrderCode && salesOrderCodes.length > 0) {
      // Chỉ set nếu mã đơn hàng có trong danh sách
      if (salesOrderCodes.includes(defaultSalesOrderCode)) {
        console.log('InvoiceCreationDialog - useEffect setting selectedSalesOrder:', defaultSalesOrderCode);
        setSelectedSalesOrder(defaultSalesOrderCode);
      } else {
        console.warn('InvoiceCreationDialog - useEffect: defaultSalesOrderCode not in salesOrderCodes:', {
          defaultSalesOrderCode,
          currentSelected: selectedSalesOrder,
          availableCodes: salesOrderCodes.slice(0, 10)
        });
      }
    }
  }, [open, defaultSalesOrderCode, salesOrderCodes]);

  // Cập nhật selectedGoodsCodes khi defaultGoodsIssueNoteCode thay đổi (kể cả khi dialog đã mở)
  useEffect(() => {
    if (open && defaultGoodsIssueNoteCode) {
      setSelectedGoodsCodes([defaultGoodsIssueNoteCode]);
    }
  }, [open, defaultGoodsIssueNoteCode]);

  const fetchSalesOrderCodes = async () => {
    setSalesOrderLoading(true);
    try {
      const res = await invoiceAPI.getSalesOrderCodes();
      const payload = res.data?.data ?? res.data ?? [];
      const codes = Array.isArray(payload) ? payload : [];
      setSalesOrderCodes(codes);
      
      console.log('InvoiceCreationDialog - fetchSalesOrderCodes completed:', {
        open,
        defaultSalesOrderCode,
        codesLength: codes.length,
        codesIncludesDefault: codes.includes(defaultSalesOrderCode),
        codes: codes.slice(0, 5) // Log first 5 codes
      });
      
      // Sau khi load xong danh sách, nếu có defaultSalesOrderCode và nó có trong danh sách, thì set selectedSalesOrder
      if (open && defaultSalesOrderCode && codes.includes(defaultSalesOrderCode)) {
        console.log('InvoiceCreationDialog - Setting selectedSalesOrder to:', defaultSalesOrderCode);
        setSelectedSalesOrder(defaultSalesOrderCode);
      } else if (!defaultSalesOrderCode) {
        // Nếu không có defaultSalesOrderCode, giữ nguyên giá trị rỗng
        setSelectedSalesOrder("");
      } else if (open && defaultSalesOrderCode && !codes.includes(defaultSalesOrderCode)) {
        console.warn('InvoiceCreationDialog - defaultSalesOrderCode not found in codes:', {
          defaultSalesOrderCode,
          availableCodes: codes.slice(0, 10)
        });
      }
    } catch (error) {
      setAlertState({
        severity: "error",
        message:
          error.response?.data?.message ||
          error.message ||
          "Không thể tải danh sách đơn hàng.",
      });
    } finally {
      setSalesOrderLoading(false);
    }
  };

  const fetchGoodsIssueCodes = useCallback(async () => {
    if (!selectedSalesOrder) {
      setGoodsIssueCodes([]);
      return;
    }
    setGoodsIssueLoading(true);
    try {
      const res =
        await invoiceAPI.getGoodsIssueNoteCodesBySalesOrder(
          selectedSalesOrder,
        );
      const codes = res.data?.data ?? res.data ?? [];
      const normalized = Array.isArray(codes) ? codes : [];
      setGoodsIssueCodes(normalized);

      // Nếu lấy được danh sách phiếu xuất kho hợp lệ thì ẩn thông báo lỗi trước đó (nếu có)
      if (normalized.length > 0) {
        setAlertState(null);
      }

      // Giữ lại những code đang chọn vẫn còn trong list
      setSelectedGoodsCodes((prev) => {
        const filtered = prev.filter((code) => normalized.includes(code));
        if (
          filtered.length === 0 &&
          defaultGoodsIssueNoteCode &&
          normalized.includes(defaultGoodsIssueNoteCode)
        ) {
          return [defaultGoodsIssueNoteCode];
        }
        return filtered;
      });
    } catch (error) {
      setAlertState({
        severity: "error",
        message:
          error.response?.data?.message ||
          error.message ||
          "Không thể tải danh sách phiếu xuất kho.",
      });
    } finally {
      setGoodsIssueLoading(false);
    }
  }, [defaultGoodsIssueNoteCode, selectedSalesOrder]);

  useEffect(() => {
    if (open && selectedSalesOrder) {
      fetchGoodsIssueCodes();
    } else {
      setGoodsIssueCodes([]);
    }
  }, [fetchGoodsIssueCodes, open, selectedSalesOrder]);

  const handleSubmit = async () => {
    if (!selectedSalesOrder) {
      setAlertState({
        severity: "warning",
        message: "Vui lòng chọn mã đơn hàng trước khi tạo hóa đơn.",
      });
      return;
    }
    if (selectedGoodsCodes.length === 0) {
      setAlertState({
        severity: "warning",
        message: "Vui lòng chọn ít nhất một phiếu xuất kho.",
      });
      return;
    }

    setSubmitting(true);
    setAlertState(null);
    try {
      const payload = {
        salesOrderCode: selectedSalesOrder,
        goodsIssueNoteCodes: selectedGoodsCodes,
      };
      const res = await invoiceAPI.generateFromGoodsIssueNotes(payload);
      const invoiceId = res.data?.data?.id || res.data?.data?.Id;
      
      // Nếu có invoiceId, gọi API để set status = Send (đã gửi)
      if (invoiceId) {
        try {
          await invoiceAPI.sendInvoiceEmail(invoiceId);
        } catch (sendError) {
          // Nếu gửi email thất bại nhưng invoice đã được tạo, vẫn tiếp tục
          console.warn('Could not send invoice email, but invoice was created:', sendError);
        }
      }
      
      const message =
        res.data?.message || "Tạo hóa đơn từ phiếu xuất kho thành công.";
      onSuccess?.(message);
      onClose?.();
      
      // Điều hướng đến trang hóa đơn sau khi tạo thành công
      setTimeout(() => {
        navigate('/accountant/invoices');
      }, 500);
    } catch (error) {
      setAlertState({
        severity: "error",
        message:
          error.response?.data?.message ||
          error.message ||
          "Không thể tạo hóa đơn từ phiếu xuất kho.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const goodsIssueOptions = useMemo(
    () => goodsIssueCodes.map((code) => ({ label: code, value: code })),
    [goodsIssueCodes],
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Tạo hóa đơn từ phiếu xuất kho</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Chọn đơn hàng và phiếu xuất kho tương ứng để tạo hóa đơn mới. Bạn
            có thể chọn nhiều phiếu xuất kho thuộc cùng một đơn hàng.
          </Typography>

          {alertState && (
            <Alert severity={alertState.severity}>{alertState.message}</Alert>
          )}

          <FormControl fullWidth size="small">
            <InputLabel>Mã đơn hàng</InputLabel>
            <Select
              label="Mã đơn hàng"
              value={selectedSalesOrder}
              onChange={(e) => setSelectedSalesOrder(e.target.value)}
              disabled={salesOrderLoading}
            >
              {salesOrderLoading && (
                <MenuItem value="" disabled>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CircularProgress size={18} />
                    <Typography>Đang tải...</Typography>
                  </Stack>
                </MenuItem>
              )}
              {!salesOrderLoading && salesOrderCodes.length === 0 && (
                <MenuItem value="" disabled>
                  Chưa có đơn hàng nào
                </MenuItem>
              )}
              {salesOrderCodes.map((code) => (
                <MenuItem key={code} value={code}>
                  {code}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" disabled={!selectedSalesOrder}>
            <InputLabel>Phiếu xuất kho</InputLabel>
            <Select
              multiple
              label="Phiếu xuất kho"
              value={selectedGoodsCodes}
              onChange={(e) => setSelectedGoodsCodes(e.target.value)}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
            >
              {goodsIssueLoading && (
                <MenuItem value="" disabled>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CircularProgress size={18} />
                    <Typography>Đang tải...</Typography>
                  </Stack>
                </MenuItem>
              )}
              {!goodsIssueLoading && goodsIssueOptions.length === 0 && (
                <MenuItem value="" disabled>
                  {selectedSalesOrder
                    ? "Không có phiếu xuất kho nào"
                    : "Vui lòng chọn đơn hàng trước"}
                </MenuItem>
              )}
              {goodsIssueOptions.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  <Checkbox checked={selectedGoodsCodes.includes(item.value)} />
                  <ListItemText primary={item.label} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
          <Button onClick={onClose} disabled={submitting}>
            Đóng
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : "Tạo hóa đơn"}
          </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvoiceCreationDialog;


