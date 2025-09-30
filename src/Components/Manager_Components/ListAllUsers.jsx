//list
import React, { useEffect, useState } from "react";
import { Table, Container, Alert, Card, Button, Form } from "react-bootstrap";
import axios from "axios";
import { FaEdit, FaBan } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import EditUserModal from "./EditUserModal";

const ListAllUsers = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState({ "Hoạt động": false, "Ngừng hoạt động": false, "Bị ban": false });
    const [filterType, setFilterType] = useState("");
    //luu thong tin ng dung dang chinh sua
    const [editingUser, setEditingUser] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get("http://localhost:9999/users/get-all-user");
                setUsers(response.data);
            } catch (error) {
                setError("Không thể tải dữ liệu danh sách các người dùng.");
            }
        };
        fetchUsers();
    }, []);
    //cập nhật trạng thái
    const handleUpdateStatus = async (id, newStatus) => {
        try {
            await axios.put(`http://localhost:9999/users/banUser/${id}`, { status: newStatus });
            const newUser = users.map(u => u._id === id ? { ...u, status: newStatus } : u);
            setUsers(newUser);
        } catch (error) {
            console.log("Lỗi khi cập nhật trạng thái:", error);
        }
    };
    const handleFilterChange = (e) => {
        setFilterStatus({ ...filterStatus, [e.target.name]: e.target.checked });
    };

    const filteredUsers = users.filter(user =>
        user.role !== "manager" &&
        user.fullName.toLowerCase().includes(search.toLowerCase()) &&
        (Object.values(filterStatus).some(value => value)
            ? filterStatus[user.status === "active" ? "Hoạt động" : user.status === "banned" ? "Bị ban" : "Chưa hoạt động"]
            : true) &&
        (filterType ? user.type === filterType : true)
    );
    return (
        <Container className="mt-4">
            {error || users.length === 0 ? (
                <Alert variant="danger" className="text-center">Không thể tải danh sách người dùng</Alert>
            ) : (
                <Card className="shadow-sm p-3 mt-3" style={{ backgroundColor: "#A8E6CF" }}>
                    <Card.Body>

                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <Form className="d-flex gap-2 align-items-center">
                                <Form.Control
                                    type="text"
                                    placeholder="Tìm kiếm ..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ maxWidth: "200px" }}
                                />
                                <Form.Select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    style={{ maxWidth: "150px" }}
                                >
                                    <option value="">Tất cả</option>
                                    <option value="fulltime">Toàn thời gian</option>
                                    <option value="parttime">Bán thời gian</option>
                                </Form.Select>
                                <div className="d-flex gap-2">
                                    {["Hoạt động", "Chưa hoạt động", "Bị ban"].map((status) => (
                                        <Form.Check
                                            key={status}
                                            type="checkbox"
                                            label={status}
                                            name={status}
                                            checked={filterStatus[status]}
                                            onChange={handleFilterChange}
                                        />
                                    ))}
                                </div>
                            </Form>
                            <Button variant="primary" onClick={() => navigate("/manager/create-employee")}>
                                + Tạo nhân viên
                            </Button>
                        </div>

                        {/* Bảng dữ liệu */}
                        <div style={{ overflowY: 'auto', maxHeight: '500px' }}>
                        <Table striped bordered hover responsive className="text-center" style={{ width: "100%", tableLayout: "fixed" }}>
                            <thead style={{ backgroundColor: "#A8E6CF", position: "sticky", top: 0, zIndex: 1 }}>
                                <tr>
                                    <th>#</th>
                                    <th>Tên đầy đủ</th>
                                    <th>Giới tính</th>
                                    <th>Email</th>
                                    <th>Số điện thoại</th>
                                    <th>Địa chỉ</th>
                                    <th>Mức lương/1h</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user, index) => (
                                        <React.Fragment key={index}>
                                            <tr>
                                                <td>{index + 1}</td>
                                                <td className="text-start">
                                                    {user.fullName}
                                                    <div className="text-muted" style={{ fontSize: "0.85rem" }}>
                                                        {user.type === "fulltime" ? "Toàn thời gian" : "Bán thời gian"}
                                                    </div>
                                                    <div className={user.status.toLowerCase() === "active" ? "text-success" : "text-danger"} style={{ fontSize: "0.85rem" }}>
                                                        {user.status === "active" ? "Hoạt động" : user.status === "banned" ? "Đã bị ban !" : "Không hoạt động, Người dùng này chưa xác thực"}
                                                    </div>
                                                </td>
                                                <td>{user.profile.gender === "male" ? "Nam" : "Nữ"}</td>
                                                <td>{user.account.email}</td>
                                                <td>{user.profile.phoneNumber}</td>
                                                <td>{user.profile.address}</td>
                                                <td>{Math.ceil(user.salary).toLocaleString("en-US")} VND</td>
                                                <td>
                                                    <div className="d-flex align-items-center justify-content-center gap-1">
                                                        <Button variant="warning" size="sm" onClick={() => setEditingUser(user)} style={{ opacity: user.status === "inactive" || user.status === "banned" ? 0.5 : 1, padding: "2px 6px", fontSize: "0.8rem" }} disabled={user.status === "inactive" || user.status === "banned"}>
                                                            <FaEdit /> Sửa
                                                        </Button>
                                                        {user.status === "active" ? (
                                                            <Button variant="danger" size="sm" onClick={() => handleUpdateStatus(user._id, "banned")} disabled={user.status === "inactive"} style={{ padding: "2px 6px", fontSize: "0.8rem" }}>
                                                                <FaBan /> Ban
                                                            </Button>
                                                        ) : user.status === "banned" ? (
                                                            <Button variant="success" size="sm" onClick={() => handleUpdateStatus(user._id, "active")} disabled={user.status === "inactive"} style={{ padding: "2px 6px", fontSize: "0.8rem" }} >
                                                                Bỏ ban
                                                            </Button>
                                                        ) : (
                                                            <Button variant="danger" size="sm" disabled style={{ padding: "2px 6px", fontSize: "0.8rem" }} >
                                                                <FaBan /> Ban
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>

                                            </tr>
                                            <tr>
                                                <td colSpan="8" className="text-start" style={{ fontSize: "0.85rem" }}>
                                                    <strong>Ngày làm việc:</strong> {user.schedule.workDays.map(day => ({ "Monday": "T2", "Tuesday": "T3", "Wednesday": "T4", "Thursday": "T5", "Friday": "T6", "Saturday": "T7", "Sunday": "CN" }[day])).join(", ")}
                                                    <br />
                                                    <strong>Ca làm việc:</strong> {user.type === "parttime" ? user.schedule.shifts.map(day => ({ "Morning": "Sáng: 8:00 - 11:00", "Afternoon": "Chiều: 13:00 - 17:00", "Evening": "Tối: 17:00 - 21:00" }[day])).join(", ") : "Từ 8:00AM tới 17:00PM"}
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="text-center">Không tìm thấy người dùng nào</td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                        </div>
                    </Card.Body>
                </Card>
            )}
            <EditUserModal
                //truyen du lieu nguoi dung vao modalmodal
                user={editingUser}
                closeModal={() => setEditingUser(null)}
                //cap nhat danh sach nguoi dung sau khi chinh suasua
                users={users}
                setUsers={setUsers}
            />
        </Container>
    );

};
export default ListAllUsers;
