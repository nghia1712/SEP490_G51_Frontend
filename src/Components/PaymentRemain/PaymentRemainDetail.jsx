import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
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

  // ====== Detail Rows ======
  const detailRows = [
    ["Mã đơn hàng", data.salesOrderCode || data.salesOrderId],
    ["Mã hóa đơn", data.invoiceCode || "-"],
    [
      "Tổng giá trị đơn hàng",
      formatCurrency(data.salesOrderTotalPrice),
      "text.secondary",
      true, // in đậm
    ],
    [
      "Số tiền đã thanh toán",
      formatCurrency(data.salesOrderPaidAmount),
      "success.main",
    ],
    [
      "Số tiền cần thanh toán",
      formatCurrency(data.amount),
      data.amount > 0 ? "warning.main" : "text.primary",
    ],
    ["Trạng thái đơn hàng", renderStatus(data.vnPayStatus)],
    ["Ngày tạo yêu cầu", formatDateTime(data.requestCreatedAt)],
    ["Ngày thanh toán", formatDateTime(data.paidAt)],
  ];

  return (
    <Dialog className="payment-remain-detail-dialog" open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle className="payment-remain-detail-dialog-title"
        sx={{ textAlign: "center", fontSize: "1.5rem", fontWeight: "bold" }}
      >
        Chi tiết yêu cầu thanh toán
      </DialogTitle>
      <DialogContent className="payment-remain-detail-dialog-content" dividers sx={{ p: 2 }}>
        <Table size="small">
          <TableBody>
            {detailRows.map(([label, value, color, bold], idx) => (
              <TableRow key={idx} sx={{ borderBottom: "1px solid #eee" }}>
                <TableCell
                  sx={{
                    width: "30%",
                    fontWeight: "bold",
                    backgroundColor: "#f9f9f9",
                    p: 1,
                    textAlign: "left",
                    fontSize: "1.1rem",
                  }}
                >
                  {label}
                </TableCell>
                <TableCell
                  sx={{
                    p: 1,
                    textAlign: "right",
                    color: color || "text.primary",
                    fontWeight: bold ? "bold" : "normal",
                    fontSize: "1rem",
                  }}
                >
                  {typeof value === "string" && value.length > 50 ? (
                    <Tooltip title={value}>{value.slice(0, 50)}...</Tooltip>
                  ) : (
                    value
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose} sx={{ fontSize: "1rem" }}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentRemainDetail;
