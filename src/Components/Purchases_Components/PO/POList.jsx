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
} from "@mui/material";
import { Visibility, Search, Close as CloseIcon } from "@mui/icons-material";
import POActions from "./POActions";
import usePO from "../../../Hooks/usePO";

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
  } = usePO();

  const renderStatus = (status) => {
    const s = statusMap[status] || { label: "Unknown", color: "default" };
    return <Chip label={s.label} color={s.color} size="small" />;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Danh sách yêu cầu mua hàng (PO)
      </Typography>

      {/* Search + Upload */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Tìm kiếm PO ID hoặc người tạo..."
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
          <Button variant="contained" onClick={handleOpenUpload} sx={{ mb: 2 }}>
            Upload Excel
          </Button>
        </Stack>
      </Paper>

      {loading ? (
        <Stack alignItems="center" mt={4}>
          <CircularProgress />
        </Stack>
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>PO ID</TableCell>
                  <TableCell>Người tạo</TableCell>
                  <TableCell>Nhà cung cấp</TableCell>
                  <TableCell>Ngày đặt</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell align="center">Trạng thái nhận hàng</TableCell>
                  <TableCell>Tổng tiền</TableCell>
                  <TableCell>Đã trả</TableCell>
                  <TableCell>Còn nợ</TableCell>
                  <TableCell>Người trả</TableCell>
                  <TableCell align="center">Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPOs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} align="center">
                      Không có dữ liệu PO
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPOs.map((po, index) => (
                    <TableRow key={po.poid}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{`PO-${po.poid}`}</TableCell>
                      <TableCell>{po.userName}</TableCell>
                      <TableCell>{po.supplierName || "-"}</TableCell>
                      <TableCell>
                        {new Date(po.orderDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="center">
                        {renderStatus(po.status)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={po.receivingStatus}
                          color={
                            po.receivingStatus === "Đã nhận đủ"
                              ? "success"
                              : po.receivingStatus === "Nhận một phần"
                              ? "warning"
                              : "default"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{po.total.toLocaleString()} ₫</TableCell>
                      <TableCell align="right">
                        {po.deposit?.toLocaleString() || 0} ₫
                      </TableCell>
                      <TableCell align="right">
                        {po.debt.toLocaleString()} ₫
                      </TableCell>
                      <TableCell>{po.paymentBy || "Chưa thanh toán"}</TableCell>
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
                          <POActions poId={po.poid} fetchPOs={() => {}} />
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Upload Excel Dialog */}
      <Dialog
        open={previewOpen || openUpload}
        onClose={handleCloseUpload}
        fullWidth
      >
        {openUpload && (
          <>
            <DialogTitle>Upload file Excel PO</DialogTitle>
            <DialogContent>
              <Button variant="outlined" component="label" disabled={uploading}>
                Chọn file Excel
                <input
                  type="file"
                  hidden
                  accept=".xlsx,.xls"
                  onChange={(e) => setExcelFile(e.target.files[0])}
                />
              </Button>
              {excelFile && <p>{excelFile.name}</p>}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseUpload} disabled={uploading}>
                Hủy
              </Button>
              <Button
                onClick={handleUploadExcel}
                disabled={!excelFile || uploading}
                variant="contained"
              >
                {uploading ? "Đang upload..." : "Upload"}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      {/* Preview Excel Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
        scroll="paper"
        sx={{ "& .MuiDialog-paper": { width: "90vw", maxWidth: "none" } }}
      >
        {previewOpen && (
          <>
            <DialogTitle>Xác nhận sản phẩm từ Excel</DialogTitle>
            <DialogContent
              dividers
              sx={{ bgcolor: "#bbe5f2ff", minHeight: "70vh", overflow: "auto" }}
            >
              <Table size="small">
                <TableHead sx={{ background: "#f0f0f0" }}>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Tên sản phẩm</TableCell>
                    <TableCell>Mô tả</TableCell>
                    <TableCell>ĐVT</TableCell>
                    <TableCell>Đơn giá</TableCell>
                    <TableCell>Số lượng</TableCell>
                    <TableCell>Gợi ý</TableCell>
                    <TableCell>Tối thiểu</TableCell>
                    <TableCell>Tối đa</TableCell>
                    <TableCell>Hạn sử dụng</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {uploadedProducts.map((p, i) => (
                    <TableRow key={p.productID}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell sx={{ maxWidth: 280, whiteSpace: "normal" }}>
                        {p.productName}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 350, whiteSpace: "normal" }}>
                        {p.description}
                      </TableCell>
                      <TableCell>{p.dvt}</TableCell>
                      <TableCell sx={{ width: 100 }}>
                        {p.unitPrice.toLocaleString()} ₫
                      </TableCell>
                      <TableCell
                        sx={{
                          width: 110,
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <TextField
                          size="small"
                          type="number"
                          value={p.quantity === 0 ? "" : p.quantity}
                          onChange={(e) => {
                            const val = e.target.value;
                            let newQuantity = val === "" ? "" : Number(val);
                            setUploadedProducts((prev) =>
                              prev.map((item, idx) =>
                                idx === i
                                  ? { ...item, quantity: newQuantity }
                                  : item
                              )
                            );
                          }}
                          onBlur={() => {
                            setUploadedProducts((prev) =>
                              prev.map((item, idx) =>
                                idx === i
                                  ? {
                                      ...item,
                                      quantity:
                                        item.quantity === ""
                                          ? 1
                                          : item.quantity,
                                    }
                                  : item
                              )
                            );
                          }}
                          error={
                            p.quantity !== "" &&
                            (p.quantity < 1 ||
                              p.quantity > (p.maxQuantity || 1))
                          }
                          helperText={
                            p.quantity !== "" &&
                            (p.quantity < 1
                              ? `Phải có ít nhất 1 sản phẩm`
                              : p.quantity > (p.maxQuantity || 1)
                              ? `Không thể vượt quá số lượng tối đa (${p.maxQuantity})`
                              : "")
                          }
                        />
                      </TableCell>
                      <TableCell sx={{ width: 110 }}>
                        <TextField
                          size="small"
                          type="number"
                          value={p.suggestedQuantity}
                          disabled
                          sx={{
                            width: "100%",
                            "& input": { textAlign: "center", fontWeight: 500 },
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ width: 110 }}>
                        <TextField
                          size="small"
                          type="number"
                          value={p.minQuantity}
                          disabled
                          sx={{
                            width: "100%",
                            "& input": { textAlign: "center" },
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ width: 110 }}>
                        <TextField
                          size="small"
                          type="number"
                          value={p.maxQuantity}
                          disabled
                          sx={{
                            width: "100%",
                            "& input": { textAlign: "center" },
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 120 }}>
                        {p.expiredDateDisplay
                          ? parseDDMMYYYY(
                              p.expiredDateDisplay
                            ).toLocaleDateString("vi-VN")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color="error"
                          onClick={() =>
                            setUploadedProducts((prev) =>
                              prev.filter((_, index) => index !== i)
                            )
                          }
                        >
                          <CloseIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DialogContent>
            <DialogActions
              sx={{
                justifyContent: "space-between",
                px: 3,
                py: 2,
                background: "#fff",
                borderTop: "1px solid #ddd",
              }}
            >
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => setPreviewOpen(false)}
                sx={{ px: 3, py: 1 }}
              >
                Đóng
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleConvertExcel}
                disabled={sending}
              >
                {sending ? "Đang gửi..." : "Gửi yêu cầu"}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Detail PO Dialog */}
      <Dialog
        open={openDetail}
        onClose={handleCloseDetail}
        maxWidth="md"
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
                    <strong>Người tạo:</strong> {selectedPO.userName}
                  </Typography>
                  <Typography>
                    <strong>Ngày đặt:</strong>{" "}
                    {new Date(selectedPO.orderDate).toLocaleString()}
                  </Typography>
                  <Typography>
                    <strong>Trạng thái:</strong>{" "}
                    {renderStatus(selectedPO.status)}
                  </Typography>
                  <Typography>
                    <strong>Tổng tiền:</strong>{" "}
                    {selectedPO.total.toLocaleString()} ₫
                  </Typography>
                </Box>
                <Box>
                  {selectedPO.status === 3 && selectedPO.deposit > 0 && (
                    <Typography>
                      <strong>Ngày đặt cọc:</strong>{" "}
                      {new Date(selectedPO.depositDate).toLocaleDateString()}
                    </Typography>
                  )}
                  {selectedPO.status === 4 && (
                    <Typography>
                      <strong>Ngày thanh toán:</strong>{" "}
                      {new Date(selectedPO.paymentDate).toLocaleDateString()}
                    </Typography>
                  )}
                  <Typography>
                    <strong>Tiền cọc:</strong>{" "}
                    {selectedPO.status === 6
                      ? "Chưa thỏa thuận"
                      : selectedPO.deposit?.toLocaleString() + " ₫"}
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
                  <Typography>
                    <strong>Công nợ:</strong> {selectedPO.debt.toLocaleString()}{" "}
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
                    <TableCell>ĐVT</TableCell>
                    <TableCell align="center">Số lượng</TableCell>
                    <TableCell align="center">Đơn giá</TableCell>
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
