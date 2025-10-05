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
  Modal,
} from "react-bootstrap";
import { FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import useUser from "../../Hooks/useUser";

// Import các thành phần cần thiết từ Framer Motion
import { motion, AnimatePresence } from "framer-motion";

function ChangePassword() {
  const navigate = useNavigate();
  const { changePassword } = useUser();
  const [form, setForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsError(false);
    setStatusMessage("");

    // Validation
    if (form.newPassword !== form.confirmPassword) {
      setIsError(true);
      setStatusMessage("Mật khẩu mới và xác nhận mật khẩu không khớp!");
      return;
    }

    if (form.newPassword.length < 6) {
      setIsError(true);
      setStatusMessage("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    try {
      const response = await changePassword(form);
      if (response) {
        setStatusMessage(response.message || "Đổi mật khẩu thành công!");
        setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => {navigate("/profile");}, 3000);
      }
    } catch (error) {
      setIsError(true);
      setStatusMessage(error.message || "Lỗi khi thay đổi mật khẩu.");
    }
  };

  // --- ĐỊNH NGHĨA ANIMATION ---
  
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
      transition: { type: 'spring', stiffness: 100 }
    },
  };
  
  // Variants cho hình ảnh bên phải
  const imageVariants = {
      hidden: { x: 100, opacity: 0},
      visible: { x: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut"}}
  }
  
  // Variants cho thông báo lỗi/thành công
  const alertVariants = {
    initial: { opacity: 0, y: -20, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, x: -100 },
    // Hiệu ứng rung cho lỗi
    shake: {
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.5 }
    }
  };

  return (
    <>
      <Container
        fluid
        className="vh-100 d-flex align-items-center justify-content-center p-3"
        style={{
          background: "url('/images/backgroundLogin.jpg') no-repeat center center / cover",
        }}
      >
        {/* Bọc Card trong motion.div để có hiệu ứng xuất hiện ban đầu */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ maxWidth: '900px', width: '100%' }}
        >
          <Card className="shadow-lg" style={{ border: 'none', overflow: 'hidden', borderRadius: '15px' }}>
            <Row className="g-0">
              {/* Cột Form */}
              <Col xs={12} md={6} className="d-flex flex-column justify-content-center">
                {/* Bọc Card.Body bằng motion.div để áp dụng stagger animation */}
                <motion.div
                  className="p-4 p-md-5"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.h2 variants={itemVariants} className="text-center mb-4 fw-bold" style={{ color: '#155E64' }}>
                    Đổi Mật Khẩu
                  </motion.h2>

                  {/* Sử dụng AnimatePresence để tạo hiệu ứng exit cho Alert */}
                  <AnimatePresence>
                    {statusMessage && (
                      <motion.div
                        key="message"
                        variants={alertVariants}
                        initial="initial"
                        animate={isError ? ["animate", "shake"] : "animate"}
                        exit="exit"
                      >
                        <Alert variant={isError ? "danger" : "success"}>{statusMessage}</Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Form onSubmit={handleSubmit}>
                    <motion.div variants={itemVariants}>
                      <Form.Group className="mb-3">
                        <InputGroup>
                          <InputGroup.Text><FaLock /></InputGroup.Text>
                          <Form.Control 
                            type={showPasswords.oldPassword ? "text" : "password"} 
                            placeholder="Nhập mật khẩu cũ" 
                            name="oldPassword"
                            value={form.oldPassword} 
                            onChange={handleChange} 
                            required 
                          />
                          <InputGroup.Text 
                            style={{ cursor: 'pointer' }}
                            onClick={() => togglePasswordVisibility('oldPassword')}
                          >
                            {showPasswords.oldPassword ? <FaEyeSlash /> : <FaEye />}
                          </InputGroup.Text>
                        </InputGroup>
                      </Form.Group>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <Form.Group className="mb-3">
                        <InputGroup>
                          <InputGroup.Text><FaLock /></InputGroup.Text>
                          <Form.Control 
                            type={showPasswords.newPassword ? "text" : "password"} 
                            placeholder="Nhập mật khẩu mới" 
                            name="newPassword"
                            value={form.newPassword} 
                            onChange={handleChange} 
                            required 
                          />
                          <InputGroup.Text 
                            style={{ cursor: 'pointer' }}
                            onClick={() => togglePasswordVisibility('newPassword')}
                          >
                            {showPasswords.newPassword ? <FaEyeSlash /> : <FaEye />}
                          </InputGroup.Text>
                        </InputGroup>
                      </Form.Group>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <Form.Group className="mb-4">
                        <InputGroup>
                          <InputGroup.Text><FaLock /></InputGroup.Text>
                          <Form.Control 
                            type={showPasswords.confirmPassword ? "text" : "password"} 
                            placeholder="Nhập lại mật khẩu mới" 
                            name="confirmPassword"
                            value={form.confirmPassword} 
                            onChange={handleChange} 
                            required 
                          />
                          <InputGroup.Text 
                            style={{ cursor: 'pointer' }}
                            onClick={() => togglePasswordVisibility('confirmPassword')}
                          >
                            {showPasswords.confirmPassword ? <FaEyeSlash /> : <FaEye />}
                          </InputGroup.Text>
                        </InputGroup>
                      </Form.Group>
                    </motion.div>

                    <motion.div variants={itemVariants} className="d-flex justify-content-between align-items-center gap-1">
                      <Button 
                        variant="outline-secondary" 
                        onClick={() => navigate("/profile")}
                        style={{ color: '#155E64', borderColor: '#155E64', padding: '10px 20px' }}
                      >
                        Quay lại
                      </Button>
                      {/* Bọc Button trong motion.div để có hiệu ứng hover/tap */}
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button type="submit" style={{ backgroundColor: "#48C1A6", border: "none", padding: '10px 70px' }}>
                          Đổi mật khẩu
                        </Button>
                      </motion.div>
                    </motion.div>
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
                   style={{height: '100%'}}
                >
                  <Card.Img src={"/images/login_image.jpg"} alt="Change Password" style={{ objectFit: "cover", height: '100%' }}/>
                </motion.div>
              </Col>
            </Row>
          </Card>
        </motion.div>
      </Container>

      {/* Modal xác nhận */}
      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận thay đổi mật khẩu</Modal.Title>
        </Modal.Header>
        <Modal.Body>Bạn có chắc chắn muốn thay đổi mật khẩu?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleConfirm}>
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default ChangePassword;
