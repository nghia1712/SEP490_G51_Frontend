import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  CircularProgress,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Snackbar,
  Alert,
} from "@mui/material";

export default function StockExportModal({
  // ===== DETAIL =====
  detailOpen,
  onCloseDetail,
  detailLoading,
  detailData,
  getStatus,

  // ===== DELETE =====
  deleteOpen,
  onCloseDelete,
  onConfirmDelete,

  // ===== CANCEL SALES ORDER =====
  // cancelOpen,
  // onCloseCancel,
  // onConfirmCancel,

  // ===== SNACKBAR =====
  snack,
  onCloseSnack,
}) {
  return (
    <>
      {/* ================= DETAIL MODAL ================= */}
      <Dialog open={detailOpen} onClose={onCloseDetail} maxWidth="md" fullWidth>
        <DialogTitle fontWeight="bold">Chi tiết yêu cầu xuất kho</DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Stack alignItems="center" p={3}>
              <CircularProgress />
            </Stack>
          ) : detailData ? (
            <>
              <Typography>
                <b>Mã đơn hàng:</b> {detailData.salesOrderCode}
              </Typography>
              <Typography>
                <b>Người tạo:</b> {detailData.createBy}
              </Typography>
              <Typography>
                <b>Ngày gửi:</b>{" "}
                {detailData.requestDate
                  ? new Date(detailData.requestDate).toLocaleDateString("vi-VN")
                  : "—"}
              </Typography>
              <Typography>
                <b>Ngày giao hàng:</b>{" "}
                {detailData.dueDate
                  ? new Date(detailData.dueDate).toLocaleDateString("vi-VN")
                  : "—"}
              </Typography>
              <Typography>
                <b>Trạng thái:</b>{" "}
                <Chip
                  label={getStatus(detailData.status).label}
                  color={getStatus(detailData.status).color}
                  size="small"
                />
              </Typography>

              <Typography variant="h6" sx={{ mt: 2 }}>
                Danh sách sản phẩm
              </Typography>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Tên SP</TableCell>
                    <TableCell>Hạn dùng</TableCell>
                    <TableCell>Số lượng</TableCell>
                    <TableCell>Đơn vị</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detailData.details?.map((d, i) => (
                    <TableRow key={i}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{d.productName}</TableCell>
                      <TableCell>
                        {new Date(d.expiredDate).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell>{d.quantity}</TableCell>
                      <TableCell>{d.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          ) : (
            <Typography>Không có dữ liệu</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseDetail}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* ================= DELETE CONFIRM ================= */}
      <Dialog open={deleteOpen} onClose={onCloseDelete}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          Bạn có chắc chắn muốn xóa yêu cầu này không?
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseDelete}>Hủy</Button>
          <Button color="error" onClick={onConfirmDelete}>
            Xóa
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================= SNACKBAR ================= */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={onCloseSnack}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snack.severity} variant="filled">
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
}
