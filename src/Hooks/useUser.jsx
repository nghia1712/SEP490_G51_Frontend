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
      
      // Call API để lấy thông tin profile từ backend
      const response = await userAPI.getProfile();
      if (response && response.data) {
        setProfile(response.data);
        setLoading(false);
        return response;
      } else {
        throw new Error('Không thể lấy thông tin profile');
      }
    } catch (err) {
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
