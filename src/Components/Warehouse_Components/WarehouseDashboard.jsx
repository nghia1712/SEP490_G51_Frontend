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
  ProgressBar,
} from "react-bootstrap";
import {
  Warehouse,
  TrendingUp,
  Inventory,
  Warning,
  CheckCircle,
  Add,
  Search,
  FilterList,
  SwapVert,
} from "@mui/icons-material";

function WarehouseDashboard() {
  const [warehouseData, setWarehouseData] = useState({
    totalProducts: 0,
    totalShelves: 0,
    lowStockItems: 0,
    expiredItems: 0,
    shelfUtilization: [],
    recentMovements: [],
  });

  const [showAddMovementModal, setShowAddMovementModal] = useState(false);
  const [showStocktakingModal, setShowStocktakingModal] = useState(false);
  const [searchTerm, setFaSearchTerm] = useState("");
  const [filterType, setFaFilterType] = useState("all");

  // Mock data - trong thực tế sẽ fetch từ API
  useEffect(() => {
    setWarehouseData({
      totalProducts: 156,
      totalShelves: 24,
      lowStockItems: 8,
      expiredItems: 3,
      shelfUtilization: [
        { name: "Kệ A1", utilization: 85, products: 12, maxCapacity: 15 },
        { name: "Kệ A2", utilization: 60, products: 9, maxCapacity: 15 },
        { name: "Kệ B1", utilization: 95, products: 14, maxCapacity: 15 },
        { name: "Kệ B2", utilization: 40, products: 6, maxCapacity: 15 },
        { name: "Kệ C1", utilization: 70, products: 10, maxCapacity: 15 },
      ],
      recentMovements: [
        {
          id: 1,
          type: "import",
          product: "Paracetamol 500mg",
          quantity: 100,
          shelf: "Kệ A1",
          user: "Nguyễn Văn A",
          date: "2024-01-15 14:30",
        },
        {
          id: 2,
          type: "export",
          product: "Amoxicillin 250mg",
          quantity: 50,
          shelf: "Kệ B1",
          user: "Trần Thị B",
          date: "2024-01-15 15:45",
        },
        {
          id: 3,
          type: "transfer",
          product: "Vitamin C 1000mg",
          quantity: 25,
          shelf: "Kệ A2 → Kệ C1",
          user: "Lê Văn C",
          date: "2024-01-15 16:20",
        },
        {
          id: 4,
          type: "import",
          product: "Aspirin 81mg",
          quantity: 75,
          shelf: "Kệ B2",
          user: "Phạm Thị D",
          date: "2024-01-15 17:10",
        },
      ],
    });
  }, []);

  const getMovementBadge = (type) => {
    const variants = {
      import: "success",
      export: "warning",
      transfer: "info",
      adjustment: "secondary",
    };
    const labels = {
      import: "Nhập kho",
      export: "Xuất kho",
      transfer: "Chuyển kho",
      adjustment: "Điều chỉnh",
    };
    return (
      <Badge bg={variants[type] || "secondary"}>
        {labels[type] || type}
      </Badge>
    );
  };

  const getUtilizationColor = (utilization) => {
    if (utilization >= 90) return "danger";
    if (utilization >= 70) return "warning";
    if (utilization >= 50) return "info";
    return "success";
  };

  const filteredMovements = warehouseData.recentMovements.filter((movement) => {
    const matchesFaSearch = movement.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.shelf.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFaFilter = filterType === "all" || movement.type === filterType;
    return matchesFaSearch && matchesFaFilter;
  });

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2 className="text-primary">
            <FaWarehouse className="me-2" />
            Dashboard Kho Hàng
          </h2>
          <p className="text-muted">Quản lý kho hàng và xuất nhập tồn kho</p>
        </Col>
      </Row>

      {/* Thống kê tổng quan */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <FaBox className="text-primary mb-2" size={32} />
              <h5 className="text-primary">{warehouseData.totalProducts}</h5>
              <p className="text-muted mb-0">Tổng sản phẩm</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <FaWarehouse className="text-info mb-2" size={32} />
              <h5 className="text-info">{warehouseData.totalShelves}</h5>
              <p className="text-muted mb-0">Tổng số kệ</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <FaExclamationTriangle className="text-warning mb-2" size={32} />
              <h5 className="text-warning">{warehouseData.lowStockItems}</h5>
              <p className="text-muted mb-0">Sản phẩm sắp hết</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <FaExclamationTriangle className="text-danger mb-2" size={32} />
              <h5 className="text-danger">{warehouseData.expiredItems}</h5>
              <p className="text-muted mb-0">Sản phẩm hết hạn</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Sử dụng kệ và hoạt động gần đây */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Sử dụng kệ hàng</h5>
            </Card.Header>
            <Card.Body>
              <Table striped hover>
                <thead>
                  <tr>
                    <th>Kệ</th>
                    <th>Sản phẩm</th>
                    <th>Sử dụng</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouseData.shelfUtilization.map((shelf, index) => (
                    <tr key={index}>
                      <td>{shelf.name}</td>
                      <td>
                        <Badge bg="secondary">{shelf.products}/{shelf.maxCapacity}</Badge>
                      </td>
                      <td>
                        <ProgressBar
                          now={shelf.utilization}
                          variant={getUtilizationColor(shelf.utilization)}
                          style={{ width: "100px" }}
                        />
                        <small className="ms-2">{shelf.utilization}%</small>
                      </td>
                      <td>
                        {shelf.utilization >= 90 ? (
                          <Badge bg="danger">Đầy</Badge>
                        ) : shelf.utilization >= 70 ? (
                          <Badge bg="warning">Sắp đầy</Badge>
                        ) : (
                          <Badge bg="success">Ổn định</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        {/* Hoạt động gần đây */}
        <Col md={6}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Hoạt động gần đây</h5>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddMovementModal(true)}
              >
                <FaPlus size={16} className="me-1" />
                Thêm hoạt động
              </Button>
            </Card.Header>
            <Card.Body>
              {/* Tìm kiếm và lọc */}
              <Row className="mb-3">
                <Col md={8}>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaSearch size={16} />
                    </InputGroup.Text>
                    <Form.Control
                      placeholder="Tìm kiếm sản phẩm, kệ hoặc người dùng..."
                      value={searchTerm}
                      onChange={(e) => setFaSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Col>
                <Col md={4}>
                  <Form.Select
                    value={filterType}
                    onChange={(e) => setFaFilterType(e.target.value)}
                  >
                    <option value="all">Tất cả loại</option>
                    <option value="import">Nhập kho</option>
                    <option value="export">Xuất kho</option>
                    <option value="transfer">Chuyển kho</option>
                    <option value="adjustment">Điều chỉnh</option>
                  </Form.Select>
                </Col>
              </Row>

              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                <Table striped hover size="sm">
                  <thead>
                    <tr>
                      <th>Loại</th>
                      <th>Sản phẩm</th>
                      <th>Số lượng</th>
                      <th>Kệ</th>
                      <th>Người thực hiện</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMovements.map((movement) => (
                      <tr key={movement.id}>
                        <td>{getMovementBadge(movement.type)}</td>
                        <td>
                          <small>{movement.product}</small>
                        </td>
                        <td>
                          <Badge bg="secondary">{movement.quantity}</Badge>
                        </td>
                        <td>
                          <small>{movement.shelf}</small>
                        </td>
                        <td>
                          <small>{movement.user}</small>
                        </td>
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
                    onClick={() => setShowAddMovementModal(true)}
                  >
                    <FaArrowsAltV className="me-2" />
                    Xuất nhập kho
                  </Button>
                </Col>
                <Col md={3}>
                  <Button
                    variant="info"
                    className="w-100 mb-2"
                    onClick={() => setShowStocktakingModal(true)}
                  >
                    <FaCheckCircle className="me-2" />
                    Kiểm kê kho
                  </Button>
                </Col>
                <Col md={3}>
                  <Button variant="warning" className="w-100 mb-2">
                    <FaExclamationTriangle className="me-2" />
                    Cảnh báo tồn kho
                  </Button>
                </Col>
                <Col md={3}>
                  <Button variant="primary" className="w-100 mb-2">
                    <FaChartLine className="me-2" />
                    Báo cáo kho
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal xuất nhập kho */}
      <Modal show={showAddMovementModal} onHide={() => setShowAddMovementModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Xuất nhập kho</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            Tính năng này sẽ được phát triển trong phiên bản tiếp theo.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddMovementModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal kiểm kê kho */}
      <Modal show={showStocktakingModal} onHide={() => setShowStocktakingModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Kiểm kê kho</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            Tính năng này sẽ được phát triển trong phiên bản tiếp theo.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStocktakingModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default WarehouseDashboard;
