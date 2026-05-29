import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Box, Button, Select, MenuItem, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, LinearProgress,
  IconButton, InputAdornment,
} from "@mui/material";
import { FaFilter, FaFileExport, FaPlus, FaUpload, FaDownload, FaFileExcel, FaTimes, FaUsers, FaUserShield, FaUserTie, FaUser } from "react-icons/fa";
import toast from "../utils/toast.jsx";
import {
  fetchUsers,
  setUserPage, setUserSearch, setUserFilter, resetUserFilters,
} from "../store/slices/userSlice";
import { deleteUser, getUserById, bulkUploadUsers, exportUsers, downloadUserTemplate, getUserSummaryStats } from "../services/users_service";
import { COLORS, outlinedBtnSx, primaryBtnSx, selectSx } from "../theme/tokens";

import PageHeader from "../components/common/PageHeader";
import SearchBar from "../components/common/SearchBar";
import TableCard from "../components/common/TableCard";
import TablePagination from "../components/common/TablePagination";
import UserTable from "../components/users/UserTable";
import ConfirmDialog from "../components/common/ConfirmDialog";
import StatCard from "../components/common/StatCard";

export default function UsersPage() {
  const dispatch = useDispatch();
  const { items: users, totalPages, page, search, filterRole, loading } =
    useSelector((s) => s.users);
  const { userRole, userName } = useSelector((s) => s.auth);
  const isAdmin = userRole === "admin";
  const canExport = userRole === "admin" || userRole === "manager";

  const [showCount, setShowCount] = useState(10);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  // Re-fetch whenever page, showCount, or filterRole changes
  useEffect(() => {
    if (userRole === "manager" || userRole === "admin") {
      dispatch(fetchUsers({ keyword: search, page, size: showCount, role: filterRole || undefined }));
    }
  }, [page, showCount, filterRole, dispatch, userRole]);

  // Fetch summary counts once on mount
  useEffect(() => {
    if (userRole === "manager" || userRole === "admin") {
      getUserSummaryStats()
        .then((res) => setStats(res))
        .catch(() => {});
    }
  }, [userRole]);

  if (userRole !== "admin" && userRole !== "manager") return <Navigate to="/home" replace />;

  const reload = () => {
    dispatch(fetchUsers({ keyword: search, page, size: showCount, role: filterRole || undefined }));
    getUserSummaryStats()
      .then((res) => setStats(res))
      .catch(() => {});
  };

  const handleSearch = () => {
    dispatch(setUserPage(0));
    dispatch(fetchUsers({ keyword: search, page: 0, size: showCount, role: filterRole || undefined }));
  };

  const handleReset = () => {
    dispatch(resetUserFilters());
    dispatch(fetchUsers({ keyword: "", page: 0, size: showCount }));
  };

  const handleFilterChange = (value) => {
    dispatch(setUserFilter(value));
    dispatch(setUserPage(0));
    // useEffect above will trigger the fetch on filterRole change
  };

  const handleShowCountChange = (value) => {
    setShowCount(Number(value));
    dispatch(setUserPage(0));
    // useEffect above will trigger the fetch on showCount change
  };

  const handleExport = async () => {
    try {
      await exportUsers();
      toast.success("Export downloaded successfully");
    } catch {
      toast.error("Export failed. Please try again.");
    }
  };

  const handleEdit = (item) => navigate(`/home/users/edit/${item.userId ?? item.id}`);

  const handleDelete = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteUser(deleteId);
      toast.success("User deleted successfully");
      reload();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to delete user");
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  const handleView = (item) => {
    navigate(`/home/users/view/${item.userId || item.id}`);
  };

  return (
    <Box sx={{ p: 0 }}>

      <PageHeader
        title="Users"
        actions={
          <>
            {/* Show count — triggers backend re-fetch */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, fontSize: 11, color: COLORS.textMuted }}>
              Showing
              <Select
                value={showCount}
                onChange={(e) => handleShowCountChange(e.target.value)}
                size="small"
                sx={selectSx}
              >
                {[5, 10, 20, 50].map((n) => (
                  <MenuItem key={n} value={n} sx={{ fontSize: 11 }}>{n}</MenuItem>
                ))}
              </Select>
            </Box>

            {/* Filter by role — delegates filtering to backend */}
            <Select
              value={filterRole}
              onChange={(e) => handleFilterChange(e.target.value)}
              displayEmpty
              size="small"
              sx={selectSx}
              startAdornment={
                <InputAdornment position="start" sx={{ mr: 0.25, pl: 0.5 }}>
                  <FaFilter size={9} color={COLORS.textMuted} />
                </InputAdornment>
              }
            >
              <MenuItem value="" sx={{ fontSize: 11 }}>All Roles</MenuItem>
              {["ADMIN", "MANAGER", "USER"].map((r) => (
                <MenuItem key={r} value={r} sx={{ fontSize: 11 }}>{r}</MenuItem>
              ))}
            </Select>

            {/* Bulk Upload — admin only */}
            {isAdmin && (
              <Button
                variant="outlined"
                startIcon={<FaUpload size={12} />}
                onClick={() => navigate("/home/users/bulk-upload")}
                sx={{ ...outlinedBtnSx, borderColor: "#2e7d32", color: "#2e7d32" }}
              >
                Bulk Upload
              </Button>
            )}
            {/* Export — admin + manager */}
            {canExport && (
              <Button
                variant="outlined"
                startIcon={<FaFileExport size={12} />}
                onClick={handleExport}
                sx={outlinedBtnSx}
              >
                Export
              </Button>
            )}
            {/* Add New — admin only */}
            {isAdmin && (
              <Button
                variant="contained"
                startIcon={<FaPlus size={11} />}
                onClick={() => navigate("/home/users/new")}
                sx={{ ...primaryBtnSx, background: COLORS.primary, "&:hover": { background: COLORS.primaryDark } }}
              >
                Add New User
              </Button>
            )}
          </>
        }
      />

      {/* ── User Stat Ribbon (4 Symmetrical Columns with Clean Top Color Accents) ── */}
      <Box sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, 1fr)",
          sm: "repeat(4, 1fr)"
        },
        gap: 2,
        mb: 2,
        animation: "fadeUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "@keyframes fadeUp": {
          from: { opacity: 0, transform: "translateY(10px)" },
          to: { opacity: 1, transform: "translateY(0)" }
        }
      }}>
        <StatCard label="Total Users" value={stats?.total ?? 0} icon={<FaUsers />} iconColor="#3949ab" />
        <StatCard label="Administrators" value={stats?.adminCount ?? 0} icon={<FaUserShield />} iconColor="#2563eb" />
        <StatCard label="Managers" value={stats?.managerCount ?? 0} icon={<FaUserTie />} iconColor="#10b981" />
        <StatCard label="Regular Users" value={stats?.userCount ?? 0} icon={<FaUser />} iconColor="#d97706" />
      </Box>

      <SearchBar
        value={search}
        placeholder="Search by name, email..."
        onChange={(e) => dispatch(setUserSearch(e.target.value))}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      <TableCard>
        {loading
          ? <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
          : <UserTable users={users} loading={false} currentUserName={userName} userRole={userRole} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />
        }
        <TablePagination page={page} totalPages={totalPages} onPageChange={(pg) => dispatch(setUserPage(pg))} />
      </TableCard>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
        confirmLabel="Delete"
      />
    </Box>
  );
}