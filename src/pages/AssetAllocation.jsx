import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, InputAdornment,
  MenuItem, Popover, List, ListItemButton, ListItemText,
  Select, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Tooltip, Typography, InputLabel, FormControl, OutlinedInput,
} from "@mui/material";
import {
  FaPlus, FaUndo, FaTimes, FaBoxOpen, FaSearch,
  FaEye, FaExclamationTriangle, FaDownload, FaFileExport,
  FaLayerGroup, FaCheckCircle, FaBoxes, FaClock, FaCalendarAlt,
} from "react-icons/fa";
import { MdRefresh } from "react-icons/md";
import { getUsers } from "../services/users_service";
import toast from "../utils/toast.jsx";

import {
  allocateAsset, getAllAllocations, getAllocationById, returnAsset, getAllocationOverview,
} from "../services/allocation_service";
import { getAssets } from "../services/assets_service";
import { exportAllocations } from "../services/report_service";
import { fetchAssets } from "../store/slices/assetSlice";
import PageHeader from "../components/common/PageHeader";
import TableCard from "../components/common/TableCard";
import ConfirmDialog from "../components/common/ConfirmDialog";
import ActionBtn from "../components/common/ActionBtn";
import PremiumCard from "../components/common/PremiumCard";
import StatCard from "../components/common/StatCard";
import { COLORS, outlinedBtnSx, primaryBtnSx, selectSx, inputSx, premiumDialogPaperSx, premiumDialogTitleSx, premiumFormGroupSx } from "../theme/tokens";
import { required, isValidDate, isDateAfter, extractFieldErrors } from "../utils/validate";

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

// ── Donut Chart ───────────────────────────────────────────────────────────────
function DonutChart({ segments, total }) {
  const SIZE = 110, CX = 55, CY = 55, R = 40, STROKE = 14;
  const CIRC = 2 * Math.PI * R;
  let offset = 0;
  const arcs = segments.map((seg) => {
    const dash = total > 0 ? (seg.value / total) * CIRC : 0;
    const arc = { ...seg, dash, gap: CIRC - dash, offset };
    offset += dash;
    return arc;
  });
  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f0f0f0" strokeWidth={STROKE} />
      {arcs.filter((a) => a.dash > 0).map((a) => (
        <circle
          key={a.label}
          cx={CX} cy={CY} r={R} fill="none"
          stroke={a.color}
          strokeWidth={STROKE}
          strokeDasharray={`${a.dash} ${a.gap}`}
          strokeDashoffset={-a.offset + CIRC / 4}
          strokeLinecap="butt"
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
      ))}
      <text x={CX} y={CY - 4} textAnchor="middle" fontSize={9} fill="#888" fontFamily="inherit">Total</text>
      <text x={CX} y={CY + 10} textAnchor="middle" fontSize={17} fontWeight={800} fill="#1a1a2e" fontFamily="inherit">{total}</text>
    </svg>
  );
}

// ── Recent Activity Item — premium compact ────────────────────────────────────
function ActivityItem({ row, isLast }) {
  const isActive = row.status === "ACTIVE";
  const isReturned = row.status === "RETURNED";
  const isOverdue = isActive && row.expectedReturnDate && row.expectedReturnDate < new Date().toISOString().split("T")[0];

  const badge = isOverdue ? { label: "Overdue", bg: "#fff3e0", color: "#e65100" }
    : isReturned ? { label: "Returned", bg: "#f3e5f5", color: "#6a1b9a" }
      : { label: "Active", bg: "#e8f5e9", color: "#2e7d32" };

  const fmtDt = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "";

  const eventDate = isReturned ? fmtDt(row.returnDate) : fmtDt(row.assignedDate);
  const iconBg = isOverdue ? "#fff3e0" : isReturned ? "#f3e5f5" : "#e8f5e9";
  const iconColor = isOverdue ? "#e65100" : isReturned ? "#6a1b9a" : "#2e7d32";

  return (
    <Box sx={{
      display: "flex", alignItems: "center", gap: "10px",
      py: "8px",
      borderBottom: isLast ? "none" : "1px solid #f5f5f5",
      transition: "background 120ms ease",
      borderRadius: "8px",
      '&:hover': { background: '#fbfdff' },
    }}>
      <Box sx={{
        width: 30, height: 30, borderRadius: "9px", flexShrink: 0,
        background: iconBg,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Box sx={{ color: iconColor, fontSize: 11, display: "flex" }}>
          {isReturned ? <FaUndo /> : isOverdue ? <FaClock /> : <FaCheckCircle />}
        </Box>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#1a1a2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {row.assetName}
        </Typography>
        <Typography sx={{ fontSize: 10, color: "#aaa", mt: "1px" }}>
          {isReturned ? `Returned by ${row.assignedTo}` : `→ ${row.assignedTo}`}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px", flexShrink: 0 }}>
        <Chip label={badge.label} size="small" sx={{
          background: badge.bg, color: badge.color,
          fontWeight: 700, fontSize: 9, height: 16, borderRadius: "5px",
          "& .MuiChip-label": { px: "5px" },
        }} />
        <Typography sx={{ fontSize: 9, color: "#ccc" }}>{eventDate}</Typography>
      </Box>
    </Box>
  );
}

// ── Asset Overview + Recent Activities — premium compact ──────────────────────
function AssetOverview({ stats, loading, recentAllocations }) {
  const { total, active, returned, overdue } = stats;
  const pct = (v) => total > 0 ? `${Math.round((v / total) * 100)}%` : "0%";

  const segments = [
    { label: "Active", value: active, color: "#4caf50" },
    { label: "Returned", value: returned, color: "#1976d2" },
    { label: "Overdue", value: overdue, color: "#ffa726" },
  ];

  const legend = [
    { label: "Active", value: active, dot: "#4caf50", text: "#2e7d32" },
    { label: "Returned", value: returned, dot: "#1976d2", text: "#1565c0" },
    { label: "Overdue", value: overdue, dot: "#ffa726", text: "#e65100" },
  ];

  const miniCards = [
    { label: "Total", value: total, bg: "#e3f2fd", icon: <FaBoxes size={13} color="#1976d2" /> },
    { label: "Active", value: active, bg: "#e8f5e9", icon: <FaCheckCircle size={13} color="#2e7d32" /> },
    { label: "Returned", value: returned, bg: "#ede7f6", icon: <FaLayerGroup size={13} color="#7b1fa2" /> },
    { label: "Overdue", value: overdue, bg: "#fff8e1", icon: <FaClock size={13} color="#f57c00" /> },
  ];

  const recent = (recentAllocations || []).slice(0, 6);

  return (
    <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap" }}>

      {/* ── Left: Donut overview ── */}
      <Box sx={{ flex: "1 1 280px" }}>
        <PremiumCard
          title="Asset Overview"
          subtitle="Assignment breakdowns"
          icon={<FaBoxes />}
        >
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}><CircularProgress size={20} /></Box>
          ) : (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.5 }}>
                <DonutChart segments={segments} total={total} />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, flex: 1 }}>
                  {legend.map((item) => (
                    <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "2px", background: item.dot, flexShrink: 0 }} />
                      <Typography sx={{ fontSize: 11, color: "#777", flex: 1 }}>{item.label}</Typography>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#1a1a2e", minWidth: 18, textAlign: "right" }}>{item.value}</Typography>
                      <Typography sx={{ fontSize: 10, color: item.text, minWidth: 34, textAlign: "right" }}>{pct(item.value)}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              <Box sx={{ borderTop: "1px solid #f5f5f5", mb: 1.5 }} />

              <Box sx={{ display: "flex", gap: 1 }}>
                {miniCards.map((c) => (
                  <Box key={c.label} sx={{
                    flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.4,
                    p: "8px 4px 6px",
                    background: "#fafafa", borderRadius: "10px", border: "1px solid #f0f0f0",
                    textAlign: "center",
                  }}>
                    <Box sx={{ width: 26, height: 26, borderRadius: "7px", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {c.icon}
                    </Box>
                    <Typography sx={{ fontSize: 15, fontWeight: 800, color: "#1a1a2e", lineHeight: 1 }}>{c.value}</Typography>
                    <Typography sx={{ fontSize: 9, fontWeight: 600, color: "#888", letterSpacing: "0.03em" }}>{c.label}</Typography>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </PremiumCard>
      </Box>

      {/* ── Right: Recent Activities (live from backend) ── */}
      <Box sx={{ flex: "1 1 280px" }}>
        <PremiumCard
          title="Recent Activities"
          subtitle="Real-time ledger updates"
          icon={<FaClock />}
        >
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}><CircularProgress size={20} /></Box>
          ) : recent.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4, color: "#ccc" }}>
              <FaBoxOpen size={22} style={{ marginBottom: 6, opacity: 0.3 }} />
              <Typography sx={{ fontSize: 11, color: "#ccc" }}>No recent activities</Typography>
            </Box>
          ) : (
            <Box>
              {recent.map((row, i) => (
                <ActivityItem key={row.allocationId} row={row} isLast={i === recent.length - 1} />
              ))}
            </Box>
          )}
        </PremiumCard>
      </Box>

    </Box>
  );
}



// ── Helpers ───────────────────────────────────────────────────────────────────
function today() { return new Date().toISOString().split("T")[0]; }
function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function isOverdue(row) {
  return row.status === "ACTIVE" && row.expectedReturnDate && row.expectedReturnDate < today();
}
function extractList(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (res?.data?.content) return res.data.content;
  if (res?.content) return res.content;
  return [];
}

const SIZE = 10;

export default function AssetAllocationPage() {
  const { userRole, userName } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const canWrite = userRole === "admin" || userRole === "manager";

  // ── Table state ───────────────────────────────────────────────────────────
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const debounceRef = useRef(null);

  // ── Allocate modal state ──────────────────────────────────────────────────
  const [availableAssets, setAvailableAssets] = useState([]);
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    assetId: "", assignedTo: "", assignedBy: userName || "",
    assignedDate: today(), expectedReturnDate: "", remarks: "",
  });
  const [errors, setErrors] = useState({});
  const [adminUsers, setAdminUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [assignedToSearch, setAssignedToSearch] = useState("");
  const [assignedToAnchor, setAssignedToAnchor] = useState(null);
  const [assetSearch, setAssetSearch] = useState("");
  const [assetAnchor, setAssetAnchor] = useState(null);

  // ── Return / View state ───────────────────────────────────────────────────
  const [returnConfirm, setReturnConfirm] = useState(false);
  const [returnId, setReturnId] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  // ── Overview state ────────────────────────────────────────────────────────
  const [overviewStats, setOverviewStats] = useState({ total: 0, active: 0, returned: 0, overdue: 0, awaitingReturn: 0 });
  const [overviewLoading, setOverviewLoading] = useState(true);
  // ── Recent activities state (separate from paginated table) ───────────────
  const [recentActivities, setRecentActivities] = useState([]);

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async (pg = 0) => {
    setLoading(true);
    try {
      const params = { page: pg, size: SIZE };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      const res = await getAllAllocations(params);
      const pageData = res?.data || res;
      setAllocations(pageData?.content || []);
      setTotalPages(pageData?.totalPages || 0);
      setTotalElements(pageData?.totalElements || 0);
    } catch {
      toast.error("Failed to load allocations");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, fromDate, toDate]);

  useEffect(() => { load(page); }, [search, statusFilter, fromDate, toDate, page]);

  // ── Overview loader (full dataset, runs once + after allocate/return) ─────
  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const res = await getAllocationOverview();
      const data = res?.data || res;
      setOverviewStats({
        total: data.total ?? 0,
        active: data.active ?? 0,
        returned: data.returned ?? 0,
        overdue: data.overdue ?? 0,
        awaitingReturn: data.awaitingReturn ?? 0,
      });
    } catch { /* silent */ } finally { setOverviewLoading(false); }
  }, []);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  // ── Recent activities loader — fetches latest 10 from backend ─────────────
  const loadRecentActivities = useCallback(async () => {
    try {
      const res = await getAllAllocations({ page: 0, size: 10 });
      const pageData = res?.data || res;
      const items = pageData?.content || (Array.isArray(pageData) ? pageData : []);
      // sort newest assigned date first
      items.sort((a, b) => (b.assignedDate || "") > (a.assignedDate || "") ? 1 : -1);
      setRecentActivities(items);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadRecentActivities(); }, [loadRecentActivities]);

  // ── Search debounce ───────────────────────────────────────────────────────
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearch(val); setPage(0); }, 400);
  };

  const handleStatusChange = (e) => { setStatusFilter(e.target.value); setPage(0); };
  const handleFromDate = (e) => { setFromDate(e.target.value); setPage(0); };
  const handleToDate = (e) => { setToDate(e.target.value); setPage(0); };

  // ── Clear / Reset all filters ─────────────────────────────────────────────
  const clearFilters = () => {
    setSearchInput(""); setSearch(""); setStatusFilter("");
    setFromDate(""); setToDate(""); setPage(0);
  };

  // ── Stat counts ───────────────────────────────────────────────────────────
  const activeCount = allocations.filter((r) => r.status === "ACTIVE").length;
  const returnedCount = allocations.filter((r) => r.status === "RETURNED").length;
  const overdueCount = allocations.filter(isOverdue).length;

  // ── View details ──────────────────────────────────────────────────────────
  const openView = async (id) => {
    setViewOpen(true); setViewData(null); setViewLoading(true);
    try {
      const res = await getAllocationById(id);
      setViewData(res?.data || res);
    } catch {
      toast.error("Failed to load details");
      setViewOpen(false);
    } finally { setViewLoading(false); }
  };

  // ── Export Excel ──────────────────────────────────────────
  const handleExportExcel = async () => {
    try {
      await exportAllocations();
      toast.success("Export downloaded successfully");
    } catch {
      toast.error("Export failed. Please try again.");
    }
  };

  // ── Open allocate modal ───────────────────────────────────────────────────
  const loadAvailableAssets = async () => {
    try {
      const res = await getAssets({ page: 0, size: 200 });
      setAvailableAssets(extractList(res).filter((a) => a.status === "AVAILABLE"));
    } catch { toast.error("Failed to load assets"); }
  };

  const openAllocate = async (preselectedAssetId = null) => {
    await loadAvailableAssets();
    setForm({ assetId: preselectedAssetId || "", assignedTo: "", assignedBy: userName || "", assignedDate: today(), expectedReturnDate: "", remarks: "" });
    setUserSearch(""); setAssignedToSearch(""); setAssetSearch("");
    setErrors({});
    try {
      const res = await getUsers({ page: 0, size: 200 });
      const all = extractList(res);
      setAllUsers(all);
      const admins = all.filter((u) => u.userRole === "ADMIN" || u.userRole === "MANAGER");
      setAdminUsers(admins.length > 0 ? admins : all);
    } catch { setAdminUsers([]); setAllUsers([]); }
    setAllocateOpen(true);
  };

  useEffect(() => {
    const assetIdParam = searchParams.get("assetId");
    if (assetIdParam && canWrite) {
      openAllocate(Number(assetIdParam));
      setSearchParams({});
    }
  }, []);

  const handleAllocate = async () => {
    const e = {};
    const assignedByVal = form.assignedBy || userName;
    if (!form.assetId) e.assetId = "Select an asset to allocate";
    if (!form.assignedTo) e.assignedTo = "Employee name is required";
    else if (form.assignedTo === userName) e.assignedTo = "You cannot allocate an asset to yourself";
    if (!assignedByVal) e.assignedBy = "Assigned-by name is required";
    if (!form.assignedDate) e.assignedDate = "Assigned date is required";
    else if (!isValidDate(form.assignedDate)) e.assignedDate = "Enter a valid date";
    if (form.expectedReturnDate) {
      if (!isValidDate(form.expectedReturnDate)) e.expectedReturnDate = "Enter a valid date";
      else if (!isDateAfter(form.assignedDate, form.expectedReturnDate)) {
        e.expectedReturnDate = "Expected return date must be on or after the assigned date";
      }
    }
    if (Object.keys(e).length > 0) {
      setErrors(e);
      toast.error("Please fix the highlighted fields");
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await allocateAsset({
        assetId: Number(form.assetId),
        assignedTo: form.assignedTo,
        assignedBy: assignedByVal,
        assignedDate: form.assignedDate,
        expectedReturnDate: form.expectedReturnDate || null,
        remarks: form.remarks || null,
      });
      toast.success("Asset allocated successfully");
      setAllocateOpen(false);
      load(page);
      loadOverview();
      loadRecentActivities();
      dispatch(fetchAssets({ page: 0, size: 10 }));
    } catch (err) {
      if (err.response?.status === 400) {
        const fe = extractFieldErrors(err);
        if (Object.keys(fe).length > 0) {
          setErrors(fe);
          toast.error("Please fix the highlighted fields");
        } else {
          toast.error(err.response?.data?.message || "Allocation failed");
        }
      } else {
        toast.error(err.response?.data?.message || "Allocation failed");
      }
    } finally { setSaving(false); }
  };

  const f = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handleReturnConfirm = async () => {
    try {
      await returnAsset(returnId);
      toast.success("Asset returned successfully");
      load(page);
      loadOverview();
      loadRecentActivities();
      dispatch(fetchAssets({ page: 0, size: 10 }));
    } catch (e) {
      toast.error(e.response?.data?.message || "Return failed");
    } finally { setReturnConfirm(false); setReturnId(null); }
  };

  // ── Pagination page numbers ───────────────────────────────────────────────
  const pageNums = () => {
    const pages = [], start = Math.max(0, page - 2), end = Math.min(totalPages - 1, page + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: 0 }}>

      {/* ── Page Header with reset hook ──────────────────────────────────── */}
      <PageHeader
        title="Asset Allocation"
        actions={
          canWrite && (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<FaFileExport size={11} />}
                onClick={handleExportExcel}
                sx={outlinedBtnSx}
              >
                Export
              </Button>
              <Button
                variant="contained"
                startIcon={<FaPlus size={11} />}
                onClick={openAllocate}
                sx={{ ...primaryBtnSx, background: COLORS.primary, "&:hover": { background: COLORS.primaryDark } }}
              >
                Allocate Asset
              </Button>
            </Box>
          )
        }
      />

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
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
        <StatCard label="Total Records" value={totalElements} icon={<FaBoxes size={15} />} iconBg="#e8eaf6" iconColor="#3949ab" />
        <StatCard label="Active" value={activeCount} icon={<FaCheckCircle size={15} />} iconBg="#ecfdf5" iconColor="#10b981" />
        <StatCard label="Returned" value={returnedCount} icon={<FaLayerGroup size={15} />} iconBg="#eff6ff" iconColor="#2563eb" />
        <StatCard label="Overdue" value={overdueCount} icon={<FaClock size={15} />} iconBg="#fffbeb" iconColor="#d97706" />
      </Box>

      {/* (AssetOverview moved below the table) */}

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Search asset, code, employee…"
          value={searchInput}
          onChange={handleSearchChange}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><FaSearch size={11} color="#aaa" /></InputAdornment> } }}
          sx={{ minWidth: 240, "& .MuiOutlinedInput-root": { borderRadius: "6px", fontSize: 11.5, height: 30 } }}
        />
        <Select
          size="small" value={statusFilter} onChange={handleStatusChange} displayEmpty
          sx={{ ...selectSx, minWidth: 130 }}
        >
          <MenuItem value="">All Status</MenuItem>
          <MenuItem value="ACTIVE">Active</MenuItem>
          <MenuItem value="RETURNED">Returned</MenuItem>
        </Select>
        <TextField
          size="small" type="date" label="From Date"
          value={fromDate} onChange={handleFromDate}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px", fontSize: 11.5, height: 30 } }}
        />
        <TextField
          size="small" type="date" label="To Date"
          value={toDate} onChange={handleToDate}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px", fontSize: 11.5, height: 30 } }}
        />

        {/* Reset icon button — same style as existing app buttons */}
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

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <TableCard>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
        ) : allocations.length === 0 ? (
          <EmptyState />
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 860, tableLayout: "auto", borderCollapse: "collapse" }}>
              <TableHead>
                <TableRow>
                  {["#", "Asset", "Code", "Assigned To", "Assigned By", "Date", "Expected Return", "Return Date", "Status", "Remarks", "Actions"].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: "#64748b", whiteSpace: "nowrap", background: "#f8fafc", borderBottom: "2px solid #e2e8f0", letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {allocations.map((row, i) => {
                  const overdue = isOverdue(row);
                  return (
                    <TableRow key={row.allocationId} sx={{ borderLeft: "3px solid transparent", transition: "all 180ms ease", "&:last-child td": { border: 0 }, "&:hover": { borderLeft: "3px solid #3b82f6", "& td": { background: overdue ? "#fff7ed" : "#f0f7ff" } }, "& td": { background: overdue ? "#fffbeb" : i % 2 === 0 ? "#fff" : "#f8faff", borderBottom: "1px solid #f1f5f9" } }}>
                      <TableCell sx={{ verticalAlign: "middle", color: COLORS.textFaint }}>{page * SIZE + i + 1}</TableCell>
                      <TableCell sx={{ fontSize: 11, verticalAlign: "middle", borderBottom: "1px solid #f0f0f8", fontWeight: 600, color: "#1e1b4b" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          {overdue && <Tooltip title="Overdue"><span><FaExclamationTriangle size={11} color="#b45309" /></span></Tooltip>}
                          {row.assetName}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ verticalAlign: "middle", borderBottom: "1px solid #f0f0f8" }}>
                        <Chip label={row.assetCode || "—"} size="small" sx={{ fontSize: 9.5, height: 18, background: "#eff6ff", color: "#1d4ed8", borderRadius: "5px", "& .MuiChip-label": { px: "6px" } }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 11, verticalAlign: "middle", borderBottom: "1px solid #f0f0f8" }}>{row.assignedTo}</TableCell>
                      <TableCell sx={{ fontSize: 11, verticalAlign: "middle", borderBottom: "1px solid #f0f0f8", color: COLORS.textMuted }}>{row.assignedBy}</TableCell>
                      <TableCell sx={{ fontSize: 11, verticalAlign: "middle", borderBottom: "1px solid #f0f0f8" }}>{fmt(row.assignedDate)}</TableCell>
                      <TableCell sx={{ fontSize: 11, verticalAlign: "middle", borderBottom: "1px solid #f0f0f8", color: overdue ? "#b45309" : COLORS.textMuted, fontWeight: overdue ? 700 : 400 }}>{row.expectedReturnDate ? fmt(row.expectedReturnDate) : "—"}</TableCell>
                      <TableCell sx={{ fontSize: 11, verticalAlign: "middle", borderBottom: "1px solid #f0f0f8", color: COLORS.textMuted }}>{row.returnDate ? fmt(row.returnDate) : "—"}</TableCell>
                      <TableCell sx={{ verticalAlign: "middle", borderBottom: "1px solid #f0f0f8" }}><StatusBadge status={row.status} /></TableCell>
                      <TableCell sx={{ fontSize: 11, verticalAlign: "middle", borderBottom: "1px solid #f0f0f8", color: COLORS.textMuted, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <Tooltip title={row.remarks || ""}><span>{row.remarks || "—"}</span></Tooltip>
                      </TableCell>
                      <TableCell sx={{ verticalAlign: "middle", borderBottom: "1px solid #f0f0f8" }}>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Tooltip title="View Details" arrow>
                            <IconButton
                              size="small"
                              onClick={() => openView(row.allocationId)}
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
                          {canWrite && row.status === "ACTIVE" && (
                            <Tooltip title="Mark as Returned" arrow>
                              <IconButton
                                size="small"
                                onClick={() => { setReturnId(row.allocationId); setReturnConfirm(true); }}
                                sx={{
                                  width: 22,
                                  height: 22,
                                  color: "#10b981",
                                  background: "transparent",
                                  borderRadius: "4px",
                                  transition: "all 0.15s ease",
                                  p: 0,
                                  "&:hover": {
                                    background: "rgba(16, 185, 129, 0.08)",
                                    color: "#059669",
                                  }
                                }}
                              >
                                <FaUndo size={11} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* ── Pagination ──────────────────────────────────────────── */}
            {totalPages > 1 && (
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2, py: 1.5, borderTop: "1px solid #f0f0f0" }}>
                <Typography fontSize={12} color={COLORS.textMuted}>
                  Showing {page * SIZE + 1}–{Math.min((page + 1) * SIZE, totalElements)} of {totalElements}
                </Typography>
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <Button size="small" variant="outlined" disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                    sx={{ textTransform: "none", fontSize: 12, minWidth: 60, borderRadius: "7px" }}>Prev</Button>
                  {pageNums().map((n) => (
                    <Button key={n} size="small"
                      variant={n === page ? "contained" : "outlined"}
                      onClick={() => setPage(n)}
                      sx={{ minWidth: 32, fontSize: 12, borderRadius: "7px", background: n === page ? COLORS.primary : undefined, boxShadow: "none" }}>
                      {n + 1}
                    </Button>
                  ))}
                  <Button size="small" variant="outlined" disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                    sx={{ textTransform: "none", fontSize: 12, minWidth: 60, borderRadius: "7px" }}>Next</Button>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </TableCard>

      {/* ── Asset Overview ──────────────────────────────────────────────── */}
      <Box sx={{ mt: 2 }}>
        <AssetOverview stats={overviewStats} loading={overviewLoading} recentAllocations={recentActivities} />
      </Box>

      {/* ── Allocate Modal (UNCHANGED) ───────────────────────────────────── */}
      <Dialog open={allocateOpen} onClose={() => setAllocateOpen(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: premiumDialogPaperSx } }}>
        <DialogTitle sx={premiumDialogTitleSx}>
          <span>Allocate Asset</span>
          <IconButton size="small" onClick={() => setAllocateOpen(false)} sx={{ color: COLORS.textFaint }}><FaTimes size={13} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.75, pt: "18px !important", pb: 2 }}>
          {/* Asset */}
          <FormControl fullWidth size="small" error={!!errors.assetId}>
            <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: errors.assetId ? "#c62828" : COLORS.textMuted, mb: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}>
              Asset *
            </Typography>
            <OutlinedInput readOnly notched={false} label="" size="small"
              value={availableAssets.find((a) => a.assetId === form.assetId)
                ? `${availableAssets.find((a) => a.assetId === form.assetId).assetName}${availableAssets.find((a) => a.assetId === form.assetId).assetCode ? ` (${availableAssets.find((a) => a.assetId === form.assetId).assetCode})` : ""}`
                : ""}
              placeholder="Select asset to allocate..." onClick={(e) => setAssetAnchor(e.currentTarget)}
              error={!!errors.assetId}
              endAdornment={<InputAdornment position="end"><Typography fontSize={11} color="#aaa">▾</Typography></InputAdornment>}
              sx={{
                ...inputSx["& .MuiOutlinedInput-root"],
                fontSize: 11.5,
                height: 30,
                cursor: "pointer",
                caretColor: "transparent",
                background: "#f8fafc",
                borderColor: errors.assetId ? "#c62828" : "#cbd5e1",
                "& fieldset": { border: "1px solid", borderColor: errors.assetId ? "#c62828 !important" : "#cbd5e1" }
              }}
            />
            {errors.assetId && <Typography color="error" sx={{ fontSize: 10.5, mt: 0.25 }}>{errors.assetId}</Typography>}
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
                {(() => {
                  const q = assetSearch.toLowerCase();
                  const filtered = availableAssets.filter((a) => !q || a.assetName?.toLowerCase().includes(q) || a.assetCode?.toLowerCase().includes(q));
                  return filtered.length > 0 ? filtered.map((a) => (
                    <ListItemButton key={a.assetId} selected={form.assetId === a.assetId}
                      onClick={() => { f("assetId", a.assetId); setAssetAnchor(null); setAssetSearch(""); }} sx={{ py: 0.5 }}>
                      <ListItemText
                        primary={<Typography sx={{ fontSize: 13 }}>{a.assetName}</Typography>}
                        secondary={<Typography sx={{ fontSize: 11, color: "#64748b" }}>{a.assetCode || ""}</Typography>}
                      />
                    </ListItemButton>
                  )) : <ListItemButton disabled><ListItemText primary={<Typography sx={{ fontSize: 13 }}>No assets found</Typography>} /></ListItemButton>;
                })()}
              </List>
            </Popover>
          </FormControl>

          {/* Assigned To */}
          <FormControl fullWidth size="small" error={!!errors.assignedTo}>
            <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: errors.assignedTo ? "#c62828" : COLORS.textMuted, mb: 0.5 }}>
              Assigned To *
            </Typography>
            <OutlinedInput readOnly notched={false} label="" size="small"
              value={form.assignedTo || ""} placeholder="Select employee..." onClick={(e) => setAssignedToAnchor(e.currentTarget)}
              error={!!errors.assignedTo}
              endAdornment={<InputAdornment position="end"><Typography fontSize={11} color="#aaa">▾</Typography></InputAdornment>}
              sx={{
                ...inputSx["& .MuiOutlinedInput-root"],
                fontSize: 11.5,
                height: 30,
                cursor: "pointer",
                caretColor: "transparent",
                background: "#f8fafc",
                borderColor: errors.assignedTo ? "#c62828" : "#cbd5e1",
                "& fieldset": { border: "1px solid", borderColor: errors.assignedTo ? "#c62828 !important" : "#cbd5e1" }
              }}
            />
            {errors.assignedTo && <Typography color="error" sx={{ fontSize: 10.5, mt: 0.25 }}>{errors.assignedTo}</Typography>}
            <Popover open={Boolean(assignedToAnchor)} anchorEl={assignedToAnchor}
              onClose={() => { setAssignedToAnchor(null); setAssignedToSearch(""); }}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              slotProps={{ paper: { sx: { width: assignedToAnchor?.offsetWidth, minWidth: 320, maxHeight: 280, display: "flex", flexDirection: "column", borderRadius: "10px", boxShadow: "0 10px 25px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0" } } }}>
              <Box sx={{ p: 1, borderBottom: "1px solid #f0f0f0" }}>
                <TextField autoFocus size="small" fullWidth placeholder="Search employee..."
                  value={assignedToSearch} onChange={(e) => setAssignedToSearch(e.target.value)}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><FaSearch size={11} color="#aaa" /></InputAdornment> } }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px", fontSize: 12 } }} />
              </Box>
              <List dense sx={{ overflowY: "auto", flex: 1 }}>
                {(() => {
                  const q = assignedToSearch.toLowerCase();
                  const filtered = allUsers.filter((u) => u.userName !== userName && (!q || u.userName?.toLowerCase().includes(q) || u.userEmail?.toLowerCase().includes(q)));
                  return filtered.length > 0 ? filtered.map((u) => (
                    <ListItemButton key={u.userId} selected={form.assignedTo === u.userName}
                      onClick={() => { f("assignedTo", u.userName); setAssignedToAnchor(null); setAssignedToSearch(""); }} sx={{ py: 0.5 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{u.userName}</Typography>
                            {u.userRole && (
                              <Chip
                                label={u.userRole}
                                size="small"
                                sx={{
                                  height: 16,
                                  fontSize: 8,
                                  fontWeight: 700,
                                  borderRadius: "4px",
                                  background: u.userRole === "ADMIN" ? "#fee2e2" : u.userRole === "MANAGER" ? "#fef3c7" : "#e0f2fe",
                                  color: u.userRole === "ADMIN" ? "#991b1b" : u.userRole === "MANAGER" ? "#92400e" : "#0369a1",
                                  "& .MuiChip-label": { px: 0.75 }
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={<Typography sx={{ fontSize: 11, color: "#64748b" }}>{u.userEmail}</Typography>}
                      />
                    </ListItemButton>
                  )) : <ListItemButton disabled><ListItemText primary={<Typography sx={{ fontSize: 13 }}>No users found</Typography>} /></ListItemButton>;
                })()}
              </List>
            </Popover>
          </FormControl>

          {/* Assigned By */}
          <FormControl fullWidth size="small">
            <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.textMuted, mb: 0.5 }}>
              Assigned By
            </Typography>
            <OutlinedInput
              disabled
              notched={false}
              label=""
              size="small"
              value={form.assignedBy || userName || ""}
              sx={{
                ...inputSx["& .MuiOutlinedInput-root"],
                fontSize: 11.5,
                height: 30,
                bgcolor: "#f8fafc",
                "& .MuiOutlinedInput-input.Mui-disabled": {
                  WebkitTextFillColor: "#475569",
                }
              }}
            />
          </FormControl>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: errors.assignedDate ? "#c62828" : COLORS.textMuted, mb: 0.5 }}>
                Assigned Date *
              </Typography>
              <TextField type="date" size="small" fullWidth
                value={form.assignedDate} onChange={(e) => f("assignedDate", e.target.value)}
                error={!!errors.assignedDate} helperText={errors.assignedDate || ""}
                sx={{
                  ...inputSx,
                  "& .MuiOutlinedInput-root": { ...inputSx["& .MuiOutlinedInput-root"], height: 30, fontSize: 11.5 }
                }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: errors.expectedReturnDate ? "#c62828" : COLORS.textMuted, mb: 0.5 }}>
                Expected Return Date
              </Typography>
              <TextField type="date" size="small" fullWidth
                value={form.expectedReturnDate} onChange={(e) => f("expectedReturnDate", e.target.value)}
                error={!!errors.expectedReturnDate} helperText={errors.expectedReturnDate || ""}
                sx={{
                  ...inputSx,
                  "& .MuiOutlinedInput-root": { ...inputSx["& .MuiOutlinedInput-root"], height: 30, fontSize: 11.5 }
                }} />
            </Box>
          </Box>

          <Box>
            <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.textMuted, mb: 0.5 }}>
              Remarks
            </Typography>
            <TextField placeholder="Add any details or notes..." size="small" fullWidth multiline rows={2}
              value={form.remarks} onChange={(e) => f("remarks", e.target.value)}
              slotProps={{ htmlInput: { maxLength: 250 } }}
              sx={{
                ...inputSx,
                "& .MuiOutlinedInput-root": { ...inputSx["& .MuiOutlinedInput-root"], height: "auto", fontSize: 11.5, py: "6px !important" }
              }} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, borderTop: "1px solid #f1f5f9", pt: 1.5 }}>
          <Button onClick={() => setAllocateOpen(false)} sx={outlinedBtnSx}>Cancel</Button>
          <Button variant="contained" onClick={handleAllocate} disabled={saving}
            startIcon={saving ? <CircularProgress size={12} color="inherit" /> : <FaPlus size={11} />}
            sx={{ ...primaryBtnSx, background: COLORS.primary, "&:hover": { background: COLORS.primaryDark } }}>
            {saving ? "Allocating..." : "Allocate"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── View Details Modal ───────────────────────────────────────────── */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: premiumDialogPaperSx } }}>
        <DialogTitle sx={premiumDialogTitleSx}>
          <span>Allocation Details</span>
          <IconButton size="small" onClick={() => setViewOpen(false)} sx={{ color: COLORS.textFaint }}><FaTimes size={13} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: "18px !important", pb: 2 }}>
          {viewLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={24} /></Box>
          ) : viewData ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              {[
                ["Allocation ID", viewData.allocationId],
                ["Asset", `${viewData.assetName} (${viewData.assetCode || "—"})`],
                ["Location", viewData.locationName || "—"],
                ["Assigned To", viewData.assignedTo],
                ["Assigned By", viewData.assignedBy],
                ["Assigned Date", fmt(viewData.assignedDate)],
                ["Expected Return", viewData.expectedReturnDate ? fmt(viewData.expectedReturnDate) : "—"],
                ["Return Date", viewData.returnDate ? fmt(viewData.returnDate) : "—"],
                ["Status", viewData.status],
                ["Remarks", viewData.remarks || "—"],
              ].map(([label, value]) => (
                <Box key={label} sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  py: 1,
                  px: 1.5,
                  borderRadius: "6px",
                  background: "#fbfcfd",
                  border: "1px solid #f1f5f9",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    background: "#f8fafc",
                    borderColor: "#e2e8f0"
                  }
                }}>
                  <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    {label}
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: "text.primary", textAlign: "right" }}>
                    {String(value || "—")}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, borderTop: "1px solid " + COLORS.borderLight, pt: 1.5 }}>
          <Button onClick={() => setViewOpen(false)} sx={outlinedBtnSx}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── Return Confirm ───────────────────────────────────────────────── */}
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