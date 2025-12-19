import React, { useEffect, useState, useCallback } from "react";
import {
  Container,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import taxPolicyAPI from "../../API/taxPolicyAPI";

const AccountantTaxPolicy = () => {
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTax, setEditingTax] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [togglingTaxId, setTogglingTaxId] = useState(null);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    rate: "",
    description: "",
    status: false,
  });
  const [formValidation, setFormValidation] = useState({});

  const fetchTaxes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await taxPolicyAPI.listTaxPolicies();
      const data = response.data?.data;
      setTaxes(Array.isArray(data) ? data : []);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Không thể tải danh sách thuế sản phẩm.";
      setError(message);
      setSnackbarMessage(message);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTaxes();
  }, [fetchTaxes]);

  const handleOpenCreateDialog = () => {
    setEditingTax(null);
    setDialogLoading(false);
    setFormData({
      name: "",
      rate: "",
      description: "",
      status: false,
    });
    setFormValidation({});
    setFormError(null);
    setCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    if (formSubmitting) return;
    setCreateDialogOpen(false);
    setEditingTax(null);
    setDialogLoading(false);
    setFormError(null);
    setFormValidation({});
  };
  const handleEditTaxClick = async (tax) => {
    const taxId = tax.Id ?? tax.id;
    if (!taxId) return;

    setDialogLoading(true);
    setFormError(null);
    setFormValidation({});
    setCreateDialogOpen(true);

    try {
      const response = await taxPolicyAPI.getTaxPolicyDetails(taxId);
      const data = response.data?.data ?? tax;
      const rateValue = Number(data.Rate ?? data.rate ?? 0) * 100;
      const formattedRate = Number.isFinite(rateValue)
        ? String(parseFloat(rateValue.toFixed(2))).replace(/\.0+$/, "")
        : "";
      const statusValue = Boolean(data.Status ?? data.status ?? false);

      setEditingTax(data);
      setFormData({
        name: data.Name ?? data.name ?? "",
        rate: formattedRate,
        description: data.Description ?? data.description ?? "",
        status: statusValue,
      });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Không thể lấy thông tin thuế.";
      setSnackbarMessage(message);
      setSnackbarOpen(true);
      setCreateDialogOpen(false);
    } finally {
      setDialogLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Vui lòng nhập tên thuế";
    }

    const parsedRate =
      formData.rate === ""
        ? NaN
        : Number(String(formData.rate).replace(",", "."));
    if (Number.isNaN(parsedRate)) {
      errors.rate = "Tỷ lệ thuế không hợp lệ";
    } else if (parsedRate < 0 || parsedRate > 100) {
      errors.rate = "Tỷ lệ thuế phải nằm trong khoảng 0% - 100%";
    }

    setFormValidation(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitTax = async () => {
    if (!validateForm()) {
      return;
    }

    const payload = {
      Name: formData.name.trim(),
      Rate: Number(String(formData.rate).replace(",", ".")) / 100,
      Description: formData.description?.trim() || "",
      Status: Boolean(formData.status),
    };

    setFormSubmitting(true);
    setFormError(null);
    try {
      if (editingTax) {
        await taxPolicyAPI.updateTaxPolicy({
          ...payload,
          Id: editingTax.Id ?? editingTax.id,
        });
      } else {
        await taxPolicyAPI.createTaxPolicy(payload);
      }

      const message = editingTax
        ? "Cập nhật thuế thành công!"
        : "Tạo thuế thành công!";
      setSnackbarMessage(message);
      setSnackbarOpen(true);
      setCreateDialogOpen(false);
      setEditingTax(null);
      await fetchTaxes();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        (editingTax
          ? "Không thể cập nhật thuế."
          : "Không thể tạo thuế sản phẩm.");
      setFormError(message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (tax) => {
    const taxId = tax.Id ?? tax.id;
    if (!taxId) return;
    setTogglingTaxId(taxId);
    try {
      await taxPolicyAPI.disableEnableTaxPolicy(taxId);
      setSnackbarMessage("Đã thay đổi trạng thái thuế");
      setSnackbarOpen(true);
      await fetchTaxes();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Không thể đổi trạng thái thuế.";
      setSnackbarMessage(message);
      setSnackbarOpen(true);
    } finally {
      setTogglingTaxId(null);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Card elevation={3} sx={{ borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: "bold", flexGrow: 1, color: "#1976d2" }}
            >
              Thuế sản phẩm
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              my: 2,
            }}
          >
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateDialog}
              sx={{
                backgroundColor: "#155E64",
                "&:hover": { backgroundColor: "#0D4F52" },
              }}
            >
              Tạo thuế mới
            </Button>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          <Paper elevation={2}>
            <TableContainer sx={{ maxHeight: 540 }}>
              <Table stickyHeader>
                <TableHead
                  sx={{
                    backgroundColor: "#f5f5f5",
                    "& .MuiTableCell-root": { fontWeight: "bold" },
                  }}
                >
                  <TableRow>
                    <TableCell sx={{ width: 60, textAlign: "center" }}>#</TableCell>
                    <TableCell>Tên thuế</TableCell>
                    <TableCell sx={{ width: 160 }}>Tỷ lệ</TableCell>
                    <TableCell>Mô tả</TableCell>
                    <TableCell sx={{ width: 160 }}>Trạng thái</TableCell>
                    <TableCell sx={{ width: 120, textAlign: "center" }}>
                      Thao tác
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : taxes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          Chưa có thuế áp dụng
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    taxes.map((tax, index) => {
                      const rateValue = Number(tax.Rate ?? tax.rate ?? 0) * 100;
                      const formattedRate = Number.isFinite(rateValue)
                        ? `${parseFloat(rateValue.toFixed(2))}%`
                        : "-";
                      const isActive = Boolean(
                        tax.Status ?? tax.status ?? true
                      );

                      return (
                        <TableRow key={tax.Id ?? tax.id ?? index} hover>
                          <TableCell sx={{ textAlign: "center" }}>
                            {index + 1}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>
                            {tax.Name ?? tax.name ?? "-"}
                          </TableCell>
                          <TableCell>{formattedRate}</TableCell>
                          <TableCell>
                            {tax.Description ?? tax.description ?? "-"}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={isActive ? "Đang kích hoạt" : "Đang tắt"}
                              size="small"
                              sx={{
                                backgroundColor: isActive
                                  ? "#d4edda"
                                  : "#fdecea",
                                color: isActive ? "#155724" : "#b71c1c",
                              }}
                            />
                          </TableCell>
                          <TableCell
                            sx={{
                              textAlign: "center",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 0.5,
                            }}
                          >
                            <Tooltip
                              title={isActive ? "Tắt thuế" : "Bật thuế"}
                              arrow
                            >
                              <span>
                                <Switch
                                  checked={isActive}
                                  onChange={() => handleToggleStatus(tax)}
                                  size="small"
                                  color="primary"
                                  disabled={
                                    togglingTaxId === (tax.Id ?? tax.id)
                                  }
                                />
                              </span>
                            </Tooltip>
                            <Tooltip title="Sửa" arrow>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditTaxClick(tax)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Xóa" arrow>
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={async () => {
                                    if (
                                      window.confirm(
                                        `Bạn có chắc muốn xóa thuế "${
                                          tax.Name ?? tax.name
                                        }"?`
                                      )
                                    ) {
                                      try {
                                        await taxPolicyAPI.deleteTaxPolicy(
                                          tax.Id ?? tax.id
                                        );
                                        setSnackbarMessage(
                                          "Xóa thuế thành công!"
                                        );
                                        setSnackbarOpen(true);
                                        await fetchTaxes();
                                      } catch (err) {
                                        const message =
                                          err.response?.data?.message ||
                                          err.message ||
                                          "Không thể xóa thuế.";
                                        setSnackbarMessage(message);
                                        setSnackbarOpen(true);
                                      }
                                    }
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </CardContent>
      </Card>

      <Dialog
        open={createDialogOpen}
        onClose={handleCloseCreateDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" component="div">
            {editingTax ? "Chỉnh sửa thuế" : "Tạo thuế sản phẩm"}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {formError && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              onClose={() => setFormError(null)}
            >
              {formError}
            </Alert>
          )}
          {dialogLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
            >
              <TextField
                label="Tên thuế"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
                error={Boolean(formValidation.name)}
                helperText={formValidation.name}
                fullWidth
              />
              <TextField
                label="Tỷ lệ thuế (%)"
                type="number"
                value={formData.rate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, rate: e.target.value }))
                }
                inputProps={{ min: 0, max: 100, step: 0.1 }}
                required
                error={Boolean(formValidation.rate)}
                helperText={formValidation.rate || "Nhập giá trị từ 0 đến 100"}
                fullWidth
              />
              <TextField
                label="Mô tả"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                multiline
                minRows={3}
                fullWidth
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog} disabled={formSubmitting}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitTax}
            disabled={formSubmitting}
            sx={{
              backgroundColor: "#155E64",
              "&:hover": { backgroundColor: "#0D4F52" },
            }}
          >
            {formSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : editingTax ? (
              "Cập nhật"
            ) : (
              "Tạo thuế"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default AccountantTaxPolicy;
