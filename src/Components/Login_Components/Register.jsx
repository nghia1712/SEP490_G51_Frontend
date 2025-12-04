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
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaMapMarkerAlt,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import useAuth from "../../Hooks/useAuth";
import { CircularProgress } from "@mui/material";
// Import các thành phần cần thiết từ Framer Motion
import { motion, AnimatePresence } from "framer-motion";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validate số điện thoại VN
    if (phoneNumber && phoneNumber.trim() !== "") {
      const phoneRegex = /^0\d{9}$/;
      if (!phoneRegex.test(phoneNumber)) {
        setError("Số điện thoại VN+84 phải có 10 chữ số và bắt đầu bằng 0");
        return;
      }
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp!");
      return;
    }
    setLoading(true);
    try {
      console.log("Registering with data:", {
        username,
        fullName,
        email,
        phoneNumber,
        password,
        confirmPassword,
        address,
      });
      const response = await register({
        username,
        fullName,
        phoneNumber,
        email,
        password,
        confirmPassword,
        address,
      });
      console.log("Register response:", response);

      if (response) {
        setSuccess(true);
        // Chỉ hiển thị thông báo thành công, không chuyển hướng
        // Người dùng sẽ chuyển hướng sau khi xác thực email
      }
    } catch (err) {
      setLoading(false);
      console.error("Register Error:", err);
      console.error("Error Response:", err.response?.data);
      console.error("Error Status:", err.response?.status);

      let errorMessage = "Đăng ký thất bại! Vui lòng thử lại.";

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.Message) {
        errorMessage = err.response.data.Message;
      } else if (err.response?.data?.errors) {
        // Xử lý validation errors từ backend
        const validationErrors = err.response.data.errors;
        console.log("Validation errors:", validationErrors);

        if (typeof validationErrors === "object") {
          const errorMessages = Object.values(validationErrors).flat();
          console.log("Error messages:", errorMessages);
          errorMessage = errorMessages.join(", ");
        }
      } else if (err.response?.data?.title) {
        // Xử lý title từ backend validation
        errorMessage = err.response.data.title;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    }
  };

  // --- ĐỊNH NGHĨA ANIMATION ---

  // Variants cho form container để stagger
  const formContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  // Variants cho các trường input
  const inputVariants = {
    hidden: { x: -50, opacity: 0 },
    visible: { x: 0, opacity: 1 },
  };

  // Variants cho hình ảnh
  const imageVariants = {
    hidden: { scale: 1.2, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.7,
        ease: [0.6, -0.05, 0.01, 0.99], // Hiệu ứng ease-out-back
      },
    },
  };

  // Variants cho thông báo lỗi/thành công
  const alertVariants = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    shake: {
      x: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.5 },
    },
  };

  return (
    <Container
      fluid
      className="d-flex align-items-center justify-content-center p-3"
    >
      {/* Hiệu ứng lật trang cho toàn bộ card */}
      <motion.div
        initial={{ opacity: 0, rotateY: -90 }}
        animate={{ opacity: 1, rotateY: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ maxWidth: "950px", width: "100%", perspective: "1000px" }}
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
                className="p-3 p-md-4"
                variants={formContainerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.h2
                  variants={inputVariants}
                  className="text-center mb-3 fw-bold"
                  style={{ color: "#155E64" }}
                >
                  Tạo Tài Khoản
                </motion.h2>

                <AnimatePresence>
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
                        Đăng ký thành công! <br /> Bạn hãy check email để xác
                        thực tài khoản.
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Form onSubmit={handleSubmit}>
                  {/* Các Form.Group được bọc trong motion.div */}
                  <motion.div variants={inputVariants}>
                    <Form.Group className="mb-2">
                      <InputGroup>
                        <InputGroup.Text>
                          <FaUser />
                        </InputGroup.Text>
                        <Form.Control
                          disabled={loading}
                          type="text"
                          placeholder="Tên đăng nhập"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
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

                  <motion.div variants={inputVariants}>
                    <Form.Group className="mb-2">
                      <InputGroup>
                        <InputGroup.Text>
                          <FaUser />
                        </InputGroup.Text>
                        <Form.Control
                          disabled={loading}
                          type="text"
                          placeholder="Họ và tên"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
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

                  <motion.div variants={inputVariants}>
                    <Form.Group className="mb-2">
                      <InputGroup>
                        <InputGroup.Text>
                          <FaPhone />
                        </InputGroup.Text>
                        <Form.Control
                          disabled={loading}
                          type="tel"
                          placeholder="Số điện thoại"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
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

                  <motion.div variants={inputVariants}>
                    <Form.Group className="mb-2">
                      <InputGroup>
                        <InputGroup.Text>
                          <FaMapMarkerAlt />
                        </InputGroup.Text>
                        <Form.Control
                          disabled={loading}
                          type="text"
                          placeholder="Địa chỉ"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
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

                  <motion.div variants={inputVariants}>
                    <Form.Group className="mb-2">
                      <InputGroup>
                        <InputGroup.Text>
                          <FaEnvelope />
                        </InputGroup.Text>
                        <Form.Control
                          disabled={loading}
                          type="email"
                          placeholder="Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          onInvalid={(e) => {
                            if (e.target.validity.valueMissing) {
                              e.target.setCustomValidity(
                                "Vui lòng không để trống"
                              );
                            } else if (e.target.validity.typeMismatch) {
                              e.target.setCustomValidity(
                                "Vui lòng nhập đúng email"
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

                  <motion.div variants={inputVariants}>
                    <Form.Group className="mb-2">
                      <InputGroup>
                        <InputGroup.Text>
                          <FaLock />
                        </InputGroup.Text>
                        <Form.Control
                          disabled={loading}
                          type={showPw ? "text" : "password"}
                          placeholder="Mật khẩu"
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
                          onClick={() => setShowPw((s) => !s)}
                        >
                          {showPw ? <FaEyeSlash /> : <FaEye />}
                        </InputGroup.Text>
                      </InputGroup>
                    </Form.Group>
                  </motion.div>

                  <motion.div variants={inputVariants}>
                    <Form.Group className="mb-3">
                      <InputGroup>
                        <InputGroup.Text>
                          <FaLock />
                        </InputGroup.Text>
                        <Form.Control
                          disabled={loading}
                          type={showConfirm ? "text" : "password"}
                          placeholder="Nhập lại mật khẩu"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
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
                          onClick={() => setShowConfirm((s) => !s)}
                        >
                          {showConfirm ? <FaEyeSlash /> : <FaEye />}
                        </InputGroup.Text>
                      </InputGroup>
                    </Form.Group>
                  </motion.div>

                  <motion.div variants={inputVariants}>
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
                          "Đăng ký"
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>
                </Form>
                <motion.div
                  variants={inputVariants}
                  className="text-center mt-3"
                >
                  <span className="text-muted">Đã có tài khoản? </span>
                  <a
                    href="/login"
                    className="text-decoration-none fw-bold"
                    style={{ color: "#155E64" }}
                  >
                    Đăng nhập ngay
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
                  alt="Register"
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

export default Register;
