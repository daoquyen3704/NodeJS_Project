import axios from "axios";

import cookies from "js-cookie";

axios.defaults.withCredentials = true;

const request = axios.create({
  baseURL: import.meta.env.VITE_SOCKET_URL,
  withCredentials: true,
});

request.defaults.withCredentials = true;

export const requestAddSearch = async (data) => {
  const res = await request.post("/api/add-search-keyword", data);
  return res.data;
};

export const requestResetPassword = async (data) => {
  const res = await request.post("/api/reset-password", data);
  return res.data;
};

export const requestForgotPassword = async (data) => {
  const res = await request.post("/api/forgot-password", data);
  return res.data;
};

export const requestGetHotSearch = async () => {
  const res = await request.get("/api/get-search-keyword");
  return res.data;
};

export const requestSearch = async (keyword) => {
  const res = await request.get("/api/search", { params: { keyword } });
  return res.data;
};

export const requestChatbot = async (data) => {
  const res = await request.post("/chat", data);
  return res.data;
};

export const requestPostSuggest = async () => {
  const res = await request.get("/api/post-suggest");
  return res.data;
};

export const requestAISearch = async (question) => {
  const res = await request.get("/ai-search", { params: { question } });
  return res.data;
};

export const requestRegister = async (data) => {
  const response = await request.post("/api/register", data);
  return response.data;
};

export const requestLoginGoogle = async (data) => {
  const res = await request.post("/api/login-google", data);
  return res.data;
};

export const requestGetAdmin = async () => {
  const res = await request.get("/admin");
  return res.data;
};

export const requestLogin = async (data) => {
  const res = await request.post("/api/login", data);
  return res.data;
};

export const requestAuth = async () => {
  const res = await request.get("/api/auth");
  return res.data;
};

export const requestLogout = async () => {
  const res = await request.get("/api/logout");
  return res.data;
};

export const requestRefreshToken = async () => {
  const res = await request.get("/api/refresh-token");
  return res.data;
};

export const requestUpdateUser = async (data) => {
  const res = await request.post("/api/update-user", data);
  return res.data;
};

export const requestChangePassword = async (data) => {
  const res = await request.post("/api/change-password", data);
  return res.data;
};

export const requestGetUsers = async () => {
  const res = await request.get("/api/get-users");
  return res.data;
};

export const requestGetAdminStats = async () => {
  const res = await request.get("/api/get-admin-stats");
  return res.data;
};

export const requestAdminUpdateUser = async (data) => {
  const res = await request.post("/api/admin/update-user", data);
  return res.data;
};

export const requestAdminDeleteUser = async (data) => {
  const res = await request.post("/api/admin/delete-user", data);
  return res.data;
};

export const requestAdminBanUser = async (data) => {
  const res = await request.post("/api/admin/ban-user", data);
  return res.data;
};

export const requestAdminResetPassword = async (data) => {
  const res = await request.post("/api/admin/reset-password", data);
  return res.data;
};

export const requestUpdatePost = async (data) => {
  const res = await request.post("/api/update-post", data);
  return res.data;
};

export const requestUpdatePostUser = async (data) => {
  const res = await request.post("/api/update-post-user", data);
  return res.data;
};

export const requestDeletePost = async (data) => {
  const res = await request.post("/api/delete-post", data);
  return res.data;
};

export const requestGetRechargeStats = async () => {
  const res = await request.get("/api/get-recharge-stats");
  return res.data;
};

//// posts

export const requestUploadImages = async (data) => {
  const res = await request.post("/api/upload-images", data);
  return res.data;
};

export const requestCreatePost = async (data) => {
  const res = await request.post("/api/create-post", data);
  return res.data;
};

export const requestGetNewPost = async () => {
  const res = await request.get("/api/get-new-post");
  return res.data;
};

export const requestGetPostVip = async () => {
  const res = await request.get("/api/get-post-vip");
  return res.data;
};

export const requestRejectPost = async (data) => {
  const res = await request.post("/api/reject-post", data);
  return res.data;
};

export const requestGetAllPosts = async (data) => {
  const res = await request.get("/api/get-all-posts", { params: data });
  return res.data;
};

export const requestApprovePost = async (data) => {
  const res = await request.post("/api/approve-post", data);
  return res.data;
};

//// favourite

export const requestCreateFavourite = async (data) => {
  const res = await request.post("/api/create-favourite", data);
  return res.data;
};

export const requestDeleteFavourite = async (data) => {
  const res = await request.post("/api/delete-favourite", data);
  return res.data;
};

export const requestGetFavourite = async () => {
  const res = await request.get("/api/get-favourite");
  return res.data;
};

export const requestGetPosts = async (params) => {
  // Filter out parameters with empty string values
  const filteredParams = Object.entries(params)
    .filter(([key, value]) => value !== "")
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});

  const res = await request.get("/api/get-posts", { params: filteredParams });
  return res.data;
};

export const requestExtendPost = async (data) => {
  const res = await request.post("/api/extend-post", data);
  return res.data;
};

export const requestDeletePostUser = async (data) => {
  const res = await request.post("/api/delete-post-user", data);
  return res.data;
};

export const requestGetPostById = async (id) => {
  const res = await request.get(`/api/get-post-by-id`, { params: { id } });
  return res.data;
};

export const requestPayments = async (data) => {
  const res = await request.post("/api/payments", data);
  return res.data;
};

export const requestGetRechargeUser = async () => {
  const res = await request.get("/api/recharge-user");
  return res.data;
};

export const requestGetPostByUserId = async () => {
  const res = await request.get("/api/get-post-by-user-id");
  return res.data;
};

//// messenger

export const requestCreateMessage = async (data) => {
  const res = await request.post("/api/create-message", data);
  return res.data;
};

export const requestGetMessages = async (data) => {
  const res = await request.get("/api/get-messages", { params: data });
  return res.data;
};

export const requestGetMessagesByUserId = async () => {
  const res = await request.get("/api/get-messages-by-user-id");
  return res.data;
};

export const requestMarkMessageRead = async (data) => {
  const res = await request.post("/api/mark-message-read", data);
  return res.data;
};

export const requestMarkAllMessagesRead = async (data) => {
  const res = await request.post("/api/mark-all-messages-read", data);
  return res.data;
};

export const requestUploadImage = async (data) => {
  const res = await request.post("/api/upload-image", data);
  return res.data;
};

let isRefreshing = false;
let failedRequestsQueue = [];

request.interceptors.response.use(
  (response) => response, // Trả về nếu không có lỗi
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi 401 (Unauthorized) và request chưa từng thử refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        console.log('🔄 Access token expired, refreshing...');

        try {
          // Kiểm tra xem có logged cookie không
          const token = cookies.get("logged");
          if (!token) {
            console.error('❌ No logged cookie found, redirecting to login');
            localStorage.clear();
            window.location.href = "/login";
            return Promise.reject(error);
          }

          // Gửi yêu cầu refresh token
          await requestRefreshToken();
          console.log('✅ Token refreshed successfully');

          // Xử lý lại tất cả các request bị lỗi 401 trước đó
          failedRequestsQueue.forEach((req) => req.resolve());
          failedRequestsQueue = [];
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          // Nếu refresh thất bại, đăng xuất
          failedRequestsQueue.forEach((req) => req.reject(refreshError));
          failedRequestsQueue = [];
          localStorage.clear();
          window.location.href = "/login";
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // Trả về một Promise để retry request sau khi token mới được cập nhật
      return new Promise((resolve, reject) => {
        failedRequestsQueue.push({
          resolve: () => {
            // Retry request sau khi token đã được refresh
            console.log('♻️ Retrying request:', originalRequest.url);
            resolve(request(originalRequest));
          },
          reject: (err) => reject(err),
        });
      });
    }

    return Promise.reject(error);
  }
);
