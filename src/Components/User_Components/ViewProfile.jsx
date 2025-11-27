import React, { useEffect, useState } from "react";
import { Container, Card, Row, Col, Button, Alert } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import useUser from "../../Hooks/useUser";
import getUserRoleFromToken from "../../Utils/getUserRoleFromToken.jsx";
const Profile = () => {
	const navigate = useNavigate();
	const [profile, setProfile] = useState(null);
	const [error, setError] = useState(null);
	const { getProfile } = useUser();
	
	const getAvatarUrl = (avatarPath) => {
		console.log("ViewProfile getAvatarUrl called with:", avatarPath);
		
		if (!avatarPath) {
			console.log("No avatar path, returning default");
			return "/images/avatar/image1.png"; // ưu tiên hiển thị ảnh avatar mới thêm trong public
		}
		
		if (typeof avatarPath === "string" && (avatarPath.startsWith("http://") || avatarPath.startsWith("https://"))) {
			console.log("Full URL detected:", avatarPath);
			return avatarPath;
		}
		
		if (typeof avatarPath === "string" && avatarPath.startsWith("/images/")) {
			console.log("Local images path detected:", avatarPath);
			// Check if path has extension
			const hasExtension = /\.(jpg|jpeg|png|gif|webp)$/i.test(avatarPath);
			console.log("Avatar path has extension:", hasExtension);
			
			if (hasExtension) {
				const fullUrl = `http://localhost:5137${avatarPath}`;
				console.log("Generated avatar URL:", fullUrl);
				return fullUrl;
			} else {
				// Try with .jpg extension
				const fullUrl = `http://localhost:5137${avatarPath}.jpg`;
				console.log("Using default extension .jpg:", fullUrl);
				return fullUrl;
			}
		}
		
		// Ảnh do backend trả về (đường dẫn tĩnh), bổ sung host
		const normalized = typeof avatarPath === "string" && avatarPath.startsWith("/") ? avatarPath : `/${avatarPath || ""}`;
		const fullUrl = `http://localhost:5137${normalized}`;
		console.log("Normalized path:", fullUrl);
		return fullUrl;
	};
	
	const getValue = (value, fallback = "-") => {
		if (value === null || value === undefined || value === "") return fallback;
		return value;
	};

	const getGenderLabel = (raw) => {
		if (raw === null || raw === undefined || raw === "") return "-";
		
		// Handle boolean values: true = Nam, false = Nữ
		if (typeof raw === 'boolean') {
			return raw ? "Nam" : "Nữ";
		}
		
		// Handle string/number values
		const norm = String(raw).toLowerCase();
		if (["male", "nam", "m", "1", "true"].includes(norm)) return "Nam";
		if (["female", "nu", "nữ", "f", "0", "false"].includes(norm)) return "Nữ";
		return raw;
	};

	const getCodeLabel = () => {
		const roleKey = getUserRoleFromToken();
		if (roleKey === 'customer') return "Mã số thuế";
		return "Mã số nhân viên";
	};

	const getRoleLabel = (userData) => {
		// Ưu tiên dùng helper chuẩn để đọc từ JWT
		const roleKey = getUserRoleFromToken();
		const viMap = {
			admin: "Admin",
			manager: "Quản Lý",
			sales_staff: "Nhân viên Bán Hàng",
			purchases_staff: "Nhân viên Mua Hàng",
			warehouse_staff: "Nhân viên Kho",
			accountant_staff: "Nhân viên Kế Toán",
			customer: "Khách hàng",
		};
		if (roleKey && viMap[roleKey]) return viMap[roleKey];
		
		// Fallback cũ: tự phân tích token nếu helper không suy ra được
		const token = localStorage.getItem("authToken");
		if (token) {
			try {
				const [, payload] = token.split('.');
				const tokenData = JSON.parse(atob(payload));
				const role = tokenData.role || tokenData.roleId;
				
				if (typeof role === 'number') {
					if (role === 0) return "Nhân viên Bán Hàng";
					if (role === 1) return "Nhân viên Mua Hàng";
					if (role === 2) return "Nhân viên Kho";
					if (role === 3) return "Nhân viên Kế Toán";
					if (role === 4) return "Khách hàng";
					if (role === 5) return "Quản Lý";
					if (role === 6) return "Admin";
				}
				
				if (typeof role === 'string') {
					const roleLower = role.toLowerCase();
					if (roleLower === "sales_staff") return "Nhân viên Bán Hàng";
					if (roleLower === "purchases_staff") return "Nhân viên Mua Hàng";
					if (roleLower === "warehouse_staff") return "Nhân viên Kho";
					if (roleLower === "accountant_staff") return "Nhân viên Kế Toán";
					if (roleLower === "customer") return "Khách hàng";
					if (roleLower === "manager") return "Quản Lý";
					if (roleLower === "admin") return "Admin";
				}
			} catch (e) {
				console.log("Error parsing token:", e);
			}
		}
		
		// Fallback: kiểm tra trong userData từ API
		if (userData?.role) {
			const role = userData.role;
			if (typeof role === 'object') {
				const id = role.id ?? role.roleId ?? role.role_id;
				if (id === 0) return "Nhân viên Bán Hàng";
				if (id === 1) return "Nhân viên Mua Hàng";
				if (id === 2) return "Nhân viên Kho";
				if (id === 3) return "Nhân viên Kế Toán";
				if (id === 4) return "Khách hàng";
				if (id === 5) return "Quản Lý";
				if (id === 6) return "Admin";
			}
			const name = String(role.name || role.roleName || "").toLowerCase();
			if (name === "sales_staff") return "Nhân viên Bán Hàng";
			if (name === "purchases_staff") return "Nhân viên Mua Hàng";
			if (name === "warehouse_staff") return "Nhân viên Kho";
			if (name === "accountant_staff") return "Nhân viên Kế Toán";
			if (name === "customer") return "Khách hàng";
			if (name === "manager") return "Quản Lý";
			if (name === "admin") return "Admin";
		}
		
		return "Khách hàng"; // Default fallback
	};

	const getStatusLabel = (status) => {
		if (status === null || status === undefined) return "Hoạt động";
		
		// Handle numeric status (enum)
		if (typeof status === 'number') {
			if (status === 0) return "Bị chặn";
			if (status === 1) return "Không hoạt động";
			if (status === 2) return "Hoạt động";
		}
		
		// Handle string status
		if (typeof status === 'string') {
			const statusLower = status.toLowerCase();
			if (statusLower === "block" || statusLower === "blocked") return "Bị chặn";
			if (statusLower === "inactive") return "Không hoạt động";
			if (statusLower === "active") return "Hoạt động";
		}
		
		return "Hoạt động"; // Default
	};
	useEffect(() => {
		const fetchProfile = async () => {
			try {
				const response = await getProfile();
				console.log("API Response:", response);
				
				if (response && response.data) {
					// API trả về dữ liệu trong response.data hoặc response.data.data (đã được chuẩn hóa ở hook)
					const payload = response.data?.data ?? response.data;
					console.log("Profile payload:", payload);
					console.log("Available fields:", Object.keys(payload));
					setProfile(payload);
				} else if (response) {
					// Fallback nếu dữ liệu ở root level
					console.log("Using response as profile:", response);
					setProfile(response);
				} else {
					// Fallback: Lấy dữ liệu từ JWT token nếu API không trả về dữ liệu
					const token = localStorage.getItem("authToken");
					if (token) {
						try {
							const [, payload] = token.split('.');
							const tokenData = JSON.parse(atob(payload));
							console.log("Using JWT token data:", tokenData);
							setProfile(tokenData);
						} catch (e) {
							console.error("Error parsing JWT:", e);
							setError("Không thể lấy thông tin người dùng từ token");
						}
					} else {
						setError("Không có dữ liệu từ API và không có token");
					}
				}
			} catch (err) {
				console.error("Error fetching profile:", err);
				
				// Fallback: Thử lấy dữ liệu từ JWT token khi API lỗi
				const token = localStorage.getItem("authToken");
				if (token) {
					try {
						const [, payload] = token.split('.');
						const tokenData = JSON.parse(atob(payload));
						console.log("Using JWT token data as fallback:", tokenData);
						setProfile(tokenData);
					} catch (e) {
						console.error("Error parsing JWT:", e);
						setError(err.response?.data?.message || err.message || "Không thể tải thông tin người dùng.");
					}
				} else {
					setError(err.response?.data?.message || err.message || "Không thể tải thông tin người dùng.");
				}
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
									{console.log("ViewProfile rendering avatar with:", profile?.avatar || profile?.Avatar)}
									<Card.Img
										variant="top"
										src={getAvatarUrl(profile?.avatar || profile?.Avatar)}
										onError={(e) => { 
											console.log("ViewProfile image load error:", e);
											console.log("Failed to load image:", getAvatarUrl(profile?.avatar || profile?.Avatar));
											e.currentTarget.onerror = null; 
											e.currentTarget.src = "/images/avatar/image1.png"; 
										}}
										onLoad={() => {
											console.log("ViewProfile image loaded successfully:", getAvatarUrl(profile?.avatar || profile?.Avatar));
										}}
										alt=""
										className="rounded-circle mx-auto"
										style={{ width: "250px", height: "250px", objectFit: "cover" }}
									/>
									<Card.Body>
										<h4>{getValue(profile.fullName || profile.FullName || profile.name)}</h4>
										<p>
											<span className={`badge bg-${getStatusLabel(profile.userStatus || profile.status) === "Hoạt động" ? "success" : "danger"}`}>
												{getStatusLabel(profile.userStatus || profile.status)}
											</span>
										</p>
										<p className="text-muted">{getRoleLabel(profile)}</p>
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
											<Col sm={4}><strong>{getCodeLabel()}:</strong></Col>
											<Col sm={8}>{getValue(profile.employeeCode || profile.mst || profile.Mst)}</Col>
										</Row>
										<hr />
										<Row>
											<Col sm={4}><strong>Tên đầy đủ:</strong></Col>
											<Col sm={8}>{getValue(profile.fullName || profile.FullName)}</Col>
										</Row>
										<hr />
										<Row className="mt-2">
											<Col sm={4}><strong>Email:</strong></Col>
											<Col sm={8}>{getValue(profile.email || profile.Email)}</Col>
										</Row>
										<hr />
										<Row className="mt-2">
											<Col sm={4}><strong>Số điện thoại:</strong></Col>
											<Col sm={8}>{getValue(profile.phoneNumber || profile.PhoneNumber)}</Col>
										</Row>
										<hr />
										<Row className="mt-2">
											<Col sm={4}><strong>Địa chỉ:</strong></Col>
											<Col sm={8}>{getValue(profile.address || profile.Address)}</Col>
										</Row>
										<hr />
										<Row className="mt-2">
											<Col sm={4}><strong>Giới tính:</strong></Col>
											<Col sm={8}>{getGenderLabel(profile.gender)}</Col>
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
