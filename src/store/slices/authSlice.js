import { createSlice } from "@reduxjs/toolkit";
import { login as loginService, logout as logoutFn, getToken } from "../../services/auth_service";

const decodePayload = (token) => {
  if (!token?.includes(".")) return null;
  try { return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))); }
  catch { return null; }
};

const getRoleFromToken = (token) => {
  const p = decodePayload(token);
  if (!p) return "user";
  const raw = p.role || p.userRole || p.type || p.authority || p.roles?.[0] || p.authorities?.[0];
  return raw ? String(raw).replace("ROLE_", "").toLowerCase() : "user";
};

const getUserNameFromToken = (token) => {
  const p = decodePayload(token);
  if (!p) return "";
  return p.name || p.username || p.sub || p.email || "";
};

const token    = getToken();
// Only use stored role if it's a non-empty string
const stored   = localStorage.getItem("role") || "";
const userRole = stored.trim() !== "" ? stored.trim() : getRoleFromToken(token);
const userName = getUserNameFromToken(token);

const authSlice = createSlice({
  name: "auth",
  initialState: { token, userRole, userName, isLoggedIn: !!token, loading: false, error: null },
  reducers: {
    setCredentials(state, { payload }) {
      state.token      = payload.token;
      state.userRole   = payload.userRole;
      state.userName   = getUserNameFromToken(payload.token);
      state.isLoggedIn = true;
      state.error      = null;
    },
    logoutUser(state) {
      logoutFn();
      state.token = null; state.userRole = "user"; state.userName = ""; state.isLoggedIn = false;
    },
    setAuthError(state,   { payload }) { state.error   = payload; state.loading = false; },
    setAuthLoading(state, { payload }) { state.loading = payload; },
  },
});

export const { setCredentials, logoutUser, setAuthError, setAuthLoading } = authSlice.actions;
export default authSlice.reducer;

export const loginThunk = (email, password) => async (dispatch) => {
  dispatch(setAuthLoading(true));
  try {
    const { token: newToken, role } = await loginService(email, password);
    const resolvedRole = role
      ? String(role).replace("ROLE_", "").toLowerCase()
      : getRoleFromToken(newToken);
    // Always persist resolved role so page refresh works
    localStorage.setItem("role", resolvedRole);
    dispatch(setCredentials({ token: newToken, userRole: resolvedRole }));
    return { success: true };
  } catch (err) {
    const message = err.response?.data?.message || "Login failed";
    dispatch(setAuthError(message));
    return { success: false, error: message };
  } finally {
    dispatch(setAuthLoading(false));
  }
};
