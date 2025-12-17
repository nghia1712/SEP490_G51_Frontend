import React, { useState, useEffect } from "react";
import {
  Modal,
  Descriptions,
  Spin,
  Image,
  Typography,
  Row,
  Col,
  Tag,
  Divider,
  Card,
  Alert,
} from "antd";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
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

const ProductDetails = ({ show, handleClose, product, productId }) => {
  const [productDetail, setProductDetail] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categoryNameFromApi, setCategoryNameFromApi] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [previewVisible, setPreviewVisible] = useState(false);
  // Fetch product details by ID when modal opens
  useEffect(() => {
    const fetchProductDetail = async () => {
      if (!show || !product) return;

      setLoading(true);
      setError("");
      setProductDetail(product);
      if (product.categoryName) setCategoryName(product.categoryName);

      try {
        const resolvedProductId =
          productId ||
          product.ProductID ||
          product.productID ||
          product.ProductId ||
          product.productId ||
          product._pid;

        if (!resolvedProductId) {
          throw new Error("Không tìm thấy ID sản phẩm");
        }

        const response = await productAPI.getById(resolvedProductId);

        // Một số API trả success = false nhưng vẫn gửi đầy đủ data (message: "ID sản phẩm không hợp lệ")
        // => Ưu tiên dùng data nếu có, chỉ coi là lỗi khi hoàn toàn không có data
        const apiData =
          response?.data?.data ??
          (response?.data && typeof response.data === "object"
            ? response.data
            : null);

        if (apiData) {
          const productData = apiData;
          // Normalize field names for consistent access
          const normalizedProduct = {
            ...productData,
            // Backend DTO/ProductDTOView dùng tên field bị typo: ProductlUses (chữ l)
            // Nên cần map cả ProductlUses vào productUses để hiển thị đúng "Công dụng"
            productUses:
              productData?.productUses ||
              productData?.ProductUses ||
              productData?.productlUses ||
              productData?.uses ||
              productData?.Uses ||
              "",
            productIngredients: productData?.productIngredients || productData?.ProductIngredients || "",
            productWeight: productData?.productWeight || productData?.ProductWeight || "",
            productDescription: productData?.productDescription || productData?.ProductDescription || "",
            productName: productData?.productName || productData?.ProductName || "",
            productID: productData?.productID || productData?.ProductID || productData?.id || productData?.Id || "",
            unit: productData?.unit || productData?.Unit || "",
            minQuantity: productData?.minQuantity || productData?.MinQuantity || 0,
            maxQuantity: productData?.maxQuantity || productData?.MaxQuantity || 0,
            totalCurrentQuantity: productData?.totalCurrentQuantity || productData?.TotalCurrentQuantity || 0,
            status: productData?.status || productData?.Status || false,
          };
          setProductDetail(normalizedProduct);

          if (response.data.data.categoryID || response.data.data.CategoryID) {
            const categoryId =
              response.data.data.categoryID || response.data.data.CategoryID;
            try {
              const catResp = await categoryAPI.get(categoryId);
              const catData = catResp?.data?.data || catResp?.data || {};
              const name =
                catData?.Name ||
                catData?.name ||
                catData?.CategoryName ||
                catData?.categoryName ||
                "";
              setCategoryName(name || "Danh mục không xác định");
            } catch (error) {
              console.warn("Không thể load danh mục:", error);
              setCategoryName("Danh mục không xác định");
            }
          } else {
            setCategoryName("Không có danh mục");
          }
        } else {
          throw new Error(
            response.data?.message || "Không thể tải thông tin sản phẩm"
          );
        }
      } catch (err) {
        console.warn(
          "Error fetching product detail, dùng dữ liệu có sẵn:",
          err
        );
        setError("");
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetail();
  }, [show, product, productId]);

  const imageList = productDetail
    ? [
        productDetail.image,
        productDetail.imageA,
        productDetail.imageB,
        productDetail.imageC,
        productDetail.imageD,
        productDetail.imageE,
      ].filter((img) => !!img)
    : [];

  const getImageUrl = (img) => {
    if (!img) return "/images/login_image.png";
    return `https://api.bbpharmacy.site/${img.replace(/^\/+/, "")}`;
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? imageList.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === imageList.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <AnimatePresence>
      {show && (
        <Modal
          open={show}
          onCancel={handleClose}
          footer={null}
          centered
          width={700} // giữ nguyên chiều ngang 700
          title={
            <span style={{ fontSize: 25, fontWeight: 700 }}>
              Chi tiết thuốc
            </span>
          }
          // Giới hạn chiều cao form, cho phép scroll dọc bên trong để form "ngắn" hơn trên màn hình
          styles={{
            body: {
              padding: 0,
              borderRadius: 16,
              maxHeight: "70vh",
              overflowY: "auto",
            },
          }}
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
              <Spin
                size="large"
                style={{ display: "block", margin: "60px auto" }}
              />
            ) : error ? (
              <Alert message="Lỗi" description={error} type="error" showIcon />
            ) : productDetail ? (
              <Row gutter={[32, 16]} align="middle" justify="center">
                <Col xs={24} md={9} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      textAlign: "center",
                    }}
                  >
                    <Image
                      src={getImageUrl(imageList[currentImageIndex])}
                      alt="Product"
                      width={180}
                      height={180}
                      style={{
                        borderRadius: 12,
                        objectFit: "cover",
                        boxShadow: "0 4px 16px #0001",
                        cursor: "pointer",
                      }}
                      preview={false}
                      onClick={() => setPreviewVisible(true)}
                    />

                    {/* Nút trái */}
                    {imageList.length > 1 && (
                      <button
                        onClick={handlePrevImage}
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: 0,
                          transform: "translateY(-50%)",
                          background: "#0007",
                          border: "none",
                          color: "white",
                          fontSize: 18,
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ArrowBackIosIcon sx={{ fontSize: 18 }} />
                      </button>
                    )}

                    {/* Nút phải */}
                    {imageList.length > 1 && (
                      <button
                        onClick={handleNextImage}
                        style={{
                          position: "absolute",
                          top: "50%",
                          right: 0,
                          transform: "translateY(-50%)",
                          background: "#0007",
                          border: "none",
                          color: "white",
                          fontSize: 18,
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ArrowForwardIosIcon sx={{ fontSize: 18 }} />
                      </button>
                    )}
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <Tag
                      color={
                        productDetail.status || productDetail.Status
                          ? "green"
                          : "red"
                      }
                    >
                      {productDetail.status || productDetail.Status
                        ? "Đang bán"
                        : "Ngừng bán"}
                    </Tag>
                  </div>
                </Col>
                <Col xs={24} md={15}>
                  <Title level={4} style={{ marginBottom: 16 }}>
                    {productDetail.productName || productDetail.ProductName}
                  </Title>
                    <Descriptions column={1} size="middle" bordered>
                    <Descriptions.Item key="product-name" label="Tên sản phẩm">
                      <strong>
                        {productDetail.productName || productDetail.ProductName}
                      </strong>
                    </Descriptions.Item>
                    <Descriptions.Item key="description" label="Mô tả">
                      {productDetail.productDescription ||
                        productDetail.ProductDescription ||
                        "Không có mô tả"}
                    </Descriptions.Item>
                    <Descriptions.Item key="ingredients" label="Thành phần">
                      {productDetail.productIngredients ||
                        productDetail.ProductIngredients ||
                        "Không có thông tin"}
                    </Descriptions.Item>
                    <Descriptions.Item key="uses" label="Công dụng">
                      {(
                        productDetail.productUses ||
                        productDetail.ProductUses ||
                        productDetail.ProductlUses
                      ) || "Không có thông tin"}
                    </Descriptions.Item>
                    <Descriptions.Item key="weight" label="Khối lượng">
                      {(() => {
                        const weight = productDetail.productWeight || productDetail.ProductWeight;
                        if (!weight && weight !== 0) return "Không có thông tin";
                        const weightNum = typeof weight === 'string' ? parseFloat(weight) : weight;
                        if (isNaN(weightNum)) return weight || "Không có thông tin";
                        return `${weightNum} g`;
                      })()}
                    </Descriptions.Item>
                    <Descriptions.Item key="unit" label="Đơn vị">
                      {productDetail.unit || productDetail.Unit}
                    </Descriptions.Item>
                    <Descriptions.Item
                      key="min-quantity"
                      label="Số lượng tối thiểu"
                    >
                      <strong>
                        {productDetail.minQuantity || productDetail.MinQuantity}
                      </strong>{" "}
                      {productDetail.unit || productDetail.Unit}
                    </Descriptions.Item>
                    <Descriptions.Item
                      key="max-quantity"
                      label="Số lượng tối đa"
                    >
                      <strong>
                        {productDetail.maxQuantity || productDetail.MaxQuantity}
                      </strong>{" "}
                      {productDetail.unit || productDetail.Unit}
                    </Descriptions.Item>
                    <Descriptions.Item
                      key="current-quantity"
                      label="Tổng số lượng hiện tại"
                    >
                      <strong
                        style={{
                          color:
                            (productDetail.totalCurrentQuantity ||
                              productDetail.TotalCurrentQuantity) <
                            (productDetail.minQuantity ||
                              productDetail.MinQuantity)
                              ? "#ff4d4f"
                              : "#52c41a",
                        }}
                      >
                        {productDetail.totalCurrentQuantity ||
                          productDetail.TotalCurrentQuantity}
                      </strong>{" "}
                      {productDetail.unit || productDetail.Unit}
                      {(productDetail.totalCurrentQuantity ||
                        productDetail.TotalCurrentQuantity) <
                        (productDetail.minQuantity ||
                          productDetail.MinQuantity) && (
                        <Tag
                          key={`low-stock-${
                            productDetail.ProductID || productDetail.productID
                          }`}
                          color="red"
                          style={{ marginLeft: 8 }}
                        >
                          Cảnh báo: Dưới mức tối thiểu
                        </Tag>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item key="status" label="Trạng thái">
                      <Tag
                        color={
                          productDetail.status || productDetail.Status
                            ? "green"
                            : "red"
                        }
                      >
                        {productDetail.status || productDetail.Status
                          ? "Đang bán"
                          : "Ngừng bán"}
                      </Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            ) : null}
          </motion.div>
        </Modal>
      )}
      {previewVisible && (
        <Modal
          key={`preview-${
            productDetail?.ProductID || productDetail?.productID
          }-${currentImageIndex}`}
          open={previewVisible}
          onCancel={() => setPreviewVisible(false)}
          footer={null}
          centered
          width="auto"
          // styles={{ body: { padding: 0, textAlign: "center", background: "#000" } }}
        >
          <Image
            key={`preview-image-${currentImageIndex}`}
            src={getImageUrl(imageList[currentImageIndex])}
            alt="Product"
            style={{ maxHeight: "80vh", objectFit: "contain" }}
            preview={false}
          />
        </Modal>
      )}
    </AnimatePresence>
  );
};

export default ProductDetails;
