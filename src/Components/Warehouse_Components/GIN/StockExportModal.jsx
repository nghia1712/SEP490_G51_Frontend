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
  Box,
  Paper,
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
        <DialogTitle
          fontWeight={"bold"}
          sx={{ textAlign: "center", fontSize: "1.4rem" }}
        >
          Chi tiết yêu cầu xuất kho
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Stack alignItems="center" mt={3}>
              <CircularProgress />
            </Stack>
          ) : detailData ? (
            <>
              {/* Thông tin yêu cầu */}
              <Paper
                variant="outlined"
                sx={{ p: 2.5, borderRadius: 2, mb: 3 }}
              >
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  gutterBottom
                  sx={{ mb: 2 }}
                >
                  Thông tin yêu cầu
                </Typography>
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
                      {detailData.salesOrderCode || "-"}
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
                    <Typography color="text.secondary">Người tạo:</Typography>
                    <Typography fontWeight={500}>
                      {detailData.createBy || "-"}
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
                    <Typography color="text.secondary">Ngày gửi:</Typography>
                    <Typography fontWeight={500}>
                      {detailData.requestDate
                        ? new Date(detailData.requestDate).toLocaleDateString(
                            "vi-VN"
                          )
                        : "—"}
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
                    <Typography color="text.secondary">Ngày giao hàng:</Typography>
                    <Typography fontWeight={500}>
                      {detailData.dueDate
                        ? new Date(detailData.dueDate).toLocaleDateString(
                            "vi-VN"
                          )
                        : "—"}
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
                    <Typography color="text.secondary">Trạng thái:</Typography>
                    <Chip
                      label={getStatus(detailData.status).label}
                      color={getStatus(detailData.status).color}
                      size="small"
                    />
                  </Box>
                </Stack>
              </Paper>

              {/* Danh sách sản phẩm */}
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  gutterBottom
                  sx={{ mb: 2 }}
                >
                  Danh sách sản phẩm
                </Typography>
                <Table size="small">
                  <TableHead
                    sx={{
                      backgroundColor: "#f5f5f5",
                      "& .MuiTableCell-root": { fontWeight: "bold" },
                    }}
                  >
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Tên SP</TableCell>
                      <TableCell>Hạn dùng</TableCell>
                      <TableCell>Số lượng</TableCell>
                      <TableCell>Đơn vị</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {!detailData.details || detailData.details.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          Không có sản phẩm
                        </TableCell>
                      </TableRow>
                    ) : (
                      detailData.details.map((d, i) => (
                        <TableRow key={i}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell>{d.productName}</TableCell>
                          <TableCell>
                            {d.expiredDate
                              ? new Date(d.expiredDate).toLocaleDateString(
                                  "vi-VN"
                                )
                              : "-"}
                          </TableCell>
                          <TableCell>{d.quantity}</TableCell>
                          <TableCell>{d.unit}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Paper>
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
