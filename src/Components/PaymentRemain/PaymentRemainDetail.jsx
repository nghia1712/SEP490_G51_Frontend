import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Typography,
  Box,
  Stack,
  Paper,
} from "@mui/material";

const PaymentRemainDetail = ({ open, onClose, data }) => {
  if (!data) return null;

  // ====== Helpers ======
  const renderStatus = (vnPayStatus) => {
    switch (vnPayStatus) {
      case 0:
        return <Chip color="warning" label="Chờ thanh toán" />;
      case 1:
        return <Chip color="info" label="Đã đặt cọc" />;
      case 2:
        return <Chip color="primary" label="Thanh toán một phần" />;
      case 3:
        return <Chip color="success" label="Đã thanh toán" />;
      case 4:
        return <Chip color="default" label="Đã hoàn tiền" />;
      default:
        return <Chip color="default" label="Không xác định" />;
    }
  };

  const formatCurrency = (value) => {
    const number = Number(value) || 0;
    const formatted = number
      .toLocaleString("vi-VN")
      .replace(/\./g, ",");

    return (
      <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
        <span>{formatted}</span>
        <span style={{ textDecoration: "underline" }}>đ</span>
      </span>
    );
  };

  const formatDateTime = (date) =>
    date ? new Date(date).toLocaleDateString("vi-VN") : "-";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        fontWeight={"bold"}
        sx={{ textAlign: "center", fontSize: "1.4rem" }}
      >
        Chi tiết yêu cầu thanh toán
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.2}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Typography color="text.secondary">Mã đơn hàng:</Typography>
            <Typography fontWeight={500}>
              {data.salesOrderCode || data.salesOrderId || "-"}
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Typography color="text.secondary">Mã hóa đơn:</Typography>
            <Typography fontWeight={500}>
              {data.invoiceCode || "-"}
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Typography color="text.secondary">Tổng giá trị đơn hàng:</Typography>
            <Typography fontWeight={500}>
              {formatCurrency(data.salesOrderTotalPrice)}
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Typography color="text.secondary">Số tiền đã thanh toán:</Typography>
            <Typography fontWeight={500} color="success.main">
              {formatCurrency(data.salesOrderPaidAmount)}
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Typography color="text.secondary">Số tiền cần thanh toán:</Typography>
            <Typography
              fontWeight={500}
              color={data.amount > 0 ? "warning.main" : "text.primary"}
            >
              {formatCurrency(data.amount)}
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Typography color="text.secondary">Trạng thái đơn hàng:</Typography>
            {renderStatus(data.vnPayStatus)}
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Typography color="text.secondary">Ngày tạo yêu cầu:</Typography>
            <Typography fontWeight={500}>
              {formatDateTime(data.requestCreatedAt)}
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Typography color="text.secondary">Ngày thanh toán:</Typography>
            <Typography fontWeight={500}>
              {formatDateTime(data.paidAt)}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentRemainDetail;
