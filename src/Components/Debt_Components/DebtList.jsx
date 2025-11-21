// src/Components/DebtManagement/DebtList.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Stack,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  TextField,
  MenuItem,
  Pagination,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import usePO from "../../Hooks/usePO";

const debtStatusMap = {
  2: { label: "Nợ xấu", color: "error" },
  4: { label: "Thanh toán một phần", color: "warning" },
  5: { label: "Hết nợ", color: "success" },
  6: { label: "Quá hạn", color: "secondary" },
};

export default function DebtList() {
  const {
    debtList,
    selectedDebt,
    debtLoading,
    fetchDebtReport,
    fetchDebtDetail,
    setSelectedDebt,
  } = usePO();

  const [openDetail, setOpenDetail] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    fetchDebtReport();
  }, []);

  const handleOpenDetail = async (reportID) => {
    await fetchDebtDetail(reportID);
    setOpenDetail(true);
  };

  const handleClose = () => {
    setOpenDetail(false);
    setSelectedDebt(null);
  };

  const entityTypeLabel = (type) =>
    type === 1 ? "Nhà cung cấp" : type === 2 ? "Khách hàng" : "Không xác định";

  // ==============================
  // FILTER + SEARCH
  // ==============================
  const filteredDebts = useMemo(() => {
    return debtList
      .filter((item) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
          item.reportID.toString().includes(s) ||
          item.debtName?.toString().toLowerCase().includes(s)
        );
      })
      .filter((item) => {
        if (!statusFilter) return true;
        return item.status === Number(statusFilter);
      });
  }, [debtList, search, statusFilter]);

  const totalPages = Math.ceil(filteredDebts.length / rowsPerPage);

  const paginatedDebts = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredDebts.slice(start, start + rowsPerPage);
  }, [filteredDebts, page]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Quản lý công nợ
      </Typography>

      {/* Search + Filter */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            label="Tìm kiếm công nợ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 300 }}
            size="small"
          />
          <TextField
            label="Lọc trạng thái"
            select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ width: 220 }}
            size="small"
          >
            <MenuItem value="">Tất cả</MenuItem>
            {Object.entries(debtStatusMap).map(([key, val]) => (
              <MenuItem key={key} value={key}>
                {val.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {debtLoading ? (
        <Stack alignItems="center" mt={4}>
          <CircularProgress />
        </Stack>
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell align="center">#</TableCell>
                  <TableCell align="center">Mã công nợ</TableCell>
                  <TableCell>Loại thực thể</TableCell>
                  <TableCell align="center">Thuộc về</TableCell>
                  <TableCell align="center">Ngày tạo</TableCell>
                  <TableCell align="center">Tổng tiền</TableCell>
                  <TableCell align="center">Đã trả</TableCell>
                  <TableCell align="center">Còn nợ</TableCell>
                  <TableCell align="center">Ngày thanh toán</TableCell>
                  <TableCell align="center">Trạng thái</TableCell>
                  <TableCell align="center">Hành động</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {paginatedDebts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedDebts.map((debt, idx) => (
                    <TableRow key={debt.reportID}>
                      <TableCell align="center">
                        {(page - 1) * rowsPerPage + idx + 1}
                      </TableCell>
                      <TableCell align="center">{`DB-${debt.reportID}`}</TableCell>
                      <TableCell>{entityTypeLabel(debt.entityType)}</TableCell>
                      <TableCell align="center">{debt.debtName}</TableCell>
                      <TableCell align="center">
                        {new Date(debt.createdDate).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell align="right">
                        {(debt.payables + debt.currentDebt)?.toLocaleString()} đ
                      </TableCell>
                      <TableCell align="right">
                        {debt.payables?.toLocaleString()} đ
                      </TableCell>
                      <TableCell align="right">
                        {debt.currentDebt?.toLocaleString()} đ
                      </TableCell>
                      <TableCell align="center">
                        {debt.payday
                          ? new Date(debt.payday).toLocaleDateString("vi-VN")
                          : "-"}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={
                            debtStatusMap[debt.status]?.label ||
                            "Không xác định"
                          }
                          color={debtStatusMap[debt.status]?.color || "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Xem chi tiết">
                          <IconButton
                            color="info"
                            onClick={() => handleOpenDetail(debt.reportID)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredDebts.length > 0 && (
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
      )}

      {/* Detail Dialog */}
      <Dialog open={openDetail} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Chi tiết công nợ</DialogTitle>
        <DialogContent dividers>
          {selectedDebt ? (
            <>
              {/* Thông tin công nợ */}
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <b>Mã công nợ:</b>
                    </TableCell>
                    <TableCell align="right">{`DB-${selectedDebt.reportID}`}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <b>Loại thực thể:</b>
                    </TableCell>
                    <TableCell align="right">
                      {entityTypeLabel(selectedDebt.entityType)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <b>Thuộc về:</b>
                    </TableCell>
                    <TableCell align="right">{selectedDebt.debtName}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <b>Ngày tạo:</b>
                    </TableCell>
                    <TableCell align="right">
                      {new Date(selectedDebt.createdDate).toLocaleDateString(
                        "vi-VN"
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <b>Tổng tiền:</b>
                    </TableCell>
                    <TableCell align="right" style={{ fontWeight: "bold" }}>
                      {(
                        selectedDebt.payables + selectedDebt.currentDebt
                      )?.toLocaleString()}{" "}
                      đ
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <b>Đã trả:</b>
                    </TableCell>
                    <TableCell align="right">
                      <Typography color="success.main">
                        {selectedDebt.payables?.toLocaleString()} đ
                      </Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <b>Còn nợ:</b>
                    </TableCell>
                    <TableCell align="right">
                      <Typography color="error.main">
                        {selectedDebt.currentDebt?.toLocaleString()} đ
                      </Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <b>Ngày thanh toán:</b>
                    </TableCell>
                    <TableCell align="right">
                      {selectedDebt.payday
                        ? new Date(selectedDebt.payday).toLocaleDateString(
                            "vi-VN"
                          )
                        : "-"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <b>Trạng thái:</b>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={
                          debtStatusMap[selectedDebt.status]?.label ||
                          "Không xác định"
                        }
                        color={
                          debtStatusMap[selectedDebt.status]?.color || "default"
                        }
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {/* Danh sách PO */}
              {selectedDebt.viewDebtPODTOs?.length > 0 && (
                <Box mt={3}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    gutterBottom
                  >
                    Danh sách đơn hàng liên quan
                  </Typography>

                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell align="center">Đơn hàng</TableCell>
                        <TableCell align="right">Tổng tiền đơn hàng</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {selectedDebt.viewDebtPODTOs.map((po) => (
                        <TableRow key={po.poid}>
                          <TableCell align="center">{`PO-${po.poid}`}</TableCell>
                          <TableCell align="right">
                            {po.toatlPo?.toLocaleString()} đ
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </>
          ) : (
            <Stack alignItems="center" mt={2}>
              <CircularProgress />
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} variant="contained" color="primary">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
