import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Dashboard from "./components/dashboard/Dashboard";
import Login from "./components/pages/Login";
// import Assets from "./components/dashboard/Assets";

function App() {
  return (
    <Routes>
      {/* Login */}
      <Route path="/" element={<Login />} />

      {/* Layout with Sidebar + Navbar */}
      <Route path="/home" element={<Layout />}>
        <Route index element={<Dashboard />} />
        {/* <Route path="assets" element={<Assets />} /> */}
        {/* <Route path="assets" element={<h1>Assets</h1>} /> */}
        <Route path="books" element={<h1>Books</h1>} />
        <Route path="users" element={<h1>Users</h1>} />
        <Route path="reports" element={<h1>Reports</h1>} />
        <Route path="add" element={<h1>Add Asset</h1>} />
      </Route>

      {/* Redirect unknown routes */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;