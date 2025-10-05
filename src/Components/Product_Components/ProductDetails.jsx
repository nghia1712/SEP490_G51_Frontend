import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Descriptions, Spin, Image, Typography, Row, Col, Tag, Divider, Card } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { EnvironmentOutlined } from "@ant-design/icons";

const { Title } = Typography;

const fadeIn = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: 40, transition: { duration: 0.2 } },
};

const ProductDetails = ({ show, handleClose, product }) => {
  const [categoryName, setCategoryName] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [shelfInfo, setShelfInfo] = useState(null);

  useEffect(() => {
    const fetchCate = async () => {
      try {
        const response = await axios.get("http://localhost:9999/categories/getAllCategories");
        setCategories(response.data);
      } catch (error) {
        setError("Không thể tải danh mục.");
      } finally {
        setLoading(false);
      }
    };
    fetchCate();
  }, []);

  // Fetch all supplierProduct and filter by productName
  useEffect(() => {
    const fetchSupplierProducts = async () => {
      if (!product) return;
      try {
        const res = await axios.get("http://localhost:9999/supplierProduct/getAllSupplierProducts");
        if (res.data && Array.isArray(res.data.data)) {
          // So sánh theo productName hoặc productId nếu có
          const filtered = res.data.data.filter(sp =>
            sp.productName === product.productName || sp.productId === product._id
          );
          setSupplierProducts(filtered);
        }
      } catch (err) {
        setSupplierProducts([]);
      }
    };
    if (show) fetchSupplierProducts();
  }, [show, product]);

  useEffect(() => {
    const findCategoryName = () => {
      if (product && product.categoryId) {
        const category = categories.find(cat => String(cat._id) === String(product.categoryId));
        if (category) setCategoryName(category.categoryName);
      }
    };
    // Bỏ fetchSupplier, thay bằng supplierProducts
    const fetchShelfInfo = async () => {
      if (product && product.location) {
        try {
          const response = await axios.get(`http://localhost:9999/inventory`);
          const shelf = response.data.find(s => s.name === product.location);
          setShelfInfo(shelf || null);
        } catch (error) {
          setShelfInfo(null);
        }
      } else setShelfInfo(null);
    };
    if (show) {
      findCategoryName();
      fetchShelfInfo();
    }
  }, [show, product, categories]);

  return (
    <AnimatePresence>
      {show && (
        <Modal
          open={show}
          onCancel={handleClose}
          footer={null}
          centered
          width={700}
          styles={{ body: { padding: 0, borderRadius: 16 } }}
          style={{ top: 40 }}
          destroyOnHidden={true}
        >
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ padding: 32, background: "#fff", borderRadius: 16 }}
          >
            {loading ? (
              <Spin size="large" style={{ display: "block", margin: "60px auto" }} />
            ) : error ? (
              <div style={{ color: "red", textAlign: "center" }}>{error}</div>
            ) : product ? (
              <Row gutter={[32, 16]} align="middle" justify="center">
                <Col xs={24} md={9} style={{ textAlign: "center" }}>
                  <Image
                    src={product.productImage ? `http://localhost:9999${product.productImage}` : "http://localhost:9999/uploads/default-product.png"}
                    alt="Product"
                    width={180}
                    height={180}
                    style={{ borderRadius: 12, objectFit: "cover", boxShadow: "0 4px 16px #0001" }}
                    preview={false}
                  />
                  <div style={{ marginTop: 12 }}>
                    <Tag color={product.status === "active" ? "green" : "red"}>
                      {product.status === "active" ? "Đang bán" : "Ngừng bán"}
                    </Tag>
                  </div>
                </Col>
                <Col xs={24} md={15}>
                  <Title level={4} style={{ marginBottom: 16 }}>{product.productName}</Title>
                  <Descriptions column={1} size="middle" bordered>
                    <Descriptions.Item label="Danh mục">
                      {product?.categoryId?.categoryName || categoryName || "Không có thông tin"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Tồn kho">
                      <b>{product.totalStock}</b> {product.unit}
                    </Descriptions.Item>
                    <Descriptions.Item label="Giá nhập">
                      {product.importPrice ? product.importPrice.toLocaleString("vi-VN") + " VND" : "Không có"}
                    </Descriptions.Item>
                    {product.exportPrice && (
                      <Descriptions.Item label="Giá bán">
                        {product.exportPrice.toLocaleString("vi-VN")} VND
                      </Descriptions.Item>
                    )}
                    {product.expiryDate && (
                      <Descriptions.Item label="Hạn sử dụng">
                        {new Date(product.expiryDate).toLocaleDateString("vi-VN")}
                      </Descriptions.Item>
                    )}
                    <Descriptions.Item label="Ngưỡng tồn kho">
                      {product.thresholdStock} {product.unit}
                    </Descriptions.Item>
                    <Descriptions.Item label="Nhà cung cấp">
                      {supplierProducts.length === 0 ? (
                        <span>Không có thông tin</span>
                      ) : (
                        supplierProducts.map((sp, idx) => (
                          <Card
                            key={sp._id || idx}
                            size="small"
                            style={{ marginBottom: 8, background: "#f6ffed", border: "1px solid #b7eb8f" }}
                            styles={{ body: { padding: 10 } }} // Updated from bodyStyle to styles.body
                          >
                            <b>{sp.supplier?.name || "Không rõ tên"}</b>
                            {sp.supplier?.status && (
                              <Tag color={sp.supplier.status === "active" ? "green" : "red"} style={{ marginLeft: 8 }}>
                                {sp.supplier.status === "active" ? "Đang hoạt động" : "Ngừng hoạt động"}
                              </Tag>
                            )}
                            <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>
                              {sp.supplier?.email && <div><b>Email:</b> {sp.supplier.email}</div>}
                              {sp.supplier?.contact && <div><b>Liên hệ:</b> {sp.supplier.contact}</div>}
                              {sp.supplier?.address && <div><b>Địa chỉ:</b> {sp.supplier.address}</div>}
                              {sp.supplier?.description && <div><b>Mô tả:</b> {sp.supplier.description}</div>}
                            </div>
                          </Card>
                        ))
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label={<span><EnvironmentOutlined /> Vị trí lưu trữ</span>}>
                      <div>
                        <b>Kệ hàng:</b> {
                          product.location ? (
                            Array.isArray(product.location) ? (
                              product.location.length > 0 ? (
                                <div>
                                  {product.location.map((loc, index) => (
                                    <div key={index} style={{ marginLeft: 8, marginTop: 4 }}>
                                      • {loc.inventoryId?.name || `Kệ ${index + 1}`}: {loc.stock || 0} sản phẩm
                                      {loc.price && <span> - Giá: {loc.price.toLocaleString()} VND</span>}
                                    </div>
                                  ))}
                                </div>
                              ) : "Chưa có vị trí"
                            ) : (
                              product.location
                            )
                          ) : "-"
                        }
                        {shelfInfo && (
                          <>
                            <br />
                            <b>Loại kệ:</b> {shelfInfo.category?.categoryName || "Không phân loại"}
                            <br />
                            <b>Sức chứa:</b> {shelfInfo.currentQuantitative}/{shelfInfo.maxQuantitative}
                            <br />
                            <b>Tỷ lệ đầy:</b> {shelfInfo.maxQuantitative > 0 ? Math.round((shelfInfo.currentQuantitative / shelfInfo.maxQuantitative) * 100) : 0}%
                          </>
                        )}
                      </div>
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            ) : null}
          </motion.div>
        </Modal>
      )}
    </AnimatePresence>
  );
};

export default ProductDetails;
