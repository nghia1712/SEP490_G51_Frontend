import React, { useCallback, useEffect, useMemo, useState } from "react";
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
    setSelectedSalesOrder(defaultSalesOrderCode || "");
    setSelectedGoodsCodes(
      defaultGoodsIssueNoteCode ? [defaultGoodsIssueNoteCode] : [],
    );
  }, [defaultGoodsIssueNoteCode, defaultSalesOrderCode]);

  useEffect(() => {
    if (open) {
      resetState();
      fetchSalesOrderCodes();
    }
  }, [open, resetState]);

  const fetchSalesOrderCodes = async () => {
    setSalesOrderLoading(true);
    try {
      const res = await invoiceAPI.getSalesOrderCodes();
      const payload = res.data?.data ?? res.data ?? [];
      setSalesOrderCodes(Array.isArray(payload) ? payload : []);
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
      const message =
        res.data?.message || "Tạo hóa đơn từ phiếu xuất kho thành công.";
      onSuccess?.(message);
      onClose?.();
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


