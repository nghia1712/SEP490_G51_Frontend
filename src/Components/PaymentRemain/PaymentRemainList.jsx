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
  Typography,
  TextField,
  Select,
  MenuItem,
  Button,
  Stack,
  Chip,
  CircularProgress,
  InputAdornment,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Autocomplete,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { Visibility, Paid, Receipt } from "@mui/icons-material";
import paymentRemainAPI from "../../API/paymentRemainAPI";
import paymentAPI from "../../API/paymentAPI";
import userAPI from "../../API/userAPI";
import invoiceAPI from "../../API/invoiceAPI";
import salesOrderAPI from "../../API/salesOrderAPI";
import PaymentRemainDetail from "./PaymentRemainDetail";
import getUserRoleFromToken from "../../Utils/getUserRoleFromToken";

const PaymentRemainList = () => {
  const [fullList, setFullList] = useState([]);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const [filters, setFilters] = useState({
    salesOrderId: "",
    status: "",
  });

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // User info
  const [userRole, setUserRole] = useState(null);
  const [customerId, setCustomerId] = useState(null);

  // Lấy role và customerId nếu role là customer
  useEffect(() => {
    const role = getUserRoleFromToken();
    setUserRole(role);

    if (role === "customer") {
      userAPI
        .getProfile()
        .then((res) => setCustomerId(res.data.data.userId))
        .catch((err) => console.error("Lỗi lấy profile:", err));
    }
  }, []);

  // Lấy danh sách từ API
  const getList = async () => {
    setLoading(true);
    try {
      const res = await paymentRemainAPI.getList({
        CustomerId: customerId || null,
        Page: 1,
        PageSize: 1000, // lấy nhiều dữ liệu để search trên FE
      });
      const data = res.data?.data || [];
      setFullList(data);
      setList(data);
      setTotalPages(Math.ceil(data.length / pageSize));
      setPage(1);
    } catch (error) {
      console.error(error);
      setSnack({
        open: true,
        message: "Lỗi khi lấy danh sách",
        severity: "error",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    getList();
  }, [customerId]);

  // Search và filter trên FE
  const handleSearch = () => {
    const keyword = filters.salesOrderId.trim().toLowerCase();

    let filtered = fullList;

    if (keyword) {
      filtered = filtered.filter(
        (item) =>
          item.salesOrderCode?.toLowerCase().includes(keyword) ||
          item.salesOrderId?.toString().includes(keyword)
      );
    }

    if (filters.status !== "") {
      filtered = filtered.filter((item) => item.status === filters.status);
    }

    setTotalPages(Math.ceil(filtered.length / pageSize));
    setPage(1);
    setList(filtered);
  };

  const handleClear = () => {
    setFilters({ salesOrderId: "", status: "" });
    setList(fullList);
    setPage(1);
    setTotalPages(Math.ceil(fullList.length / pageSize));
  };

  // Các hàm render
  const renderStatus = (s) => {
    switch (s) {
      case 0:
        return <Chip color="warning" label="Chờ xử lý" />;
      case 1:
        return <Chip color="info" label="Đã đặt cọc" />;
      case 2:
        return <Chip color="primary" label="Đã thanh toán" />;
      case 3:
        return <Chip color="success" label="Thành công" />;
      case 4:
        return <Chip color="error" label="Thất bại" />;
      case 5:
        return <Chip color="default" label="Đã hoàn tiền" />;
      default:
        return <Chip color="default" label="Không xác định" />;
    }
  };

  const renderPaymentMethod = (m) => {
    switch (m) {
      case 0:
        return "Chuyển khoản";
      case 1:
        return "Tiền mặt";
      default:
        return "Không xác định";
    }
  };

  const renderPaymentType = (t) => {
    switch (t) {
      case 1:
        return "Thanh toán còn lại";
      case 0:
        return "Thanh toán toàn bộ";
      default:
        return "Không xác định";
    }
  };

  const handlePay = async (item) => {
    try {
      const payload = {
        salesOrderId: item.salesOrderId,
        paymentType: "remain",
        locale: "vn",
        paymentRemainId: item.id,
      };
      const res = await paymentAPI.init(payload);
      if (res.data?.message)
        setSnack({ open: true, message: res.data.message, severity: "info" });
      if (res.data?.data?.paymentUrl)
        window.location.href = res.data.data.paymentUrl;
    } catch (error) {
      console.error(error);
      setSnack({
        open: true,
        message: error.response?.data?.message || "Lỗi khi tạo link thanh toán",
        severity: "error",
      });
    }
  };

  const handleSnackClose = () => setSnack({ ...snack, open: false });

  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [selectedPaymentRemain, setSelectedPaymentRemain] = useState(null);

  const handleCreateInvoice = async (item) => {
    setSelectedPaymentRemain(item);
    setInvoiceDialogOpen(true);
    setInvoiceLoading(true);
    try {
      // Lấy thông tin customer từ PaymentRemain detail
      const paymentDetailRes = await paymentRemainAPI.getDetail(item.id);
      const paymentDetail = paymentDetailRes.data?.data;
      
      // Lấy thông tin SalesOrder để có đầy đủ thông tin customer
      let salesOrderData = null;
      try {
        const salesOrderRes = await salesOrderAPI.viewDetails(item.salesOrderId);
        salesOrderData = salesOrderRes.data?.data;
      } catch (err) {
        console.warn("Không thể lấy thông tin SalesOrder:", err);
      }
      
      // Tạo hóa đơn
      const payload = {
        SalesOrderId: item.salesOrderId,
        PaymentRemainIds: [item.id],
      };
      const res = await invoiceAPI.generateFromPaymentRemains(payload);
      const invoiceData = res.data?.data;
      
      // Merge thông tin customer vào invoice data
      if (invoiceData) {
        // Từ PaymentRemain detail
        invoiceData.customerName = paymentDetail?.customerName || paymentDetail?.CustomerName;
        invoiceData.customerId = paymentDetail?.customerId || paymentDetail?.CustomerId;
        invoiceData.salesOrderCode = paymentDetail?.salesOrderCode || paymentDetail?.SalesOrderCode || item.salesOrderCode;
        
        // Từ SalesOrder (nếu có)
        if (salesOrderData) {
          invoiceData.customerName = salesOrderData.customerName || salesOrderData.CustomerName || invoiceData.customerName;
          invoiceData.customerAddress = salesOrderData.customerAddress || salesOrderData.CustomerAddress || salesOrderData.customer?.address || salesOrderData.Customer?.Address;
          invoiceData.customerPhone = salesOrderData.customerPhone || salesOrderData.CustomerPhone || salesOrderData.customer?.phoneNumber || salesOrderData.Customer?.PhoneNumber;
          invoiceData.customerTaxId = salesOrderData.customerTaxId || salesOrderData.CustomerTaxId || salesOrderData.customer?.mst || salesOrderData.Customer?.Mst;
        }
      }
      
      setInvoiceData(invoiceData);
    } catch (error) {
      console.error(error);
      setSnack({
        open: true,
        message: error.response?.data?.message || "Lỗi khi tạo hóa đơn",
        severity: "error",
      });
      setInvoiceDialogOpen(false);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleInvoiceDialogClose = () => {
    setInvoiceDialogOpen(false);
    setInvoiceData(null);
    setSelectedPaymentRemain(null);
  };

  const handleSaveInvoice = async () => {
    // API đã được gọi khi mở dialog, chỉ cần đóng và refresh
    setSnack({
      open: true,
      message: "Tạo hóa đơn thành công",
      severity: "success",
    });
    handleInvoiceDialogClose();
    await getList();
  };

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const handleViewDetail = async (item) => {
    try {
      const res = await paymentRemainAPI.getDetail(item.id);
      setDetailData(res.data.data);
      setDetailOpen(true);
    } catch (error) {
      console.error(error);
      setSnack({
        open: true,
        message: "Lỗi khi lấy chi tiết",
        severity: "error",
      });
    }
  };
  const handleDetailClose = () => {
    setDetailOpen(false);
    setDetailData(null);
  };

  // Pagination FE
  const paginatedList = list.slice((page - 1) * pageSize, page * pageSize);

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>
        Danh sách yêu cầu thanh toán
      </Typography>

      {/* Filters & Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            label="Mã đơn hàng"
            value={filters.salesOrderId}
            onChange={(e) => {
              const val = e.target.value;
              setFilters({ ...filters, salesOrderId: val });

              // Realtime search
              const keyword = val.trim().toLowerCase();
              let filtered = fullList;

              if (keyword) {
                filtered = filtered.filter(
                  (item) =>
                    item.salesOrderCode?.toLowerCase().includes(keyword) ||
                    item.salesOrderId?.toString().includes(keyword)
                );
              }

              if (filters.status !== "") {
                filtered = filtered.filter(
                  (item) => item.status === filters.status
                );
              }

              setList(filtered);
              setTotalPages(Math.ceil(filtered.length / pageSize));
              setPage(1);
            }}
            size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <Select
            displayEmpty
            size="small"
            value={filters.status}
            onChange={(e) => {
              const val = e.target.value === "" ? "" : Number(e.target.value);
              setFilters({ ...filters, status: val });

              // Realtime filter
              let filtered = fullList;

              const keyword = filters.salesOrderId.trim().toLowerCase();
              if (keyword) {
                filtered = filtered.filter(
                  (item) =>
                    item.salesOrderCode?.toLowerCase().includes(keyword) ||
                    item.salesOrderId?.toString().includes(keyword)
                );
              }

              if (val !== "") {
                filtered = filtered.filter((item) => item.status === val);
              }

              setList(filtered);
              setTotalPages(Math.ceil(filtered.length / pageSize));
              setPage(1);
            }}
            sx={{ width: 180 }}
          >
            <MenuItem value="">Tất cả trạng thái</MenuItem>
            <MenuItem value={0}>Chờ xử lý</MenuItem>
            <MenuItem value={1}>Đã đặt cọc</MenuItem>
            <MenuItem value={2}>Đã thanh toán</MenuItem>
            <MenuItem value={3}>Thành công</MenuItem>
            <MenuItem value={4}>Thất bại</MenuItem>
            <MenuItem value={5}>Đã hoàn tiền</MenuItem>
          </Select>

          <Button variant="outlined" color="secondary" onClick={handleClear}>
            Clear
          </Button>
        </Stack>
      </Paper>

      {/* Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Mã đơn hàng</TableCell>
                <TableCell>Phiếu xuất kho</TableCell>
                <TableCell>Loại thanh toán</TableCell>
                <TableCell>Phương thức</TableCell>
                <TableCell>Số tiền</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Ngày yêu cầu</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : paginatedList.length > 0 ? (
                paginatedList.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>
                      {item.salesOrderCode || item.salesOrderId}
                    </TableCell>
                    <TableCell>{item.goodsIssueNoteId}</TableCell>
                    <TableCell>{renderPaymentType(item.paymentType)}</TableCell>
                    <TableCell>
                      {renderPaymentMethod(item.paymentMethod)}
                    </TableCell>
                    <TableCell>
                      {item.amount.toLocaleString("vi-VN") + " ₫"}
                    </TableCell>
                    <TableCell>{renderStatus(item.status)}</TableCell>
                    <TableCell>
                      {item.paidAt
                        ? new Date(item.paidAt).toLocaleDateString("vi-VN")
                        : "-"}
                    </TableCell>
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="center"
                      >
                        <Tooltip title="Xem chi tiết">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleViewDetail(item)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {userRole === "customer" && item.status === 0 && (
                          <Tooltip title="Thanh toán">
                            <span>
                              <IconButton
                                color="success"
                                onClick={() => handlePay(item)}
                                disabled={loading}
                              >
                                <Paid />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                        {userRole === "accountant_staff" && item.status === 3 && (
                          <Tooltip title="Tạo hóa đơn">
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => handleCreateInvoice(item)}
                              disabled={loading}
                            >
                              <Receipt />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {paginatedList.length > 0 && (
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

      {/* Detail Dialog */}
      <PaymentRemainDetail
        open={detailOpen}
        onClose={handleDetailClose}
        data={detailData}
      />

      {/* Invoice Dialog */}
      <Dialog
        open={invoiceDialogOpen}
        onClose={handleInvoiceDialogClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        <DialogTitle>
          <Typography variant="h5" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
            Hóa Đơn Giá Trị Gia Tăng (VAT INVOICE)
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {invoiceLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : invoiceData ? (
            <Box>
              {/* Header Info */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Mã hóa đơn"
                    value={invoiceData.invoiceCode || invoiceData.InvoiceCode || ''}
                    InputProps={{ readOnly: true }}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Mã đơn hàng"
                    value={invoiceData.salesOrderCode || invoiceData.SalesOrderCode || selectedPaymentRemain?.salesOrderCode || ''}
                    InputProps={{ readOnly: true }}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Mã Số Thuế"
                    value={invoiceData.customerTaxId || invoiceData.CustomerTaxId || invoiceData.taxId || invoiceData.TaxId || ''}
                    InputProps={{ readOnly: true }}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Tỷ giá"
                    type="number"
                    value={invoiceData.exchangeRate || invoiceData.ExchangeRate || 1}
                    InputProps={{ readOnly: true }}
                    sx={{ mb: 2 }}
                  />
                </Grid>
              </Grid>

              {/* Customer Info */}
              <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Thông tin khách hàng
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Khách hàng:</strong> {invoiceData.customerName || invoiceData.CustomerName || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Địa chỉ:</strong> {invoiceData.customerAddress || invoiceData.CustomerAddress || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Số điện thoại:</strong> {invoiceData.customerPhone || invoiceData.CustomerPhone || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Hình thức thanh toán:</strong> {invoiceData.paymentMethod || invoiceData.PaymentMethod || 'TM/CK'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Products Table */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Chi tiết sản phẩm
                  </Typography>
                  <Button variant="outlined" size="small" startIcon={<Receipt />}>
                    Add
                  </Button>
                </Box>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Tên Sản Phẩm</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Mã Sản Phẩm</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Đơn Vị</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Số Lượng</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Đơn Giá</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Thuế Suất (%)</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Tiền Thuế</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Thành Tiền</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Thành Tiền Sau Thuế</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Lần Xuất Hàng</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoiceData.details && invoiceData.details.length > 0 ? (
                        invoiceData.details.map((detail, index) => {
                          const product = detail.product || detail.Product || {};
                          const quantity = detail.quantity || detail.Quantity || 0;
                          const unitPrice = detail.unitPrice || detail.UnitPrice || 0;
                          const taxRate = detail.taxRate || detail.TaxRate || 0;
                          const subtotal = quantity * unitPrice;
                          const taxAmount = subtotal * (taxRate / 100);
                          const totalAfterTax = subtotal + taxAmount;
                          
                          return (
                            <TableRow key={index}>
                              <TableCell align="center">{index + 1}</TableCell>
                              <TableCell>{product.name || product.Name || '-'}</TableCell>
                              <TableCell>{product.code || product.Code || '-'}</TableCell>
                              <TableCell align="center">{product.unit || product.Unit || '-'}</TableCell>
                              <TableCell align="center">{quantity}</TableCell>
                              <TableCell align="right">{unitPrice.toLocaleString('vi-VN')} ₫</TableCell>
                              <TableCell align="center">{taxRate}%</TableCell>
                              <TableCell align="right">{taxAmount.toLocaleString('vi-VN')} ₫</TableCell>
                              <TableCell align="right">{subtotal.toLocaleString('vi-VN')} ₫</TableCell>
                              <TableCell align="right">{totalAfterTax.toLocaleString('vi-VN')} ₫</TableCell>
                              <TableCell align="center">{detail.exportIndex || detail.ExportIndex || '-'}</TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={11} align="center">
                            Chưa có sản phẩm
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Summary */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Box sx={{ minWidth: 300 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        Tổng cộng:
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sx={{ textAlign: 'right' }}>
                      <Typography variant="body2">
                        {(invoiceData.totalAmount || invoiceData.TotalAmount || 0).toLocaleString('vi-VN')} ₫
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        Thuế:
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sx={{ textAlign: 'right' }}>
                      <Typography variant="body2">
                        {((invoiceData.totalTax || invoiceData.TotalTax) || 0).toLocaleString('vi-VN')} ₫
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        Tổng tiền thanh toán:
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {((invoiceData.totalAmount || invoiceData.TotalAmount || 0) + (invoiceData.totalTax || invoiceData.TotalTax || 0)).toLocaleString('vi-VN')} ₫
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleInvoiceDialogClose}>Đóng</Button>
          <Button variant="contained" onClick={handleSaveInvoice} disabled={invoiceLoading || !invoiceData}>
            Lưu hóa đơn
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={handleSnackClose}
      >
        <Alert
          onClose={handleSnackClose}
          severity={snack.severity}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PaymentRemainList;
