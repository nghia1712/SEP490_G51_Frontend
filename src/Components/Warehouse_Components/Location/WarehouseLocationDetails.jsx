import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Container,
  Card,
  CardContent,
  Button,
  TextField,
  Snackbar,
  Alert,
  Pagination,
} from "@mui/material";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import warehouseApi from "../../../API/warehouseAPI";
import warehouseLocationAPI from "../../../API/warehouseLocationAPI";
import renderStatusChip from "../../../Utils/renderStatusChip";

export default function WarehouseLocationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const locationState = useLocation();
  const warehouseID = locationState.state?.warehouseID;

  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [inventoryMode, setInventoryMode] = useState(false);
  const [inventorySessionId, setInventorySessionId] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);

  // --- Pagination ---
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const totalPages = location
    ? Math.ceil(location.lotProduct.length / rowsPerPage)
    : 0;
  const paginatedLots =
    location?.lotProduct?.slice(
      (page - 1) * rowsPerPage,
      (page - 1) * rowsPerPage + rowsPerPage
    ) || [];

  useEffect(() => {
    loadLocationData();
  }, [id]);

  const loadLocationData = async () => {
    setLoading(true);
    try {
      const [lotsRes, locationRes] = await Promise.all([
        warehouseApi.getLotsByLocation(id),
        warehouseLocationAPI.getDetail(id),
      ]);
      const locData = locationRes.data.data || locationRes.data;
      setLocation({
        locationID: id,
        locationName: locData.locationName,
        lotProduct: lotsRes.data.data.map((lot) => ({
          ...lot,
          realQuantity: lot.lotQuantity,
          note: lot.note || "",
        })),
        status: locData.status,
      });
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Không thể tải dữ liệu location");
    } finally {
      setLoading(false);
    }
  };

  const startInventory = async () => {
    if (!location) return;
    try {
      const res = await warehouseApi.createInventorySession(
        location.locationID
      );
      const sessionId = res.data.data;
      setInventorySessionId(sessionId);
      setInventoryMode(true);

      const historyRes = await warehouseApi.getHistoriesBySessionId(sessionId);
      const histories = historyRes.data.data;
      setLocation((prev) => ({
        ...prev,
        lotProduct: prev.lotProduct.map((lot) => {
          const h = histories.find((x) => x.lotID === lot.lotID);
          return {
            ...lot,
            realQuantity: h?.systemQuantity || lot.lotQuantity,
            note: h?.note || "",
            historyId: h?.inventoryHistoryID,
          };
        }),
      }));

      setSnackbar({
        open: true,
        message: "Bắt đầu kiểm kê thành công",
        severity: "success",
      });
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Không thể bắt đầu kiểm kê",
        severity: "error",
      });
    }
  };

  const formatVNDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";

    // Loại bỏ 0001-01-01 (giá trị mặc định C#)
    if (date.getFullYear() === 1) return "-";

    return date.toLocaleDateString("vi-VN"); // luôn trả về dd/MM/yyyy
  };

  const submitInventory = async () => {
    if (!location || !inventorySessionId) return;
    try {
      const payload = {
        lotCounts: location.lotProduct.map((lot) => ({
          historyId: lot.historyId,
          actualQuantity:
            lot.realQuantity === "" || lot.realQuantity == null
              ? lot.lotQuantity
              : Number(lot.realQuantity),
          note: lot.note ?? "",
        })),
      };
      await warehouseApi.updateInventoryBatch(payload);

      const compareRes = await warehouseApi.getInventoryComparison(
        inventorySessionId
      );
      setComparisonData(compareRes.data.data);

      setSnackbar({
        open: true,
        message: "Cập nhật kiểm kê thành công",
        severity: "success",
      });
    } catch (err) {
      console.error(err.response?.data);
      setSnackbar({
        open: true,
        message: err?.response?.data?.message || "Cập nhật thất bại",
        severity: "error",
      });
    }
  };

  const completeInventory = async () => {
    if (!inventorySessionId) return;
    try {
      await warehouseApi.completeInventorySession(inventorySessionId);
      setInventoryMode(false);
      setInventorySessionId(null);
      setComparisonData(null);
      await loadLocationData();
      setSnackbar({
        open: true,
        message: "Hoàn tất kiểm kê thành công",
        severity: "success",
      });
    } catch (err) {
      console.error(err.response?.data);
      setSnackbar({
        open: true,
        message: err?.response?.data?.message || "Hoàn tất thất bại",
        severity: "error",
      });
    }
  };

  return (
    <Container maxWidth="xl" sx={{ pt: 4, pb: 4 }}>
      <Box sx={{ mb: 3, display: "flex", alignItems: "center" }}>
        <Button onClick={() => navigate(-1)}>🔙 Quay lại</Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : location ? (
        <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
          <Card sx={{ borderRadius: 2, width: "1500px" }}>
            <CardContent>
              {/* HEADER */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Box>
                  <Typography variant="h4" sx={{ mb: 1, color: "#1976d2" }}>
                    Chi tiết vị trí: {location.locationName}
                  </Typography>
                  {renderStatusChip(location.status ? "active" : "inactive")}
                  <Box sx={{ display: "flex", gap: 4, mt: 1 }}>
                    <Typography variant="body1">
                      <strong>Số lô sản phẩm:</strong>{" "}
                      {location.lotProduct?.length || 0}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Tổng số lượng:</strong>{" "}
                      {location.lotProduct?.reduce(
                        (sum, lot) => sum + lot.lotQuantity,
                        0
                      ) || 0}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  {!inventoryMode && (
                    <>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={startInventory}
                        sx={{ mr: 2 }}
                      >
                        Kiểm kê
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                          navigate("/inventory-report", {
                            state: {
                              warehouse: warehouseID,
                              location: location.locationID,
                            },
                          });
                        }}
                      >
                        Báo cáo kiểm kê
                      </Button>
                    </>
                  )}
                </Box>
              </Box>

              {/* TABLE */}
              <Typography variant="h6" sx={{ mb: 2 }}>
                Danh sách lô sản phẩm
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Sản phẩm</TableCell>
                      <TableCell>Nhà cung cấp</TableCell>
                      <TableCell>Số lượng</TableCell>
                      <TableCell>Giá nhập</TableCell>
                      <TableCell>Ngày nhập</TableCell>
                      <TableCell>Hạn sử dụng</TableCell>
                      {inventoryMode && <TableCell>Thực tế</TableCell>}
                      {inventoryMode &&
                        comparisonData &&
                        comparisonData.length > 0 && (
                          <TableCell>Chênh lệch</TableCell>
                        )}
                      {inventoryMode && <TableCell>Ghi chú</TableCell>}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {paginatedLots.length > 0 ? (
                      paginatedLots.map((lot, index) => (
                        <TableRow key={lot.lotID} hover>
                          <TableCell>
                            {(page - 1) * rowsPerPage + index + 1}
                          </TableCell>
                          <TableCell>{lot.productName}</TableCell>
                          <TableCell>{lot.supplierName}</TableCell>
                          <TableCell>{lot.lotQuantity}</TableCell>
                          <TableCell>
                            {lot.inputPrice.toLocaleString()} đ
                          </TableCell>
                          <TableCell>{formatVNDate(lot.inputDate)}</TableCell>
                          <TableCell>{formatVNDate(lot.inputDate)}</TableCell>
                          {inventoryMode && (
                            <TableCell>
                              <TextField
                                type="number"
                                value={lot.realQuantity}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setLocation((prev) => ({
                                    ...prev,
                                    lotProduct: prev.lotProduct.map((l) =>
                                      l.lotID === lot.lotID
                                        ? { ...l, realQuantity: value }
                                        : l
                                    ),
                                  }));
                                }}
                                size="small"
                                disabled={!!comparisonData}
                              />
                            </TableCell>
                          )}

                          {inventoryMode &&
                            comparisonData &&
                            comparisonData.length > 0 && (
                              <TableCell>
                                {lot.realQuantity - lot.lotQuantity}
                              </TableCell>
                            )}
                          {inventoryMode && (
                            <TableCell>
                              <TextField
                                value={lot.note}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setLocation((prev) => ({
                                    ...prev,
                                    lotProduct: prev.lotProduct.map((l) =>
                                      l.lotID === lot.lotID
                                        ? { ...l, note: value }
                                        : l
                                    ),
                                  }));
                                }}
                                size="small"
                                disabled={!!comparisonData}
                              />
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={
                            inventoryMode
                              ? comparisonData && comparisonData.length > 0
                                ? 10
                                : 9
                              : 7
                          }
                          align="center"
                        >
                          Không có lô sản phẩm nào
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* PAGINATION */}
              {location?.lotProduct?.length > 0 && totalPages > 1 && (
                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}
                >
                  <Pagination
                    count={totalPages || 1}
                    page={page}
                    onChange={(_, value) => setPage(value)}
                    color="primary"
                  />
                </Box>
              )}

              {/* ACTION BUTTONS */}
              {inventoryMode && (
                <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
                  {(!comparisonData || comparisonData.length === 0) && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={submitInventory}
                    >
                      Cập nhật kiểm kê
                    </Button>
                  )}
                  {comparisonData && comparisonData.length > 0 && (
                    <Button
                      variant="contained"
                      color="success"
                      onClick={completeInventory}
                    >
                      Hoàn tất kiểm kê
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => {
                      setInventoryMode(false);
                      setInventorySessionId(null);
                      setComparisonData(null);
                    }}
                  >
                    Hủy
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      ) : (
        <Typography>Không có dữ liệu</Typography>
      )}

      {/* SNACKBAR */}
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
    </Container>
  );
}
