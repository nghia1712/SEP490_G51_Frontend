/**
 * Utility function to extract and format error messages from API errors
 * Handles 504 Gateway Timeout and other common errors
 */
export const extractErrorMessage = (error, fallback = "Đã xảy ra lỗi") => {
  if (!error) return fallback;

  // Xử lý lỗi 504 Gateway Timeout
  if (error.response?.status === 504) {
    return "Máy chủ đang yêu cầu xử lý quá lâu. Vui lòng thử lại";
  }

  // Xử lý lỗi timeout từ axios
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return "Máy chủ đang yêu cầu xử lý quá lâu. Vui lòng thử lại";
  }

  const data = error.response?.data ?? {};

  // Kiểm tra nếu response data là HTML (thường xảy ra với 504 từ Nginx)
  if (typeof data === "string" && data.includes("504 Gateway Time-out")) {
    return "Máy chủ đang yêu cầu xử lý quá lâu. Vui lòng thử lại";
  }

  // Kiểm tra nếu response data là HTML (loại bỏ HTML tags)
  if (typeof data === "string" && data.includes("<html>")) {
    if (data.includes("504") || data.includes("Gateway Time-out")) {
      return "Máy chủ đang yêu cầu xử lý quá lâu. Vui lòng thử lại";
    }
    return "Đã xảy ra lỗi từ máy chủ. Vui lòng thử lại sau.";
  }

  const errorsObj = data.errors || data.Errors;
  const errorsArray = Array.isArray(errorsObj)
    ? errorsObj
    : typeof errorsObj === "object"
    ? Object.values(errorsObj).flat()
    : null;

  const candidates = [
    typeof data === "string" && !data.includes("<html>") ? data : null,
    data.message,
    data.Message,
    data.error,
    data.Error,
    data.title,
    data.Title,
    errorsArray && errorsArray[0],
    Array.isArray(errorsArray) && errorsArray.length > 0
      ? errorsArray.join(", ")
      : null,
    error.response?.data?.Data?.Message,
    error.message,
  ];

  const message = candidates.find(
    (msg) => typeof msg === "string" && msg.trim() !== ""
  );

  if (message) {
    if (message.trim() === "One or more validation errors occurred.") {
      return "Bạn chưa điền đủ thông tin, vui lòng kiểm tra lại.";
    }
    return message;
  }
  return fallback;
};

/**
 * Check if error is a timeout error (504 or axios timeout)
 */
export const isTimeoutError = (error) => {
  if (!error) return false;
  
  return (
    error.response?.status === 504 ||
    error.code === 'ECONNABORTED' ||
    error.message?.includes('timeout') ||
    (typeof error.response?.data === "string" && 
     error.response.data.includes("504 Gateway Time-out"))
  );
};

