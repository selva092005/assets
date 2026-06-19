import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Layout from "../components/layout/Layout";
import Dashboard from "../pages/Dashboard";
import Assets from "../pages/Assets";
import AssetFormPage from "../pages/AssetFormPage";
import Users from "../pages/Users";
import UserFormPage from "../pages/UserFormPage";
import Login from "../pages/Login";
import AssetAllocation from "../pages/AssetAllocation";
import AssetDisposal from "../pages/AssetDisposal";
import BulkUploadPage from "../pages/BulkUploadPage";
import AssetDetailPage from "../pages/AssetDetailPage";
import UserDetailPage from "../pages/UserDetailPage";
import TransferPage from "../pages/TransferPage";
import ReportsPage from "../pages/ReportsPage";
import Locations from "../pages/Locations";
import NotFound from "../pages/NotFound";
import AssetAudit from "../pages/AssetAudit";
import AssetRequestPage from "../pages/AssetRequestPage";
import AssetMaintenancePage from "../pages/AssetMaintenancePage";
import ScanAsset from "../pages/ScanAsset";

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
        <Route path="assets" element={<Assets />} />
        <Route path="assets/view/:id" element={<RoleRoute allowedRoles={["admin", "manager", "user"]}><AssetDetailPage /></RoleRoute>} />
        <Route path="assets/new" element={<RoleRoute allowedRoles={["admin", "manager"]}><AssetFormPage /></RoleRoute>} />
        <Route path="assets/edit/:id" element={<RoleRoute allowedRoles={["admin", "manager"]}><AssetFormPage /></RoleRoute>} />
        <Route path="assets/bulk-upload" element={<RoleRoute allowedRoles={["admin"]}><BulkUploadPage mode="assets" /></RoleRoute>} />

        {/* Users — admin+manager can view; only admin can create/edit */}
        <Route path="users" element={<RoleRoute allowedRoles={["admin", "manager"]}><Users /></RoleRoute>} />
        <Route path="users/view/:id" element={<RoleRoute allowedRoles={["admin", "manager"]}><UserDetailPage /></RoleRoute>} />
        <Route path="users/new" element={<RoleRoute allowedRoles={["admin"]}><UserFormPage /></RoleRoute>} />
        <Route path="users/edit/:id" element={<RoleRoute allowedRoles={["admin"]}><UserFormPage /></RoleRoute>} />
        <Route path="users/bulk-upload" element={<RoleRoute allowedRoles={["admin"]}><BulkUploadPage mode="users" /></RoleRoute>} />

        {/* Locations — admin + manager */}
        <Route path="locations" element={<RoleRoute allowedRoles={["admin", "manager"]}><Locations /></RoleRoute>} />

        {/* Allocation — admin + manager */}
        <Route path="allocation" element={<RoleRoute allowedRoles={["admin", "manager"]}><AssetAllocation /></RoleRoute>} />

        {/* Transfer — admin + manager */}
        <Route path="transfer" element={<RoleRoute allowedRoles={["admin", "manager"]}><TransferPage /></RoleRoute>} />

        {/* Disposal — admin only */}
        <Route path="disposal" element={<RoleRoute allowedRoles={["admin"]}><AssetDisposal /></RoleRoute>} />

        {/* Reports — all roles */}
        <Route path="reports" element={<ReportsPage />} />

        {/* Audit, requests, maintenance, QR scan routes */}
        <Route path="audit" element={<RoleRoute allowedRoles={["admin", "manager"]}><AssetAudit /></RoleRoute>} />
        <Route path="requests" element={<RoleRoute allowedRoles={["admin", "manager", "user"]}><AssetRequestPage /></RoleRoute>} />
        <Route path="maintenance" element={<RoleRoute allowedRoles={["admin", "manager"]}><AssetMaintenancePage /></RoleRoute>} />
        <Route path="scan" element={<RoleRoute allowedRoles={["admin", "manager"]}><ScanAsset /></RoleRoute>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
