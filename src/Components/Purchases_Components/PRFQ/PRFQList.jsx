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
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  PlayCircle as PlayCircleIcon,
  Download as DownloadIcon,
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
    p.supplierName?.toLowerCase().includes(search.toLowerCase())
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
        return { label: "Sent", color: "info" };
      case 2:
        return { label: "Approved", color: "success" };
      case 3:
        return { label: "Rejected", color: "error" };
      case 4:
        return { label: "Draft", color: "default" };
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
      <Typography
        variant="h5"
        sx={{ fontWeight: 700, mb: 2, color: palette.primary.main }}
      >
        🧾 Yêu cầu báo giá mua hàng
      </Typography>

      {/* ===== Search & Create ===== */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
        >
          {/* Search */}
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

          {/* Button Tạo yêu cầu báo giá */}
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

      {/* ===== Table ===== */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Ngày tạo</TableCell>
                <TableCell>Nhà cung cấp</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Địa chỉ</TableCell>
                <TableCell>Số điện thoại</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Người phụ trách</TableCell>
                <TableCell align="center">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    Không có sản phẩm tương ứng
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, index) => (
                  <TableRow key={row.prfqid}>
                    <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                    <TableCell>{`PRFQ-${row.prfqid}`}</TableCell>
                    <TableCell>
                      {row.requestDate
                        ? new Date(row.requestDate).toLocaleDateString("vi-VN")
                        : "—"}
                    </TableCell>
                    <TableCell>{row.supplierName || "—"}</TableCell>
                    <TableCell>{row.supplierEmail || "—"}</TableCell>
                    <TableCell>{row.supplierAddress || "—"}</TableCell>
                    <TableCell>{row.supplierPhone || "—"}</TableCell>
                    <TableCell align="center">
                      {(() => {
                        const { label, color } = getStatus(row.status);
                        return <Chip label={label} color={color} size="small" />;
                      })()}
                    </TableCell>
                    <TableCell align="center">{row.createdBy || "—"}</TableCell>
                    <TableCell align="center">
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
                              <PlayCircleIcon />
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ===== Pagination ===== */}
        {filteredData.length > 0 && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", p: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
            />
          </Box>
        )}
      </Paper>

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
                  <Box sx={{ mb: 1 }}>
                    <Typography>
                      <b>PRFQ ID:</b> {`PRFQ-${detailData?.prfqid}`}
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
                  <Typography variant="h6" sx={{ mb: 1 }}>
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
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Tên SP</TableCell>
                    <TableCell>Mô tả</TableCell>
                    <TableCell>Đơn vị</TableCell>
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
