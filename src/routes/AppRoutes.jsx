import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Layout         from "../components/layout/Layout";
import Dashboard      from "../pages/Dashboard";
import Assets         from "../pages/Assets";
import AssetFormPage  from "../pages/AssetFormPage";
import Users          from "../pages/Users";
import UserFormPage   from "../pages/UserFormPage";
import Login          from "../pages/Login";

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useSelector((s) => s.auth);
  return isLoggedIn ? children : <Navigate to="/" replace />;
}

function RoleProtectedRoute({ children, allowedRoles }) {
  const { isLoggedIn, userRole } = useSelector((s) => s.auth);
  if (!isLoggedIn) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(userRole)) return <Navigate to="/home" replace />;
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route path="/home" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index          element={<Dashboard />} />
        <Route path="assets"          element={<Assets />} />
        <Route path="assets/new"       element={<AssetFormPage />} />
        <Route path="assets/edit/:id"  element={<AssetFormPage />} />
        <Route path="users"          element={<RoleProtectedRoute allowedRoles={["manager"]}><Users /></RoleProtectedRoute>} />
        <Route path="users/new"       element={<RoleProtectedRoute allowedRoles={["manager"]}><UserFormPage /></RoleProtectedRoute>} />
        <Route path="users/edit/:id"  element={<RoleProtectedRoute allowedRoles={["manager"]}><UserFormPage /></RoleProtectedRoute>} />
        <Route path="reports" element={<h1>Reports</h1>} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
