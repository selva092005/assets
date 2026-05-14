import { createSlice } from "@reduxjs/toolkit";
import { login as loginService, logout as logoutCookie, getTokenFromCookie } from "../../services/auth_service";

// ── helpers ────────────────────────────────────
const getRoleFromToken = (token) => {
  if (!token?.includes(".")) return "user";
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    const raw =
      payload.role || payload.userRole || payload.type ||
      payload.authority || payload.roles?.[0] || payload.authorities?.[0] || "user";
    return String(raw).replace("ROLE_", "").toLowerCase();
  } catch {
    return "user";
  }
};

const token    = getTokenFromCookie();
const userRole = getRoleFromToken(token);

// ── slice ──────────────────────────────────────
const authSlice = createSlice({
  name: "auth",
  initialState: {
    token,
    userRole,
    isLoggedIn: !!token,
    loading:    false,
    error:      null,
  },
  reducers: {
    setCredentials(state, { payload: { token, userRole } }) {
      state.token      = token;
      state.userRole   = userRole;
      state.isLoggedIn = true;
      state.error      = null;
    },
    logoutUser(state) {
      logoutCookie();
      state.token      = null;
      state.userRole   = "user";
      state.isLoggedIn = false;
    },
    setAuthError(state, { payload }) {
      state.error   = payload;
      state.loading = false;
    },
    setAuthLoading(state, { payload }) {
      state.loading = payload;
    },
  },
});

export const { setCredentials, logoutUser, setAuthError, setAuthLoading } = authSlice.actions;
export default authSlice.reducer;

// ── thunk ──────────────────────────────────────
export const loginThunk = (email, password) => async (dispatch) => {
  dispatch(setAuthLoading(true));
  try {
    await loginService(email, password);
    const newToken = getTokenFromCookie();
    dispatch(setCredentials({ token: newToken, userRole: getRoleFromToken(newToken) }));
    return { success: true };
  } catch (err) {
    const message = err.response?.data?.message || "Login failed";
    dispatch(setAuthError(message));
    return { success: false, error: message };
  } finally {
    dispatch(setAuthLoading(false));
  }
};
