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
import getUserRoleFromToken from "../../../utils/getUserRoleFromToken";
import usePO from "../../../Hooks/usePO";

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
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");

  const {
    selectedPO: poDetail,
    depositOpen,
    setDepositOpen,
    payOpen,
    setPayOpen,
    editOpen,
    setEditOpen,
    editData,
    setEditData,
    confirmDeleteOpen,
    setConfirmDeleteOpen,
    deletePOId,
    setDeletePOId,
    fullyReceivedPOs,
    userRole,
    setUserRole,
    snackbar,
    setSnackbar,
    handleDepositPO,
    handlePayPO,
    handleChangeStatus,
    handleDeleteDraftPO,
    fetchPOs: reloadPOs,
    fetchPODetail,
  } = usePO();

  useEffect(() => {
    const role = getUserRoleFromToken();
    if (userRole === null) {
      setUserRole(role);
    }
  }, []);
  useEffect(() => {
    if (poId) {
      fetchPODetail(poId);
    }
  }, [poId]);

  const handleApprove = async () => {
    try {
      await handleChangeStatus(poId, STATUS.APPROVED);
    } catch {}
  };

  const handleDeposit = async () => {
    await handleDepositPO(poId, Number(amount));
    setDepositOpen(false);
    setAmount("");
    reloadPOs();
  };

  const handlePay = async () => {
    await handlePayPO(poId, Number(amount));
    setPayOpen(false);
    setAmount("");
    reloadPOs();
  };

  const handleOpenConfirmDelete = (id) => {
    setDeletePOId(id);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletePOId) return;
    await handleDeleteDraftPO(deletePOId);
    setConfirmDeleteOpen(false);
    setDeletePOId(null);
    setEditOpen(false);
  };

  const handleContinueEdit = () => {
    if (!poDetail) return;
    setEditData(poDetail.details?.map((item) => ({ ...item })) || []);
    setEditOpen(true);
  };

  const handleCreateGRN = () => {
    navigate("/grn", { state: { poId, create: true } });
  };
  const poStatus = poDetail ? Number(poDetail.status) : null;
  const showApprove =
    poStatus === STATUS.SENT && userRole === "purchases_staff";
  const showDeposit = poStatus === STATUS.APPROVED;
  const showPay = poStatus === STATUS.DEPOSITED || poStatus === STATUS.PAID;
  const canDeposit = ["accountant_staff"].includes(userRole);
  const canPay = ["accountant_staff"].includes(userRole);
  const canCreateGRN =
    poStatus !== STATUS.DRAFT &&
    poStatus !== STATUS.SENT &&
    userRole === "warehouse_staff" &&
    !fullyReceivedPOs.includes(poDetail?.poid);
  const canDeleteDraftPO =
    poStatus === STATUS.DRAFT && userRole === "purchases_staff";

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
          <Button onClick={handleDeposit}>Xác nhận</Button>
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
          <Button onClick={handlePay}>Xác nhận</Button>
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
                            onClick={() =>
                              setEditData(
                                editData.filter((_, idx) => idx !== i)
                              )
                            }
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
            onClick={() => handleChangeStatus(poId, STATUS.DRAFT)}
          >
            Lưu bản nháp
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleChangeStatus(poId, STATUS.SENT)}
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
        <Alert
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
