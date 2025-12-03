import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Stack,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Pagination,
  TableContainer,
  Container,
  Card,
  CardContent,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import useGIN, { mapGINStatus } from "../../../Hooks/useGIN";
import {
  Visibility,
  Search,
  ReceiptLong,
  CheckCircle,
} from "@mui/icons-material";
import InvoiceCreationDialog from "../../Invoice_Components/InvoiceCreationDialog";
import getUserRoleFromToken from "../../../Utils/getUserRoleFromToken";

export default function GRNList() {
  const navigate = useNavigate();
  const location = useLocation();

  const role = getUserRoleFromToken();

  const {
    data,
    loading,
    error,
    search,
    setSearch,
    refetch,
    openDetail,
    setOpenDetail,
    selectedExport,
    detailItems,
    detailLoading,
    handleViewDetail,
    createGIN,
    sendGIN,
    setSnack,
    snack,
    handleSnackClose,
    renderGINStatus,
    exportedLotProduct,
  } = useGIN();
  const [filtered, setFiltered] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedData = filtered.slice((page - 1) * pageSize, page * pageSize);

  // =========================
  // Filter search
  // =========================
  useEffect(() => {
    const keyword = search.toLowerCase();

    setFiltered(
      data?.filter(
        (item) =>
          (item.note || "").toLowerCase().includes(keyword) ||
          (item.goodsIssueNoteCode || "").toLowerCase().includes(keyword) ||
          (item.warehouseName || "").toLowerCase().includes(keyword) ||
          (item.createBy || "").toLowerCase().includes(keyword) ||
          (item.stockExportOrderCode || "").toLowerCase().includes(keyword)
      ) || []
    );
  }, [search, data]);

  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceDialogContext, setInvoiceDialogContext] = useState(null);

  const handleOpenInvoiceDialog = (row) => {
    setInvoiceDialogContext(
      row
        ? {
            goodsIssueNoteCode: row.goodsIssueNoteCode,
            salesOrderCode:
              row.salesOrderCode || row.stockExportOrderCode || "",
          }
        : { goodsIssueNoteCode: "", salesOrderCode: "" }
    );
    setInvoiceDialogOpen(true);
  };

  const handleCloseInvoiceDialog = () => {
    setInvoiceDialogOpen(false);
    setInvoiceDialogContext(null);
  };

  const handleInvoiceSuccess = (message) => {
    setSnack({
      open: true,
      severity: "success",
      message: message || "Tạo hóa đơn từ phiếu xuất kho thành công",
    });
    refetch();
    handleCloseInvoiceDialog();
  };

  const handleConfirmExport = async (ginId) => {
    const res = await exportedLotProduct(ginId);

    if (res.success) {
      setSnack({
        open: true,
        severity: "success",
        message: res.message || "Xác nhận xuất kho thành công",
      });
      refetch();
    } else {
      setSnack({
        open: true,
        severity: "error",
        message: res.message || "Xác nhận xuất kho thất bại",
      });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Container maxWidth="xl" sx={{ pt: 4, pb: 4 }}>
        <Card elevation={3} sx={{ borderRadius: 2 }}>
          <CardContent>
            {/* HEADER */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <ReceiptLong sx={{ fontSize: 40, mr: 2, color: "#1976d2" }} />
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", flexGrow: 1, color: "#1976d2" }}
              >
                Phiếu xuất kho
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Tổng: {filtered.length} phiếu
              </Typography>
            </Box>

            {/* FILTER */}
            <Paper
              sx={{ p: 2, mb: 2, backgroundColor: "#f8fafc", borderRadius: 2 }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems="center"
                justifyContent="space-between"
                sx={{ width: "100%" }}
              >
                <TextField
                  placeholder="Tìm kiếm..."
                  size="small"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  sx={{
                    flexGrow: 1,
                    maxWidth: { xs: "100%", md: 400 },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
                {role === "accountant_staff" && (
                  <Button
                    variant="contained"
                    startIcon={<ReceiptLong />}
                    onClick={() => handleOpenInvoiceDialog()}
                    sx={{
                      ml: { xs: 0, md: 2 },
                      alignSelf: { xs: "stretch", md: "center" },
                      whiteSpace: "nowrap",
                    }}
                  >
                    Tạo hóa đơn
                  </Button>
                )}
              </Stack>
            </Paper>

            {/* TABLE */}
            <TableContainer
              component={Paper}
              sx={{ borderRadius: 2, maxHeight: 500 }}
            >
              <Table stickyHeader>
                <TableHead
                  sx={{
                    backgroundColor: "#f5f5f5",
                    "& .MuiTableCell-root": { fontWeight: "bold" },
                  }}
                >
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Phiếu xuất kho</TableCell>
                    <TableCell>Kho</TableCell>
                    <TableCell>Mã yêu cầu</TableCell>
                    <TableCell>Mô tả</TableCell>
                    <TableCell>Người tạo</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Ngày tạo</TableCell>
                    <TableCell align="center">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                        Không có dữ liệu
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((row, idx) => (
                      <TableRow key={row.id}>
                        <TableCell>{(page - 1) * pageSize + idx + 1}</TableCell>
                        <TableCell>{row.goodsIssueNoteCode}</TableCell>
                        <TableCell>{row.warehouseName}</TableCell>
                        <TableCell>{row.stockExportOrderCode}</TableCell>

                        <TableCell>{row.note}</TableCell>
                        <TableCell>{row.createBy}</TableCell>
                        <TableCell align="center">
                          {renderGINStatus(row.status)}
                        </TableCell>
                        <TableCell>
                          {row.createAt
                            ? new Date(row.createAt).toLocaleDateString("vi-VN")
                            : "-"}
                        </TableCell>
                        <TableCell align="center">
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="center"
                          >
                            {/* Xem chi tiết */}
                            <Tooltip title="Xem chi tiết">
                              <IconButton
                                color="primary"
                                size="small"
                                onClick={() => handleViewDetail(row)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>

                            {/* NÚT XÁC NHẬN XUẤT KHO */}
                            {role === "warehouse_staff" && row.status === 1 && (
                              <Tooltip title="Xác nhận đã xuất kho">
                                <IconButton
                                  color="success"
                                  size="small"
                                  onClick={() => handleConfirmExport(row.id)}
                                >
                                  <CheckCircle />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* PAGINATION */}
            {filtered.length > 0 && totalPages > 1 && (
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                />
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>

      {/* Dialog chi tiết */}
      <Dialog
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle fontWeight={"bold"}>Chi tiết phiếu xuất kho</DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Stack alignItems="center" mt={3}>
              <CircularProgress />
            </Stack>
          ) : (
            selectedExport && (
              <>
                <Typography>
                  <b>Phiếu xuất kho:</b> {selectedExport.goodsIssueNoteCode}
                </Typography>
                <Typography>
                  <b>Mã đơn hàng:</b> {selectedExport.stockExportOrderCode}
                </Typography>
                <Typography>
                  <b>Kho xuất:</b> {selectedExport.warehouseName}
                </Typography>

                <Typography>
                  <b>Ngày tạo:</b>{" "}
                  {selectedExport.createAt
                    ? new Date(selectedExport.createAt).toLocaleDateString(
                        "vi-VN"
                      )
                    : "-"}
                </Typography>

                <Typography>
                  <b>Người tạo:</b> {selectedExport.createBy}
                </Typography>
                <Typography>
                  <b>Mô tả:</b> {selectedExport.note}
                </Typography>

                <Typography fontWeight="bold" mt={2} mb={1}>
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
                      <TableCell>Tên sản phẩm</TableCell>
                      <TableCell>Số lượng</TableCell>
                      <TableCell>Vị trí kho</TableCell>
                      <TableCell>Hạn dùng</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {detailItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          Không có sản phẩm
                        </TableCell>
                      </TableRow>
                    ) : (
                      detailItems.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.warehouseLocationName}</TableCell>
                          <TableCell>
                            {item.expiredDate
                              ? new Date(item.expiredDate).toLocaleDateString(
                                  "vi-VN"
                                )
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </>
            )
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDetail(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={handleSnackClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackClose}
          severity={snack.severity}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {snack.message}
        </Alert>
      </Snackbar>

      <InvoiceCreationDialog
        open={invoiceDialogOpen}
        onClose={handleCloseInvoiceDialog}
        defaultSalesOrderCode={invoiceDialogContext?.salesOrderCode || ""}
        defaultGoodsIssueNoteCode={
          invoiceDialogContext?.goodsIssueNoteCode || ""
        }
        onSuccess={handleInvoiceSuccess}
      />
    </Box>
  );
}
