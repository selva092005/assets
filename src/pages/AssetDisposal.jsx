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
  Tooltip,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { FormTextField, FormSelect } from "../components/FormFields";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as ReTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { FaTrash, FaTimes, FaRecycle, FaSearch, FaEye, FaFileExcel, FaDownload, FaCoins, FaExclamationTriangle, FaPlus, FaChartPie, FaChartBar, FaFileExport } from "react-icons/fa";
import { MdRefresh } from "react-icons/md";
import { getUsers } from "../services/users_service";
import toast from "../utils/toast.jsx";

import { disposeAsset, getAllDisposals, getDisposalById } from "../services/disposal_service";
import { exportDisposals } from "../services/report_service";
import { getAssets, getImageUrl } from "../services/assets_service";
import PageHeader from "../components/common/PageHeader";
import TableCard from "../components/common/TableCard";
import TablePagination from "../components/common/TablePagination";
import ConfirmDialog from "../components/common/ConfirmDialog";
import StatCard from "../components/common/StatCard";
import PremiumCard from "../components/common/PremiumCard";
import { COLORS, outlinedBtnSx, primaryBtnSx, selectSx, premiumDialogPaperSx, premiumDialogTitleSx, denseCellSx } from "../theme/tokens";
import { required, isValidDate, isNotFutureDate, extractFieldErrors } from "../utils/validate";

const DISPOSAL_METHODS = ["SOLD", "SCRAPPED", "DONATED", "DAMAGED"];

import StatusBadge from "../components/common/StatusBadge";
import EmptyState from "../components/common/EmptyState";
import CustomTooltip from "../components/common/CustomTooltip";

const CHART_COLORS = ["#2563eb", "#10b981", "#d97706", "#f43f5e", "#8b5cf6", "#0891b2", "#f97316"];

export default function AssetDisposalPage() {
  const { userRole, userName } = useSelector((s) => s.auth);
  const canDispose = userRole === "admin"; // admin only
  const canView = userRole === "admin"; // admin only
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Query Client ───────────────────────────────────────────────────────────
  const queryClient = useQueryClient();

  // Search & Filters State
  const [searchInput, setSearchInput] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [page, setPage] = useState(0);
  const [showCount, setShowCount] = useState(10);

  // ── Query Fetcher ──────────────────────────────────────────────────────────
  const { data: disposals = [], isLoading: loading } = useQuery({
    queryKey: ["disposals", searchInput, methodFilter],
    queryFn: async () => {
      const params = {};
      if (searchInput.trim()) params.search = searchInput.trim();
      if (methodFilter) params.method = methodFilter;
      const res = await getAllDisposals(params);
      return extractList(res);
    },
    placeholderData: keepPreviousData,
  });

  const { data: allAssets = [] } = useQuery({
    queryKey: ["assets", "simple"],
    queryFn: async () => {
      const res = await getAssets({ page: 0, size: 200 });
      return extractList(res?.data ?? res);
    },
    enabled: canDispose,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users", "simple"],
    queryFn: async () => {
      const res = await getUsers({ page: 0, size: 200 });
      return extractList(res);
    },
    enabled: canDispose,
  });

  const [userSearch, setUserSearch] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [assetSearch, setAssetSearch] = useState("");
  const [assetAnchor, setAssetAnchor] = useState(null);

  // View Details Modal State
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Export excel state
  const [exporting, setExporting] = useState(false);

  // Dispose modal
  const [disposeOpen, setDisposeOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { control, handleSubmit, reset, setValue, setError, watch } = useForm({
    defaultValues: {
      assetId: "",
      disposalMethod: "",
      reason: "",
      disposedBy: userName || "",
      disposalDate: today(),
      disposalValue: "",
    }
  });

  const formAssetId = watch("assetId");

  const formDataRef = useRef(null);

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);

  const preselectedAssetId = Number(searchParams.get("assetId"));

  const disposableAssets = allAssets.filter(
    (a) => a.status === "AVAILABLE" || a.status === "DAMAGED" || a.status === "UNDER_MAINTENANCE" || a.assetId === formAssetId || a.assetId === preselectedAssetId
  );

  const adminUsers = allUsers.filter((u) => u.userRole === "ADMIN" || u.userRole === "MANAGER").length > 0
    ? allUsers.filter((u) => u.userRole === "ADMIN" || u.userRole === "MANAGER")
    : allUsers;

  // ── KPI Calculations ──────────────────────────────────────────────────────
  const totalRecords = disposals.length;
  const totalRecovered = disposals.reduce((sum, d) => sum + (d.disposalValue || 0), 0);
  const scrapSoldRecovery = disposals
    .filter((d) => d.disposalMethod === "SOLD" || d.disposalMethod === "SCRAPPED")
    .reduce((sum, d) => sum + (d.disposalValue || 0), 0);
  const damagedCount = disposals.filter((d) => d.disposalMethod === "DAMAGED").length;

  // ── Filtered Disposals List ───────────────────────────────────────────────
  const filteredDisposals = disposals;
  const paginatedDisposals = filteredDisposals.slice(page * showCount, (page + 1) * showCount);

  // ── Chart Calculations ────────────────────────────────────────────────────
  const methodCounts = disposals.reduce((acc, d) => {
    const m = d.disposalMethod || "OTHER";
    acc[m] = (acc[m] || 0) + 1;
    return acc;
  }, {});

  const methodChartData = Object.entries(methodCounts).map(([name, value]) => ({
    name: name.toUpperCase(),
    value
  }));

  const methodValueSum = disposals.reduce((acc, d) => {
    const m = d.disposalMethod || "OTHER";
    acc[m] = (acc[m] || 0) + (d.disposalValue || 0);
    return acc;
  }, {});

  const valueChartData = Object.entries(methodValueSum).map(([name, value]) => ({
    name: name.toUpperCase(),
    value
  }));

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
    setPage(0);
  };

  const handleMethodChange = (e) => {
    setMethodFilter(e.target.value);
    setPage(0);
  };

  const clearFilters = () => {
    setSearchInput("");
    setMethodFilter("");
    setPage(0);
  };

  // ── Open dispose modal ────────────────────────────────────────────────────
  const openDispose = (preselectedAssetId = null) => {
    setUserSearch("");
    setAssetSearch("");
    reset({
      assetId: preselectedAssetId || "",
      disposalMethod: "",
      reason: "",
      disposedBy: userName || "",
      disposalDate: today(),
      disposalValue: "",
    });
    setDisposeOpen(true);
  };

  useEffect(() => {
    const assetIdParam = searchParams.get("assetId");
    if (assetIdParam && canDispose) {
      openDispose(Number(assetIdParam));
      setSearchParams({});
    }
  }, [searchParams, canDispose]);

  // ── Submit disposal ───────────────────────────────────────────────────────
  const handleDispose = (data) => {
    formDataRef.current = data;
    setConfirmOpen(true);
  };

  const confirmDispose = async () => {
    const data = formDataRef.current;
    if (!data) return;
    setSaving(true);
    setConfirmOpen(false);
    try {
      await disposeAsset({
        assetId: Number(data.assetId),
        disposalDate: data.disposalDate,
        disposalMethod: data.disposalMethod,
        reason: data.reason,
        disposedBy: data.disposedBy || userName,
        disposalValue: data.disposalValue ? Number(data.disposalValue) : null,
      });
      toast.success("Asset disposed successfully");
      setDisposeOpen(false);
      queryClient.invalidateQueries({ queryKey: ["disposals"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    } catch (err) {
      if (err.response?.status === 400) {
        const fe = extractFieldErrors(err);
        if (Object.keys(fe).length > 0) {
          Object.keys(fe).forEach((key) => {
            setError(key, { type: "server", message: fe[key] });
          });
          toast.error("Please fix the highlighted fields");
        } else {
          toast.error(err.response?.data?.message || "Disposal failed");
        }
      } else {
        toast.error(err.response?.data?.message || "Disposal failed");
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Excel Export ──────────────────────────────────────────────────────────
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await exportDisposals();
      toast.success("Export downloaded successfully");
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // ── View Details Modal ────────────────────────────────────────────────────
  const openViewDetails = async (id) => {
    setViewOpen(true);
    setViewLoading(true);
    setViewData(null);
    try {
      const res = await getDisposalById(id);
      setViewData(res?.data || res);
    } catch {
      toast.error("Failed to fetch disposal details");
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };



  // Block non-authorised users
  if (!canView) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Typography fontSize={15} color={COLORS.textMuted}>You do not have permission to view this page.</Typography>
      </Box>
    );
  }


  return (
    <Box sx={{ p: 0 }}>

      <PageHeader
        title="Asset Disposal"
        subtitle="Archive and record retired, sold or decommissioned organizational assets"
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

            <Button
              variant="outlined"
              startIcon={exporting ? <CircularProgress size={11} color="inherit" /> : <FaFileExport size={11} />}
              onClick={handleExportExcel}
              disabled={exporting}
              sx={outlinedBtnSx}
            >
              Export
            </Button>
            {canDispose && (
              <Button
                variant="contained"
                startIcon={<FaTrash size={11} />}
                onClick={openDispose}
                sx={{ ...primaryBtnSx, background: "#c62828", borderColor: "#b71c1c", "&:hover": { background: "#b71c1c" } }}
              >
                Dispose Asset
              </Button>
            )}
          </Box>
        }
      />
      {/* ── KPI Cards Row ── */}
      <Box sx={{ display: "flex", gap: 1.5, mb: 2.5, flexWrap: "wrap" }}>
        <StatCard label="Total Retired" value={totalRecords} icon={<FaRecycle size={15} />} iconBg="#e8eaf6" iconColor="#3949ab" onClick={() => { setMethodFilter(""); setPage(0); }} />
        <StatCard label="Capital Recovered" value={`₹${totalRecovered.toLocaleString("en-IN")}`} icon={<FaCoins size={15} />} iconBg="#ecfdf5" iconColor="#10b981" />
        <StatCard label="Recycled/Sold Value" value={`₹${scrapSoldRecovery.toLocaleString("en-IN")}`} icon={<FaFileExcel size={15} />} iconBg="#eff6ff" iconColor="#2563eb" />
        <StatCard label="Total Damaged (Loss)" value={damagedCount} icon={<FaExclamationTriangle size={15} />} iconBg="#ffe4e6" iconColor="#f43f5e" onClick={() => { setMethodFilter("DAMAGED"); setPage(0); }} />
      </Box>

      {/* ── Search & Filter Controls ── */}
      <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Search asset, code, disposer or reason…"
          value={searchInput}
          onChange={handleSearchChange}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><FaSearch size={11} color="#aaa" /></InputAdornment> } }}
          sx={{ minWidth: 280, "& .MuiOutlinedInput-root": { borderRadius: "6px", fontSize: 11.5, height: 30 } }}
        />
        <Select
          size="small"
          value={methodFilter}
          onChange={handleMethodChange}
          displayEmpty
          sx={{ ...selectSx, minWidth: 150 }}
        >
          <MenuItem value="">All Methods</MenuItem>
          {DISPOSAL_METHODS.map((m) => (
            <MenuItem key={m} value={m} sx={{ fontSize: 11.5 }}>{m}</MenuItem>
          ))}
        </Select>

        {/* Filter reset button */}
        <Tooltip title="Reset filters">
          <IconButton
            onClick={clearFilters}
            aria-label="Reset"
            sx={{
              border: "1px solid #e0e0e0",
              borderRadius: "6px",
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 0,
              background: "#fff",
              color: "#757575",
              "&:hover": { background: "#f5f5f5", borderColor: "#bbb", color: COLORS.primary },
            }}
          >
            <MdRefresh size={14} />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ mb: 2.5 }}>
        <TableCard>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
          ) : filteredDisposals.length === 0 ? (
            <EmptyState icon={FaRecycle} label="No disposal records found." />
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 700, tableLayout: "auto", borderCollapse: "collapse" }}>
                <TableHead>
                  <TableRow>
                    {["#", "Asset", "Code", "Method", "Disposal Date", "Disposed By", "Reason", "Value (₹)", "Actions"].map((h) => (
                      <TableCell key={h} sx={{
                        fontWeight: 700,
                        color: "#64748b",
                        whiteSpace: "nowrap",
                        background: "#f8fafc",
                        borderBottom: "2px solid #e2e8f0",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        fontSize: 11
                      }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedDisposals.map((row, i) => (
                    <TableRow key={row.disposalId} sx={{ borderLeft: "3px solid transparent", transition: "all 180ms ease", "&:last-child td": { border: 0 }, "&:hover": { borderLeft: "3px solid #3b82f6", "& td": { background: "#f0f7ff" } }, "& td": { background: i % 2 === 0 ? "#fff" : "#f8faff", borderBottom: "1px solid #f1f5f9" } }}>
                      <TableCell sx={{ verticalAlign: "middle", color: COLORS.textFaint }}>{page * showCount + i + 1}</TableCell>
                      <TableCell sx={{ fontSize: 11, fontWeight: 600, color: "#1e1b4b", verticalAlign: "middle", borderBottom: "1px solid #f0f0f8" }}>{row.assetName}</TableCell>
                      <TableCell sx={{ verticalAlign: "middle", borderBottom: "1px solid #f0f0f8" }}>
                        <Chip label={row.assetCode || "—"} size="small" sx={{ fontSize: 9.5, height: 18, background: "#ffebee", color: "#c62828", borderRadius: "5px", "& .MuiChip-label": { px: "6px" } }} />
                      </TableCell>
                      <TableCell sx={{ verticalAlign: "middle", borderBottom: "1px solid #f0f0f8" }}><StatusBadge status={row.disposalMethod} /></TableCell>
                      <TableCell sx={{ fontSize: 11, verticalAlign: "middle", borderBottom: "1px solid #f0f0f8" }}>{fmt(row.disposalDate)}</TableCell>
                      <TableCell sx={{ fontSize: 11, color: COLORS.textMuted, verticalAlign: "middle", borderBottom: "1px solid #f0f0f8" }}>{row.disposedBy}</TableCell>
                      <TableCell sx={{ fontSize: 11, color: COLORS.textMuted, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", verticalAlign: "middle", borderBottom: "1px solid #f0f0f8" }}>{row.reason}</TableCell>
                      <TableCell sx={{ fontSize: 11, verticalAlign: "middle", borderBottom: "1px solid #f0f0f8" }}>
                        {row.disposalValue != null ? `₹${row.disposalValue.toLocaleString("en-IN")}` : "—"}
                      </TableCell>
                      <TableCell sx={{ verticalAlign: "middle", borderBottom: "1px solid #f0f0f8" }}>
                        <Tooltip title="View Details" arrow>
                          <IconButton
                            size="small"
                            onClick={() => openViewDetails(row.disposalId)}
                            sx={{
                              width: 22,
                              height: 22,
                              color: "#3b82f6",
                              background: "transparent",
                              borderRadius: "4px",
                              transition: "all 0.15s ease",
                              p: 0,
                              "&:hover": {
                                background: "rgba(59, 130, 246, 0.08)",
                                color: "#2563eb",
                              }
                            }}
                          >
                            <FaEye size={11} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
          {!loading && filteredDisposals.length > 0 && (
            <TablePagination
              page={page}
              totalPages={Math.ceil(filteredDisposals.length / showCount) || 1}
              onPageChange={(pg) => setPage(pg)}
            />
          )}
        </TableCard>
      </Box>

      {/* ── Visual Analytics Panel ── */}
      {disposals.length > 0 && (
        <Box sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
          gap: 2,
          mb: 2.5
        }}>
          {/* Chart 1: Methods Distribution */}
          <PremiumCard title="Disposal Methods breakdown" icon={<FaChartPie />} subtitle="Distribution of retired assets">
            <Box sx={{ width: "100%", height: 150, mt: 0.5, display: "flex", justifyContent: "center", alignItems: "center" }}>
              <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={methodChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={36}
                      outerRadius={50}
                      paddingAngle={3}
                      dataKey="value"
                      animationDuration={1500}
                    >
                      {methodChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="#ffffff" strokeWidth={1} />
                      ))}
                    </Pie>
                    <ReTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
                  <Typography sx={{ fontSize: "15px", fontWeight: 950, color: "#0f172a", lineHeight: 1 }}>
                    {totalRecords}
                  </Typography>
                  <Typography sx={{ fontSize: "7px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", mt: 0.1 }}>
                    Retired
                  </Typography>
                </Box>
              </Box>

              {/* Custom Legend */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, pl: 1, minWidth: 100 }}>
                {methodChartData.map((item, index) => (
                  <Box key={item.name} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: CHART_COLORS[index % CHART_COLORS.length] }} />
                    <Typography sx={{ fontSize: "9.5px", fontWeight: 750, color: "#475569" }}>
                      {item.name}: {item.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </PremiumCard>

          {/* Chart 2: Capital Recovered by Method */}
          <PremiumCard title="Capital Recovered by Method" icon={<FaChartBar />} subtitle="Total recovery amount per disposal method">
            <Box sx={{ width: "100%", height: 150, mt: 0.5 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={valueChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#64748b", fontWeight: 750 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#64748b", fontWeight: 750 }} tickLine={false} axisLine={false} />
                  <ReTooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="value"
                    fill="#10b981"
                    radius={[3, 3, 0, 0]}
                    barSize={20}
                    animationDuration={1500}
                  >
                    {valueChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 1) % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </PremiumCard>
        </Box>
      )}

      {/* ── View Details Modal ── */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: premiumDialogPaperSx } }}>
        <DialogTitle sx={premiumDialogTitleSx}>
          <span>Disposal Details</span>
          <IconButton size="small" onClick={() => setViewOpen(false)} sx={{ color: COLORS.textFaint }}><FaTimes size={13} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: "18px !important", pb: 2 }}>
          {viewLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={24} /></Box>
          ) : viewData ? (
            <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
              {/* Left Mini Panel */}
              <Box sx={{
                width: { xs: "100%", sm: 140 },
                flexShrink: 0,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                p: 1.5,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                justifyContent: "center",
                height: "fit-content"
              }}>
                <Box sx={{
                  width: 48, height: 48, borderRadius: "4px",
                  border: "1px solid " + COLORS.borderLight,
                  bgcolor: "#fcfcfd",
                  display: "flex", alignItems: "center", justifyContent: "center", mb: 1,
                  overflow: "hidden"
                }}>
                  {viewData.assetImagePath ? (
                    <img src={getImageUrl(viewData.assetImagePath)} alt="Asset" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <FaTrash size={18} color="#dc2626" />
                  )}
                </Box>
                <Typography sx={{ fontSize: "11px", fontWeight: 800, color: "#1e293b", mb: 0.5 }}>
                  {viewData.assetName}
                </Typography>
                <StatusBadge status={viewData.disposalMethod} />
              </Box>

              {/* Right Mini Specifications Panel */}
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 9.5, fontWeight: 800, color: COLORS.primary, mb: 0.75, textTransform: "uppercase", letterSpacing: "0.05em" }}>Disposal Information</Typography>
                <Table size="small" sx={{ mb: 1.5, border: "1px solid " + COLORS.borderLight }}>
                  <TableBody>
                    <TableRow sx={{ background: "#fcfcfd" }}>
                      <TableCell sx={{ ...denseCellSx, fontWeight: 700, color: COLORS.textMuted, width: "30%" }}>Asset Code</TableCell>
                      <TableCell sx={denseCellSx}>{viewData.assetCode || "—"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ ...denseCellSx, fontWeight: 700, color: COLORS.textMuted }}>Method</TableCell>
                      <TableCell sx={denseCellSx}>{viewData.disposalMethod}</TableCell>
                    </TableRow>
                    <TableRow sx={{ background: "#fcfcfd" }}>
                      <TableCell sx={{ ...denseCellSx, fontWeight: 700, color: COLORS.textMuted }}>Disposed By</TableCell>
                      <TableCell sx={denseCellSx}>{viewData.disposedBy}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ ...denseCellSx, fontWeight: 700, color: COLORS.textMuted }}>Recovered</TableCell>
                      <TableCell sx={denseCellSx}>{viewData.disposalValue != null ? `₹${viewData.disposalValue.toLocaleString("en-IN")}` : "—"}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <Typography sx={{ fontSize: 9.5, fontWeight: 800, color: COLORS.primary, mb: 0.75, textTransform: "uppercase", letterSpacing: "0.05em" }}>Timeline Details</Typography>
                <Table size="small" sx={{ mb: 1.5, border: "1px solid " + COLORS.borderLight }}>
                  <TableBody>
                    <TableRow sx={{ background: "#fcfcfd" }}>
                      <TableCell sx={{ ...denseCellSx, fontWeight: 700, color: COLORS.textMuted, width: "30%" }}>Disposal Date</TableCell>
                      <TableCell sx={denseCellSx}>{fmt(viewData.disposalDate)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                {viewData.reason && (
                  <>
                    <Typography sx={{ fontSize: 9.5, fontWeight: 800, color: COLORS.primary, mb: 0.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Reason / Remarks</Typography>
                    <Box sx={{ p: 1, border: "1px solid " + COLORS.borderLight, borderRadius: "3px", background: "#fcfcfd" }}>
                      <Typography sx={{ fontSize: 10, color: COLORS.text, whiteSpace: "pre-line" }}>{viewData.reason}</Typography>
                    </Box>
                  </>
                )}


              </Box>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, borderTop: "1px solid " + COLORS.borderLight, pt: 1.5 }}>
          <Button onClick={() => setViewOpen(false)} sx={outlinedBtnSx}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── Dispose Modal ──────────────────────────────────────────────── */}
      <Dialog open={disposeOpen} onClose={() => { if (!saving) { setDisposeOpen(false); reset(); } }} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: "12px" } } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
          <Typography fontWeight={700} fontSize={16}>Dispose Asset</Typography>
          <IconButton size="small" onClick={() => { if (!saving) { setDisposeOpen(false); reset(); } }}><FaTimes size={14} /></IconButton>
        </DialogTitle>

        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}>

          {/* Warning banner */}
          <Box sx={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: "8px", p: 1.5 }}>
            <Typography fontSize={12} color="#e65100" fontWeight={500}>
              ⚠ Disposed assets cannot be allocated. This action marks the asset as permanently retired.
            </Typography>
          </Box>

          {/* Asset searchable dropdown */}
          <Controller
            name="assetId"
            control={control}
            rules={{ required: "Select an asset to dispose" }}
            render={({ field, fieldState: { error } }) => (
              <FormControl fullWidth size="small" error={!!error}>
                <InputLabel shrink sx={{ fontSize: 13, ...(error ? { color: "#c62828 !important" } : {}) }}>Asset *</InputLabel>
                <OutlinedInput
                  readOnly
                  notched
                  label="Asset *"
                  size="small"
                  value={disposableAssets.find((a) => a.assetId === field.value)
                    ? `${disposableAssets.find((a) => a.assetId === field.value).assetName}${disposableAssets.find((a) => a.assetId === field.value).assetCode ? ` (${disposableAssets.find((a) => a.assetId === field.value).assetCode})` : ""}`
                    : ""}
                  placeholder="Select asset..."
                  onClick={(e) => setAssetAnchor(e.currentTarget)}
                  error={!!error}
                  endAdornment={<InputAdornment position="end"><Typography fontSize={12} color="#aaa">▾</Typography></InputAdornment>}
                  sx={{ fontSize: 13, borderRadius: "8px", cursor: "pointer", caretColor: "transparent" }}
                />
                {error && <Typography color="error" sx={{ fontSize: 11, mt: 0.5 }}>{error.message}</Typography>}
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
                      const filtered = disposableAssets.filter((a) =>
                        !q || a.assetName?.toLowerCase().includes(q) || a.assetCode?.toLowerCase().includes(q)
                      );
                      return filtered.length > 0 ? filtered.map((a) => (
                        <ListItemButton
                          key={a.assetId}
                          selected={field.value === a.assetId}
                          onClick={() => { field.onChange(a.assetId); setAssetAnchor(null); setAssetSearch(""); }}
                          sx={{ py: 0.5 }}
                        >
                          <ListItemText
                            primary={<Typography sx={{ fontSize: 13 }}>{a.assetName}</Typography>}
                            secondary={<Typography sx={{ fontSize: 11, color: "#64748b" }}>{a.assetCode || ""}</Typography>}
                          />
                        </ListItemButton>
                      )) : (
                        <ListItemButton disabled>
                          <ListItemText primary={<Typography sx={{ fontSize: 13 }}>No assets found</Typography>} />
                        </ListItemButton>
                      );
                    })()}
                  </List>
                </Popover>
              </FormControl>
            )}
          />

          {/* Method select */}
          <FormSelect
            name="disposalMethod"
            control={control}
            rules={{ required: "Disposal method is required" }}
            label="Disposal Method *"
            disabled={saving}
          >
            {DISPOSAL_METHODS.map((m) => (
              <MenuItem key={m} value={m} sx={{ fontSize: 13 }}>{m}</MenuItem>
            ))}
          </FormSelect>

          <FormTextField
            name="reason"
            control={control}
            rules={{
              required: "Disposal reason is required",
              minLength: { value: 5, message: "Reason must be at least 5 characters" }
            }}
            label="Reason *"
            placeholder="Disposal reason..."
            multiline
            rows={2}
            disabled={saving}
            slotProps={{ htmlInput: { maxLength: 250 } }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
          />

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Controller
              name="disposedBy"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth size="small">
                  <InputLabel shrink sx={{ fontSize: 13 }}>Disposed By</InputLabel>
                  <OutlinedInput
                    disabled
                    notched
                    label="Disposed By"
                    size="small"
                    value={field.value || userName || ""}
                    sx={{
                      fontSize: 13,
                      borderRadius: "8px",
                      bgcolor: "#f8fafc",
                      "& .MuiOutlinedInput-input.Mui-disabled": {
                        WebkitTextFillColor: "#475569",
                      }
                    }}
                  />
                </FormControl>
              )}
            />
            <FormTextField
              name="disposalDate"
              control={control}
              rules={{
                required: "Disposal date is required",
                validate: (val) => isNotFutureDate(val) || "Disposal date cannot be in the future"
              }}
              label="Disposal Date *"
              type="date"
              disabled={saving}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
            />
          </Box>

          <FormTextField
            name="disposalValue"
            control={control}
            rules={{
              min: { value: 0, message: "Value must be zero or positive" }
            }}
            label="Disposal Value (optional)"
            type="number"
            disabled={saving}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Typography fontSize={13}>₹</Typography></InputAdornment> } }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => { setDisposeOpen(false); reset(); }} sx={outlinedBtnSx}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit(handleDispose)}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={12} color="inherit" /> : <FaTrash size={11} />}
            sx={{ ...primaryBtnSx, background: "#c62828", borderColor: "#b71c1c", "&:hover": { background: "#b71c1c" } }}
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
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (res?.data?.content) return res.data.content;
  if (res?.content) return res.content;
  return [];
}

function defaultForm() {
  return {
    assetId: "",
    disposalMethod: "",
    reason: "",
    disposedBy: "",
    disposalDate: today(),
    disposalValue: "",
  };
}