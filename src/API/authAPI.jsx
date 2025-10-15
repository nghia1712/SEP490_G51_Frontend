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
      UserName: form.fullName,
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
      .then((response) => response.data);
  },

  logout: async () =>
    authorApi
      .post("/Token/logout")
      .then((response) => response.data),

  // Backend doesn't expose current-user endpoint; derive from token on client if needed
  getCurrentUser: async () => null,

  forgotPassword: (data) =>
    unauthorApi
      .post("/User/forgot-password", data)
      .then((response) => response.data),
};

export default authAPI;
