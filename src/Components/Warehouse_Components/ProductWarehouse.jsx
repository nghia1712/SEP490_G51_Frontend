import React, { useEffect, useState, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Modal,
  Button,
  Table,
  Form,
  InputGroup,
  Alert,
  Card,
  Badge,
} from "react-bootstrap";
import inventoryAPI from "../../API/inventoryAPI";
import productAPI from "../../API/productAPI";

function ProductWarehouse() {
  const [shelves, setShelves] = useState([]);
  const [selectedShelf, setSelectedShelf] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [formMode, setFormMode] = useState(""); // "import" hoặc "export" hoặc "optimize" hoặc ""
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [weight, setWeight] = useState(1);
  const [optimizedShelves, setOptimizedShelves] = useState([]);

  // 创建一个可以重用的加载数据函数
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // 获取货架布局数据，这会包含货架上的产品信息
      const shelvesRes = await inventoryAPI.getLayout();
      setShelves(shelvesRes.data);

      // 获取所有产品
      const productsRes = await productAPI.getAll();
      setProducts(productsRes.data);

      setLoading(false);
    } catch (err) {
      console.error("加载数据错误:", err);
      setError("Đã xảy ra lỗi khi tải dữ liệu");
      setLoading(false);
    }
  }, []);

  // 首次加载时获取数据
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 刷新选定货架的信息
  const refreshSelectedShelf = useCallback(async () => {
    if (!selectedShelf) return;

    try {
      const shelvesRes = await inventoryAPI.getLayout();
      const updatedShelves = shelvesRes.data;
      setShelves(updatedShelves);

      // 更新选中的货架信息
      const updatedSelectedShelf = updatedShelves.find(
        (s) => s._id === selectedShelf._id
      );

      if (updatedSelectedShelf) {
        setSelectedShelf(updatedSelectedShelf);
      }
    } catch (err) {
      console.error("刷新货架数据错误:", err);
    }
  }, [selectedShelf]);

  // Tạo grid layout đơn giản dựa trên location (ví dụ: A1, B2...)
  // Giả sử location là dạng "A1", "A2", "B1", ...
  const getGrid = () => {
    // Tìm tất cả row (A, B, C...) và col (1, 2, 3...)
    const rows = Array.from(
      new Set(shelves.map((s) => s.location && s.location[0]))
    ).sort();
    const cols = Array.from(
      new Set(shelves.map((s) => s.location && s.location.slice(1)))
    ).sort((a, b) => a - b);

    // Nếu không có dữ liệu location, hiển thị dạng danh sách
    if (rows.length === 0 || cols.length === 0) {
      return (
        <Row>
          {shelves.map((shelf) => (
            <Col key={shelf._id} md={3} className="p-2">
              <Button
                variant={shelf.status === "active" ? "primary" : "secondary"}
                style={{ width: "100%", height: 80, fontWeight: 700 }}
                onClick={() => {
                  setSelectedShelf(shelf);
                  setShowModal(true);
                }}
              >
                {shelf.name}
                <br />
                <span style={{ fontSize: 12 }}>
                  {shelf.location || "Không có vị trí"}
                </span>
                {/* 显示货架上的产品数量 */}
                {shelf.products && shelf.products.length > 0 && (
                  <Badge bg="warning" style={{ marginLeft: 5 }}>
                    {shelf.products.length} sản phẩm
                  </Badge>
                )}
              </Button>
            </Col>
          ))}
        </Row>
      );
    }

    // Hiển thị dạng grid theo location
    return rows.map((row) => (
      <Row key={row} className="mb-3" style={{ justifyContent: "center" }}>
        {cols.map((col) => {
          const shelf = shelves.find((s) => s.location === row + col);
          // Kiểm tra xem kệ này có nằm trong danh sách kệ tối ưu không
          const isOptimized = optimizedShelves.some(
            (s) => s._id === shelf?._id
          );

          // 计算货架的使用率
          const usageRate = shelf
            ? Math.round(
                (shelf.currentQuantitative / shelf.maxQuantitative) * 100
              )
            : 0;

          // 根据使用率设置颜色
          let shelfColorClass = "primary";
          if (shelf && shelf.status === "active") {
            if (usageRate >= 90) shelfColorClass = "danger";
            else if (usageRate >= 70) shelfColorClass = "warning";
            else shelfColorClass = "primary";
          } else {
            shelfColorClass = "secondary";
          }

          return (
            <Col key={col} md={2} className="p-2">
              {shelf ? (
                <Button
                  variant={isOptimized ? "success" : shelfColorClass}
                  style={{
                    width: "100%",
                    height: 80,
                    fontWeight: 700,
                    border: isOptimized ? "3px solid #ffc107" : undefined,
                    position: "relative",
                  }}
                  onClick={() => {
                    setSelectedShelf(shelf);
                    setShowModal(true);
                    setFormMode("");
                    setError("");
                    setSuccess("");
                  }}
                >
                  {shelf.name}
                  <br />
                  <span style={{ fontSize: 12 }}>{shelf.location}</span>
                  {/* 显示产品数量徽章 */}
                  {shelf.products && shelf.products.length > 0 && (
                    <Badge
                      bg="info"
                      style={{
                        position: "absolute",
                        bottom: 2,
                        right: 5,
                      }}
                    >
                      {shelf.products.length} SP
                    </Badge>
                  )}
                  {/* 显示使用率 */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 2,
                      left: 5,
                      fontSize: "10px",
                    }}
                  >
                    {usageRate}%
                  </div>
                  {isOptimized && (
                    <Badge
                      bg="warning"
                      style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        transform: "translate(30%, -30%)",
                      }}
                    >
                      Gợi ý
                    </Badge>
                  )}
                </Button>
              ) : (
                <div style={{ height: 80 }}></div>
              )}
            </Col>
          );
        })}
      </Row>
    ));
  };

  // Xử lý nhập hàng vào kệ
  const handleImport = async (e) => {
    e.preventDefault();
    if (!selectedProduct || quantity <= 0 || weight <= 0) {
      setError("Vui lòng chọn sản phẩm và nhập số lượng/cân nặng hợp lệ");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await inventoryAPI.addProductToShelf({
        inventoryId: selectedShelf._id,
        productId: selectedProduct,
        quantity: parseInt(quantity),
        weight: parseFloat(weight),
      });

      // 刷新数据
      await loadData();
      // 更新选定的货架信息
      await refreshSelectedShelf();

      setSuccess("Nhập hàng thành công");
      setFormMode("");
      setQuantity(1);
      setWeight(1);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi nhập hàng");
    }
    setLoading(false);
  };

  // Xử lý xuất hàng từ kệ
  const handleExport = async (e) => {
    e.preventDefault();
    if (!selectedProduct || quantity <= 0) {
      setError("Vui lòng chọn sản phẩm và nhập số lượng hợp lệ");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await inventoryAPI.removeProductFromShelf({
        inventoryId: selectedShelf._id,
        productId: selectedProduct,
        quantity: parseInt(quantity),
      });

      // 刷新数据
      await loadData();
      // 更新选定的货架信息
      await refreshSelectedShelf();

      setSuccess("Xuất hàng thành công");
      setFormMode("");
      setQuantity(1);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi xuất hàng");
    }
    setLoading(false);
  };

  // Tìm kệ tối ưu cho sản phẩm
  const handleOptimize = async () => {
    if (!selectedProduct) {
      setError("Vui lòng chọn sản phẩm");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Lấy thông tin sản phẩm đã chọn
      const product = products.find((p) => p._id === selectedProduct);
      if (!product) {
        setError("Không tìm thấy sản phẩm");
        setLoading(false);
        return;
      }

      // 首先获取最新的货架数据
      await loadData();

      // Tìm các kệ phù hợp với loại sản phẩm và còn trống
      const compatibleShelves = shelves.filter(
        (shelf) =>
          shelf.categoryId === product.categoryId ||
          shelf.category?._id === product.categoryId
      );

      // Sắp xếp kệ theo thứ tự ưu tiên:
      // 1. Kệ đã có sản phẩm này
      // 2. Kệ còn nhiều chỗ trống nhất
      const optimized = compatibleShelves
        .map((shelf) => {
          // Kiểm tra xem kệ đã có sản phẩm này chưa
          const hasProduct =
            shelf.products &&
            shelf.products.some(
              (p) =>
                p.productId === selectedProduct ||
                (p.productId && p.productId.toString() === selectedProduct)
            );

          // Tính % chỗ trống còn lại
          const spaceLeft = shelf.maxQuantitative - shelf.currentQuantitative;
          const spacePercentage = (spaceLeft / shelf.maxQuantitative) * 100;

          return {
            ...shelf,
            hasProduct,
            spaceLeft,
            spacePercentage,
          };
        })
        .filter((shelf) => shelf.spaceLeft > 0 && shelf.status === "active") // Chỉ lấy kệ còn trống và đang hoạt động
        .sort((a, b) => {
          // Ưu tiên kệ đã có sản phẩm
          if (a.hasProduct && !b.hasProduct) return -1;
          if (!a.hasProduct && b.hasProduct) return 1;

          // Nếu cùng trạng thái về sản phẩm, ưu tiên kệ còn nhiều chỗ trống
          return b.spaceLeft - a.spaceLeft;
        })
        .slice(0, 3); // Lấy 3 kệ tốt nhất

      setOptimizedShelves(optimized);
      setFormMode("");

      if (optimized.length === 0) {
        setError("Không tìm thấy kệ phù hợp cho sản phẩm này");
      } else {
        setSuccess(
          `Đã tìm thấy ${optimized.length} kệ phù hợp (được đánh dấu màu xanh)`
        );
      }
    } catch (err) {
      setError("Lỗi khi tìm kệ tối ưu");
    }

    setLoading(false);
  };

  return (
    <Container className="mt-4 text-center">
      <h2>Sơ đồ kho sản phẩm</h2>

      {/* Form tối ưu hóa kệ */}
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Tìm kệ tối ưu cho sản phẩm</Card.Title>
          <Row>
            <Col md={8}>
              <Form.Group>
                <Form.Control
                  as="select"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                >
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.productName}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Button
                variant="info"
                onClick={handleOptimize}
                disabled={loading || !selectedProduct}
              >
                {loading ? "Đang tìm..." : "Tìm kệ tối ưu"}
              </Button>
            </Col>
          </Row>
          {error && (
            <Alert variant="danger" className="mt-2">
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" className="mt-2">
              {success}
            </Alert>
          )}
        </Card.Body>
      </Card>

      {shelves.length === 0 ? <div>Đang tải...</div> : getGrid()}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Thông tin kệ: {selectedShelf?.name} (
            {selectedShelf?.location || "Không có vị trí"})
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedShelf && (
            <>
              <Row>
                <Col md={6}>
                  <Card className="mb-3">
                    <Card.Header>Thông tin cơ bản</Card.Header>
                    <Card.Body>
                      <div>
                        <b>Loại sản phẩm:</b>{" "}
                        {selectedShelf.category?.categoryName ||
                          selectedShelf.category?._id}
                      </div>
                      <div>
                        <b>Sức chứa:</b> {selectedShelf.currentQuantitative}/
                        {selectedShelf.maxQuantitative} (
                        {Math.round(
                          (selectedShelf.currentQuantitative /
                            selectedShelf.maxQuantitative) *
                            100
                        )}
                        %)
                      </div>
                      <div>
                        <b>Cân nặng:</b> {selectedShelf.currentWeight}/
                        {selectedShelf.maxWeight} (
                        {Math.round(
                          (selectedShelf.currentWeight /
                            selectedShelf.maxWeight) *
                            100
                        )}
                        %)
                      </div>
                      <div>
                        <b>Trạng thái:</b>{" "}
                        {selectedShelf.status === "active" ? (
                          <Badge bg="success">Hoạt động</Badge>
                        ) : (
                          <Badge bg="secondary">Ngừng</Badge>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="mb-3">
                    <Card.Header>Thông tin sản phẩm</Card.Header>
                    <Card.Body>
                      <div>
                        <b>Số lượng sản phẩm:</b>{" "}
                        {selectedShelf.products?.length || 0}
                      </div>
                      <div>
                        <b>Tổng số lượng:</b>{" "}
                        {selectedShelf.currentQuantitative}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <hr />

              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              {/* Nút chọn chế độ nhập/xuất */}
              {formMode === "" && (
                <div className="d-flex justify-content-center mb-3">
                  <Button
                    variant="success"
                    className="me-2"
                    onClick={() => setFormMode("import")}
                  >
                    Nhập hàng vào kệ
                  </Button>
                  <Button
                    variant="warning"
                    onClick={() => setFormMode("export")}
                  >
                    Xuất hàng từ kệ
                  </Button>
                </div>
              )}

              {/* Form nhập hàng */}
              {formMode === "import" && (
                <Form
                  onSubmit={handleImport}
                  className="border p-3 rounded mb-3"
                >
                  <h5>Nhập hàng vào kệ</h5>
                  <Form.Group className="mb-3">
                    <Form.Label>Chọn sản phẩm</Form.Label>
                    <Form.Control
                      as="select"
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      required
                    >
                      <option value="">-- Chọn sản phẩm --</option>
                      {products
                        .filter(
                          (p) =>
                            p.categoryId === selectedShelf.category?._id ||
                            p.categoryId === selectedShelf.categoryId
                        )
                        .map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.productName}
                          </option>
                        ))}
                    </Form.Control>
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Số lượng</Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Cân nặng (kg)</Form.Label>
                        <Form.Control
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="d-flex justify-content-end">
                    <Button
                      variant="secondary"
                      className="me-2"
                      onClick={() => setFormMode("")}
                    >
                      Hủy
                    </Button>
                    <Button type="submit" variant="primary" disabled={loading}>
                      {loading ? "Đang xử lý..." : "Nhập hàng"}
                    </Button>
                  </div>
                </Form>
              )}

              {/* Form xuất hàng */}
              {formMode === "export" && (
                <Form
                  onSubmit={handleExport}
                  className="border p-3 rounded mb-3"
                >
                  <h5>Xuất hàng từ kệ</h5>
                  <Form.Group className="mb-3">
                    <Form.Label>Chọn sản phẩm</Form.Label>
                    <Form.Control
                      as="select"
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      required
                    >
                      <option value="">-- Chọn sản phẩm --</option>
                      {selectedShelf.products &&
                        selectedShelf.products.map((p) => (
                          <option key={p.productId} value={p.productId}>
                            {p.productName || p.productId} (Hiện có:{" "}
                            {p.quantity})
                          </option>
                        ))}
                    </Form.Control>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Số lượng</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <div className="d-flex justify-content-end">
                    <Button
                      variant="secondary"
                      className="me-2"
                      onClick={() => setFormMode("")}
                    >
                      Hủy
                    </Button>
                    <Button type="submit" variant="warning" disabled={loading}>
                      {loading ? "Đang xử lý..." : "Xuất hàng"}
                    </Button>
                  </div>
                </Form>
              )}

              <Card>
                <Card.Header>
                  <h5 className="mb-0">Sản phẩm trên kệ</h5>
                </Card.Header>
                <Card.Body>
                  {selectedShelf.products &&
                  selectedShelf.products.length > 0 ? (
                    <Table bordered hover responsive>
                      <thead className="bg-light">
                        <tr>
                          <th>#</th>
                          <th>Mã sản phẩm</th>
                          <th>Tên sản phẩm</th>
                          <th>Số lượng</th>
                          <th>Đơn vị</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedShelf.products.map((p, idx) => {
                          // 查找完整的产品信息
                          const productDetails = products.find(
                            (prod) => prod._id === p.productId
                          );

                          return (
                            <tr key={p.productId || idx}>
                              <td>{idx + 1}</td>
                              <td>
                                <small>
                                  {p.productId &&
                                    p.productId.toString().substring(0, 8)}
                                  ...
                                </small>
                              </td>
                              <td>
                                <b>
                                  {p.productName ||
                                    (productDetails &&
                                      productDetails.productName) ||
                                    "Sản phẩm không xác định"}
                                </b>
                              </td>
                              <td className="text-center">
                                <Badge bg="primary" pill>
                                  {p.quantity}
                                </Badge>
                              </td>
                              <td>
                                {p.unit ||
                                  (productDetails && productDetails.unit) ||
                                  "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  ) : (
                    <Alert variant="info">
                      Kệ này hiện không có sản phẩm nào. Bạn có thể nhập hàng
                      vào kệ bằng cách nhấn nút "Nhập hàng vào kệ" phía trên.
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Đóng
          </Button>
          <Button
            variant="primary"
            onClick={refreshSelectedShelf}
            disabled={loading}
          >
            Làm mới dữ liệu
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default ProductWarehouse;
