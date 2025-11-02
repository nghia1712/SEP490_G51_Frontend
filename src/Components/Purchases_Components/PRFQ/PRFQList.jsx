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
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  PlayCircle as PlayCircleIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import prfqApi from "../../../API/prfqAPI";
import palette from "../../../constants/palette";

export default function PRFQList() {
  const [prfqs, setPrfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    prfqId: null,
  });

  const navigate = useNavigate();

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  useEffect(() => {
    loadData();
  }, []);

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

  const loadData = async () => {
    try {
      const res = await prfqApi.getAll();
      const result = res.data?.data;
      if (Array.isArray(result)) setPrfqs(result);
      else setPrfqs([]);
    } catch (err) {
      console.error("Lỗi khi tải danh sách yêu cầu báo giá:", err);
      setPrfqs([]);
      showSnackbar("Lỗi khi tải danh sách yêu cầu báo giá!", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await prfqApi.delete(deleteConfirm.prfqId);
      setPrfqs(prfqs.filter((p) => p.prfqid !== deleteConfirm.prfqId));
      showSnackbar("Đã xóa thành công!", "success");
    } catch (err) {
      console.error("Lỗi khi xóa yêu cầu báo giá:", err);
      showSnackbar("Không thể xóa yêu cầu bóa giá này!", "error");
    } finally {
      setDeleteConfirm({ open: false, prfqId: null });
    }
  };

  const handleViewDetail = (id) => {
    navigate(`/purchase/prfq/detail/${id}`);
  };

  const handleCreate = () => navigate(`/purchase/prfq/form`);

  const handleContinue = (id) => {
    navigate(`/purchase/prfq/form/${id}`);
  };

  const filteredData = prfqs.filter((p) =>
    p.supplierName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h5"
        sx={{ fontWeight: 700, mb: 2, color: palette.primary.main }}
      >
        🧾 Yêu cầu báo giá mua hàng
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
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
            startIcon={<AddIcon />}
            sx={{ backgroundColor: palette.success.main }}
            onClick={handleCreate}
          >
            Tạo yêu cầu báo giá
          </Button>
        </Stack>
      </Paper>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
              <TableRow>
                <TableCell>#</TableCell>
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
                  <TableCell colSpan={9} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    Không có sản phẩm tương ứng
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((row, index) => (
                  <TableRow key={row.prfqid}>
                    <TableCell>{index + 1}</TableCell>
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
                        return (
                          <Chip label={label} color={color} size="small" />
                        );
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
      </Paper>

      {/* Popup xác nhận xóa */}
      <Dialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, prfqId: null })}
      >
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>Bạn có chắc muốn xóa yêu cầu báo giá này không?</DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteConfirm({ open: false, prfqId: null })}
          >
            Hủy
          </Button>
          <Button color="error" onClick={handleDelete}>
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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
