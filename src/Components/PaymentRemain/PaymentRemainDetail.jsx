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

  const renderPaymentMethod = (m) => {
    switch (m) {
      case 0:
        return "-";
      case 1:
        return "VnPay";
      case 2:
        return "Tiền mặt";
      case 3:
        return "Chuyển khoản ngân hàng";
      default:
        return "Không xác định";
    }
  };

  const renderPaymentType = (t) => {
    switch (t) {
      case 1:
        return "Thanh toán còn lại";
      case 0:
        return "Thanh toán toàn bộ";
      default:
        return "Không xác định";
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);

  const formatDateTime = (date) =>
    date ? new Date(date).toLocaleDateString("vi-VN") : "-";

  // ====== Detail Rows ======
  const detailRows = [
    ["Yêu cầu thanh toán", data.id],
    ["Mã đơn hàng", data.salesOrderCode || data.salesOrderId],
    ["Mã hóa đơn", data.invoiceCode || "-"],
    ["Loại thanh toán", renderPaymentType(data.paymentType)],
    ["Phương thức", renderPaymentMethod(data.paymentMethod)],
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
    ["Tham chiếu giao dịch", data.gatewayTransactionRef || "-"],
    ["Cổng thanh toán", data.gateway || "-"],
    ["Khách hàng", data.customerName || "-"],
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ textAlign: "center", fontSize: "1.5rem", fontWeight: "bold" }}>
        Chi tiết yêu cầu thanh toán
      </DialogTitle>
      <DialogContent dividers sx={{ p: 2 }}>
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
