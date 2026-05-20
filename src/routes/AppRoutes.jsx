import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Layout          from "../components/layout/Layout";
import Dashboard       from "../pages/Dashboard";
import Assets          from "../pages/Assets";
import AssetFormPage   from "../pages/AssetFormPage";
import Users           from "../pages/Users";
import UserFormPage    from "../pages/UserFormPage";
import Login           from "../pages/Login";
import AssetAllocation from "../pages/AssetAllocation";
import AssetDisposal   from "../pages/AssetDisposal";
import BulkUploadPage  from "../pages/BulkUploadPage";

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useSelector((s) => s.auth);
  return isLoggedIn ? children : <Navigate to="/" replace />;
}

function RoleRoute({ children, allowedRoles }) {
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
        <Route index element={<Dashboard />} />

        {/* Assets — all roles can view; admin+manager can create/edit */}
        <Route path="assets"          element={<Assets />} />
        <Route path="assets/new"      element={<RoleRoute allowedRoles={["admin", "manager"]}><AssetFormPage /></RoleRoute>} />
        <Route path="assets/edit/:id"   element={<RoleRoute allowedRoles={["admin", "manager"]}><AssetFormPage /></RoleRoute>} />
        <Route path="assets/bulk-upload"  element={<RoleRoute allowedRoles={["admin"]}><BulkUploadPage /></RoleRoute>} />

        {/* Users — admin+manager can view; only admin can create/edit */}
        <Route path="users"           element={<RoleRoute allowedRoles={["admin", "manager"]}><Users /></RoleRoute>} />
        <Route path="users/new"       element={<RoleRoute allowedRoles={["admin"]}><UserFormPage /></RoleRoute>} />
        <Route path="users/edit/:id"  element={<RoleRoute allowedRoles={["admin"]}><UserFormPage /></RoleRoute>} />

        {/* Allocation — admin + manager */}
        <Route path="allocation" element={<RoleRoute allowedRoles={["admin", "manager"]}><AssetAllocation /></RoleRoute>} />

        {/* Disposal — admin only */}
        <Route path="disposal" element={<RoleRoute allowedRoles={["admin"]}><AssetDisposal /></RoleRoute>} />

        <Route path="reports" element={<h1>Reports</h1>} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
