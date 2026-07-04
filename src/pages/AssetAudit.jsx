import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, MenuItem, Select,
  Popover, List, ListItemButton, ListItemText,
  Table, TableBody, TableCell, TableHead, TableRow, TextField,
  Typography, InputLabel, FormControl, InputAdornment, OutlinedInput,
  Tooltip, FormControlLabel, Checkbox, FormHelperText
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { FaTimes, FaSearch, FaEye, FaClipboardCheck, FaPlus, FaCheck, FaExclamationTriangle, FaFileExcel, FaSyncAlt } from "react-icons/fa";
import toast from "../utils/toast.jsx";

import { createAudit, getAudits, getAuditOverview } from "../services/audit_service";
import { getAssets, getImageUrl } from "../services/assets_service";
import { exportAudits } from "../services/report_service";
import PageHeader from "../components/common/PageHeader";
import TableCard from "../components/common/TableCard";
import TablePagination from "../components/common/TablePagination";
import ConfirmDialog from "../components/common/ConfirmDialog";
import ActionBtn from "../components/common/ActionBtn";
import StatCard from "../components/common/StatCard";
import StatusBadge from "../components/common/StatusBadge";
import EmptyState from "../components/common/EmptyState";
import InfoRow from "../components/common/InfoRow";
import SkeletonLoader from "../components/common/SkeletonLoader";
import { FormTextField, FormSelect } from "../components/FormFields";

import { COLORS, outlinedBtnSx, primaryBtnSx, selectSx, premiumDialogPaperSx, premiumDialogTitleSx, searchFieldSx, resetBtnSx } from "../theme/tokens";
import { required } from "../utils/validate";

const AUDIT_STATUSES = ["GOOD", "DAMAGED", "LOST"];
const ACTION_TAKEN_OPTIONS = ["NONE", "REPAIR", "REPLACE", "DISPOSE"];

const CHECKLIST_MAPPINGS = {
  IT: {
    screen: "Screen Operational",
    keyboard: "Keyboard & Trackpad OK",
    charger: "Charger & Cables OK",
    battery: "Battery Health OK"
  },
  MOBILE: {
    screen: "Screen & Camera OK",
    keyboard: "Touchscreen & Buttons OK",
    charger: "Charger & Cables OK",
    battery: "Battery Health OK"
  },
  FURNITURE: {
    screen: "Structural Frame OK",
    keyboard: "Stability & Joints OK",
    charger: "Surface & Material OK",
    battery: "Cleanliness & Appearance OK"
  },
  DEFAULT: {
    screen: "Power & Wiring OK",
    keyboard: "Outer Casing / Frame OK",
    charger: "Basic Controls / Buttons OK",
    battery: "General Functions OK"
  }
};

const getChecklistLabels = (typeName) => {
  const name = (typeName || "").toUpperCase().trim();
  if (name.includes("FURNITURE") || name.includes("CHAIR") || name.includes("TABLE") || name.includes("DESK")) return CHECKLIST_MAPPINGS.FURNITURE;
  if (name === "IT" || name.includes("LAPTOP") || name.includes("COMPUTER")) return CHECKLIST_MAPPINGS.IT;
  if (name.includes("MOBILE") || name.includes("PHONE") || name.includes("TABLET")) return CHECKLIST_MAPPINGS.MOBILE;
  return CHECKLIST_MAPPINGS.DEFAULT;
};

export default function AssetAudit() {
  const { userRole, userName } = useSelector((s) => s.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [showCount, setShowCount] = useState(10);

  const [auditOpen, setAuditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [assetSearch, setAssetSearch] = useState("");
  const [assetAnchor, setAssetAnchor] = useState(null);
  const [exporting, setExporting] = useState(false);

  const handleExportAudits = async () => {
    setExporting(true);
    const id = toast.loading("Preparing Audits export...");
    try {
      await exportAudits();
      toast.success("Audits report downloaded successfully", { id });
    } catch (err) {
      toast.error("Failed to export audits", { id });
    } finally {
      setExporting(false);
    }
  };

  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const formDataRef = useRef(null);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: audits = [], isLoading: loading, isError, error, refetch } = useQuery({
    queryKey: ["audits", searchInput, statusFilter],
    queryFn: async () => {
      const params = {};
      if (searchInput.trim()) params.search = searchInput.trim();
      if (statusFilter) params.status = statusFilter;
      return await getAudits(params);
    },
    placeholderData: keepPreviousData,
  });

  const { data: allAssets = [] } = useQuery({
    queryKey: ["assets", "simple-audit"],
    queryFn: async () => {
      const res = await getAssets({ page: 0, size: 200 });
      return res?.data?.content || res?.data || res || [];
    },
  });

  const { data: overview = { totalAudits: 0, goodCount: 0, damagedCount: 0, lostCount: 0 } } = useQuery({
    queryKey: ["audits-overview"],
    queryFn: getAuditOverview,
  });

  // ── Form Setup ───────────────────────────────────────────────────────────
  const { control, handleSubmit, reset, setValue, setError, watch } = useForm({
    defaultValues: {
      assetId: "",
      auditedBy: userName || "",
      auditDate: new Date().toISOString().split("T")[0],
      status: "GOOD",
      remarks: "",
      actionTaken: "NONE",
      screenOk: true,
      keyboardOk: true,
      chargerOk: true,
      batteryOk: true,
    }
  });

  const formAssetId = watch("assetId");

  const preselectedAssetId = Number(searchParams.get("assetId"));
  const selectedAsset = allAssets.find((a) => Number(a.assetId) === Number(formAssetId));
  const selectedAssetType = selectedAsset?.typeName || selectedAsset?.assetType?.typeName || "";
  const checklistLabels = getChecklistLabels(selectedAssetType);
  const selectableAssets = allAssets.filter(
    (a) => a.status === "AVAILABLE" || a.status === "ASSIGNED" || a.status === "DAMAGED" || a.status === "LOST" || a.status === "UNDER_MAINTENANCE" || a.assetId === formAssetId || a.assetId === preselectedAssetId
  );

  const paginatedAudits = audits.slice(page * showCount, (page + 1) * showCount);

  // ── Auto-Open if Redirected from Scan/QR ──────────────────────────────────
  useEffect(() => {
    const assetIdParam = searchParams.get("assetId");
    if (assetIdParam) {
      openAuditModal(Number(assetIdParam));
      setSearchParams({});
    }
  }, [searchParams]);

  const openAuditModal = (preselectedId = null) => {
    setAssetSearch("");
    reset({
      assetId: preselectedId || "",
      auditedBy: userName || "",
      auditDate: new Date().toISOString().split("T")[0],
      status: "GOOD",
      remarks: "",
      actionTaken: "NONE",
      screenOk: true,
      keyboardOk: true,
      chargerOk: true,
      batteryOk: true,
    });
    setAuditOpen(true);
  };

  const handleAuditSubmit = (data) => {
    formDataRef.current = data;
    setConfirmOpen(true);
  };

  const confirmAuditSave = async () => {
    const data = formDataRef.current;
    if (!data) return;
    setSaving(true);
    setConfirmOpen(false);
    try {
      await createAudit({
        assetId: Number(data.assetId),
        auditedBy: data.auditedBy,
        auditDate: data.auditDate,
        status: data.status,
        remarks: data.remarks,
        actionTaken: data.actionTaken,
        screenOk: data.screenOk,
        keyboardOk: data.keyboardOk,
        chargerOk: data.chargerOk,
        batteryOk: data.batteryOk,
      });
      toast.success("Audit log recorded successfully");
      setAuditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["audits"] });
      queryClient.invalidateQueries({ queryKey: ["audits-overview"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    } catch (err) {
      toast.error(err.response?.data?.message || "Audit logging failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <SkeletonLoader variant="list" statCount={4} columnCount={8} />;
  }

  return (
    <Box sx={{ p: 0 }}>
      <PageHeader
        title="Asset Audit & Inspection"
        subtitle="Manage periodic physical audits, verify device health status, and record component checks"
      />

      {/* Overview Cards */}
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
        <StatCard label="Total Audits Done" value={overview.totalAudits} icon={<FaClipboardCheck size={16} />} iconBg="#eef2ff" iconColor="#4f46e5" />
        <StatCard label="Operational (Good)" value={overview.goodCount} icon={<FaCheck size={14} />} iconBg="#ecfdf5" iconColor="#10b981" />
        <StatCard label="Flagged Damaged" value={overview.damagedCount} icon={<FaExclamationTriangle size={15} />} iconBg="#fffbeb" iconColor="#d97706" />
        <StatCard label="Flagged Lost" value={overview.lostCount} icon={<FaTimes size={15} />} iconBg="#fef2f2" iconColor="#ef4444" />
      </Box>

      {/* Actions and Filters Bar */}
      <Box sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1.5,
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        mb: 2,
        animation: "fadeLeft 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "@keyframes fadeLeft": {
          from: { opacity: 0, transform: "translateX(15px)" },
          to: { opacity: 1, transform: "translateX(0)" },
        }
      }}>
        {/* Left Side: Search & Filters */}
        <Box sx={{
          display: "flex",
          gap: 1.5,
          alignItems: "center",
          flexWrap: "wrap",
          flex: { xs: "1 1 100%", md: "auto" },
          order: { xs: 2, md: 1 }
        }}>
          <TextField
            size="small"
            placeholder="Search by asset, code, or auditor…"
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(0); }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><FaSearch size={11} color="#aaa" /></InputAdornment> } }}
            sx={{
              ...searchFieldSx(280, 340),
              width: { xs: "100%", sm: "auto" },
              minWidth: { xs: "100%", sm: 280 }
            }}
          />
          <Select
            size="small"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            displayEmpty
            sx={{ ...selectSx, minWidth: 150, flex: { xs: 1, sm: "initial" } }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            {AUDIT_STATUSES.map((st) => (
              <MenuItem key={st} value={st} sx={{ fontSize: 12 }}>{st}</MenuItem>
            ))}
          </Select>

          <Tooltip title="Clear filters">
            <IconButton
              onClick={() => { setSearchInput(""); setStatusFilter(""); setPage(0); }}
              sx={resetBtnSx}
            >
              <FaSyncAlt size={11} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Right Side: Actions */}
        <Box sx={{
          display: "flex",
          gap: 1.5,
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: { xs: "flex-end", md: "flex-end" },
          flex: { xs: "1 1 100%", md: "auto" },
          mt: { xs: 0.5, md: 0 },
          order: { xs: 1, md: 2 }
        }}>
          <Button
            variant="outlined"
            startIcon={<FaFileExcel size={12} />}
            onClick={handleExportAudits}
            disabled={exporting}
            sx={outlinedBtnSx}
          >
            Export Excel
          </Button>
          <Button
            variant="contained"
            startIcon={<FaClipboardCheck size={12} />}
            onClick={() => openAuditModal()}
            sx={primaryBtnSx}
          >
            Start Audit
          </Button>
        </Box>
      </Box>

      {/* Audit Logs Table */}
      <TableCard>
        {isError ? (
          <EmptyState label={error?.message || "Failed to load audit records"} />
        ) : audits.length === 0 ? (
          <EmptyState icon={FaClipboardCheck} label="No audit records registered yet." />
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  {["#", "Asset Name", "Asset Code", "Audit Date", "Audited By", "Condition Status", "Action Plan", "Checklist Issues", "Details"].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: "#64748b", background: "#f8fafc", py: 1.2 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedAudits.map((row, index) => {
                  const issueCount = [row.screenOk, row.keyboardOk, row.chargerOk, row.batteryOk].filter(ok => ok === false).length;
                  return (
                    <TableRow key={row.auditId} sx={{ "&:hover": { bgcolor: "#f1f5f9" } }}>
                      <TableCell sx={{ fontSize: 11 }}>{page * showCount + index + 1}</TableCell>
                      <TableCell sx={{ fontSize: 11.5, fontWeight: 600 }}>{row.assetName}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>
                        <Chip label={row.assetCode} size="small" sx={{ height: 18, fontSize: 9.5, bgcolor: "#f3e8ff", color: "#6b21a8" }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{row.auditDate}</TableCell>
                      <TableCell sx={{ fontSize: 11, color: COLORS.textMuted }}>{row.auditedBy}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}><StatusBadge status={row.status} /></TableCell>
                      <TableCell sx={{ fontSize: 11 }}>
                        <Chip label={row.actionTaken || "NONE"} size="small" variant="outlined" sx={{ height: 18, fontSize: 9 }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 11 }}>
                        {issueCount > 0 ? (
                          <Chip label={`${issueCount} issues`} color="error" size="small" sx={{ height: 16, fontSize: 9 }} />
                        ) : (
                          <Chip label="All Clear" color="success" size="small" sx={{ height: 16, fontSize: 9 }} />
                        )}
                      </TableCell>
                      <TableCell sx={{ py: 0.5 }}>
                        <ActionBtn
                          title="View Details"
                          color="#3b82f6"
                          onClick={() => { setViewData(row); setViewOpen(true); }}
                        >
                          <FaEye size={12} />
                        </ActionBtn>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <TablePagination
              page={page}
              totalPages={Math.ceil(audits.length / showCount) || 1}
              onPageChange={setPage}
            />
          </Box>
        )}
      </TableCard>

      {/* Start Audit Modal */}
      <Dialog
        open={auditOpen}
        onClose={() => !saving && setAuditOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: premiumDialogPaperSx } }}
      >
        <DialogTitle sx={premiumDialogTitleSx}>
          <Typography fontWeight={800} fontSize="14px" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FaClipboardCheck size={14} style={{ color: COLORS.primary }} /> New Asset Audit
          </Typography>
          <IconButton size="small" onClick={() => !saving && setAuditOpen(false)} sx={{ color: COLORS.textFaint }} disabled={saving}>
            <FaTimes size={13} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: "20px !important", pb: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Asset Selection */}
          <Controller
            name="assetId"
            control={control}
            rules={{ required: "Asset selection is required" }}
            render={({ field, fieldState: { error } }) => (
              <FormControl fullWidth error={!!error} sx={{ mb: 1 }}>
                <Typography sx={{ fontSize: 11.5, color: COLORS.textMuted, mb: 0.5, fontWeight: 600 }}>Asset to Audit *</Typography>
                <OutlinedInput
                  readOnly
                  size="small"
                  value={selectableAssets.find((a) => a.assetId === field.value)
                    ? `${selectableAssets.find((a) => a.assetId === field.value).assetName} (${selectableAssets.find((a) => a.assetId === field.value).assetCode})`
                    : ""}
                  placeholder="Select asset to inspect..."
                  onClick={(e) => setAssetAnchor(e.currentTarget)}
                  endAdornment={<InputAdornment position="end"><Typography fontSize={11} color="#aaa">▾</Typography></InputAdornment>}
                  sx={{ borderRadius: "6px", fontSize: 11.5, height: 30 }}
                />
                {error && <FormHelperText error sx={{ mx: 0, mt: 0.5 }}>{error.message}</FormHelperText>}
                <Popover
                  open={Boolean(assetAnchor)}
                  anchorEl={assetAnchor}
                  onClose={() => { setAssetAnchor(null); setAssetSearch(""); }}
                  anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                  slotProps={{ paper: { sx: { width: assetAnchor?.offsetWidth, maxHeight: 250, display: "flex", flexDirection: "column" } } }}
                >
                  <Box sx={{ p: 1, borderBottom: "1px solid #f0f0f0" }}>
                    <TextField
                      autoFocus
                      size="small"
                      fullWidth
                      placeholder="Search asset..."
                      value={assetSearch}
                      onChange={(e) => setAssetSearch(e.target.value)}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start"><FaSearch size={10} /></InputAdornment> } }}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px", fontSize: 11 } }}
                    />
                  </Box>
                  <List dense sx={{ overflowY: "auto", flex: 1 }}>
                    {selectableAssets.filter(a => !assetSearch || a.assetName?.toLowerCase().includes(assetSearch.toLowerCase()) || a.assetCode?.toLowerCase().includes(assetSearch.toLowerCase())).map((a) => (
                      <ListItemButton key={a.assetId} onClick={() => { field.onChange(a.assetId); setAssetAnchor(null); setAssetSearch(""); }}>
                        <ListItemText primary={<Typography sx={{ fontSize: 11.5 }}>{a.assetName}</Typography>} secondary={<Typography sx={{ fontSize: 10, color: "#64748b" }}>{a.assetCode} - {a.status}</Typography>} />
                      </ListItemButton>
                    ))}
                  </List>
                </Popover>
              </FormControl>
            )}
          />

          {/* Checklist Checks */}
          <Box sx={{ border: "1px solid #cbd5e1", borderRadius: "8px", p: 1.5, bgcolor: "#f8fafc" }}>
            <Typography sx={{ fontSize: 11, fontWeight: 800, color: COLORS.primary, mb: 1, textTransform: "uppercase" }}>Component Verification Checklist</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
              <Controller
                name="screenOk"
                control={control}
                render={({ field }) => (
                  <FormControlLabel control={<Checkbox size="small" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />} label={<Typography sx={{ fontSize: 11 }}>{checklistLabels.screen}</Typography>} />
                )}
              />
              <Controller
                name="keyboardOk"
                control={control}
                render={({ field }) => (
                  <FormControlLabel control={<Checkbox size="small" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />} label={<Typography sx={{ fontSize: 11 }}>{checklistLabels.keyboard}</Typography>} />
                )}
              />
              <Controller
                name="chargerOk"
                control={control}
                render={({ field }) => (
                  <FormControlLabel control={<Checkbox size="small" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />} label={<Typography sx={{ fontSize: 11 }}>{checklistLabels.charger}</Typography>} />
                )}
              />
              <Controller
                name="batteryOk"
                control={control}
                render={({ field }) => (
                  <FormControlLabel control={<Checkbox size="small" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />} label={<Typography sx={{ fontSize: 11 }}>{checklistLabels.battery}</Typography>} />
                )}
              />
            </Box>
          </Box>

          {/* Condition status & action plans */}
          <Box sx={{ display: "flex", gap: 2 }}>
            <FormSelect
              name="status"
              control={control}
              label="Audit Condition Status *"
              options={AUDIT_STATUSES}
            />
            <FormSelect
              name="actionTaken"
              control={control}
              label="Immediate Action Required"
              options={ACTION_TAKEN_OPTIONS}
            />
          </Box>

          <FormTextField
            name="remarks"
            control={control}
            label="Audit Remarks / Damage Notes"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, gap: 1 }}>
          <Button onClick={() => setAuditOpen(false)} sx={outlinedBtnSx}>Cancel</Button>
          <Button onClick={handleSubmit(handleAuditSubmit)} sx={primaryBtnSx}>Save Log</Button>
        </DialogActions>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: premiumDialogPaperSx } }}>
        <DialogTitle sx={premiumDialogTitleSx}>
          <Typography fontWeight={800} fontSize="14px" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FaClipboardCheck size={13} style={{ color: COLORS.primary }} /> Audit Details
          </Typography>
          <IconButton size="small" onClick={() => setViewOpen(false)} sx={{ color: COLORS.textFaint }}><FaTimes size={13} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: "20px !important", pb: 2.5 }}>
          {viewData && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <InfoRow label="Asset Name" value={viewData.assetName} />
              <InfoRow label="Asset Code" value={viewData.assetCode} />
              <InfoRow label="Audited By" value={viewData.auditedBy} />
              <InfoRow label="Audit Date" value={viewData.auditDate} />
              <InfoRow label="Overall Condition" value={<StatusBadge status={viewData.status} />} />
              <InfoRow label="Action Plan" value={viewData.actionTaken} />
              <Box sx={{ border: "1px solid #cbd5e1", borderRadius: "6px", p: 1, bgcolor: "#f8fafc", mt: 1 }}>
                <Typography sx={{ fontSize: 10, fontWeight: 700, mb: 0.5, color: COLORS.primary }}>COMPONENT CHECKS</Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.5 }}>
                  {(() => {
                    const viewLabels = getChecklistLabels(viewData.typeName);
                    return (
                      <>
                        <Typography sx={{ fontSize: 9.5 }}>{viewLabels.screen}: {viewData.screenOk ? "✅ OK" : "❌ Issue"}</Typography>
                        <Typography sx={{ fontSize: 9.5 }}>{viewLabels.keyboard}: {viewData.keyboardOk ? "✅ OK" : "❌ Issue"}</Typography>
                        <Typography sx={{ fontSize: 9.5 }}>{viewLabels.charger}: {viewData.chargerOk ? "✅ OK" : "❌ Issue"}</Typography>
                        <Typography sx={{ fontSize: 9.5 }}>{viewLabels.battery}: {viewData.batteryOk ? "✅ OK" : "❌ Issue"}</Typography>
                      </>
                    );
                  })()}
                </Box>
              </Box>
              {viewData.remarks && (
                <Box sx={{ p: 1, border: "1px solid #e2e8f0", borderRadius: "4px", mt: 0.5 }}>
                  <Typography sx={{ fontSize: 10, color: COLORS.textMuted, mb: 0.25 }}>Remarks / Finding Notes</Typography>
                  <Typography sx={{ fontSize: 10.5, color: COLORS.text }}>{viewData.remarks}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5 }}>
          <Button onClick={() => setViewOpen(false)} sx={outlinedBtnSx}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title="Verify Audit Submission"
        message="Are you sure you want to log this physical inspection result? If marked DAMAGED or LOST, it will propagate immediately to update the asset record."
        confirmText="Confirm & Save"
        cancelText="Cancel"
        onConfirm={confirmAuditSave}
        onCancel={() => setConfirmOpen(false)}
      />
    </Box>
  );
}
