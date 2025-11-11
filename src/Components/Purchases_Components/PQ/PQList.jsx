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
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  NoteAdd,
  Delete,
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
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [openCreatePoDialog, setOpenCreatePoDialog] = useState(false);
  const [quotationToCreatePo, setQuotationToCreatePo] = useState(null);
  const [sending, setSending] = useState(false);

  const navigate = useNavigate();

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Load danh sách PQ
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await pqApi.getAllBasic();
      const list = Array.isArray(res.data.data)
        ? res.data.data.map((item) => ({
            quotationId: item.qid,
            sentDate: item.sendDate,
            supplierName: item.supplierName,
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

  // Xem chi tiết PQ
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
      setSnackbar({
        open: true,
        message: "Lỗi tải chi tiết PQ",
        severity: "error",
      });
    }
  };

// Mở dialog tạo PO
const handleOpenCreatePO = async (id) => {
  try {
    const res = await pqApi.getDetail(id);
    const q = res.data?.data;

    // Set default quantity = 1 nếu chưa có và chuẩn hóa productID
    const itemsWithQty = (q.quotationDetailDTOs || []).map((item) => ({
      ...item,
      productID: item.productID || item.ProductID || item.id, // dùng đúng trường ID
      quantity: item.quantity || 1,
    }));

    setQuotationToCreatePo({
      quotationId: q.qid,
      supplierName: q.supplierName || "(Chưa có tên NCC)",
      items: itemsWithQty,
    });

    setOpenCreatePoDialog(true);
  } catch (err) {
    console.error("❌ Lỗi mở dialog PO:", err);
    setSnackbar({
      open: true,
      message: "Lỗi tải dữ liệu PQ",
      severity: "error",
    });
  }
};

// Tạo PO
const handleCreatePO = async (status) => {
  if (!quotationToCreatePo || sending) return;

  setSending(true);

  const payload = {
    qid: Number(quotationToCreatePo.quotationId),
    details: quotationToCreatePo.items.map((item) => ({
      productID: Number(item.productID),
      date: item.productDate || null,
      quantity: Number(item.quantity),
    })),
    status: Number(status),
  };
  console.log("Payload gửi lên server:", payload);

  try {
    await prfqApi.createFromQuotation(payload);

    setSnackbar({
      open: true,
      message: status === 6 ? "Gửi PO thành công!" : "Tạo bản nháp thành công!",
      severity: "success",
    });
    setOpenCreatePoDialog(false);
  } catch (err) {
    console.error("❌ Lỗi tạo PO:", err.response?.data || err);
    setSnackbar({
      open: true,
      message: status === 6 ? "Gửi PO thất bại" : "Tạo bản nháp thất bại",
      severity: "error",
    });
  } finally {
    setSending(false);
  }
};


  // Chỉnh sửa số lượng
  const handleChangeQuantity = (index, value) => {
    setQuotationToCreatePo((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], quantity: Number(value) };
      return { ...prev, items };
    });
  };

  // Xóa sản phẩm
  const handleRemoveItem = (index) => {
    setQuotationToCreatePo((prev) => {
      const items = [...prev.items];
      items.splice(index, 1);
      return { ...prev, items };
    });
  };

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
                    <TableCell>{`PQ-${row.quotationId}`}</TableCell>
                    <TableCell>
                      {new Date(row.sentDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{row.supplierName}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.status}
                        color={row.status === "InDate" ? "success" : "error"}
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
                      <Tooltip title="Tạo PO">
                        <IconButton
                          color="secondary"
                          onClick={() => handleOpenCreatePO(row.quotationId)}
                        >
                          <NoteAdd />
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
                <strong>QID:</strong> PQ-{quotationToCreatePo.quotationId}
              </Typography>
              <Typography>
                <strong>Nhà cung cấp:</strong>{" "}
                {quotationToCreatePo.supplierName}
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
                    <TableCell align="center">Số lượng</TableCell>
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
                      <TableCell align="center">
                        {item.unitPrice?.toLocaleString()} đ
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          size="small"
                          value={item.quantity || 1}
                          onChange={(e) =>
                            handleChangeQuantity(i, e.target.value)
                          }
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {item.productDate
                          ? new Date(item.productDate).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Xóa sản phẩm">
                          <IconButton
                            color="error"
                            onClick={() => handleRemoveItem(i)}
                          >
                            <Delete />
                          </IconButton>
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
  <Button onClick={() => setOpenCreatePoDialog(false)}>Hủy</Button>
  <Button
    variant="outlined"
    color="secondary"
    onClick={() => handleCreatePO(7)}
    disabled={sending}
  >
    Tạo bản nháp
  </Button>
  <Button
    variant="contained"
    color="primary"
    onClick={() => handleCreatePO(6)}
    disabled={sending}
  >
    Gửi yêu cầu
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
