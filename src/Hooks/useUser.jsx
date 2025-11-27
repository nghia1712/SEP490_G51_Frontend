import { useState, useCallback } from 'react';
import userAPI from '../API/userAPI';

const useUser = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [users, setUsers] = useState([]);

  const getProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      console.log("=== DEBUG getProfile ===");
      console.log("Token exists:", !!token);
      console.log("Token preview:", token ? token.substring(0, 50) + "..." : "No token");
      
      if (!token) throw new Error('Chưa đăng nhập');
      
      // Gọi API User/viewprofile (BE tự lấy từ token)
      console.log("Calling userAPI.getProfile()...");
      const response = await userAPI.getProfile();
      console.log("API Response:", response);
      console.log("Response status:", response?.status);
      console.log("Response data:", response?.data);
      
      if (response && response.data) {
        // API User/view-profile trả về { message, data } 
        // data có thể là StaffProfileDTO, CustomerProfileDTO, hoặc CommonProfileDTO
        const apiData = response.data;
        console.log("API Data structure:", apiData);
        
        // Lấy payload từ data field (User/view-profile trả về { message, data })
        const payload = apiData?.data ?? apiData;
        console.log("Payload data:", payload);
        
        // Chuẩn hóa dữ liệu để đảm bảo frontend có thể truy cập với cả camelCase và PascalCase
        const normalized = {
          fullName: payload?.fullName ?? payload?.FullName ?? payload?.name ?? "",
          email: payload?.email ?? payload?.Email ?? "",
          phoneNumber: payload?.phoneNumber ?? payload?.PhoneNumber ?? "",
          address: payload?.address ?? payload?.Address ?? "",
          gender: payload?.gender ?? payload?.Gender ?? "",
          createAt: payload?.createAt ?? payload?.CreateAt ?? payload?.createdAt ?? null,
          status: payload?.status ?? payload?.userStatus ?? true,
          avatar: payload?.avatar ?? payload?.Avatar ?? "",
          // Staff fields
          employeeCode: payload?.employeeCode ?? payload?.EmployeeCode ?? "",
          // Customer fields
          mst: payload?.mst ?? payload?.MST ?? payload?.Mst ?? "",
          mshkd: payload?.mshkd ?? payload?.Mshkd ?? "",
          imageCnkd: payload?.imageCnkd ?? payload?.ImageCnkd ?? "",
          imageByt: payload?.imageByt ?? payload?.ImageByt ?? "",
        };
        
        console.log("Normalized data:", normalized);
        setProfile({ ...payload, ...normalized });
        setLoading(false);
        return { data: { data: { ...payload, ...normalized } } };
      } else {
        throw new Error('Không thể lấy thông tin profile');
      }
    } catch (err) {
      console.log("=== ERROR in getProfile ===");
      console.log("Error:", err);
      console.log("Error response:", err?.response);
      console.log("Error status:", err?.response?.status);
      console.log("Error data:", err?.response?.data);
      
      // Nếu BE trả 404 (chưa có hồ sơ), dùng dữ liệu tối thiểu từ token để hiển thị
      if (err?.response?.status === 404) {
        try {
          const token = localStorage.getItem("authToken");
          if (token?.includes('.')) {
            const [, payload] = token.split('.');
            const tokenData = JSON.parse(atob(payload));
            const minimal = {
              fullName: tokenData?.fullName || tokenData?.name || '',
              email: tokenData?.email || '',
            };
            setProfile(minimal);
            setLoading(false);
            return { data: { data: minimal } };
          }
        } catch {}
        setProfile({});
        setLoading(false);
        return { data: { data: {} } };
      }
      setError(err.response?.data?.message || err.message || 'Get profile failed');
      setLoading(false);
      return null;
    }
  }, []);

  const editProfile = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await userAPI.editProfile(formData);
      setLoading(false);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Edit profile failed');
      setLoading(false);
      throw err;
    }
  };

  const uploadAvatar = async (file) => {
    setLoading(true);
    setError(null);
    try {
      const response = await userAPI.uploadAvatar(file);
      setLoading(false);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Upload avatar failed');
      setLoading(false);
      throw err;
    }
  };

  const getAllUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userAPI.getAllUsers();
      setUsers(res.data || res);
      setLoading(false);
      return res;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Get users failed');
      setLoading(false);
      return null;
    }
  };

  const changePassword = async (data) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Changing password with data:", data);
      const res = await userAPI.changePassword(data);
      console.log("Change password response:", res);
      setLoading(false);
      return res;
    } catch (err) {
      console.error("Change password error:", err);
      setError(err.response?.data?.message || err.message || 'Change password failed');
      setLoading(false);
      throw err;
    }
  };

  const updateUser = async (userId, data) => {
    setLoading(true);
    setError(null);
    try {
      const res = await userAPI.updateUser(userId, data);
      setLoading(false);
      return res;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Update user failed');
      setLoading(false);
      return null;
    }
  };

  const banUser = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await userAPI.banUser(id);
      setLoading(false);
      return res;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Ban user failed');
      setLoading(false);
      return null;
    }
  };

  return {
    profile,
    users,
    loading,
    error,
    getProfile,
    editProfile,
    uploadAvatar,
    getAllUsers,
    changePassword,
    updateUser,
    banUser,
  };
};

export default useUser;
