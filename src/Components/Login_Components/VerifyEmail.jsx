import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const VerifyEmail = () => {
    const { user, token } = useParams();
    const [message, setMessage] = useState("Đang xác minh...");
    const [error, setError] = useState(null);

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const response = await axios.get(`http://localhost:9999/authentication/verify-email/${user}/${token}`);
                setMessage(response.data.message || "Xác minh thành công!");
            } catch (err) {
                console.error(err);
                setError("Xác minh thất bại. Liên hệ quản trị viên.");
            }
        };

        if (user && token) {
            verifyEmail();
        } else {
            setError("Thiếu thông tin xác minh.");
        }
    }, [user, token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full text-center">
                <h1 className="text-2xl font-bold mb-4">Xác minh Email</h1>
                {error ? (
                    <p className="text-red-500">{error}</p>
                ) : (
                    <p className="text-green-600">{message}</p>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
