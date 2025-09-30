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
import { FaUser, FaEnvelope, FaPhone, FaLock } from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Import các thành phần cần thiết từ Framer Motion
import { motion, AnimatePresence } from "framer-motion";

const Register = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (password !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp!");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:9999/authentication/register",
        { fullName, email, phoneNumber, password, confirmPassword }
      );

      if (response.status === 201) {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 1000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Đăng ký thất bại!");
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
        ease: [0.6, -0.05, 0.01, 0.99] // Hiệu ứng ease-out-back
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
        transition: { duration: 0.5 }
    }
  };

  return (
    <Container
      fluid
      className="vh-100 d-flex align-items-center justify-content-center p-3"
      style={{
        background: "url('/images/backgroundLogin.jpg') no-repeat center center / cover",
      }}
    >
      {/* Hiệu ứng lật trang cho toàn bộ card */}
      <motion.div
        initial={{ opacity: 0, rotateY: -90 }}
        animate={{ opacity: 1, rotateY: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ maxWidth: '900px', width: '100%', perspective: '1000px' }}
      >
        <Card className="shadow-lg" style={{ border: 'none', overflow: 'hidden', borderRadius: '15px' }}>
          <Row className="g-0">
            {/* Cột Form */}
            <Col xs={12} md={6} className="d-flex flex-column justify-content-center">
              <motion.div
                className="p-4 p-md-5"
                variants={formContainerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.h2 variants={inputVariants} className="text-center mb-4 fw-bold" style={{ color: '#155E64' }}>
                  Tạo Tài Khoản
                </motion.h2>

                <AnimatePresence>
                  {error && (
                    <motion.div key="error" variants={alertVariants} initial="initial" animate={["animate", "shake"]} exit="exit">
                      <Alert variant="danger">{error}</Alert>
                    </motion.div>
                  )}
                  {success && (
                    <motion.div key="success" variants={alertVariants} initial="initial" animate="animate" exit="exit">
                      <Alert variant="success">Đăng ký thành công! Đang chuyển hướng...</Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Form onSubmit={handleSubmit}>
                    {/* Các Form.Group được bọc trong motion.div */}
                    <motion.div variants={inputVariants}>
                      <Form.Group className="mb-3">
                        <InputGroup>
                          <InputGroup.Text><FaUser /></InputGroup.Text>
                          <Form.Control type="text" placeholder="Họ và tên" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                        </InputGroup>
                      </Form.Group>
                    </motion.div>

                    <motion.div variants={inputVariants}>
                      <Form.Group className="mb-3">
                        <InputGroup>
                          <InputGroup.Text><FaEnvelope /></InputGroup.Text>
                          <Form.Control type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </InputGroup>
                      </Form.Group>
                    </motion.div>

                    <motion.div variants={inputVariants}>
                      <Form.Group className="mb-3">
                        <InputGroup>
                          <InputGroup.Text><FaPhone /></InputGroup.Text>
                          <Form.Control type="tel" placeholder="Số điện thoại" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
                        </InputGroup>
                      </Form.Group>
                    </motion.div>
                    
                    <motion.div variants={inputVariants}>
                      <Form.Group className="mb-3">
                        <InputGroup>
                          <InputGroup.Text><FaLock /></InputGroup.Text>
                          <Form.Control type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </InputGroup>
                      </Form.Group>
                    </motion.div>
                    
                    <motion.div variants={inputVariants}>
                      <Form.Group className="mb-4">
                        <InputGroup>
                          <InputGroup.Text><FaLock /></InputGroup.Text>
                          <Form.Control type="password" placeholder="Nhập lại mật khẩu" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                        </InputGroup>
                      </Form.Group>
                    </motion.div>
                  
                  <motion.div variants={inputVariants}>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button type="submit" className="w-100" style={{ backgroundColor: "#48C1A6", border: "none", padding: '10px', fontWeight: "600" }}>
                        Đăng ký
                      </Button>
                    </motion.div>
                  </motion.div>
                </Form>
                 <motion.div variants={inputVariants} className="text-center mt-4">
                  <span className="text-muted">Đã có tài khoản? </span>
                  <a href="/login" className="text-decoration-none fw-bold" style={{ color: '#155E64' }}>
                    Đăng nhập ngay
                  </a>
                </motion.div>
              </motion.div>
            </Col>

            {/* Cột Hình ảnh */}
            <Col md={6} className="d-none d-md-block p-0">
              <motion.div variants={imageVariants} initial="hidden" animate="visible" style={{ height: '100%' }}>
                <Card.Img
                  src={"/images/login_image.png"}
                  alt="Register"
                  style={{ objectFit: "cover", height: '100%' }}
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