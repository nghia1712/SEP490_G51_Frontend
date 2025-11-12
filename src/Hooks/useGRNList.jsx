// Hooks/useGRNList.js
import { useState, useEffect, useMemo } from "react";
import grnApi from "../API/grnAPI";
import warehouseApi from "../API/warehouseAPI";
import poAPI from "../API/poAPI";

export default function useGRNList({ poId, autoOpenCreate }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Detail
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedGRN, setSelectedGRN] = useState(null);
  const [detailItems, setDetailItems] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Warehouse
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [locationsLoading, setLocationsLoading] = useState(false);

  // PO
  const [poItems, setPoItems] = useState([]);
  const [poInfo, setPoInfo] = useState(null);

  // Create
  const [openCreate, setOpenCreate] = useState(false);

  // Snackbar
  const [snack, setSnack] = useState({ open: false, severity: "success", message: "" });
  const handleSnackClose = () => setSnack((s) => ({ ...s, open: false }));

  /** ===================== Fetch GRN list ===================== */
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await grnApi.getAll();
      setData(res?.data?.data ?? res?.data?.result ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /** ===================== Filtered list ===================== */
  const filtered = useMemo(() => {
    if (!search) return data;
    return data.filter((item) => {
      const text = [item.grnId, item.supplierName, item.description, item.poid].join(" ").toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [search, data]);

  /** ===================== GRN Detail ===================== */
  const handleViewDetail = async (grn) => {
    setSelectedGRN(grn);
    setOpenDetail(true);
    setDetailLoading(true);
    try {
      const res = await grnApi.getDetail(grn.grnid);
      const items = res?.data?.data?.grnDetailViewDTO ?? [];
      setDetailItems(items);
    } catch (err) {
      console.error(err);
      setDetailItems([]);
    } finally {
      setDetailLoading(false);
    }
  };

  /** ===================== Warehouses & Locations ===================== */
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await warehouseApi.getAllWarehouses();
        setWarehouses(res.data?.data ?? []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (!selectedWarehouse) return;
    const fetchLocations = async () => {
      setLocationsLoading(true);
      try {
        const res = await warehouseApi.getWarehouseDetails(selectedWarehouse);
        setLocations(res.data?.data?.warehouseLocations ?? []);
        setSelectedLocation("");
      } catch (err) {
        console.error(err);
      } finally {
        setLocationsLoading(false);
      }
    };
    fetchLocations();
  }, [selectedWarehouse]);

  /** ===================== PO ===================== */
  const fetchPOItems = async (id) => {
    try {
      const res = await poAPI.getDetail(id);
      const data = res?.data?.data ?? null;
      setPoInfo(data);
      setPoItems(data?.details ?? []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (poId && openCreate) fetchPOItems(poId);
  }, [poId, openCreate]);

  useEffect(() => {
    if (autoOpenCreate) setOpenCreate(true);
  }, [autoOpenCreate]);

  /** ===================== Create GRN ===================== */
  const handleCreateGRN = async () => {
    if (!selectedWarehouse || !selectedLocation) {
      return setSnack({ open: true, severity: "error", message: "Vui lòng chọn kho và vị trí kho" });
    }
    const payload = { warehouseLocationId: selectedLocation };
    try {
      await grnApi.createFromPO(poId, payload);
      setSnack({ open: true, severity: "success", message: "Tạo phiếu nhập kho thành công" });
      setOpenCreate(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setSnack({ open: true, severity: "error", message: "Tạo phiếu nhập kho thất bại" });
    }
  };

  /** ===================== Download PDF ===================== */
  const handleDownloadPDF = async (grnId) => {
    try {
      const res = await grnApi.exportPdf(grnId, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `GRN_${grnId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setSnack({ open: true, severity: "error", message: "Không thể tải file PDF" });
    }
  };

  return {
    data,
    loading,
    search,
    setSearch,
    filtered,
    openDetail,
    setOpenDetail,
    selectedGRN,
    detailItems,
    detailLoading,
    handleViewDetail,
    warehouses,
    selectedWarehouse,
    setSelectedWarehouse,
    locations,
    selectedLocation,
    setSelectedLocation,
    locationsLoading,
    poItems,
    poInfo,
    openCreate,
    setOpenCreate,
    handleCreateGRN,
    handleDownloadPDF,
    snack,
    handleSnackClose,
  };
}
