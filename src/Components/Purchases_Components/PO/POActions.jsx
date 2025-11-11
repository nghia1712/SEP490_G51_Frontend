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
  Delete,
  Edit,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import poApi from "../../../API/poAPI";
import getUserRoleFromToken from "../../../utils/getUserRoleFromToken";
import prfqApi from "../../../API/prfqAPI";

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
  console.log("poApi object:", poApi);
  const [depositOpen, setDepositOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [poDetail, setPoDetail] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [editData, setEditData] = useState([]);
  const [deletePOId, setDeletePOId] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const navigate = useNavigate();
  const [fullyReceivedPOs, setFullyReceivedPOs] = useState([]);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    setUserRole(getUserRoleFromToken());
    loadFullyReceivedPOs();
  }, []);

  useEffect(() => {
    fetchPoDetail();
  }, [poId]);

  const loadFullyReceivedPOs = async () => {
    try {
      const res = await poApi.getFullyReceived();
      setFullyReceivedPOs(res.data?.map((po) => po.poid) || []);
    } catch (err) {
      console.error(err);
    }
  };

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

  const handleOpenConfirmDelete = (poId) => {
    setDeletePOId(poId);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletePOId) return;
    console.log("Deleting PO ID:", deletePOId);
    try {
      await poApi.deleteDraftPO(deletePOId);
      setSnackbar({
        open: true,
        message: `Xóa PO-${deletePOId} thành công`,
        severity: "success",
      });
      setTimeout(() => {
        fetchPOs();
        fetchPoDetail();
        setEditOpen(false);
      }, 2000);
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: `Xóa PO-${deletePOId} thất bại`,
        severity: "error",
      });
    } finally {
      setConfirmDeleteOpen(false);
      setDeletePOId(null);
    }
  };

  const handleContinueEdit = () => {
    if (!poDetail) return;
    setEditData(poDetail.details?.map((item) => ({ ...item })) || []);
    setEditOpen(true);
  };

  const handleUpdatePO = async (status) => {
    try {
      setLoading(true);

      const payload = {
        qid: poDetail?.qid,
        status,
        details: editData.map((item) => ({
          productID: item.productID,
          date: item.expiredDate,
          quantity: Number(item.quantity),
        })),
      };

      await prfqApi.updateDraftPO(poId, payload);

      setSnackbar({
        open: true,
        message:
          status === STATUS.DRAFT
            ? "Lưu bản nháp thành công"
            : "Gửi yêu cầu thành công",
        severity: "success",
      });

      setTimeout(() => {
        fetchPOs();
        fetchPoDetail();
        setEditOpen(false);
      }, 2000);
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Cập nhật PO thất bại",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGRN = () => {
    navigate("/grn", { state: { poId, create: true } });
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
        <Typography>
          <strong>Tổng tiền:</strong> {poDetail.total.toLocaleString()} ₫
        </Typography>
        {Number(poDetail.status) !== STATUS.SENT && (
          <Typography>
            <strong>Công nợ:</strong> {poDetail.debt.toLocaleString()} ₫
          </Typography>
        )}
        {isPayPopup && poDetail.deposit > 0 && (
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
    poDetail?.status !== STATUS.DRAFT &&
    poDetail?.status !== STATUS.SENT &&
    userRole === "warehouse_staff" &&
    !fullyReceivedPOs.includes(poDetail?.poid);
  const canDeleteDraftPO =
    poDetail?.status === STATUS.DRAFT && userRole === "purchases_staff";

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
        {canDeleteDraftPO && (
          <>
            <Tooltip title="Tiếp tục chỉnh sửa">
              <IconButton color="warning" onClick={handleContinueEdit}>
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip title="Xóa PO nháp">
              <IconButton
                color="error"
                onClick={() => handleOpenConfirmDelete(poDetail.poid)}
              >
                <Delete />
              </IconButton>
            </Tooltip>
          </>
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

      {/* Edit Draft Dialog */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Chỉnh sửa PO nháp</DialogTitle>
        <DialogContent dividers>
          {poDetail && (
            <>
              <Typography>
                <strong>PO ID:</strong> {poDetail.poid}
              </Typography>
              <Typography>
                <strong>Người tạo:</strong> {poDetail.userName}
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
                    <TableCell align="center">Số lượng</TableCell>
                    <TableCell align="center">Đơn giá</TableCell>
                    <TableCell align="center">Hạn dùng</TableCell>
                    <TableCell align="center">Thành tiền</TableCell>
                    <TableCell align="center"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {editData.map((item, i) => (
                    <TableRow key={`${item.podid}-${i}`}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          size="small"
                          inputProps={{ min: 0 }}
                          value={item.quantity}
                          onChange={(e) => {
                            const newData = [...editData];
                            newData[i].quantity = Number(e.target.value);
                            setEditData(newData);
                          }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {item.unitPrice.toLocaleString()} ₫
                      </TableCell>
                      <TableCell align="center">
                        {item.expiredDate
                          ? new Date(item.expiredDate).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell align="center">
                        {(item.quantity * item.unitPrice).toLocaleString()} ₫
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Xóa sản phẩm">
                          <IconButton
                            color="error"
                            onClick={() => {
                              const newData = editData.filter(
                                (_, idx) => idx !== i
                              );
                              setEditData(newData);
                            }}
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
          <Button onClick={() => setEditOpen(false)}>Hủy</Button>

          <Button
            variant="outlined"
            color="secondary"
            onClick={() => handleUpdatePO(STATUS.DRAFT)}
            disabled={loading}
          >
            Lưu bản nháp
          </Button>

          <Button
            variant="contained"
            color="primary"
            onClick={() => handleUpdatePO(STATUS.SENT)}
            disabled={loading}
          >
            Gửi yêu cầu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Xác nhận xóa PO</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa PO-{deletePOId} không?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Hủy</Button>
          <Button color="error" onClick={handleConfirmDelete}>
            Xác nhận
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
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
