import React, { useEffect, useState } from "react";
import { Container, Form, Button, Alert, Row, Col, Card } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import useUser from "../../Hooks/useUser";
import getUserRoleFromToken from "../../Utils/getUserRoleFromToken.jsx";

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
	//luu URL avatar moi
	const [newAvatarUrl, setNewAvatarUrl] = useState("");

	const { getProfile, editProfile, uploadAvatar } = useUser(); // Giả sử bạn có hook này để lấy thông tin người dùng

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
		setProfile({ ...profile, [e.target.name]: e.target.value });
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
		setNewAvatarUrl(""); // Clear URL when file is selected
		console.log("File upload states set successfully");
	};

	//avatar URL control
	const handleAvatarUrlChange = (e) => {
		const url = e.target.value.trim();
		setNewAvatarUrl(url);
		
		if (url) {
			// Check for base64 data URL first
			if (url.startsWith('data:image/')) {
				setIsAvatarValid(false);
				setIsError(true);
				setStatusMessage("❌ Không thể sử dụng base64 data URL. Vui lòng sử dụng URL hình ảnh thông thường (ví dụ: https://example.com/image.jpg) hoặc chọn file hình ảnh từ máy tính.");
				setAvatarPreview(getAvatarUrl(profile.avatar));
				console.log("Base64 data URL blocked:", url.substring(0, 50) + "...");
				return;
			}
			
			// Validate regular URL format
			try {
				const urlObj = new URL(url);
				
				// Check if it's a valid image URL
				const validImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
				const pathname = urlObj.pathname.toLowerCase();
				const hasValidExtension = validImageExtensions.some(ext => pathname.endsWith(ext));
				
				// Also allow URLs without extension (might be dynamic image URLs)
				if (hasValidExtension || url.includes('image') || url.includes('avatar') || url.includes('photo') || url.includes('img')) {
					setAvatarPreview(url);
					setNewAvatarFile(null); // Clear file when URL is entered
					setIsAvatarValid(true);
					setIsError(false);
					setStatusMessage("✅ URL hình ảnh hợp lệ!");
					console.log("Valid image URL entered:", url);
				} else {
					setIsAvatarValid(false);
					setIsError(true);
					setStatusMessage("⚠️ URL không phải là hình ảnh hợp lệ. Vui lòng nhập URL hình ảnh (ví dụ: https://example.com/image.jpg) hoặc chọn file hình ảnh.");
					setAvatarPreview(getAvatarUrl(profile.avatar));
					console.log("URL is not an image:", url);
				}
			} catch (error) {
				setIsAvatarValid(false);
				setIsError(true);
				setStatusMessage("❌ URL không hợp lệ. Vui lòng nhập URL đúng định dạng (ví dụ: https://example.com/image.jpg).");
				setAvatarPreview(getAvatarUrl(profile.avatar));
				console.log("Invalid URL format:", url);
			}
		} else {
			// Reset to original avatar if URL is cleared
			setAvatarPreview(getAvatarUrl(profile.avatar));
			setIsAvatarValid(true);
			setIsError(false);
			setStatusMessage("");
		}
	};



	//submit form 
	const handleSubmit = async (e) => {
		e.preventDefault();
		console.log("Form submitted");
		console.log("isAvatarValid:", isAvatarValid);
		console.log("newAvatarFile:", newAvatarFile);
		console.log("newAvatarUrl:", newAvatarUrl);
		
		setIsError(false);
		setStatusMessage("");

		// If avatar is not valid then no submit form 
		if (!isAvatarValid) {
			console.log("Avatar validation failed");
			setIsError(true);
			setStatusMessage("File không hợp lệ. Vui lòng chọn file hình ảnh hợp lệ.");
			return;
		}
		
		// Prepare data object according to UpdateAccountRequest
		const updateData = {
			fullName: profile.fullName,
			phoneNumber: profile.phoneNumber,
			address: profile.address,
			gender: profile.gender === "true" ? true : profile.gender === "false" ? false : profile.gender
		};

		// Thêm thông tin dựa trên role
		const userRole = getUserRoleFromToken();
		if (userRole === 'customer') {
			updateData.mst = profile.mst;
			updateData.mshkd = profile.mshkd;
		}

		// Handle avatar upload first if there's a file
		if (newAvatarFile) {
			try {
				console.log("Uploading avatar file:", newAvatarFile.name);
				console.log("File type:", newAvatarFile.type);
				console.log("File size:", newAvatarFile.size);
				
				// Validate file before upload
				if (!newAvatarFile.type.startsWith('image/')) {
					throw new Error("File không phải là hình ảnh");
				}
				
				const uploadResponse = await uploadAvatar(newAvatarFile);
				console.log("Upload response:", uploadResponse);
				
				if (uploadResponse?.data?.data) {
					updateData.avatar = uploadResponse.data.data;
					console.log("Avatar uploaded successfully:", uploadResponse.data.data);
					// Update preview immediately with the uploaded avatar
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
		} else if (newAvatarUrl) {
			// Check for base64 data URL
			if (newAvatarUrl.startsWith('data:image/')) {
				console.error("Base64 data URL detected in newAvatarUrl - blocking submission");
				setIsError(true);
				setStatusMessage("❌ Không thể sử dụng base64 data URL. Vui lòng sử dụng URL hình ảnh thông thường hoặc chọn file hình ảnh từ máy tính.");
				return;
			}
			
			// Validate URL format
			try {
				const urlObj = new URL(newAvatarUrl);
				const validImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
				const pathname = urlObj.pathname.toLowerCase();
				const hasValidExtension = validImageExtensions.some(ext => pathname.endsWith(ext));
				
				if (!hasValidExtension && !newAvatarUrl.includes('image') && !newAvatarUrl.includes('avatar') && !newAvatarUrl.includes('photo') && !newAvatarUrl.includes('img')) {
					setIsError(true);
					setStatusMessage("⚠️ URL không phải là hình ảnh hợp lệ. Vui lòng nhập URL hình ảnh hoặc chọn file hình ảnh.");
					return;
				}
			} catch (error) {
				setIsError(true);
				setStatusMessage("❌ URL không hợp lệ. Vui lòng nhập URL đúng định dạng.");
				return;
			}
			
			updateData.avatar = newAvatarUrl;
			console.log("Adding valid avatar URL to update data:", newAvatarUrl);
			console.log("Update data before sending:", updateData);
		} else {
			console.log("No avatar changes");
		}

		try {
			const response = await editProfile(updateData);
			console.log("Edit profile response:", response);
			console.log("Update data sent:", updateData);
			setStatusMessage(response?.data?.message || response?.message || "Cập nhật thông tin thành công!");
			
			// Refresh profile data after successful update
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
			
			// Update avatar preview with new data - only if we didn't already update it from upload
			if (!newAvatarFile) {
				setAvatarPreview(getAvatarUrl(userData.avatar));
			}
			
			// Clear the new avatar file and URL after successful update
			setNewAvatarFile(null);
			setNewAvatarUrl("");
			
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
			} else if (error.message) {
				errorMessage = error.message;
			}
			
			setStatusMessage(errorMessage);
		}
	};

	return (
		<div style={{ background: "url('/images/backgroundMedical2.jpg') no-repeat center center / cover", minHeight: "100vh", padding: "20px" }}>
			<Container className="mt-4" style={{ backgroundColor: "rgba(255,255,255,0.9)", borderRadius: "12px", padding: "16px" }}>
				<Button
					variant="light"
					className="mb-3"
					onClick={() => navigate(-1)} // quay lại trang trước
					style={{ fontWeight: "bold", fontFamily: "Arial, sans-serif" }}
				>
					&#60; Back
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
								<Form.Control 
									type="file" 
									name="avatar" 
									onChange={handleAvatarChange} 
									accept="image/*"
									className="mb-2"
								/>
								<Form.Control 
									type="url" 
									placeholder="Hoặc nhập URL ảnh đại diện" 
									value={newAvatarUrl}
									onChange={handleAvatarUrlChange}
								/>
							</Form.Group>
						</Card>
					</Col>

					<Col md={8}>
						<Card className="p-4 shadow-sm h-100">
							{/*edit section*/}
							<Card.Body>
								<h3 className="mb-3">Chỉnh sửa thông tin cá nhân</h3>
								<hr />
								<Form onSubmit={handleSubmit}>
									<Row className="mb-3">
										<Col md={6}>
											<Form.Label><strong>Tên đầy đủ</strong></Form.Label>
											<Form.Control type="text" name="fullName" value={profile.fullName} onChange={handleChange} required />
										</Col>
										<Col md={6}>
											<Form.Label><strong>Email</strong></Form.Label>
											<Form.Control type="email" name="email" value={profile.email} disabled />
										</Col>
									</Row>
									<Row className="mb-3">
										<Col md={6}>
											<Form.Label><strong>Số điện thoại</strong></Form.Label>
											<Form.Control type="text" name="phoneNumber" value={profile.phoneNumber} onChange={handleChange} />
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
											<Form.Control type="text" name="address" value={profile.address} onChange={handleChange} />
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
										<>
											<hr />
											<h5>Thông tin khách hàng</h5>
											<Row className="mb-3">
												<Col md={6}>
													<Form.Label><strong>Mã số thuế</strong></Form.Label>
													<Form.Control 
														type="text" 
														name="mst" 
														value={profile.mst} 
														onChange={handleChange}
													/>
												</Col>
												<Col md={6}>
													<Form.Label><strong>Mã số HKD</strong></Form.Label>
													<Form.Control 
														type="text" 
														name="mshkd" 
														value={profile.mshkd} 
														onChange={handleChange}
													/>
												</Col>
											</Row>
										</>
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
