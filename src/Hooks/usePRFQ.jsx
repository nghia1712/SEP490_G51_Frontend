// src/hooks/usePRFQ.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import prfqApi from "../API/prfqAPI";
import supplierAPI from "../API/supplierAPI";
import productAPI from "../API/productAPI";

export const statusMap = {
  1: { label: "Đã gửi", color: "info" },
  2: { label: "Đã duyệt", color: "success" },
  3: { label: "Từ chối", color: "error" },
  4: { label: "Nháp", color: "default" },
};

export default function usePRFQ(prfqId = null) {
  const isUpdate = !!prfqId;
  const searchTimeout = useRef(null);

  // ===== List & loading =====
  const [prfqs, setPrfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // ===== Detail / Form =====
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [formData, setFormData] = useState({
    supplierId: "",
    taxCode: "030203002865",
    phone: "0398233047",
    address: "165 Dư Hàng Kênh Tp Hải Phòng",
    email: "",
    items: [{ productName: "" }],
  });

  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const [productSuggestions, setProductSuggestions] = useState([]);
  const [openAddProduct, setOpenAddProduct] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };
  const handleCloseSnackbar = () =>
    setSnackbar((prev) => ({ ...prev, open: false }));

  // ===== Load List =====
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await prfqApi.getAll();
      const result = res.data?.data;
      setPrfqs(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error("Lỗi tải PRFQ:", err);
      showSnackbar("Lỗi khi tải danh sách PRFQ!", "error");
      setPrfqs([]);
    } finally {
      setLoading(false);
    }
  };

  // ===== Search =====
  const filteredPRFQs = useMemo(() => {
    if (!search) return prfqs;
    return prfqs.filter((p) =>
      p.supplierName?.toLowerCase().includes(search.toLowerCase())
    );
  }, [prfqs, search]);

  // ===== Delete =====
  const handleDelete = async (id) => {
    try {
      await prfqApi.delete(id);
      setPrfqs(prfqs.filter((p) => p.prfqid !== id));
      showSnackbar("Đã xóa thành công!", "success");
    } catch (err) {
      console.error("Lỗi xóa PRFQ:", err);
      showSnackbar("Không thể xóa PRFQ này!", "error");
    }
  };

  // ===== Detail =====
  const handleViewDetail = async (id) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const res = await prfqApi.getDetail(id);
      setDetailData(res.data?.data || null);
    } catch (err) {
      showSnackbar("Không thể tải chi tiết!", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  // ===== Download Excel =====
  const handleDownload = async () => {
    if (!detailData?.prfqid) return;

    try {
      const res = await prfqApi.downloadExcel(detailData.prfqid);

      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `PRFQ_${detailData.prfqid}.xlsx`);

      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download error:", err);
      showSnackbar("Không thể tải file!", "error");
    }
  };

  // ===== Form Handling =====
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await supplierAPI.getAll();
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data)
          ? res.data.data
          : [];
        setSuppliers(list.filter((s) => s.status === 1));
      } catch (err) {
        console.error("Lỗi tải danh sách NCC:", err);
      }
    };
    fetchSuppliers();
  }, []);

  // Load draft if updating
  useEffect(() => {
    if (!isUpdate) return;
    const fetchDraft = async () => {
      try {
        const res = await prfqApi.getDetail(prfqId);
        const data = res?.data?.data || res?.data;
        if (!data) throw new Error("Không có dữ liệu");

        let items = [];
        const rawItems =
          [
            data.items,
            data.quotationItems,
            data.productList,
            data.products,
            data.itemList,
          ].find((arr) => Array.isArray(arr)) || [];
        items = rawItems.map((item) => {
          const product = item.product || item.productInfo || {};
          return {
            productId:
              item.productId || item.productID || item.id || product.id || null,
            productName:
              item.productName ||
              product.productName ||
              product.name ||
              item.name ||
              "",
            description:
              item.productDescription ||
              product.productDescription ||
              product.description ||
              item.description ||
              "",
            unit:
              item.unit ||
              product.unit ||
              product.unitName ||
              product.donVi ||
              "",
          };
        });

        if (items.length === 0) items = [{ productName: "" }];

        setFormData((prev) => ({
          ...prev,
          supplierId: data.supplierId || data.supplier?.id || "",
          email: data.email || data.supplier?.email || "",
          items,
        }));

        const supplierId = data.supplierId || data.supplier?.id;
        if (supplierId) {
          const supplierRes = await supplierAPI.getById(supplierId);
          setSelectedSupplier(supplierRes?.data?.data || supplierRes?.data);
        }
      } catch (err) {
        console.error("Load draft error:", err);
        showSnackbar("Không thể tải bản nháp!", "error");
      }
    };
    fetchDraft();
  }, [prfqId, isUpdate]);

  // ===== Product search =====
  const handleProductSearch = async (keyword) => {
    if (!keyword.trim()) {
      setProductSuggestions([]);
      return;
    }
    try {
      const res = await productAPI.search(keyword);
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      list = list.filter((p) => p.status === true);
      const selectedIds = formData.items
        .map((item) => item.productId)
        .filter(Boolean);
      const filteredList = list.filter(
        (p) => !selectedIds.includes(p.productID)
      );
      setProductSuggestions(filteredList.slice(0, 10));
    } catch (err) {
      console.error("Lỗi search sản phẩm:", err);
    }
  };

  const handleItemChange = (index, value) => {
    const newItems = [...formData.items];
    newItems[index].productName = value;
    setFormData({ ...formData, items: newItems });

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => handleProductSearch(value), 300);
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === "supplierId" && value) {
      try {
        const res = await supplierAPI.getById(value);
        const s = res.data?.data;
        setSelectedSupplier(s);
        setFormData((prev) => ({ ...prev, email: s.email || "" }));
      } catch (err) {
        console.error("Lỗi khi lấy thông tin NCC:", err);
      }
    }
  };

  const handleAddItem = () =>
    setFormData({
      ...formData,
      items: [...formData.items, { productName: "" }],
    });

  const handleRemoveItem = (index) =>
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });

  const handleSubmit = async (status) => {
    if (loading) return;
    setLoading(true);

    try {
      const productIds = formData.items
        .map((item) => item.productId)
        .filter((id) => id);

      if (productIds.length === 0) {
        showSnackbar("Vui lòng chọn ít nhất một sản phẩm!", "warning");
        setLoading(false);
        return;
      }

      const payload = {
        supplierId: Number(formData.supplierId),
        taxCode: formData.taxCode,
        myPhone: formData.phone,
        myAddress: formData.address,
        productIds,
        prfqStatus: status === "Draft" ? 4 : 1,
      };

      if (isUpdate) await prfqApi.continueEdit(prfqId, payload);
      else await prfqApi.create(payload);

      showSnackbar(
        status === "Draft"
          ? "Lưu bản nháp thành công!"
          : "Gửi yêu cầu thành công!",
        "success"
      );
    } catch (err) {
      console.error("Lỗi Submit:", err);
      showSnackbar("Không thể lưu, vui lòng thử lại!", "error");
    } finally {
      setLoading(false);
    }
  };

  return {
    // List
    prfqs,
    filteredPRFQs,
    loading,
    search,
    setSearch,
    loadData,
    handleDelete,
    // Detail
    detailOpen,
    detailData,
    detailLoading,
    handleViewDetail,
    handleDownload,
    setDetailOpen,
    // Form
    formData,
    setFormData,
    handleChange,
    handleItemChange,
    handleAddItem,
    handleRemoveItem,
    suppliers,
    selectedSupplier,
    setSelectedSupplier,
    productSuggestions,
    openAddProduct,
    setOpenAddProduct,
    openPreview,
    setOpenPreview,
    handleSubmit,
    // Snackbar
    snackbar,
    setSnackbar,
    showSnackbar,
    handleCloseSnackbar,
    statusMap,
  };
}
