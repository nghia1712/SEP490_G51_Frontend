import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Alert,
  InputGroup,
  Card, // Sử dụng Card để thống nhất UI
} from "react-bootstrap";
import { FaEnvelope } from "react-icons/fa";
import { useAuthContext } from "../../App";
import { CircularProgress } from "@mui/material";
// Import các thành phần cần thiết từ Framer Motion
import { motion, AnimatePresence } from "framer-motion";

const ForgotPasswordStaff = () => {
  const [loading, setLoading] = useState(false);
  const { forgotPassword } = useAuthContext();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      const response = await forgotPassword({ Email: email });
      setMessage(response.message || "Yêu cầu đã được gửi thành công!");
    } catch (err) {
      setLoading(false);
      // Xử lý các lỗi từ backend
      console.error("Forgot Password Error:", err);
      console.error("Error Response:", err.response?.data);
      console.error("Error Status:", err.response?.status);

      let errorMessage = "Có lỗi xảy ra! Vui lòng thử lại.";

      if (err.response?.status === 404) {
        errorMessage =
          "Email không tồn tại trong hệ thống.\nVui lòng kiểm tra lại email.";
      } else if (err.response?.status === 500) {
        errorMessage =
          "Lỗi máy chủ (500).\nCó thể do email service không hoạt động. Vui lòng thử lại sau.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.Message) {
        errorMessage = err.response.data.Message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    }
  };

  // --- ĐỊNH NGHĨA ANIMATION ---

  // Variants cho container để stagger
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  // Variants cho các phần tử con
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", damping: 12, stiffness: 100 },
    },
  };

  // Variants cho hình ảnh
  const imageVariants = {
    hidden: { y: -30, opacity: 0 }, // Di chuyển ngược hướng
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.7, ease: "easeOut" },
    },
  };

  // Variants cho thông báo
  const alertVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
    shake: {
      x: [0, -8, 8, -8, 8, 0],
      transition: { duration: 0.4 },
    },
  };

  return (
    <Container
      fluid
      className="d-flex align-items-center justify-content-center p-3"
    >
      {/* Hiệu ứng fade-in và trôi lên cho toàn bộ card */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        style={{ maxWidth: "900px", width: "100%" }}
      >
        <Card
          className="shadow-lg"
          style={{ border: "none", overflow: "hidden", borderRadius: "15px" }}
        >
          <Row className="g-0">
            {/* Cột Form */}
            <Col
              xs={12}
              md={6}
              className="d-flex flex-column justify-content-center"
            >
              <motion.div
                className="p-4 p-md-5"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.h2
                  variants={itemVariants}
                  className="text-center mb-4 fw-bold"
                  style={{ color: "#155E64" }}
                >
                  Quên Mật Khẩu
                </motion.h2>
                <motion.p
                  variants={itemVariants}
                  className="text-center text-muted mb-4"
                >
                  Vui lòng nhập email đã đăng ký để nhận liên kết đặt lại mật
                  khẩu.
                </motion.p>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      key="error"
                      variants={alertVariants}
                      initial="initial"
                      animate={["animate", "shake"]}
                      exit="exit"
                    >
                      <Alert
                        variant="danger"
                        style={{ whiteSpace: "pre-line" }}
                      >
                        {error}
                      </Alert>
                    </motion.div>
                  )}
                  {message && (
                    <motion.div
                      key="success"
                      variants={alertVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <Alert variant="success">{message}</Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Form onSubmit={handleSubmit}>
                  <motion.div variants={itemVariants}>
                    <Form.Group className="mb-3">
                      <InputGroup>
                        <InputGroup.Text>
                          <FaEnvelope />
                        </InputGroup.Text>
                        <Form.Control
                          disabled={loading}
                          type="email"
                          placeholder="Nhập email của bạn"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          onInvalid={(e) =>
                            e.target.setCustomValidity(
                              "Vui lòng không để trống"
                            )
                          }
                          onInput={(e) => e.target.setCustomValidity("")}
                        />
                      </InputGroup>
                    </Form.Group>
                  </motion.div>

                  {/* Removed phone number field per BE contract: only Email is required */}

                  <motion.div variants={itemVariants}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        type="submit"
                        className="w-100"
                        disabled={loading}
                        style={{
                          backgroundColor: "#48C1A6",
                          border: "none",
                          padding: "10px",
                          fontWeight: "600",
                          minHeight: "45px",
                        }}
                      >
                        {loading ? (
                          <CircularProgress
                            size={22}
                            thickness={4}
                            sx={{ color: "white" }}
                          />
                        ) : (
                          "Xác nhận"
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>
                </Form>

                <motion.div
                  variants={itemVariants}
                  className="text-center mt-4"
                >
                  <a
                    href="/login-staff"
                    className="text-decoration-none fw-bold"
                    style={{ color: "#155E64" }}
                  >
                    Quay lại Đăng nhập
                  </a>
                </motion.div>
              </motion.div>
            </Col>

            {/* Cột Hình ảnh */}
            <Col md={6} className="d-none d-md-block p-0">
              <motion.div
                variants={imageVariants}
                initial="hidden"
                animate="visible"
                style={{ height: "100%" }}
              >
                <Card.Img
                  src={"/images/login_image.png"}
                  alt="Forgot Password"
                  style={{ objectFit: "cover", height: "100%" }}
                />
              </motion.div>
            </Col>
          </Row>
        </Card>
      </motion.div>
    </Container>
  );
};

export default ForgotPasswordStaff;

