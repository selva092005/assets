import { useSelector } from "react-redux";

/**
 * useAuth – reads auth state from Redux store
 * @returns {{ isLoggedIn, userRole, token, loading, error }}
 */
export default function useAuth() {
  return useSelector((state) => state.auth);
}
