import React, { useEffect, useState } from "react";
import { Container, Form, Button, Alert, Row, Col, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import useUser from "../../Hooks/useUser";
import getUserRoleFromToken from "../../Utils/getUserRoleFromToken.jsx";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const EditProfile = () => {
	const navigate = useNavigate();
	//khoi tao cac state (luu data ng dung de hien thi va editedit)
	const [profile, setProfile] = useState({
		fullName: "",
		email: "",
		phoneNumber: "",
		address: "",
		gender: null,
		employeeCode: "",
		mst: "",
		mshkd: ""
	});
	//hien thi anh dai dien (avatar) trc khi uploadupload
	const [avatarPreview, setAvatarPreview] = useState("");
	//message success hoac errorerror
	const [statusMessage, setStatusMessage] = useState("");
	//true neu co loi xay rara
	const [isError, setIsError] = useState(false);
	//true neu avatar hop le
	const [isAvatarValid, setIsAvatarValid] = useState(true);
	//luu anh moimoi
	const [newAvatarFile, setNewAvatarFile] = useState(null);
	const [phoneError, setPhoneError] = useState("");
	// Flag để đánh dấu xóa avatar (về mặc định)
	const [shouldDeleteAvatar, setShouldDeleteAvatar] = useState(false);

	const { getProfile, editProfile, editCustomerProfile, uploadAvatar } = useUser(); // Giả sử bạn có hook này để lấy thông tin người dùng
	const DEFAULT_AVATAR_PATH = "/images/avatar/image1.png";

	const testAvatarUrlWithExtensions = async (basePath) => {
		const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
		
		for (const ext of extensions) {
			const url = `http://localhost:5137${basePath}${ext}`;
			try {
				const response = await fetch(url, { method: 'HEAD' });
				console.log(`Testing ${url} - Status: ${response.status}`);
				if (response.ok) {
					console.log(`Found working avatar URL: ${url}`);
					return url;
				}
			} catch (error) {
				console.log(`Failed to test ${url}:`, error);
			}
		}
		
		console.log("No working avatar URL found, using default");
		return null;
	};

	const testAvatarUrl = async (url) => {
		try {
			const response = await fetch(url, { method: 'HEAD' });
			console.log(`Avatar URL test: ${url} - Status: ${response.status}`);
			return response.ok;
		} catch (error) {
			console.log(`Avatar URL test failed: ${url} - Error:`, error);
			return false;
		}
	};

	const getAvatarUrl = (avatarPath) => {
		console.log("getAvatarUrl called with:", avatarPath);
		
		// Block base64 data URLs
		if (typeof avatarPath === "string" && avatarPath.startsWith("data:image/")) {
			console.error("Base64 data URL detected in getAvatarUrl - returning default");
			return "/images/avatar/image1.png";
		}
		
		// Allow any valid URL format
		if (typeof avatarPath === "string" && (avatarPath.startsWith("http://") || avatarPath.startsWith("https://"))) {
			console.log("Valid URL detected:", avatarPath);
			return avatarPath;
		}
		
		if (!avatarPath) {
			console.log("No avatar path, returning default");
			return "/images/avatar/image1.png";
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
			
			let fullUrl;
			if (hasExtension) {
				fullUrl = `http://localhost:5137${avatarPath}`;
			} else {
				// Try common extensions if missing
				console.log("Avatar path missing extension, trying common extensions...");
				
				// Test different extensions asynchronously
				testAvatarUrlWithExtensions(avatarPath).then(workingUrl => {
					if (workingUrl) {
						console.log("Found working avatar URL:", workingUrl);
						// Update avatar preview with working URL
						setAvatarPreview(workingUrl);
					}
				});
				
				// For now, default to .jpg
				fullUrl = `http://localhost:5137${avatarPath}.jpg`;
				console.log("Using default extension .jpg");
			}
			
			console.log("Generated avatar URL:", fullUrl);
			
			// Test if the URL is accessible
			testAvatarUrl(fullUrl);
			
			return fullUrl;
		}
		
		const normalized = typeof avatarPath === "string" && avatarPath.startsWith("/") ? avatarPath : `/${avatarPath || ""}`;
		const fullUrl = `http://localhost:5137${normalized}`;
		console.log("Normalized path:", fullUrl);
		return fullUrl;
	};

	//get profile info 
	useEffect(() => {
		const fetchProfile = async () => {
			try {
				const response = await getProfile(); // Gọi hàm lấy thông tin người dùng từ hook
				const userData = response?.data?.data || response?.data || response;
				
				console.log("EditProfile - User data:", userData);
				
				setProfile({
					fullName: userData.fullName || "",
					email: userData.email || "",
					phoneNumber: userData.phoneNumber || "",
					address: userData.address || "",
					gender: userData.gender,
					employeeCode: userData.employeeCode || "",
					mst: userData.mst || "",
					mshkd: userData.mshkd || ""
				});
				
				// Set avatar preview nếu có
				console.log("Setting avatar preview with userData.avatar:", userData.avatar);
				const avatarUrl = getAvatarUrl(userData.avatar);
				console.log("Final avatar URL:", avatarUrl);
				console.log("Setting avatarPreview state to:", avatarUrl);
				setAvatarPreview(avatarUrl);
				console.log("Avatar preview state set successfully");
			} catch (error) {
				console.error("Error fetching profile:", error);
				setIsError(true);
				setStatusMessage("Không thể load thông tin người dùng");
			}
		};
		fetchProfile();
	}, []);

	// Debug: Track avatarPreview state changes
	useEffect(() => {
		console.log("avatarPreview state changed to:", avatarPreview);
	}, [avatarPreview]);

	const handleChange = (e) => {
		const { name, value } = e.target;

		if (name === "phoneNumber") {
			const phoneRegex = /^0\d{9}$/;
			if (!value || phoneRegex.test(value)) {
				setPhoneError("");
			} else {
				setPhoneError("Số điện thoại phải bắt đầu bằng 0 và gồm 10 chữ số.");
			}
		}

		setProfile({ ...profile, [name]: value });
	};
	//avatar control 
	const handleAvatarChange = (e) => {
		const file = e.target.files[0]; //lay file ng dung chonchon
		console.log("File selected:", file);
		
		if (!file) {
			console.log("No file selected");
			return;
		}

		console.log("File type:", file.type);
		console.log("File size:", file.size);

		if (!file.type.includes("image")) {
			console.log("Invalid file type:", file.type);
			setIsAvatarValid(false); // not valid 
			setIsError(true);
			setStatusMessage("Vui lòng chọn file hình ảnh hợp lệ.");
			e.target.value = ""; // Reset input file
			return;
		}

		console.log("File is valid, setting states...");
		setIsAvatarValid(true); // valid
		setIsError(false); // Clear error state
		setStatusMessage("");
		setAvatarPreview(URL.createObjectURL(file));//hien thi anh tam thoithoi
		setNewAvatarFile(file);//luu file vao state va gui len serverserver
		setShouldDeleteAvatar(false); // Clear delete flag when file is selected
		console.log("File upload states set successfully");
	};

	// Xóa avatar (về mặc định)
	const handleDeleteAvatar = () => {
		const defaultAvatar = DEFAULT_AVATAR_PATH;
		setAvatarPreview(defaultAvatar);
		setNewAvatarFile(null);
		setShouldDeleteAvatar(true);
		setIsAvatarValid(true);
		setIsError(false);
		setStatusMessage("Avatar đã được xóa. Sẽ về mặc định khi lưu.");
	};

	// Kiểm tra xem avatar có phải mặc định không
	const isDefaultAvatar = (avatarPath) => {
		if (!avatarPath) return true;
		const path = typeof avatarPath === 'string' ? avatarPath.toLowerCase() : '';
		return path.includes('image1.png') || path === DEFAULT_AVATAR_PATH.toLowerCase();
	};

	const setCustomInvalidMessage = (event, message) => {
		event.target.setCustomValidity(message);
	};

	const clearCustomInvalidMessage = (event) => {
		event.target.setCustomValidity("");
	};

	const buildDefaultAvatarFile = async () => {
		const defaultUrl = new URL(DEFAULT_AVATAR_PATH, window.location.origin).href;
		const response = await fetch(defaultUrl);
		if (!response.ok) {
			throw new Error("Không thể tải avatar mặc định");
		}
		const blob = await response.blob();
		const extension = blob.type && blob.type.includes("png") ? ".png" : ".jpg";
		return new File([blob], `default-avatar${extension}`, { type: blob.type || "image/png" });
	};

	const normalizeGenderForRequest = (value) => {
		if (value === true || value === "true" || value === 1 || value === "1") return "true";
		if (value === false || value === "false" || value === 0 || value === "0") return "false";
		return "";
	};



	//submit form 
	const handleSubmit = async (e) => {
		e.preventDefault();
		console.log("Form submitted");
		console.log("isAvatarValid:", isAvatarValid);
		console.log("newAvatarFile:", newAvatarFile);
		console.log("shouldDeleteAvatar:", shouldDeleteAvatar);
		
		setIsError(false);
		setStatusMessage("");

		if (!isAvatarValid) {
			console.log("Avatar validation failed");
			setIsError(true);
			setStatusMessage("File không hợp lệ. Vui lòng chọn file hình ảnh hợp lệ.");
			return;
		}

		if (phoneError || !/^0\d{9}$/.test(profile.phoneNumber || "")) {
			setIsError(true);
			setStatusMessage("Số điện thoại phải bắt đầu bằng 0 và gồm 10 chữ số.");
			setPhoneError("Số điện thoại phải bắt đầu bằng 0 và gồm 10 chữ số.");
			return;
		}
		
		const userRole = getUserRoleFromToken();

		try {
			let response;
			if (userRole === 'customer') {
				const formData = new FormData();
				formData.append("FullName", profile.fullName.trim());
				formData.append("Address", profile.address.trim());
				formData.append("PhoneNumber", profile.phoneNumber ?? "");
				const normalizedGender = normalizeGenderForRequest(profile.gender);
				if (normalizedGender) {
					formData.append("Gender", normalizedGender);
				}
				if (profile.mst !== undefined && profile.mst !== null) {
					formData.append("MST", profile.mst);
				}
				if (profile.mshkd !== undefined && profile.mshkd !== null) {
					formData.append("Mshkd", profile.mshkd);
				}

				let avatarToUpload = newAvatarFile;
				if (!avatarToUpload && shouldDeleteAvatar) {
					try {
						avatarToUpload = await buildDefaultAvatarFile();
					} catch (error) {
						console.error("Không thể chuẩn bị avatar mặc định:", error);
					}
				}
				if (avatarToUpload) {
					formData.append("avatarFile", avatarToUpload);
				}
				response = await editCustomerProfile(formData);
			} else {
				const updateData = {
					fullName: profile.fullName,
					phoneNumber: profile.phoneNumber,
					address: profile.address,
					gender: profile.gender === "true" ? true : profile.gender === "false" ? false : profile.gender
				};

				if (newAvatarFile) {
					try {
						console.log("Uploading avatar file:", newAvatarFile.name);
						console.log("File type:", newAvatarFile.type);
						console.log("File size:", newAvatarFile.size);
						
						if (!newAvatarFile.type.startsWith('image/')) {
							throw new Error("File không phải là hình ảnh");
						}
						
						const uploadResponse = await uploadAvatar(newAvatarFile);
						console.log("Upload response:", uploadResponse);
						
						if (uploadResponse?.data?.data) {
							updateData.avatar = uploadResponse.data.data;
							console.log("Avatar uploaded successfully:", uploadResponse.data.data);
							setAvatarPreview(getAvatarUrl(uploadResponse.data.data));
						} else {
							throw new Error("Upload response không có data");
						}
					} catch (error) {
						console.error("Upload avatar error:", error);
						setIsError(true);
						setStatusMessage("Không thể upload ảnh đại diện: " + (error.response?.data?.message || error.message));
						return;
					}
				} else if (shouldDeleteAvatar) {
					updateData.avatar = DEFAULT_AVATAR_PATH;
					console.log("Avatar will be set to default");
				} else {
					console.log("No avatar changes");
				}

				response = await editProfile(updateData);
				console.log("Update data sent:", updateData);
			}

			console.log("Edit profile response:", response);
			setStatusMessage(response?.data?.message || response?.message || "Cập nhật thông tin thành công!");
			
			const refreshResponse = await getProfile();
			const userData = refreshResponse?.data?.data || refreshResponse?.data || refreshResponse;
			console.log("Refreshed profile data:", userData);
			
			setProfile({
				fullName: userData.fullName || "",
				email: userData.email || "",
				phoneNumber: userData.phoneNumber || "",
				address: userData.address || "",
				gender: userData.gender,
				employeeCode: userData.employeeCode || "",
				mst: userData.mst || "",
				mshkd: userData.mshkd || ""
			});
			
			if (!newAvatarFile) {
				setAvatarPreview(getAvatarUrl(userData.avatar));
			}
			
			setNewAvatarFile(null);
			setShouldDeleteAvatar(false);
			
			setTimeout(() => {
				navigate("/profile");
			}, 2000);
		} catch (error) {
			console.error("Edit profile error:", error);
			console.error("Error response:", error.response);
			console.error("Error data:", error.response?.data);
			
			setIsError(true);
			let errorMessage = "Không thể cập nhật thông tin người dùng";
			
			if (error.response?.status === 500) {
				errorMessage = "Lỗi server (500). Vui lòng kiểm tra lại thông tin hoặc thử lại sau.";
			} else if (error.response?.data?.message) {
				errorMessage = error.response.data.message;
			} else {
				errorMessage = "Có lỗi xảy ra. Vui lòng thử lại sau.";
			}
			
			setStatusMessage(errorMessage);
		}
	};

	return (
		<div style={{ background: "url('/images/backgroundMedical2.jpg') no-repeat center center / cover", minHeight: "100vh", padding: "20px" }}>
			<Container className="mt-4" style={{ backgroundColor: "rgba(255,255,255,0.9)", borderRadius: "12px", padding: "16px" }}>
				<Button
					variant="outline-secondary"
					className="mb-3 d-flex align-items-center gap-2"
					onClick={() => navigate(-1)}
					style={{
						fontWeight: 500,
						fontSize: "0.95rem",
						padding: "8px 16px",
						borderRadius: "8px",
						border: "1px solid #6c757d",
						color: "#6c757d",
						backgroundColor: "transparent",
						transition: "all 0.3s ease",
						boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.backgroundColor = "#6c757d";
						e.currentTarget.style.color = "white";
						e.currentTarget.style.transform = "translateX(-2px)";
						e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.backgroundColor = "transparent";
						e.currentTarget.style.color = "#6c757d";
						e.currentTarget.style.transform = "translateX(0)";
						e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
					}}
				>
					<ArrowBackIcon style={{ fontSize: "18px" }} />
					Quay lại
				</Button>
				{statusMessage && <Alert variant={isError ? "danger" : "success"}>{statusMessage}</Alert>}

				<Row className="d-flex align-items-stretch">
					<Col md={4}>
						<Card className="text-center p-4 shadow-sm h-100">
							{console.log("Rendering Card.Img with avatarPreview:", avatarPreview)}
							<Card.Img
								variant="top"
								src={avatarPreview}
								alt="User Avatar"
								className="rounded-circle mx-auto"
								style={{ width: "250px", height: "250px", objectFit: "cover" }}
								onError={(e) => {
									console.log("Image load error:", e);
									console.log("Failed to load image:", avatarPreview);
								}}
								onLoad={() => {
									console.log("Image loaded successfully:", avatarPreview);
								}}
							/>
							{/* goi  handle de cap nhat previewpreview*/}
							<Form.Group className="mt-3">
								<Form.Label><strong>Thay đổi avatar</strong></Form.Label>
								<Form.Label 
									htmlFor="avatar-upload"
									className="btn btn-outline-primary w-100"
									style={{
										cursor: "pointer",
										marginBottom: "8px"
									}}
								>
									Upload File
								</Form.Label>
								<Form.Control 
									id="avatar-upload"
									type="file" 
									name="avatar" 
									onChange={handleAvatarChange} 
									accept="image/*"
									className="d-none"
								/>
								{/* Hiển thị nút xóa avatar nếu có avatar (không phải mặc định) */}
								{avatarPreview && !isDefaultAvatar(avatarPreview) && (
									<Button
										variant="danger"
										size="sm"
										onClick={handleDeleteAvatar}
										className="w-100"
										style={{
											marginTop: "8px"
										}}
									>
										Xóa avatar
									</Button>
								)}
							</Form.Group>
						</Card>
					</Col>

					<Col md={8}>
						<Card className="p-4 shadow-sm h-100">
							{/*edit section*/}
							<Card.Body>
								<h3 className="mb-3">Chỉnh sửa thông tin cá nhân</h3>
								<hr />
								<Form onSubmit={handleSubmit} encType="multipart/form-data">
									<Row className="mb-3">
										<Col md={6}>
											<Form.Label><strong>Tên đầy đủ</strong></Form.Label>
											<Form.Control
												type="text"
												name="fullName"
												value={profile.fullName}
												onChange={handleChange}
												onInvalid={(e) => setCustomInvalidMessage(e, "Vui lòng nhập tên đầy đủ.")}
												onInput={clearCustomInvalidMessage}
												required
											/>
										</Col>
										<Col md={6}>
											<Form.Label><strong>Email</strong></Form.Label>
											<Form.Control type="email" name="email" value={profile.email} disabled />
										</Col>
									</Row>
									<Row className="mb-3">
										<Col md={6}>
											<Form.Label><strong>Số điện thoại</strong></Form.Label>
											<Form.Control
												type="text"
												name="phoneNumber"
												value={profile.phoneNumber}
												onChange={handleChange}
												isInvalid={!!phoneError}
												onBlur={() => {
													if (!profile.phoneNumber) {
														setPhoneError("Vui lòng nhập số điện thoại.");
													}
												}}
											/>
											<Form.Control.Feedback type="invalid">
												{phoneError || "Số điện thoại phải bắt đầu bằng 0 và gồm 10 chữ số."}
											</Form.Control.Feedback>
										</Col>
										<Col md={6}>
											<Form.Label><strong>Giới tính</strong></Form.Label>
											<Form.Select name="gender" value={profile.gender} onChange={handleChange}>
												<option value="">Chọn giới tính</option>
												<option value="true">Nam</option>
												<option value="false">Nữ</option>
											</Form.Select>
										</Col>
									</Row>
									<Row className="mb-3">
										<Col md={6}>
											<Form.Label><strong>Địa chỉ</strong></Form.Label>
											<Form.Control
												type="text"
												name="address"
												value={profile.address}
												onChange={handleChange}
												onInvalid={(e) => setCustomInvalidMessage(e, "Vui lòng nhập địa chỉ.")}
												onInput={clearCustomInvalidMessage}
												required
											/>
										</Col>
										{getUserRoleFromToken() !== 'customer' && (
											<Col md={6}>
												<Form.Label><strong>Mã số nhân viên</strong></Form.Label>
												<Form.Control 
													type="text" 
													name="employeeCode" 
													value={profile.employeeCode} 
													disabled
												/>
											</Col>
										)}
									</Row>
									{getUserRoleFromToken() === 'customer' && (
										<Row className="mb-3">
											<Col md={6}>
												<Form.Label><strong>Mã số thuế</strong></Form.Label>
												<Form.Control
													type="text"
													value={profile.mst || ""}
													disabled
												/>
											</Col>
											<Col md={6}>
												<Form.Label><strong>Mã số hộ kinh doanh</strong></Form.Label>
												<Form.Control
													type="text"
													value={profile.mshkd || ""}
													disabled
												/>
											</Col>
										</Row>
									)}
									<hr />
									<Button variant="warning" className="float-end mt-4 m-3" onClick={() => navigate("/change-password")}>Đổi mật khẩu</Button>
									<Button variant="success" type="submit" className="float-end mt-4">Lưu thay đổi</Button>
								</Form>
							</Card.Body>
						</Card>
					</Col>
				</Row>
			</Container>
		</div>
	);
};

export default EditProfile;
