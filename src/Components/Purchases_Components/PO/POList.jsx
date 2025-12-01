import React from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Chip,
  TextField,
  InputAdornment,
  Tooltip,
  Snackbar,
  Alert,
  Pagination,
  Card,
  CardContent,
  Container,
} from "@mui/material";
import {
  Visibility,
  Search,
  Close as CloseIcon,
  ShoppingCart,
  UploadFile,
} from "@mui/icons-material";
import POActions from "./POActions";
import usePO from "../../../Hooks/usePO";
import PODialogs from "./PODialogs";
import getUserRoleFromToken from "../../../Utils/getUserRoleFromToken";

export default function POList() {
  const {
    filteredPOs,
    loading,
    search,
    setSearch,
    openDetail,
    selectedPO,
    openUpload,
    handleOpenDetail,
    handleCloseDetail,
    handleOpenUpload,
    handleCloseUpload,
    excelFile,
    setExcelFile,
    uploadedProducts,
    setUploadedProducts,
    previewOpen,
    setPreviewOpen,
    handleUploadExcel,
    handleConvertExcel,
    uploading,
    sending,
    snackbar,
    setSnackbar,
    statusMap,
    parseDDMMYYYY,
    fetchPOs,
  } = usePO();
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(filteredPOs.length / pageSize);
  const userRole = getUserRoleFromToken();

  const paginatedPOs = filteredPOs.slice(
    (page - 1) * pageSize,
    page * pageSize
  );
  const renderStatus = (status) => {
    const s = statusMap[Number(status)] || {
      label: "Unknown",
      color: "default",
    };
    return <Chip label={s.label} color={s.color} size="small" />;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Container maxWidth="xl" sx={{ pt: 4, pb: 4 }}>
        <Card elevation={3} sx={{ borderRadius: 2 }}>
          <CardContent>
            {/* HEADER */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <ShoppingCart sx={{ fontSize: 40, mr: 2, color: "#1976d2" }} />
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", flexGrow: 1, color: "#1976d2" }}
              >
                Đơn nhập hàng
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Tổng: {filteredPOs.length} đơn
              </Typography>
            </Box>

            {/* FILTER + UPLOAD */}
            <Paper
              sx={{ p: 2, mb: 2, backgroundColor: "#f8fafc", borderRadius: 2 }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems="center"
                justifyContent="space-between"
              >
                <TextField
                  variant="outlined"
                  size="small"
                  placeholder="Tìm kiếm..."
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

                {userRole === "purchases_staff" && (
                  <Button
                    variant="contained"
                    startIcon={<UploadFile />}
                    onClick={handleOpenUpload}
                  >
                    Tải file Excel
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
                  sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}
                >
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Mã đơn hàng</TableCell>
                    <TableCell>Nhà cung cấp</TableCell>
                    <TableCell>Ngày đặt</TableCell>
                    <TableCell align="center">Trạng thái nhận hàng</TableCell>
                    <TableCell align="center">Trạng thái đơn hàng</TableCell>
                    <TableCell>Tổng tiền</TableCell>
                    <TableCell>Đã trả</TableCell>
                    <TableCell>Còn nợ</TableCell>
                    <TableCell align="center">Người tạo</TableCell>
                    <TableCell align="center">Hành động</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : filteredPOs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                        Chưa có đơn nhập hàng nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedPOs.map((po, index) => (
                      <TableRow key={po.poid}>
                        <TableCell>
                          {(page - 1) * pageSize + index + 1}
                        </TableCell>
                        <TableCell>{`PO-${po.poid}`}</TableCell>
                        <TableCell>{po.supplierName || "-"}</TableCell>
                        <TableCell>
                          {new Date(po.orderDate).toLocaleDateString("vi-VN")}
                        </TableCell>
                        <TableCell align="center">
                          {po.status !== 7 && (
                            <Chip
                              label={po.receivingStatus}
                              color={
                                po.receivingStatus === "Đã nhận đủ"
                                  ? "success"
                                  : po.receivingStatus === "Nhận một phần" ||
                                    po.receivingStatus === "Chờ xác nhận"
                                  ? "warning"
                                  : po.receivingStatus === "Chưa nhận"
                                  ? "info"
                                  : "default"
                              }
                              size="small"
                            />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {renderStatus(po.status)}
                        </TableCell>
                        <TableCell align="right">
                          {po.total.toLocaleString()} ₫
                        </TableCell>
                        <TableCell align="right">
                          {po.deposit?.toLocaleString() || 0} ₫
                        </TableCell>
                        <TableCell align="right">
                          {po.debt.toLocaleString()} ₫
                        </TableCell>
                        <TableCell align="center">{po.userName}</TableCell>
                        <TableCell align="center">
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="center"
                          >
                            <Tooltip title="Xem chi tiết">
                              <IconButton
                                color="primary"
                                onClick={() => handleOpenDetail(po.poid)}
                                size="small"
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <POActions poId={po.poid} fetchPOs={fetchPOs} />
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* PAGINATION */}
            {filteredPOs.length > 0 && (
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

      <PODialogs
        openUpload={openUpload}
        openPreview={previewOpen}
        handleCloseUpload={handleCloseUpload}
        excelFile={excelFile}
        setExcelFile={setExcelFile}
        handleUploadExcel={handleUploadExcel}
        uploading={uploading}
        uploadedProducts={uploadedProducts}
        setUploadedProducts={setUploadedProducts}
        setPreviewOpen={setPreviewOpen}
        handleConvertExcel={handleConvertExcel}
        sending={sending}
        parseDDMMYYYY={parseDDMMYYYY}
        snackbar={snackbar}
        setSnackbar={setSnackbar}
      />

      {/* Detail PO Dialog */}
      <Dialog
        open={openDetail}
        onClose={handleCloseDetail}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Chi tiết {`PO-${selectedPO?.poid}`}</DialogTitle>
        <DialogContent dividers>
          {selectedPO ? (
            <>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
              >
                <Box>
                  <Typography>
                    <strong>Ngày đặt:</strong>{" "}
                    {new Date(selectedPO.orderDate).toLocaleDateString("vi-EN")}
                  </Typography>
                  {selectedPO.status === 3 && selectedPO.deposit > 0 && (
                    <Typography>
                      <strong>Ngày đặt cọc:</strong>{" "}
                      {new Date(selectedPO.depositDate).toLocaleDateString(
                        "vi-EN"
                      )}
                    </Typography>
                  )}
                  <Typography>
                    <strong>Trạng thái thanh toán:</strong>{" "}
                    {renderStatus(selectedPO.status)}
                  </Typography>
                  <Typography>
                    <strong>Người tạo:</strong> {selectedPO.userName}
                  </Typography>
                  {(selectedPO.status === 3 ||
                    selectedPO.status === 4 ||
                    selectedPO.status === 6) && (
                    <Typography>
                      <strong>Người thanh toán:</strong>{" "}
                      {selectedPO.paymentBy &&
                      selectedPO.paymentBy !== "Unknown"
                        ? selectedPO.paymentBy
                        : "Chưa thanh toán"}
                    </Typography>
                  )}

                  {selectedPO.status === 4 && (
                    <Typography>
                      <strong>Ngày thanh toán:</strong>{" "}
                      {new Date(selectedPO.paymentDate).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography>
                    <strong>Tổng tiền:</strong>{" "}
                    {selectedPO.total.toLocaleString()} ₫
                  </Typography>
                  <Typography>
                    <strong>Tiền cọc:</strong>{" "}
                    {selectedPO.status === 6
                      ? "Chưa thỏa thuận"
                      : selectedPO.deposit?.toLocaleString() + " ₫"}
                  </Typography>
                  <Typography>
                    <strong>Còn nợ:</strong> {selectedPO.debt.toLocaleString()}{" "}
                    ₫
                  </Typography>
                </Box>
              </Box>

              <Typography sx={{ mt: 2, mb: 1, fontWeight: "bold" }}>
                Danh sách sản phẩm
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Sản phẩm</TableCell>
                    <TableCell>Mô tả</TableCell>
                    <TableCell>Đơn vị</TableCell>
                    <TableCell align="center">Số lượng</TableCell>
                    <TableCell align="center">Đơn giá</TableCell>
                    <TableCell>Thuế</TableCell>
                    <TableCell align="center">Thành tiền</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedPO.details?.map((item) => (
                    <TableRow key={item.podid}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.dvt}</TableCell>
                      <TableCell align="center">{item.quantity}</TableCell>
                      <TableCell align="center">
                        {item.unitPrice.toLocaleString()} ₫
                      </TableCell>
                      <TableCell>{item.tax * 100} %</TableCell>
                      <TableCell align="center">
                        {item.unitPriceTotal.toLocaleString()} ₫
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          ) : (
            <Typography>Đang tải chi tiết...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
