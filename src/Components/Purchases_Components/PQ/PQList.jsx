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
      setQuotations(res.data || []);
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

  const handleOpenDetail = async (id) => {
    setOpenDetail(true);
    setDetailLoading(true);
    try {
      const res = await pqApi.getDetail(id);
      setSelectedQuotation(res.data);
    } catch (err) {
      console.error("Lỗi khi tải chi tiết PQ:", err);
      setSnackbar({
        open: true,
        message: "Tải chi tiết PQ thất bại",
        severity: "error",
      });
    } finally {
      setDetailLoading(false);
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
    const res = await prfqApi.uploadSupplierExcel(excelFile);

    const excelKey = res.data?.excelKey;
    if (excelKey) {
      localStorage.setItem("excelKey", excelKey);
    }

    setSnackbar({
      open: true,
      message: "Upload Excel thành công!",
      severity: "success",
    });
    loadData();
    handleCloseUpload();
  } catch (err) {
    console.error(err);
    setSnackbar({
      open: true,
      message: "Upload Excel thất bại",
      severity: "error",
    });
  } finally {
    setUploading(false);
  }
};


  const filteredData = quotations.filter((q) =>
    q.supplierName?.toLowerCase().includes(search.toLowerCase())
  );

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

        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <TablePagination
            component="div"
            count={filteredData.length}
            rowsPerPage={10}
            page={0}
            onPageChange={() => {}}
            onRowsPerPageChange={() => {}}
          />
        </Box>
      </Paper>

      {/* Popup chi tiết */}
      <Dialog
        open={openDetail}
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Chi tiết báo giá NCC
          </Typography>
          <IconButton onClick={handleCloseDetail}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent dividers>
          {detailLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : selectedQuotation ? (
            <Box>
              <Typography>
                <strong>Mã báo giá:</strong> {selectedQuotation.quotationId}
              </Typography>
              <Typography>
                <strong>Nhà cung cấp:</strong> {selectedQuotation.supplierName}
              </Typography>
              <Typography>
                <strong>Ngày gửi:</strong>{" "}
                {new Date(selectedQuotation.sentDate).toLocaleDateString()}
              </Typography>
              <Typography>
                <strong>Ngày hết hạn:</strong>{" "}
                {new Date(selectedQuotation.expiredDate).toLocaleDateString()}
              </Typography>
              <Typography>
                <strong>Trạng thái:</strong>{" "}
                <Chip
                  label={selectedQuotation.status}
                  color={
                    selectedQuotation.status === "InDate"
                      ? "success"
                      : selectedQuotation.status === "OutOfDate"
                      ? "error"
                      : "default"
                  }
                  size="small"
                />
              </Typography>

              <Divider sx={{ my: 2 }} />

              {selectedQuotation.items && selectedQuotation.items.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Tên sản phẩm</TableCell>
                      <TableCell>Số lượng</TableCell>
                      <TableCell>Đơn giá</TableCell>
                      <TableCell>Thành tiền</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedQuotation.items.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          {item.unitPrice?.toLocaleString()} đ
                        </TableCell>
                        <TableCell>
                          {(item.quantity * item.unitPrice)?.toLocaleString()} đ
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography color="text.secondary">
                  Không có sản phẩm nào trong báo giá.
                </Typography>
              )}
            </Box>
          ) : (
            <Typography>Không tìm thấy dữ liệu chi tiết.</Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={handleCloseDetail}
            color="primary"
            variant="contained"
          >
            Đóng
          </Button>
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
    </Box>
  );
}
