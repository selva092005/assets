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
  const [bulkDialog, setBulkDialog] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [stats, setStats] = useState(null);
  const fileInputRef = useRef(null);
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
    } catch { toast.error("Export failed"); }
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadUserTemplate();
      toast.success("Template downloaded");
    } catch { toast.error("Template download failed"); }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls)$/i)) { toast.error("Please select an Excel file (.xlsx or .xls)"); return; }
    setBulkFile(file);
    setBulkResult(null);
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) { toast.error("Please select a file first"); return; }
    try {
      setBulkLoading(true);
      const result = await bulkUploadUsers(bulkFile);
      setBulkResult(result?.data ?? result);
      const count = result?.data?.successCount ?? result?.successCount ?? 0;
      if (count > 0) { toast.success(`${count} user(s) uploaded successfully`); reload(); }
    } catch (e) {
      toast.error(e.response?.data?.message || "Bulk upload failed");
    } finally { setBulkLoading(false); }
  };

  const closeBulkDialog = () => {
    setBulkDialog(false);
    setBulkFile(null);
    setBulkResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
    <Box sx={{ p: 0, fontFamily: "'Inter','Segoe UI',sans-serif" }}>

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
                onClick={() => setBulkDialog(true)}
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

      {/* ── Bulk Upload Dialog ── */}
      <Dialog open={bulkDialog} onClose={closeBulkDialog} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: "12px" } } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FaFileExcel color="#217346" />
            <Typography fontWeight={600} fontSize={16}>Bulk Upload Users</Typography>
          </Box>
          <IconButton size="small" onClick={closeBulkDialog}><FaTimes size={14} /></IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ mb: 2, p: 1.5, background: "#f0f7ff", borderRadius: "8px", border: "1px solid #bbdefb" }}>
            <Typography fontSize={13} color="#1565c0" fontWeight={500} mb={0.5}>Step 1 — Download the template</Typography>
            <Typography fontSize={12} color="#555" mb={1}>Fill in the Excel template with your user data and save it.</Typography>
            <Button size="small" startIcon={<FaDownload size={11} />} onClick={handleDownloadTemplate}
              sx={{ textTransform: "none", fontSize: 12, color: "#1565c0", borderColor: "#1565c0", borderRadius: "6px" }} variant="outlined">
              Download Template
            </Button>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography fontSize={13} fontWeight={500} mb={1}>Step 2 — Upload your filled Excel file</Typography>
            <Box onClick={() => fileInputRef.current?.click()}
              sx={{
                border: `2px dashed ${bulkFile ? "#4caf50" : COLORS.border}`, borderRadius: "8px", p: 2.5, textAlign: "center", cursor: "pointer",
                background: bulkFile ? "#f1f8e9" : "#fafafa", transition: "all 0.2s", "&:hover": { borderColor: COLORS.primary, background: "#f0f7ff" }
              }}>
              <FaFileExcel size={28} color={bulkFile ? "#4caf50" : "#9e9e9e"} />
              <Typography fontSize={13} mt={1} color={bulkFile ? "#2e7d32" : "#757575"}>
                {bulkFile ? bulkFile.name : "Click to select .xlsx / .xls file"}
              </Typography>
              {bulkFile && <Typography fontSize={11} color="#888" mt={0.5}>{(bulkFile.size / 1024).toFixed(1)} KB</Typography>}
            </Box>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={handleFileSelect} />
          </Box>

          {bulkLoading && (
            <Box sx={{ mb: 2 }}>
              <Typography fontSize={12} color="#555" mb={0.5}>Uploading and processing...</Typography>
              <LinearProgress />
            </Box>
          )}

          {bulkResult && (
            <Box sx={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px", p: 1.5 }}>
              <Typography fontSize={13} fontWeight={600} mb={1.5}>Upload Results</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, mb: 1.5 }}>
                <Box sx={{ p: 1, borderRadius: "8px", background: "#f8fafc", border: "1px solid #e2e8f0", textAlign: "center" }}>
                  <Typography fontSize={18} fontWeight={800} color={COLORS.text}>{bulkResult.totalRows ?? 0}</Typography>
                  <Typography fontSize={11} color={COLORS.textMuted}>Total Rows</Typography>
                </Box>
                <Box sx={{ p: 1, borderRadius: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", textAlign: "center" }}>
                  <Typography fontSize={18} fontWeight={800} color="#16a34a">{bulkResult.successCount ?? 0}</Typography>
                  <Typography fontSize={11} color="#16a34a">Successful</Typography>
                </Box>
                <Box sx={{ p: 1, borderRadius: "8px", background: "#fffbeb", border: "1px solid #fde68a", textAlign: "center" }}>
                  <Typography fontSize={18} fontWeight={800} color="#d97706">{bulkResult.skippedCount ?? 0}</Typography>
                  <Typography fontSize={11} color="#d97706">Skipped</Typography>
                </Box>
                <Box sx={{ p: 1, borderRadius: "8px", background: "#fef2f2", border: "1px solid #fecaca", textAlign: "center" }}>
                  <Typography fontSize={18} fontWeight={800} color="#dc2626">{bulkResult.failedCount ?? 0}</Typography>
                  <Typography fontSize={11} color="#dc2626">Failed</Typography>
                </Box>
              </Box>
              {bulkResult.skipped?.length > 0 && (
                <Box sx={{ mb: 1.5 }}>
                  <Typography fontSize={12} fontWeight={600} color="#d97706" mb={0.75}>⚠ Skipped Rows ({bulkResult.skipped.length})</Typography>
                  <Box sx={{ maxHeight: 160, overflowY: "auto", border: "1px solid #fde68a", borderRadius: "6px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                      <thead>
                        <tr style={{ background: "#fef9c3", position: "sticky", top: 0 }}>
                          <th style={{ padding: "5px 8px", textAlign: "left", color: "#92400e", fontWeight: 600, borderBottom: "1px solid #fde68a", width: 50 }}>Row</th>
                          <th style={{ padding: "5px 8px", textAlign: "left", color: "#92400e", fontWeight: 600, borderBottom: "1px solid #fde68a" }}>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkResult.skipped.map((item, i) => (
                          <tr key={i} style={{ background: i % 2 === 0 ? "#fffbeb" : "#fefce8" }}>
                            <td style={{ padding: "4px 8px", color: "#92400e", borderBottom: "1px solid #fef3c7" }}>
                              {typeof item === "object" ? item.row : "—"}
                            </td>
                            <td style={{ padding: "4px 8px", color: "#78350f", borderBottom: "1px solid #fef3c7" }}>
                              {typeof item === "object" ? item.message : item}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                </Box>
              )}
              {bulkResult.errors?.length > 0 && (
                <Box>
                  <Typography fontSize={12} fontWeight={600} color="#dc2626" mb={0.75}>✕ Validation Errors ({bulkResult.errors.length})</Typography>
                  <Box sx={{ maxHeight: 200, overflowY: "auto", border: "1px solid #fecaca", borderRadius: "6px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                      <thead>
                        <tr style={{ background: "#fee2e2", position: "sticky", top: 0 }}>
                          <th style={{ padding: "5px 8px", textAlign: "left", color: "#991b1b", fontWeight: 600, borderBottom: "1px solid #fecaca", width: 50 }}>Row</th>
                          <th style={{ padding: "5px 8px", textAlign: "left", color: "#991b1b", fontWeight: 600, borderBottom: "1px solid #fecaca", width: 90 }}>Field</th>
                          <th style={{ padding: "5px 8px", textAlign: "left", color: "#991b1b", fontWeight: 600, borderBottom: "1px solid #fecaca" }}>Message</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkResult.errors.map((err, i) => (
                          <tr key={i} style={{ background: i % 2 === 0 ? "#fef2f2" : "#fff5f5" }}>
                            <td style={{ padding: "4px 8px", color: "#991b1b", borderBottom: "1px solid #fee2e2" }}>
                              {typeof err === "object" ? err.row : "—"}
                            </td>
                            <td style={{ padding: "4px 8px", color: "#b91c1c", fontWeight: 500, borderBottom: "1px solid #fee2e2" }}>
                              {typeof err === "object" ? (err.field ?? "—") : "—"}
                            </td>
                            <td style={{ padding: "4px 8px", color: "#7f1d1d", borderBottom: "1px solid #fee2e2" }}>
                              {typeof err === "object" ? err.message : err}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={closeBulkDialog} sx={outlinedBtnSx}>Close</Button>
          <Button variant="contained"
            startIcon={bulkLoading ? <CircularProgress size={12} color="inherit" /> : <FaUpload size={11} />}
            onClick={handleBulkUpload} disabled={!bulkFile || bulkLoading}
            sx={{ ...primaryBtnSx, background: "#2e7d32", borderColor: "#1b5e20", "&:hover": { background: "#1b5e20" } }}>
            {bulkLoading ? "Uploading..." : "Upload"}
          </Button>
        </DialogActions>
      </Dialog>

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