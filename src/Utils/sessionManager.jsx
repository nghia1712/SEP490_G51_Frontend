/**
 * Session Manager - Quản lý phiên đăng nhập đơn giản
 * Chỉ có 2 tính năng:
 * 1. Refresh token tự động
 * 2. Auto logout sau 5 phút không hoạt động
 */

class SessionManager {
  constructor() {
    this.sessionTimeout = 60 * 60 * 1000; // 60 phút
    this.lastActivity = null;
    this.activityTimer = null;
    
    this.init();
  }

  /**
   * Khởi tạo session manager
   */
  init() {
    // Kiểm tra session hiện tại
    this.checkExistingSession();
    
    // Thiết lập event listeners
    this.setupEventListeners();
    
    // Bắt đầu tracking activity
    this.startActivityTracking();
  }

  /**
   * Kiểm tra session hiện tại khi load trang
   */
  checkExistingSession() {
    const sessionData = localStorage.getItem('sessionData');
    
    if (sessionData) {
      try {
        const { lastActivity } = JSON.parse(sessionData);
        const now = Date.now();
        
        // Kiểm tra nếu session đã hết hạn (60 phút)
        if (now - lastActivity > this.sessionTimeout) {
          console.log('Session đã hết hạn, tự động logout');
          this.forceLogout('Phiên đăng nhập đã hết hạn');
          return;
        }
        
        this.lastActivity = lastActivity;
        console.log('Session còn hợp lệ');
      } catch (error) {
        console.error('Lỗi khi kiểm tra session:', error);
        this.clearSession();
      }
    }
  }

  /**
   * Thiết lập các event listeners
   */
  setupEventListeners() {
    // Track các hoạt động của user
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        this.updateActivity();
      }, true);
    });

    // Xử lý khi user thoát trang
    window.addEventListener('beforeunload', () => {
      this.handlePageUnload();
    });

    // Xử lý khi trang được focus lại
    window.addEventListener('focus', () => {
      this.handlePageFocus();
    });

    // Xử lý visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.handlePageFocus();
      }
    });
  }

  /**
   * Bắt đầu tracking hoạt động
   */
  startActivityTracking() {
    this.updateActivity();
  }

  /**
   * Cập nhật thời gian hoạt động cuối cùng
   */
  updateActivity() {
    const now = Date.now();
    this.lastActivity = now;
    
    // Lưu session data
    this.saveSessionData();
  }

  /**
   * Lưu session data vào localStorage
   */
  saveSessionData() {
    const sessionData = {
      lastActivity: this.lastActivity,
      timestamp: Date.now()
    };
    
    localStorage.setItem('sessionData', JSON.stringify(sessionData));
  }

  /**
   * Xử lý khi user thoát trang
   */
  handlePageUnload() {
    // Lưu thời gian thoát trang
    localStorage.setItem('pageUnloadTime', Date.now().toString());
  }

  /**
   * Xử lý khi trang được focus lại
   */
  handlePageFocus() {
    const unloadTime = localStorage.getItem('pageUnloadTime');
    
    // Kiểm tra nếu có token (user đã login)
    const hasToken = localStorage.getItem('authToken');
    if (!hasToken) {
      return;
    }
    
    if (unloadTime) {
      const timeAway = Date.now() - parseInt(unloadTime);
      
      // Nếu user thoát trang quá 60 phút, tự động logout
      if (timeAway > this.sessionTimeout) {
        console.log('User thoát trang quá 5 phút, tự động logout');
        this.forceLogout('Phiên đăng nhập đã hết hạn do thoát trang quá lâu');
        return;
      }
      
      // Xóa unload time
      localStorage.removeItem('pageUnloadTime');
    }
    
    // Kiểm tra session timeout dựa trên lastActivity
    if (this.lastActivity) {
      const timeSinceActivity = Date.now() - this.lastActivity;
      
      if (timeSinceActivity > this.sessionTimeout) {
        console.log('Session timeout, tự động logout');
        this.forceLogout('Phiên đăng nhập đã hết hạn do không hoạt động');
        return;
      }
    }
    
    // Cập nhật activity
    this.updateActivity();
  }

  /**
   * Force logout
   */
  async forceLogout(reason = 'Phiên đăng nhập đã hết hạn') {
    console.log('Force logout:', reason);
    
    // Clear session data
    this.clearSession();
    
    // Clear tokens
    if (window.tokenManager) {
      window.tokenManager.clearTokens();
    }
    
    // Show notification to user if available
    if (window.showNotification) {
      window.showNotification(reason, 'warning', 5000);
    }
    
    // Redirect to login
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  }

  /**
   * Clear session data
   */
  clearSession() {
    localStorage.removeItem('sessionData');
    localStorage.removeItem('pageUnloadTime');
    
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
    }
  }

  /**
   * Kiểm tra session có hợp lệ không
   */
  isSessionValid() {
    if (!this.lastActivity) return false;
    
    return (Date.now() - this.lastActivity) < this.sessionTimeout;
  }
}

// Export singleton instance
const sessionManager = new SessionManager();

// Make it globally available
window.sessionManager = sessionManager;

export default sessionManager;