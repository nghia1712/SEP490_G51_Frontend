import React, { useState, useEffect } from "react";
import {
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Snackbar,
  Alert,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";
import {
  Paid,
  AccountBalance,
  CheckCircle,
  NoteAdd,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import poApi from "../../../API/poAPI";
import getUserRoleFromToken from "../../../utils/getUserRoleFromToken";

const STATUS = {
  APPROVED: 0,
  REJECTED: 1,
  DEPOSITED: 3,
  PAID: 4,
  COMPLETED: 5,
  SENT: 6,
  DRAFT: 7,
};

export default function POActions({ poId, fetchPOs }) {
  const [depositOpen, setDepositOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [poDetail, setPoDetail] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const navigate = useNavigate();
  const [fullyReceivedPOs, setFullyReceivedPOs] = useState([]);

  useEffect(() => {
    loadFullyReceivedPOs();
  }, []);

  const loadFullyReceivedPOs = async () => {
    try {
      const res = await poApi.getFullyReceived();
      const ids = res.data?.map((po) => po.poid) || [];
      setFullyReceivedPOs(ids);
    } catch (err) {
      console.error("Lỗi khi tải danh sách PO đã nhập đủ:", err);
    }
  };

  const handleCreateGRN = () => {
    navigate("/grn", { state: { poId, create: true } });
  };

  const [userRole, setUserRole] = useState(null);
  useEffect(() => {
    const role = getUserRoleFromToken();
    setUserRole(role);
  }, []);

  useEffect(() => {
    fetchPoDetail();
  }, [poId]);

  const fetchPoDetail = async () => {
    try {
      const res = await poApi.getDetail(poId);
      setPoDetail(res.data?.data);
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Lấy chi tiết PO thất bại",
        severity: "error",
      });
    }
  };

  const handleApprove = async () => {
    try {
      await poApi.changeStatus(poId, STATUS.APPROVED);
      setSnackbar({
        open: true,
        message: "PO đã được approve",
        severity: "success",
      });
      fetchPOs();
      fetchPoDetail();
      setDepositOpen(true);
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Approve thất bại",
        severity: "error",
      });
    }
  };

  const handleDeposit = async () => {
    if (!amount || amount <= 0) return;
    setLoading(true);
    try {
      await poApi.deposit(poId, { paid: Number(amount) });
      setSnackbar({
        open: true,
        message: "Ghi nhận đặt cọc thành công",
        severity: "success",
      });
      setDepositOpen(false);
      setAmount("");
      fetchPOs();
      fetchPoDetail();
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Ghi nhận thất bại",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!amount || amount <= 0) return;
    setLoading(true);
    try {
      await poApi.payDebt(poId, { paid: Number(amount) });
      setSnackbar({
        open: true,
        message: "Thanh toán thành công",
        severity: "success",
      });
      setPayOpen(false);
      setAmount("");
      fetchPOs();
      fetchPoDetail();
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Thanh toán thất bại",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderPoInfo = (isPayPopup = false) => {
    if (!poDetail) return null;
    return (
      <Stack spacing={1} mb={2}>
        <Typography>
          <strong>PO ID:</strong> {poDetail.poid}
        </Typography>
        <Typography>
          <strong>Người tạo:</strong> {poDetail.userName}
        </Typography>
        {/* <Typography><strong>Nhà cung cấp:</strong> {poDetail.supplierName || "-"}</Typography> */}
        <Typography>
          <strong>Tổng tiền:</strong> {poDetail.total.toLocaleString()} ₫
        </Typography>
        {Number(poDetail.status) !== STATUS.SENT && (
          <Typography>
            <strong>Công nợ:</strong> {poDetail.debt.toLocaleString()} ₫
          </Typography>
        )}

        {isPayPopup && (
          <>
            {poDetail.deposit && poDetail.deposit > 0 ? (
              <>
                <Typography>
                  <strong>Đã trả:</strong> {poDetail.deposit.toLocaleString()} ₫
                </Typography>
                <Typography>
                  <strong>Ngày trả:</strong>{" "}
                  {new Date(poDetail.depositDate).toLocaleDateString()}
                </Typography>
                <Typography>
                  <strong>Người trả:</strong> {poDetail.depositBy || "Unknown"}
                </Typography>
              </>
            ) : poDetail.deposit === 0 &&
              Number(poDetail.status) === STATUS.APPROVED ? (
              <Typography>
                <strong>Cọc:</strong> Không yêu cầu cọc
              </Typography>
            ) : null}
          </>
        )}

        <Typography sx={{ mt: 1, fontWeight: "bold" }}>
          Danh sách sản phẩm:
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Sản phẩm</TableCell>
              <TableCell>Mô tả</TableCell>
              <TableCell align="center">Số lượng</TableCell>
              <TableCell align="center">Đơn giá</TableCell>
              <TableCell align="center">Thành tiền</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {poDetail.details?.map((item) => (
              <TableRow key={item.podid}>
                <TableCell>{item.productName}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell align="center">{item.quantity}</TableCell>
                <TableCell align="center">
                  {item.unitPrice.toLocaleString()} ₫
                </TableCell>
                <TableCell align="center">
                  {item.unitPriceTotal.toLocaleString()} ₫
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Stack>
    );
  };

  const showApprove =
    poDetail?.status === STATUS.SENT && userRole === "purchases_staff";
  const showDeposit = poDetail?.status === STATUS.APPROVED;
  const showPay =
    poDetail?.status === STATUS.DEPOSITED || poDetail?.status === STATUS.PAID;
  const canDeposit = userRole === "accountant_staff" || userRole === "admin";
  const canPay = userRole === "accountant_staff" || userRole === "admin";
  const canCreateGRN =
    poDetail?.status === STATUS.APPROVED &&
    userRole === "warehouse_staff" &&
    !fullyReceivedPOs.includes(poDetail?.poid);

  return (
    <>
      <Stack direction="row" spacing={1} justifyContent="center">
        {showApprove && (
          <Tooltip title="Duyệt yêu cầu">
            <IconButton color="primary" onClick={handleApprove}>
              <CheckCircle />
            </IconButton>
          </Tooltip>
        )}
        {showDeposit && canDeposit && (
          <Tooltip title="Đặt cọc">
            <IconButton color="info" onClick={() => setDepositOpen(true)}>
              <AccountBalance />
            </IconButton>
          </Tooltip>
        )}
        {showPay && canPay && (
          <Tooltip title="Thanh toán">
            <IconButton color="success" onClick={() => setPayOpen(true)}>
              <Paid />
            </IconButton>
          </Tooltip>
        )}
        {canCreateGRN && (
          <Tooltip title="Tạo GRN từ PO">
            <IconButton color="secondary" onClick={handleCreateGRN}>
              <NoteAdd />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {/* Deposit Dialog */}
      <Dialog
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Ghi nhận tiền đặt cọc</DialogTitle>
        <DialogContent sx={{ minHeight: 400 }}>
          {renderPoInfo()}
          <TextField
            autoFocus
            margin="dense"
            label="Số tiền đặt cọc"
            type="number"
            fullWidth
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDepositOpen(false)}>Hủy</Button>
          <Button onClick={handleDeposit} disabled={loading}>
            {loading ? "Đang xử lý..." : "Xác nhận"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Pay Dialog */}
      <Dialog
        open={payOpen}
        onClose={() => setPayOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Thanh toán công nợ</DialogTitle>
        <DialogContent sx={{ minHeight: 400 }}>
          {renderPoInfo(true)}
          <TextField
            autoFocus
            margin="dense"
            label="Số tiền thanh toán"
            type="number"
            fullWidth
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayOpen(false)}>Hủy</Button>
          <Button onClick={handlePay} disabled={loading}>
            {loading ? "Đang xử lý..." : "Xác nhận"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
