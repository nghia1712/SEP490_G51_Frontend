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
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import useGIN, { mapGINStatus } from "../../../Hooks/useGIN";
import { Visibility, Search, ReceiptLong } from "@mui/icons-material";
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
  } = useGIN();

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const [filtered, setFiltered] = useState([]);

  // =========================
  // Filter search
  // =========================
  useEffect(() => {
    setFiltered(
      data?.filter(
        (item) =>
          (item.note || "").toLowerCase().includes(search.toLowerCase()) ||
          (item.goodsIssueNoteCode || "")
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          (item.warehouseName || "")
            .toLowerCase()
            .includes(search.toLowerCase())
      ) || []
    );
  }, [search, data]);

  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceDialogContext, setInvoiceDialogContext] = useState(null);

  const handleOpenInvoiceDialog = (row) => {
    setInvoiceDialogContext({
      goodsIssueNoteCode: row.goodsIssueNoteCode,
      salesOrderCode: row.salesOrderCode || row.stockExportOrderCode || "",
    });
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Phiếu xuất kho
      </Typography>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
        >
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ width: 350 }}
          />
        </Stack>
      </Paper>

      {/* Table danh sách */}
      {loading ? (
        <Stack alignItems="center" mt={4}>
          <CircularProgress />
        </Stack>
      ) : (
        <Paper>
          <TableContainer sx={{ maxHeight: 500 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Phiếu xuất kho</TableCell>
                  <TableCell>Kho</TableCell>
                  <TableCell>Ngày tạo</TableCell>
                  <TableCell>Mô tả</TableCell>
                  <TableCell>Người tạo</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Mã yêu cầu</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((row, idx) => (
                    <TableRow key={row.id + "_" + idx}>
                      <TableCell>{(page - 1) * pageSize + idx + 1}</TableCell>
                      <TableCell>{row.goodsIssueNoteCode}</TableCell>
                      <TableCell>{row.warehouseName}</TableCell>
                      <TableCell>
                        {row.createAt
                          ? new Date(row.createAt).toLocaleDateString("vi-VN")
                          : "-"}
                      </TableCell>
                      <TableCell>{row.note}</TableCell>
                      <TableCell>{row.createBy}</TableCell>
                      <TableCell>
                        {row.status === 1 && role !== "warehouse_staff"
                          ? "Chờ xử lý"
                          : renderGINStatus(row.status)}
                      </TableCell>
                      <TableCell>{row.stockExportOrderCode}</TableCell>
                      <TableCell align="center">
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="center"
                        >
                          <Tooltip title="Xem chi tiết">
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => handleViewDetail(row)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>

                          {role === "accountant_staff" && (
                            <Tooltip title="Tạo hóa đơn từ phiếu xuất kho">
                              <IconButton
                                color="success"
                                size="small"
                                onClick={() => handleOpenInvoiceDialog(row)}
                              >
                                <ReceiptLong />
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
            {/* Pagination */}
            {filtered.length > 0 && (
              <Box sx={{ display: "flex", justifyContent: "flex-end", p: 2 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                />
              </Box>
            )}
          </TableContainer>
        </Paper>
      )}

      {/* Dialog chi tiết */}
      <Dialog
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Chi tiết phiếu xuất kho</DialogTitle>
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
                  <b>Kho xuất:</b> {selectedExport.warehouseName}
                </Typography>

                <Typography>
                  <b>Ngày tạo:</b>{" "}
                  {selectedExport.createAt
                    ? new Date(selectedExport.createAt)
                    : "-"}
                </Typography>

                <Typography>
                  <b>Người phụ trách:</b> {selectedExport.createBy}
                </Typography>
                <Typography>
                  <b>Mô tả:</b> {selectedExport.note}
                </Typography>
                <Typography>
                  <b>Mã đơn hàng:</b> {selectedExport.stockExportOrderCode}
                </Typography>

                <Typography fontWeight="bold" mt={2} mb={1}>
                  Danh sách sản phẩm
                </Typography>

                <Table size="small">
                  <TableHead>
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
