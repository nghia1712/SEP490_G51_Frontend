// src/Components/Warehouse_Components/WarehouseDashboard.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Modal,
  Spinner,
} from "react-bootstrap";
import {
  Inventory,
  LocalShipping,
  ShoppingCart,
  Warning,
  Storage,
  DateRange,
} from "@mui/icons-material";

import useWarehouse from "../../Hooks/useWarehouse";
import usePO from "../../Hooks/usePO";
import useGRNList from "../../Hooks/useGRNList";
import useGIN from "../../Hooks/useGIN";
import useProduct from "../../Hooks/useProduct";
import warehouseAPI from "../../API/warehouseAPI";
import { WarehouseDashboardModals } from "./Dashboard/WarehouseDashboardModals";
import { WarehouseCharts } from "./Dashboard/WarehouseCharts";

// ================= UI HELPER COMPONENTS =================
const StatCard = ({ title, value, icon, color, onClick, subText }) => (
  <Card
    className="border-0 shadow-sm h-100"
    onClick={onClick}
    style={{
      cursor: onClick ? "pointer" : "default",
      transition: "transform 0.2s, box-shadow 0.2s",
    }}
    onMouseEnter={(e) => {
      if (onClick) {
        e.currentTarget.style.transform = "translateY(-5px)";
        e.currentTarget.style.boxShadow = "0 .5rem 1rem rgba(0,0,0,.15)";
      }
    }}
    onMouseLeave={(e) => {
      if (onClick) {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 .125rem .25rem rgba(0,0,0,.075)";
      }
    }}
  >
    <Card.Body className="d-flex align-items-center p-4">
      <div
        className={`d-flex align-items-center justify-content-center rounded-circle bg-${color} bg-opacity-10 me-3`}
        style={{ width: "60px", height: "60px", minWidth: "60px" }}
      >
        {React.cloneElement(icon, {
          className: `text-${color}`,
          style: { fontSize: "30px" },
        })}
      </div>
      <div>
        <p
          className="text-muted mb-1 text-uppercase fw-semibold"
          style={{ fontSize: "0.8rem" }}
        >
          {title}
        </p>
        <h4 className="fw-bold mb-0 text-dark">{value}</h4>
        {subText && <small className="text-muted">{subText}</small>}
      </div>
    </Card.Body>
  </Card>
);

export default function WarehouseDashboard() {
  const scrollableBodyStyle = { maxHeight: "400px", overflowY: "auto" };
  const [nearestLots, setNearestLots] = useState([]);
  const [showPendingExportProductModal, setShowPendingExportProductModal] =
    useState(false);
  const [discrepancyProducts, setDiscrepancyProducts] = useState([]);
  const [showPendingReceivingModal, setShowPendingReceivingModal] =
    useState(false);

  // ================= HOOKS =================
  const { products, loading: loadingWarehouse } = useWarehouse();
  const {
    poList,
    fullyReceivedPOs,
    pendingProducts,
    pendingLoading,
    loading: loadingPO,
    fetchPendingProducts,
  } = usePO();
  const [autoOpenCreate] = useState(false);
  const [showPendingGINModal, setShowPendingGINModal] = useState(false);
  const [showPendingPOModal, setShowPendingPOModal] = useState(false);

  useEffect(() => {
    fetchPendingProducts();
  }, []);

  const pendingProductQty = useMemo(
    () =>
      pendingProducts.reduce((sum, p) => sum + (p.remainingQuantity || 0), 0),
    [pendingProducts]
  );

  const { data: grnList, loading: loadingGRN } = useGRNList({
    poId: null,
    autoOpenCreate: autoOpenCreate,
  });
  const { fetchProductsWithNearestLot } = useProduct();
  const {
    data: ginList,
    loading: loadingGIN,
    notExportedStats,
    fetchNotExportedStats,
  } = useGIN();

  useEffect(() => {
    fetchNotExportedStats();
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const handleMonthChange = (e) => {
    setSelectedMonth(Number(e.target.value));
  };

  const loading = loadingWarehouse || loadingPO || loadingGRN || loadingGIN;

  // ================= STATE =================
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [showNearExpiryModal, setShowNearExpiryModal] = useState(false);

  // ================= SUMMARY VALUES =================
  const pendingGINCount = useMemo(
    () => ginList.filter((g) => g.status === 1).length,
    [ginList]
  );

  const pendingPOCount = useMemo(
    () =>
      poList.filter(
        (p) =>
          ![1, 6, 7].includes(p.status) && !fullyReceivedPOs.includes(p.poid)
      ).length,
    [poList, fullyReceivedPOs]
  );

  const pendingGRNQty = useMemo(
    () => grnList.reduce((sum, grn) => sum + (grn.totalQuantity || 0), 0),
    [grnList]
  );
  const pendingGINQty = useMemo(() => {
    return notExportedStats?.totalQuantity || 0;
  }, [notExportedStats]);

  useEffect(() => {
    const fetchAllDiscrepancyProducts = async () => {
      try {
        //  Lấy tất cả phiên kiểm kê
        const allSessionsRes = await warehouseAPI.getAllSession();
        const allSessions = allSessionsRes.data?.data || [];

        if (!Array.isArray(allSessions)) {
          console.error("allSessions is not an array:", allSessions);
          return;
        }

        // CHỈ LẤY SESSION ĐÃ HOÀN THÀNH
        const completedSessions = allSessions.filter(
          (session) => session.endDate !== null
        );

        const allProducts = [];

        // Duyệt từng session đã hoàn thành để lấy danh sách chênh lệch
        for (const session of completedSessions) {
          const compRes = await warehouseAPI.getHistoriesBySessionId(
            session.inventorySessionID
          );

          const products = compRes.data?.data || [];

          const filtered = products
            .map((p) => ({
              ...p,
              discrepancy: p.diff ?? 0,
            }))
            .filter((p) => p.discrepancy !== 0);

          allProducts.push(...filtered);
        }

        setDiscrepancyProducts(allProducts);
      } catch (err) {
        console.error("Failed to fetch discrepancy products:", err);
      }
    };

    fetchAllDiscrepancyProducts();
  }, []);

  const filteredDiscrepancyProducts = useMemo(() => {
    return discrepancyProducts.filter((p) => {
      const updatedMonth = new Date(p.lastUpdated).getMonth() + 1;
      return updatedMonth === selectedMonth;
    });
  }, [discrepancyProducts, selectedMonth]);

  useEffect(() => {
    const loadProductKPIs = async () => {
      try {
        const nearest = await fetchProductsWithNearestLot();
        const filteredNearest = nearest.filter(
          (lot) => (lot.lotQuantity || 0) > 0
        );
        setNearestLots(filteredNearest);
      } catch (err) {
        console.error("Failed to fetch product KPIs:", err);
      }
    };
    loadProductKPIs();
  }, []);

  // ================= DISCREPANCY PRODUCTS =================
  const productsWithDiscrepancy = useMemo(
    () =>
      products
        .filter((p) => p.stock !== p.realStock)
        .map((p) => ({
          ...p,
          discrepancy: Math.abs((p.stock || 0) - (p.realStock || 0)),
        })),
    [products]
  );

  // ================= HELPERS =================
  const getStockAlert = (current, min) => {
    if (current <= min)
      return (
        <Badge bg="danger" className="text-uppercase">
          Cảnh báo
        </Badge>
      );
    if (current <= min * 1.5)
      return (
        <Badge bg="warning" text="dark" className="text-uppercase">
          Sắp hết
        </Badge>
      );
    return (
      <Badge bg="success" className="text-uppercase">
        Đủ
      </Badge>
    );
  };

  // ================= RENDER =================
  if (loading) {
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "80vh" }}
      >
        <Spinner
          animation="border"
          variant="primary"
          style={{ width: "3rem", height: "3rem" }}
        />
      </Container>
    );
  }

  return (
    <Container>
      <Card
        className="border-0 shadow-sm rounded-4 mb-5"
        style={{ marginTop: "20px" }}
      >
        <Card.Header className="bg-white border-0 pt-4 px-4 pb-3">
          <h2 className="fw-bold text-dark mb-1">Thống kê kho</h2>
          <h4 className="text-muted mb-0">
            Tổng quan hoạt động nhập và xuất kho
          </h4>
        </Card.Header>
        <Card.Body className="p-4 pt-0">
          <Row className="g-4">
            <Col md={6} lg={3}>
              <StatCard
                title="Phiếu xuất chờ xử lý"
                value={pendingGINCount}
                icon={<Inventory />}
                color="warning"
                onClick={() => setShowPendingGINModal(true)}
              />
            </Col>
            <Col md={6} lg={3}>
              <StatCard
                title="Đơn hàng chờ nhập kho"
                value={pendingPOCount}
                icon={<ShoppingCart />}
                color="info"
                onClick={() => setShowPendingPOModal(true)}
              />
            </Col>
            <Col md={6} lg={3}>
              <StatCard
                title="Sản phẩm chờ nhập"
                value={pendingProductQty}
                icon={<LocalShipping />}
                color="primary"
                onClick={() => setShowPendingReceivingModal(true)}
              />
            </Col>

            <Col md={6} lg={3}>
              <StatCard
                title="Sản phẩm chờ xuất"
                value={pendingGINQty}
                icon={<Storage />}
                color="secondary"
                onClick={() => setShowPendingExportProductModal(true)}
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="g-4 mb-5 align-items-stretch">
        <Col lg={8}>
          <Card className="border-0 shadow-sm rounded-4 flex-fill overflow-hidden">
            <Card.Header className="bg-white border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-3 text-danger d-flex align-items-center">
                <Warning className="me-2" /> Sản phẩm chênh lệch tồn kho
              </h5>
              <select
                className="form-select w-auto"
                value={selectedMonth}
                onChange={handleMonthChange}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    Tháng {m}
                  </option>
                ))}
              </select>
            </Card.Header>

            <Card.Body
              className="p-0"
              style={{ ...scrollableBodyStyle, minHeight: "400px" }}
            >
              <Table hover className="table-borderless align-middle mb-0">
                <thead className="bg-light text-muted sticky-top">
                  <tr>
                    <th className="ps-4 py-2" style={{ width: "25%" }}>
                      Sản phẩm
                    </th>
                    <th className="text-end py-2" style={{ width: "10%" }}>
                      Tồn kho
                    </th>
                    <th className="text-end py-2" style={{ width: "10%" }}>
                      Thực tế
                    </th>
                    <th className="text-end py-2" style={{ width: "15%" }}>
                      Chênh lệch
                    </th>
                    <th className="py-2 text-center" style={{ width: "15%" }}>
                      Trạng thái
                    </th>
                    <th
                      className="py-2 text-center"
                      style={{ width: "25%", paddingRight: "2rem" }}
                    >
                      Ghi chú
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredDiscrepancyProducts.length > 0 ? (
                    filteredDiscrepancyProducts.map((p, index) => {
                      const diff = p.diff ?? p.discrepancy ?? 0;
                      const status =
                        diff < 0 ? "Thiếu" : diff > 0 ? "Thừa" : "Đúng";
                      const statusColor =
                        diff < 0
                          ? "danger"
                          : diff > 0
                          ? "success"
                          : "secondary";

                      return (
                        <tr key={`${p.productID}-${p.lotID}-${index}`}>
                          <td className="ps-4">
                            <div className="fw-semibold">{p.productName}</div>
                            <small className="text-muted">
                              Mã lô: {p.lotID}
                            </small>
                          </td>
                          <td className="text-end">{p.systemQuantity}</td>
                          <td className="text-end">{p.actualQuantity}</td>
                          <td
                            className={`text-end fw-semibold ${
                              diff < 0
                                ? "text-danger"
                                : diff > 0
                                ? "text-success"
                                : "text-muted"
                            }`}
                          >
                            {diff}
                          </td>
                          {/* Cột trạng thái */}
                          <td className="text-center">
                            <Badge bg={statusColor}>{status}</Badge>
                          </td>
                          {/* Cột note */}
                          <td style={{ paddingRight: "2rem" }}>
                            <small className="text-muted text-end">
                              {p.note || "Không có ghi chú"}
                            </small>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-3 text-muted">
                        Không có sản phẩm chênh lệch
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Header className="bg-white border-0 pt-4 px-4 pb-0">
              <h5 className="fw-bold mb-3 text-warning d-flex align-items-center">
                <DateRange className="me-2" />5 Lô hàng hạn gần nhất
              </h5>
            </Card.Header>
            <Card.Body
              className="p-0"
              style={{ ...scrollableBodyStyle, minHeight: "400px" }}
            >
              <div className="table-responsive">
                <Table hover className="table-borderless align-middle mb-0">
                  <thead className="bg-light text-muted sticky-top">
                    <tr>
                      <th className="ps-4 py-2">Sản phẩm</th>
                      <th className="text-center py-2">Số lượng</th>
                      <th className="pe-4 text-end py-2">Hết hạn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nearestLots.length > 0 ? (
                      nearestLots.map((lot, index) => (
                        <tr
                          key={lot._lotID || `${lot.productName}-${index}`}
                          style={{ borderBottom: "1px solid #f0f0f0" }}
                        >
                          <td className="ps-4">
                            <div className="fw-semibold">{lot.productName}</div>
                            <small className="text-muted">
                              Mã lô: {lot._lotID}
                            </small>
                          </td>
                          <td className="text-end fw-semibold">
                            {lot.lotQuantity}
                          </td>
                          <td className="pe-4 text-end text-danger fw-semibold">
                            {new Date(lot.expiredDate).toLocaleDateString(
                              "vi-VN"
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center py-3 text-muted">
                          Không có cảnh báo
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <WarehouseDashboardModals
        showPendingGINModal={showPendingGINModal}
        setShowPendingGINModal={setShowPendingGINModal}
        showPendingPOModal={showPendingPOModal}
        setShowPendingPOModal={setShowPendingPOModal}
        showPendingExportProductModal={showPendingExportProductModal}
        setShowPendingExportProductModal={setShowPendingExportProductModal}
        notExportedStats={notExportedStats}
        showPendingReceivingModal={showPendingReceivingModal}
        setShowPendingReceivingModal={setShowPendingReceivingModal}
        pendingProducts={pendingProducts}
        ginList={ginList.filter((g) => g.status === 1)}
        poList={poList.filter(
          (p) =>
            ![1, 6, 7].includes(p.status) && !fullyReceivedPOs.includes(p.poid)
        )}
      />
      <Row className="g-4 mb-5">
        <Col lg={12}>
          <WarehouseCharts />
        </Col>
      </Row>
    </Container>
  );
}
