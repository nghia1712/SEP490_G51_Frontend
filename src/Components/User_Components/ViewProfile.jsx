import React, { useEffect, useState } from "react";
import { Container, Card, Row, Col, Button, Alert } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import useUser from "../../Hooks/useUser";
const Profile = () => {
	const navigate = useNavigate();
	const [profile, setProfile] = useState(null);
	const [error, setError] = useState(null);
	const { getProfile } = useUser();
	
	const getAvatarUrl = (avatarPath) => {
		if (!avatarPath) return "/images/avatar/image1.png"; // ưu tiên hiển thị ảnh avatar mới thêm trong public
		if (typeof avatarPath === "string" && (avatarPath.startsWith("http://") || avatarPath.startsWith("https://"))) {
			return avatarPath;
		}
		if (typeof avatarPath === "string" && avatarPath.startsWith("/images/")) {
			// Ảnh đặt trong thư mục public
			return avatarPath;
		}
		// Ảnh do backend trả về (đường dẫn tĩnh), bổ sung host
		const normalized = typeof avatarPath === "string" && avatarPath.startsWith("/") ? avatarPath : `/${avatarPath || ""}`;
		return `http://localhost:9999${normalized}`;
	};
	
	const getValue = (value, fallback = "-") => {
		if (value === null || value === undefined || value === "") return fallback;
		return value;
	};

	const getGenderLabel = (raw) => {
		if (raw === null || raw === undefined || raw === "") return "-";
		const norm = String(raw).toLowerCase();
		if (["male", "nam", "m", "1"].includes(norm)) return "Nam";
		if (["female", "nu", "nữ", "f", "0"].includes(norm)) return "Nữ";
		return raw;
	};

	const getRoleLabel = (role) => {
		if (!role) return "-";
		const id = role.id ?? role.roleId ?? role.role_id;
		if (id === 1) return "Nhân viên";
		if (id === 2) return "Khách hàng";
		if (id === 3) return "Quản lý";
		const name = String(role.name || "").toLowerCase();
		if (name === "staff") return "Nhân viên";
		if (name === "customer") return "Khách hàng";
		if (name === "manager") return "Quản lý";
		return role.name || "-";
	};
	useEffect(() => {
		const fetchProfile = async () => {
			try {
				const response = await getProfile();
				console.log(response);
				if (response && response.data) {
					setProfile(response.data);
				} else if (response) {
					setProfile(response);
				}
			} catch (err) {
				setError("Không thể tải thông tin người dùng.");
			}
		};

		fetchProfile();
	}, []);

	return (
		<div style={{ background: "url('/images/backgroundMedical2.jpg') no-repeat center center / cover", minHeight: "100vh", padding: "20px" }}>
			<Container className="mt-4" style={{ backgroundColor: "rgba(255,255,255,0.9)", borderRadius: "12px", padding: "16px" }}>
				{error && (
					<Alert variant="danger" className="text-center">
						{error}
					</Alert>
				)}

				<Row className="d-flex align-items-stretch">
					{profile && (
						<>
							{/* Left */}
							<Col md={4}>
								<Card className="text-center p-4 shadow-sm h-100">
									<div className="mb-3 text-muted fw-semibold">User Avatar</div>
									<Card.Img
										variant="top"
										src={getAvatarUrl(profile?.profile?.avatar)}
										onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/images/avatar/default.png"; }}
										alt="User Avatar"
										className="rounded-circle mx-auto"
										style={{ width: "250px", height: "250px", objectFit: "cover" }}
									/>
									<Card.Body>
										<h4>{profile.fullName}</h4>
										<p>
											<span className={`badge bg-${profile.status === "active" ? "success" : "danger"}`}>
												{profile.status === "active" ? "Hoạt động" : "Không hoạt động"}
											</span>
										</p>
										<p className="text-muted">{getRoleLabel(profile.role)}</p>
										{/* // <p className="text-muted">Ngày làm việc: {profile.schedule?.workDays?.map(day => ({"Monday": "T2", "Tuesday": "T3", "Wednesday": "T4", "Thursday": "T5", "Friday": "T6", "Saturday": "T7", "Sunday": "CN" }[day])).join(", ")}</p>
										// <p className="text-muted">Ca làm việc: {profile.type === "parttime" ? profile.schedule?.shifts?.map(day => ({"Morning":"Sáng: 08:00 - 11:00", "Afternoon":"Chiều: 13:00 - 17:00","Evening":"Tối: 17:00 - 21:00"}[day])).join(", ") : "Từ 8:00AM tới 17:00PM"}</p>*/}
									</Card.Body>
								</Card>
							</Col>
							{/* Right */}
							<Col md={8}>
								<Card className="p-4 shadow-sm h-100">
									<Card.Body>
										<h3 className="mb-3">Thông tin cá nhân</h3>
										<hr />
										<Row>
											<Col sm={4}><strong>Số căn cước:</strong></Col>
											<Col sm={8}>{getValue(profile.profile?.citizenId)}</Col>
										</Row>
										<hr />
										<Row>
											<Col sm={4}><strong>Tên đầy đủ:</strong></Col>
											<Col sm={8}>{getValue(profile.fullName)}</Col>
										</Row>
										<hr />
										<Row className="mt-2">
											<Col sm={4}><strong>Email:</strong></Col>
											<Col sm={8}>{getValue(profile.email)}</Col>
										</Row>
										<hr />
										<Row className="mt-2">
											<Col sm={4}><strong>Số điện thoại:</strong></Col>
											<Col sm={8}>{getValue(profile.phoneNumber)}</Col>
										</Row>
										<hr />
										<Row className="mt-2">
											<Col sm={4}><strong>Ngày sinh nhật:</strong></Col>
											<Col sm={8}>{getValue(profile.profile?.dateOfBirth ? new Date(profile.profile?.dateOfBirth).toLocaleDateString() : "")}</Col>
										</Row>
										<hr />
										<Row className="mt-2">
											<Col sm={4}><strong>Địa chỉ:</strong></Col>
											<Col sm={8}>{getValue(profile.address)}</Col>
										</Row>
										<hr />
										<Row className="mt-2">
											<Col sm={4}><strong>Giới tính:</strong></Col>
											<Col sm={8}>{getGenderLabel(profile.profile?.gender ?? profile.gender)}</Col>
										</Row>
										<div className="text-end mt-4">
											<Button variant="success" onClick={() => navigate("/edit-profile")}>Chỉnh sửa thông tin</Button>
										</div>
									</Card.Body>
								</Card>
							</Col>
						</>
					)}
				</Row>
			</Container>
		</div>
	);
};

export default Profile;
