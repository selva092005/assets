import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  Box, Button, Select, MenuItem, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, LinearProgress,
  IconButton, InputAdornment, Tooltip,
} from "@mui/material";
import { FaFilter, FaFileExport, FaPlus, FaUpload, FaTimes, FaUsers, FaUserShield, FaUserTie, FaUser } from "react-icons/fa";
import toast from "../utils/toast.jsx";
import {
  setUserPage, setUserSearch, setUserFilter, resetUserFilters,
} from "../store/slices/userSlice";
import { deleteUser, getUserById, bulkUploadUsers, exportUsers, downloadUserTemplate, getUserSummaryStats, getUsers } from "../services/users_service";
import { COLORS, outlinedBtnSx, primaryBtnSx, selectSx } from "../theme/tokens";

import PageHeader from "../components/common/PageHeader";
import SearchBar from "../components/common/SearchBar";
import TableCard from "../components/common/TableCard";
import TablePagination from "../components/common/TablePagination";
import UserTable from "../components/users/UserTable";
import ConfirmDialog from "../components/common/ConfirmDialog";
import StatCard from "../components/common/StatCard";

// ── Declarative Debounce Hook ──────────────────────────────────────────────────
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function UsersPage() {
  const dispatch = useDispatch();
  const { page, search, filterRole } = useSelector((s) => s.users);
  const [inputValue, setInputValue] = useState(search);
  const debouncedSearch = useDebounce(inputValue, 600);

  useEffect(() => {
    dispatch(setUserSearch(debouncedSearch));
    dispatch(setUserPage(0));
  }, [debouncedSearch, dispatch]);

  useEffect(() => {
    if (search === "") {
      setInputValue("");
    }
  }, [search]);

  const { userRole, userName } = useSelector((s) => s.auth);
  const isAdmin = userRole === "admin";
  const canExport = userRole === "admin" || userRole === "manager";

  const [showCount, setShowCount] = useState(10);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  // ── Query Fetchers ──────────────────────────────────────────────────────────
  const { data: usersData, isLoading: loading } = useQuery({
    queryKey: ["users", search, page, showCount, filterRole],
    queryFn: async () => {
      const params = { username: search || undefined, page, size: showCount };
      if (filterRole) params.role = filterRole;
      const res = await getUsers(params);
      return {
        content:    res.data?.content    || res.content    || [],
        totalPages: res.data?.totalPages || res.totalPages || 0,
      };
    },
    enabled: userRole === "manager" || userRole === "admin",
    placeholderData: keepPreviousData,
  });

  const users = usersData?.content || [];
  const totalPages = usersData?.totalPages || 0;

  const { data: stats = null } = useQuery({
    queryKey: ["userStats"],
    queryFn: async () => {
      const res = await getUserSummaryStats();
      return res;
    },
    enabled: userRole === "manager" || userRole === "admin",
  });

  if (userRole !== "admin" && userRole !== "manager") return <Navigate to="/home" replace />;

  const reload = () => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
    queryClient.invalidateQueries({ queryKey: ["userStats"] });
  };

  const handleSearch = () => {
    dispatch(setUserSearch(inputValue));
    dispatch(setUserPage(0));
  };

  const handleReset = () => {
    setInputValue("");
    dispatch(resetUserFilters());
  };

  const handleFilterChange = (value) => {
    dispatch(setUserFilter(value));
    dispatch(setUserPage(0));
  };

  const handleShowCountChange = (value) => {
    setShowCount(Number(value));
    dispatch(setUserPage(0));
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      await exportUsers();
      toast.success("Export downloaded successfully");
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setExportLoading(false);
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
        subtitle="Manage system operators, employee profiles and role privileges"
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
              <MenuItem value="" sx={{ fontSize: 11 }}>All</MenuItem>
              {["ADMIN", "MANAGER", "USER"].map((r) => (
                <MenuItem key={r} value={r} sx={{ fontSize: 11 }}>{r}</MenuItem>
              ))}
            </Select>

            {/* Bulk Upload — admin only */}
            {isAdmin && (
              <Button
                variant="outlined"
                startIcon={<FaUpload size={11} />}
                onClick={() => navigate("/home/users/bulk-upload")}
                sx={outlinedBtnSx}
              >
                Bulk Upload
              </Button>
            )}
            {/* Export — admin + manager */}
            {canExport && (
              <Tooltip title="Exports all user accounts to Excel">
                <span>
                  <Button
                    variant="outlined"
                    startIcon={exportLoading ? <CircularProgress size={11} /> : <FaFileExport size={11} />}
                    onClick={handleExport}
                    disabled={exportLoading}
                    sx={outlinedBtnSx}
                  >
                    Export
                  </Button>
                </span>
              </Tooltip>
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
        <StatCard label="Total Users" value={stats?.total ?? 0} icon={<FaUsers />} iconColor="#3949ab" onClick={() => handleFilterChange("")} />
        <StatCard label="Administrators" value={stats?.adminCount ?? 0} icon={<FaUserShield />} iconColor="#2563eb" onClick={() => handleFilterChange("ADMIN")} />
        <StatCard label="Managers" value={stats?.managerCount ?? 0} icon={<FaUserTie />} iconColor="#10b981" onClick={() => handleFilterChange("MANAGER")} />
        <StatCard label="Regular Users" value={stats?.userCount ?? 0} icon={<FaUser />} iconColor="#d97706" onClick={() => handleFilterChange("USER")} />
      </Box>

      <SearchBar
        value={inputValue}
        placeholder="Search by name, email..."
        onChange={(e) => setInputValue(e.target.value)}
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