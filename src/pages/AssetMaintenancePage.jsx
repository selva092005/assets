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
  Tooltip
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { FaTimes, FaSearch, FaEye, FaWrench, FaPlus, FaCoins, FaHammer, FaBan, FaCheck, FaSyncAlt } from "react-icons/fa";
import toast from "../utils/toast.jsx";

import { logMaintenance, getAllMaintenance } from "../services/maintenance_service";
import { getAssets } from "../services/assets_service";
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

const OUTCOMES = ["FIXED", "UNRESOLVED", "REPLACED", "SCRAPPED"];

export default function AssetMaintenancePage() {
  const { userRole, userName } = useSelector((s) => s.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("");
  const [page, setPage] = useState(0);
  const [showCount, setShowCount] = useState(10);

  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [assetSearch, setAssetSearch] = useState("");
  const [assetAnchor, setAssetAnchor] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const formDataRef = useRef(null);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: maintenanceLogs = [], isLoading: loading, isError, error, refetch } = useQuery({
    queryKey: ["maintenance-logs", searchInput, outcomeFilter],
    queryFn: async () => {
      const params = {};
      if (searchInput.trim()) params.search = searchInput.trim();
      if (outcomeFilter) params.outcome = outcomeFilter;
      return await getAllMaintenance(params);
    },
    placeholderData: keepPreviousData,
  });

  const { data: allAssets = [] } = useQuery({
    queryKey: ["assets-simple-maintenance"],
    queryFn: async () => {
      const res = await getAssets({ page: 0, size: 200 });
      return res?.data?.content || res?.data || res || [];
    },
  });

  // ── Form Setup ───────────────────────────────────────────────────────────
  const { control, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      assetId: "",
      vendorName: "",
      maintenanceDate: new Date().toISOString().split("T")[0],
      cost: "",
      outcome: "FIXED",
      notes: "",
    }
  });

  const formAssetId = watch("assetId");
  const preselectedAssetId = Number(searchParams.get("assetId"));
  const selectableAssets = allAssets.filter(
    (a) => a.status === "DAMAGED" || a.status === "UNDER_REPAIR" || a.status === "AVAILABLE" || a.assetId === formAssetId || a.assetId === preselectedAssetId
  );

  const paginatedLogs = maintenanceLogs.slice(page * showCount, (page + 1) * showCount);

  // ── Auto-Open if Redirected from Scan/QR ──────────────────────────────────
  useEffect(() => {
    const assetIdParam = searchParams.get("assetId");
    if (assetIdParam) {
      openMaintenanceModal(Number(assetIdParam));
      setSearchParams({});
    }
  }, [searchParams]);

  const openMaintenanceModal = (preselectedId = null) => {
    setAssetSearch("");
    reset({
      assetId: preselectedId || "",
      vendorName: "",
      maintenanceDate: new Date().toISOString().split("T")[0],
      cost: "",
      outcome: "FIXED",
      notes: "",
    });
    setMaintenanceOpen(true);
  };

  const handleMaintenanceSubmit = (data) => {
    formDataRef.current = data;
    setConfirmOpen(true);
  };

  const confirmMaintenanceSave = async () => {
    const data = formDataRef.current;
    if (!data) return;
    setSaving(true);
    setConfirmOpen(false);
    try {
      await logMaintenance({
        assetId: Number(data.assetId),
        vendorName: data.vendorName,
        maintenanceDate: data.maintenanceDate,
        cost: data.cost ? Number(data.cost) : 0,
        outcome: data.outcome,
        notes: data.notes,
      }, userName);
      toast.success("Maintenance log added successfully");
      setMaintenanceOpen(false);
      queryClient.invalidateQueries({ queryKey: ["maintenance-logs"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to log maintenance");
    } finally {
      setSaving(false);
    }
  };

  // KPI calculations
  const totalCount = maintenanceLogs.length;
  const totalRepairsCost = maintenanceLogs.reduce((sum, log) => sum + (log.cost || 0), 0);
  const fixedCount = maintenanceLogs.filter(log => log.outcome === "FIXED").length;
  const scrapCount = maintenanceLogs.filter(log => log.outcome === "SCRAPPED").length;

  if (loading) {
    return <SkeletonLoader variant="list" statCount={4} columnCount={8} />;
  }

  return (
    <Box sx={{ p: 0 }}>
      <PageHeader
        title="Asset Maintenance & Repair History"
        subtitle="Log device repair details, track hardware service vendors, monitor costs, and archive outcomes"
      />

      {/* KPI stats */}
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
        <StatCard label="Total Repairs Logged" value={totalCount} icon={<FaHammer size={15} />} iconBg="#eef2ff" iconColor="#4f46e5" />
        <StatCard label="Total Spent" value={`₹${totalRepairsCost.toLocaleString("en-IN")}`} icon={<FaCoins size={14} />} iconBg="#ecfdf5" iconColor="#10b981" />
        <StatCard label="Successfully Fixed" value={fixedCount} icon={<FaCheck size={14} />} iconBg="#f0fdf4" iconColor="#15803d" onClick={() => { setOutcomeFilter("FIXED"); setPage(0); }} />
        <StatCard label="Scrapped Outcomes" value={scrapCount} icon={<FaBan size={14} />} iconBg="#fff5f5" iconColor="#e53e3e" onClick={() => { setOutcomeFilter("SCRAPPED"); setPage(0); }} />
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
            placeholder="Search by asset, code, or vendor..."
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
            value={outcomeFilter}
            onChange={(e) => { setOutcomeFilter(e.target.value); setPage(0); }}
            displayEmpty
            sx={{ ...selectSx, minWidth: 150, flex: { xs: 1, sm: "initial" } }}
          >
            <MenuItem value="">All Outcomes</MenuItem>
            {OUTCOMES.map(o => (
              <MenuItem key={o} value={o} sx={{ fontSize: 12 }}>{o}</MenuItem>
            ))}
          </Select>

          <Tooltip title="Reset filters">
            <IconButton
              onClick={() => { setSearchInput(""); setOutcomeFilter(""); setPage(0); }}
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
            variant="contained"
            startIcon={<FaPlus size={10} />}
            onClick={() => openMaintenanceModal()}
            sx={primaryBtnSx}
          >
            Log Maintenance
          </Button>
        </Box>
      </Box>

      {/* Logs Table */}
      <TableCard>
        {isError ? (
          <EmptyState label={error?.message || "Failed to load repair histories"} />
        ) : maintenanceLogs.length === 0 ? (
          <EmptyState icon={FaWrench} label="No maintenance history records found." />
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  {["#", "Asset Name", "Asset Code", "Service Vendor", "Service Date", "Cost (₹)", "Outcome", "Recorded By", "Actions"].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: "#64748b", background: "#f8fafc" }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedLogs.map((row, index) => (
                  <TableRow key={row.maintenanceId} sx={{ "&:hover": { bgcolor: "#f1f5f9" } }}>
                    <TableCell sx={{ fontSize: 11 }}>{page * showCount + index + 1}</TableCell>
                    <TableCell sx={{ fontSize: 11.5, fontWeight: 600 }}>{row.assetName}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>
                      <Chip label={row.assetCode} size="small" sx={{ height: 18, fontSize: 9.5, bgcolor: "#fee2e2", color: "#b91c1c" }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{row.vendorName || "—"}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{row.maintenanceDate}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>₹{row.cost?.toLocaleString("en-IN") || 0}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}><StatusBadge status={row.outcome} /></TableCell>
                    <TableCell sx={{ fontSize: 11, color: COLORS.textMuted }}>{row.loggedBy}</TableCell>
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
                ))}
              </TableBody>
            </Table>
            <TablePagination
              page={page}
              totalPages={Math.ceil(maintenanceLogs.length / showCount) || 1}
              onPageChange={setPage}
            />
          </Box>
        )}
      </TableCard>

      {/* Log Maintenance Modal */}
      <Dialog
        open={maintenanceOpen}
        onClose={() => !saving && setMaintenanceOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: premiumDialogPaperSx } }}
      >
        <DialogTitle sx={premiumDialogTitleSx}>
          <Typography fontWeight={800} fontSize="14px" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FaWrench size={14} style={{ color: COLORS.primary }} /> Log Repair / Maintenance
          </Typography>
          <IconButton size="small" onClick={() => !saving && setMaintenanceOpen(false)} sx={{ color: COLORS.textFaint }} disabled={saving}>
            <FaTimes size={13} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: "20px !important", pb: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Asset Search */}
          <Controller
            name="assetId"
            control={control}
            rules={{ required: "Selecting an asset is required" }}
            render={({ field, fieldState: { error } }) => (
              <FormControl fullWidth error={!!error} sx={{ mb: 1.5 }}>
                <Typography sx={{ fontSize: 11.5, color: COLORS.textMuted, mb: 0.5, fontWeight: 600 }}>Asset Under Repair *</Typography>
                <OutlinedInput
                  readOnly
                  size="small"
                  value={selectableAssets.find((a) => a.assetId === field.value)
                    ? `${selectableAssets.find((a) => a.assetId === field.value).assetName} (${selectableAssets.find((a) => a.assetId === field.value).assetCode})`
                    : ""}
                  placeholder="Select device under repair..."
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

          <FormTextField
            name="vendorName"
            control={control}
            rules={{ required: "Vendor name is required" }}
            label="Repair Vendor Name *"
            placeholder="e.g. Dell Authorized Service Center"
          />

          <Box sx={{ display: "flex", gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <FormTextField
                name="cost"
                control={control}
                rules={{ required: "Repair cost is required", min: { value: 0, message: "Cost cannot be negative" } }}
                label="Repair Cost (INR) *"
                type="number"
                placeholder="0"
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <FormSelect
                name="outcome"
                control={control}
                label="Repair Outcome *"
                options={OUTCOMES}
              />
            </Box>
          </Box>

          <FormTextField
            name="notes"
            control={control}
            label="Repair Actions Taken / Notes"
            placeholder="Describe the maintenance actions taken..."
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5 }}>
          <Button onClick={() => setMaintenanceOpen(false)} sx={outlinedBtnSx}>Cancel</Button>
          <Button onClick={handleSubmit(handleMaintenanceSubmit)} sx={primaryBtnSx}>Save Log</Button>
        </DialogActions>
      </Dialog>

      {/* View Detail Dialog */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: premiumDialogPaperSx } }}>
        <DialogTitle sx={premiumDialogTitleSx}>
          <Typography fontWeight={800} fontSize="14px" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FaWrench size={14} style={{ color: COLORS.primary }} /> Maintenance Details
          </Typography>
          <IconButton size="small" onClick={() => setViewOpen(false)} sx={{ color: COLORS.textFaint }}><FaTimes size={13} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: "20px !important", pb: 2.5 }}>
          {viewData && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <InfoRow label="Asset Name" value={viewData.assetName} />
              <InfoRow label="Asset Code" value={viewData.assetCode} />
              <InfoRow label="Service Vendor" value={viewData.vendorName} />
              <InfoRow label="Service Date" value={viewData.maintenanceDate} />
              <InfoRow label="Service Cost" value={`₹${viewData.cost?.toLocaleString("en-IN") || 0}`} />
              <InfoRow label="Outcome" value={<StatusBadge status={viewData.outcome} />} />
              <InfoRow label="Logged By" value={viewData.loggedBy} />
              {viewData.notes && (
                <Box sx={{ p: 1.25, border: "1px solid #e2e8f0", borderRadius: "8px", mt: 0.5, background: "#f8fafc" }}>
                  <Typography sx={{ fontSize: 10, color: COLORS.textMuted, mb: 0.25, fontWeight: 700 }}>Repair Description / Notes</Typography>
                  <Typography sx={{ fontSize: 10.5, color: COLORS.text, whiteSpace: "pre-line" }}>{viewData.notes}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          <Button onClick={() => setViewOpen(false)} sx={outlinedBtnSx}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Repair Log Entry"
        message="Are you sure you want to log this maintenance record? If outcome is FIXED or SCRAPPED, the asset status will automatically transition accordingly."
        confirmText="Confirm & Save"
        cancelText="Cancel"
        onConfirm={confirmMaintenanceSave}
        onCancel={() => setConfirmOpen(false)}
      />
    </Box>
  );
}
