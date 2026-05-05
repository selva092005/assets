
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
});

const getTokenFromCookie = () =>
  document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

API.interceptors.request.use(
  (config) => {
    const token = getTokenFromCookie();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;