import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Alert,
  Card,
} from "react-bootstrap";
import axios from "axios";

function CreateEmployee() {
  const [data, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    avatar: "",
    dob: "",
    address: "",
    gender: "male",
    idCard: "",
    salary: "",
    role: "employee",
    type: "",
    workDays: [],
    shifts: [],
    startTime: "",
    endTime: "",
  });

  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...data, [name]: value });
  };

  useEffect(() => {
    if (data.type === "fulltime") {
      setFormData((prev) => ({
        ...prev,
        startTime: "08:00",
        endTime: "17:00",
      }));
    }
  }, [data.type]);

  // Chọn ngày làm viêjc
  const toggleWorkDay = (day) => {
    setFormData((prevData) => {
      const updatedDays = prevData.workDays.includes(day)
        ? prevData.workDays.filter((d) => d !== day)
        : [...prevData.workDays, day];
      return { ...prevData, workDays: updatedDays };
    });
  };

  console.log(data);
  // Ham tinh tuoi
  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const month = today.getMonth() - birthDate.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsError(false);
    setStatusMessage("");

    // Kiem tra xem nguoi dung co du 18 tuoi khong
    if (data.dob && calculateAge(data.dob) < 18) {
      setStatusMessage('Nhân viên chưa đủ 18 tuổi');
      setIsError(true);
      return;
    }
    //kiểm tra căn cước đủ 12 số không
    if (data.idCard.length !== 12) {
      setStatusMessage('CMND chưa đủ 12 số');
      setIsError(true);
      return;
    }
    //kiểm tra tên nhân viên
    if (data.fullName.trim().length === 0) {
      setStatusMessage('Vui lòng nhập tên nhân viên');
      setIsError(true);
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:9999/users/add-employee",
        data
      );
      setStatusMessage(response.data.message);
    } catch (error) {
      setIsError(true);
      const errorMessage =
        error.response?.data?.message || "An error occurred!";
      setStatusMessage(errorMessage);
    }
  };

  const handleSalaryChange = (e) => {
    const value = Math.max(0, e.target.value);
    setFormData({ ...data, salary: value });
  };

  return (
    <div
      style={{
        background:
          "url('/images/backgroundLogin.jpg') no-repeat center center / cover",
        minHeight: "100vh",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Container>
        <Button
          variant="link"
          style={{
            alignSelf: "flex-start",
            color: "#48C1A6",
            fontSize: "20px",
          }}
        >
          <Link to="/manager/get-all-user">Trở về danh sách nhân viên</Link>
        </Button>
      </Container>
      <Container className="mt-3 d-flex justify-content-center">
        <Card
          className="p-4 shadow-lg"
          style={{
            maxWidth: "1000px",
            width: "100%",
            borderRadius: "12px",
            backgroundColor: "white",
          }}
        >
          <Row className="mb-4">
            <Col
              md={3}
              className="d-flex flex-column align-items-center"
              style={{
                backgroundColor: "#7BD1C2",
                borderRadius: "12px",
                height: "100%",
              }}
            >
              <img
                src="https://res.cloudinary.com/ds9p5t0mx/image/upload/v1740308752/avatar-default-icon-1975x2048-2mpk4u9k_fjciku.png"
                alt="Avatar"
                style={{
                  width: "180px",
                  height: "180px",
                  borderRadius: "50%",
                  margin: "40px 0",
                }}
              />
            </Col>
            <Col md={9}>
              <h2 className="mb-4">Tạo mới nhân viên</h2>
              {statusMessage && (
                <Alert variant={isError ? "danger" : "success"}>
                  {statusMessage}
                </Alert>
              )}
              <Form onSubmit={handleSubmit}>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group controlId="formFullName">
                      <Form.Label>
                        Họ Tên <span style={{ color: "red" }}>*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="fullName"
                        value={data.fullName}
                        onChange={handleChange}
                        required
                        style={{ borderColor: "#48C1A6" }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="formEmail">
                      <Form.Label>
                        Email<span style={{ color: "red" }}>*</span>
                      </Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={data.email}
                        onChange={handleChange}
                        required
                        style={{ borderColor: "#48C1A6" }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group controlId="formPhoneNumber">
                      <Form.Label>
                        Số điện thoại<span style={{ color: "red" }}>*</span>
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        name="phoneNumber"
                        value={data.phoneNumber}
                        onChange={handleChange}
                        pattern="[0-9]{10}" // Chỉ cho phép số điện thoại có 11 chữ số
                        required
                        style={{ borderColor: "#48C1A6" }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="formDob">
                      <Form.Label>
                        Ngày sinh<span style={{ color: "red" }}>*</span>
                      </Form.Label>
                      <Form.Control
                        type="date"
                        name="dob"
                        value={data.dob}
                        onChange={handleChange}
                        style={{ borderColor: "#48C1A6" }}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group controlId="formAddress">
                      <Form.Label>
                        Địa chỉ<span style={{ color: "red" }}>*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="address"
                        value={data.address}
                        onChange={handleChange}
                        style={{ borderColor: "#48C1A6" }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="formIdCard">
                      <Form.Label>
                        Số căn cước<span style={{ color: "red" }}>*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="idCard"
                        value={data.idCard}
                        onChange={handleChange}
                        style={{ borderColor: "#48C1A6" }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group controlId="formGender">
                      <Form.Label>
                        Giới tính<span style={{ color: "red" }}>*</span>
                      </Form.Label>
                      <Form.Select
                        name="gender"
                        value={data.gender}
                        onChange={handleChange}
                        style={{ borderColor: "#48C1A6" }}
                      >
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="formSalary">
                      <Form.Label>
                        Lương (VND)<span style={{ color: "red" }}>*</span>
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="salary"
                        value={data.salary}
                        onChange={handleSalaryChange}
                        min="0" // Prevent negative values
                        required
                        style={{ borderColor: "#48C1A6" }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>
                        Hợp đồng <span style={{ color: "red" }}>*</span>
                      </Form.Label>
                      <Form.Select
                        name="type"
                        value={data.type}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Chọn hợp đồng</option>
                        <option value="fulltime">Toàn thời gian</option>
                        <option value="parttime">Bán thời gian</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  {data.type && (
                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>
                            Ngày làm việc{" "}
                            <span style={{ color: "red" }}>*</span>
                          </Form.Label>
                          <div className="d-flex flex-wrap gap-2">
                            {[
                              "Monday",
                              "Tuesday",
                              "Wednesday",
                              "Thursday",
                              "Friday",
                              "Saturday",
                              "Sunday",
                            ].map((day, index) => (
                              <div
                                key={day}
                                className={`px-3 py-2 border rounded cursor-pointer ${data.workDays.includes(day)
                                  ? "bg-success text-white"
                                  : ""
                                  }`}
                                onClick={() => toggleWorkDay(day)}
                              >
                                {
                                  ["T2", "T3", "T4", "T5", "T6", "T7", "CN"][
                                  index
                                  ]
                                }
                              </div>
                            ))}
                          </div>
                        </Form.Group>
                      </Col>
                      {data.type === "fulltime" ? (
                        <>
                          <Col md={3}>
                            <Form.Group>
                              <Form.Label>
                                Giờ bắt đầu{" "}
                                <span style={{ color: "red" }}>*</span>
                              </Form.Label>
                              <Form.Control
                                type="time"
                                name="startTime"
                                value={data.startTime}
                                readOnly
                                required
                              />
                            </Form.Group>
                          </Col>
                          <Col md={3}>
                            <Form.Group>
                              <Form.Label>
                                Giờ kết thúc{" "}
                                <span style={{ color: "red" }}>*</span>
                              </Form.Label>
                              <Form.Control
                                type="time"
                                name="endTime"
                                value={data.endTime}
                                readOnly
                                required
                              />
                            </Form.Group>
                          </Col>
                        </>
                      ) : (
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>
                              Ca làm việc{" "}
                              <span style={{ color: "red" }}>*</span>
                            </Form.Label>
                            <div className="d-flex gap-3">
                              {["Morning", "Afternoon", "Evening"].map(
                                (shift) => (
                                  <Form.Check
                                    key={shift}
                                    type="radio"
                                    label={
                                      shift === "Morning"
                                        ? "Sáng"
                                        : shift === "Afternoon"
                                          ? "Chiều"
                                          : "Tối"
                                    }
                                    name="shifts"
                                    value={shift}
                                    checked={data.shifts.includes(shift)}
                                    onChange={() => {
                                      const newShifts = [shift];
                                      let startTime, endTime;

                                      // Set time based on the selected shift
                                      if (shift === "Morning") {
                                        startTime = "08:00";
                                        endTime = "11:00";
                                      } else if (shift === "Afternoon") {
                                        startTime = "13:00";
                                        endTime = "17:00";
                                      } else if (shift === "Evening") {
                                        startTime = "17:00";
                                        endTime = "21:00";
                                      }

                                      setFormData({
                                        ...data,
                                        shifts: newShifts,
                                        startTime, // Set startTime based on the shift
                                        endTime, // Set endTime based on the shift
                                      });
                                    }}
                                  />
                                )
                              )}
                            </div>
                          </Form.Group>
                          {data.shifts.length > 0 && (
                            <div>
                              <p>
                                <strong>Thời gian làm việc:</strong>
                              </p>
                              {data.shifts.includes("Morning") && (
                                <p>Sáng: 08:00 - 11:00</p>
                              )}
                              {data.shifts.includes("Afternoon") && (
                                <p>Chiều: 13:00 - 17:00</p>
                              )}
                              {data.shifts.includes("Evening") && (
                                <p>Tối: 17:00 - 21:00</p>
                              )}
                            </div>
                          )}
                        </Col>
                      )}
                    </Row>
                  )}
                </Row>
                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 mt-3"
                  style={{
                    backgroundColor: "#48C1A6",
                    borderColor: "#48C1A6",
                    padding: "10px 0",
                  }}
                >
                  Tạo nhân viên
                </Button>
              </Form>
            </Col>
          </Row>
        </Card>
      </Container>
    </div>
  );
}

export default CreateEmployee;
