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
  Menu,
  MenuItem,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  PlayCircle as PlayCircleIcon,
  CheckCircle as CheckIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import prfqApi from "../../../API/prfqAPI";
import palette from "../../../constants/palette";

export default function PRFQList() {
  const [prfqs, setPrfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPRFQId, setSelectedPRFQId] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
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
      case 0:
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
      console.error("Lỗi khi tải danh sách PRFQ:", err);
      setPrfqs([]);
      showSnackbar("Lỗi khi tải danh sách PRFQ!", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, status) => {
    if (status !== "Draft") return;
    if (!window.confirm("Bạn có chắc muốn xóa PRFQ này không?")) return;
    try {
      await prfqApi.delete(id);
      setPrfqs(prfqs.filter((p) => p.prfqid !== id));
      showSnackbar("Đã xóa thành công!", "success");
    } catch (err) {
      console.error("Lỗi khi xóa PRFQ:", err);
      showSnackbar("Không thể xóa PRFQ này!", "error");
    }
  };

  const handleViewDetail = (id, status) => {
    if (status !== 0 && status !== 4) {
      navigate(`/purchase/prfq/detail/${id}`);
    }
  };

  const handleCreate = () => navigate(`/purchase/prfq/form`);

  const handleContinue = (id, status) => {
    if (status === "Draft" || status === 0 || status === 4) {
      navigate(`/purchase/prfq/form/${id}`);
    }
  };

  const handleMenuOpen = (event, prfqId) => {
    setAnchorEl(event.currentTarget);
    setSelectedPRFQId(prfqId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPRFQId(null);
  };

  const handleSelectStatus = async (newStatus) => {
    if (!selectedPRFQId) return;
    try {
      await prfqApi.changeStatus(selectedPRFQId, newStatus);
      showSnackbar("Đã cập nhật trạng thái!", "success");
      loadData();
    } catch (err) {
      console.error(err);
      showSnackbar("Lỗi khi cập nhật trạng thái!", "error");
    } finally {
      handleMenuClose();
    }
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
                <TableCell>Mã số thuế</TableCell>
                <TableCell>Số điện thoại</TableCell>
                <TableCell>Địa chỉ</TableCell>
                <TableCell>Nhà cung cấp</TableCell>
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
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
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
                    <TableCell>{row.taxCode || "—"}</TableCell>
                    <TableCell>{row.myPhone || "—"}</TableCell>
                    <TableCell>{row.myAddress || "—"}</TableCell>
                    <TableCell>{row.supplierName || "—"}</TableCell>
                    <TableCell align="center">
                      {(() => {
                        const { label, color } = getStatus(row.status);
                        return <Chip label={label} color={color} size="small" />;
                      })()}
                    </TableCell>
                    <TableCell align="center">{row.createdBy || "—"}</TableCell>
                    <TableCell align="center">
                      {/* Hành động cho trạng thái đã gửi */}
                      {row.status !== 0 && row.status !== 4 && (
                        <>
                          <Tooltip title="Chi tiết">
                            <IconButton
                              color="primary"
                              onClick={() =>
                                handleViewDetail(row.prfqid, row.status)
                              }
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>

                          {row.status === 1 && (
                            <>
                              <Tooltip title="Change Status">
                                <IconButton
                                  color="warning"
                                  onClick={(e) =>
                                    handleMenuOpen(e, row.prfqid)
                                  }
                                >
                                  <PlayCircleIcon />
                                </IconButton>
                              </Tooltip>

                              <Menu
                                anchorEl={anchorEl}
                                open={
                                  Boolean(anchorEl) &&
                                  selectedPRFQId === row.prfqid
                                }
                                onClose={handleMenuClose}
                              >
                                <MenuItem
                                  onClick={() => handleSelectStatus(2)}
                                >
                                  <CheckIcon sx={{ mr: 1 }} /> Approve
                                </MenuItem>
                                <MenuItem
                                  onClick={() => handleSelectStatus(3)}
                                >
                                  <CloseIcon sx={{ mr: 1 }} /> Reject
                                </MenuItem>
                              </Menu>
                            </>
                          )}
                        </>
                      )}

                      {/* Hành động cho Draft */}
                      {(row.status === 4 || row.status === 0) && (
                        <>
                          <Tooltip title="Tiếp tục chỉnh sửa">
                            <IconButton
                              color="success"
                              onClick={() =>
                                handleContinue(row.prfqid, row.status)
                              }
                            >
                              <PlayCircleIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xóa yêu cầu báo giá">
                            <IconButton
                              color="error"
                              onClick={() =>
                                handleDelete(row.prfqid, row.status)
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

      {/* Snackbar hiển thị thông báo */}
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
