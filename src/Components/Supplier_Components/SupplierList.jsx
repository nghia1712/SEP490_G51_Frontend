import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Typography,
  Chip,
  IconButton,
  Alert,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Stack,
  Container,
  Card,
  CardContent,
  InputAdornment,
  Tooltip,
  TablePagination,
  CircularProgress,
  Backdrop,
  TableSortLabel,
  Menu,
  MenuItem,
  Divider,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  TableFooter,
  Grid,
} from "@mui/material";
import {
  Edit as EditIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  RestartAlt as RestartAltIcon,
  Clear as ClearIcon,
  Business as BusinessIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Inventory as InventoryIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { green, red, orange, blue } from "@mui/material/colors";
import { useNavigate } from "react-router-dom";
import EditSupplier from "./EditSupplier";

// Import API modules for consistency
import supplierAPI from "../../API/supplierAPI";
import supplierProductAPI from "../../API/supplierProductAPI";
import AddSupplier from "./AddSupplier";
import palette from "../../constants/palette";

const SupplierList = () => {
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState({
    "Còn cung cấp": false,
    "Ngừng cung cấp": false,
  });
  const [editingSupplier, setEditingSupplier] = useState(null);

  // Modal states
  const [openAddModal, setOpenAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    contact: "",
    email: "",
    description: "",
    status: "active",
    bankAccountNumber: "",
    myDebt: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccessMessage, setAddSuccessMessage] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(5);
  const [orderBy, setOrderBy] = useState("name");
  const [order, setOrder] = useState("asc");
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [supplierDetails, setSupplierDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [supplierProducts, setSupplierProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [openProductsModal, setOpenProductsModal] = useState(false);
  const [productsPage, setProductsPage] = useState(1);
  const productsPerPage = 6;

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      console.log("=== SupplierList fetchSuppliers ===");

      const response = await supplierAPI.getList();
      console.log("Suppliers API response:", response);
      console.log("Response status:", response.status);
      console.log("Response data:", response.data);

      // Handle standardized response structure
      let suppliersData = [];
      if (response.data?.success && response.data?.data) {
        // New format: { success: true, data: [...], total: x, timestamp: y }
        suppliersData = response.data.data || [];
        console.log(
          "Using new format - found",
          suppliersData.length,
          "suppliers"
        );
      } else if (response.data?.success === false) {
        // Backend trả về success: false nhưng có data
        suppliersData = response.data.data || [];
        console.log(
          "Backend returned success: false but has data - found",
          suppliersData.length,
          "suppliers"
        );
      } else if (Array.isArray(response.data)) {
        // Legacy format: directly array
        suppliersData = response.data;
        console.log(
          "Using legacy format - found",
          suppliersData.length,
          "suppliers"
        );
      } else {
        console.warn("Unexpected response format:", response.data);
        suppliersData = [];
      }

      setSuppliers(suppliersData);
      console.log("Final suppliers data:", suppliersData);
      console.log("First supplier structure:", suppliersData[0]);
      console.log(
        "Supplier ID field:",
        suppliersData[0]?._id || suppliersData[0]?.id
      );
      setError(null);

      console.log("Suppliers set to:", suppliersData);
      console.log("=== End fetchSuppliers ===");
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      setSuppliers([]);
      setError(
        "Không thể kết nối đến server. Lỗi: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // Lấy chi tiết nhà cung cấp
  const fetchSupplierDetails = async (supplierId) => {
    setLoadingDetails(true);
    try {
      console.log("=== FETCHING SUPPLIER DETAILS ===");
      console.log("Supplier ID:", supplierId);
      console.log("API URL:", `/api/Supplier/detail?id=${supplierId}`);

      const response = await supplierAPI.getById(supplierId);
      console.log("API Response Status:", response.status);
      console.log("API Response Data:", response.data);
      console.log("Raw Response:", response);
      console.log("Data Keys:", Object.keys(response.data || {}));
      console.log(
        "Full Data Structure:",
        JSON.stringify(response.data, null, 2)
      );
      console.log("=== END FETCHING SUPPLIER DETAILS ===");

      // Log từng field để debug
      const data = response.data;
      console.log("=== FIELD DEBUGGING ===");
      console.log("Raw response.data:", data);
      console.log("response.data.data:", data?.data);

      // Kiểm tra cấu trúc dữ liệu từ API
      if (data?.data) {
        console.log("API trả về dữ liệu trong response.data.data");
        const actualData = data.data;
        console.log("actualData:", actualData);
        console.log("actualData.name:", actualData?.name);
        console.log("actualData.email:", actualData?.email);
        console.log("actualData.address:", actualData?.address);
        console.log("actualData.phoneNumber:", actualData?.phoneNumber);
        console.log("actualData.status:", actualData?.status);
        console.log(
          "actualData.bankAccountNumber:",
          actualData?.bankAccountNumber
        );
        console.log(
          "actualData.BankAccountNumber:",
          actualData?.BankAccountNumber
        );
        console.log(
          "actualData.bankAccountNumberMasked:",
          actualData?.bankAccountNumberMasked
        );
        console.log("actualData.myDebt:", actualData?.myDebt);
      } else {
        console.log("API trả về dữ liệu trực tiếp trong response.data");
        console.log("data.name:", data?.name);
        console.log("data.email:", data?.email);
        console.log("data.address:", data?.address);
        console.log("data.phoneNumber:", data?.phoneNumber);
        console.log("data.status:", data?.status);
        console.log("data.bankAccountNumber:", data?.bankAccountNumber);
        console.log("data.BankAccountNumber:", data?.BankAccountNumber);
        console.log(
          "data.bankAccountNumberMasked:",
          data?.bankAccountNumberMasked
        );
        console.log("data.myDebt:", data?.myDebt);
      }
      console.log("=== END FIELD DEBUGGING ===");

      // Lấy dữ liệu thực tế từ API response
      const actualSupplierData = data?.data || data;
      console.log("Using actualSupplierData:", actualSupplierData);

      // Fallback: Nếu API detail không trả về dữ liệu đúng, sử dụng dữ liệu từ table
      let supplierData = actualSupplierData;
      if (
        !actualSupplierData ||
        Object.values(actualSupplierData).every(
          (val) => val === undefined || val === null || val === ""
        )
      ) {
        console.log(
          "API detail returned empty data, using table data as fallback"
        );
        const tableSupplier = suppliers.find(
          (s) => (s._id || s.id) === supplierId
        );
        if (tableSupplier) {
          supplierData = tableSupplier;
          console.log("Using table supplier data:", supplierData);
        }
      } else {
        // Nếu API trả về dữ liệu nhưng thiếu bankAccountNumber, bổ sung từ table
        const tableSupplier = suppliers.find(
          (s) => (s._id || s.id) === supplierId
        );
        if (
          tableSupplier &&
          !supplierData.bankAccountNumber &&
          !supplierData.BankAccountNumber &&
          !supplierData.bankAccountNumberMasked
        ) {
          console.log(
            "API data missing bankAccountNumber, supplementing from table"
          );
          supplierData = {
            ...supplierData,
            bankAccountNumber: tableSupplier.bankAccountNumber,
            BankAccountNumber: tableSupplier.BankAccountNumber,
            bankAccountNumberMasked: tableSupplier.bankAccountNumberMasked,
          };
          console.log("Supplemented supplier data:", supplierData);
        }
      }

      setSupplierDetails(supplierData);
      setOpenDetailsModal(true);
    } catch (error) {
      console.error("=== ERROR FETCHING SUPPLIER DETAILS ===");
      console.error("Error:", error);
      console.error("Error Response:", error.response);
      console.error("Error Status:", error.response?.status);
      console.error("Error Data:", error.response?.data);
      console.error("=== END ERROR LOGGING ===");

      // Hiển thị thông báo lỗi cho user
      alert(
        `Không thể tải chi tiết nhà cung cấp. Lỗi: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setLoadingDetails(false);
    }
  };

  // Cập nhật trạng thái nhà cung cấp (kích hoạt / ngừng cung cấp)
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      if (!id) return;

        const supplier = suppliers.find((s) => s._id === id || s.id === id);
      if (!supplier) return;

      if (newStatus === "active") {
        // Gọi đúng API enable trên backend
        await supplierAPI.enable(id, supplier);
      } else {
        // Gọi đúng API disable trên backend
        await supplierAPI.disable(id, supplier);
      }

      // Sau khi backend cập nhật, refresh lại danh sách để thấy thay đổi
      await fetchSuppliers();
      setAnchorEl(null);
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
    }
  };

  const handleFilterChange = (e) => {
    console.log("=== FILTER CHANGE ===");
    console.log("Event target name:", e.target.name);
    console.log("Event target checked:", e.target.checked);
    console.log("Current filterStatus:", filterStatus);

    const newFilterStatus = {
      ...filterStatus,
      [e.target.name]: e.target.checked,
    };
    console.log("New filterStatus:", newFilterStatus);

    setFilterStatus(newFilterStatus);
    setPage(1); // Reset về trang đầu khi filter
    console.log("==================");
  };

  const handleClearSearch = () => {
    setSearch("");
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilterStatus({ "Còn cung cấp": false, "Ngừng cung cấp": false });
    setSearch("");
    setPage(1);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleMenuOpen = (event, supplier) => {
    setAnchorEl(event.currentTarget);
    setSelectedSupplier(supplier);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSupplier(null);
  };

  // Form validation
  const validateForm = (data) => {
    const errors = {};

    // Required fields: Name, PhoneNumber, Email, Address
    if (!data.name.trim()) errors.name = "Tên nhà cung cấp là bắt buộc";

    if (!data.contact.trim()) {
      errors.contact = "Số điện thoại là bắt buộc";
    } else if (!/^0\d{9}$/.test(data.contact)) {
      errors.contact = "Số điện thoại chỉ gồm số, 10 ký tự và bắt đầu bằng 0";
    }

    if (!data.email.trim()) {
      errors.email = "Email là bắt buộc";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = "Email không hợp lệ";
    }

    if (!data.address.trim()) {
      errors.address = "Địa chỉ là bắt buộc";
    }

    if (data.bankAccountNumber && data.bankAccountNumber.trim()) {
      if (!/^\d{8,20}$/.test(data.bankAccountNumber)) {
      errors.bankAccountNumber = "Số tài khoản chỉ gồm số và dài 8–20 ký tự";
      }
    }

    if (data.myDebt && data.myDebt.trim()) {
      if (!/^\d+$/.test(data.myDebt)) {
      errors.myDebt = "Số nợ chỉ được chứa số";
      }
    }

    // Validation trùng lặp email và số điện thoại khi thêm mới
    if (data.email.trim()) {
      console.log("=== CHECKING EMAIL DUPLICATE (ADD) ===");
      console.log("New email:", data.email.trim());
      console.log("All suppliers:", suppliers);

      const duplicateEmail = suppliers.find(
        (supplier) =>
          supplier.email === data.email.trim() ||
          supplier.Email === data.email.trim()
      );

      console.log("Duplicate email found:", duplicateEmail);

      if (duplicateEmail) {
        errors.email = "Email này đã được sử dụng bởi nhà cung cấp khác";
        console.log("Email validation error set");
      }
    }

    if (data.contact.trim()) {
      console.log("=== CHECKING PHONE DUPLICATE (ADD) ===");
      console.log("New phone:", data.contact.trim());

      const duplicatePhone = suppliers.find(
        (supplier) =>
          supplier.contact === data.contact.trim() ||
          supplier.phoneNumber === data.contact.trim() ||
          supplier.PhoneNumber === data.contact.trim() ||
          supplier.Contact === data.contact.trim()
      );

      console.log("Duplicate phone found:", duplicatePhone);

      if (duplicatePhone) {
        errors.contact =
          "Số điện thoại này đã được sử dụng bởi nhà cung cấp khác";
        console.log("Phone validation error set");
      }
    }

    return errors;
  };

  // Handle form submission
  const handleSubmit = async () => {
    console.log("=== FORM SUBMISSION START ===");
    console.log("Form data:", formData);
    const errors = validateForm(formData);
    console.log("Validation errors:", errors);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setAddLoading(true);
    setFormErrors({});
    setAddSuccessMessage("");

    try {
      console.log("=== CREATING SUPPLIER ===");
      console.log("Form data:", formData);
      console.log("=== END CREATING SUPPLIER ===");

      const response = await supplierAPI.add(formData);
      console.log("Create response:", response);
      console.log("Response status:", response?.status);
      console.log("Response data:", response?.data);

      if (response?.data?.success) {
        // Hiển thị thông báo thành công
        console.log("=== SUCCESS MESSAGE SET ===");
        console.log("Setting success message...");
        console.log("Create response data:", response.data);
        console.log("Created supplier data:", response.data.data);

        // Clear errors first và đợi một chút để đảm bảo state được update
        setFormErrors({});
        setAddLoading(false);

        // Cập nhật state với dữ liệu từ API response để đảm bảo số tài khoản được cố định
        if (response.data.data) {
          const newSupplier = response.data.data;
          console.log("Adding new supplier to state:", newSupplier);
          setSuppliers((prevSuppliers) => [
            ...prevSuppliers,
            {
              _id: newSupplier._id || newSupplier.id,
              name: newSupplier.name || newSupplier.Name,
              email: newSupplier.email || newSupplier.Email,
              contact:
                newSupplier.contact ||
                newSupplier.phoneNumber ||
                newSupplier.PhoneNumber,
              address: newSupplier.address || newSupplier.Address,
              status: newSupplier.status === 1 ? "active" : "inactive",
              bankAccountNumber:
                newSupplier.bankAccountNumber ||
                newSupplier.BankAccountNumber ||
                formData.bankAccountNumber,
              myDebt:
                newSupplier.myDebt || newSupplier.MyDebt || formData.myDebt,
              description:
                newSupplier.description ||
                newSupplier.Description ||
                formData.description,
            },
          ]);
        }

        // Delay nhỏ để đảm bảo formErrors được clear trước khi set successMessage
        setTimeout(() => {
          setAddSuccessMessage("Tạo nhà cung cấp thành công!");
          console.log("Success message set, starting timeout...");

          // Đóng modal và refresh danh sách sau 3 giây
          setTimeout(() => {
            console.log("=== TIMEOUT TRIGGERED ===");
            console.log("Closing modal and refreshing...");
            setOpenAddModal(false);
            // Reset form
            setFormData({
              name: "",
              address: "",
              contact: "",
              email: "",
              description: "",
              status: "active",
              bankAccountNumber: "",
              myDebt: "",
            });
            setFormErrors({});
            setAddSuccessMessage("");
            // Refresh danh sách nhà cung cấp để đảm bảo dữ liệu đồng bộ
            fetchSuppliers();
            console.log("Modal closed and list refreshed");
          }, 3000);
        }, 100); // Delay 100ms để đảm bảo formErrors được clear
      } else {
        console.error("Create failed:", response?.data);
        setFormErrors({
          submit:
            response?.data?.message || "Có lỗi xảy ra khi tạo nhà cung cấp",
        });
        setAddLoading(false);
      }
    } catch (error) {
      console.error("=== ERROR CREATING SUPPLIER ===");
      console.error("Error:", error);
      console.error("Error response:", error.response);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);
      console.error("=== END ERROR LOGGING ===");

      setFormErrors({
        submit:
          error?.response?.data?.message ||
          "Có lỗi xảy ra khi tạo nhà cung cấp",
      });
      setAddLoading(false);
    }
  };

  // Sorting function
  const descendingComparator = (a, b, orderBy) => {
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  };

  const getComparator = (order, orderBy) => {
    return order === "desc"
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  };

  // Lọc và sắp xếp danh sách nhà cung cấp
  const filteredSuppliers = suppliers
    .filter((supplier) => {
      const supplierName = supplier.name || supplier.Name || "";
      const searchMatch = supplierName
        .toLowerCase()
        .includes(search.toLowerCase());

      // Debug filter status
      console.log("=== FILTER DEBUG ===");
      console.log("Supplier:", supplier);
      console.log("Supplier status:", supplier.status);
      console.log("Filter status:", filterStatus);

      // Check if any filter is active
      const hasActiveFilter =
        filterStatus["Còn cung cấp"] || filterStatus["Ngừng cung cấp"];
      console.log("Has active filter:", hasActiveFilter);

      let statusMatch = true;
      if (hasActiveFilter) {
        const isActiveSupplier =
          supplier.status === "active" || supplier.status === 1;
        console.log("Is active supplier:", isActiveSupplier);

        if (isActiveSupplier) {
          statusMatch = filterStatus["Còn cung cấp"];
          console.log(
            "Active supplier - filter 'Còn cung cấp':",
            filterStatus["Còn cung cấp"]
          );
        } else {
          statusMatch = filterStatus["Ngừng cung cấp"];
          console.log(
            "Inactive supplier - filter 'Ngừng cung cấp':",
            filterStatus["Ngừng cung cấp"]
          );
        }
      }

      console.log("Search match:", searchMatch);
      console.log("Status match:", statusMatch);
      console.log("Final result:", searchMatch && statusMatch);
      console.log("==================");

      return searchMatch && statusMatch;
    })
    .sort(getComparator(order, orderBy));

  // Pagination - giống logic của thuốc
  const totalPages = Math.max(
    1,
    Math.ceil(filteredSuppliers.length / rowsPerPage)
  );
  const pageStart = (page - 1) * rowsPerPage;
  const pageEnd = page * rowsPerPage;
  const paginatedSuppliers = filteredSuppliers.slice(pageStart, pageEnd);

  const getStatusChip = (status) => {
    const isActive = status === "active" || status === 1;
    return (
      <Box
        component="span"
        sx={{
          color: "white",
          bgcolor: isActive ? "success.main" : "error.main",
          p: "4px 10px",
          borderRadius: "16px",
          display: "inline-block",
          fontSize: "0.75rem",
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        {isActive ? "Cung cấp" : "Ngừng cung cấp"}
      </Box>
    );
  };

  const formatPhoneNumber = (supplier) => {
    // Thử lấy số điện thoại từ nhiều trường có thể có
    const phone =
      supplier?.contact ||
      supplier?.phoneNumber ||
      supplier?.phone ||
      supplier?.PhoneNumber ||
      supplier?.Contact;
    if (!phone) return "N/A";
    return ("0" + String(phone).replace(/\D/g, "")).replace(/^00/, "0");
  };

  const activeFiltersCount =
    Object.values(filterStatus).filter(Boolean).length + (search ? 1 : 0);

  const totalProductPages = Math.max(
    1,
    Math.ceil(supplierProducts.length / productsPerPage)
  );
  const productPageStart = (productsPage - 1) * productsPerPage;
  const productPageEnd = productsPage * productsPerPage;
  const paginatedProducts = supplierProducts.slice(
    productPageStart,
    productPageEnd
  );

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Card elevation={3}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <Skeleton variant="text" width={300} height={40} />
            </Box>
            <Skeleton variant="rectangular" height={400} />
          </CardContent>
        </Card>
      </Container>
    );
  }

  // Hiển thị error nếu có

  const fetchSupplierProducts = async (supplierId) => {
    try {
      setLoadingProducts(true);
      const response = await supplierProductAPI.getProductsBySupplier(supplierId);
      const products = response.data?.data || [];
      setSupplierProducts(products);
    } catch (error) {
      setSupplierProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleOpenProductsModal = async (supplier) => {
    const supplierId = supplier._id || supplier.id;
    if (!supplierId) return;
    setSelectedSupplier(supplier);
    setProductsPage(1);
    setOpenProductsModal(true);
    await fetchSupplierProducts(supplierId);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundImage: "url('/images/backgroundMedical2.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "linear-gradient(135deg, rgba(0, 150, 136, 0.4) 0%, rgba(0, 121, 107, 0.45) 25%, rgba(0, 96, 100, 0.5) 50%, rgba(0, 77, 64, 0.45) 75%, rgba(0, 60, 50, 0.4) 100%)",
          zIndex: 0,
        },
      }}
    >
      <Container
        maxWidth="xl"
        sx={{ mt: 0, mb: 4, position: "relative", zIndex: 1, pt: 4 }}
      >
        <Card
          elevation={3}
          sx={{ borderRadius: 2, backgroundColor: "rgba(255, 255, 255, 0.95)" }}
        >
          <CardContent sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <BusinessIcon sx={{ fontSize: 40, color: "#1976d2", mr: 2 }} />
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{ color: "#1976d2", fontWeight: "bold", flexGrow: 1 }}
                >
                  Quản lý nhà cung cấp
                </Typography>
                <Typography variant="h6" color="textSecondary">
                  Tổng: {suppliers.length} nhà cung cấp
                </Typography>
              </Box>

              {/* Toolbar với tìm kiếm và bộ lọc */}
              <Paper
                elevation={1}
                sx={{ p: 3, backgroundColor: "#f8fafc", borderRadius: 2 }}
              >
                <Stack
                  direction={{ xs: "column", lg: "row" }}
                  spacing={2}
                  alignItems="center"
                >
                  {/* Tìm kiếm + Bộ lọc + Clear filter */}
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    flexWrap="wrap"
                    sx={{ flexGrow: 1 }}
                  >
                    {/* Tìm kiếm */}
                    <TextField
                      placeholder="Tìm kiếm theo tên nhà cung cấp..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      size="small"
                      sx={{ minWidth: 300 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: search && (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={handleClearSearch}
                            >
                              <ClearIcon />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    {/* Bộ lọc trạng thái */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <FormGroup row>
                        {["Còn cung cấp", "Ngừng cung cấp"].map((status) => (
                          <FormControlLabel
                            key={status}
                            control={
                              <Checkbox
                                name={status}
                                checked={filterStatus[status]}
                                onChange={handleFilterChange}
                                size="small"
                                color="primary"
                              />
                            }
                            label={
                              <Typography variant="body2">{status}</Typography>
                            }
                          />
                        ))}
                      </FormGroup>
                    </Box>

                    {/* Nút xóa lọc giống trang thuốc */}
                    <Button
                      variant="outlined"
                            color="secondary"
                      onClick={handleClearFilters}
                    >
                      Xóa lọc
                    </Button>
                  </Stack>

                  {/* Nút thêm nhà cung cấp (bên phải) - style giống trang thuốc */}
                  <Box sx={{ marginLeft: "auto" }}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        console.log("Add button clicked, opening modal...");
                        setOpenAddModal(true);
                      }}
                      sx={{
                        backgroundColor: "#155E64",
                        "&:hover": { backgroundColor: "#0D4F52" },
                        borderRadius: "8px",
                        px: 3,
                        py: 1.5,
                        fontWeight: "600",
                      }}
                    >
                      THÊM NHÀ CUNG CẤP
                    </Button>
                  </Box>
                </Stack>
              </Paper>
            </Box>

            {/* Bảng danh sách */}
            <TableContainer
              component={Paper}
              sx={{ maxHeight: 600, borderRadius: 2, boxShadow: 1 }}
            >
              <Table stickyHeader aria-label="supplier table">
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{ fontWeight: "bold", backgroundColor: "#e3f2fd" }}
                    >
                      #
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: "bold", backgroundColor: "#e3f2fd" }}
                    >
                      <TableSortLabel
                        active={orderBy === "name"}
                        direction={orderBy === "name" ? order : "asc"}
                        onClick={() => handleRequestSort("name")}
                      >
                        Tên nhà cung cấp
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: "bold", backgroundColor: "#e3f2fd" }}
                    >
                      Địa chỉ
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: "bold", backgroundColor: "#e3f2fd" }}
                    >
                      Liên hệ
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: "bold", backgroundColor: "#e3f2fd" }}
                    >
                      Email
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: "bold", backgroundColor: "#e3f2fd" }}
                    >
                      <TableSortLabel
                        active={orderBy === "status"}
                        direction={orderBy === "status" ? order : "asc"}
                        onClick={() => handleRequestSort("status")}
                      >
                        Trạng thái
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "#e3f2fd",
                        textAlign: "center",
                      }}
                    >
                      Hành động
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedSuppliers.length > 0 ? (
                    paginatedSuppliers.map((supplier, index) => (
                      <React.Fragment
                        key={`supplier-${supplier.id || supplier._id || index}`}
                      >
                        <Tooltip
                          title="Nhấn để xem chi tiết"
                          arrow
                          placement="top"
                        >
                          <TableRow
                            hover
                            onClick={() =>
                              fetchSupplierDetails(supplier._id || supplier.id)
                            }
                            sx={{
                              "&:nth-of-type(odd)": {
                                backgroundColor: "#fafafa",
                              },
                              "&:hover": {
                                backgroundColor: "#f0f7ff",
                                cursor: "pointer",
                                transform: "scale(1.01)",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                              },
                              transition: "all 0.2s",
                            }}
                          >
                            <TableCell>
                              <Typography variant="body2" color="textSecondary">
                                {pageStart + index + 1}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography
                                  variant="body1"
                                  sx={{
                                    fontWeight: "medium",
                                    mb: 0.5,
                                    cursor: "pointer",
                                    "&:hover": {
                                      color: "#1976d2",
                                      textDecoration: "underline",
                                    },
                                  }}
                                  onClick={() =>
                                    fetchSupplierDetails(
                                      supplier._id || supplier.id
                                    )
                                  }
                                >
                                  {supplier.name}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{ maxWidth: 200 }}
                                noWrap
                              >
                                {supplier.address || "Chưa cập nhật"}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{ fontFamily: "monospace" }}
                              >
                                {formatPhoneNumber(supplier)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{ maxWidth: 180 }}
                                noWrap
                              >
                                {supplier.email || "Chưa cập nhật"}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {getStatusChip(supplier.status)}
                            </TableCell>
                            <TableCell>
                              <Stack
                                direction="row"
                                spacing={0.5}
                                justifyContent="center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Tooltip title="Xem sản phẩm" arrow>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenProductsModal(supplier)}
                                    sx={{
                                      color: blue[600],
                                      "&:hover": {
                                        backgroundColor: blue[50],
                                        transform: "scale(1.1)",
                                      },
                                      transition: "all 0.2s",
                                    }}
                                  >
                                      <InventoryIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title="Chỉnh sửa" arrow>
                                  <span>
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        setEditingSupplier(supplier)
                                      }
                                      disabled={false}
                                      sx={{
                                        color: orange[600],
                                        "&:hover": {
                                          backgroundColor: orange[50],
                                          transform: "scale(1.1)",
                                        },
                                        transition: "all 0.2s",
                                        opacity: 1,
                                      }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>

                                {/* Nút kích hoạt/ngừng cung cấp */}
                                {supplier.status === "active" ||
                                supplier.status === 1 ? (
                                  <Button
                                    variant="contained"
                                    color="error"
                                    size="small"
                                    onClick={() =>
                                      handleUpdateStatus(
                                        supplier._id || supplier.id,
                                        "inactive"
                                      )
                                    }
                                    sx={{
                                      minWidth: 130,
                                      px: 1.5,
                                      py: 0.5,
                                      fontSize: "0.75rem",
                                    }}
                                  >
                                    Ngừng cung cấp
                                  </Button>
                                ) : (
                                  <Button
                                    variant="contained"
                                    color="success"
                                    size="small"
                                    onClick={() =>
                                      handleUpdateStatus(
                                        supplier._id || supplier.id,
                                        "active"
                                      )
                                    }
                                    sx={{
                                      minWidth: 130,
                                      px: 1.5,
                                      py: 0.5,
                                      fontSize: "0.75rem",
                                    }}
                                  >
                                    Kích hoạt
                                  </Button>
                                )}
                              </Stack>
                            </TableCell>
                          </TableRow>
                        </Tooltip>
                      </React.Fragment>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        sx={{ textAlign: "center", py: 6 }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 2,
                          }}
                        >
                          <BusinessIcon
                            sx={{ fontSize: 48, color: "grey.300" }}
                          />
                          <Typography variant="h6" color="textSecondary">
                            Không tìm thấy nhà cung cấp nào
                          </Typography>
                          {(search || activeFiltersCount > 0) && (
                            <Button
                              variant="outlined"
                              onClick={handleClearFilters}
                              size="small"
                            >
                              Xóa bộ lọc
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                {/* Pagination - ẩn khi chỉ có 1 trang, canh phải, giống layout trang thuốc */}
                {filteredSuppliers.length > 0 && totalPages > 1 && (
              <TableFooter>
                <TableRow>
                      <TableCell
                        colSpan={8}
                        sx={{ borderBottom: "none", p: 2 }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                          }}
                        >
                      <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(_, v) => setPage(v)}
                        color="primary"
                      />
                    </Box>
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Menu hành động */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            elevation: 3,
            sx: { minWidth: 200 },
          }}
        >
          {selectedSupplier?.status === "active" ? (
            <MenuItem
              onClick={() =>
                handleUpdateStatus(selectedSupplier._id, "inactive")
              }
              sx={{ color: red[600] }}
            >
              <BlockIcon sx={{ mr: 1, fontSize: 20 }} />
              Ngừng cung cấp
            </MenuItem>
          ) : (
            <MenuItem
              onClick={() => handleUpdateStatus(selectedSupplier._id, "active")}
              sx={{ color: green[600] }}
            >
              <RestartAltIcon sx={{ mr: 1, fontSize: 20 }} />
              Tái cung cấp
            </MenuItem>
          )}
          <Divider />
          <MenuItem
            onClick={() =>
              navigate(`/manager/supplier-products/${selectedSupplier?._id}`)
            }
          >
            <BusinessIcon sx={{ mr: 1, fontSize: 20 }} />
            Quản lý sản phẩm
          </MenuItem>
        </Menu>

        {/* Modal chỉnh sửa */}
        <EditSupplier
          user={editingSupplier}
          closeModal={() => setEditingSupplier(null)}
          users={suppliers}
          setUsers={setSuppliers}
          onUpdateSuccess={() => {
            // Refresh danh sách nhà cung cấp
            fetchSuppliers();
          }}
        />

        {/* Add Supplier Modal */}
        <AddSupplier
          open={openAddModal}
          onClose={() => setOpenAddModal(false)}
          formData={formData}
          setFormData={setFormData}
          formErrors={formErrors}
          onSubmit={handleSubmit}
          palette={palette}
          loading={addLoading}
          successMessage={addSuccessMessage}
        />

        {/* Modal chi tiết nhà cung cấp */}
        <Dialog
          open={openDetailsModal}
          onClose={() => setOpenDetailsModal(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            },
          }}
        >
          <DialogTitle
            sx={{
              backgroundColor: "#1976d2",
              color: "white",
              display: "flex",
              alignItems: "center",
              pb: 2,
            }}
          >
            <BusinessIcon sx={{ mr: 1 }} />
            Chi tiết nhà cung cấp
            <IconButton
              onClick={() => setOpenDetailsModal(false)}
              sx={{
                ml: "auto",
                color: "white",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            {loadingDetails ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : supplierDetails ? (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: "#1976d2" }}>
                      Thông tin cơ bản
                    </Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Tên nhà cung cấp
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: "medium" }}
                        >
                          {supplierDetails.name ||
                            supplierDetails.Name ||
                            "Chưa cập nhật"}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Email
                        </Typography>
                        <Typography variant="body1">
                          {supplierDetails.email ||
                            supplierDetails.Email ||
                            "Chưa cập nhật"}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Địa chỉ
                        </Typography>
                        <Typography variant="body1">
                          {supplierDetails.address ||
                            supplierDetails.Address ||
                            "Chưa cập nhật"}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Số điện thoại
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ fontFamily: "monospace" }}
                        >
                          {formatPhoneNumber(supplierDetails)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: "#1976d2" }}>
                      Thông tin khác
                    </Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Trạng thái
                        </Typography>
                        {getStatusChip(supplierDetails.status)}
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Mô tả
                        </Typography>
                        <Typography variant="body1">
                          {supplierDetails.description ||
                            supplierDetails.Description ||
                            "Không có mô tả"}
                        </Typography>
                      </Box>
                    </Stack>
                  </Card>
                </Grid>
              </Grid>
            ) : (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="h6" color="textSecondary">
                  Không thể tải thông tin chi tiết
                </Typography>
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal sản phẩm của nhà cung cấp */}
        <Dialog
          open={openProductsModal}
          onClose={() => setOpenProductsModal(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            },
          }}
        >
          <DialogTitle
            sx={{
              backgroundColor: "#1976d2",
              color: "white",
              display: "flex",
              alignItems: "center",
              pb: 2,
            }}
          >
            <InventoryIcon sx={{ mr: 1 }} />
            Sản phẩm của nhà cung cấp
            {selectedSupplier && (
              <Typography
                component="span"
                variant="subtitle2"
                sx={{ ml: 1, opacity: 0.9 }}
              >
                – {selectedSupplier.name}
              </Typography>
            )}
            <IconButton
              onClick={() => setOpenProductsModal(false)}
              sx={{
                ml: "auto",
                color: "white",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            {loadingProducts ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : supplierProducts.length > 0 ? (
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Tên sản phẩm</TableCell>
                      <TableCell>Danh mục</TableCell>
                      <TableCell align="right">Giá</TableCell>
                      <TableCell align="right">Tồn kho</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedProducts.map((product, index) => (
                      <TableRow key={product.supplierProductId || index}>
                        <TableCell>
                          {productPageStart + index + 1}
                        </TableCell>
                        <TableCell>{product.productName}</TableCell>
                        <TableCell>{product.categoryName}</TableCell>
                        <TableCell align="right">
                          {new Intl.NumberFormat("vi-VN").format(
                            product.price || 0
                          )}{" "}
                          VNĐ
                        </TableCell>
                        <TableCell align="right">
                          {product.stock ?? 0}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body1" color="textSecondary">
                  Nhà cung cấp này chưa có sản phẩm nào.
                </Typography>
              </Box>
            )}
          </DialogContent>
          {supplierProducts.length > 0 && totalProductPages > 1 && (
            <DialogActions
              sx={{
                px: 3,
                pb: 2,
                pt: 1,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Pagination
                count={totalProductPages}
                page={productsPage}
                onChange={(_, value) => setProductsPage(value)}
                color="primary"
              />
            </DialogActions>
          )}
        </Dialog>
      </Container>
    </Box>
  );
};

export default SupplierList;
