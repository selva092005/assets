import API from "../config/api";

const COOKIE_OPTS = "path=/; SameSite=Lax; max-age=86400";
export const setCookie    = (k, v) => { document.cookie = `${k}=${v.trim()}; ${COOKIE_OPTS}`; };
export const getCookie    = (k)    => document.cookie.split("; ").find((r) => r.startsWith(`${k}=`))?.split("=")[1];
export const removeCookie = (k)    => { document.cookie = `${k}=; path=/; max-age=0; SameSite=Strict`; };

const normalizeRole = (raw) =>
  raw ? String(raw).replace("ROLE_", "").toLowerCase() : null;

export const login = async (email, password) => {
  const response = await API.post("/api/auth/login", { email, password });
  const data = response.data?.data || response.data;

  const token        = data?.token || data?.accessToken;
  const refreshToken = data?.refreshToken;
  const role         = normalizeRole(data?.role);

  if (!token) throw new Error("Token not found in response");

  setCookie("token", token);
  if (refreshToken) setCookie("refreshToken", refreshToken);
  if (role) localStorage.setItem("role", role);

  return { token, refreshToken, role };
};

export const getToken = () => getCookie("token");

export const logout = () => {
  removeCookie("token");
  removeCookie("refreshToken");
  localStorage.removeItem("role");
};
