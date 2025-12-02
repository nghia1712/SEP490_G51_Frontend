// components/PRFQ/PRFQList.jsx
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
  InputAdornment,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Pagination,
  Card,
  CardContent,
  Container,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  RequestQuote,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import usePRFQ from "../../../Hooks/usePRFQ";
import palette from "../../../constants/palette";

export default function PRFQList() {
  const {
    prfqs,
    loading,
    snackbar,
    detailOpen,
    detailData,
    detailLoading,
    setDetailOpen,
    setDetailData,
    handleCloseSnackbar,
    loadData,
    handleDelete,
    handleViewDetail,
    handleDownload,
  } = usePRFQ();

  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    prfqId: null,
  });
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  // ===== Filter dữ liệu =====
  const filteredData = prfqs.filter((p) =>
    p.supplierName?.toLowerCase().includes(search.toLowerCase())||
    p.supplierEmail?.toLowerCase().includes(search.toLowerCase())||
    p.supplierPhone?.toLowerCase().includes(search.toLowerCase())||
    p.supplierAddress?.toLowerCase().includes(search.toLowerCase())||
    `PRFQ-${p.prfqid}`.toLowerCase().includes(search.toLowerCase())||
    p.createdBy?.toLowerCase().includes(search.toLowerCase())
  );

  // ===== Pagination =====
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // Reset page khi search thay đổi
  useEffect(() => {
    setPage(1);
  }, [search]);

  const getStatus = (statusCode) => {
    switch (statusCode) {
      case 1:
        return { label: "Chờ xử lý", color: "info" };
      case 2:
        return { label: "Đã duyệt", color: "success" };
      case 3:
        return { label: "Từ chối", color: "error" };
      case 4:
        return { label: "Nháp", color: "default" };
      default:
        return { label: "Không xác định", color: "default" };
    }
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setDetailData(null);
  };

  // ===== Các hàm navigate =====
  const handleCreate = () => {
    navigate("/purchase/prfq/form");
  };

  const handleContinue = (prfqId) => {
    navigate(`/purchase/prfq/form/${prfqId}`);
  };

  const handleConfirmDelete = () => {
    handleDelete(deleteConfirm.prfqId);
    setDeleteConfirm({ open: false, prfqId: null });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Container maxWidth="xl" sx={{ pt: 4, pb: 4 }}>
        <Card elevation={3} sx={{ borderRadius: 2 }}>
          <CardContent>
            {/* HEADER */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <RequestQuote sx={{ fontSize: 40, mr: 2, color: "#1976d2" }} />
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", flexGrow: 1, color: "#1976d2" }}
              >
                Yêu cầu báo giá mua hàng
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Tổng: {filteredData.length} yêu cầu
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
              >
                <TextField
                  placeholder="Tìm kiếm..."
                  size="small"
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
                  startIcon={<AddIcon />}
                  sx={{ backgroundColor: palette.success.main }}
                  onClick={handleCreate}
                >
                  Tạo yêu cầu báo giá
                </Button>
              </Stack>
            </Paper>

            {/* TABLE */}
            <TableContainer
              component={Paper}
              sx={{ borderRadius: 2, maxHeight: 500 }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell sx={{ fontWeight: "bold" }}>#</TableCell>
                    <TableCell
                      sx={{ fontWeight: "bold", whiteSpace: "nowrap" }}
                    >
                      Mã yêu cầu
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Ngày tạo</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Nhà cung cấp
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Địa chỉ</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Số điện thoại
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Trạng thái
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Người phụ trách
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: "bold", whiteSpace: "nowrap" }}
                      align="center"
                    >
                      Hành động
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                        <CircularProgress size={24} />
                      </TableCell>
                    </TableRow>
                  ) : paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                        Chưa có yêu cầu báo giá nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((row, index) => (
                      <TableRow key={row.prfqid}>
                        <TableCell>
                          {(page - 1) * pageSize + index + 1}
                        </TableCell>
                        <TableCell>{`PRFQ-${row.prfqid}`}</TableCell>
                        <TableCell>
                          {row.requestDate
                            ? new Date(row.requestDate).toLocaleDateString(
                                "vi-VN"
                              )
                            : "—"}
                        </TableCell>
                        <TableCell>{row.supplierName || "—"}</TableCell>
                        <TableCell>{row.supplierEmail || "—"}</TableCell>
                        <TableCell>{row.supplierAddress || "—"}</TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {row.supplierPhone || "—"}
                        </TableCell>
                        <TableCell align="center">
                          {(() => {
                            const { label, color } = getStatus(row.status);
                            return (
                              <Chip label={label} color={color} size="small" />
                            );
                          })()}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {row.createdBy || "—"}
                        </TableCell>
                        <TableCell align="center">
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="center"
                          >
                            {row.status !== 4 ? (
                              <Tooltip title="Chi tiết / Xem trước">
                                <IconButton
                                  color="primary"
                                  onClick={() => handleViewDetail(row.prfqid)}
                                >
                                  <VisibilityIcon />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <>
                                <Tooltip title="Tiếp tục chỉnh sửa">
                                  <IconButton
                                    color="success"
                                    onClick={() => handleContinue(row.prfqid)}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Xóa yêu cầu báo giá">
                                  <IconButton
                                    color="error"
                                    onClick={() =>
                                      setDeleteConfirm({
                                        open: true,
                                        prfqId: row.prfqid,
                                      })
                                    }
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </>
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
            {filteredData.length > 0 && totalPages > 1 && (
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

      {/* ===== Popup chi tiết ===== */}
      <Dialog
        open={detailOpen}
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: "bold",
          }}
        >
          Chi tiết yêu cầu báo giá
          {detailData && (
            <IconButton color="primary" onClick={handleDownload}>
              <DownloadIcon />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Box sx={{ textAlign: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : detailData ? (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography fontWeight={"bold"} variant="h6" sx={{ mb: 1 }}>
                    Yêu cầu báo giá
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    <Typography>
                      <b>Mã yêu cầu:</b> {`PRFQ-${detailData?.prfqid}`}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography>
                      <b>Trạng thái:</b>{" "}
                      <Chip
                        label={getStatus(detailData?.status).label}
                        color={getStatus(detailData?.status).color}
                        size="small"
                      />
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography>
                      <b>Người tạo:</b> {detailData?.createdBy?.userName || "—"}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography>
                      <b>Ngày yêu cầu:</b>{" "}
                      {detailData?.requestDate
                        ? new Date(detailData?.requestDate).toLocaleDateString(
                            "vi-VN"
                          )
                        : "—"}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography fontWeight={"bold"} variant="h6" sx={{ mb: 1 }}>
                    Nhà cung cấp
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    <Typography>
                      <b>Tên:</b>{" "}
                      {detailData?.supplier?.name ||
                        detailData?.supplierName ||
                        "—"}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography>
                      <b>Email:</b> {detailData?.supplier?.email || "—"}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography>
                      <b>Địa chỉ:</b> {detailData?.supplier?.address || "—"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography>
                      <b>SĐT:</b> {detailData?.supplier?.phoneNumber || "—"}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                Danh sách sản phẩm
              </Typography>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell sx={{ fontWeight: "bold" }}>#</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Tên SP</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Mô tả</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Đơn vị</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {detailData?.products?.map((d, i) => (
                    <TableRow key={i}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{d.productName}</TableCell>
                      <TableCell>{d.productDescription || "—"}</TableCell>
                      <TableCell>{d.unit || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : (
            <Typography>Không có dữ liệu</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* ===== Popup xác nhận xóa ===== */}
      <Dialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, prfqId: null })}
      >
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          Bạn có chắc muốn xóa yêu cầu báo giá này không?
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteConfirm({ open: false, prfqId: null })}
          >
            Hủy
          </Button>
          <Button color="error" onClick={handleConfirmDelete}>
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Snackbar ===== */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
