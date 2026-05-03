
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
});

// ✅ AUTO ATTACH TOKEN
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    console.log("TOKEN:", token); // 🔍 debug

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default API;