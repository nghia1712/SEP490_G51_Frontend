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
  CircularProgress,
  Box,
} from "@mui/material";
import {
  Paid,
  AccountBalance,
  CheckCircle,
  NoteAdd,
  Delete,
  Edit,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import getUserRoleFromToken from "../../../Utils/getUserRoleFromToken";
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
  const [processing, setProcessing] = useState(false);
  const location = useLocation();
  const { state } = location;

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
    handleUpdatePODraft,
  } = usePO();

  const [activeDepositPOId, setActiveDepositPOId] = useState(null);

  useEffect(() => {
    if (state?.autoOpenDeposit && userRole === "accountant_staff") {
      setActiveDepositPOId(state.poId);
      fetchPODetail(state.poId);

      window.history.replaceState({}, document.title);
    }

    if (state?.autoCreateGRN && userRole === "warehouse_staff") {
      navigate("/grn", { state: { poId: state.poId, create: true } });

      window.history.replaceState({}, document.title);
    }
  }, [state, userRole]);

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
    setProcessing(true);
    try {
      await handleChangeStatus(poId, STATUS.APPROVED);
      fetchPOs();
    } finally {
      setProcessing(false);
    }
  };

  const handleDeposit = async () => {
    setProcessing(true);
    try {
      await handleDepositPO(poId, Number(amount));
      setDepositOpen(false);
      setAmount("");
      fetchPOs();
    } finally {
      setProcessing(false);
    }
  };

  const handlePay = async () => {
    setProcessing(true);
    try {
      await handlePayPO(poId, Number(amount));
      setPayOpen(false);
      setAmount("");
      fetchPOs();
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletePOId) return;
    setProcessing(true);
    try {
      await handleDeleteDraftPO(deletePOId);
      setConfirmDeleteOpen(false);
      setDeletePOId(null);
      setEditOpen(false);
      fetchPOs();
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveDraft = async (status) => {
    setProcessing(true);
    try {
      await handleUpdatePODraft(poId, status);
      fetchPOs();
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenConfirmDelete = (id) => {
    setDeletePOId(id);
    setConfirmDeleteOpen(true);
  };

  const handleContinueEdit = () => {
    if (!poDetail) return;
    setEditData(poDetail.details?.map((item) => ({ ...item })) || []);
    setEditOpen(true);
  };

  const handleCreateGRN = () => {
    if (!canCreateGRN) {
      return;
    }
    navigate("/grn", { state: { poId, create: true } });
  };

  const poStatus = poDetail ? Number(poDetail.status) : null;
  const showApprove =
    poStatus === STATUS.SENT && userRole === "purchases_staff";
  const showDeposit = poStatus === STATUS.APPROVED;
  const showPay = poStatus === STATUS.DEPOSITED || poStatus === STATUS.PAID;
  const canDeposit =
    ["accountant_staff"].includes(userRole) && poStatus !== STATUS.DEPOSITED;
  const canPay = ["accountant_staff"].includes(userRole);
  const canCreateGRN =
    poStatus !== STATUS.DRAFT &&
    poStatus !== STATUS.SENT &&
    userRole === "warehouse_staff" &&
    !fullyReceivedPOs.includes(poDetail?.poid);
  const canDeleteDraftPO =
    poStatus === STATUS.DRAFT && userRole === "purchases_staff";

  const renderPoInfo = (isPayPopup = false) => {
    if (!poDetail) return <Typography>Đang tải chi tiết...</Typography>;

    return (
      <Box sx={{ mb: 2 }}>
        {/* Thông tin PO - 2 cột */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Box>
            <Typography>
              <strong>Đơn hàng:</strong> {`PO-${poDetail.poid}`}
            </Typography>
            <Typography>
              <strong>Người tạo:</strong> {poDetail.userName}
            </Typography>
            <Typography>
              <strong>Ngày đặt:</strong>{" "}
              {poDetail.orderDate
                ? new Date(poDetail.orderDate).toLocaleDateString("vi-EN")
                : "-"}
            </Typography>
            {(poDetail.status === 3 ||
              poDetail.status === 4 ||
              poDetail.status === 6) && (
              <Typography>
                <strong>Người thanh toán:</strong>{" "}
                {poDetail.paymentBy && poDetail.paymentBy !== "Unknown"
                  ? poDetail.paymentBy
                  : "Chưa thanh toán"}
              </Typography>
            )}
            {poDetail.status === 4 && (
              <Typography>
                <strong>Ngày thanh toán:</strong>{" "}
                {poDetail.paymentDate
                  ? new Date(poDetail.paymentDate).toLocaleDateString()
                  : "-"}
              </Typography>
            )}
            {isPayPopup && poDetail.deposit > 0 && (
              <>
                <Typography>
                  <strong>Ngày trả:</strong>{" "}
                  {poDetail.depositDate
                    ? new Date(poDetail.depositDate).toLocaleDateString()
                    : "-"}
                </Typography>
                <Typography>
                  <strong>Người trả:</strong> {poDetail.depositBy || "-"}
                </Typography>
              </>
            )}
          </Box>

          <Box>
            <Typography>
              <strong>Tổng tiền:</strong>{" "}
              {poDetail.total?.toLocaleString() || 0} ₫
            </Typography>
            <Typography>
              <strong>Tiền cọc:</strong>{" "}
              {poDetail.status === 6
                ? "Chưa thỏa thuận"
                : poDetail.deposit?.toLocaleString() + " ₫"}
            </Typography>
            {Number(poDetail.status) !== STATUS.SENT && (
              <Typography>
                <strong>Còn nợ:</strong> {poDetail.debt?.toLocaleString() || 0}{" "}
                ₫
              </Typography>
            )}
          </Box>
        </Box>

        {/* Danh sách sản phẩm */}
        <Typography sx={{ mt: 1, mb: 1, fontWeight: "bold" }}>
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
              <TableCell align="center">Số lượng</TableCell>
              <TableCell align="center">Đơn giá</TableCell>
              <TableCell align="center">Thuế</TableCell>
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
                <TableCell align="center">{item.tax * 100} %</TableCell>
                <TableCell align="center">
                  {item.unitPriceTotal.toLocaleString()} ₫
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    );
  };

  return (
    <>
      <Stack direction="row" spacing={1} justifyContent="center">
        {showApprove && (
          <Tooltip title="Duyệt yêu cầu">
            <span>
              <IconButton
                color="success"
                onClick={handleApprove}
                disabled={processing}
              >
                {processing ? <CircularProgress size={20} /> : <CheckCircle />}
              </IconButton>
            </span>
          </Tooltip>
        )}
        {showDeposit && canDeposit && (
          <Tooltip title="Đặt cọc">
            <span>
              <IconButton
                color="info"
                onClick={() => {
                  if (canDeposit) setDepositOpen(true);
                }}
                disabled={processing}
              >
                <AccountBalance />
              </IconButton>
            </span>
          </Tooltip>
        )}
        {showPay && canPay && (
          <Tooltip title="Thanh toán">
            <span>
              <IconButton
                color="success"
                onClick={() => setPayOpen(true)}
                disabled={processing}
              >
                <Paid />
              </IconButton>
            </span>
          </Tooltip>
        )}
        {canCreateGRN && (
          <Tooltip title="Tạo phiếu nhập kho">
            <span>
              <IconButton
                color="secondary"
                onClick={handleCreateGRN}
                disabled={processing || !canCreateGRN}
              >
                <NoteAdd />
              </IconButton>
            </span>
          </Tooltip>
        )}

        {canDeleteDraftPO && (
          <>
            <Tooltip title="Tiếp tục chỉnh sửa">
              <span>
                <IconButton
                  color="warning"
                  onClick={handleContinueEdit}
                  disabled={processing}
                >
                  <Edit />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Xóa PO nháp">
              <span>
                <IconButton
                  color="error"
                  onClick={() => handleOpenConfirmDelete(poDetail.poid)}
                  disabled={processing}
                >
                  <Delete />
                </IconButton>
              </span>
            </Tooltip>
          </>
        )}
      </Stack>

      {/* Deposit Dialog */}
      <Dialog
        open={
          (depositOpen ||
            (activeDepositPOId !== null && activeDepositPOId === poId)) &&
          canDeposit
        }
        onClose={() => {
          setDepositOpen(false);
          setActiveDepositPOId(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Ghi nhận tiền đặt cọc</DialogTitle>
        <DialogContent sx={{ minHeight: 400 }}>
          {poDetail &&
            (depositOpen || poDetail.poid === activeDepositPOId) &&
            renderPoInfo()}
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
          <Button
            onClick={() => {
              setDepositOpen(false);
              setActiveDepositPOId(null);
            }}
            disabled={processing}
          >
            Hủy
          </Button>
          <Button onClick={handleDeposit} disabled={processing}>
            {processing ? <CircularProgress size={20} /> : "Xác nhận"}
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
        <DialogTitle>Thanh toán</DialogTitle>
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
          <Button onClick={() => setPayOpen(false)} disabled={processing}>
            Hủy
          </Button>
          <Button onClick={handlePay} disabled={processing}>
            {processing ? <CircularProgress size={20} /> : "Xác nhận"}
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
        <DialogTitle>Chỉnh sửa đơn hàng nháp</DialogTitle>
        <DialogContent dividers>
          {poDetail && (
            <>
              <Typography>
                <strong>Mã đơn hàng:</strong> {poDetail.poid}
              </Typography>
              <Typography>
                <strong>Người tạo:</strong> {poDetail.userName}
              </Typography>
              <Typography sx={{ mt: 2, fontWeight: "bold" }}>
                Danh sách sản phẩm:
              </Typography>
              <Table size="small">
                <TableHead
                  sx={{
                    backgroundColor: "#f5f5f5",
                    "& .MuiTableCell-root": { fontWeight: "bold" },
                  }}
                >
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
                      <TableCell
                        align="center"
                        sx={{ position: "relative", pb: 3 }}
                      >
                        <TextField
                          size="small"
                          type="number"
                          value={item.quantity === 0 ? "" : item.quantity}
                          helperText={
                            item.quantity > item.suggestedQty
                              ? "Số lượng vượt quá số lượng gợi ý"
                              : ""
                          }
                          FormHelperTextProps={{
                            sx: {
                              color: "warning.main",
                              position: "absolute",
                              whiteSpace: "nowrap",
                              overflow: "visible",
                              left: 0,
                              bottom: -20,
                              zIndex: 1,
                            },
                          }}
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
                          <span>
                            <IconButton
                              color="error"
                              onClick={() =>
                                setEditData(
                                  editData.filter((_, idx) => idx !== i)
                                )
                              }
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
          <Button onClick={() => setEditOpen(false)} disabled={processing}>
            Hủy
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => handleSaveDraft(7)}
            disabled={processing}
          >
            {processing ? <CircularProgress size={20} /> : "Lưu bản nháp"}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleSaveDraft(6)}
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
          <Button
            onClick={() => setConfirmDeleteOpen(false)}
            disabled={processing}
          >
            Hủy
          </Button>
          <Button
            color="error"
            onClick={handleConfirmDelete}
            disabled={processing}
          >
            {processing ? <CircularProgress size={20} /> : "Xác nhận"}
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