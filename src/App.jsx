import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Dashboard from "./components/dashboard/Dashboard";
import Login from "./components/pages/Login";
import Assets from "./components/dashboard/Assets";
import Users from "./components/dashboard/Users";
import { getTokenFromCookie } from "./service/login";

function ProtectedRoute({ children }) {
  return getTokenFromCookie() ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <Routes>
      {/* Login */}
      <Route path="/" element={<Login />} />

      {/* Layout with Sidebar + Navbar */}
      <Route path="/home" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="assets" element={<Assets />} />
        {/* <Route path="assets" element={<h1>Assets</h1>} /> */}
        <Route path="books" element={<h1>Books</h1>} />
        <Route path="users" element={<Users />} />
        <Route path="reports" element={<h1>Reports</h1>} />
        <Route path="add" element={<h1>Add Asset</h1>} />
      </Route>

      {/* Redirect unknown routes */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;