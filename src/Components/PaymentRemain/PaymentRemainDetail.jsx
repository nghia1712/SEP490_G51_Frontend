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
} from "@mui/material";

const PaymentRemainDetail = ({ open, onClose, data }) => {
  if (!data) return null;
  console.log("PaymentRemainDetail data:", data);
  console.log("Tổng đơn hàng:", data.salesOrderTotalPrice);
  console.log("Đã thanh toán:", data.salesOrderPaidAmount);
  const renderStatus = (s) => {
    switch (s) {
      case 0:
        return <Chip color="warning" label="Chờ xử lý" size="small" />;
      case 1:
        return <Chip color="success" label="Đã thanh toán" size="small" />;
      case 2:
        return <Chip color="error" label="Từ chối" size="small" />;
      default:
        return <Chip label="Không xác định" size="small" />;
    }
  };

  const renderPaymentMethod = (m) => {
    switch (m) {
      case 0:
        return "Chuyển khoản";
      case 1:
        return "Tiền mặt";
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

  const detailRows = [
    ["Yêu cầu thanh toán", data.id],
    ["Mã đơn hàng", data.salesOrderCode || data.salesOrderId],
    ["Phiếu xuất kho", data.goodsIssueNoteId],
    ["Loại thanh toán", renderPaymentType(data.paymentType)],
    ["Phương thức", renderPaymentMethod(data.paymentMethod)],
    ["Số tiền", formatCurrency(data.amount)],
    ["Trạng thái", renderStatus(data.status)],
    [
      "Ngày thanh toán",
      data.paidAt ? new Date(data.paidAt).toLocaleDateString("vi-VN") : "-",
    ],
    ["Transaction Ref", data.gatewayTransactionRef || "-"],
    ["Gateway", data.gateway || "-"],
    ["Tổng đơn hàng", formatCurrency(data.salesOrderTotalPrice)],
    ["Đã thanh toán", formatCurrency(data.salesOrderPaidAmount)],
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Chi tiết yêu cầu thanh toán</DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Table size="small">
          <TableBody>
            {detailRows.map(([label, value], idx) => (
              <TableRow key={idx} sx={{ borderBottom: "1px solid #eee" }}>
                <TableCell sx={{ width: "40%", fontWeight: "bold", p: 1 }}>
                  {label}
                </TableCell>
                <TableCell sx={{ p: 1 }}>{value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentRemainDetail;
