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
  IconButton,
  Collapse,
} from "@mui/material";
import {
  Search,
  KeyboardArrowDown,
  KeyboardArrowUp,
} from "@mui/icons-material";
import productAPI from "../../API/productAPI";
import supllierAPI from "../../API/supplierAPI";

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

/* ================= GROUP BY EXPIRED + SUPPLIER ================= */
const groupLots = (lots) => {
  const map = {};

  lots.forEach((lot) => {
    const key = [lot.expiredDate, lot.supplierID].join("|");

    if (!map[key]) {
      map[key] = {
        expiredDate: lot.expiredDate,
        supplierID: lot.supplierID,
        warehouseName: lot.warehouseName,
        totalQuantity: Number(lot.lotQuantity) || 0,
        details: [lot],
      };
    } else {
      map[key].totalQuantity += Number(lot.lotQuantity) || 0;
      map[key].details.push(lot);
    }
  });

  return Object.values(map);
};

const ProductLotLookup = () => {
  const [products, setProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [supplierNames, setSupplierNames] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [expanded, setExpanded] = useState({});

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
    setGroups([]);
    setExpanded({});

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

      setGroups(groupLots(list));
    } catch (err) {
      console.error(err);
      setGroups([]);
    } finally {
      setLoadingLot(false);
    }
  };

  /* ================= LOAD SUPPLIER ================= */
  useEffect(() => {
    if (!groups.length) return;

    const ids = [...new Set(groups.map((g) => g.supplierID))];

    const fetch = async () => {
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

    fetch();
  }, [groups]);

  const toggleExpand = (idx) => {
    setExpanded((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Container maxWidth="xl">
        <Card>
          <CardContent>
            <Stack spacing={2}>
              {/* ================= SEARCH ================= */}
              <Paper sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Search sx={{ fontSize: 36, mr: 2, color: "primary.main" }} />
                  <Typography
                    variant="h4"
                    fontWeight={700}
                    sx={{ color: "primary.main" }}
                  >
                    Tra cứu sản phẩm
                  </Typography>
                </Box>

                <Autocomplete
                  options={products}
                  loading={loadingProduct}
                  getOptionLabel={(p) => p.productName || ""}
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
                    <TextField {...params} size="small" />
                  )}
                />
              </Paper>

              {/* ================= TABLE ================= */}
              <Paper sx={{ p: 2 }}>
                {/* ===== TITLE ===== */}
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={1}
                >
                  <Typography fontWeight={700}>
                    📦 Danh sách lô hàng
                    {selectedProduct && (
                      <Box
                        component="span"
                        sx={{ ml: 1, color: "primary.main", fontWeight: 600 }}
                      >
                        – {selectedProduct.productName}
                      </Box>
                    )}
                  </Typography>
                </Box>

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
                    <Table size="small" stickyHeader>
                      {/* ===== HEADER ===== */}
                      <TableHead>
                        <TableRow
                          sx={{
                            "& .MuiTableCell-root": {
                              fontWeight: 700,
                              backgroundColor: "#f5f7fa",
                              whiteSpace: "nowrap",
                            },
                          }}
                        >
                          <TableCell align="center" width={120}>
                            Tồn kho
                          </TableCell>
                          <TableCell align="center" width={140}>
                            Hạn dùng
                          </TableCell>
                          <TableCell>Nhà cung cấp</TableCell>
                        </TableRow>
                      </TableHead>

                      {/* ===== BODY ===== */}
                      <TableBody>
                        {groups.map((g, idx) => {
                          const expired = parseDate(g.expiredDate);
                          const open = expanded[idx];

                          return (
                            <React.Fragment key={idx}>
                              {/* ===== SUMMARY ROW ===== */}
                              <TableRow
                                hover
                                onClick={() => toggleExpand(idx)}
                                sx={{
                                  cursor: "pointer",
                                  backgroundColor: open ? "#f0f6ff" : "inherit",
                                  "&:hover": { backgroundColor: "#f5faff" },
                                }}
                              >
                                <TableCell align="center">
                                  {g.totalQuantity}
                                </TableCell>
                                <TableCell align="center">
                                  {expired
                                    ? expired.toLocaleDateString("vi-VN")
                                    : "-"}
                                </TableCell>
                                <TableCell>
                                  {supplierNames[g.supplierID] || g.supplierID}
                                </TableCell>
                              </TableRow>

                              {/* ===== DETAIL ROW ===== */}
                              <TableRow>
                                <TableCell
                                  colSpan={3}
                                  sx={{
                                    p: 0,
                                    backgroundColor: "#fafafa",
                                    borderBottom: open
                                      ? "1px solid #e0e0e0"
                                      : "none",
                                  }}
                                >
                                  <Collapse
                                    in={open}
                                    timeout="auto"
                                    unmountOnExit
                                  >
                                    <Box p={2} pl={4}>
                                      <Table size="small">
                                        <TableHead>
                                          <TableRow
                                            sx={{
                                              "& .MuiTableCell-root": {
                                                fontWeight: 600,
                                                backgroundColor: "#f9f9f9",
                                              },
                                            }}
                                          >
                                            <TableCell>Kho</TableCell>
                                            <TableCell align="center">
                                              Ngày nhập
                                            </TableCell>
                                            <TableCell align="center">
                                              Số lượng
                                            </TableCell>
                                          </TableRow>
                                        </TableHead>

                                        <TableBody>
                                          {g.details.map((d, i) => {
                                            const input = parseDate(
                                              d.inputDate
                                            );
                                            return (
                                              <TableRow key={i}>
                                                <TableCell>
                                                  {d.warehouseName}
                                                </TableCell>
                                                <TableCell align="center">
                                                  {input
                                                    ? input.toLocaleDateString(
                                                        "vi-VN"
                                                      )
                                                    : "-"}
                                                </TableCell>
                                                <TableCell
                                                  align="center"
                                                  sx={{ fontWeight: 500 }}
                                                >
                                                  {d.lotQuantity}
                                                </TableCell>
                                              </TableRow>
                                            );
                                          })}
                                        </TableBody>
                                      </Table>
                                    </Box>
                                  </Collapse>
                                </TableCell>
                              </TableRow>
                            </React.Fragment>
                          );
                        })}
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
