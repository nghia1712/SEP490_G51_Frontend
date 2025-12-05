import React from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Chip,
  TextField,
  InputAdornment,
  Tooltip,
  Snackbar,
  Alert,
  Pagination,
  Card,
  CardContent,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Visibility,
  Search,
  Close as CloseIcon,
  ShoppingCart,
  UploadFile,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import POActions from "./POActions";
import usePO from "../../../Hooks/usePO";
import PODialogs from "./PODialogs";
import getUserRoleFromToken from "../../../Utils/getUserRoleFromToken";
import { useEffect } from "react";

export default function POList() {
  const navigate = useNavigate();
  const {
    filteredPOs,
    loading,
    search,
    setSearch,
    openDetail,
    selectedPO,
    openUpload,
    handleOpenDetail,
    handleCloseDetail,
    handleOpenUpload,
    handleCloseUpload,
    excelFile,
    setExcelFile,
    uploadedProducts,
    setUploadedProducts,
    previewOpen,
    setPreviewOpen,
    handleUploadExcel,
    handleConvertExcel,
    uploading,
    sending,
    snackbar,
    setSnackbar,
    statusMap,
    parseDDMMYYYY,
    fetchPOs,
  } = usePO();
  const [page, setPage] = React.useState(1);
  const pageSize = 5;
  const userRole = getUserRoleFromToken();
  const [receivingStatusFilter, setReceivingStatusFilter] = React.useState("");
  const [orderStatusFilter, setOrderStatusFilter] = React.useState("");

  const filteredPOsWithFilter = filteredPOs.filter((po) => {
    const matchesSearch =
      search === "" ||
      po.poid.toString().includes(search) ||
      po.supplierName?.toLowerCase().includes(search.toLowerCase());

    const matchesReceiving =
      receivingStatusFilter === "" ||
      po.receivingStatus === receivingStatusFilter;

    const matchesOrderStatus =
      orderStatusFilter === "" || po.status === Number(orderStatusFilter);

    return matchesSearch && matchesReceiving && matchesOrderStatus;
  });

  const sortedPOs = [...filteredPOsWithFilter].sort((a, b) => b.poid - a.poid);

  const totalPages = Math.ceil(sortedPOs.length / pageSize);
  const paginatedPOs = sortedPOs.slice((page - 1) * pageSize, page * pageSize);

  const handleClearFilters = () => {
    setSearch("");
    setReceivingStatusFilter("");
    setOrderStatusFilter("");
    setPage(1);
  };

  const renderStatus = (status) => {
    const s = statusMap[Number(status)] || {
      label: "Unknown",
      color: "default",
    };
    return <Chip label={s.label} color={s.color} size="small" />;
  };
  useEffect(() => setPage(1), [search]);
  return (
    <Box sx={{ p: 3 }}>
      <Container maxWidth="xl" sx={{ pt: 4, pb: 4 }}>
        <Card elevation={3} sx={{ borderRadius: 2 }}>
          <CardContent>
            {/* HEADER */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <ShoppingCart sx={{ fontSize: 40, mr: 2, color: "#1976d2" }} />
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", flexGrow: 1, color: "#1976d2" }}
              >
                Đơn nhập hàng
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Tổng: {filteredPOs.length} đơn hàng
              </Typography>
            </Box>

            {/* FILTER + UPLOAD */}
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems="center"
              justifyContent="space-between"
            >
              {/* Left group: search + filters + clear */}
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                flexWrap="wrap"
              >
                {/* Search chung */}
                <TextField
                  variant="outlined"
                  size="small"
                  placeholder="Tìm kiếm..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: 250 }}
                />

                {/* Filter trạng thái nhận hàng */}
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Trạng thái nhận hàng</InputLabel>
                  <Select
                    value={receivingStatusFilter}
                    label="Trạng thái nhận hàng"
                    onChange={(e) => {
                      setReceivingStatusFilter(e.target.value);
                      setPage(1);
                    }}
                  >
                    <MenuItem value="">Tất cả</MenuItem>
                    <MenuItem value="Đã nhận đủ">Đã nhận đủ</MenuItem>
                    <MenuItem value="Nhận một phần">Nhận một phần</MenuItem>
                    <MenuItem value="Chờ xác nhận">Chờ xác nhận</MenuItem>
                    <MenuItem value="Chưa nhận">Chưa nhận</MenuItem>
                  </Select>
                </FormControl>

                {/* Filter trạng thái đơn hàng */}
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Trạng thái đơn hàng</InputLabel>
                  <Select
                    value={orderStatusFilter}
                    label="Trạng thái đơn hàng"
                    onChange={(e) => {
                      setOrderStatusFilter(e.target.value);
                      setPage(1);
                    }}
                  >
                    <MenuItem value="">Tất cả</MenuItem>
                    {Object.entries(statusMap).map(([key, val]) => (
                      <MenuItem key={key} value={key}>
                        {val.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Button xóa lọc */}
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleClearFilters}
                >
                  Xóa lọc
                </Button>
              </Stack>

              {/* Right group: upload button */}
              {userRole === "purchases_staff" && (
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    startIcon={<UploadFile />}
                    onClick={handleOpenUpload}
                  >
                    Tạo đơn từ Excel
                  </Button>

                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => navigate("/po/create")}
                  >
                    Tạo đơn hàng
                  </Button>
                </Stack>
              )}
            </Stack>

            {/* TABLE */}
            <TableContainer
              component={Paper}
              sx={{ borderRadius: 2, maxHeight: 500 }}
            >
              <Table stickyHeader>
                <TableHead
                  sx={{
                    backgroundColor: "#f5f5f5",
                    "& .MuiTableCell-root": { fontWeight: "bold" },
                  }}
                >
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      Mã đơn hàng
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      Nhà cung cấp
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      Ngày đặt
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }} align="center">
                      Trạng thái nhận hàng
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }} align="center">
                      Trạng thái đơn hàng
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      Tổng tiền
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>Đã trả</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>Còn nợ</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }} align="center">
                      Người tạo
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }} align="center">
                      Hành động
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : filteredPOs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                        Chưa có đơn nhập hàng nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedPOs.map((po, index) => (
                      <TableRow key={po.poid}>
                        <TableCell>
                          {(page - 1) * pageSize + index + 1}
                        </TableCell>
                        <TableCell>{`PO-${po.poid}`}</TableCell>
                        <TableCell>{po.supplierName || "-"}</TableCell>
                        <TableCell>
                          {new Date(po.orderDate).toLocaleDateString("vi-VN")}
                        </TableCell>
                        <TableCell align="center">
                          {po.status !== 7 && (
                            <Chip
                              label={po.receivingStatus}
                              color={
                                po.receivingStatus === "Đã nhận đủ"
                                  ? "success"
                                  : po.receivingStatus === "Nhận một phần" ||
                                    po.receivingStatus === "Chờ xác nhận"
                                  ? "warning"
                                  : po.receivingStatus === "Chưa nhận"
                                  ? "info"
                                  : "default"
                              }
                              size="small"
                            />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {renderStatus(po.status)}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }} align="right">
                          {po.total.toLocaleString()} ₫
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }} align="right">
                          {po.deposit?.toLocaleString() || 0} ₫
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }} align="right">
                          {po.debt.toLocaleString()} ₫
                        </TableCell>
                        <TableCell align="center">{po.userName}</TableCell>
                        <TableCell align="center">
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="center"
                          >
                            <Tooltip title="Xem chi tiết">
                              <IconButton
                                color="primary"
                                onClick={() => handleOpenDetail(po.poid)}
                                size="small"
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <POActions poId={po.poid} fetchPOs={fetchPOs} />
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* PAGINATION */}
            {filteredPOs.length > 0 && totalPages > 1 && (
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

      <PODialogs
        openUpload={openUpload}
        openPreview={previewOpen}
        handleCloseUpload={handleCloseUpload}
        excelFile={excelFile}
        setExcelFile={setExcelFile}
        handleUploadExcel={handleUploadExcel}
        uploading={uploading}
        uploadedProducts={uploadedProducts}
        setUploadedProducts={setUploadedProducts}
        setPreviewOpen={setPreviewOpen}
        handleConvertExcel={handleConvertExcel}
        sending={sending}
        parseDDMMYYYY={parseDDMMYYYY}
        snackbar={snackbar}
        setSnackbar={setSnackbar}
      />

      {/* Detail PO Dialog */}
      <Dialog
        open={openDetail}
        onClose={handleCloseDetail}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle fontWeight={"bold"}>
          Chi tiết {`PO-${selectedPO?.poid}`}
        </DialogTitle>
        <DialogContent dividers>
          {selectedPO ? (
            <>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
              >
                <Box>
                  <Typography>
                    <strong>Người phụ trách:</strong> {selectedPO.userName}
                  </Typography>
                  <Typography>
                    <strong>Ngày đặt hàng:</strong>
                    {new Date(selectedPO.orderDate).toLocaleDateString("vi-EN")}
                  </Typography>
                  <Typography>
                    <strong>Trạng thái đơn hàng:</strong>
                    {renderStatus(selectedPO.status)}
                  </Typography>
                  {selectedPO.status === 3 && selectedPO.deposit > 0 && (
                    <Typography>
                      <strong>Ngày đặt cọc:</strong>
                      {new Date(selectedPO.paymentDate).toLocaleDateString(
                        "vi-EN"
                      )}
                    </Typography>
                  )}
                  {(selectedPO.status === 3 ||
                    selectedPO.status === 4 ||
                    selectedPO.status === 6) && (
                    <Typography>
                      <strong>Người trả:</strong>{" "}
                      {selectedPO.paymentBy &&
                      selectedPO.paymentBy !== "Unknown"
                        ? selectedPO.paymentBy
                        : "Chưa thanh toán"}
                    </Typography>
                  )}

                  {selectedPO.status === 4 && (
                    <Typography>
                      <strong>Ngày thanh toán:</strong>{" "}
                      {new Date(selectedPO.paymentDate).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography>
                    <strong>Tổng tiền:</strong>{" "}
                    {selectedPO.total.toLocaleString()} ₫
                  </Typography>
                  <Typography>
                    <strong>Tiền cọc:</strong>{" "}
                    {selectedPO.status === 6
                      ? "Chưa thỏa thuận"
                      : selectedPO.deposit?.toLocaleString() + " ₫"}
                  </Typography>
                  <Typography>
                    <strong>Còn nợ:</strong> {selectedPO.debt.toLocaleString()}{" "}
                    ₫
                  </Typography>
                </Box>
              </Box>

              <Typography sx={{ mt: 2, mb: 1, fontWeight: "bold" }}>
                Danh sách sản phẩm
              </Typography>
              <Table size="small">
                <TableHead
                  sx={{
                    backgroundColor: "#f5f5f5",
                    "& .MuiTableCell-root": { fontWeight: "bold" },
                  }}
                >
                  <TableRow>
                    <TableCell>Sản phẩm</TableCell>
                    <TableCell>Mô tả</TableCell>
                    <TableCell>Đơn vị</TableCell>
                    <TableCell align="center">Số lượng</TableCell>
                    <TableCell align="center">Đơn giá</TableCell>
                    <TableCell>Thuế</TableCell>
                    <TableCell align="center">Thành tiền</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedPO.details?.map((item) => (
                    <TableRow key={item.podid}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.dvt}</TableCell>
                      <TableCell align="center">{item.quantity}</TableCell>
                      <TableCell align="center">
                        {item.unitPrice.toLocaleString()} ₫
                      </TableCell>
                      <TableCell>{item.tax * 100} %</TableCell>
                      <TableCell align="center">
                        {item.unitPriceTotal.toLocaleString()} ₫
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          ) : (
            <Typography>Đang tải chi tiết...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}