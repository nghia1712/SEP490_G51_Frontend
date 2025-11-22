import React, { useState } from "react";
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
  Button,
  Snackbar,
  Alert,
  Pagination,
} from "@mui/material";
import {
  Search as SearchIcon,
  Visibility,
  NoteAdd,
  Delete,
} from "@mui/icons-material";
import palette from "../../../constants/palette";
import usePQ from "../../../Hooks/usePQ";

export default function PQList() {
  const {
    quotations,
    loading,
    selectedQuotation,
    openDetailDialog,
    setOpenDetailDialog,
    openCreatePoDialog,
    setOpenCreatePoDialog,
    quotationToCreatePo,
    sending,
    snackbar,
    setSnackbar,
    openDetail,
    openCreatePO,
    createPO,
    changeQuantity,
    removeItem,
  } = usePQ();
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = quotations.filter((q) =>
    q.supplierName?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / pageSize);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleCreatePO = async (status) => {
    setProcessing(true);
    try {
      await createPO(status);
    } finally {
      setProcessing(false);
    }
  };
  const statusMap = {
    InDate: "Còn hiệu lực",
    OutOfDate: "Hết hiệu lực",
  };

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
        </Stack>
      </Paper>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Mã báo giá</TableCell>
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
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((row, i) => {
                  const isValid = row.status === "InDate";
                  return (
                    <TableRow key={row.quotationId}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{`PQ-${row.quotationId}`}</TableCell>
                      <TableCell>
                        {new Date(row.sentDate).toLocaleDateString("vi-EN")}
                      </TableCell>
                      <TableCell>{row.supplierName}</TableCell>
                      <TableCell>
                        <Chip
                          label={statusMap[row.status] || row.status}
                          color={row.status === "InDate" ? "success" : "error"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{row.expiredDate}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Xem chi tiết">
                          <span>
                            <IconButton
                              color="primary"
                              onClick={() => openDetail(row.quotationId)}
                              disabled={processing}
                            >
                              <Visibility />
                            </IconButton>
                          </span>
                        </Tooltip>

                        {isValid && (
                          <Tooltip title="Tạo yêu cầu">
                            <span>
                              <IconButton
                                color="secondary"
                                onClick={() => openCreatePO(row.quotationId)}
                                disabled={processing}
                              >
                                <NoteAdd />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
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
      </Paper>

      {/* Dialog Chi tiết PQ */}
      <Dialog
        open={openDetailDialog}
        onClose={() => setOpenDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Chi tiết báo giá {`PQ-${selectedQuotation?.quotationId}`}
        </DialogTitle>
        <DialogContent dividers>
          <Typography>
            <strong>Nhà cung cấp:</strong> {selectedQuotation?.supplierName}
          </Typography>
          <Typography>
            <strong>Ngày gửi:</strong>{" "}
            {new Date(selectedQuotation?.sentDate).toLocaleDateString("vi-EN")}
          </Typography>
          <Typography>
            <strong>Ngày hết hạn:</strong>{" "}
            {new Date(selectedQuotation?.expiredDate).toLocaleDateString(
              "vi-EN"
            )}
          </Typography>
          <Typography sx={{ mb: 2 }}>
            <strong>Trạng thái:</strong>{" "}
            <Chip
              label={
                statusMap[selectedQuotation?.status] ||
                selectedQuotation?.status
              }
              color={
                selectedQuotation?.status === "InDate" ? "success" : "error"
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
                  <TableCell>{item.productDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDetailDialog(false)}
            disabled={processing}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Tạo PO */}
      <Dialog
        open={openCreatePoDialog}
        onClose={() => setOpenCreatePoDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Tạo yêu cầu mua hàng</DialogTitle>
        <DialogContent dividers>
          {quotationToCreatePo && (
            <>
              <Typography>
                <strong>Mã báo giá:</strong> PQ-
                {quotationToCreatePo.quotationId}
              </Typography>
              <Typography sx={{ mt: 2, fontWeight: "bold" }}>
                Danh sách sản phẩm:
              </Typography>

              <Table size="small">
                <TableHead sx={{ background: "#e0e0e0" }}>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Sản phẩm</TableCell>
                    <TableCell>Mô tả</TableCell>
                    <TableCell align="center">Đơn vị</TableCell>
                    <TableCell align="center">Đơn giá</TableCell>
                    <TableCell align="center">Thuế</TableCell>
                    <TableCell align="center">Số lượng</TableCell>
                    <TableCell align="center">Gợi ý</TableCell>
                    <TableCell align="center">Tối thiểu</TableCell>
                    <TableCell align="center">Hiện tại</TableCell>
                    <TableCell align="center">Tối đa</TableCell>

                    <TableCell align="center">Hạn dùng</TableCell>
                    <TableCell align="center"></TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {quotationToCreatePo.items?.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell>{item.productDescription}</TableCell>
                      <TableCell align="center">{item.productUnit}</TableCell>
                      <TableCell align="center">{item.tax * 100} %</TableCell>
                      <TableCell align="center">
                        {item.unitPrice?.toLocaleString()} đ
                      </TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={item.quantity === 0 ? "" : item.quantity}
                        error={item.quantity > item.suggestedQty}
                        helperText={
                          item.quantity > item.suggestedQty
                            ? "Vượt quá số lượng gợi ý"
                            : ""
                        }
                        onChange={(e) => {
                          let val = e.target.value;
                          let newQty = val === "" ? "" : Number(val);

                          if (newQty < 1 && newQty !== "") newQty = 1;

                          changeQuantity(i, newQty);

                          if (newQty > item.suggestedQty) {
                            setSnackbar({
                              open: true,
                              message: `Số lượng "${item.productName}" vượt quá số lượng gợi ý (${item.suggestedQty})`,
                              severity: "warning",
                            });
                          }
                        }}
                        sx={{ width: 80 }}
                        disabled={processing}
                      />

                      <TableCell align="center">
                        {item.suggestedQty ?? "-"}
                      </TableCell>
                      <TableCell align="center">{item.minQty ?? "-"}</TableCell>
                      <TableCell align="center">
                        {item.currentQty ?? "-"}
                      </TableCell>
                      <TableCell align="center">{item.maxQty ?? "-"}</TableCell>

                      <TableCell align="center">{item.productDate}</TableCell>

                      <TableCell align="center">
                        <Tooltip title="Xóa sản phẩm">
                          <span>
                            <IconButton
                              color="error"
                              onClick={() => removeItem(i)}
                              disabled={processing}
                            >
                              <Delete />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenCreatePoDialog(false)}
            disabled={processing}
          >
            Hủy
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => handleCreatePO(7)}
            disabled={processing}
          >
            {processing ? <CircularProgress size={20} /> : "Tạo bản nháp"}
          </Button>
          <Button
            variant="outlined"
            color="info"
            onClick={() => openCreatePO(quotationToCreatePo?.quotationId)}
            disabled={processing}
          >
            {processing ? <CircularProgress size={20} /> : "Tải lại"}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleCreatePO(6)}
            disabled={processing}
          >
            {processing ? (
              <CircularProgress size={20} sx={{ color: "white" }} />
            ) : (
              "Gửi yêu cầu"
            )}
          </Button>
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
