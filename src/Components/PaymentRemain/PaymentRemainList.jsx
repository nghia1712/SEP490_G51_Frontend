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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { Visibility, Paid } from "@mui/icons-material";
import paymentRemainAPI from "../../API/paymentRemainAPI";
import paymentAPI from "../../API/paymentAPI";
import userAPI from "../../API/userAPI";
import PaymentRemainDetail from "./PaymentRemainDetail";
import getUserRoleFromToken from "../../Utils/getUserRoleFromToken";

const PaymentRemainList = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const [filters, setFilters] = useState({
    salesOrderId: "",
    goodsIssueNoteId: "",
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
        .then((res) => {
          const cid = res.data.data.userId;
          setCustomerId(cid);
        })
        .catch((err) => {
          console.error("Lỗi lấy profile:", err);
        });
    }
  }, []);

  // Lấy danh sách
  const getList = async () => {
    setLoading(true);
    try {
      const res = await paymentRemainAPI.getList({
        SalesOrderId: filters.salesOrderId || null,
        GoodsIssueNoteId: filters.goodsIssueNoteId || null,
        Status: filters.status || null,
        CustomerId: customerId || null, // chỉ filter nếu là customer
        Page: page,
        PageSize: pageSize,
      });

      setList(res.data?.data || []);
      const totalRecords =
        res.data?.totalRecords || res.data?.data?.length || 0;
      setTotalPages(Math.ceil(totalRecords / pageSize));
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
  }, [filters, page, customerId]);

  const handleClear = () => {
    setFilters({ salesOrderId: "", goodsIssueNoteId: "", status: "" });
    setPage(1);
  };

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

      if (res.data?.message) {
        setSnack({ open: true, message: res.data.message, severity: "info" });
      }

      if (res.data?.data?.paymentUrl) {
        window.location.href = res.data.data.paymentUrl;
      }
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

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>
        Danh sách yêu cầu thanh toán
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            label="Mã đơn hàng"
            value={filters.salesOrderId}
            onChange={(e) =>
              setFilters({ ...filters, salesOrderId: e.target.value })
            }
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            size="small"
          />

          <TextField
            label="Phiếu xuất kho"
            value={filters.goodsIssueNoteId}
            onChange={(e) =>
              setFilters({ ...filters, goodsIssueNoteId: e.target.value })
            }
            size="small"
          />

          <Select
            displayEmpty
            size="small"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
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
                <TableCell>Ngày thanh toán</TableCell>
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
              ) : list.length > 0 ? (
                list.map((item) => (
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
        {list.length > 0 && (
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
