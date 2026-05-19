import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, MenuItem, Select,
  Table, TableBody, TableCell, TableHead, TableRow, TextField,
  Typography, InputLabel, FormControl, InputAdornment,
} from "@mui/material";
import { FaTrash, FaTimes, FaRecycle } from "react-icons/fa";
import toast from "react-hot-toast";

import { disposeAsset, getAllDisposals } from "../services/disposal_service";
import { getAssets } from "../services/assets_service";
import PageHeader from "../components/common/PageHeader";
import TableCard from "../components/common/TableCard";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { COLORS } from "../theme/tokens";

const DISPOSAL_METHODS = ["SOLD", "SCRAPPED", "DONATED", "DAMAGED"];

const METHOD_STYLES = {
  SOLD:     { bg: "#e8f5e9", color: "#2e7d32" },
  SCRAPPED: { bg: "#fff3e0", color: "#e65100" },
  DONATED:  { bg: "#e3f2fd", color: "#1565c0" },
  DAMAGED:  { bg: "#ffebee", color: "#c62828" },
};

const MethodBadge = ({ method }) => {
  const s = METHOD_STYLES[method] || { bg: "#f3f4f6", color: "#6b7280" };
  return (
    <Chip
      label={method}
      size="small"
      sx={{ background: s.bg, color: s.color, fontWeight: 700, fontSize: 11, borderRadius: "20px", height: 22 }}
    />
  );
};

const EmptyState = () => (
  <Box sx={{ textAlign: "center", py: 8, color: COLORS.textFaint }}>
    <FaRecycle size={40} style={{ marginBottom: 12, opacity: 0.35 }} />
    <Typography fontSize={14}>No disposal records found.</Typography>
  </Box>
);

export default function AssetDisposalPage() {
  const { userRole, userName } = useSelector((s) => s.auth);
  const canDispose = userRole === "admin"; // admin only
  const canView    = userRole === "admin"; // admin only

  const [disposals, setDisposals]           = useState([]);
  const [loading, setLoading]               = useState(true);
  const [disposableAssets, setDisposableAssets] = useState([]);

  // Dispose modal
  const [disposeOpen, setDisposeOpen] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [form, setForm]               = useState(defaultForm(userName));

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ── Load disposals ────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const res = await getAllDisposals();
      setDisposals(extractList(res));
    } catch {
      toast.error("Failed to load disposal records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Open dispose modal ────────────────────────────────────────────────────
  const openDispose = async () => {
    try {
      const res = await getAssets({ page: 0, size: 200 });
      const all = extractList(res);
      // Only AVAILABLE assets can be disposed
      setDisposableAssets(all.filter((a) => a.status === "AVAILABLE"));
    } catch {
      toast.error("Failed to load assets");
    }
    setForm(defaultForm(userName));
    setDisposeOpen(true);
  };

  // ── Submit disposal ───────────────────────────────────────────────────────
  const handleDispose = async () => {
    if (!form.assetId)        { toast.error("Select an asset"); return; }
    if (!form.disposalMethod) { toast.error("Select disposal method"); return; }
    if (!form.reason)         { toast.error("Enter disposal reason"); return; }
    if (!form.disposedBy)     { toast.error("Enter disposed-by name"); return; }
    if (!form.disposalDate)   { toast.error("Select disposal date"); return; }
    setConfirmOpen(true);
  };

  const confirmDispose = async () => {
    setSaving(true);
    setConfirmOpen(false);
    try {
      await disposeAsset({
        assetId: Number(form.assetId),
        disposalDate: form.disposalDate,
        disposalMethod: form.disposalMethod,
        reason: form.reason,
        disposedBy: form.disposedBy,
        disposalValue: form.disposalValue ? Number(form.disposalValue) : null,
      });
      toast.success("Asset disposed successfully");
      setDisposeOpen(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Disposal failed");
    } finally {
      setSaving(false);
    }
  };

  const f = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  // Block non-authorised users
  if (!canView) {
    return (
      <Box sx={{ mt: "78px", p: "2rem 2.5rem", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Typography fontSize={15} color={COLORS.textMuted}>You do not have permission to view this page.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: "78px", p: "2rem 2.5rem", background: COLORS.bg, minHeight: "100vh", fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      <PageHeader
        title="Asset Disposal"
        actions={
          canDispose && (
            <Button
              variant="contained"
              startIcon={<FaTrash size={11} />}
              onClick={openDispose}
              sx={{ textTransform: "none", fontSize: 13, fontWeight: 600, borderRadius: "8px", py: "8px", px: 2, background: "#c62828", boxShadow: "none", "&:hover": { background: "#b71c1c", boxShadow: "none" } }}
            >
              Dispose Asset
            </Button>
          )
        }
      />

      <TableCard>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
        ) : disposals.length === 0 ? (
          <EmptyState />
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow sx={{ background: "#f8fafc" }}>
                  {["#", "Asset", "Code", "Method", "Disposal Date", "Disposed By", "Reason", "Value (₹)"].map((h) => (
                    <TableCell key={h} sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, py: 1.5, whiteSpace: "nowrap" }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {disposals.map((row, i) => (
                  <TableRow key={row.disposalId} hover sx={{ "&:last-child td": { border: 0 } }}>
                    <TableCell sx={{ fontSize: 12, color: COLORS.textFaint }}>{i + 1}</TableCell>
                    <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>{row.assetName}</TableCell>
                    <TableCell>
                      <Chip label={row.assetCode || "—"} size="small" sx={{ fontSize: 11, height: 20, background: "#ffebee", color: "#c62828" }} />
                    </TableCell>
                    <TableCell><MethodBadge method={row.disposalMethod} /></TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{fmt(row.disposalDate)}</TableCell>
                    <TableCell sx={{ fontSize: 12, color: COLORS.textMuted }}>{row.disposedBy}</TableCell>
                    <TableCell sx={{ fontSize: 12, color: COLORS.textMuted, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {row.reason}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>
                      {row.disposalValue != null ? `₹${row.disposalValue.toLocaleString("en-IN")}` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </TableCard>

      {/* ── Dispose Modal ──────────────────────────────────────────────── */}
      <Dialog open={disposeOpen} onClose={() => setDisposeOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "12px" } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
          <Typography fontWeight={700} fontSize={16}>Dispose Asset</Typography>
          <IconButton size="small" onClick={() => setDisposeOpen(false)}><FaTimes size={14} /></IconButton>
        </DialogTitle>

        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}>

          {/* Warning banner */}
          <Box sx={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: "8px", p: 1.5 }}>
            <Typography fontSize={12} color="#e65100" fontWeight={500}>
              ⚠ Disposed assets cannot be allocated. This action marks the asset as permanently retired.
            </Typography>
          </Box>

          {/* Asset select */}
          <FormControl fullWidth size="small">
            <InputLabel sx={{ fontSize: 13 }}>Asset *</InputLabel>
            <Select
              value={form.assetId}
              label="Asset *"
              onChange={(e) => f("assetId", e.target.value)}
              sx={{ fontSize: 13, borderRadius: "8px" }}
            >
              {disposableAssets.length === 0 && (
                <MenuItem disabled sx={{ fontSize: 13 }}>No available assets to dispose</MenuItem>
              )}
              {disposableAssets.map((a) => (
                <MenuItem key={a.assetId} value={a.assetId} sx={{ fontSize: 13 }}>
                  {a.assetName} {a.assetCode ? `(${a.assetCode})` : ""}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Method select */}
          <FormControl fullWidth size="small">
            <InputLabel sx={{ fontSize: 13 }}>Disposal Method *</InputLabel>
            <Select
              value={form.disposalMethod}
              label="Disposal Method *"
              onChange={(e) => f("disposalMethod", e.target.value)}
              sx={{ fontSize: 13, borderRadius: "8px" }}
            >
              {DISPOSAL_METHODS.map((m) => (
                <MenuItem key={m} value={m} sx={{ fontSize: 13 }}>{m}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField label="Reason *" size="small" fullWidth multiline rows={2}
            value={form.reason} onChange={(e) => f("reason", e.target.value)}
            inputProps={{ maxLength: 250 }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
          />

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField label="Disposed By *" size="small" fullWidth
              value={form.disposedBy} onChange={(e) => f("disposedBy", e.target.value)}
              inputProps={{ maxLength: 100 }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
            />
            <TextField label="Disposal Date *" type="date" size="small" fullWidth
              value={form.disposalDate} onChange={(e) => f("disposalDate", e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
            />
          </Box>

          <TextField label="Disposal Value (optional)" type="number" size="small" fullWidth
            value={form.disposalValue} onChange={(e) => f("disposalValue", e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Typography fontSize={13}>₹</Typography></InputAdornment> }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDisposeOpen(false)} sx={{ textTransform: "none", fontSize: 13 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleDispose}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={12} color="inherit" /> : <FaTrash size={11} />}
            sx={{ textTransform: "none", fontSize: 13, fontWeight: 600, borderRadius: "8px", background: "#c62828", boxShadow: "none", "&:hover": { background: "#b71c1c" } }}
          >
            {saving ? "Disposing..." : "Dispose Asset"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Final Confirm ──────────────────────────────────────────────── */}
      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Asset Disposal"
        message="Are you sure? This will permanently mark the asset as DISPOSED. This cannot be undone."
        onConfirm={confirmDispose}
        onCancel={() => setConfirmOpen(false)}
        confirmLabel="Yes, Dispose"
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

function defaultForm(userName) {
  return {
    assetId: "",
    disposalMethod: "",
    reason: "",
    disposedBy: userName || "",
    disposalDate: today(),
    disposalValue: "",
  };
}