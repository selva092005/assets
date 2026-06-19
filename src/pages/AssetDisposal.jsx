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
import ActionBtn from "../components/common/ActionBtn";
import StatCard from "../components/common/StatCard";
import PremiumCard from "../components/common/PremiumCard";
import PremiumPieChart from "../components/common/PremiumPieChart";
import ErrorState from "../components/common/ErrorState";
import SkeletonLoader from "../components/common/SkeletonLoader";
import { COLORS, outlinedBtnSx, primaryBtnSx, inputSx, selectSx, premiumDialogPaperSx, premiumDialogTitleSx, denseCellSx, searchFieldSx, resetBtnSx } from "../theme/tokens";
import { required, isValidDate, isNotFutureDate, extractFieldErrors } from "../utils/validate";

const DISPOSAL_METHODS = ["SOLD", "SCRAPPED", "DONATED", "DAMAGED"];

import StatusBadge from "../components/common/StatusBadge";
import EmptyState from "../components/common/EmptyState";
import CustomTooltip from "../components/common/CustomTooltip";
import InfoRow from "../components/common/InfoRow";

const CHART_COLORS = ["#2563eb", "#10b981", "#d97706", "#f43f5e", "#8b5cf6", "#0891b2", "#f97316"];

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

export default function AssetDisposalPage() {
  const { userRole, userName } = useSelector((s) => s.auth);
  const canDispose = userRole === "admin"; // admin only
  const canView = userRole === "admin"; // admin only
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Query Client ───────────────────────────────────────────────────────────
  const queryClient = useQueryClient();

  // Search & Filters State
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 600);
  const [methodFilter, setMethodFilter] = useState("");
  const [page, setPage] = useState(0);
  const [showCount, setShowCount] = useState(10);

  // ── Query Fetcher ──────────────────────────────────────────────────────────
  const { data: disposals = [], isLoading: loading, isError, error, refetch } = useQuery({
    queryKey: ["disposals", debouncedSearch, methodFilter],
    queryFn: async () => {
      const params = {};
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
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
  const [activeMethodIdx, setActiveMethodIdx] = useState(null);
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
  const formDisposalDate = watch("disposalDate");

  const formDataRef = useRef(null);

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);

  const preselectedAssetId = Number(searchParams.get("assetId"));

  const disposableAssets = allAssets.filter(
    (a) => a.status === "AVAILABLE" || a.status === "DAMAGED" || a.assetId === formAssetId || a.assetId === preselectedAssetId
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


  if (loading) {
    return <SkeletonLoader variant="list" statCount={4} columnCount={9} />;
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

      <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Search asset, code, disposer or reason…"
          value={searchInput}
          onChange={handleSearchChange}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><FaSearch size={11} color="#aaa" /></InputAdornment> } }}
          sx={searchFieldSx(280, 340)}
        />
        <Select
          size="small"
          value={methodFilter}
          onChange={handleMethodChange}
          displayEmpty
          sx={{ ...selectSx, minWidth: 150 }}
        >
          <MenuItem value="">All</MenuItem>
          {DISPOSAL_METHODS.map((m) => (
            <MenuItem key={m} value={m} sx={{ fontSize: 11.5 }}>{m}</MenuItem>
          ))}
        </Select>

        {/* Filter reset button */}
        <Tooltip title="Reset filters">
          <IconButton
            onClick={clearFilters}
            aria-label="Reset"
            sx={resetBtnSx}
          >
            <MdRefresh size={14} />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ mb: 2.5 }}>
        <TableCard>
          {isError ? (
            <ErrorState message={error?.message || error?.response?.data?.message} onRetry={refetch} />
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
                        <ActionBtn
                          title="View Details"
                          color="#3b82f6"
                          hoverBg="rgba(59, 130, 246, 0.08)"
                          onClick={() => openViewDetails(row.disposalId)}
                          sx={{ border: "none", background: "transparent" }}
                        >
                          <FaEye size={11} />
                        </ActionBtn>
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
            <Box sx={{ width: "100%", height: 150, mt: 0.5, display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              {/* Left: Solid Pie Chart */}
              <Box sx={{ width: "52%", height: "100%", position: "relative" }}>
                <PremiumPieChart
                  data={methodChartData}
                  colors={CHART_COLORS}
                  isDonut={false}
                  paddingAngle={2}
                  cornerRadius={4}
                  activeIndex={activeMethodIdx}
                  setActiveIndex={setActiveMethodIdx}
                />
              </Box>

              {/* Right: Custom Premium Legend */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, width: "48%", pr: 0.5, maxHeight: 140, overflowY: "auto" }}>
                {methodChartData.length > 0 ? (
                  methodChartData.map((item, index) => {
                    const total = methodChartData.reduce((sum, current) => sum + current.value, 0);
                    const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
                    const isActive = activeMethodIdx === index;
                    return (
                      <Box
                        key={item.name}
                        onMouseEnter={() => setActiveMethodIdx(index)}
                        onMouseLeave={() => setActiveMethodIdx(null)}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.75,
                          p: "4px 8px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          transition: "all 150ms ease",
                          bgcolor: isActive ? "rgba(79, 70, 229, 0.06)" : "transparent",
                          border: isActive ? "1px solid rgba(79, 70, 229, 0.15)" : "1px solid transparent"
                        }}
                      >
                        <Box sx={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          bgcolor: CHART_COLORS[index % CHART_COLORS.length],
                          boxShadow: isActive ? `0 0 6px ${CHART_COLORS[index % CHART_COLORS.length]}` : "none",
                          flexShrink: 0
                        }} />
                        <Box sx={{ minWidth: 0, flex: 1, lineHeight: 1.15 }}>
                          <Typography noWrap sx={{ fontSize: "11px", fontWeight: isActive ? 800 : 700, color: isActive ? "#0f172a" : "#475569" }}>
                            {item.name}
                          </Typography>
                          <Typography sx={{ fontSize: "9px", fontWeight: 600, color: "#94a3b8" }}>
                            {item.value} ({percent}%)
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })
                ) : (
                  <Typography sx={{ fontSize: "9.5px", color: "#64748b", py: 2, textAlign: "center" }}>
                    No retired records
                  </Typography>
                )}
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
          <Typography fontWeight={800} fontSize="14px" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FaTrash size={13} style={{ color: COLORS.primary }} /> Disposal Details
          </Typography>
          <IconButton size="small" onClick={() => setViewOpen(false)} sx={{ color: COLORS.textFaint }}><FaTimes size={13} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: "20px !important", pb: 2.5 }}>
          {viewLoading ? (
            <SkeletonLoader variant="detail" />
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
                <Typography fontSize={11.5} fontWeight={700} color="#1e293b" sx={{ lineClamp: 2, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {viewData.assetName}
                </Typography>
                <Typography fontSize={10} color="#64748b" sx={{ mt: 0.5 }}>
                  {viewData.assetCode || "No Code"}
                </Typography>
              </Box>

              {/* Right Mini Specifications Panel */}
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 9.5, fontWeight: 800, color: COLORS.primary, mb: 0.75, textTransform: "uppercase", letterSpacing: "0.05em" }}>Disposal Information</Typography>
                <Table size="small" sx={{ mb: 1.5, border: "1px solid " + COLORS.borderLight }}>
                  <TableBody>
                    <InfoRow label="Asset Code" value={viewData.assetCode || "—"} bg />
                    <InfoRow label="Method" value={viewData.disposalMethod} />
                    <InfoRow label="Disposed By" value={viewData.disposedBy} bg />
                    <InfoRow label="Recovered" value={viewData.disposalValue != null ? `₹${viewData.disposalValue.toLocaleString("en-IN")}` : "—"} />
                  </TableBody>
                </Table>

                {viewData.purchaseCost != null && (
                  <>
                    <Typography sx={{ fontSize: 9.5, fontWeight: 800, color: COLORS.primary, mb: 0.75, textTransform: "uppercase", letterSpacing: "0.05em" }}>Financial History</Typography>
                    <Table size="small" sx={{ mb: 1.5, border: "1px solid " + COLORS.borderLight }}>
                      <TableBody>
                        <InfoRow label="Purchase Cost" value={`₹${viewData.purchaseCost.toLocaleString("en-IN")}`} bg />
                        <InfoRow label="Purchase Date" value={fmt(viewData.purchaseDate)} />
                        {(() => {
                          const depValue = calculateDepreciatedValue(viewData.purchaseCost, viewData.purchaseDate, viewData.disposalDate);
                          if (depValue == null) return null;
                          const netGainLoss = (viewData.disposalValue || 0) - depValue;
                          return (
                            <>
                              <InfoRow label="Book Value" value={`₹${depValue.toLocaleString("en-IN")}`} bg />
                              <InfoRow
                                label="Net Gain/Loss"
                                value={
                                  <span style={{ color: netGainLoss >= 0 ? "#15803d" : "#b91c1c", fontWeight: 700 }}>
                                    {netGainLoss >= 0
                                      ? `₹${netGainLoss.toLocaleString("en-IN")} (Gain)`
                                      : `₹${Math.abs(netGainLoss).toLocaleString("en-IN")} (Loss)`}
                                  </span>
                                }
                              />
                            </>
                          );
                        })()}
                      </TableBody>
                    </Table>
                  </>
                )}

                <Typography sx={{ fontSize: 9.5, fontWeight: 800, color: COLORS.primary, mb: 0.75, textTransform: "uppercase", letterSpacing: "0.05em" }}>Timeline Details</Typography>
                <Table size="small" sx={{ mb: 1.5, border: "1px solid " + COLORS.borderLight }}>
                  <TableBody>
                    <InfoRow label="Disposal Date" value={fmt(viewData.disposalDate)} bg />
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
      <Dialog
        open={disposeOpen}
        onClose={() => { if (!saving) { setDisposeOpen(false); reset(); } }}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: premiumDialogPaperSx } }}
      >
        <DialogTitle sx={premiumDialogTitleSx}>
          <Typography fontWeight={800} fontSize="14px" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FaTrash size={13} style={{ color: COLORS.primary }} /> Dispose Asset
          </Typography>
          <IconButton size="small" onClick={() => { if (!saving) { setDisposeOpen(false); reset(); } }} sx={{ color: COLORS.textFaint }}><FaTimes size={13} /></IconButton>
        </DialogTitle>

        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "20px !important", pb: 2.5 }}>

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
              <FormControl fullWidth error={!!error} sx={{ mb: 1.5 }}>
                <Typography sx={{ fontSize: 11.5, color: COLORS.textMuted, mb: 0.5, fontWeight: 600 }}>
                  Asset *
                </Typography>
                <OutlinedInput
                  readOnly
                  size="small"
                  value={disposableAssets.find((a) => a.assetId === field.value)
                    ? `${disposableAssets.find((a) => a.assetId === field.value).assetName}${disposableAssets.find((a) => a.assetId === field.value).assetCode ? ` (${disposableAssets.find((a) => a.assetId === field.value).assetCode})` : ""}`
                    : ""}
                  placeholder="Select asset..."
                  onClick={(e) => setAssetAnchor(e.currentTarget)}
                  error={!!error}
                  endAdornment={<InputAdornment position="end"><Typography fontSize={12} color="#aaa">▾</Typography></InputAdornment>}
                  sx={{
                    background: "#ffffff",
                    borderRadius: "6px",
                    height: 30,
                    fontSize: 11.5,
                    cursor: "pointer",
                    caretColor: "transparent",
                    transition: "all 100ms ease",
                    "& .MuiOutlinedInput-input": {
                      py: "4px !important",
                      px: "8px !important",
                      cursor: "pointer"
                    },
                    "& fieldset": { borderColor: "#cbd5e1", transition: "all 100ms ease" },
                    "&:hover fieldset": { borderColor: "#000000" },
                    "&.Mui-focused fieldset": { borderColor: "#000000", borderWidth: "1px !important" },
                    "&.Mui-focused": {
                      background: "#ffffff",
                      boxShadow: "0 0 0 3px rgba(0, 0, 0, 0.05)",
                    }
                  }}
                />
                {error && <FormHelperText error sx={{ mx: 0, mt: 0.5, fontSize: 11 }}>{error.message}</FormHelperText>}
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
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px", fontSize: 11.5 } }}
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
                            primary={<Typography component="span" sx={{ fontSize: 12 }}>{a.assetName}</Typography>}
                            secondary={<Typography component="span" sx={{ fontSize: 10.5, color: "#64748b" }}>{a.assetCode || ""}</Typography>}
                          />
                        </ListItemButton>
                      )) : (
                        <ListItemButton disabled>
                          <ListItemText primary={<Typography component="span" sx={{ fontSize: 12 }}>No assets found</Typography>} />
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
              <MenuItem key={m} value={m} sx={{ fontSize: 12 }}>{m}</MenuItem>
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
          />

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <FormTextField
              name="disposedBy"
              control={control}
              label="Disposed By"
              disabled
              defaultValue={userName || ""}
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
            />
          </Box>

          {(() => {
            const selectedAsset = disposableAssets.find((a) => a.assetId === formAssetId);
            const depreciatedVal = selectedAsset && selectedAsset.cost != null && formDisposalDate
              ? calculateDepreciatedValue(selectedAsset.cost, selectedAsset.purchaseDate, formDisposalDate)
              : null;

            if (!selectedAsset || selectedAsset.cost == null) return null;

            return (
              <Box sx={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                p: 1.5,
                mt: -0.5,
                mb: 0.5,
                display: "flex",
                flexDirection: "column",
                gap: 1
              }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography fontSize={11} fontWeight={600} color="#475569">
                    Purchase Cost: <strong style={{ color: "#0f172a" }}>₹{selectedAsset.cost.toLocaleString("en-IN")}</strong>
                  </Typography>
                  <Typography fontSize={10} color="#64748b">
                    Purchased: {selectedAsset.purchaseDate ? fmt(selectedAsset.purchaseDate) : "—"}
                  </Typography>
                </Box>
                {depreciatedVal != null && (
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.5, borderTop: "1px dashed #e2e8f0", pt: 1 }}>
                    <Box>
                      <Typography fontSize={11} fontWeight={600} color="#475569">
                        Estimated Book Value: <strong style={{ color: "#0f172a" }}>₹{depreciatedVal.toLocaleString("en-IN")}</strong>
                      </Typography>
                      <Typography fontSize={9} color="#94a3b8">
                        Based on standard 15% Written-Down Value (WDV) depreciation
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => setValue("disposalValue", depreciatedVal.toString())}
                      sx={{
                        fontSize: "10.5px",
                        textTransform: "none",
                        color: COLORS.primary,
                        p: 0.5,
                        minWidth: 0,
                        fontWeight: 700,
                        "&:hover": { background: "rgba(59, 130, 246, 0.08)" }
                      }}
                    >
                      Use Value
                    </Button>
                  </Box>
                )}
              </Box>
            );
          })()}

          <FormTextField
            name="disposalValue"
            control={control}
            rules={{
              min: { value: 0, message: "Value must be zero or positive" }
            }}
            label="Disposal Value (optional)"
            type="number"
            disabled={saving}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Typography fontSize={11.5}>₹</Typography></InputAdornment> } }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, gap: 1 }}>
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

function calculateDepreciatedValue(cost, purchaseDateStr, disposalDateStr) {
  if (!cost || !purchaseDateStr || !disposalDateStr) return null;

  const costVal = Number(cost);
  if (isNaN(costVal) || costVal <= 0) return null;

  const purchaseDate = new Date(purchaseDateStr);
  const disposalDate = new Date(disposalDateStr);

  if (isNaN(purchaseDate.getTime()) || isNaN(disposalDate.getTime())) return null;
  if (disposalDate < purchaseDate) return costVal;

  const yearsDiff = disposalDate.getFullYear() - purchaseDate.getFullYear();
  const monthsDiff = disposalDate.getMonth() - purchaseDate.getMonth();
  const totalMonths = (yearsDiff * 12) + monthsDiff;

  if (totalMonths <= 0) return costVal;

  // 15% annual WDV depreciation (0.15)
  const annualDepreciationRate = 0.15;
  const depreciatedValue = costVal * Math.pow(1 - annualDepreciationRate, totalMonths / 12);

  return Math.round(depreciatedValue);
}