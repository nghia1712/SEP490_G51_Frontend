import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Form,
  Spinner,
} from "react-bootstrap";
import {
  ShoppingCart,
  TrendingUp,
  Inventory,
  AttachMoney,
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
const StatCard = ({ title, value, icon, color, subText }) => (
  <Card
    className="border-0 shadow-sm h-100"
    style={{
      transition: "transform 0.2s, box-shadow 0.2s",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-4px)";
      e.currentTarget.style.boxShadow = "0 .5rem 1rem rgba(0,0,0,.15)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 .125rem .25rem rgba(0,0,0,.075)";
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

function SalesDashboard() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [revenueData, setRevenueData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusChartData, setStatusChartData] = useState([]);
  const [ordersForTable, setOrdersForTable] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);

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
        month: item.monthLabel || item.monthName || `T${item.month ?? idx + 1}`,
        total: Number(item.totalRevenue ?? item.total ?? item.amount ?? 0),
        orders: item.orderCount ?? item.ordersCount ?? item.totalOrders ?? 0,
      }));

      const rawProducts = productRes?.data?.data ?? productRes?.data ?? [];
      const normalizedProducts = (rawProducts || []).map((p) => ({
        name: p.productName ?? p.name ?? "Không rõ",
        quantity:
          p.totalQuantity ?? p.quantity ?? p.soldQuantity ?? p.sold ?? 0,
        revenue: Number(p.totalRevenue ?? p.revenue ?? p.amount ?? 0),
      }));

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
        1: { label: "Chờ xử lý", color: "warning" },
        2: { label: "Chấp thuận", color: "info" },
        3: { label: "Từ chối", color: "danger" },
        4: { label: "Đã giao hàng", color: "primary" },
        5: { label: "Hoàn thành", color: "success" },
        6: { label: "Chưa hoàn thành", color: "secondary" },
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

      // Top 5 khách hàng tiềm năng theo tổng doanh thu trong năm
      const customerMap = {};
      (ordersInYear || []).forEach((order) => {
        const name =
          order.CustomerName ??
          order.customerName ??
          order.CustomerFullName ??
          order.customerFullName ??
          "-";
        if (!name || name === "-") return;

        const totalValue =
          order.TotalAmount ??
          order.totalAmount ??
          order.TotalPrice ??
          order.totalPrice ??
          0;

        if (!customerMap[name]) {
          customerMap[name] = {
            name,
            orderCount: 0,
            total: 0,
          };
        }
        customerMap[name].orderCount += 1;
        customerMap[name].total += Number(totalValue) || 0;
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

  const getOrderStatusLabel = (status) => {
    switch (status) {
      case 0:
        return "Nháp";
      case 1:
        return "Chờ xử lý";
      case 2:
        return "Chấp thuận";
      case 3:
        return "Từ chối";
      case 4:
        return "Đã giao hàng";
      case 5:
        return "Hoàn thành";
      case 6:
        return "Chưa hoàn thành";
      default:
        return "Không xác định";
    }
  };

  const getOrderStatusBadge = (status) => {
    const label = getOrderStatusLabel(status);
    let color = "secondary";

    switch (status) {
      case 0: // Nháp
        color = "secondary";
        break;
      case 1: // Chờ xử lý
        color = "warning";
        break;
      case 2: // Chấp thuận
        color = "info";
        break;
      case 3: // Từ chối
        color = "danger";
        break;
      case 4: // Đã giao hàng
        color = "primary";
        break;
      case 5: // Hoàn thành
        color = "success";
        break;
      case 6: // Chưa hoàn thành
        color = "dark";
        break;
      default:
        color = "secondary";
    }

    return (
      <Badge bg={color} pill className="px-3 py-2 fw-normal">
        {label}
      </Badge>
    );
  };

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
        {/* Header */}
        <div
          style={{ marginTop: "20px" }}
          className="d-flex justify-content-between align-items-center mb-5"
        >
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
        </div>

        {error && (
          <div className="mb-4">
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-danger">{error}</Card.Body>
            </Card>
          </div>
        )}

        {/* KPI Cards */}
        <Row className="g-4 mb-5">
          <Col md={6} lg={4}>
            <StatCard
              title="Doanh thu tháng hiện tại"
              value={formatCurrency(currentMonthRevenue)}
              icon={<AttachMoney />}
              color="primary"
              subText="Tổng doanh thu của tháng"
            />
          </Col>
          <Col md={6} lg={4}>
            <StatCard
              title="Doanh thu cả năm"
              value={formatCurrency(totalYearRevenue)}
              icon={<TrendingUp />}
              color="success"
              subText="Tổng doanh thu các tháng"
            />
          </Col>
          <Col md={6} lg={4}>
            <StatCard
              title="Tổng số lượng đã bán"
              value={totalQuantitySold.toLocaleString("vi-VN")}
              icon={<Inventory />}
              color="warning"
              subText="Tổng số lượng sản phẩm bán ra"
            />
          </Col>
        </Row>

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
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#6c757d" }}
                      />
                      <YAxis tickFormatter={formatChartCurrency} />
                      <Tooltip
                        cursor={{ fill: "transparent" }}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
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
              <Card.Header className="bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0">Đơn hàng trong năm</h5>
                <Badge bg="light" text="dark">
                  Tổng số đơn:{" "}
                  <span className="fw-bold">
                    {ordersForTable.length.toLocaleString("vi-VN")}
                  </span>
                </Badge>
              </Card.Header>
              <Card.Body className="p-0">
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
                      {ordersForTable.length ? (
                        ordersForTable.map((o, idx) => (
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
                              {typeof o.status === "number"
                                ? getOrderStatusBadge(o.status)
                                : "-"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={5}
                            className="text-center py-4 text-muted"
                          >
                            Không có đơn hàng trong năm.
                          </td>
                        </tr>
                      )}
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
      </Container>
    </div>
  );
}

export default SalesDashboard;
