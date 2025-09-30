import React, { useState, useEffect } from "react";
import { Button, Modal, Form, Alert } from "react-bootstrap";
import axios from "axios";

const EditUserModal = ({ user, closeModal, users, setUsers }) => {
    const [salary, setSalary] = useState(0);
    const [type, setType] = useState("parttime");
    const [workDays, setWorkDays] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (user) {
            setSalary(user.salary || 0);
            setType(user.type || "parttime");
            setWorkDays(user.schedule?.workDays || []);
            if (user.type === "fulltime") {
                setShifts(["8:00AM - 17:00PM"]);
            } else {
                setShifts(user.schedule?.shifts || []);
            }
        }
    }, [user]);

    const toggleWorkDay = (day) => {
        setWorkDays((prevDays) =>
            prevDays.includes(day)
                ? prevDays.filter((d) => d !== day)
                : [...prevDays, day]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (workDays.length === 0) {
            setErrorMessage("Vui lòng chọn ít nhất một ngày làm việc.");
            return;
        }
        if (shifts.length === 0) {
            setErrorMessage("Vui lòng chọn ít nhất một ca làm việc.");
            return;
        }

        try {
            await axios.put(`http://localhost:9999/users/update-user/${user._id}`, {
                salary,
                type,
                workDays,
                shifts,
            });

            setUsers((prevUsers) =>
                prevUsers.map((u) =>
                    u._id === user._id
                        ? { ...u, salary, type, schedule: { ...u.schedule, workDays, shifts } }
                        : u
                )
            );
            setSuccessMessage("Cập nhật thông tin thành công!");
            setErrorMessage("");
            setTimeout(() => {
                setSuccessMessage("");
                closeModal();
            }, 2000);
        } catch (error) {
            console.error("Lỗi cập nhật thông tin người dùng:", error);
        }
    };

    return (
        <Modal show={!!user} onHide={closeModal} centered>
            <Modal.Header closeButton>
                <Modal.Title>Chỉnh sửa thông tin</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {successMessage && <Alert variant="success">{successMessage}</Alert>}
                {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Mức lương</Form.Label>
                        <Form.Control
                            type="number"
                            value={salary}
                            onChange={(e) => setSalary(e.target.value)}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Loại nhân viên</Form.Label>
                        <Form.Select value={type} onChange={(e) => setType(e.target.value)}>
                            <option value="fulltime">Toàn thời gian</option>
                            <option value="parttime">Bán thời gian</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Ngày làm việc <span style={{ color: 'red' }}>*</span></Form.Label>
                        <div className="d-flex flex-wrap gap-2">
                            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, index) => (
                                <div
                                    key={day}
                                    className={`px-3 py-2 border rounded cursor-pointer ${workDays.includes(day) ? 'bg-success text-white' : ''}`}
                                    onClick={() => toggleWorkDay(day)}
                                >
                                    {["T2", "T3", "T4", "T5", "T6", "T7", "CN"][index]}
                                </div>
                            ))}
                        </div>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Ca làm việc <span style={{ color: 'red' }}>*</span></Form.Label>
                        {type === "fulltime" ? (
                            <div className="fw-bold">8:00AM - 17:00PM</div>
                        ) : (
                            <div className="d-flex gap-3">
                                {["Morning", "Afternoon", "Evening"].map((shift) => (
                                    <Form.Check
                                        key={shift}
                                        type="radio"
                                        label={shift === "Morning" ? "Sáng" : shift === "Afternoon" ? "Chiều" : "Tối"}
                                        name="shifts"
                                        value={shift}
                                        checked={shifts.includes(shift)}
                                        onChange={() => setShifts([shift])}
                                    />
                                ))}
                            </div>
                        )}
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={closeModal}>Hủy</Button>
                <Button variant="primary" type="submit" onClick={handleSubmit}>Lưu thay đổi</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EditUserModal;
