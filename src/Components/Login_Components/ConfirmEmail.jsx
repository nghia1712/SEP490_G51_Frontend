import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import authAPI from '../../API/authAPI';

const ConfirmEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState({ loading: true, success: null, message: '' });

  useEffect(() => {
    const userId = searchParams.get('userId');
    const token = searchParams.get('token');

    const run = async () => {
      try {
        if (!userId || !token) {
          setStatus({ loading: false, success: false, message: 'Liên kết không hợp lệ.' });
          return;
        }

        const res = await authAPI.confirmEmail(userId, token);
        const ok = res?.success ?? true;
        const msg = res?.message || 'Xác nhận email thành công';
        setStatus({ loading: false, success: ok, message: msg });
        if (ok) setTimeout(() => navigate('/login'), 2000);
      } catch (err) {
        setStatus({ loading: false, success: false, message: err?.response?.data?.message || err.message || 'Xác nhận email thất bại' });
      }
    };

    run();
  }, [searchParams, navigate]);

  return (
    <div style={{ maxWidth: 520, margin: '80px auto', padding: 24, background: 'white', borderRadius: 12, textAlign: 'center' }}>
      <h3>Xác nhận email</h3>
      {status.loading && <p>Đang xử lý liên kết...</p>}
      {!status.loading && (
        <>
          <p style={{ color: status.success ? '#198754' : '#dc3545' }}>{status.message}</p>
          {!status.success && (
            <p>Vui lòng kiểm tra lại email của bạn hoặc yêu cầu gửi lại liên kết xác nhận.</p>
          )}
        </>
      )}
    </div>
  );
};

export default ConfirmEmail;


