import unauthorApi from "./baseAPI/unauthorAPI";
import authorApi from "./baseAPI/authorAPI";

// Map to backend controllers
// Login: POST /api/Login/login -> returns { AccessToken }
// Refresh: POST /api/Token/refresh -> returns string (access token); needs body { accessToken }
// Logout: POST /api/Token/logout (Authorized)
// Register/Forgot password: /api/User endpoints
const authAPI = {
  login: (credentials) => {
    const payload = {
      UsernameOrEmail: credentials.email || credentials.username || credentials.UsernameOrEmail,
      Password: credentials.password,
    };
    return unauthorApi
      .post("/Login/login", payload)
      .then((response) => response.data?.accessToken || response.data?.AccessToken);
  },

  register: (form) => {
    const payload = {
      UserName: form.username,
      Email: form.email,
      PhoneNumber: form.phoneNumber,
      Password: form.password,
      ConfirmPassword: form.confirmPassword,
      Address: form.address
    };
    return unauthorApi
      .post("/User/register", payload)
      .then((response) => response.data);
  },

  refreshToken: async () => {
    const currentToken = localStorage.getItem('authToken') || '';
    return unauthorApi
      .post("/Token/refresh", { accessToken: currentToken })
      .then((response) => response.data?.accessToken);
  },

  logout: async () =>
    authorApi
      .post("/Token/logout")
      .then((response) => response.data),

  // Xác nhận email qua link trong mail: GET /api/User/confirm-email?userId=...&token=...
  confirmEmail: (userId, token) =>
    unauthorApi
      .get('/User/confirm-email', { params: { userId, token } })
      .then((response) => response.data),

  // Gửi lại email xác nhận
  resendConfirmEmail: (emailOrUsername) =>
    unauthorApi
      .post('/User/resend-confirm-email', { EmailOrUsername: emailOrUsername })
      .then((response) => response.data),

  // Backend doesn't expose current-user endpoint; derive from token on client if needed
  getCurrentUser: async () => null,

  forgotPassword: ({ Email }) =>
    unauthorApi
      .post("/User/forgot-password", { Email })
      .then((response) => response.data),

  resetPassword: ({ UserId, Token, NewPassword, ConfirmPassword }) =>
    unauthorApi
      .post('/User/reset-password', { UserId, Token, NewPassword, ConfirmPassword })
      .then((response) => response.data),
};

export default authAPI;
