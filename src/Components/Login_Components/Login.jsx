import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Alert,
  InputGroup,
  Card,
} from "react-bootstrap";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../App"; // Dùng context dùng chung cho toàn app
import getUserRoleFromToken from "../../Utils/getUserRoleFromToken.jsx";
// Import các thành phần cần thiết từ Framer Motion
import { motion, AnimatePresence } from "framer-motion";
import { CircularProgress } from "@mui/material";

const Login = ({ mode = "customer" }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [showPassword, setShowPassword] = useState(false);
  const { login, loginStaff } = useAuthContext();
  const [loading, setLoading] = useState(false);
  // Hiển thị thông báo sau khi bị force logout
  const notice = history.state && history.state.usr && history.state.usr.notice;
  const isStaffLogin = mode === "staff";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);
    try {
      const handler = isStaffLogin && loginStaff ? loginStaff : login;
      const response = await handler({ email, password });
      if (response) {
        const { token } = response;
        localStorage.setItem("authToken", token);

        // Chặn đăng nhập sai cổng
        const roleFromToken = getUserRoleFromToken();
        if (!isStaffLogin && roleFromToken !== "customer") {
          localStorage.removeItem("authToken");
          setLoading(false);
          setError("Email hoặc mật khẩu không chính xác");
          return;
        }
        if (isStaffLogin && roleFromToken === "customer") {
          localStorage.removeItem("authToken");
          setLoading(false);
          setError("Email hoặc mật khẩu không chính xác");
          return;
        }

        setSuccess(true);
        setTimeout(() => navigate("/"), 3000);
      }
    } catch (err) {
      setLoading(false);
      const backendMsg = err.response?.data?.message || "";
      const normalized = backendMsg.toLowerCase();

      // Staff login: luôn hiển thị thông báo chung
      if (isStaffLogin) {
        setError("Email hoặc mật khẩu không chính xác");
        return;
      }

      if (normalized.includes("không tồn tại") || normalized.includes("not exist")) {
        setError("Tài khoản không tồn tại");
        return;
      }
      if (
        normalized.includes("mật khẩu") ||
        normalized.includes("password") ||
        err.response?.status === 401
      ) {
        setError("Email hoặc mật khẩu không chính xác");
        return;
      }

      setError(backendMsg || "Đăng nhập thất bại!");
    }
  };

  // --- BẮT ĐẦU ĐỊNH NGHĨA ANIMATION ---

  // Variants cho container chính để điều khiển stagger effect
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // Mỗi phần tử con sẽ xuất hiện cách nhau 0.1s
      },
    },
  };

  // Variants cho các phần tử con (tiêu đề, input, button)
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  // Variants cho hình ảnh bên phải
  const imageVariants = {
    hidden: { x: 100, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  // Variants cho thông báo lỗi/thành công
  const alertVariants = {
    initial: { opacity: 0, y: -20, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, x: -100 },
    // Hiệu ứng rung cho lỗi
    shake: {
      x: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.5 },
    },
  };

  // --- KẾT THÚC ĐỊNH NGHĨA ANIMATION ---

  return (
    <Container
      fluid
      className="d-flex align-items-center justify-content-center p-3"
    >
      {/* Bọc Card trong motion.div để có hiệu ứng xuất hiện ban đầu */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
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
              {/* Bọc Card.Body bằng motion.div để áp dụng stagger animation */}
              <motion.div
                className="p-4 p-md-5"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.h2
                  variants={itemVariants}
                  className="text-center mb-3 fw-bold"
                  style={{ color: "#155E64" }}
                >
                  {isStaffLogin ? "Đăng nhập hệ thống" : "Đăng Nhập"}
                </motion.h2>
                {isStaffLogin && (
                  <motion.p
                    variants={itemVariants}
                    className="text-center text-muted mb-4"
                    style={{ fontSize: "0.95rem" }}
                  >
                    Đăng nhập với tư cách quản trị viên hoặc nhân viên
                  </motion.p>
                )}

                {/* Sử dụng AnimatePresence để tạo hiệu ứng exit cho Alert */}
                <AnimatePresence>
                  {notice && (
                    <motion.div
                      key="notice"
                      variants={alertVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <Alert variant="warning">{notice}</Alert>
                    </motion.div>
                  )}
                  {error && (
                    <motion.div
                      key="error"
                      variants={alertVariants}
                      initial="initial"
                      animate={["animate", "shake"]}
                      exit="exit"
                    >
                      <Alert variant="danger">{error}</Alert>
                    </motion.div>
                  )}
                  {success && (
                    <motion.div
                      key="success"
                      variants={alertVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <Alert variant="success">
                        Đăng nhập thành công! Chuyển hướng...
                      </Alert>
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
                          type="email"
                          placeholder="Nhập email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          onInvalid={(e) => {
                            if (!e.target.value) {
                              e.target.setCustomValidity(
                                "Vui lòng không để trống"
                              );
                            } else {
                              e.target.setCustomValidity(
                                "Vui lòng nhập đúng email"
                              );
                            }
                          }}
                          onInput={(e) => e.target.setCustomValidity("")}
                        />
                      </InputGroup>
                    </Form.Group>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Form.Group className="mb-4">
                      <InputGroup>
                        <InputGroup.Text>
                          <FaLock />
                        </InputGroup.Text>
                        <Form.Control
                          type={showPassword ? "text" : "password"}
                          placeholder="Nhập mật khẩu"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          onInvalid={(e) =>
                            e.target.setCustomValidity(
                              "Vui lòng không để trống"
                            )
                          }
                          onInput={(e) => e.target.setCustomValidity("")}
                        />
                        <InputGroup.Text
                          style={{ cursor: "pointer" }}
                          onClick={() => setShowPassword((s) => !s)}
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </InputGroup.Text>
                      </InputGroup>
                    </Form.Group>
                  </motion.div>

                  <motion.div
                    variants={itemVariants}
                    className="d-flex justify-content-between align-items-center gap-3 flex-wrap"
                  >
                    <a
                      href="/forgot-password"
                      className="text-decoration-none"
                      style={{ color: "#155E64" }}
                    >
                      Quên mật khẩu?
                    </a>
                    {/* Bọc Button trong motion.div để có hiệu ứng hover/tap */}
                    <motion.div
                      className="d-inline-block"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        type="submit"
                        disabled={loading}
                        style={{
                          backgroundColor: "#48C1A6",
                          border: "none",
                          padding: "10px 25px",
                          minWidth: "120px",
                        }}
                      >
                        {loading ? (
                          <CircularProgress
                            size={22}
                            thickness={4}
                            sx={{
                              color: "white",
                            }}
                          />
                        ) : (
                          "Đăng nhập"
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>

                  {!isStaffLogin && (
                    <motion.div
                      variants={itemVariants}
                      className="text-center mt-5"
                    >
                      <span className="text-muted">Chưa có tài khoản? </span>
                      <a
                        href="/register"
                        className="text-decoration-none fw-bold"
                        style={{ color: "#155E64" }}
                      >
                        Đăng ký ngay
                      </a>
                    </motion.div>
                  )}
                </Form>
              </motion.div>
            </Col>

            {/* Cột Hình ảnh */}
            <Col md={6} className="d-none d-md-block">
              {/* Bọc Card.Img trong motion.div để tạo hiệu ứng */}
              <motion.div
                variants={imageVariants}
                initial="hidden"
                animate="visible"
                style={{ height: "100%" }}
              >
                <Card.Img
                  src={"/images/login_image.png"}
                  alt="Login"
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

export default Login;
