import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Badge,
  Alert,
  Form,
  Modal,
  InputGroup,
} from "react-bootstrap";
import {
  ShoppingCart,
  TrendingUp,
  People,
  Inventory,
  AttachMoney,
  Add,
  Search,
  FilterList,
} from "@mui/icons-material";

function SalesDashboard() {
  const [salesData, setSalesData] = useState({
    todaySales: 0,
    monthlySales: 0,
    totalCustomers: 0,
    topProducts: [],
    recentTransactions: [],
  });

  const [showAddSaleModal, setShowAddSaleModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFaFilterStatus] = useState("all");

  // Mock data - trong thực tế sẽ fetch từ API
  useEffect(() => {
    setSalesData({
      todaySales: 12500000,
      monthlySales: 285000000,
      totalCustomers: 156,
      topProducts: [
        { name: "Paracetamol 500mg", sold: 45, revenue: 2250000 },
        { name: "Amoxicillin 250mg", sold: 32, revenue: 3200000 },
        { name: "Vitamin C 1000mg", sold: 28, revenue: 1400000 },
        { name: "Aspirin 81mg", sold: 25, revenue: 1250000 },
      ],
      recentTransactions: [
        {
          id: 1,
          customer: "Nguyễn Văn A",
          products: "Paracetamol, Vitamin C",
          total: 450000,
          status: "completed",
          date: "2024-01-15 14:30",
        },
        {
          id: 2,
          customer: "Trần Thị B",
          products: "Amoxicillin, Aspirin",
          total: 680000,
          status: "pending",
          date: "2024-01-15 15:45",
        },
        {
          id: 3,
          customer: "Lê Văn C",
          products: "Vitamin C",
          total: 120000,
          status: "completed",
          date: "2024-01-15 16:20",
        },
      ],
    });
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const variants = {
      completed: "success",
      pending: "warning",
      cancelled: "danger",
    };
    return (
      <Badge bg={variants[status] || "secondary"}>
        {status === "completed" ? "Hoàn thành" : status === "pending" ? "Chờ xử lý" : "Đã hủy"}
      </Badge>
    );
  };

  const filteredTransactions = salesData.recentTransactions.filter(
    (transaction) => {
      const matchesSearch = transaction.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.products.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === "all" || transaction.status === filterStatus;
      return matchesSearch && matchesFilter;
    }
  );

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2 className="text-primary">
            <ShoppingCart className="me-2" />
            Dashboard Bán Hàng
          </h2>
          <p className="text-muted">Quản lý hoạt động bán hàng và khách hàng</p>
        </Col>
      </Row>

      {/* Thống kê tổng quan */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <FaDollarSign className="text-success mb-2" size={32} />
              <h5 className="text-success">{formatCurrency(salesData.todaySales)}</h5>
              <p className="text-muted mb-0">Doanh thu hôm nay</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <FaChartLine className="text-primary mb-2" size={32} />
              <h5 className="text-primary">{formatCurrency(salesData.monthlySales)}</h5>
              <p className="text-muted mb-0">Doanh thu tháng</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <FaUsers className="text-info mb-2" size={32} />
              <h5 className="text-info">{salesData.totalCustomers}</h5>
              <p className="text-muted mb-0">Khách hàng</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <FaBox className="text-warning mb-2" size={32} />
              <h5 className="text-warning">{salesData.topProducts.length}</h5>
              <p className="text-muted mb-0">Sản phẩm bán chạy</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Sản phẩm bán chạy */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Sản phẩm bán chạy</h5>
            </Card.Header>
            <Card.Body>
              <Table striped hover>
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Đã bán</th>
                    <th>Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.topProducts.map((product, index) => (
                    <tr key={index}>
                      <td>{product.name}</td>
                      <td>
                        <Badge bg="primary">{product.sold}</Badge>
                      </td>
                      <td>{formatCurrency(product.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        {/* Giao dịch gần đây */}
        <Col md={6}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Giao dịch gần đây</h5>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddSaleModal(true)}
              >
                <FaPlus size={16} className="me-1" />
                Thêm bán hàng
              </Button>
            </Card.Header>
            <Card.Body>
              {/* Tìm kiếm và lọc */}
              <Row className="mb-3">
                <Col md={8}>
                  <InputGroup>
                    <InputGroup.Text>
                      <Search size={16} />
                    </InputGroup.Text>
                    <Form.Control
                      placeholder="Tìm kiếm khách hàng hoặc sản phẩm..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Col>
                <Col md={4}>
                  <Form.Select
                    value={filterStatus}
                    onChange={(e) => setFaFilterStatus(e.target.value)}
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="pending">Chờ xử lý</option>
                    <option value="cancelled">Đã hủy</option>
                  </Form.Select>
                </Col>
              </Row>

              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                <Table striped hover size="sm">
                  <thead>
                    <tr>
                      <th>Khách hàng</th>
                      <th>Sản phẩm</th>
                      <th>Tổng tiền</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>{transaction.customer}</td>
                        <td>
                          <small>{transaction.products}</small>
                        </td>
                        <td>{formatCurrency(transaction.total)}</td>
                        <td>{getStatusBadge(transaction.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Các hành động nhanh */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Hành động nhanh</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <Button
                    variant="success"
                    className="w-100 mb-2"
                    onClick={() => setShowAddSaleModal(true)}
                  >
                    <ShoppingCart className="me-2" />
                    Bán hàng mới
                  </Button>
                </Col>
                <Col md={3}>
                  <Button
                    variant="info"
                    className="w-100 mb-2"
                    onClick={() => setShowCustomerModal(true)}
                  >
                    <FaUsers className="me-2" />
                    Thêm khách hàng
                  </Button>
                </Col>
                <Col md={3}>
                  <Button variant="primary" className="w-100 mb-2">
                    <FaBox className="me-2" />
                    Kiểm tra tồn kho
                  </Button>
                </Col>
                <Col md={3}>
                  <Button variant="warning" className="w-100 mb-2">
                    <FaChartLine className="me-2" />
                    Báo cáo doanh thu
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal thêm bán hàng */}
      <Modal show={showAddSaleModal} onHide={() => setShowAddSaleModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Thêm giao dịch bán hàng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            Tính năng này sẽ được phát triển trong phiên bản tiếp theo.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddSaleModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal thêm khách hàng */}
      <Modal show={showCustomerModal} onHide={() => setShowCustomerModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Thêm khách hàng mới</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            Tính năng này sẽ được phát triển trong phiên bản tiếp theo.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCustomerModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default SalesDashboard;
