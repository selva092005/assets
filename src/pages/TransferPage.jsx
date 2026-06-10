import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, List, ListItemButton,
  ListItemText, MenuItem, Select, Tab, Tabs, Table, TableBody,
  TableCell, TableHead, TableRow, TextField, Typography,
  FormControl, InputLabel, InputAdornment, OutlinedInput, Popover,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { FormTextField, FormSelect } from "../components/FormFields";
import { FaExchangeAlt, FaCheck, FaTimes, FaSearch, FaClock } from "react-icons/fa";
import toast from "../utils/toast.jsx";
import PageHeader from "../components/common/PageHeader";
import TableCard from "../components/common/TableCard";
import ConfirmDialog from "../components/common/ConfirmDialog";
import StatCard from "../components/common/StatCard";
import TablePagination from "../components/common/TablePagination";
import StatusBadge from "../components/common/StatusBadge";
import EmptyState from "../components/common/EmptyState";
import { COLORS, primaryBtnSx, outlinedBtnSx, inputSx, selectSx, chipSx, tabSx, premiumDialogPaperSx, premiumDialogTitleSx, premiumFormGroupSx } from "../theme/tokens";
import { required, extractFieldErrors } from "../utils/validate";
import {
  requestTransfer, approveTransfer, rejectTransfer,
  getAllTransfers, getTransferOverview, getAllLocations,
} from "../services/transfer_service";
import { getAssets } from "../services/assets_service";

function extractList(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (res?.data?.content) return res.data.content;
  if (res?.content) return res.content;
  return [];
}

function extractPage(res) {
  const d = res?.data ?? res;
  return { content: d?.content ?? [], totalPages: d?.totalPages ?? 1, totalElements: d?.totalElements ?? 0 };
}

function fmt(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function TransferPage() {
  const { userRole, userName } = useSelector((s) => s.auth);
  const isAdmin = userRole === "admin";
  const canRequest = userRole === "admin" || userRole === "manager";

  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(0);
  const [showCount, setShowCount] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");

  const queryClient = useQueryClient();

  // ── Query Fetchers ──────────────────────────────────────────────────────────
  const { data: transfersData, isLoading: loading } = useQuery({
    queryKey: ["transfers", tab, page, showCount, statusFilter],
    queryFn: async () => {
      const params = { page, size: showCount, ...(statusFilter ? { status: statusFilter } : {}) };
      if (tab === 0 && !statusFilter) params.status = "PENDING";
      const res = await getAllTransfers(params);
      return extractPage(res);
    },
    placeholderData: keepPreviousData,
  });

  const transfers = transfersData?.content || [];
  const totalPages = transfersData?.totalPages || 1;

  const { data: overview = { total: 0, pending: 0, approved: 0, rejected: 0 } } = useQuery({
    queryKey: ["transferOverview"],
    queryFn: async () => {
      const res = await getTransferOverview();
      return res?.data ?? res;
    },
  });

  // Request modal
  const [reqOpen, setReqOpen] = useState(false);
  const [reqSaving, setReqSaving] = useState(false);
  const [assetSearch, setAssetSearch] = useState("");
  const [assetAnchor, setAssetAnchor] = useState(null);
  const [fromLocation, setFromLocation] = useState("");

  const { data: assets = [] } = useQuery({
    queryKey: ["assets", "simple"],
    queryFn: async () => {
      const res = await getAssets({ page: 0, size: 200 });
      return extractList(res?.data ?? res);
    },
    enabled: reqOpen,
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["locations", "simple"],
    queryFn: async () => {
      const res = await getAllLocations();
      const raw = res?.data ?? res;
      return Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    },
    enabled: reqOpen,
  });

  const { control: reqControl, handleSubmit: reqSubmit, reset: reqReset, setValue: reqSetValue, setError: reqSetError, watch: reqWatch } = useForm({
    defaultValues: {
      assetId: "",
      toLocation: "",
      reason: "",
      expectedDate: "",
      priority: "MEDIUM",
    }
  });

  const reqAssetId = reqWatch("assetId");

  // Action modal (approve/reject)
  const [actionOpen, setActionOpen] = useState(false);
  const [actionType, setActionType] = useState(""); // "APPROVE" | "REJECT"
  const [actionTransfer, setActionTransfer] = useState(null);
  const [actionSaving, setActionSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { control: actionControl, handleSubmit: actionSubmit, reset: actionReset } = useForm({
    defaultValues: {
      remarks: "",
    }
  });

  // ── Open request modal ─────────────────────────────────────────────────────
  const openRequest = () => {
    reqReset({ assetId: "", toLocation: "", reason: "", expectedDate: "", priority: "MEDIUM" });
    setFromLocation("");
    setAssetSearch("");
    setReqOpen(true);
  };

  const handleAssetSelect = (a, onChangeField) => {
    onChangeField(a.assetId);
    reqSetValue("toLocation", "");
    setFromLocation(a.locationName || "");
    setAssetAnchor(null);
    setAssetSearch("");
  };

  const handleRequestSubmit = async (data) => {
    setReqSaving(true);
    try {
      await requestTransfer({ ...data, assetId: Number(data.assetId), requestedBy: userName });
      toast.success("Transfer request submitted");
      setReqOpen(false);
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      queryClient.invalidateQueries({ queryKey: ["transferOverview"] });
    } catch (err) {
      if (err.response?.status === 400) {
        const fe = extractFieldErrors(err);
        if (Object.keys(fe).length > 0) {
          Object.keys(fe).forEach((key) => {
            reqSetError(key, { type: "server", message: fe[key] });
          });
          toast.error("Please fix the highlighted fields");
        } else {
          toast.error(err.response?.data?.message || "Request failed");
        }
      } else {
        toast.error(err.response?.data?.message || "Request failed");
      }
    } finally { setReqSaving(false); }
  };

  // ── Approve / Reject ───────────────────────────────────────────────────────
  const openAction = (transfer, type) => {
    setActionTransfer(transfer);
    setActionType(type);
    actionReset({ remarks: "" });
    setActionOpen(true);
  };

  const [validatedActionData, setValidatedActionData] = useState(null);

  const handleAction = (data) => {
    setValidatedActionData(data);
    setConfirmOpen(true);
  };

  const confirmAction = async () => {
    if (!validatedActionData) return;
    setConfirmOpen(false);
    setActionSaving(true);
    try {
      const fn = actionType === "APPROVE" ? approveTransfer : rejectTransfer;
      await fn(actionTransfer.transferId, { resolvedBy: userName, remarks: validatedActionData.remarks });
      toast.success(`Transfer ${actionType === "APPROVE" ? "approved" : "rejected"}`);
      setActionOpen(false);
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      queryClient.invalidateQueries({ queryKey: ["transferOverview"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    } catch (e) {
      toast.error(e.response?.data?.message || "Action failed");
    } finally { setActionSaving(false); }
  };

  const selectedAsset = assets.find((a) => a.assetId === reqAssetId);
  const availableLocations = locations.filter((l) => {
    // 1. Cannot transfer to the exact same location
    if (l.locationName?.trim().toLowerCase() === fromLocation?.trim().toLowerCase()) return false;

    // 2. Ensure location belongs to the same company as the selected asset
    if (selectedAsset) {
      if (selectedAsset.companyId != null && l.companyId != null) {
        if (Number(selectedAsset.companyId) !== Number(l.companyId)) {
          return false;
        }
      } else {
        const assetComp = selectedAsset.companyName?.trim().toLowerCase();
        const locComp = l.companyName?.trim().toLowerCase();
        if (assetComp && locComp && assetComp !== locComp) {
          return false;
        }
      }
    }
    return true;
  });

  return (
    <Box sx={{ p: 0 }}>

      <PageHeader
        title="Asset Transfers"
        subtitle="Manage location-to-location asset transfers"
        actions={
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            {/* Show count */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, fontSize: 11, color: COLORS.textMuted }}>
              Showing
              <Select
                value={showCount}
                onChange={(e) => { setShowCount(Number(e.target.value)); setPage(0); }}
                size="small"
                sx={selectSx}
              >
                {[5, 10, 20, 50].map((n) => (
                  <MenuItem key={n} value={n} sx={{ fontSize: 11 }}>{n}</MenuItem>
                ))}
              </Select>
            </Box>

            {canRequest && (
              <Button
                variant="contained"
                startIcon={<FaExchangeAlt size={11} />}
                onClick={openRequest}
                sx={{ ...primaryBtnSx, background: COLORS.primary, "&:hover": { background: COLORS.primaryDark } }}
              >
                Request Transfer
              </Button>
            )}
          </Box>
        }
      />

      {/* ── Overview stat chips ──────────────────────────────────────────── */}
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
        <StatCard label="Total" value={overview.total} icon={<FaExchangeAlt size={15} />} iconBg="#e8eaf6" iconColor="#3949ab" onClick={() => { setTab(1); setStatusFilter(""); setPage(0); }} />
        <StatCard label="Pending" value={overview.pending} icon={<FaClock size={15} />} iconBg="#fffbeb" iconColor="#d97706" onClick={() => { setTab(0); setStatusFilter(""); setPage(0); }} />
        <StatCard label="Approved" value={overview.approved} icon={<FaCheck size={15} />} iconBg="#ecfdf5" iconColor="#10b981" onClick={() => { setTab(1); setStatusFilter("APPROVED"); setPage(0); }} />
        <StatCard label="Rejected" value={overview.rejected} icon={<FaTimes size={15} />} iconBg="#ffe4e6" iconColor="#f43f5e" onClick={() => { setTab(1); setStatusFilter("REJECTED"); setPage(0); }} />
      </Box>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <Box sx={{ borderBottom: "1px solid #e5e7eb", mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(0); setStatusFilter(""); }}
          sx={{ "& .MuiTabs-indicator": { backgroundColor: COLORS.primary, height: 2 }, minHeight: 0 }}>
          <Tab label={<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><FaClock size={10} />Pending Requests</Box>}
            sx={{ ...tabSx, minHeight: 0, py: 1 }} />
          <Tab label={<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><FaExchangeAlt size={10} />All Transfers</Box>}
            sx={{ ...tabSx, minHeight: 0, py: 1 }} />
        </Tabs>
      </Box>

      {/* ── Filter (All Transfers tab only) ──────────────────────────────── */}
      {tab === 1 && (
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel sx={{ fontSize: 11.5, transform: "translate(8px, 6px) scale(1)", "&.MuiInputLabel-shrink": { transform: "translate(8px, -6px) scale(0.85)" } }}>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}
              sx={selectSx}>
              <MenuItem value="" sx={{ fontSize: 11.5 }}>All</MenuItem>
              <MenuItem value="PENDING" sx={{ fontSize: 11.5 }}>Pending</MenuItem>
              <MenuItem value="APPROVED" sx={{ fontSize: 12 }}>Approved</MenuItem>
              <MenuItem value="REJECTED" sx={{ fontSize: 12 }}>Rejected</MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <TableCard>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
        ) : transfers.length === 0 ? (
          <EmptyState icon={FaExchangeAlt} label={tab === 0 ? "No pending transfer requests." : "No transfer records found."} />
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 750, borderCollapse: "collapse" }}>
              <TableHead>
                <TableRow>
                  {["#", "Asset", "Code", "From → To", "Priority", "Expected Date", "Reason", "Requested By", "Date", "Status", ...(isAdmin && tab === 0 ? ["Actions"] : [])].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: "#64748b", whiteSpace: "nowrap", background: "#f8fafc", borderBottom: "2px solid #e2e8f0", textTransform: "uppercase", fontSize: 11 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {transfers.map((row, i) => (
                  <TableRow key={row.transferId}
                    sx={{ "&:last-child td": { border: 0 }, "& td": { background: i % 2 === 0 ? "#fff" : "#f8faff", borderBottom: "1px solid #f1f5f9" }, "&:hover td": { background: "#f0f7ff" } }}>
                    <TableCell sx={{ color: COLORS.textFaint, fontSize: 11 }}>{page * 10 + i + 1}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 600, color: "#1e1b4b" }}>{row.assetName}</TableCell>
                    <TableCell>
                      <Chip label={row.assetCode || "—"} size="small"
                        sx={{ fontSize: 9.5, height: 18, background: "#dbeafe", color: "#1e40af", borderRadius: "5px", "& .MuiChip-label": { px: "6px" } }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 11 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, whiteSpace: "nowrap" }}>
                        <Typography sx={{ fontSize: 11, color: "#374151" }}>{row.fromLocation}</Typography>
                        <Typography sx={{ fontSize: 14, color: "#2563eb", fontWeight: 700 }}>→</Typography>
                        <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#2563eb" }}>{row.toLocation}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={row.priority || "MEDIUM"} size="small"
                        sx={{
                          fontSize: 9.5,
                          height: 18,
                          fontWeight: 700,
                          background: row.priority === "HIGH" ? "rgba(239, 68, 68, 0.08)" : row.priority === "LOW" ? "rgba(100, 116, 139, 0.08)" : "rgba(245, 158, 11, 0.08)",
                          color: row.priority === "HIGH" ? "#ef4444" : row.priority === "LOW" ? "#64748b" : "#f59e0b",
                          border: `1px solid ${row.priority === "HIGH" ? "rgba(239, 68, 68, 0.2)" : row.priority === "LOW" ? "rgba(100, 116, 139, 0.2)" : "rgba(245, 158, 11, 0.2)"}`,
                          borderRadius: "5px",
                          textTransform: "uppercase",
                          "& .MuiChip-label": { px: "6px" }
                        }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 11, whiteSpace: "nowrap" }}>{row.expectedDate ? fmt(row.expectedDate) : "—"}</TableCell>
                    <TableCell sx={{ fontSize: 11, color: COLORS.textMuted, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.reason}</TableCell>
                    <TableCell sx={{ fontSize: 11, color: COLORS.textMuted }}>{row.requestedBy}</TableCell>
                    <TableCell sx={{ fontSize: 11, whiteSpace: "nowrap" }}>{fmt(row.requestedAt)}</TableCell>
                    <TableCell><StatusBadge status={row.status} /></TableCell>
                    {isAdmin && tab === 0 && (
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Button size="small" variant="contained" startIcon={<FaCheck size={9} />}
                            onClick={() => openAction(row, "APPROVE")}
                            sx={{ textTransform: "none", fontSize: 10, fontWeight: 700, py: "2px", px: "6px", borderRadius: "4px", background: "#16a34a", boxShadow: "none", minWidth: 0, "&:hover": { background: "#15803d", boxShadow: "none" } }}>
                            Approve
                          </Button>
                          <Button size="small" variant="contained" startIcon={<FaTimes size={9} />}
                            onClick={() => openAction(row, "REJECT")}
                            sx={{ textTransform: "none", fontSize: 10, fontWeight: 700, py: "2px", px: "6px", borderRadius: "4px", background: "#dc2626", boxShadow: "none", minWidth: 0, "&:hover": { background: "#b91c1c", boxShadow: "none" } }}>
                            Reject
                          </Button>
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
        <TablePagination page={page} totalPages={totalPages} onPageChange={(pg) => setPage(pg)} />
      </TableCard>

      {/* ── Request Transfer Modal ──────────────────────────────────────── */}
      <Dialog open={reqOpen} onClose={() => { if (!reqSaving) { setReqOpen(false); reqReset(); } }} maxWidth="xs" fullWidth
        slotProps={{ paper: { sx: premiumDialogPaperSx } }}>
        <DialogTitle sx={premiumDialogTitleSx}>
          <span>Request Asset Transfer</span>
          <IconButton size="small" onClick={() => { if (!reqSaving) { setReqOpen(false); reqReset(); } }} sx={{ color: COLORS.textFaint }}><FaTimes size={13} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.75, pt: "18px !important", pb: 2 }}>

          {/* Asset picker */}
          <Controller
            name="assetId"
            control={reqControl}
            rules={{ required: "Select an asset to transfer" }}
            render={({ field, fieldState: { error } }) => (
              <FormControl fullWidth size="small" error={!!error}>
                <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: error ? "#c62828" : COLORS.textMuted, mb: 0.5 }}>
                  Asset *
                </Typography>
                <OutlinedInput
                  readOnly notched={false} label="" size="small"
                  value={selectedAsset ? `${selectedAsset.assetName}${selectedAsset.assetCode ? ` (${selectedAsset.assetCode})` : ""}` : ""}
                  placeholder="Select asset to transfer..."
                  onClick={(e) => setAssetAnchor(e.currentTarget)}
                  error={!!error}
                  endAdornment={<InputAdornment position="end"><Typography fontSize={11} color="#aaa">▾</Typography></InputAdornment>}
                  sx={{
                    ...inputSx["& .MuiOutlinedInput-root"],
                    fontSize: 11.5,
                    height: 30,
                    cursor: "pointer",
                    caretColor: "transparent",
                    background: "#f8fafc",
                    borderColor: error ? "#c62828" : "#cbd5e1",
                    "& fieldset": { border: "1px solid", borderColor: error ? "#c62828 !important" : "#cbd5e1" }
                  }}
                />
                {error && <Typography color="error" sx={{ fontSize: 10.5, mt: 0.25 }}>{error.message}</Typography>}
                <Popover open={Boolean(assetAnchor)} anchorEl={assetAnchor}
                  onClose={() => { setAssetAnchor(null); setAssetSearch(""); }}
                  anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                  slotProps={{ paper: { sx: { width: assetAnchor?.offsetWidth, minWidth: 320, maxHeight: 280, display: "flex", flexDirection: "column", borderRadius: "10px", boxShadow: "0 10px 25px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0" } } }}>
                  <Box sx={{ p: 1, borderBottom: "1px solid #f0f0f0" }}>
                    <TextField autoFocus size="small" fullWidth placeholder="Search asset..."
                      value={assetSearch} onChange={(e) => setAssetSearch(e.target.value)}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start"><FaSearch size={11} color="#aaa" /></InputAdornment> } }}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px", fontSize: 12 } }} />
                  </Box>
                  <List dense sx={{ overflowY: "auto", flex: 1 }}>
                    {assets
                      .filter((a) => !assetSearch || a.assetName?.toLowerCase().includes(assetSearch.toLowerCase()) || a.assetCode?.toLowerCase().includes(assetSearch.toLowerCase()))
                      .filter((a) => a.status === "AVAILABLE" || a.status === "UNDER_MAINTENANCE")
                      .map((a) => (
                        <ListItemButton key={a.assetId} selected={field.value === a.assetId}
                          onClick={() => handleAssetSelect(a, field.onChange)} sx={{ py: 0.5 }}>
                          <ListItemText
                            primary={<Typography sx={{ fontSize: 11.5 }}>{a.assetName}</Typography>}
                            secondary={<Typography sx={{ fontSize: 10, color: "#64748b" }}>{`${a.assetCode || ""} • ${a.locationName || ""} • status: ${a.status || ""}`}</Typography>}
                          />
                        </ListItemButton>
                      ))}
                  </List>
                </Popover>
              </FormControl>
            )}
          />

          {/* From / To location */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
            <Box>
              <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.textMuted, mb: 0.5 }}>
                From Location
              </Typography>
              <TextField size="small" value={fromLocation || "—"} disabled
                sx={{
                  ...inputSx,
                  "& .MuiOutlinedInput-root": { ...inputSx["& .MuiOutlinedInput-root"], height: 30, fontSize: 11.5, bgcolor: "#f8fafc" }
                }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.textMuted, mb: 0.5 }}>
                To Location *
              </Typography>
              <FormSelect
                name="toLocation"
                control={reqControl}
                rules={{ required: "Select a destination location" }}
                disabled={reqSaving}
                sx={{
                  ...selectSx,
                  height: 30,
                  "& .MuiSelect-select": { height: "28px", lineHeight: "28px" }
                }}
              >
                {availableLocations.map((l) => (
                  <MenuItem key={l.locationId || l.locationName} value={l.locationName} sx={{ fontSize: 11.5 }}>
                    {l.locationName}
                  </MenuItem>
                ))}
              </FormSelect>
            </Box>
          </Box>

          {/* Priority & Expected Date */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
            <Box>
              <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.textMuted, mb: 0.5 }}>
                Priority *
              </Typography>
              <FormSelect
                name="priority"
                control={reqControl}
                rules={{ required: "Priority is required" }}
                disabled={reqSaving}
                sx={{
                  ...selectSx,
                  height: 30,
                  "& .MuiSelect-select": { height: "28px", lineHeight: "28px" }
                }}
              >
                <MenuItem value="LOW" sx={{ fontSize: 11.5 }}>Low</MenuItem>
                <MenuItem value="MEDIUM" sx={{ fontSize: 11.5 }}>Medium</MenuItem>
                <MenuItem value="HIGH" sx={{ fontSize: 11.5 }}>High</MenuItem>
              </FormSelect>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.textMuted, mb: 0.5 }}>
                Expected Date *
              </Typography>
              <FormTextField
                name="expectedDate"
                control={reqControl}
                rules={{ required: "Expected transfer date is required" }}
                type="date"
                disabled={reqSaving}
                slotProps={{
                  inputLabel: { shrink: true }
                }}
                sx={{
                  ...inputSx,
                  "& .MuiOutlinedInput-root": { ...inputSx["& .MuiOutlinedInput-root"], height: 30, fontSize: 11.5 }
                }}
              />
            </Box>
          </Box>

          <Box>
            <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.textMuted, mb: 0.5 }}>
              Reason *
            </Typography>
            <FormTextField
              name="reason"
              control={reqControl}
              rules={{
                required: "Transfer reason is required",
                minLength: { value: 5, message: "Reason must be at least 5 characters" }
              }}
              placeholder="Why is this asset being transferred?"
              multiline
              rows={2}
              disabled={reqSaving}
              sx={{
                ...inputSx,
                "& .MuiOutlinedInput-root": { ...inputSx["& .MuiOutlinedInput-root"], height: "auto", fontSize: 11.5, py: "6px !important" }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, borderTop: "1px solid #f1f5f9", pt: 1.5 }}>
          <Button onClick={() => { if (!reqSaving) { setReqOpen(false); reqReset(); } }} sx={outlinedBtnSx}>Cancel</Button>
          <Button variant="contained" onClick={reqSubmit(handleRequestSubmit)} disabled={reqSaving}
            startIcon={reqSaving ? <CircularProgress size={11} color="inherit" /> : <FaExchangeAlt size={10} />}
            sx={{ ...primaryBtnSx, background: COLORS.primary, "&:hover": { background: COLORS.primaryDark } }}>
            {reqSaving ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Approve / Reject Action Modal ──────────────────────────────── */}
      <Dialog open={actionOpen} onClose={() => { if (!actionSaving) { setActionOpen(false); actionReset(); } }} maxWidth="xs" fullWidth
        slotProps={{ paper: { sx: premiumDialogPaperSx } }}>
        <DialogTitle sx={premiumDialogTitleSx}>
          <span style={{ display: "flex", alignItems: "center", gap: "8px", color: actionType === "APPROVE" ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
            {actionType === "APPROVE" ? "✅ Approve Transfer" : "❌ Reject Transfer"}
          </span>
          <IconButton size="small" onClick={() => { if (!actionSaving) { setActionOpen(false); actionReset(); } }} sx={{ color: COLORS.textFaint }}><FaTimes size={13} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.75, pt: "18px !important", pb: 2 }}>
          {actionTransfer && (
            <Box sx={{ background: "#fbfcfd", borderRadius: "8px", p: 1.5, border: "1px solid #e2e8f0" }}>
              <Typography fontSize={12} fontWeight={700} color="#1e1b4b" mb={0.5}>{actionTransfer.assetName}</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
                <Typography fontSize={10.5} sx={{ color: COLORS.textMuted }}>{actionTransfer.fromLocation}</Typography>
                <Typography fontSize={12} sx={{ color: "#2563eb", fontWeight: 700 }}>→</Typography>
                <Typography fontSize={10.5} sx={{ color: "#2563eb", fontWeight: 600 }}>{actionTransfer.toLocation}</Typography>
              </Box>
              <Typography fontSize={10.5} color={COLORS.textFaint}>{actionTransfer.reason}</Typography>
            </Box>
          )}
          <Box>
            <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.textMuted, mb: 0.5 }}>
              Remarks {actionType === "REJECT" ? "*" : "(optional)"}
            </Typography>
            <FormTextField
              name="remarks"
              control={actionControl}
              rules={{
                required: actionType === "REJECT" ? "Remarks/reason is required for rejection" : false
              }}
              placeholder="Add a note or remark..."
              multiline
              rows={2}
              disabled={actionSaving}
              sx={{
                ...inputSx,
                "& .MuiOutlinedInput-root": { ...inputSx["& .MuiOutlinedInput-root"], height: "auto", fontSize: 11.5, py: "6px !important" }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, borderTop: "1px solid #f1f5f9", pt: 1.5 }}>
          <Button onClick={() => { if (!actionSaving) { setActionOpen(false); actionReset(); } }} sx={outlinedBtnSx}>Cancel</Button>
          <Button variant="contained" onClick={actionSubmit(handleAction)} disabled={actionSaving}
            startIcon={actionSaving ? <CircularProgress size={11} color="inherit" /> : actionType === "APPROVE" ? <FaCheck size={10} /> : <FaTimes size={10} />}
            sx={{ ...primaryBtnSx, background: actionType === "APPROVE" ? "#16a34a" : "#dc2626", "&:hover": { background: actionType === "APPROVE" ? "#15803d" : "#b91c1c" } }}>
            {actionSaving ? "Saving..." : actionType === "APPROVE" ? "Approve" : "Reject"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title={`Confirm ${actionType === "APPROVE" ? "Approval" : "Rejection"}`}
        message={`Are you sure you want to ${actionType === "APPROVE" ? "APPROVE" : "REJECT"} this transfer? ${actionType === "APPROVE" ? "The asset location will be updated." : ""}`}
        onConfirm={confirmAction}
        onCancel={() => setConfirmOpen(false)}
        confirmLabel={actionType === "APPROVE" ? "Yes, Approve" : "Yes, Reject"}
      />
    </Box>
  );
}
