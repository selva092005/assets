import axios from "axios";

const COOKIE_OPTS  = "path=/; SameSite=Lax; max-age=86400";
const getCookie    = (k)    => document.cookie.split("; ").find((r) => r.startsWith(`${k}=`))?.split("=")[1];
const setCookie    = (k, v) => { document.cookie = `${k}=${v.trim()}; ${COOKIE_OPTS}`; };
const removeCookie = (k)    => { document.cookie = `${k}=; path=/; max-age=0; SameSite=Strict`; };

const clearSession = () => {
  removeCookie("token");
  removeCookie("refreshToken");
  localStorage.removeItem("role");
};

const API = axios.create({ baseURL: import.meta.env.VITE_BASE_URL });

API.interceptors.request.use((config) => {
  const token = getCookie("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (original.url?.includes("/api/auth/")) {
        return Promise.reject(error);
      }
      const refreshToken = getCookie("refreshToken");
      const accessToken  = getCookie("token");
      if (!refreshToken || !accessToken) {
        clearSession();
        window.location.href = "/";
        return Promise.reject(error);
      }
      if (isRefreshing) {
        return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
          .then((token) => { original.headers.Authorization = `Bearer ${token}`; return API(original); });
      }
      original._retry = true;
      isRefreshing    = true;
      try {
        const res      = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/auth/refresh`, { refreshToken });
        const data     = res.data?.data || res.data;
        const newToken = data?.token || data?.accessToken;
        const newRefresh = data?.refreshToken;
        const newRole    = data?.role;
        setCookie("token", newToken);
        if (newRefresh) setCookie("refreshToken", newRefresh);
        if (newRole) localStorage.setItem("role", String(newRole).replace("ROLE_", "").toLowerCase());
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return API(original);
      } catch (err) {
        processQueue(err, null);
        clearSession();
        window.location.href = "/";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default API;
