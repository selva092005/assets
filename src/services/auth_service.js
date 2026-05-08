import API from "../config/api";

export const login = async (email, password) => {
  const response = await API.post("/api/auth/login", { email, password });

  const token =
    response.data?.token ||
    response.data?.accessToken ||
    response.data?.data?.token ||
    response.headers["authorization"]?.replace("Bearer ", "");

  if (!token) throw new Error("Token not found in response");

  document.cookie = `token=${token.trim()}; path=/; SameSite=Strict; max-age=86400`;
  return response.data;
};

export const getTokenFromCookie = () =>
  document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

export const logout = () => {
  document.cookie = "token=; path=/; max-age=0; SameSite=Strict";
};
