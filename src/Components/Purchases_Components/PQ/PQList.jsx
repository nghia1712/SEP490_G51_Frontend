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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Snackbar,
  Alert,
} from "@mui/material";
import { Search as SearchIcon, Visibility as VisibilityIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import pqApi from "../../../API/pqAPI";
import palette from "../../../constants/palette";

export default function PQList() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const navigate = useNavigate();

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

  const handleOpenDetail = async (id) => {
    try {
      const res = await pqApi.getDetail(id);
      const q = res.data?.data;

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

  const filteredData = quotations;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: palette.primary.main }}>
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
        </Stack>
      </Paper>

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
                    <TableCell>{new Date(row.sentDate).toLocaleDateString()}</TableCell>
                    <TableCell>{row.supplierName}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.status}
                        color={row.status === "InDate" ? "success" : "error"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(row.expiredDate).toLocaleDateString()}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Xem chi tiết">
                        <IconButton color="primary" onClick={() => handleOpenDetail(row.quotationId)}>
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
        <DialogTitle>Chi tiết báo giá #{selectedQuotation?.quotationId}</DialogTitle>

        <DialogContent dividers>
          <Typography><strong>Nhà cung cấp:</strong> {selectedQuotation?.supplierName}</Typography>
          <Typography><strong>Ngày gửi:</strong> {new Date(selectedQuotation?.sentDate).toLocaleDateString()}</Typography>
          <Typography><strong>Ngày hết hạn:</strong> {new Date(selectedQuotation?.expiredDate).toLocaleDateString()}</Typography>
          <Typography sx={{ mb: 2 }}>
            <strong>Trạng thái:</strong>{" "}
            <Chip
              label={selectedQuotation?.status}
              color={selectedQuotation?.status === "InDate" ? "success" : "error"}
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
                  <TableCell>{item.productDate ? new Date(item.productDate).toLocaleDateString() : "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDetailDialog(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

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
