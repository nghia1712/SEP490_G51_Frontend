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
  ShoppingBag,
  Inventory,
  LocalShipping,
  AttachMoney,
  Warning,
  Search,
  DateRange,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import usePO from "../../Hooks/usePO";
import useProduct from "../../Hooks/useProduct";
import useSupplier from "../../Hooks/useSupplier";
import { DashboardCharts } from "./Dashboard/DashboardCharts.jsx";
import { DashboardModals } from "./Dashboard/DashboardModals.jsx";

// ================= STATUS MAP =================
export const statusMap = {
  0: { label: "Chấp thuận", color: "primary" },
  3: { label: "Đã đặt cọc", color: "info" },
  4: { label: "Còn nợ", color: "danger" },
  5: { label: "Hoàn thành", color: "success" },
  6: { label: "Chờ xử lý", color: "warning" },
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

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [filteredOrdersByStatus, setFilteredOrdersByStatus] = useState([]);

  const scrollableBodyStyle = { maxHeight: "400px", overflowY: "auto" };
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [lowStockTop5, setLowStockTop5] = useState([]);
  const [nearestLots, setNearestLots] = useState([]);
  const [yearlyChartData, setYearlyChartData] = useState([]);
  const [purchasesData, setPurchasesData] = useState({
    monthlySpending: 0,
    pendingOrders: 0,
    suppliers: 0,
    lowStockProducts: [],
    recentOrders: [],
  });
  const [showMonthlyChartModal, setShowMonthlyChartModal] = useState(false);
  const [monthlyOrders, setMonthlyOrders] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);

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
    fetchSupplierById,
  } = useSupplier();
  const supplierCache = {};

  const getSupplierName = async (id) => {
    if (!id) return "Unknown";
    if (supplierCache[id]) return supplierCache[id];
    try {
      const data = await fetchSupplierById(id);
      const name = data?.name || "Unknown";
      supplierCache[id] = name;
      return name;
    } catch (err) {
      console.error("Failed to fetch supplier", err);
      return "Unknown";
    }
  };

  useEffect(() => {
    if (!poList || !poList.length) return;

    const filteredPOs = poList.filter((po) => po.status !== 7);
    const statusGroups = filteredPOs.reduce((acc, po) => {
      const label = statusMap[po.status]?.label || "Khác";

      if (!acc[label]) {
        acc[label] = {
          name: label,
          value: 0,
          orders: [],
          color:
            Object.values(statusMap).find((s) => s.label === label)?.color ||
            "secondary",
        };
      }

      acc[label].value += 1;
      acc[label].orders.push(po);

      return acc;
    }, {});

    setStatusChartData(Object.values(statusGroups));
  }, [poList]);

  // ================== DATA FETCHING ==================
  useEffect(() => {
    const loadProductKPIs = async () => {
      try {
        const lowStockRes = await fetchProductsBelowMinQuantity();
        setLowStockProducts(lowStockRes);

        const lowStockTop5 = lowStockRes
          .sort(
            (a, b) =>
              a.totalCurrentQuantity - b.totalCurrentQuantity ||
              a.percentQuantity - b.percentQuantity
          )
          .slice(0, 5);

        setLowStockTop5(lowStockTop5);
        console.log("Top 5", lowStockTop5);
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

    const monthlyData = await Promise.all(
      Array.from({ length: 12 }, async (_, i) => {
        const monthItem = data.find((m) => m.month === i + 1);

        const ordersWithName = await Promise.all(
          (monthItem?.orders || []).map(async (order) => {
            const name = await getSupplierName(order.supname);
            console.log("Order POID:", order.poid, "Supplier Name:", name);
            return {
              ...order,
              supname: name,
            };
          })
        );

        return {
          month: i + 1,
          total: ordersWithName.reduce(
            (sum, o) => sum + Number(o.deposit || 0),
            0
          ),
          debt: ordersWithName.reduce(
            (sum, o) => sum + Number((o.total || 0) - (o.deposit || 0)),
            0
          ),
          orders: ordersWithName,
        };
      })
    );

    setYearlyChartData(monthlyData);

    // Hoặc log toàn bộ monthlyData
    console.log("Monthly data with supplier names:", monthlyData);
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

    const uniqueLowStock = [
      ...new Map(lowStockList.map((item) => [item.name, item])).values(),
    ];

    const recentOrders = poList
      .filter((po) => po.status !== 7)
      .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
      .slice(0, 10);

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
    const supplier = order.supplierName ?? "";
    const products = order.products ?? "";
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
      <Container fluid style={{ maxWidth: "1500px", padding: "20px" }}>
        {/* ===== Header ===== */}
        <div
          style={{ marginTop: "20px" }}
          className="d-flex justify-content-between align-items-center mb-5"
        >
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
              title="Chi phí dự kiến tháng này"
              value={formatCurrency(purchasesData.monthlySpending)}
              icon={<AttachMoney />}
              color="primary"
              onClick={() => setShowMonthlyOrdersModal(true)}
              subText="Tổng chi dự kiến trong tháng"
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
              title="Sản phẩm tồn kho thấp"
              value={
                lowStockProducts.length > 0
                  ? lowStockProducts.length
                  : purchasesData.lowStockProducts.length
              }
              icon={<Warning />}
              color="danger"
              subText="Cần nhập thêm"
              onClick={() => setShowLowStockModal(true)}
            />
          </Col>
        </Row>

        <Row className="g-4 mb-5">
          <Col lg={12}>
            <DashboardCharts
              yearlyChartData={yearlyChartData}
              statusChartData={statusChartData}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              getStatusBadge={getStatusBadge}
              formatCurrency={formatCurrency}
              setMonthlyOrders={setMonthlyOrders}
              setSelectedMonth={setSelectedMonth}
              setShowMonthlyChartModal={setShowMonthlyChartModal}
              filteredOrdersByStatus={filteredOrdersByStatus}
              setFilteredOrdersByStatus={setFilteredOrdersByStatus}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
              showStatusModal={showStatusModal}
              setShowStatusModal={setShowStatusModal}
            />
          </Col>
        </Row>

        {/* ========================================================== */}
        <Row className="g-4 mb-5 align-items-stretch">
          {/* LEFT COLUMN — 8 COLUMNS */}
          <Col lg={8} className="d-flex">
            <Card className="border-0 shadow-sm rounded-4 flex-fill overflow-hidden">
              <Card.Header className="bg-white border-0 pt-4 px-4 d-flex flex-wrap justify-content-between align-items-center gap-2">
                <h5 className="fw-bold mb-0">Top 10 đơn hàng gần đây</h5>
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
                <div
                  className="table-responsive"
                  style={{ maxHeight: "300px", overflowY: "auto" }}
                >
                  <Table hover className="table-borderless align-middle mb-0">
                    <thead className="bg-light text-muted">
                      <tr>
                        <th className="ps-4 fw-semibold">Mã Đơn</th>
                        <th className="fw-semibold">Nhà cung cấp</th>
                        <th className="fw-semibold">Ngày tạo</th>
                        <th className="fw-semibold text-end">Tổng tiền</th>
                        <th className="fw-semibold text-end">Đã trả</th>
                        <th className="fw-semibold text-end">Còn nợ</th>
                        <th className="pe-4 fw-semibold text-center">
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
                            <td className="fw-bold text-end">
                              {formatCurrency(order.total)}
                            </td>
                            <td className="fw-bold text-end text-success">
                              {formatCurrency(order.deposit || 0)}
                            </td>
                            <td className="fw-bold text-end text-danger">
                              {formatCurrency(
                                (order.total || 0) - (order.deposit || 0)
                              )}
                            </td>
                            <td className="pe-4 text-center">
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

          {/* RIGHT COLUMN — 4 COLUMNS */}
          <Col lg={4} className="d-flex">
            {/* TOP 5 SẢN PHẨM TỒN KHO THẤP */}
            <Card className="border-0 shadow-sm rounded-4 flex-fill overflow-hidden">
              <Card.Header className="bg-white border-0 pt-4 px-4 d-flex flex-wrap justify-content-between align-items-center gap-2">
                <h5 className="fw-bold mb-0">Top 5 sản phẩm tồn kho thấp</h5>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table hover className="table-borderless align-middle mb-0">
                    <thead className="bg-light text-muted">
                      <tr>
                        <th className="ps-4 fw-semibold text-nowrap">
                          Sản phẩm
                        </th>
                        <th className="fw-semibold text-nowrap">Tồn kho</th>
                        <th className="fw-semibold text-nowrap">Tối thiểu</th>
                        <th className="fw-semibold text-nowrap text-end pe-4">
                          Trạng thái
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {lowStockTop5.length > 0 ? (
                        lowStockTop5.map((item, i) => (
                          <tr key={i}>
                            <td className="ps-4">{item.productName}</td>
                            <td>{item.totalCurrentQuantity}</td>
                            <td>{item.minQuantity}</td>
                            <td className="text-end pe-4">
                              {getStockAlert(
                                item.totalCurrentQuantity,
                                item.minQuantity
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="text-center py-3 text-muted"
                          >
                            Không có sản phẩm tồn kho thấp
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
      <DashboardModals
        showPendingOrdersModal={showPendingOrdersModal}
        setShowPendingOrdersModal={setShowPendingOrdersModal}
        showMonthlyOrdersModal={showMonthlyOrdersModal}
        setShowMonthlyOrdersModal={setShowMonthlyOrdersModal}
        showSupplierModal={showSupplierModal}
        setShowSupplierModal={setShowSupplierModal}
        pendingOrdersList={pendingOrdersList}
        poList={poList}
        suppliers={suppliers}
        suppliersLoading={suppliersLoading}
        formatCurrency={formatCurrency}
        getStatusBadge={getStatusBadge}
        showMonthlyChartModal={showMonthlyChartModal}
        setShowMonthlyChartModal={setShowMonthlyChartModal}
        monthlyOrders={monthlyOrders}
        selectedMonth={selectedMonth}
        getStockAlert={getStockAlert}
        showLowStockModal={showLowStockModal}
        setShowLowStockModal={setShowLowStockModal}
        lowStockProducts={lowStockProducts}
      />
    </div>
  );
}
export default PurchasesDashboard;
