import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Typography,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  CircularProgress,
  TablePagination,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import pqApi from "../../../API/pqAPI";
import prfqApi from "../../../API/prfqAPI";
import palette from "../../../constants/palette";

export default function PQList() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const navigate = useNavigate();

  // State upload
  const [openUpload, setOpenUpload] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Snackbar feedback
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await pqApi.getAllWithStatus();
      console.log("📦 Dữ liệu PQ:", res.data);

      const list = Array.isArray(res.data.data)
        ? res.data.data.map((item) => ({
            quotationId: item.qid,
            sentDate: item.sendDate,
            supplierName: item.supplierID,
            status: item.status === 0 ? "InDate" : "OutOfDate",
            expiredDate: item.quotationExpiredDate,
            items: item.quotationDetailDTOs,
          }))
        : [];

      setQuotations(list);
    } catch (err) {
      console.error("Lỗi khi tải danh sách PQ:", err);
      setSnackbar({
        open: true,
        message: "Tải danh sách PQ thất bại",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };
  const [openDetailDialog, setOpenDetailDialog] = useState(false);

  const handleOpenDetail = async (id) => {
    try {
      const res = await pqApi.getDetail(id);
      const q = res.data?.data;
      console.log("📦 Chi tiết PQ:", q);

      setSelectedQuotation({
        quotationId: q.qid,
        supplierName: q.supplierName || "(Chưa có tên NCC)",
        sentDate: q.sendDate,
        expiredDate: q.quotationExpiredDate,
        status: q.status === 0 ? "InDate" : "OutOfDate",
        items: q.quotationDetailDTOs || [],
      });

      setOpenDetailDialog(true);
    } catch (error) {
      console.error("❌ Lỗi khi lấy chi tiết PQ:", error);
    }
  };

  const handleCloseDetail = () => {
    setOpenDetail(false);
    setSelectedQuotation(null);
  };

  // Upload Excel
  const handleOpenUpload = () => setOpenUpload(true);
  const handleCloseUpload = () => {
    setOpenUpload(false);
    setExcelFile(null);
  };

  const [uploadedProducts, setUploadedProducts] = useState([]);
  const [excelKey, setExcelKey] = useState(null);
  const [openPreview, setOpenPreview] = useState(false);

  const handleUploadExcel = async () => {
    if (!excelFile) {
      setSnackbar({
        open: true,
        message: "Vui lòng chọn file Excel",
        severity: "warning",
      });
      return;
    }

    setUploading(true);
    try {
      // Upload Excel
      const res = await prfqApi.uploadSupplierExcel(excelFile);
      const { excelKey, products } = res.data || {};

      if (!excelKey || !products)
        throw new Error("Phản hồi server không hợp lệ");

      // Lưu excelKey và mở preview dialog
      localStorage.setItem("excelKey", excelKey);
      setExcelKey(excelKey);
      setUploadedProducts(products);
      setOpenPreview(true);
    } catch (err) {
      console.error("❌ Lỗi upload:", err);
      setSnackbar({
        open: true,
        message: "Upload file thất bại",
        severity: "error",
      });
    } finally {
      setUploading(false);
    }
  };
  const handleConfirmConvert = async () => {
    try {
      const data = {
        excelKey,
        details: uploadedProducts.map((p) => ({
          productId: p.productID,
          quantity: p.suggestedQuantity || 1,
        })),
        status: 6,
      };

      const res = await prfqApi.convertToPo(data);
      console.log("✅ ConvertToPo success:", res.data);
      setExcelKey(null);
      setSnackbar({
        open: true,
        message: "Tạo báo giá thành công!",
        severity: "success",
      });

      setOpenPreview(false);
      handleCloseUpload();
      loadData(); // load lại danh sách PQ
    } catch (err) {
      console.error("❌ ConvertToPo error:", err);
      setSnackbar({
        open: true,
        message: "Tạo báo giá thất bại",
        severity: "error",
      });
    }
  };
  const parseDDMMYYYY = (str) => {
    if (!str) return null;
    const [day, month, year] = str.split("/");
    return new Date(`${year}-${month}-${day}`);
  };

  // const filteredData = quotations.filter((q) =>
  //   q.supplierName?.toLowerCase().includes(search.toLowerCase())
  // );
  const filteredData = quotations;

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h5"
        sx={{ fontWeight: 700, mb: 2, color: palette.primary.main }}
      >
        💼 Quản lý báo giá NCC
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Tìm kiếm theo nhà cung cấp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 350 }}
          />

          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenUpload}
          >
            Upload Excel
          </Button>
        </Stack>
      </Paper>

      {/* Table PQ */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>QID</TableCell>
                <TableCell>Ngày gửi</TableCell>
                <TableCell>Nhà cung cấp</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Ngày hết hạn</TableCell>
                <TableCell align="center">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Không có dữ liệu báo giá NCC
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((row, index) => (
                  <TableRow key={row.quotationId}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{row.quotationId}</TableCell>
                    <TableCell>
                      {new Date(row.sentDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{row.supplierName}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.status}
                        color={
                          row.status === "InDate"
                            ? "success"
                            : row.status === "OutOfDate"
                            ? "error"
                            : "default"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(row.expiredDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Xem chi tiết">
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenDetail(row.quotationId)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog
        open={openDetailDialog}
        onClose={() => setOpenDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Chi tiết báo giá #{selectedQuotation?.quotationId}
        </DialogTitle>

        <DialogContent dividers>
          <Typography>
            <strong>Nhà cung cấp:</strong> {selectedQuotation?.supplierName}
          </Typography>
          <Typography>
            <strong>Ngày gửi:</strong>{" "}
            {new Date(selectedQuotation?.sentDate).toLocaleDateString()}
          </Typography>
          <Typography>
            <strong>Ngày hết hạn:</strong>{" "}
            {new Date(selectedQuotation?.expiredDate).toLocaleDateString()}
          </Typography>
          <Typography sx={{ mb: 2 }}>
            <strong>Trạng thái:</strong>{" "}
            <Chip
              label={selectedQuotation?.status}
              color={
                selectedQuotation?.status === "InDate"
                  ? "success"
                  : selectedQuotation?.status === "OutOfDate"
                  ? "error"
                  : "default"
              }
              size="small"
            />
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Tên sản phẩm</TableCell>
                <TableCell>Mô tả</TableCell>
                <TableCell>Đơn vị</TableCell>
                <TableCell>Đơn giá</TableCell>
                <TableCell>Hạn dùng</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedQuotation?.items?.map((item, i) => (
                <TableRow key={i}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{item.productName}</TableCell>
                  <TableCell>{item.productDescription}</TableCell>
                  <TableCell>{item.productUnit}</TableCell>
                  <TableCell>{item.unitPrice?.toLocaleString()} đ</TableCell>
                  <TableCell>
                    {item.productDate
                      ? new Date(item.productDate).toLocaleDateString()
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDetailDialog(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Modal upload Excel */}
      <Dialog
        open={openUpload}
        onClose={handleCloseUpload}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload file Excel PQ</DialogTitle>
        <DialogContent>
          <Button variant="outlined" component="label" disabled={uploading}>
            Chọn file Excel
            <input
              type="file"
              accept=".xlsx, .xls"
              hidden
              onChange={(e) => setExcelFile(e.target.files[0])}
            />
          </Button>
          {excelFile && (
            <Typography sx={{ mt: 1 }}>{excelFile.name}</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUpload} disabled={uploading}>
            Hủy
          </Button>
          <Button
            onClick={handleUploadExcel}
            disabled={!excelFile || uploading}
            variant="contained"
            color="primary"
          >
            {uploading ? "Đang upload..." : "Upload"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
      {/* Dialog Preview sau khi upload */}
      <Dialog
        open={openPreview}
        onClose={() => setOpenPreview(false)}
        maxWidth="lg" // giữ breakpoint lg
        fullWidth // để width có thể mở rộng
        scroll="paper"
        sx={{
          "& .MuiDialog-paper": {
            width: "90vw",
            maxWidth: "none",
          },
        }}
      >
        <DialogTitle sx={{ fontSize: "1.4rem", fontWeight: 700 }}>
          Xác nhận sản phẩm từ Excel
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            bgcolor: "#bbe5f2ff",
            minHeight: "70vh",
            overflow: "auto",
          }}
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

                  {/* Quantity input */}
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
                      value={p.quantity}
                      onChange={(e) => {
                        let newQuantity = Number(e.target.value);
                        const min = 1;
                        const max = p.suggestedQuantity || 1;
                        let errorMsg = "";

                        if (newQuantity < min) {
                          errorMsg = `Phải có ít nhất 1 sản phẩm`;
                          newQuantity = min;
                        } else if (newQuantity > max) {
                          errorMsg = `Số lượng không được vượt quá ${max}`;
                          newQuantity = max;
                        }

                        setUploadedProducts((prev) =>
                          prev.map((item, idx) =>
                            idx === i
                              ? { ...item, quantity: newQuantity }
                              : item
                          )
                        );

                        if (errorMsg) {
                          setSnackbar({
                            open: true,
                            message: errorMsg,
                            severity: "error",
                          });
                        }
                      }}
                      error={p.quantity < 1 || p.quantity > p.suggestedQuantity}
                      helperText={
                        p.quantity < 1
                          ? `Phải có ít nhất 1 sản phẩm`
                          : p.quantity > p.suggestedQuantity
                          ? `Không thể vượt quá số lượng cho phép (${p.suggestedQuantity})`
                          : ""
                      }
                      sx={{
                        width: 70,
                        "& input": {
                          textAlign: "center",
                          fontWeight: 600,
                          fontSize: "1rem",
                        },
                      }}
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
                      sx={{ width: "100%", "& input": { textAlign: "center" } }}
                    />
                  </TableCell>

                  <TableCell sx={{ width: 110 }}>
                    <TextField
                      size="small"
                      type="number"
                      value={p.maxQuantity}
                      disabled
                      sx={{ width: "100%", "& input": { textAlign: "center" } }}
                    />
                  </TableCell>

                  <TableCell sx={{ minWidth: 120 }}>
                    {p.expiredDateDisplay
                      ? parseDDMMYYYY(p.expiredDateDisplay).toLocaleDateString(
                          "vi-VN"
                        )
                      : "-"}
                  </TableCell>

                  <TableCell>
                    <IconButton
                      color="error"
                      onClick={() => {
                        setUploadedProducts((prev) =>
                          prev.filter((_, index) => index !== i)
                        );
                      }}
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
            onClick={() => setOpenPreview(false)}
            sx={{ px: 3, py: 1 }}
          >
            Đóng
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmConvert}
            sx={{ px: 3, py: 1 }}
          >
            Gửi yêu cầu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
