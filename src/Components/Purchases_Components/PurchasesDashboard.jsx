// src/Components/Purchases_Components/PurchasesDashboard.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Badge,
  Form,
  InputGroup,
  Modal,
  Spinner,
} from "react-bootstrap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ShoppingBag,
  Inventory,
  LocalShipping,
  AttachMoney,
  Warning,
  Add,
  Search,
  FilterList,
  DateRange,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import usePO from "../../Hooks/usePO";
import useProduct from "../../Hooks/useProduct";
import useSupplier from "../../Hooks/useSupplier";

// ================= STATUS MAP =================
export const statusMap = {
  0: { label: "Chấp thuận", color: "success" },
  1: { label: "Từ chối", color: "danger" },
  3: { label: "Đã đặt cọc", color: "info" },
  4: { label: "Thanh toán 1 phần", color: "primary" },
  5: { label: "Hoàn thành", color: "secondary" },
  6: { label: "Chờ xử lý", color: "warning" },
  7: { label: "Nháp", color: "dark" },
};

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

function PurchasesDashboard() {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [nearestLots, setNearestLots] = useState([]);
  const [yearlyChartData, setYearlyChartData] = useState([]);
  const [purchasesData, setPurchasesData] = useState({
    monthlySpending: 0,
    pendingOrders: 0,
    suppliers: 0,
    lowStockProducts: [],
    recentOrders: [],
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showMonthlyOrdersModal, setShowMonthlyOrdersModal] = useState(false);
  const [showPendingOrdersModal, setShowPendingOrdersModal] = useState(false);
  const [statusChartData, setStatusChartData] = useState([]);

  const { poList, loading, secretLoading, fetchPOByYear } = usePO();
  const { fetchProductsBelowMinQuantity, fetchProductsWithNearestLot } =
    useProduct();
  const {
    suppliers,
    loading: suppliersLoading,
    fetchSuppliers,
  } = useSupplier();

  useEffect(() => {
    if (!poList || !poList.length) return;

    // Lọc bỏ status = 7 (Nháp)
    const filteredPOs = poList.filter((po) => po.status !== 7);

    const statusCounts = filteredPOs.reduce((acc, po) => {
      const label = statusMap[po.status]?.label || "Khác";
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    const chartData = Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
      color:
        Object.values(statusMap).find((s) => s.label === name)?.color ||
        "#8884d8",
    }));

    setStatusChartData(chartData);
  }, [poList]);

  // ================== DATA FETCHING ==================
  useEffect(() => {
    const loadProductKPIs = async () => {
      try {
        const lowStock = await fetchProductsBelowMinQuantity();
        const nearest = await fetchProductsWithNearestLot();
        setLowStockProducts(lowStock);
        setNearestLots(nearest);
      } catch (err) {
        console.error("Failed to fetch product KPIs:", err);
      }
    };
    loadProductKPIs();
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const loadYearChart = async () => {
    const data = await fetchPOByYear(selectedYear);
    if (!data || !Array.isArray(data)) return;

    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const monthItem = data.find((m) => {
        const rawMonth = m.month;
        const parsed =
          typeof rawMonth === "string"
            ? parseInt(rawMonth.replace(/[^0-9]/g, ""))
            : Number(rawMonth);

        return parsed === i + 1;
      });

      const total = monthItem
        ? monthItem.orders?.reduce((sum, o) => sum + Number(o.total || 0), 0)
        : 0;

      return { month: `T${i + 1}`, total };
    });

    console.log("monthlyData:", monthlyData);

    setYearlyChartData(monthlyData);
  };

  useEffect(() => {
    loadYearChart();
  }, [selectedYear]);

  useEffect(() => {
    if (!poList || !poList.length) return;

    // Chỉ tính các đơn đã được duyệt (status = 0, 3, 4, 5)
    const approvedStatuses = [0, 3, 4, 5];

    const monthlySpending = poList
      .filter((po) => approvedStatuses.includes(po.status))
      .reduce((sum, po) => sum + (po.total || 0), 0);

    const pendingOrders = poList.filter((po) => po.status === 6).length;
    const suppliersCount = new Set(poList.map((po) => po.supplierName)).size;

    const lowStockList = [];
    poList.forEach((po) => {
      po.details?.forEach((item) => {
        if (item.quantityCurrent <= item.minQuantity) {
          lowStockList.push({
            id: item.productId,
            name: item.productName,
            min: item.minQuantity,
            totalCurrentQuantity: item.quantityCurrent,
          });
        }
      });
    });

    // Deduplicate low stock just in case
    const uniqueLowStock = [
      ...new Map(lowStockList.map((item) => [item.name, item])).values(),
    ];

    const recentOrders = poList
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    setPurchasesData({
      monthlySpending,
      pendingOrders,
      suppliers: suppliersCount,
      lowStockProducts: uniqueLowStock,
      recentOrders,
    });
  }, [poList]);

  // ================== FILTERING ==================
  const filteredOrders = purchasesData.recentOrders.filter((order) => {
    const supplier = order.supplier ?? "";
    const products = order.products ?? ""; // Assuming order.products is a string summary? Check data structure
    const poid = `PO-${order.poid}`;

    const matchesSearch =
      supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      poid.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      statusMap[order.status]?.label.toLowerCase() ===
        filterStatus.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  const pendingOrdersList = poList?.filter((po) => po.status === 6) || [];

  // ================== HELPERS ==================
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  const getStatusBadge = (status) => {
    const statusInfo = statusMap[status];
    if (!statusInfo)
      return (
        <Badge bg="secondary" pill>
          {status}
        </Badge>
      );
    return (
      <Badge bg={statusInfo.color} pill className="px-3 py-2 fw-normal">
        {statusInfo.label}
      </Badge>
    );
  };

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

  // ================== RENDER ==================
  if (loading || secretLoading) {
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
    <div className="">
      <Container>
        {/* ===== Header ===== */}
        <div className="d-flex justify-content-between align-items-center mb-5">
          <div>
            <h2 className="fw-bold text-dark mb-1">
              <ShoppingBag
                className="me-2 text-primary"
                style={{ fontSize: "32px" }}
              />
              Thống kê Mua hàng
            </h2>
            <h4 className="text-muted mb-0">
              Tổng quan hoạt động mua hàng và nhà cung cấp
            </h4>
          </div>
        </div>

        {/* ===== KPI Cards ===== */}
        <Row className="g-4 mb-5">
          <Col md={6} lg={3}>
            <StatCard
              title="Chi phí tháng này"
              value={formatCurrency(purchasesData.monthlySpending)}
              icon={<AttachMoney />}
              color="primary"
              onClick={() => setShowMonthlyOrdersModal(true)}
              subText="Tổng chi trong tháng"
            />
          </Col>
          <Col md={6} lg={3}>
            <StatCard
              title="Đơn hàng chờ xử lý"
              value={purchasesData.pendingOrders}
              icon={<Inventory />}
              color="warning"
              onClick={() => setShowPendingOrdersModal(true)}
              subText="Cần phê duyệt"
            />
          </Col>
          <Col md={6} lg={3}>
            <StatCard
              title="Nhà cung cấp"
              value={suppliers.filter((s) => s.status === 1).length}
              icon={<LocalShipping />}
              color="info"
              onClick={() => setShowSupplierModal(true)}
              subText="Đang hoạt động"
            />
          </Col>
          <Col md={6} lg={3}>
            <StatCard
              title="Sản phẩm sắp hết"
              value={
                lowStockProducts.length > 0
                  ? lowStockProducts.length
                  : purchasesData.lowStockProducts.length
              }
              icon={<Warning />}
              color="danger"
              subText="Cần nhập thêm"
            />
          </Col>
        </Row>

        <Row className="g-4 mb-5">
          {/* Left Column (lg=8): Biểu đồ */}
          <Col lg={8}>
            {/* Yearly Chart (Biểu đồ Chi phí) */}
            <Card className="border-0 shadow-sm rounded-4 mb-4">
              <Card.Header className="bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0">Biểu đồ chi phí</h5>
                <div style={{ width: "150px" }}>
                  <Form.Select
                    size="sm"
                    className="border-0 bg-light fw-bold text-secondary"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <option key={year} value={year}>
                          Năm {year}
                        </option>
                      );
                    })}
                  </Form.Select>
                </div>
              </Card.Header>
              <Card.Body className="px-4 pb-4" style={{ height: "350px" }}>
                {yearlyChartData.length === 0 ||
                yearlyChartData.every((m) => m.total === 0) ? (
                  <div className="h-100 d-flex flex-column justify-content-center align-items-center text-muted">
                    <Inventory
                      style={{ fontSize: 48, opacity: 0.2 }}
                      className="mb-2"
                    />
                    <span>Không có dữ liệu năm {selectedYear}</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={yearlyChartData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e0e0e0"
                      />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#6c757d" }}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) =>
                          new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                            minimumFractionDigits: 0,
                          }).format(value)
                        }
                      />
                      <Tooltip
                        cursor={{ fill: "transparent" }}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                        formatter={(value) => [
                          formatCurrency(value),
                          "Chi phí",
                        ]}
                      />
                      <Bar
                        dataKey="total"
                        fill="#0d6efd"
                        radius={[4, 4, 0, 0]}
                        barSize={30}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card.Body>
            </Card>

            {/* Pie Chart (Đơn hàng theo trạng thái)*/}
            <Card className="border-0 shadow-sm rounded-4">
              <Card.Header className="bg-white border-0 pt-4 px-4">
                <h5 className="fw-bold mb-0">Đơn hàng theo trạng thái</h5>
              </Card.Header>
              <Card.Body style={{ height: 350 }}>
                {statusChartData.length === 0 ? (
                  <div className="h-100 d-flex justify-content-center align-items-center text-muted">
                    <Inventory style={{ fontSize: 48, opacity: 0.2 }} />
                    <span>Không có dữ liệu</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        labelLine={false}
                        label={({ name, percent, value }) =>
                          `${name} (${value}): ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`var(--bs-${entry.color}, #8884d8)`}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Right Column (lg=4): Cảnh báo */}
          <Col lg={4}>
            {/* Low Stock Alert (Tồn kho thấp) */}
            <Card className="border-0 shadow-sm rounded-4 mb-4">
              <Card.Header className="bg-white border-0 pt-4 px-4 pb-0">
                <h5 className="fw-bold mb-3 text-danger d-flex align-items-center">
                  <Warning className="me-2" /> Tồn kho thấp
                </h5>
              </Card.Header>
              <Card.Body
                className="p-0"
                style={{ maxHeight: "400px", overflowY: "auto" }}
              >
                <div className="table-responsive">
                  <Table hover className="table-borderless align-middle mb-0">
                    <thead className="bg-light text-muted sticky-top">
                      <tr>
                        <th className="ps-4 py-2">Sản phẩm</th>
                        <th className="text-center py-2">Số lượng</th>
                        <th className="pe-4 text-end py-2">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockProducts.map((p, index) => (
                        <tr
                          key={p._id || p.productName || index}
                          style={{ borderBottom: "1px solid #f0f0f0" }}
                        >
                          <td className="ps-4">
                            <div
                              className="fw-semibold text-truncate"
                              style={{ maxWidth: "120px" }}
                              title={p.productName || p.name}
                            >
                              {p.productName || p.name}
                            </div>
                            <small className="text-muted">
                              {p.supplierName || p.supplier || "-"}
                            </small>
                          </td>
                          <td className="text-center">
                            <span className="fw-bold text-dark">
                              {p.totalCurrentQuantity || p.current}
                            </span>
                            <span className="text-muted small mx-1">/</span>
                            <span className="text-muted small">
                              {p.minQuantity || p.min}
                            </span>
                          </td>
                          <td className="pe-4 text-end">
                            {getStockAlert(
                              p.totalCurrentQuantity || p.current,
                              p.minQuantity || p.min
                            )}
                          </td>
                        </tr>
                      ))}
                      {lowStockProducts.length === 0 && (
                        <tr>
                          <td
                            colSpan={3}
                            className="text-center py-3 text-muted"
                          >
                            Tồn kho ổn định
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>

            {/* Near Expiry (Lô hàng gần hết hạn) */}
            <Card className="border-0 shadow-sm rounded-4">
              <Card.Header className="bg-white border-0 pt-4 px-4 pb-0">
                <h5 className="fw-bold mb-3 text-warning d-flex align-items-center">
                  <DateRange className="me-2" /> Lô hàng gần hết hạn
                </h5>
              </Card.Header>
              <Card.Body
                className="p-0"
                style={{ maxHeight: "400px", overflowY: "auto" }}
              >
                <div className="table-responsive">
                  <Table hover className="table-borderless align-middle mb-0">
                    <thead className="bg-light text-muted sticky-top">
                      <tr>
                        <th className="ps-4 py-2">Sản phẩm</th>
                        <th className="pe-4 text-end py-2">Hết hạn</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nearestLots.map((lot, index) => (
                        <tr
                          key={lot._lotID || `${lot.productName}-${index}`}
                          style={{ borderBottom: "1px solid #f0f0f0" }}
                        >
                          <td className="ps-4">
                            <div className="fw-semibold">{lot.productName}</div>
                            <small className="text-muted">
                              Mã lô: {lot._lotID} • Số lượng: {lot.lotQuantity}
                            </small>
                          </td>
                          <td className="pe-4 text-end text-danger fw-semibold">
                            {new Date(lot.expiredDate).toLocaleDateString(
                              "vi-VN"
                            )}
                          </td>
                        </tr>
                      ))}
                      {nearestLots.length === 0 && (
                        <tr>
                          <td
                            colSpan={2}
                            className="text-center py-3 text-muted"
                          >
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

        {/* ========================================================== */}
        {/* ===== Bottom Area: Recent Orders (Full Width - 12/12) ===== */}
        {/* ========================================================== */}
        <Row className="g-4 mb-5">
          <Col lg={12}>
            {/* Recent Orders (Đơn hàng gần đây)*/}
            <Card className="border-0 shadow-sm rounded-4">
              <Card.Header className="bg-white border-0 pt-4 px-4 d-flex flex-wrap justify-content-between align-items-center gap-2">
                <h5 className="fw-bold mb-0">Đơn hàng gần đây</h5>
                <div className="d-flex gap-2">
                  <InputGroup size="sm" style={{ width: "250px" }}>
                    <InputGroup.Text className="bg-light border-0">
                      <Search fontSize="small" />
                    </InputGroup.Text>
                    <Form.Control
                      className="bg-light border-0"
                      placeholder="Tìm kiếm..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                  <Form.Select
                    size="sm"
                    className="bg-light border-0"
                    style={{ width: "150px" }}
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">Tất cả</option>
                    {Object.entries(statusMap).map(([key, val]) => (
                      <option key={key} value={val.label.toLowerCase()}>
                        {val.label}
                      </option>
                    ))}
                  </Form.Select>
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table hover className="table-borderless align-middle mb-0">
                    <thead className="bg-light text-muted">
                      <tr>
                        <th className="ps-4 py-3 fw-semibold">Mã Đơn</th>
                        <th className="fw-semibold">Nhà cung cấp</th>
                        <th className="fw-semibold">Ngày tạo</th>
                        <th className="fw-semibold">Tổng tiền</th>
                        <th className="pe-4 fw-semibold text-end">
                          Trạng thái
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.length > 0 ? (
                        filteredOrders.map((order, index) => (
                          <tr
                            key={order.poid || index}
                            style={{ borderBottom: "1px solid #f0f0f0" }}
                          >
                            <td className="ps-4 fw-bold text-primary">{`PO-${order.poid}`}</td>
                            <td>{order.supplierName}</td>
                            <td className="text-muted small">
                              {order.orderDate
                                ? new Date(order.orderDate).toLocaleDateString(
                                    "vi-VN"
                                  )
                                : "-"}
                            </td>
                            <td className="fw-bold">
                              {formatCurrency(order.total)}
                            </td>
                            <td className="pe-4 text-end">
                              {getStatusBadge(order.status)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={5}
                            className="text-center py-4 text-muted"
                          >
                            Không tìm thấy đơn hàng
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
      </Container>

      {/* ================= MODALS ================= */}
      {/* 1. Pending Orders Modal */}
      <Modal
        show={showPendingOrdersModal}
        onHide={() => setShowPendingOrdersModal(false)}
        size="lg"
        centered
        contentClassName="border-0 rounded-4 shadow-lg"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Đơn hàng chờ xử lý</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Table
            striped
            hover
            responsive
            className="table-borderless align-middle"
          >
            <thead className="bg-light text-muted">
              <tr>
                <th>Mã Đơn</th>
                <th>Nhà cung cấp</th>
                <th>Tổng tiền</th>
                <th className="text-end">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {/* Cần lọc để chỉ hiển thị đơn chờ xử lý (status === 6) */}
              {pendingOrdersList.length > 0 ? (
                pendingOrdersList.map((order, index) => (
                  <tr key={order.poid || index}>
                    <td className="fw-bold text-primary">{`PO-${order.poid}`}</td>
                    <td>{order.supplierName}</td>
                    <td className="fw-bold">{formatCurrency(order.total)}</td>
                    <td className="text-end">{getStatusBadge(order.status)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-3 text-muted">
                    Không có đơn hàng chờ xử lý.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button
            variant="light"
            onClick={() => setShowPendingOrdersModal(false)}
          >
            Đóng
          </Button>
          <Button variant="primary" onClick={() => navigate("/po")}>
            Quản lý đơn hàng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 2. Monthly Orders Modal */}
      <Modal
        show={showMonthlyOrdersModal}
        onHide={() => setShowMonthlyOrdersModal(false)}
        size="lg"
        centered
        contentClassName="border-0 rounded-4 shadow-lg"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            Chi tiết chi tiêu tháng này
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Table
            striped
            hover
            responsive
            className="table-borderless align-middle"
          >
            <thead className="bg-light text-muted">
              <tr>
                <th>Mã Đơn</th>
                <th>Nhà cung cấp</th>
                <th>Tổng tiền</th>
                <th className="text-end">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {poList.length > 0 ? (
                poList
                  .filter((order) => [0, 3, 4, 5].includes(order.status))
                  .map((order) => (
                    <tr key={order.poid}>
                      <td className="fw-bold text-primary">{`PO-${order.poid}`}</td>
                      <td>{order.supplierName}</td>
                      <td className="fw-bold">{formatCurrency(order.total)}</td>
                      <td className="text-end">
                        {getStatusBadge(order.status)}
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-3 text-muted">
                    Không có đơn hàng trong tháng này.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button
            variant="light"
            onClick={() => setShowMonthlyOrdersModal(false)}
          >
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 3. Supplier Modal */}
      {/* ... (Giữ nguyên code Modal 3) */}
      <Modal
        show={showSupplierModal}
        onHide={() => setShowSupplierModal(false)}
        size="xl"
        centered
        contentClassName="border-0 rounded-4 shadow-lg"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Danh sách nhà cung cấp</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {suppliersLoading ? (
            <div className="text-center p-4">
              <Spinner animation="border" />
            </div>
          ) : (
            <Table hover responsive className="table-borderless align-middle">
              <thead className="bg-light text-muted">
                <tr>
                  <th>Tên nhà cung cấp</th>
                  <th>Liên hệ</th>
                  <th>Địa chỉ</th>
                  <th className="text-end">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {suppliers
                  .filter((s) => s.status === 1)
                  .map((s, index) => (
                    <tr key={s._id || index}>
                      <td>
                        <div className="fw-bold">{s.name}</div>
                      </td>
                      <td>
                        <div>{s.email}</div>
                        <small className="text-muted">{s.phoneNumber}</small>
                      </td>
                      <td>{s.address}</td>
                      <td className="text-end">
                        <Badge bg="success" pill>
                          Hoạt động
                        </Badge>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowSupplierModal(false)}>
            Đóng
          </Button>
          <Button
            variant="info"
            className="text-white"
            onClick={() => navigate("/supplier")}
          >
            Quản lý nhà cung cấp
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default PurchasesDashboard;
