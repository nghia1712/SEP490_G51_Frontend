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
  Card,
  CardContent,
  Container,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { useEffect } from "react";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { vi as viLocale } from "date-fns/locale";
import {
  Search as SearchIcon,
  Visibility,
  NoteAdd,
  Delete,
  PriceCheck,
} from "@mui/icons-material";
import palette from "../../../constants/palette";
import usePQ from "../../../Hooks/usePQ";
import usePRFQ from "../../../Hooks/usePRFQ";

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
    loadData,
  } = usePQ();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState(false);
  const [page, setPage] = useState(1);

  const pageSize = 10;
  const { prfqs, showSnackbar, handleImportQuotation, importLoading } =
    usePRFQ();
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const filtered = quotations
    .filter((q) => {
      const keyword = search.toLowerCase();

      const supplierMatch = q.supplierName?.toLowerCase().includes(keyword);
      const pqMatch = `PQ-${q.quotationId}`.toLowerCase().includes(keyword);

      const sentDate = new Date(q.sentDate);
      const fromMatch = dateFrom ? sentDate >= new Date(dateFrom) : true;
      const toMatch = dateTo ? sentDate <= new Date(dateTo) : true;

      return (supplierMatch || pqMatch) && fromMatch && toMatch;
    })
    .sort((a, b) => b.quotationId - a.quotationId);

  const totalPages = Math.ceil(filtered.length / pageSize);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleCreatePO = async (status) => {
    // 🔥 Kiểm tra nếu không còn sản phẩm nào
    if (!quotationToCreatePo.items || quotationToCreatePo.items.length === 0) {
      setSnackbar({
        open: true,
        message: "Không thể tạo PO vì danh sách sản phẩm đang trống!",
        severity: "error",
      });
      return;
    }

    // 🔥 Kiểm tra nếu sản phẩm nào đó chưa nhập số lượng
    const hasEmptyQty = quotationToCreatePo.items.some(
      (x) => x.quantity === "" || x.quantity === 0 || x.quantity == null
    );

    if (hasEmptyQty) {
      setSnackbar({
        open: true,
        message: "Vui lòng nhập số lượng cho tất cả sản phẩm!",
        severity: "error",
      });
      return;
    }

    setProcessing(true);
    try {
      await createPO(status);
    } finally {
      setProcessing(false);
    }
  };
  useEffect(() => setPage(1), [search]);
  const statusMap = {
    InDate: "Còn hiệu lực",
    OutOfDate: "Hết hiệu lực",
  };

  return (
    <Box sx={{ p: 3 }}>
      <Container maxWidth="xl" sx={{ pt: 4, pb: 4 }}>
        <Card elevation={3} sx={{ borderRadius: 2 }}>
          <CardContent>
            {/* HEADER */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <PriceCheck sx={{ fontSize: 40, mr: 2, color: "#1976d2" }} />
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", flexGrow: 1, color: "#1976d2" }}
              >
                Báo giá nhập
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Tổng: {filtered.length} báo giá
              </Typography>
            </Box>

            {/* FILTER */}
            <Paper
              sx={{ p: 2, mb: 2, backgroundColor: "#f8fafc", borderRadius: 2 }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                alignItems="center"
                spacing={2}
                justifyContent="space-between"
              >
                {/* Left: Tìm kiếm và lọc ngày */}
                <Stack direction="row" spacing={2} alignItems="center">
                  <TextField
                    variant="outlined"
                    size="small"
                    placeholder="Tìm kiếm..."
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
                  <LocalizationProvider
                    dateAdapter={AdapterDateFns}
                    locale={viLocale}
                  >
                    <DatePicker
                      label="Ngày gửi từ"
                      value={dateFrom ? new Date(dateFrom) : null}
                      onChange={(newValue) => {
                        if (!newValue) return;
                        const value = newValue.toISOString().split("T")[0];
                        setDateFrom(value);
                        if (dateTo && new Date(dateTo) < newValue)
                          setDateTo("");
                      }}
                      format="dd/MM/yyyy"
                      slotProps={{
                        textField: { size: "small", sx: { width: 180 } },
                      }}
                      maxDate={dateTo ? new Date(dateTo) : undefined}
                    />
                    <DatePicker
                      label="Ngày gửi đến"
                      value={dateTo ? new Date(dateTo) : null}
                      onChange={(newValue) => {
                        if (!newValue) return;
                        const value = newValue.toISOString().split("T")[0];
                        setDateTo(value);
                      }}
                      format="dd/MM/yyyy"
                      slotProps={{
                        textField: { size: "small", sx: { width: 180 } },
                      }}
                      minDate={dateFrom ? new Date(dateFrom) : undefined}
                    />
                  </LocalizationProvider>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => {
                      setSearch("");
                      setDateFrom("");
                      setDateTo("");
                      setPage(1);
                    }}
                  >
                    Xóa lọc
                  </Button>
                </Stack>

                {/* Right: Nút tải báo giá */}
                <Box sx={{ marginLeft: "auto" }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setOpenUploadDialog(true)}
                  >
                    Tải báo giá từ Excel
                  </Button>
                </Box>
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
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Mã báo giá
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Ngày gửi</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Nhà cung cấp
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Trạng thái
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Ngày hết hạn
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }} align="center">
                      Hành động
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <CircularProgress size={24} />
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        Chưa có báo giá nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((row, i) => {
                      const isValid = row.status === "InDate";
                      return (
                        <TableRow key={row.quotationId}>
                          <TableCell>{(page - 1) * pageSize + i + 1}</TableCell>
                          <TableCell>{`PQ-${row.quotationId}`}</TableCell>
                          <TableCell>
                            {new Date(row.sentDate).toLocaleDateString("vi-VN")}
                          </TableCell>
                          <TableCell>{row.supplierName}</TableCell>
                          <TableCell>
                            <Chip
                              label={statusMap[row.status] || row.status}
                              color={
                                row.status === "InDate" ? "success" : "error"
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{row.expiredDate}</TableCell>
                          <TableCell align="center">
                            <Stack
                              direction="row"
                              spacing={1}
                              justifyContent="center"
                            >
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
                                      onClick={() =>
                                        openCreatePO(row.quotationId)
                                      }
                                      disabled={processing}
                                    >
                                      <NoteAdd />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* PAGINATION */}
            {filtered.length > 0 && totalPages > 1 && (
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

      {/* Dialog Chi tiết PQ */}
      <Dialog
        open={openDetailDialog}
        onClose={() => setOpenDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle fontWeight={"bold"}>
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
            <strong>Ngày hết hạn:</strong> {selectedQuotation?.expiredDate}
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
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: "bold" }}>#</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Tên sản phẩm</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Mô tả</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Đơn vị</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Đơn giá</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Thuế</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Hạn dùng</TableCell>
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
                  <TableCell align="right">{item.tax * 100} %</TableCell>
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

      {/* Dialog Upload PQ */}
      <Dialog
        open={openUploadDialog}
        onClose={() => setOpenUploadDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Tải báo giá từ Excel</DialogTitle>
        <DialogContent>
          <Button variant="outlined" component="label" disabled={importLoading}>
            Chọn file
            <input
              type="file"
              accept=".xlsx, .xls"
              hidden
              onChange={(e) => setSelectedFile(e.target.files[0] || null)}
            />
          </Button>
          <Typography>
            {selectedFile ? selectedFile.name : "Chưa chọn file"}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenUploadDialog(false)}
            disabled={importLoading}
            variant="outlined"
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={!selectedFile || importLoading}
            onClick={async () => {
              if (!selectedFile) return;
              setProcessing(true);
              try {
                const res = await handleImportQuotation(selectedFile);
                loadData();
                setSelectedFile(null);
                setOpenUploadDialog(false);

                setSnackbar({
                  open: true,
                  message: res?.data?.message || "Tải báo giá thành công",
                  severity: "success",
                });
              } catch (err) {
                setSnackbar({
                  open: true,
                  message:
                    err.response?.data?.message || "Tải báo giá thất bại",
                  severity: "error",
                });
              } finally {
                setProcessing(false);
              }
            }}
          >
            {!selectedFile ? (
              "Tải lên"
            ) : importLoading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Đang tải
              </>
            ) : (
              "Tải lên"
            )}
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
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mt: 2,
                }}
              >
                <Typography sx={{ fontWeight: "bold" }}>
                  Danh sách sản phẩm:
                </Typography>

                <Button
                  color="info"
                  onClick={() => openCreatePO(quotationToCreatePo?.quotationId)}
                  disabled={processing}
                >
                  {processing ? <CircularProgress size={20} /> : "Tải lại"}
                </Button>
              </Box>

              <Table size="small">
                <TableHead
                  sx={{
                    backgroundColor: "#f5f5f5",
                    "& .MuiTableCell-root": { fontWeight: "bold" },
                  }}
                >
                  <TableRow>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      Tên sản phẩm
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>Mô tả</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>ĐVT</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>Đơn giá</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>Thuế</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      Số lượng
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>Gợi ý</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      Tối thiểu
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      Hiện tại
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>Tối đa</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      Hạn dùng
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {quotationToCreatePo.items?.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell
                        sx={{
                          maxWidth: 200, // giới hạn chiều rộng cột
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          cursor: "pointer",
                        }}
                        title={item.productDescription} // tooltip khi hover
                      >
                        {item.productDescription}
                      </TableCell>

                      <TableCell align="center">{item.productUnit}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }} align="center">
                        {item.unitPrice?.toLocaleString()} đ
                      </TableCell>
                      <TableCell align="center">{item.tax * 100} %</TableCell>
                      <TableCell
                        align="center"
                        sx={{ position: "relative", pb: 3 }}
                      >
                        <TextField
                          size="small"
                          type="number"
                          value={item.quantity === 0 ? "" : item.quantity}
                          onChange={(e) => {
                            const val = e.target.value;
                            const newQty = val === "" ? "" : Number(val);

                            const oldQty =
                              quotationToCreatePo.items[i].quantity;
                            const limit = item.maxQty * 5;

                            // Không cho nhập < 1 (trừ khi empty)
                            if (newQty !== "" && newQty < 1) {
                              changeQuantity(i, 1);
                              return;
                            }

                            // Nếu vượt quá LIMIT → reset về oldQty
                            if (newQty > limit) {
                              setSnackbar({
                                open: true,
                                message: `Số lượng "${item.productName}" chỉ có thể nhập tối đa ${limit} (5 lần số lượng tối đa).`,
                                severity: "error",
                              });

                              changeQuantity(i, oldQty);

                              return;
                            }

                            changeQuantity(i, newQty);

                            if (newQty > item.suggestedQty) {
                              setSnackbar({
                                open: true,
                                message: `Số lượng "${item.productName}" vượt quá số lượng gợi ý (${item.suggestedQty})`,
                                severity: "warning",
                              });
                            }
                          }}
                          sx={{ width: 100, position: "relative" }}
                          disabled={processing}
                        />
                      </TableCell>
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
            variant="outlined"
          >
            {processing ? <CircularProgress size={20} /> : "Hủy"}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => handleCreatePO(7)}
            disabled={processing}
          >
            {processing ? <CircularProgress size={20} /> : "Tạo nháp"}
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
