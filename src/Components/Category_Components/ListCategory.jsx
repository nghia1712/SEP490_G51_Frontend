// File: ListCategory.js
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  TableSortLabel,
  CircularProgress,
  Pagination,
  Chip,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Card,
  CardContent,
  Stack,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CategoryIcon from "@mui/icons-material/Category";
// MUI Icons
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

// Import các dialog đã tạo
import AddCategoryDialog from "./AddCategory";
import EditCategoryDialog from "./EditCategory";
import CategoryDetails from "./CategoryDetails";

import useCategory from "../../Hooks/useCategory";
import categoryAPI from "../../API/categoryAPI";
import productAPI from "../../API/productAPI";

function ListCategory() {
  const navigate = useNavigate();
  const {
    categories: hookCategories,
    getAllCategories,
    createCategory,
    inactivateCategory,
    loading,
    error: hookError,
  } = useCategory();
  const [categories, setCategories] = useState([]);
  const [productCountMap, setProductCountMap] = useState({}); // Map categoryID -> productCount
  const [allProducts, setAllProducts] = useState([]); // Lưu tất cả sản phẩm để hiển thị
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [selectedCategoryProducts, setSelectedCategoryProducts] = useState([]);
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [filterText, setFilterText] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "categoryName",
    direction: "asc",
  });
  const [statusFirst, setStatusFirst] = useState("active"); // 'active' hoặc 'inactive'
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'inactive'
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // States để quản lý các dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const fetchProductCounts = useCallback(async () => {
    try {
      const response = await productAPI.getAll();
      const products = response?.data?.data || response?.data || [];

      // Lưu tất cả sản phẩm để dùng cho dialog
      setAllProducts(products);

      // Đếm số lượng sản phẩm theo CategoryID
      const countMap = {};
      products.forEach((product) => {
        const categoryId =
          product?.categoryID ||
          product?.CategoryID ||
          product?.categoryId ||
          product?.CategoryId;
        if (categoryId) {
          countMap[categoryId] = (countMap[categoryId] || 0) + 1;
        }
      });

      setProductCountMap(countMap);
    } catch (error) {
      console.error("Error fetching product counts:", error);
      // Không set error để không ảnh hưởng đến UI chính
    }
  }, []);

  // Đồng bộ dữ liệu từ hook vào state local
  useEffect(() => {
    setCategories(hookCategories || []);
  }, [hookCategories]);

  // Chỉ fetch một lần khi component mount, không phụ thuộc vào getAllCategories để tránh vòng lặp
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (isMounted) {
        await getAllCategories();
        await fetchProductCounts();
      }
    };

    loadData();

    // Cleanup: đánh dấu component đã unmount
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - chỉ chạy một lần khi mount

  const handleSort = (key) => {
    const isAsc = sortConfig.key === key && sortConfig.direction === "asc";
    setSortConfig({ key, direction: isAsc ? "desc" : "asc" });
  };

  // Function để xử lý navigation và API calls
  const handleApiCall = async (
    apiCall,
    successMessage,
    errorMessage,
    redirectPath = null
  ) => {
    try {
      const response = await apiCall();

      if (response.data && response.data.success) {
        setSnackbarMessage(successMessage);
        setSnackbarOpen(true);
        setError(null);

        // Nếu có redirectPath thì chuyển hướng ngay lập tức
        if (redirectPath) {
          navigate(redirectPath);
        }

        return response;
      } else {
        const errorMsg = response.data?.message || errorMessage;
        setError(errorMsg);
        setSnackbarMessage(errorMsg);
        setSnackbarOpen(true);
        return null;
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || errorMessage;
      setError(errorMsg);
      setSnackbarMessage(errorMsg);
      setSnackbarOpen(true);
      return null;
    }
  };

  const handleUpdateStatus = async (id, currentStatus, productCount) => {
    // Check if trying to deactivate a category with products
    if (currentStatus === "active" && productCount > 0) {
      const errorMsg =
        "Có thuốc nằm trong danh mục này, không thể ngừng hoạt động";
      setError(errorMsg);
      setSnackbarMessage(errorMsg);
      setSnackbarOpen(true);
      return;
    }

    if (
      !window.confirm(
        `Bạn có chắc muốn ${
          currentStatus === "active" ? "vô hiệu hóa" : "kích hoạt"
        } danh mục này?`
      )
    )
      return;

    // Clear error trước khi thực hiện
    setError(null);

    try {
      const response = await categoryAPI.toggleStatus(id);

      // Kiểm tra nếu API call thành công (không có exception)
      if (response && response.status >= 200 && response.status < 300) {
        // Hiển thị thông báo thành công
        const successMessage =
          currentStatus === "active"
            ? "Đã ngừng hoạt động loại sản phẩm thành công."
            : "Đã kích hoạt loại sản phẩm thành công.";
        setSnackbarMessage(successMessage);
        setSnackbarOpen(true);
        setError(null);

        // Refresh trang bằng cách gọi lại API
        await getAllCategories();
        await fetchProductCounts();
      } else {
        throw new Error("API call failed");
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        "Không thể cập nhật trạng thái danh mục.";
      setError(errorMsg);
      setSnackbarMessage(errorMsg);
      setSnackbarOpen(true);
    }
  };

  // Render status chip giống như trong ProductList
  const renderStatusChip = (status) => (
    <Box
      component="span"
      sx={{
        color: "white",
        bgcolor: status === "active" ? "success.main" : "error.main",
        p: "4px 10px",
        borderRadius: "16px",
        display: "inline-block",
        fontSize: "0.75rem",
        fontWeight: "bold",
        textAlign: "center",
      }}
    >
      {status === "active" ? "Hoạt động" : "Ngừng hoạt động"}
    </Box>
  );

  const filteredCategories = useMemo(() => {
    // Đảm bảo categories là array trước khi spread và filter ra các item undefined/null
    const categoriesArray = Array.isArray(categories)
      ? categories.filter((cat) => cat && typeof cat === "object")
      : [];

    let sortableItems = [...categoriesArray];

    // Lọc theo text
    if (filterText) {
      sortableItems = sortableItems.filter((item) => {
        const searchText = filterText.toLowerCase();
        const categoryName = (
          item.categoryName ||
          item.name ||
          item.CategoryName ||
          ""
        ).toLowerCase();
        const description = (item.description || "").toLowerCase();

        return (
          categoryName.includes(searchText) || description.includes(searchText)
        );
      });
    }

    // Lọc theo status
    if (statusFilter !== "all") {
      sortableItems = sortableItems.filter((item) => {
        // Sử dụng trạng thái thực từ backend, không phụ thuộc vào productCount
        const backendStatus =
          item?.status !== undefined ? item.status : item?.isActive;
        const status = backendStatus ? "active" : "inactive";

        return status === statusFilter;
      });
    }

    // Sắp xếp theo cột
    sortableItems.sort((a, b) => {
      let aValue, bValue;

      if (sortConfig.key === "index") {
        // Sorting by categoryID - sử dụng categoryID thực tế
        aValue = a.categoryID || a.CategoryID || a._id || a.id || 0;
        bValue = b.categoryID || b.CategoryID || b._id || b.id || 0;
      } else if (sortConfig.key === "categoryName") {
        // Sử dụng field name thực tế từ data
        aValue = (
          a.categoryName ||
          a.name ||
          a.CategoryName ||
          ""
        ).toLowerCase();
        bValue = (
          b.categoryName ||
          b.name ||
          b.CategoryName ||
          ""
        ).toLowerCase();
      } else if (sortConfig.key === "productCount") {
        // Sorting by product count - ưu tiên lấy từ productCountMap
        const aCategoryId = a?.categoryID || a?.CategoryID || a?._id || a?.id;
        const bCategoryId = b?.categoryID || b?.CategoryID || b?._id || b?.id;
        if (aCategoryId && productCountMap[aCategoryId] !== undefined) {
          aValue = productCountMap[aCategoryId];
        } else {
          const aProducts =
            a?.products ||
            a?.Products ||
            a?.productList ||
            a?.ProductList ||
            a?.items ||
            a?.Items ||
            [];
          aValue = aProducts?.length || 0;
        }
        if (bCategoryId && productCountMap[bCategoryId] !== undefined) {
          bValue = productCountMap[bCategoryId];
        } else {
          const bProducts =
            b?.products ||
            b?.Products ||
            b?.productList ||
            b?.ProductList ||
            b?.items ||
            b?.Items ||
            [];
          bValue = bProducts?.length || 0;
        }
      } else if (sortConfig.key === "status") {
        // Sorting by status - sử dụng trạng thái thực từ backend
        const aBackendStatus = a?.status !== undefined ? a.status : a?.isActive;
        const bBackendStatus = b?.status !== undefined ? b.status : b?.isActive;
        const aStatus = aBackendStatus ? "active" : "inactive";
        const bStatus = bBackendStatus ? "active" : "inactive";
        aValue = aStatus;
        bValue = bStatus;
      } else {
        aValue = a[sortConfig.key] || "";
        bValue = b[sortConfig.key] || "";
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    // Sắp xếp ưu tiên trạng thái (chỉ khi không có sorting theo cột)
    if (sortConfig.key === "categoryName") {
      // Chỉ sắp xếp theo trạng thái khi sorting theo tên danh mục
      sortableItems.sort((a, b) => {
        const aStatus = a.status || "inactive";
        const bStatus = b.status || "inactive";

        if (aStatus === statusFirst && bStatus !== statusFirst) return -1;
        if (aStatus !== statusFirst && bStatus === statusFirst) return 1;
        return 0;
      });
    }

    return sortableItems;
  }, [
    categories,
    filterText,
    sortConfig,
    statusFirst,
    statusFilter,
    productCountMap,
  ]);

  // Pagination logic
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

  const handleOpenEditDialog = (category) => {
    setSelectedCategory(category);
    setIsEditDialogOpen(true);
  };

  const handleOpenDetailsDialog = async (category) => {
    setSelectedCategory(category);
    setIsDetailsDialogOpen(true);

    // Gọi API để lấy thông tin chi tiết với products
    try {
      const categoryId =
        category?.categoryID ||
        category?.CategoryID ||
        category?._id ||
        category?.id;
      if (categoryId) {
        const response = await categoryAPI.get(categoryId);

        if (response.data && response.data.success && response.data.data) {
          // Cập nhật selectedCategory với thông tin chi tiết
          setSelectedCategory(response.data.data);
        }
      }
    } catch (error) {
      // Vẫn hiển thị dialog với thông tin cơ bản
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Card elevation={3} sx={{ borderRadius: 2 }}>
        <CardContent>
          {/* Title */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <CategoryIcon sx={{ fontSize: 40, mr: 2, color: "#1976d2" }} />
            <Typography
              variant="h4"
              sx={{ fontWeight: "bold", flexGrow: 1, color: "#1976d2" }}
            >
              Danh mục thuốc
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Tổng: {filteredCategories.length} danh mục
            </Typography>
          </Box>

          {/* FILTER */}
          <Paper
            sx={{
              p: 2,
              mb: 3,
              backgroundColor: "#f8fafc",
              borderRadius: 2,
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              alignItems="center"
              spacing={2}
              justifyContent="space-between"
            >
              {/* Left: Search + Lọc trạng thái */}
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                flexWrap="wrap"
              >
                {/* SEARCH */}
                <TextField
                  variant="outlined"
                  size="small"
                  placeholder="Tìm tên danh mục..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: 300 }}
                />

                {/* LỌC TRẠNG THÁI */}
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel id="status-filter-label">Trạng thái</InputLabel>
                  <Select
                    labelId="status-filter-label"
                    value={statusFilter}
                    label="Trạng thái"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">Tất cả</MenuItem>
                    <MenuItem value="active">Hoạt động</MenuItem>
                    <MenuItem value="inactive">Ngừng hoạt động</MenuItem>
                  </Select>
                </FormControl>

                {/* CLEAR FILTER */}
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    setFilterText("");
                    setStatusFilter("all");
                  }}
                >
                  Xóa lọc
                </Button>
              </Stack>

              {/* Right: Nút thêm danh mục */}
              <Box sx={{ ml: "auto" }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setIsAddDialogOpen(true)}
                  sx={{
                    backgroundColor: "#155E64",
                    "&:hover": { backgroundColor: "#0D4F52" },
                    borderRadius: "8px",
                    px: 3,
                    py: 1.3,
                  }}
                >
                  THÊM DANH MỤC
                </Button>
              </Box>
            </Stack>
          </Paper>

          {/* Loading */}
          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {/* Table */}
          {!loading && (
            <TableContainer
              component={Paper}
              sx={{
                boxShadow: 2,
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <Table sx={{ tableLayout: "fixed" }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell
                      sx={{
                        width: "7%",
                        py: 1.5,
                        px: 2,
                        textAlign: "left",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.03em",
                      }}
                    >
                      <TableSortLabel
                        active={sortConfig.key === "index"}
                        direction={
                          sortConfig.key === "index"
                            ? sortConfig.direction
                            : "asc"
                        }
                        onClick={() => handleSort("index")}
                      >
                        #
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ width: "20%", py: 1.5, px: 2 }}>
                      <TableSortLabel
                        active={sortConfig.key === "categoryName"}
                        direction={
                          sortConfig.key === "categoryName"
                            ? sortConfig.direction
                            : "asc"
                        }
                        onClick={() => handleSort("categoryName")}
                        sx={{
                          textTransform: "uppercase",
                          fontWeight: 600,
                          letterSpacing: "0.03em",
                        }}
                      >
                        Tên danh mục
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      sx={{
                        width: "25%",
                        py: 1.5,
                        px: 2,
                        pl: 2,
                        textAlign: "left",
                        textTransform: "uppercase",
                        fontWeight: 600,
                        letterSpacing: "0.03em",
                      }}
                    >
                      Mô tả
                    </TableCell>
                    <TableCell
                      sx={{
                        width: "15%",
                        py: 1.5,
                        px: 2,
                        textAlign: "left",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <TableSortLabel
                        active={sortConfig.key === "productCount"}
                        direction={
                          sortConfig.key === "productCount"
                            ? sortConfig.direction
                            : "asc"
                        }
                        onClick={() => handleSort("productCount")}
                        sx={{
                          textTransform: "uppercase",
                          fontWeight: 600,
                          letterSpacing: "0.03em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Số lượng sản phẩm
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      sx={{ width: "15%", py: 1.5, px: 2, textAlign: "center" }}
                    >
                      <TableSortLabel
                        active={sortConfig.key === "status"}
                        direction={
                          sortConfig.key === "status"
                            ? sortConfig.direction
                            : "asc"
                        }
                        onClick={() => handleSort("status")}
                        sx={{
                          textTransform: "uppercase",
                          fontWeight: 600,
                          letterSpacing: "0.03em",
                        }}
                      >
                        Trạng thái
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      sx={{ width: "18%", textAlign: "right", py: 1.5, px: 2 }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 0.5,
                        }}
                      >
                        <span
                          style={{
                            textTransform: "uppercase",
                            fontWeight: 600,
                            letterSpacing: "0.03em",
                          }}
                        >
                          Hành động
                        </span>
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCategories.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        sx={{ textAlign: "center", py: 3 }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Chưa có danh mục nào.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedCategories
                      .filter((cat) => cat && typeof cat === "object")
                      .map((cat, index) => (
                        <TableRow
                          key={cat._id || cat.id || `category-${index}`}
                          hover
                          sx={{
                            "&:nth-of-type(even)": {
                              backgroundColor: "#f9f9f9",
                            },
                            "& td": {
                              py: 1.5,
                              px: 2,
                              verticalAlign: "middle",
                            },
                          }}
                        >
                          <TableCell
                            sx={{ fontWeight: 500, textAlign: "left" }}
                          >
                            {startIndex + index + 1}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>
                            {cat?.categoryName ||
                              cat?.name ||
                              cat?.CategoryName ||
                              "Tên không xác định"}
                          </TableCell>
                          <TableCell sx={{ textAlign: "left", pl: 2 }}>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                textAlign: "left",
                                whiteSpace: "normal",
                                wordBreak: "break-word",
                              }}
                            >
                              {cat?.description || "Không có mô tả"}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ textAlign: "center" }}>
                            <Tooltip
                              title="Click để xem danh sách sản phẩm"
                              placement="top"
                              arrow
                            >
                              <Typography
                                variant="body2"
                                fontWeight="bold"
                                color="primary"
                                sx={{
                                  cursor: "pointer",
                                  display: "inline-block",
                                  "&:hover": {
                                    textDecoration: "underline",
                                    opacity: 0.8,
                                  },
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const categoryId =
                                    cat?.categoryID ||
                                    cat?.CategoryID ||
                                    cat?._id ||
                                    cat?.id;
                                  const categoryName =
                                    cat?.categoryName ||
                                    cat?.name ||
                                    cat?.CategoryName ||
                                    "Danh mục";

                                  // Lọc sản phẩm theo categoryID
                                  const filteredProducts = allProducts.filter(
                                    (product) => {
                                      const productCategoryId =
                                        product?.categoryID ||
                                        product?.CategoryID ||
                                        product?.categoryId ||
                                        product?.CategoryId;
                                      return productCategoryId === categoryId;
                                    }
                                  );

                                  setSelectedCategoryProducts(filteredProducts);
                                  setSelectedCategoryName(categoryName);
                                  setProductDialogOpen(true);
                                }}
                              >
                                {(() => {
                                  const categoryId =
                                    cat?.categoryID ||
                                    cat?.CategoryID ||
                                    cat?._id ||
                                    cat?.id;
                                  // Ưu tiên lấy từ productCountMap, sau đó mới fallback về products array
                                  if (
                                    categoryId &&
                                    productCountMap[categoryId] !== undefined
                                  ) {
                                    return productCountMap[categoryId];
                                  }
                                  const products =
                                    cat?.products ||
                                    cat?.Products ||
                                    cat?.productList ||
                                    cat?.ProductList ||
                                    cat?.items ||
                                    cat?.Items ||
                                    [];
                                  return products?.length || 0;
                                })()}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ textAlign: "center" }}>
                            {(() => {
                              const backendStatus =
                                cat?.status !== undefined
                                  ? cat.status
                                  : cat?.isActive;
                              const status = backendStatus
                                ? "active"
                                : "inactive";
                              return (
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                  }}
                                >
                                  <Chip
                                    label={
                                      status === "active"
                                        ? "Hoạt động"
                                        : "Ngừng hoạt động"
                                    }
                                    size="small"
                                    sx={{
                                      backgroundColor:
                                        status === "active"
                                          ? "#d4edda"
                                          : "#f8d7da",
                                      color:
                                        status === "active"
                                          ? "#155724"
                                          : "#721c24",
                                    }}
                                  />
                                </Box>
                              );
                            })()}
                          </TableCell>
                          <TableCell
                            sx={{ textAlign: "right", verticalAlign: "middle" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                gap: 0.5,
                                alignItems: "center",
                                justifyContent: "flex-end",
                                flexWrap: "nowrap",
                              }}
                            >
                              <Tooltip title="Sửa" placement="bottom" arrow>
                                <IconButton
                                  size="medium"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditDialog(cat);
                                  }}
                                  sx={{
                                    color: "#ed6c02",
                                    width: "40px",
                                    height: "40px",
                                    "&:hover": {
                                      backgroundColor: "rgba(237, 108, 2, 0.1)",
                                    },
                                  }}
                                >
                                  <EditIcon fontSize="medium" />
                                </IconButton>
                              </Tooltip>
                              {(() => {
                                const categoryId =
                                  cat?.categoryID ||
                                  cat?.CategoryID ||
                                  cat?._id ||
                                  cat?.id;
                                // Ưu tiên lấy từ productCountMap
                                let productCount = 0;
                                if (
                                  categoryId &&
                                  productCountMap[categoryId] !== undefined
                                ) {
                                  productCount = productCountMap[categoryId];
                                } else {
                                  const products =
                                    cat?.products ||
                                    cat?.Products ||
                                    cat?.productList ||
                                    cat?.ProductList ||
                                    cat?.items ||
                                    cat?.Items ||
                                    [];
                                  productCount = products?.length || 0;
                                }
                                const canDelete = productCount === 0;
                                return (
                                  <Tooltip
                                    title={
                                      canDelete
                                        ? "Xóa"
                                        : "Không thể xóa: danh mục này đang có sản phẩm"
                                    }
                                    placement="bottom"
                                    arrow
                                  >
                                    <span>
                                      <IconButton
                                        size="medium"
                                        disabled={!canDelete}
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          if (!canDelete) return;
                                          if (
                                            !window.confirm(
                                              "Bạn có chắc chắn muốn xóa danh mục này? Hành động không thể hoàn tác."
                                            )
                                          )
                                            return;
                                          const resp = await handleApiCall(
                                            () =>
                                              categoryAPI.delete(categoryId),
                                            "Xóa danh mục thành công!",
                                            "Không thể xóa danh mục."
                                          );
                                          if (resp) {
                                            setCategories((prev) =>
                                              prev.filter(
                                                (c) =>
                                                  (c?.categoryID ||
                                                    c?.CategoryID ||
                                                    c?._id ||
                                                    c?.id) !== categoryId
                                              )
                                            );
                                          }
                                        }}
                                        sx={{
                                          color: "#d32f2f",
                                          width: "40px",
                                          height: "40px",
                                          "&:hover": {
                                            backgroundColor:
                                              "rgba(211, 47, 47, 0.1)",
                                          },
                                          "&:disabled": {
                                            color: "#ccc",
                                          },
                                        }}
                                      >
                                        <DeleteIcon fontSize="medium" />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                );
                              })()}
                              {(() => {
                                const backendStatus =
                                  cat?.status !== undefined
                                    ? cat.status
                                    : cat?.isActive;
                                const status = backendStatus
                                  ? "active"
                                  : "inactive";
                                const categoryId =
                                  cat?.categoryID ||
                                  cat?.CategoryID ||
                                  cat?._id ||
                                  cat?.id;
                                // Ưu tiên lấy từ productCountMap
                                let productCount = 0;
                                if (
                                  categoryId &&
                                  productCountMap[categoryId] !== undefined
                                ) {
                                  productCount = productCountMap[categoryId];
                                } else {
                                  const products =
                                    cat?.products ||
                                    cat?.Products ||
                                    cat?.productList ||
                                    cat?.ProductList ||
                                    cat?.items ||
                                    cat?.Items ||
                                    [];
                                  productCount = products?.length || 0;
                                }

                                return (
                                  <Button
                                    variant="contained"
                                    color={
                                      status === "active" ? "error" : "success"
                                    }
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateStatus(
                                        cat?.categoryID ||
                                          cat?.CategoryID ||
                                          cat?._id ||
                                          cat?.id,
                                        status,
                                        productCount
                                      );
                                    }}
                                    sx={{
                                      minWidth: 160,
                                      width: 160,
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {status === "active"
                                      ? "NGỪNG HOẠT ĐỘNG"
                                      : "KÍCH HOẠT"}
                                  </Button>
                                );
                              })()}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
              {filteredCategories.length > 0 && (
                <Box
                  sx={{
                    pt: 2,
                    pb: 2,
                    borderTop: "1px solid #e0e0e0",
                    display: "flex",
                    justifyContent: "flex-end",
                    backgroundColor: "#fff",
                  }}
                >
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={(_, value) => setCurrentPage(value)}
                    color="primary"
                  />
                </Box>
              )}
            </TableContainer>
          )}
        </CardContent>
      </Card>
      {/* --- Dialogs --- */}
      <AddCategoryDialog
        open={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false);
          getAllCategories();
        }}
        onCategoryAdded={(newCategory) => {
          setCategories((prev) => [...prev, newCategory]);
          setSnackbarMessage("Thêm danh mục thành công!");
          setSnackbarOpen(true);
        }}
        onAdd={createCategory}
        categories={categories}
      />

      {selectedCategory && (
        <EditCategoryDialog
          open={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            getAllCategories();
          }}
          category={selectedCategory}
          categories={categories}
          onCategoryUpdated={(updatedCategory) => {
            setCategories((prev) =>
              prev.map((cat) =>
                (cat?.categoryID || cat?.CategoryID || cat?._id || cat?.id) ===
                (updatedCategory?.categoryID ||
                  updatedCategory?.CategoryID ||
                  updatedCategory?._id ||
                  updatedCategory?.id)
                  ? updatedCategory
                  : cat
              )
            );
            setSnackbarMessage("Cập nhật danh mục thành công!");
            setSnackbarOpen(true);
          }}
        />
      )}

      <CategoryDetails
        open={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        category={selectedCategory}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => {
          setSnackbarOpen(false);
          setError(null); // Clear error khi đóng snackbar
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => {
            setSnackbarOpen(false);
            setError(null);
          }}
          severity={error ? "error" : "success"}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Dialog hiển thị danh sách sản phẩm */}
      <Dialog
        open={productDialogOpen}
        onClose={() => setProductDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" component="div">
            Danh sách sản phẩm - {selectedCategoryName}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedCategoryProducts.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              Danh mục này chưa có sản phẩm nào.
            </Alert>
          ) : (
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{ mt: 2, maxHeight: 400 }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{ fontWeight: 600, backgroundColor: "#f5f5f5" }}
                    >
                      STT
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 600, backgroundColor: "#f5f5f5" }}
                    >
                      Tên sản phẩm
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 600, backgroundColor: "#f5f5f5" }}
                    >
                      Mô tả
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        backgroundColor: "#f5f5f5",
                        textAlign: "center",
                      }}
                    >
                      Đơn vị
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        backgroundColor: "#f5f5f5",
                        textAlign: "center",
                      }}
                    >
                      Trạng thái
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedCategoryProducts.map((product, index) => {
                    const productStatus =
                      product?.status ?? product?.Status ?? false;
                    return (
                      <TableRow
                        key={
                          product?.productID ||
                          product?.ProductID ||
                          product?.id ||
                          index
                        }
                        hover
                      >
                        <TableCell>{index + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>
                          {product?.productName ||
                            product?.ProductName ||
                            product?.name ||
                            "-"}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {(() => {
                              const desc =
                                product?.productDescription ||
                                product?.ProductDescription ||
                                product?.description ||
                                "-";
                              return desc.length > 50
                                ? desc.substring(0, 50) + "..."
                                : desc;
                            })()}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          {product?.unit || product?.Unit || "-"}
                        </TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          <Chip
                            label={
                              productStatus ? "Hoạt động" : "Ngừng hoạt động"
                            }
                            size="small"
                            sx={{
                              backgroundColor: productStatus
                                ? "#d4edda"
                                : "#f8d7da",
                              color: productStatus ? "#155724" : "#721c24",
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductDialogOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default ListCategory;
