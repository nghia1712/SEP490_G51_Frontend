import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Descriptions, Badge, Spin, Image, Typography, Row, Col, Tag } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { EnvironmentOutlined } from "@ant-design/icons";

const { Title } = Typography;

const fadeIn = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: 40, transition: { duration: 0.2 } },
};

const ProductDetailsAntdMotion = ({ show, handleClose, product }) => {
    const [categoryName, setCategoryName] = useState("");
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [supplierName, setSupplierName] = useState("");
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

    useEffect(() => {
        const findCategoryName = () => {
            if (product && product.categoryId) {
                const category = categories.find(cat => String(cat._id) === String(product.categoryId));
                if (category) setCategoryName(category.categoryName);
            }
        };
        const fetchSupplier = async () => {
            if (product && product.supplierId) {
                try {
                    const response = await axios.get(`http://localhost:9999/suppliers/${product.supplierId}`);
                    setSupplierName(response.data.supplierName);
                } catch (error) {
                    setError("Không thể tải nhà cung cấp.");
                }
            }
        };
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
            fetchSupplier();
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
                    bodyStyle={{ padding: 0, borderRadius: 16 }}
                    style={{ top: 40 }}
                    destroyOnClose
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
                                            {supplierName || "Không có thông tin"}
                                        </Descriptions.Item>
                                        <Descriptions.Item label={<span><EnvironmentOutlined /> Vị trí lưu trữ</span>}>
                                            <div>
                                                <b>Kệ hàng:</b> {product.location || "-"}
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

export default ProductDetailsAntdMotion;
