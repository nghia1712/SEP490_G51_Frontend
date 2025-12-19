// src/Components/ProductLotLookup.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Autocomplete,
  Stack,
  Divider,
  Container,
  Card,
  CardContent,
} from "@mui/material";
import productAPI from "../../API/productAPI";
import supllierAPI from "../../API/supplierAPI";
import { Search } from "@mui/icons-material";

/* ================= DATE PARSER ================= */
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return new Date(dateStr);
  if (dateStr.includes("/")) {
    const [d, m, y] = dateStr.split("/");
    return new Date(`${y}-${m}-${d}`);
  }
  return new Date(dateStr);
};

const ProductLotLookup = () => {
  const [products, setProducts] = useState([]);
  const [lots, setLots] = useState([]);
  const [supplierNames, setSupplierNames] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [loadingProduct, setLoadingProduct] = useState(false);
  const [loadingLot, setLoadingLot] = useState(false);

  const searchTimeout = useRef(null);

  /* ================= SEARCH PRODUCT ================= */
  const searchProduct = async (kw = "") => {
    try {
      setLoadingProduct(true);
      const res = kw ? await productAPI.search(kw) : await productAPI.getAll();

      const list = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data)
        ? res.data
        : [];

      setProducts(list.slice(0, 10));
    } catch (err) {
      console.error(err);
      setProducts([]);
    } finally {
      setLoadingProduct(false);
    }
  };

  useEffect(() => {
    searchProduct();
  }, []);

  /* ================= LOAD LOT ================= */
  const loadLots = async (product) => {
    setSelectedProduct(product);
    setLots([]);

    if (!product) return;

    try {
      setLoadingLot(true);
      const res = await productAPI.searchLotByProductId(
        product.productID || product.id
      );

      const list = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data)
        ? res.data
        : [];

      setLots(list);
    } catch (err) {
      console.error(err);
      setLots([]);
    } finally {
      setLoadingLot(false);
    }
  };

  /* ================= LOAD SUPPLIER ================= */
  useEffect(() => {
    if (!lots.length) return;

    const fetchSuppliers = async () => {
      const ids = [...new Set(lots.map((l) => l.supplierID))];
      const map = {};

      for (const id of ids) {
        try {
          const res = await supllierAPI.getById(id);
          map[id] = res?.data?.data?.name || "Không xác định";
        } catch {
          map[id] = "Không xác định";
        }
      }
      setSupplierNames(map);
    };

    fetchSuppliers();
  }, [lots]);

  return (
    <Box sx={{ p: 3 }}>
      <Container maxWidth="xl" sx={{ pt: 4, pb: 4 }}>
        <Card elevation={3} sx={{ borderRadius: 2 }}>
          <CardContent>
            <Stack spacing={2}>
              {/* ================= SEARCH BOX ================= */}
              <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Search sx={{ fontSize: 40, mr: 2, color: "#1976d2" }} />
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: "bold", flexGrow: 1, color: "#1976d2" }}
                  >
                    Tra cứu sản phẩm
                  </Typography>
                </Box>

                <Autocomplete
                  options={products}
                  loading={loadingProduct}
                  noOptionsText="Không có sản phẩm tương ứng"
                  getOptionLabel={(p) => p.productName || ""}
                  isOptionEqualToValue={(o, v) => o.productID === v.productID}
                  onChange={(e, val) => loadLots(val)}
                  onInputChange={(e, val, reason) => {
                    if (reason === "input") {
                      clearTimeout(searchTimeout.current);
                      searchTimeout.current = setTimeout(
                        () => searchProduct(val),
                        300
                      );
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      placeholder="Nhập tên sản phẩm"
                      fullWidth
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingProduct && (
                              <CircularProgress size={18} sx={{ mr: 1 }} />
                            )}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Paper>

              {/* ================= LOT TABLE (LUÔN HIỂN THỊ) ================= */}
              <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                <Typography fontWeight={700} mb={1}>
                  📦 Danh sách lô hàng{" "}
                  {selectedProduct && (
                    <Box component="span" color="primary.main">
                      – {selectedProduct.productName}
                    </Box>
                  )}
                </Typography>

                <Divider sx={{ mb: 1 }} />

                {loadingLot ? (
                  <Box textAlign="center" py={4}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <TableContainer
                    sx={{
                      maxHeight: 420,
                      border: "1px solid #eee",
                      borderRadius: 1,
                    }}
                  >
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow
                          sx={{
                            "& .MuiTableCell-root": {
                              fontWeight: 600,
                              backgroundColor: "#f5f7fa",
                              whiteSpace: "nowrap",
                            },
                          }}
                        >
                          <TableCell align="center">Lô hàng</TableCell>
                          <TableCell>Ngày nhập</TableCell>
                          <TableCell align="center">Tồn kho</TableCell>
                          <TableCell align="center">Hạn dùng</TableCell>
                          <TableCell>Kho</TableCell>
                          <TableCell>Nhà cung cấp</TableCell>
                          <TableCell align="center">Kiểm tra cuối</TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {!selectedProduct ? (
                          <TableRow>
                            <TableCell colSpan={7} align="center">
                              Vui lòng chọn sản phẩm để xem lô hàng
                            </TableCell>
                          </TableRow>
                        ) : lots.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} align="center">
                              Không có lô hàng
                            </TableCell>
                          </TableRow>
                        ) : (
                          lots.map((lot) => {
                            const inputDate = parseDate(lot.inputDate);
                            const expiredDate = parseDate(lot.expiredDate);
                            const lastChecked = parseDate(lot.lastCheckedDate);

                            return (
                              <TableRow key={lot.lotID} hover>
                                <TableCell align="center">
                                  {lot.lotID}
                                </TableCell>
                                <TableCell>
                                  {inputDate
                                    ? inputDate.toLocaleDateString("vi-VN")
                                    : "-"}
                                </TableCell>
                                <TableCell align="center">
                                  {lot.lotQuantity}
                                </TableCell>
                                <TableCell align="center">
                                  {expiredDate
                                    ? expiredDate.toLocaleDateString("vi-VN")
                                    : "-"}
                                </TableCell>
                                <TableCell>{lot.warehouseName}</TableCell>
                                <TableCell>
                                  {supplierNames[lot.supplierID] ||
                                    lot.supplierID}
                                </TableCell>
                                <TableCell align="center">
                                  {lastChecked &&
                                  lastChecked.getFullYear() !== 1
                                    ? lastChecked.toLocaleDateString("vi-VN")
                                    : "-"}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default ProductLotLookup;
