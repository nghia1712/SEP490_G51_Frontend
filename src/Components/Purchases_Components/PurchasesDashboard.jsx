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
  ShoppingBag,
  TrendingUp,
  LocalShipping,
  Inventory,
  AttachMoney,
  Add,
  Search,
  FilterList,
  Warning,
} from "@mui/icons-material";

function PurchasesDashboard() {
  const [purchasesData, setPurchasesData] = useState({
    monthlySpending: 0,
    pendingOrders: 0,
    suppliers: 0,
    lowStockProducts: [],
    recentOrders: [],
  });

  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Mock data - trong thực tế sẽ fetch từ API
  useEffect(() => {
    setPurchasesData({
      monthlySpending: 45000000,
      pendingOrders: 8,
      suppliers: 25,
      lowStockProducts: [
        { name: "Paracetamol 500mg", current: 15, min: 50, supplier: "Công ty ABC" },
        { name: "Amoxicillin 250mg", current: 8, min: 30, supplier: "Công ty XYZ" },
        { name: "Vitamin C 1000mg", current: 22, min: 40, supplier: "Công ty DEF" },
        { name: "Aspirin 81mg", current: 5, min: 25, supplier: "Công ty GHI" },
      ],
      recentOrders: [
        {
          id: 1,
          supplier: "Công ty ABC",
          products: "Paracetamol, Amoxicillin",
          total: 5500000,
          status: "pending",
          orderDate: "2024-01-15",
          expectedDate: "2024-01-20",
        },
        {
          id: 2,
          supplier: "Công ty XYZ",
          products: "Vitamin C, Aspirin",
          total: 3200000,
          status: "delivered",
          orderDate: "2024-01-10",
          expectedDate: "2024-01-15",
        },
        {
          id: 3,
          supplier: "Công ty DEF",
          products: "Ibuprofen, Metformin",
          total: 4800000,
          status: "in_transit",
          orderDate: "2024-01-12",
          expectedDate: "2024-01-18",
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
      pending: "warning",
      in_transit: "info",
      delivered: "success",
      cancelled: "danger",
    };
    const labels = {
      pending: "Chờ xử lý",
      in_transit: "Đang vận chuyển",
      delivered: "Đã giao",
      cancelled: "Đã hủy",
    };
    return (
      <Badge bg={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getStockAlert = (current, min) => {
    if (current <= min) {
      return <Badge bg="danger">Cảnh báo</Badge>;
    } else if (current <= min * 1.5) {
      return <Badge bg="warning">Sắp hết</Badge>;
    }
    return <Badge bg="success">Đủ</Badge>;
  };

  const filteredOrders = purchasesData.recentOrders.filter((order) => {
    const matchesSearch = order.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.products.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2 className="text-primary">
            <ShoppingBag className="me-2" />
            Dashboard Mua Hàng
          </h2>
          <p className="text-muted">Quản lý hoạt động mua hàng và nhà cung cấp</p>
        </Col>
      </Row>

      {/* Thống kê tổng quan */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <AttachMoney className="text-danger mb-2" size={32} />
              <h5 className="text-danger">{formatCurrency(purchasesData.monthlySpending)}</h5>
              <p className="text-muted mb-0">Chi phí tháng này</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <Inventory className="text-warning mb-2" size={32} />
              <h5 className="text-warning">{purchasesData.pendingOrders}</h5>
              <p className="text-muted mb-0">Đơn hàng chờ xử lý</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <LocalShipping className="text-info mb-2" size={32} />
              <h5 className="text-info">{purchasesData.suppliers}</h5>
              <p className="text-muted mb-0">Nhà cung cấp</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <Warning className="text-danger mb-2" size={32} />
              <h5 className="text-danger">{purchasesData.lowStockProducts.length}</h5>
              <p className="text-muted mb-0">Sản phẩm sắp hết</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Sản phẩm sắp hết và đơn hàng gần đây */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0 text-danger">
                <Warning className="me-2" />
                Sản phẩm sắp hết
              </h5>
            </Card.Header>
            <Card.Body>
              <Table striped hover>
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Tồn kho</th>
                    <th>Tối thiểu</th>
                    <th>Nhà cung cấp</th>
                    <th>Cảnh báo</th>
                  </tr>
                </thead>
                <tbody>
                  {purchasesData.lowStockProducts.map((product, index) => (
                    <tr key={index}>
                      <td>{product.name}</td>
                      <td>
                        <Badge bg="secondary">{product.current}</Badge>
                      </td>
                      <td>{product.min}</td>
                      <td>
                        <small>{product.supplier}</small>
                      </td>
                      <td>{getStockAlert(product.current, product.min)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        {/* Đơn hàng gần đây */}
        <Col md={6}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Đơn hàng gần đây</h5>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddOrderModal(true)}
              >
                <Add size={16} className="me-1" />
                Tạo đơn hàng
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
                      placeholder="Tìm kiếm nhà cung cấp hoặc sản phẩm..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Col>
                <Col md={4}>
                  <Form.Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="pending">Chờ xử lý</option>
                    <option value="in_transit">Đang vận chuyển</option>
                    <option value="delivered">Đã giao</option>
                    <option value="cancelled">Đã hủy</option>
                  </Form.Select>
                </Col>
              </Row>

              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                <Table striped hover size="sm">
                  <thead>
                    <tr>
                      <th>Nhà cung cấp</th>
                      <th>Sản phẩm</th>
                      <th>Tổng tiền</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.supplier}</td>
                        <td>
                          <small>{order.products}</small>
                        </td>
                        <td>{formatCurrency(order.total)}</td>
                        <td>{getStatusBadge(order.status)}</td>
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
                    onClick={() => setShowAddOrderModal(true)}
                  >
                    <ShoppingBag className="me-2" />
                    Tạo đơn hàng
                  </Button>
                </Col>
                <Col md={3}>
                  <Button
                    variant="info"
                    className="w-100 mb-2"
                    onClick={() => setShowSupplierModal(true)}
                  >
                    <LocalShipping className="me-2" />
                    Quản lý nhà cung cấp
                  </Button>
                </Col>
                <Col md={3}>
                  <Button variant="warning" className="w-100 mb-2">
                    <Warning className="me-2" />
                    Kiểm tra tồn kho
                  </Button>
                </Col>
                <Col md={3}>
                  <Button variant="primary" className="w-100 mb-2">
                    <TrendingUp className="me-2" />
                    Báo cáo chi phí
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal tạo đơn hàng */}
      <Modal show={showAddOrderModal} onHide={() => setShowAddOrderModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Tạo đơn hàng mới</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            Tính năng này sẽ được phát triển trong phiên bản tiếp theo.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddOrderModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal quản lý nhà cung cấp */}
      <Modal show={showSupplierModal} onHide={() => setShowSupplierModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Quản lý nhà cung cấp</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            Tính năng này sẽ được phát triển trong phiên bản tiếp theo.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSupplierModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default PurchasesDashboard;
