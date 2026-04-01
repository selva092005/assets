import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const login = async (email, password) => {
  try {
    const response = await API.post("/api/auth/login", {
      email: email,
      password: password,
    });

    return response.data;
  } catch (error) {
    console.error("Login API Error:", error);
    throw error;
  }
};