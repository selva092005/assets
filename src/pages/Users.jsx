import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, Button, Select, MenuItem, CircularProgress } from "@mui/material";
import { FaFilter, FaFileExport, FaPlus } from "react-icons/fa";
import {
  fetchUsers,
  setUserPage, setUserSearch, setUserFilter, resetUserFilters,
} from "../store/slices/userSlice";
import { addUser, updateUser, deleteUser, getUserById } from "../services/users_service";
import { COLORS } from "../theme/tokens";

import PageHeader      from "../components/common/PageHeader";
import SearchBar       from "../components/common/SearchBar";
import TableCard       from "../components/common/TableCard";
import TablePagination from "../components/common/TablePagination";
import UserTable       from "../components/users/UserTable";
import UserForm        from "../components/users/UserForm";
import UserView        from "../components/users/UserView";

const EMPTY = { userId: null, userName: "", userEmail: "", userPassword: "", userRole: "USER" };

export default function UsersPage() {
  const dispatch = useDispatch();
  const { items: users, totalPages, page, search, filterRole, loading } =
    useSelector((s) => s.users);

  const [showCount, setShowCount] = useState(10);
  const [form,      setForm]      = useState(EMPTY);
  const [showModal, setShowModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [viewData,  setViewData]  = useState(null);

  // Re-fetch whenever page, showCount, or filterRole changes
  useEffect(() => {
    dispatch(fetchUsers({ keyword: search, page, size: showCount, role: filterRole || undefined }));
  }, [page, showCount, filterRole]);

  const reload = () =>
    dispatch(fetchUsers({ keyword: search, page, size: showCount, role: filterRole || undefined }));

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

  const handleSave = async () => {
    try {
      const payload = {
        userName:     form.userName,
        userEmail:    form.userEmail,
        userPassword: form.userPassword,
        userRole:     form.userRole,
      };
      if (form.userId) await updateUser(form.userId, payload);
      else             await addUser(payload);
      reload();
      setShowModal(false);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to save user");
    }
  };

  const handleEdit = (item) => {
    setForm({
      userId:       item.userId || item.id,
      userName:     item.userName  || "",
      userEmail:    item.userEmail || "",
      userPassword: "",
      userRole:     item.userRole  || "USER",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try { await deleteUser(id); reload(); }
    catch (e) { console.error(e); }
  };

  const handleView = async (item) => {
    try {
      const res = await getUserById(item.userId || item.id);
      setViewData(res.data || res);
      setViewModal(true);
    } catch (e) { console.error(e); }
  };

  return (
    <Box sx={{ mt: "60px", p: "2rem 2.5rem", background: COLORS.bg, minHeight: "100vh", fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      <PageHeader
        title="Users"
        actions={
          <>
            {/* Show count — triggers backend re-fetch */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              Showing
              <Select
                value={showCount}
                onChange={(e) => handleShowCountChange(e.target.value)}
                size="small"
                sx={{ fontSize: 13, borderRadius: "6px", height: 30, "& .MuiOutlinedInput-notchedOutline": { borderColor: COLORS.border } }}
              >
                {[5, 10, 20, 50].map((n) => (
                  <MenuItem key={n} value={n} sx={{ fontSize: 13 }}>{n}</MenuItem>
                ))}
              </Select>
            </Box>

            {/* Filter by role — delegates filtering to backend */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, border: `1px solid ${COLORS.border}`, borderRadius: "8px", px: 1.5, py: "5px", background: COLORS.surface }}>
              <FaFilter size={12} />
              <Select
                value={filterRole}
                onChange={(e) => handleFilterChange(e.target.value)}
                displayEmpty
                size="small"
                sx={{ fontSize: 13, border: "none", "& .MuiOutlinedInput-notchedOutline": { border: "none" }, height: 24, "& .MuiSelect-select": { p: 0, fontSize: 13, color: COLORS.textMuted } }}
              >
                <MenuItem value="" sx={{ fontSize: 13 }}>All Roles</MenuItem>
                {["ADMIN", "USER"].map((r) => (
                  <MenuItem key={r} value={r} sx={{ fontSize: 13 }}>{r}</MenuItem>
                ))}
              </Select>
            </Box>

            <Button
              variant="outlined"
              startIcon={<FaFileExport size={12} />}
              sx={{ textTransform: "none", fontSize: 13, borderColor: COLORS.border, color: COLORS.textMuted, borderRadius: "8px", py: "7px", px: 1.75 }}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<FaPlus size={11} />}
              onClick={() => { setForm(EMPTY); setShowModal(true); }}
              sx={{ textTransform: "none", fontSize: 13, fontWeight: 600, borderRadius: "8px", py: "8px", px: 2, background: COLORS.primary, boxShadow: "none", "&:hover": { background: COLORS.primaryDark, boxShadow: "none" } }}
            >
              Add New User
            </Button>
          </>
        }
      />

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
          : <UserTable users={users} loading={false} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />
        }
        <TablePagination page={page} totalPages={totalPages} onPageChange={(pg) => dispatch(setUserPage(pg))} />
      </TableCard>

      <UserForm
        open={showModal}
        form={form}
        onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })}
        onSave={handleSave}
        onClose={() => setShowModal(false)}
      />
      <UserView open={viewModal} data={viewData} onClose={() => setViewModal(false)} />
    </Box>
  );
}