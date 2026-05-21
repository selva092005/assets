import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, InputAdornment,
  Popover, List, ListItemButton, ListItemText,
  Table, TableBody, TableCell, TableHead, TableRow, TextField,
  Tooltip, Typography, InputLabel, FormControl, OutlinedInput,
} from "@mui/material";
import { FaPlus, FaUndo, FaTimes, FaBoxOpen, FaSearch } from "react-icons/fa";
import { getUsers } from "../services/users_service";
import toast from "react-hot-toast";

import { allocateAsset, getAllAllocations, returnAsset } from "../services/allocation_service";
import { getAssets } from "../services/assets_service";
import { fetchAssets } from "../store/slices/assetSlice";
import PageHeader from "../components/common/PageHeader";
import TableCard from "../components/common/TableCard";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { COLORS } from "../theme/tokens";

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const isActive = status === "ACTIVE";
  return (
    <Chip
      label={isActive ? "Active" : "Returned"}
      size="small"
      sx={{
        background: isActive ? "#e8f5e9" : "#f3f4f6",
        color: isActive ? "#2e7d32" : "#6b7280",
        fontWeight: 700, fontSize: 11, borderRadius: "20px", height: 22,
      }}
    />
  );
};

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = () => (
  <Box sx={{ textAlign: "center", py: 8, color: COLORS.textFaint }}>
    <FaBoxOpen size={40} style={{ marginBottom: 12, opacity: 0.35 }} />
    <Typography fontSize={14}>No allocation records found.</Typography>
  </Box>
);

export default function AssetAllocationPage() {
  const { userRole, userName } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const canWrite = userRole === "admin" || userRole === "manager";

  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableAssets, setAvailableAssets] = useState([]);

  // Allocate modal
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    assetId: "",
    assignedTo: "",
    assignedBy: userName || "",
    assignedDate: today(),
    expectedReturnDate: "",
    remarks: "",
  });

  const [adminUsers, setAdminUsers]       = useState([]);
  const [allUsers,   setAllUsers]         = useState([]);
  const [userSearch, setUserSearch]       = useState("");
  const [anchorEl,   setAnchorEl]         = useState(null);
  const [assignedToSearch, setAssignedToSearch] = useState("");
  const [assignedToAnchor, setAssignedToAnchor] = useState(null);
  const [assetSearch, setAssetSearch]     = useState("");
  const [assetAnchor, setAssetAnchor]     = useState(null);

  // Return confirm
  const [returnConfirm, setReturnConfirm] = useState(false);
  const [returnId, setReturnId] = useState(null);

  // ── Load data ─────────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const res = await getAllAllocations();
      setAllocations(extractList(res));
    } catch {
      toast.error("Failed to load allocations");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableAssets = async () => {
    try {
      const res = await getAssets({ page: 0, size: 200 });
      const all = extractList(res);
      // Only show assets that are AVAILABLE
      setAvailableAssets(all.filter((a) => a.status === "AVAILABLE"));
    } catch {
      toast.error("Failed to load assets");
    }
  };

  useEffect(() => { load(); }, []);

  // ── Open allocate modal ───────────────────────────────────────────────────
  const openAllocate = async () => {
    await loadAvailableAssets();
    setForm({ assetId: "", assignedTo: "", assignedBy: "", assignedDate: today(), expectedReturnDate: "", remarks: "" });
    setUserSearch("");
    setAssignedToSearch("");
    setAssetSearch("");
    try {
      const res = await getUsers({ page: 0, size: 200 });
      const all = extractList(res);
      setAllUsers(all);
      const admins = all.filter((u) => u.userRole === "ADMIN" || u.userRole === "MANAGER");
      setAdminUsers(admins.length > 0 ? admins : all);
    } catch {
      setAdminUsers([]);
      setAllUsers([]);
    }
    setAllocateOpen(true);
  };

  // ── Submit allocation ─────────────────────────────────────────────────────
  const handleAllocate = async () => {
    if (!form.assetId)     { toast.error("Select an asset"); return; }
    if (!form.assignedTo)  { toast.error("Enter employee name"); return; }
    if (!form.assignedBy)  { toast.error("Enter assigned-by name"); return; }
    if (!form.assignedDate){ toast.error("Select assigned date"); return; }
    if (form.expectedReturnDate && form.expectedReturnDate < form.assignedDate) {
      toast.error("Expected return date must be on or after the assigned date");
      return;
    }
    setSaving(true);
    try {
      await allocateAsset({
        assetId: Number(form.assetId),
        assignedTo: form.assignedTo,
        assignedBy: form.assignedBy,
        assignedDate: form.assignedDate,
        expectedReturnDate: form.expectedReturnDate || null,
        remarks: form.remarks || null,
      });
      toast.success("Asset allocated successfully");
      setAllocateOpen(false);
      load();
      dispatch(fetchAssets({ page: 0, size: 10 })); // refresh asset table status
    } catch (e) {
      toast.error(e.response?.data?.message || "Allocation failed");
    } finally {
      setSaving(false);
    }
  };

  // ── Return asset ──────────────────────────────────────────────────────────
  const handleReturnConfirm = async () => {
    try {
      await returnAsset(returnId);
      toast.success("Asset returned successfully");
      load();
      dispatch(fetchAssets({ page: 0, size: 10 }));
    } catch (e) {
      console.error("Return asset error:", e);
      toast.error(
        e.response?.data?.message ||
        e.response?.data?.error ||
        "Return failed. Please try again."
      );
    } finally {
      setReturnConfirm(false);
      setReturnId(null);
    }
  };

  const f = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <Box sx={{ mt: "78px", p: "2rem 2.5rem", background: COLORS.bg, minHeight: "100vh", fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      <PageHeader
        title="Asset Allocation"
        actions={
          canWrite && (
            <Button
              variant="contained"
              startIcon={<FaPlus size={11} />}
              onClick={openAllocate}
              sx={{ textTransform: "none", fontSize: 13, fontWeight: 600, borderRadius: "8px", py: "8px", px: 2, background: COLORS.primary, boxShadow: "none", "&:hover": { background: COLORS.primaryDark, boxShadow: "none" } }}
            >
              Allocate Asset
            </Button>
          )
        }
      />

      <TableCard>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
        ) : allocations.length === 0 ? (
          <EmptyState />
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ background: "#f8fafc" }}>
                  {["#", "Asset", "Code", "Assigned To", "Assigned By", "Date", "Expected Return", "Return Date", "Status", "Remarks", ...(canWrite ? ["Action"] : [])].map((h) => (
                    <TableCell key={h} sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, py: 1.5, whiteSpace: "nowrap" }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {allocations.map((row, i) => (
                  <TableRow key={row.allocationId} hover sx={{ "&:last-child td": { border: 0 } }}>
                    <TableCell sx={{ fontSize: 12, color: COLORS.textFaint }}>{i + 1}</TableCell>
                    <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>{row.assetName}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}><Chip label={row.assetCode || "—"} size="small" sx={{ fontSize: 11, height: 20, background: "#eff6ff", color: "#1d4ed8" }} /></TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{row.assignedTo}</TableCell>
                    <TableCell sx={{ fontSize: 12, color: COLORS.textMuted }}>{row.assignedBy}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{fmt(row.assignedDate)}</TableCell>
                    <TableCell sx={{ fontSize: 12, color: COLORS.textMuted }}>{row.expectedReturnDate ? fmt(row.expectedReturnDate) : "—"}</TableCell>
                    <TableCell sx={{ fontSize: 12, color: COLORS.textMuted }}>{row.returnDate ? fmt(row.returnDate) : "—"}</TableCell>
                    <TableCell><StatusBadge status={row.status} /></TableCell>
                    <TableCell sx={{ fontSize: 12, color: COLORS.textMuted, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <Tooltip title={row.remarks || ""}><span>{row.remarks || "—"}</span></Tooltip>
                    </TableCell>
                    {canWrite && (
                      <TableCell>
                        {row.status === "ACTIVE" && (
                          <Tooltip title="Mark as Returned">
                            <IconButton
                              size="small"
                              onClick={() => { setReturnId(row.allocationId); setReturnConfirm(true); }}
                              sx={{ color: "#2e7d32", border: "1px solid #a5d6a7", borderRadius: "6px", p: "4px 8px", fontSize: 11, gap: 0.5, "&:hover": { background: "#e8f5e9" } }}
                            >
                              <FaUndo size={11} />
                              <Typography fontSize={11} fontWeight={600}>Return</Typography>
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </TableCard>

      {/* ── Allocate Modal ─────────────────────────────────────────────── */}
      <Dialog open={allocateOpen} onClose={() => setAllocateOpen(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: "12px" } } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
          <Typography fontWeight={700} fontSize={16}>Allocate Asset</Typography>
          <IconButton size="small" onClick={() => setAllocateOpen(false)}><FaTimes size={14} /></IconButton>
        </DialogTitle>

        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}>

          {/* Asset searchable dropdown */}
          <FormControl fullWidth size="small">
            <InputLabel shrink sx={{ fontSize: 13 }}>Asset *</InputLabel>
            <OutlinedInput
              readOnly
              notched
              label="Asset *"
              size="small"
              value={availableAssets.find((a) => a.assetId === form.assetId)
                ? `${availableAssets.find((a) => a.assetId === form.assetId).assetName}${availableAssets.find((a) => a.assetId === form.assetId).assetCode ? ` (${availableAssets.find((a) => a.assetId === form.assetId).assetCode})` : ""}`
                : ""}
              placeholder="Select asset..."
              onClick={(e) => setAssetAnchor(e.currentTarget)}
              endAdornment={<InputAdornment position="end"><Typography fontSize={12} color="#aaa">▾</Typography></InputAdornment>}
              sx={{ fontSize: 13, borderRadius: "8px", cursor: "pointer", caretColor: "transparent" }}
            />
            <Popover
              open={Boolean(assetAnchor)}
              anchorEl={assetAnchor}
              onClose={() => { setAssetAnchor(null); setAssetSearch(""); }}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              slotProps={{ paper: { sx: { width: assetAnchor?.offsetWidth, minWidth: 320, maxHeight: 280, display: "flex", flexDirection: "column" } } }}
            >
              <Box sx={{ p: 1, borderBottom: "1px solid #f0f0f0" }}>
                <TextField
                  autoFocus
                  size="small"
                  fullWidth
                  placeholder="Search asset..."
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><FaSearch size={11} color="#aaa" /></InputAdornment> } }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px", fontSize: 12 } }}
                />
              </Box>
              <List dense sx={{ overflowY: "auto", flex: 1 }}>
                {(() => {
                  const q = assetSearch.toLowerCase();
                  const filtered = availableAssets.filter((a) =>
                    !q || a.assetName?.toLowerCase().includes(q) || a.assetCode?.toLowerCase().includes(q)
                  );
                  return filtered.length > 0 ? filtered.map((a) => (
                    <ListItemButton
                      key={a.assetId}
                      selected={form.assetId === a.assetId}
                      onClick={() => { f("assetId", a.assetId); setAssetAnchor(null); setAssetSearch(""); }}
                      sx={{ py: 0.5 }}
                    >
                      <ListItemText
                        primary={a.assetName}
                        secondary={a.assetCode || ""}
                        primaryTypographyProps={{ fontSize: 13 }}
                        secondaryTypographyProps={{ fontSize: 11 }}
                      />
                    </ListItemButton>
                  )) : (
                    <ListItemButton disabled>
                      <ListItemText primary="No assets found" primaryTypographyProps={{ fontSize: 13 }} />
                    </ListItemButton>
                  );
                })()}
              </List>
            </Popover>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel shrink sx={{ fontSize: 13 }}>Assigned To *</InputLabel>
            <OutlinedInput
              readOnly
              notched
              label="Assigned To *"
              size="small"
              value={form.assignedTo || ""}
              placeholder="Select employee..."
              onClick={(e) => setAssignedToAnchor(e.currentTarget)}
              endAdornment={<InputAdornment position="end"><Typography fontSize={12} color="#aaa">▾</Typography></InputAdornment>}
              sx={{ fontSize: 13, borderRadius: "8px", cursor: "pointer", caretColor: "transparent" }}
            />
            <Popover
              open={Boolean(assignedToAnchor)}
              anchorEl={assignedToAnchor}
              onClose={() => { setAssignedToAnchor(null); setAssignedToSearch(""); }}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              slotProps={{ paper: { sx: { width: assignedToAnchor?.offsetWidth, minWidth: 320, maxHeight: 280, display: "flex", flexDirection: "column" } } }}
            >
              <Box sx={{ p: 1, borderBottom: "1px solid #f0f0f0" }}>
                <TextField
                  autoFocus
                  size="small"
                  fullWidth
                  placeholder="Search employee..."
                  value={assignedToSearch}
                  onChange={(e) => setAssignedToSearch(e.target.value)}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><FaSearch size={11} color="#aaa" /></InputAdornment> } }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px", fontSize: 12 } }}
                />
              </Box>
              <List dense sx={{ overflowY: "auto", flex: 1 }}>
                {(() => {
                  const q = assignedToSearch.toLowerCase();
                  const filtered = allUsers.filter((u) =>
                    !q || u.userName?.toLowerCase().includes(q) || u.userEmail?.toLowerCase().includes(q)
                  );
                  return filtered.length > 0 ? filtered.map((u) => (
                    <ListItemButton
                      key={u.userId}
                      selected={form.assignedTo === u.userName}
                      onClick={() => { f("assignedTo", u.userName); setAssignedToAnchor(null); setAssignedToSearch(""); }}
                      sx={{ py: 0.5 }}
                    >
                      <ListItemText
                        primary={u.userName}
                        secondary={u.userEmail}
                        primaryTypographyProps={{ fontSize: 13 }}
                        secondaryTypographyProps={{ fontSize: 11 }}
                      />
                    </ListItemButton>
                  )) : (
                    <ListItemButton disabled>
                      <ListItemText primary="No users found" primaryTypographyProps={{ fontSize: 13 }} />
                    </ListItemButton>
                  );
                })()}
              </List>
            </Popover>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel shrink sx={{ fontSize: 13 }}>Assigned By *</InputLabel>
            <OutlinedInput
              readOnly
              notched
              label="Assigned By *"
              size="small"
              value={form.assignedBy || ""}
              placeholder="Select user..."
              onClick={(e) => setAnchorEl(e.currentTarget)}
              endAdornment={<InputAdornment position="end"><Typography fontSize={12} color="#aaa">▾</Typography></InputAdornment>}
              sx={{ fontSize: 13, borderRadius: "8px", cursor: "pointer", caretColor: "transparent" }}
            />
            <Popover
              open={Boolean(anchorEl)}
              anchorEl={anchorEl}
              onClose={() => { setAnchorEl(null); setUserSearch(""); }}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              slotProps={{ paper: { sx: { width: anchorEl?.offsetWidth, minWidth: 320, maxHeight: 280, display: "flex", flexDirection: "column" } } }}
            >
              <Box sx={{ p: 1, borderBottom: "1px solid #f0f0f0" }}>
                <TextField
                  autoFocus
                  size="small"
                  fullWidth
                  placeholder="Search user..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><FaSearch size={11} color="#aaa" /></InputAdornment> } }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px", fontSize: 12 } }}
                />
              </Box>
              <List dense sx={{ overflowY: "auto", flex: 1 }}>
                {(() => {
                  const q = userSearch.toLowerCase();
                  const filtered = adminUsers.filter((u) =>
                    !q || u.userName?.toLowerCase().includes(q) || u.userEmail?.toLowerCase().includes(q)
                  );
                  return filtered.length > 0 ? filtered.map((u) => (
                    <ListItemButton
                      key={u.userId}
                      selected={form.assignedBy === u.userName}
                      onClick={() => { f("assignedBy", u.userName); setAnchorEl(null); setUserSearch(""); }}
                      sx={{ py: 0.5 }}
                    >
                      <ListItemText
                        primary={u.userName}
                        secondary={u.userEmail}
                        primaryTypographyProps={{ fontSize: 13 }}
                        secondaryTypographyProps={{ fontSize: 11 }}
                      />
                    </ListItemButton>
                  )) : (
                    <ListItemButton disabled>
                      <ListItemText primary="No users found" primaryTypographyProps={{ fontSize: 13 }} />
                    </ListItemButton>
                  );
                })()}
              </List>
            </Popover>
          </FormControl>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField label="Assigned Date *" type="date" size="small" fullWidth
              value={form.assignedDate} onChange={(e) => f("assignedDate", e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
            />
            <TextField label="Expected Return Date" type="date" size="small" fullWidth
              value={form.expectedReturnDate} onChange={(e) => f("expectedReturnDate", e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
            />
          </Box>

          <TextField label="Remarks" size="small" fullWidth multiline rows={2}
            value={form.remarks} onChange={(e) => f("remarks", e.target.value)}
            slotProps={{ htmlInput: { maxLength: 250 } }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setAllocateOpen(false)} sx={{ textTransform: "none", fontSize: 13 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAllocate}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={12} color="inherit" /> : <FaPlus size={11} />}
            sx={{ textTransform: "none", fontSize: 13, fontWeight: 600, borderRadius: "8px", background: COLORS.primary, boxShadow: "none", "&:hover": { background: COLORS.primaryDark } }}
          >
            {saving ? "Allocating..." : "Allocate"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Return Confirm ─────────────────────────────────────────────── */}
      <ConfirmDialog
        open={returnConfirm}
        title="Return Asset"
        message="Mark this asset as returned? The asset status will be set back to Available."
        onConfirm={handleReturnConfirm}
        onCancel={() => { setReturnConfirm(false); setReturnId(null); }}
        confirmLabel="Return"
      />
    </Box>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function today() {
  return new Date().toISOString().split("T")[0];
}

function fmt(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function extractList(res) {
  if (Array.isArray(res))           return res;
  if (Array.isArray(res?.data))     return res.data;
  if (res?.data?.content)           return res.data.content;
  if (res?.content)                 return res.content;
  return [];
}