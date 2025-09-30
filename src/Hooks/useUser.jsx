import { useState } from 'react';
import userAPI from '../API/userAPI';
import { mockAPI } from '../mockAPI';

const useUser = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [users, setUsers] = useState([]);

  const getProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      // Sử dụng mock API thay vì API thật
      const res = await mockAPI.getCurrentUser(token);
      setProfile(res);
      setLoading(false);
      return { data: res };
    } catch (err) {
      setError(err.message || 'Get profile failed');
      setLoading(false);
      return null;
    }
  };

  const editProfile = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      // Sử dụng mock API thay vì API thật
      const res = await mockAPI.editProfile(token, formData);
      setProfile(res.user);
      setLoading(false);
      return { data: res };
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
      const token = localStorage.getItem("authToken");
      // Sử dụng mock API thay vì API thật
      const res = await mockAPI.changePassword(token, data);
      setLoading(false);
      return res;
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
