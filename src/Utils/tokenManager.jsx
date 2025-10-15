/**
 * Token Manager - Quản lý token và tự động refresh
 */

class TokenManager {
  constructor() {
    this.refreshPromise = null;
    this.isRefreshing = false;
    this.sessionManager = null;
  }

  /**
   * Thiết lập session manager
   */
  setSessionManager(sessionManager) {
    this.sessionManager = sessionManager;
  }

  /**
   * Kiểm tra token có hết hạn không
   * @param {string} token - JWT token
   * @returns {boolean} - true nếu token hết hạn
   */
  isTokenExpired(token) {
    if (!token) return true;

    try {
      const [, payload] = token.split('.');
      const data = JSON.parse(atob(payload));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Kiểm tra nếu token hết hạn trong vòng 30 giây tới
      return data.exp <= currentTime + 30;
    } catch (error) {
      console.error('Lỗi khi kiểm tra token:', error);
      return true;
    }
  }

  /**
   * Lấy thời gian hết hạn của token
   * @param {string} token - JWT token
   * @returns {number} - Thời gian hết hạn (timestamp)
   */
  getTokenExpiration(token) {
    if (!token) return 0;

    try {
      const [, payload] = token.split('.');
      const data = JSON.parse(atob(payload));
      return data.exp * 1000; // Convert to milliseconds
    } catch (error) {
      console.error('Lỗi khi lấy thời gian hết hạn token:', error);
      return 0;
    }
  }

  /**
   * Tự động refresh token nếu cần thiết
   * @returns {Promise<string|null>} - Token mới hoặc null
   */
  async autoRefreshToken() {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      console.log('Không có token để refresh');
      return null;
    }

    if (!this.isTokenExpired(token)) {
      console.log('Token chưa hết hạn, không cần refresh');
      return token;
    }

    // Nếu đang refresh thì đợi kết quả
    if (this.isRefreshing) {
      console.log('Đang refresh token, đợi kết quả...');
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performRefresh();

    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Thực hiện refresh token
   * @returns {Promise<string|null>} - Token mới hoặc null
   */
  async performRefresh() {
    try {
      console.log('Bắt đầu refresh token...');
      
      // Import authAPI dynamically để tránh circular dependency
      const { default: authAPI } = await import('../API/authAPI');
      const newToken = await authAPI.refreshToken();
      
      if (newToken && typeof newToken === 'string') {
        localStorage.setItem('authToken', newToken);
        console.log('Refresh token thành công');
        return newToken;
      } else {
        console.error('Refresh token response không hợp lệ');
        this.clearTokens();
        return null;
      }
    } catch (error) {
      console.error('Lỗi khi refresh token:', error);
      this.clearTokens();
      return null;
    }
  }

  /**
   * Xóa tất cả token và user data
   */
  clearTokens() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Clear session nếu có session manager
    if (this.sessionManager) {
      this.sessionManager.clearSession();
    }
    
    // Show notification to user if available
    if (window.showNotification) {
      window.showNotification('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'warning');
    }
  }

  /**
   * Thiết lập timer để tự động refresh token
   */
  setupAutoRefresh() {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const expirationTime = this.getTokenExpiration(token);
    if (expirationTime <= 0) return;

    // Refresh token 1 phút trước khi hết hạn
    const refreshTime = expirationTime - Date.now() - 60000; // 1 minute before expiry

    if (refreshTime > 0) {
      console.log(`Sẽ tự động refresh token sau ${Math.floor(refreshTime / 1000)} giây`);
      
      setTimeout(async () => {
        await this.autoRefreshToken();
        // Thiết lập lại timer cho token mới
        this.setupAutoRefresh();
      }, refreshTime);
    }
  }

  /**
   * Lấy token hiện tại, tự động refresh nếu cần
   * @returns {Promise<string|null>} - Token hiện tại hoặc null
   */
  async getValidToken() {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      return null;
    }

    if (this.isTokenExpired(token)) {
      console.log('Token đã hết hạn, đang refresh...');
      return await this.autoRefreshToken();
    }

    return token;
  }
}

// Export singleton instance
const tokenManager = new TokenManager();
export default tokenManager;
