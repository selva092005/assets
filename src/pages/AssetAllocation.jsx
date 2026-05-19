import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, MenuItem, Select,
  Table, TableBody, TableCell, TableHead, TableRow, TextField,
  Tooltip, Typography, InputLabel, FormControl,
} from "@mui/material";
import { FaPlus, FaUndo, FaTimes, FaBoxOpen } from "react-icons/fa";
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
    setForm({ assetId: "", assignedTo: "", assignedBy: userName || "", assignedDate: today(), expectedReturnDate: "", remarks: "" });
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
      dispatch(fetchAssets({ page: 0, size: 10 })); // refresh asset table status
    } catch (e) {
      toast.error(e.response?.data?.message || "Return failed");
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
      <Dialog open={allocateOpen} onClose={() => setAllocateOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "12px" } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
          <Typography fontWeight={700} fontSize={16}>Allocate Asset</Typography>
          <IconButton size="small" onClick={() => setAllocateOpen(false)}><FaTimes size={14} /></IconButton>
        </DialogTitle>

        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}>

          {/* Asset select */}
          <FormControl fullWidth size="small">
            <InputLabel sx={{ fontSize: 13 }}>Asset *</InputLabel>
            <Select
              value={form.assetId}
              label="Asset *"
              onChange={(e) => f("assetId", e.target.value)}
              sx={{ fontSize: 13, borderRadius: "8px" }}
            >
              {availableAssets.length === 0 && (
                <MenuItem disabled sx={{ fontSize: 13 }}>No available assets</MenuItem>
              )}
              {availableAssets.map((a) => (
                <MenuItem key={a.assetId} value={a.assetId} sx={{ fontSize: 13 }}>
                  {a.assetName} {a.assetCode ? `(${a.assetCode})` : ""}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField label="Assigned To (Users) *" size="small" fullWidth
            value={form.assignedTo} onChange={(e) => f("assignedTo", e.target.value)}
            inputProps={{ maxLength: 100 }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
          />

          <TextField label="Assigned By *" size="small" fullWidth
            value={form.assignedBy} onChange={(e) => f("assignedBy", e.target.value)}
            inputProps={{ maxLength: 100 }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
          />

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField label="Assigned Date *" type="date" size="small" fullWidth
              value={form.assignedDate} onChange={(e) => f("assignedDate", e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
            />
            <TextField label="Expected Return Date" type="date" size="small" fullWidth
              value={form.expectedReturnDate} onChange={(e) => f("expectedReturnDate", e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
            />
          </Box>

          <TextField label="Remarks" size="small" fullWidth multiline rows={2}
            value={form.remarks} onChange={(e) => f("remarks", e.target.value)}
            inputProps={{ maxLength: 250 }}
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