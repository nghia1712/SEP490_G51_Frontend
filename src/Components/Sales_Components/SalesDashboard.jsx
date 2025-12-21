import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Form,
  Spinner,
  Modal,
  Button,
  Table,
  InputGroup,
} from "react-bootstrap";
import {
  ShoppingCart,
  TrendingUp,
  Inventory,
  AttachMoney,
  Search,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import salesOrderAPI from "../../API/salesOrderAPI";
const formatChartCurrency = (value) => {
  if (value >= 1_000_000_000) {
    const v = value / 1_000_000_000;
    return `${Number.isInteger(v) ? v : v.toFixed(1)} tỷ`;
  }

  if (value >= 1_000_000) {
    const v = value / 1_000_000;
    return `${Number.isInteger(v) ? v : v.toFixed(1)} tr`;
  }

  if (value >= 1_000) {
    const v = value / 1_000;
    return `${Number.isInteger(v) ? v : v.toFixed(1)}k`;
  }

  return value;
};

// ================= UI HELPER =================
const StatCard = ({ title, value, icon, color, subText, onClick }) => (
  <Card
    className="border-0 shadow-sm h-100"
    onClick={onClick}
    style={{
      cursor: onClick ? "pointer" : "default",
      transition: "transform 0.2s, box-shadow 0.2s",
    }}
    onMouseEnter={(e) => {
      if (onClick) {
        e.currentTarget.style.transform = "translateY(-4px)";
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

const COLORS = [
  "#0d6efd",
  "#198754",
  "#ffc107",
  "#dc3545",
  "#20c997",
  "#6f42c1",
];

const STATUS_ENUM = {
  Draft: 0,
  Send: 1,
  Approved: 2,
  Rejected: 3,
  PartiallyDelivered: 4,
  Delivered: 5,
  Complete: 6,
  NotComplete: 7,
  BackSalesOrder: 8,
};

const STATUS_DEFINITIONS = {
  0: { label: "Nháp", color: "secondary" },
  1: { label: "Chờ xử lý", color: "warning" },
  2: { label: "Chấp thuận", color: "info" },
  3: { label: "Từ chối", color: "danger" },
  4: { label: "Xuất 1 phần", color: "primary" },
  5: { label: "Đã giao hàng", color: "primary" },
  6: { label: "Hoàn thành", color: "success" },
  7: { label: "Không hoàn thành", color: "dark" },
  8: { label: "Chờ hàng", color: "warning" },
};

function SalesDashboard() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [revenueData, setRevenueData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusChartData, setStatusChartData] = useState([]);
  const [ordersForTable, setOrdersForTable] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(amount || 0);

  const loadStatistics = async (year) => {
    try {
      setLoading(true);
      setError(null);

      const [revenueRes, productRes, ordersRes] = await Promise.all([
        salesOrderAPI.getRevenueByYear(year),
        salesOrderAPI.getSalesProductQuantityByYear(year),
        salesOrderAPI.listSalesOrder(),
      ]);

      const rawRevenue = revenueRes?.data?.data ?? revenueRes?.data ?? [];
      const normalizedRevenue = (rawRevenue || []).map((item, idx) => ({
        month: item.monthLabel || item.monthName || (item.month ?? idx + 1),
        total: Number(item.totalRevenue ?? item.total ?? item.amount ?? 0),
        orders: item.orderCount ?? item.ordersCount ?? item.totalOrders ?? 0,
      }));

      // API trả về dữ liệu theo tháng, mỗi tháng có danh sách sản phẩm
      const rawProducts = productRes?.data?.data ?? productRes?.data ?? [];
      
      // Gộp tất cả sản phẩm từ tất cả các tháng lại
      const productMap = {};
      (rawProducts || []).forEach((monthData) => {
        const products = monthData.products || monthData.Products || [];
        products.forEach((product) => {
          const productName = 
            product.product?.productName ?? 
            product.Product?.ProductName ?? 
            product.productName ?? 
            product.ProductName ?? 
            "Không rõ";
          const quantity = 
            product.quantity ?? 
            product.Quantity ?? 
            0;
          
          if (!productMap[productName]) {
            productMap[productName] = {
              name: productName,
              quantity: 0,
              revenue: 0,
            };
          }
          productMap[productName].quantity += Number(quantity) || 0;
        });
      });
      
      // Chuyển đổi map thành array và sắp xếp theo quantity giảm dần
      const normalizedProducts = Object.values(productMap)
        .filter(p => p.quantity > 0) // Chỉ lấy sản phẩm có số lượng > 0
        .sort((a, b) => b.quantity - a.quantity);

      // ===== Aggregated data from sales orders (for charts & tables) =====
      const rawOrders = ordersRes?.data?.data ?? ordersRes?.data ?? [];

      // Lọc đơn theo năm được chọn
      const ordersInYear = (rawOrders || []).filter((order) => {
        const createdRaw =
          order.CreateAt ??
          order.createAt ??
          order.CreatedAt ??
          order.createdAt ??
          null;
        if (!createdRaw) return false;
        const date = new Date(createdRaw);
        if (Number.isNaN(date.getTime())) return false;
        return date.getFullYear() === year;
      });
      const statusMap = {
        0: { label: "Nháp", color: "secondary" },
        1: { label: "Chờ xử lý", color: "warning" }, // Send
        2: { label: "Chấp thuận", color: "info" }, // Approved
        3: { label: "Từ chối", color: "danger" }, // Rejected
        4: { label: "Xuất 1 phần", color: "primary" }, // PartiallyDelivered
        5: { label: "Đã giao hàng", color: "primary" }, // Delivered
        6: { label: "Hoàn thành", color: "success" }, // Complete
        7: { label: "Không hoàn thành", color: "dark" }, // NotComplete
        8: { label: "Chờ hàng", color: "warning" }, // BackSalesOrder
      };

      const aggregated = ordersInYear.reduce((acc, order) => {
        const rawStatus =
          order.SalesOrderStatus ??
          order.salesOrderStatus ??
          order.Status ??
          order.status ??
          null;

        let status = rawStatus;
        if (typeof rawStatus === "string" && rawStatus !== "") {
          status = STATUS_ENUM[rawStatus] ?? rawStatus;
        }
        if (typeof status !== "number") return acc;
        if (status === 0) return acc; // Bỏ nháp

        const def = statusMap[status];
        if (!def) return acc;

        if (!acc[status]) {
          acc[status] = {
            name: def.label,
            value: 0,
            color: def.color,
          };
        }
        acc[status].value += 1;
        return acc;
      }, {});

      // Chuẩn hóa dữ liệu đơn hàng cho bảng chi tiết
      const mappedOrdersForTable = (ordersInYear || []).map((order) => {
        const rawStatus =
          order.SalesOrderStatus ??
          order.salesOrderStatus ??
          order.Status ??
          order.status ??
          null;

        let status = rawStatus;
        if (typeof rawStatus === "string" && rawStatus !== "") {
          const enumMap = {
            Draft: 0,
            Send: 1,
            Approved: 2,
            Rejected: 3,
            Delivered: 4,
            Complete: 5,
            NotComplete: 6,
          };
          status = enumMap[rawStatus] ?? rawStatus;
        }
        if (typeof status === "number") {
          status = Number(status);
        }

        return {
          id: order.SalesOrderId ?? order.salesOrderId ?? order.id,
          code:
            order.SalesOrderCode ??
            order.salesOrderCode ??
            order.OrderCode ??
            order.orderCode ??
            "-",
          customer:
            order.CustomerName ??
            order.customerName ??
            order.CustomerFullName ??
            order.customerFullName ??
            "-",
          createdAt:
            order.CreateAt ??
            order.createAt ??
            order.CreatedAt ??
            order.createdAt ??
            null,
          total:
            order.TotalAmount ??
            order.totalAmount ??
            order.TotalPrice ??
            order.totalPrice ??
            0,
          status,
        };
      });

      // Top 5 khách hàng tiềm năng theo tổng doanh thu đã thanh toán trong năm
      const customerMap = {};
      (ordersInYear || []).forEach((order) => {
        const name =
          order.CustomerName ??
          order.customerName ??
          order.CustomerFullName ??
          order.customerFullName ??
          "-";
        if (!name || name === "-") return;

        // Chỉ tính số tiền đã thanh toán (PaidAmount)
        const paidAmount =
          order.PaidAmount ??
          order.paidAmount ??
          0;

        // Chỉ tính những đơn hàng đã có thanh toán
        if (Number(paidAmount) <= 0) return;

        if (!customerMap[name]) {
          customerMap[name] = {
            name,
            orderCount: 0,
            total: 0,
          };
        }
        customerMap[name].orderCount += 1;
        customerMap[name].total += Number(paidAmount) || 0;
      });

      const topCustomersList = Object.values(customerMap)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      setRevenueData(normalizedRevenue);
      setProductData(normalizedProducts);
      setStatusChartData(Object.values(aggregated));
      setOrdersForTable(mappedOrdersForTable);
      setTopCustomers(topCustomersList);
    } catch (err) {
      console.error("Failed to load sales statistics", err);
      setError(
        err?.response?.data?.message ||
          "Không thể tải thống kê bán hàng. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics(selectedYear);
  }, [selectedYear]);

  const totalYearRevenue = useMemo(
    () => revenueData.reduce((sum, m) => sum + (m.total || 0), 0),
    [revenueData]
  );

  const currentMonthRevenue = useMemo(() => {
    const currentMonth = new Date().getMonth() + 1;
    const found =
      revenueData.find(
        (m, idx) =>
          (m.monthNumber ?? m.monthIndex ?? m.month) === currentMonth ||
          idx + 1 === currentMonth
      ) || null;
    return found?.total || 0;
  }, [revenueData]);

  const totalQuantitySold = useMemo(
    () => productData.reduce((sum, p) => sum + (p.quantity || 0), 0),
    [productData]
  );
  const getStatusLabel = (status) =>
    STATUS_DEFINITIONS[status]?.label ?? "Không xác định";
  const getStatusBadge = (status) => (
    <Badge
      bg={STATUS_DEFINITIONS[status]?.color ?? "secondary"}
      pill
      className="px-3 py-2 fw-normal"
    >
      {getStatusLabel(status)}
    </Badge>
  );

  if (loading && !revenueData.length && !productData.length) {
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "70vh" }}
      >
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <div>
      <Container fluid style={{ maxWidth: "1500px", padding: "20px" }}>
        {/* Header & KPI Cards */}
        <Card className="border-0 shadow-sm rounded-4 mb-5" style={{ marginTop: "20px" }}>
          <Card.Header className="bg-white border-0 pt-4 px-4 pb-3 d-flex justify-content-between align-items-center">
            <div>
              <h2 className="fw-bold text-dark mb-1">
                <ShoppingCart
                  className="me-2 text-primary"
                  style={{ fontSize: "32px" }}
                />
                Thống kê Bán hàng
              </h2>
              <h4 className="text-muted mb-0">
                Tổng quan doanh thu và sản phẩm bán ra
              </h4>
            </div>
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

          {error && (
            <Card.Body className="px-4">
              <div className="text-danger">{error}</div>
            </Card.Body>
          )}

          <Card.Body className="p-4 pt-0">
            {/* KPI Cards */}
            <Row className="g-4">
              <Col md={6} lg={3}>
                <StatCard
                  title="Doanh thu tháng hiện tại"
                  value={formatCurrency(currentMonthRevenue)}
                  icon={<AttachMoney />}
                  color="primary"
                  subText="Tổng doanh thu của tháng"
                />
              </Col>
              <Col md={6} lg={3}>
                <StatCard
                  title="Doanh thu cả năm"
                  value={formatCurrency(totalYearRevenue)}
                  icon={<TrendingUp />}
                  color="success"
                  subText="Tổng doanh thu các tháng"
                />
              </Col>
              <Col md={6} lg={3}>
                <StatCard
                  title="Tổng số lượng đã bán"
                  value={totalQuantitySold.toLocaleString("vi-VN")}
                  icon={<Inventory />}
                  color="warning"
                  subText="Tổng số lượng sản phẩm bán ra"
                  onClick={() => setShowProductsModal(true)}
                />
              </Col>
              <Col md={6} lg={3}>
                <StatCard
                  title="Tổng số lượng đơn hàng"
                  value={ordersForTable.length.toLocaleString("vi-VN")}
                  icon={<ShoppingCart />}
                  color="info"
                  subText={`Đơn hàng trong năm ${selectedYear}`}
                  onClick={() => setShowOrdersModal(true)}
                />
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Charts */}
        <Row className="g-4 mb-5">
          <Col xs={12} lg={7}>
            <Card className="border-0 shadow-sm rounded-4 mb-4">
              <Card.Header className="bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0">Biểu đồ doanh thu theo tháng</h5>
              </Card.Header>

              <Card.Body className="px-4 pb-4" style={{ height: "350px" }}>
                {!revenueData.length || revenueData.every((m) => !m.total) ? (
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
                      data={revenueData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e0e0e0"
                      />
                      <XAxis dataKey="month" tickFormatter={(m) => `T ${m}`} />
                      <YAxis tickFormatter={formatChartCurrency} />
                      <Tooltip
                        cursor={{ fill: "transparent" }}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                        labelFormatter={(label) => `Tháng ${label}`}
                        formatter={(value) => [
                          formatCurrency(value),
                          "Doanh thu",
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
          </Col>

          <Col xs={12} lg={5}>
            <Card className="border-0 shadow-sm rounded-4 mb-4">
              <Card.Header className="bg-white border-0 pt-4 px-4">
                <h5 className="fw-bold mb-0">Đơn hàng theo trạng thái</h5>
              </Card.Header>

              <Card.Body style={{ height: 350 }}>
                {!statusChartData.length ? (
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
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`var(--bs-${entry.color}, ${
                              COLORS[index % COLORS.length]
                            })`}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, _name, props) => [
                          value.toLocaleString("vi-VN"),
                          props?.payload?.name || "Số lượng đơn",
                        ]}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Bảng chi tiết đơn hàng + Top 5 khách hàng tiềm năng */}
        <Row className="g-4 mb-5 align-items-stretch">
          {/* LEFT: Chi tiết đơn hàng */}
          <Col lg={8} className="d-flex">
            <Card className="border-0 shadow-sm rounded-4 flex-fill overflow-hidden">
              <Card.Header className="bg-white border-0 pt-4 px-4 d-flex flex-wrap justify-content-between align-items-center gap-2">
                <h5 className="fw-bold mb-0">Đơn hàng trong năm</h5>
                <div className="d-flex gap-2 align-items-center">
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
                    {Object.entries(STATUS_DEFINITIONS).map(([key, val]) => (
                      <option key={key} value={val.label.toLowerCase()}>
                        {val.label}
                      </option>
                    ))}
                  </Form.Select>
                </div>
              </Card.Header>

              {/* Giới hạn height và thêm scroll */}
              <Card.Body
                className="p-0"
                style={{ maxHeight: "250px", overflowY: "auto" }}
              >
                <div className="table-responsive">
                  <table className="table table-borderless align-middle mb-0">
                    <thead className="bg-light text-muted">
                      <tr>
                        <th className="ps-4">Mã đơn</th>
                        <th>Khách hàng</th>
                        <th>Ngày tạo</th>
                        <th className="text-end">Tổng tiền</th>
                        <th className="text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filteredOrders = ordersForTable.filter((order) => {
                          const code = order.code || "";
                          const customer = order.customer || "";
                          
                          const matchesSearch =
                            code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            customer.toLowerCase().includes(searchTerm.toLowerCase());
                          
                          const statusLabel = getStatusLabel(order.status).toLowerCase();
                          const matchesFilter =
                            filterStatus === "all" ||
                            statusLabel === filterStatus.toLowerCase();
                          
                          return matchesSearch && matchesFilter;
                        });
                        
                        return filteredOrders.length ? (
                          filteredOrders.map((o, idx) => (
                            <tr key={idx}>
                              <td className="ps-4 fw-bold text-primary">
                                {o.code || "-"}
                              </td>
                              <td>{o.customer || "-"}</td>
                              <td className="text-muted">
                                {o.createdAt
                                  ? new Date(o.createdAt).toLocaleDateString(
                                      "vi-VN"
                                    )
                                  : "-"}
                              </td>
                              <td className="text-end fw-bold">
                                {formatCurrency(o.total)}
                              </td>
                              <td className="text-center">
                                {getStatusBadge(o.status)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={5}
                              className="text-center py-4 text-muted"
                            >
                              {searchTerm || filterStatus !== "all"
                                ? "Không tìm thấy đơn hàng phù hợp."
                                : "Không có đơn hàng trong năm."}
                            </td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* RIGHT: Top 5 khách hàng tiềm năng */}
          <Col lg={4} className="d-flex">
            <Card className="border-0 shadow-sm rounded-4 flex-fill overflow-hidden">
              <Card.Header className="bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0">Top 5 khách hàng tiềm năng</h5>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <table className="table table-borderless align-middle mb-0">
                    <thead className="bg-light text-muted">
                      <tr>
                        <th className="ps-4">Khách hàng</th>
                        <th className="text-center">Số đơn</th>
                        <th className="text-end pe-4">Doanh thu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topCustomers.length ? (
                        topCustomers.map((c, idx) => (
                          <tr key={idx}>
                            <td className="ps-4">{c.name}</td>
                            <td className="text-center">{c.orderCount}</td>
                            <td className="text-end pe-4 fw-bold">
                              {formatCurrency(c.total)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={3}
                            className="text-center py-4 text-muted"
                          >
                            Không có dữ liệu khách hàng.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Modal Sản phẩm đã bán */}
        <Modal
          show={showProductsModal}
          onHide={() => setShowProductsModal(false)}
          size="lg"
          centered
          contentClassName="border-0 rounded-4 shadow-lg"
        >
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fw-bold">
              Sản phẩm đã bán năm {selectedYear}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ maxHeight: "60vh", overflowY: "auto" }}>
            {productData.length > 0 ? (
              <>
                <Table striped hover responsive className="table-borderless align-middle">
                  <thead className="bg-light text-muted">
                    <tr>
                      <th>#</th>
                      <th>Sản phẩm</th>
                      <th className="text-end">Số lượng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productData.map((product, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td className="fw-semibold text-primary">
                          {product.name}
                        </td>
                        <td className="text-end">
                          {product.quantity.toLocaleString("vi-VN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <div className="mt-3 pt-3 border-top d-flex justify-content-between align-items-center">
                  <span className="fw-bold text-dark">Tổng số lượng:</span>
                  <span className="fw-bold text-primary fs-5">
                    {productData.reduce((sum, p) => sum + (p.quantity || 0), 0).toLocaleString("vi-VN")}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center text-muted py-3">
                Không có dữ liệu sản phẩm
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button variant="secondary" onClick={() => setShowProductsModal(false)}>
              Đóng
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal Đơn hàng */}
        <Modal
          show={showOrdersModal}
          onHide={() => setShowOrdersModal(false)}
          size="lg"
          centered
          contentClassName="border-0 rounded-4 shadow-lg"
        >
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fw-bold">
              Đơn hàng năm {selectedYear}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ maxHeight: "60vh", overflowY: "auto" }}>
            {ordersForTable.length > 0 ? (
              <Table striped hover responsive className="table-borderless align-middle">
                <thead className="bg-light text-muted">
                  <tr>
                    <th>Mã đơn</th>
                    <th>Khách hàng</th>
                    <th>Ngày tạo</th>
                    <th className="text-end">Tổng tiền</th>
                    <th className="text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersForTable.map((order, index) => (
                    <tr key={index}>
                      <td className="fw-bold text-primary">
                        {order.code || "-"}
                      </td>
                      <td>{order.customer || "-"}</td>
                      <td className="text-muted">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString("vi-VN")
                          : "-"}
                      </td>
                      <td className="text-end fw-bold">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="text-center">
                        {getStatusBadge(order.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <div className="text-center text-muted py-3">
                Không có đơn hàng
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button variant="secondary" onClick={() => setShowOrdersModal(false)}>
              Đóng
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
}

export default SalesDashboard;
