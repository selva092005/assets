import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL, 
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Endpoints (NO BASE_URL here)
export const ENDPOINTS = {
  LOGIN: "/api/auth/login",
  ASSET_TABLE: "/api/assets",
};

export default API;