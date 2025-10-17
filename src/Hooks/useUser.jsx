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
      if (!token) throw new Error('Chưa đăng nhập');
      
      // Lấy userId từ access token (hỗ trợ cả định dạng claim URI của ASP.NET)
      const [, payload] = token.split('.')
      const tokenData = JSON.parse(atob(payload))
      let userId = tokenData?.nameid || tokenData?.nameidentifier || tokenData?.sub || tokenData?.UserId || tokenData?.userId || tokenData?.uid
      if (!userId) {
        for (const [k, v] of Object.entries(tokenData)) {
          const key = k.toLowerCase()
          if (key.includes('/nameidentifier') || key.endsWith('/sid') || key.endsWith('/nameid') || key.endsWith('/subject')) {
            userId = v
            break
          }
        }
      }

      if (!userId) throw new Error('Không tìm thấy userId trong token')

      // Gọi API Admin/get-account-details để lấy profile
      const response = await userAPI.getProfile(userId);
      if (response && response.data) {
        // Chuẩn hóa theo API /api/Admin/get-account-details trả về { success, message, data }
        const payload = response.data?.data ?? response.data;
        // Lưu bản chuẩn hóa tối thiểu phục vụ ViewProfile
        const normalized = {
          fullName: payload?.fullName ?? payload?.FullName ?? payload?.name ?? "",
          email: payload?.email ?? payload?.Email ?? "",
          phoneNumber: payload?.phoneNumber ?? payload?.PhoneNumber ?? "",
          address: payload?.address ?? payload?.Address ?? "",
          gender: payload?.gender ?? payload?.Gender ?? "",
          createAt: payload?.createAt ?? payload?.CreateAt ?? payload?.createdAt ?? null,
          status: payload?.status ?? payload?.userStatus ?? true,
          avatar: payload?.avatar ?? payload?.Avatar ?? "",
          mst: payload?.mst ?? payload?.Mst ?? "",
        };
        setProfile({ ...payload, ...normalized });
        setLoading(false);
        return { data: { data: { ...payload, ...normalized } } };
      } else {
        throw new Error('Không thể lấy thông tin profile');
      }
    } catch (err) {
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
      // Backend hiện chưa có endpoint edit profile trong UserController
      throw new Error('Chức năng chỉnh sửa hồ sơ chưa được hỗ trợ trên backend');
    } catch (err) {
      setError(err.message || 'Edit profile failed');
      setLoading(false);
      return null;
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
      // Backend hiện chưa có endpoint đổi mật khẩu trong UserController
      throw new Error('Chức năng đổi mật khẩu chưa được hỗ trợ trên backend');
    } catch (err) {
      setError(err.message || 'Change password failed');
      setLoading(false);
      return null;
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
    getAllUsers,
    changePassword,
    updateUser,
    banUser,
  };
};

export default useUser;
