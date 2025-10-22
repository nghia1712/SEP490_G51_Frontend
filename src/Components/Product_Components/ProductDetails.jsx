import React, { useState, useEffect } from "react";
import { Modal, Descriptions, Spin, Image, Typography, Row, Col, Tag, Divider, Card, Alert } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { EnvironmentOutlined } from "@ant-design/icons";
import productAPI from "../../API/productAPI";
import categoryAPI from "../../API/categoryAPI";

const { Title } = Typography;

const fadeIn = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: 40, transition: { duration: 0.2 } },
};

const ProductDetails = ({ show, handleClose, product }) => {
  const [productDetail, setProductDetail] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);

  // Load categories when component mounts
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoryResponse = await categoryAPI.getAllPublic();
        if (categoryResponse.data && categoryResponse.data.success) {
          setCategories(categoryResponse.data.data);
          console.log('ProductDetails - Loaded categories:', categoryResponse.data.data);
        }
      } catch (err) {
        console.warn("Could not load categories:", err);
        // Fallback: Use mock categories based on common category IDs
        const mockCategories = [
          { CategoryID: 1, Name: "Thuốc giảm đau" },
          { CategoryID: 2, Name: "Kháng sinh" },
          { CategoryID: 3, Name: "Thuốc tiêu hóa" },
          { CategoryID: 4, Name: "Vitamin" },
          { CategoryID: 5, Name: "Thuốc cảm cúm" },
        ];
        setCategories(mockCategories);
        console.log('ProductDetails - Using mock categories:', mockCategories);
      }
    };
    
    if (show) {
      loadCategories();
    }
  }, [show]);

  // Fetch product details by ID when modal opens
  useEffect(() => {
    const fetchProductDetail = async () => {
      if (!show || !product) return;
      
      setLoading(true);
      setError("");
      
      try {
        // Debug: Log the product object to see its structure
        console.log('ProductDetails - Received product:', product);
        
        // Get product ID from various possible fields
        const productId = product.ProductID || product.productID || product.ProductId || product.productId || product._pid;
        
        console.log('ProductDetails - Extracted productId:', productId);
        
        if (!productId) {
          throw new Error("Không tìm thấy ID sản phẩm");
        }

        // Fetch detailed product information
        console.log('ProductDetails - Calling API with ID:', productId);
        const response = await productAPI.getById(productId);
        
        console.log('ProductDetails - API Response:', response);
        
        if (response.data && response.data.success) {
          setProductDetail(response.data.data);
          console.log('ProductDetails - Set productDetail:', response.data.data);
          
          // Fetch category name if categoryId exists
          if (response.data.data.categoryID || response.data.data.CategoryID) {
            const categoryId = response.data.data.categoryID || response.data.data.CategoryID;
            console.log('ProductDetails - Looking for categoryId:', categoryId);
            console.log('ProductDetails - Available categories:', categories);
            
            // Try different ways to find the category
            const category = categories.find(cat => 
              cat.CategoryID === categoryId || 
              cat.categoryID === categoryId ||
              cat.id === categoryId ||
              cat.Id === categoryId
            );
            
            if (category) {
              const categoryName = category.Name || category.name || category.CategoryName || category.categoryName;
              setCategoryName(categoryName);
              console.log('ProductDetails - Set categoryName:', categoryName);
            } else {
              console.warn('ProductDetails - Category not found for ID:', categoryId);
              setCategoryName("Danh mục không xác định");
            }
          } else {
            console.warn('ProductDetails - No categoryID found in product data');
            setCategoryName("Không có danh mục");
          }
        } else {
          throw new Error(response.data?.message || "Không thể tải thông tin sản phẩm");
        }
      } catch (err) {
        console.error("Error fetching product detail:", err);
        setError(err.message || "Có lỗi xảy ra khi tải thông tin sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetail();
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
              <Alert message="Lỗi" description={error} type="error" showIcon />
            ) : productDetail ? (
              <Row gutter={[32, 16]} align="middle" justify="center">
                <Col xs={24} md={9} style={{ textAlign: "center" }}>
                  <Image
                    src={productDetail.image || productDetail.Image ? `http://localhost:5137${productDetail.image || productDetail.Image}` : "/images/login_image.jpg"}
                    alt="Product"
                    width={180}
                    height={180}
                    style={{ borderRadius: 12, objectFit: "cover", boxShadow: "0 4px 16px #0001" }}
                    preview={false}
                  />
                  <div style={{ marginTop: 12 }}>
                    <Tag color={(productDetail.status || productDetail.Status) ? "green" : "red"}>
                      {(productDetail.status || productDetail.Status) ? "Đang bán" : "Ngừng bán"}
                    </Tag>
                  </div>
                </Col>
                <Col xs={24} md={15}>
                  <Title level={4} style={{ marginBottom: 16 }}>{productDetail.productName || productDetail.ProductName}</Title>
                  <Descriptions column={1} size="middle" bordered>
                    <Descriptions.Item label="Mã sản phẩm">
                      {productDetail.productID || productDetail.ProductID}
                    </Descriptions.Item>
                    <Descriptions.Item label="Tên sản phẩm">
                      <strong>{productDetail.productName || productDetail.ProductName}</strong>
                    </Descriptions.Item>
                    <Descriptions.Item label="Danh mục">
                      {categoryName || "Đang tải..."}
                    </Descriptions.Item>
                    <Descriptions.Item label="Mô tả">
                      {productDetail.productDescription || productDetail.ProductDescription || "Không có mô tả"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Đơn vị">
                      {productDetail.unit || productDetail.Unit}
                    </Descriptions.Item>
                    <Descriptions.Item label="Số lượng tối thiểu">
                      <strong>{productDetail.minQuantity || productDetail.MinQuantity}</strong> {productDetail.unit || productDetail.Unit}
                    </Descriptions.Item>
                    <Descriptions.Item label="Số lượng tối đa">
                      <strong>{productDetail.maxQuantity || productDetail.MaxQuantity}</strong> {productDetail.unit || productDetail.Unit}
                    </Descriptions.Item>
                    <Descriptions.Item label="Tổng số lượng hiện tại">
                      <strong style={{ color: (productDetail.totalCurrentQuantity || productDetail.TotalCurrentQuantity) < (productDetail.minQuantity || productDetail.MinQuantity) ? '#ff4d4f' : '#52c41a' }}>
                        {productDetail.totalCurrentQuantity || productDetail.TotalCurrentQuantity}
                      </strong> {productDetail.unit || productDetail.Unit}
                      {(productDetail.totalCurrentQuantity || productDetail.TotalCurrentQuantity) < (productDetail.minQuantity || productDetail.MinQuantity) && (
                        <Tag color="red" style={{ marginLeft: 8 }}>Cảnh báo: Dưới mức tối thiểu</Tag>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                      <Tag color={(productDetail.status || productDetail.Status) ? "green" : "red"}>
                        {(productDetail.status || productDetail.Status) ? "Đang bán" : "Ngừng bán"}
                      </Tag>
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