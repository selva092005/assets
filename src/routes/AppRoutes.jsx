import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Layout    from "../components/layout/Layout";
import Dashboard from "../pages/Dashboard";
import Assets    from "../pages/Assets";
import Users     from "../pages/Users";
import Login     from "../pages/Login";

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useSelector((s) => s.auth);
  return isLoggedIn ? children : <Navigate to="/" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route path="/home" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index           element={<Dashboard />} />
        <Route path="assets"   element={<Assets />} />
        <Route path="users"    element={<Users />} />
        <Route path="books"    element={<h1>Books</h1>} />
        <Route path="reports"  element={<h1>Reports</h1>} />
        <Route path="add"      element={<h1>Add Asset</h1>} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
