import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, InputAdornment,
  MenuItem, Popover, List, ListItemButton, ListItemText,
  Select, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Tooltip, Typography, InputLabel, FormControl, OutlinedInput,
} from "@mui/material";
import {
  FaPlus, FaUndo, FaTimes, FaBoxOpen, FaSearch,
  FaEye, FaExclamationTriangle, FaDownload,
  FaLayerGroup, FaCheckCircle, FaBoxes, FaClock,
} from "react-icons/fa";
import { MdRefresh } from "react-icons/md";
import { getUsers } from "../services/users_service";
import toast from "react-hot-toast";

import {
  allocateAsset, getAllAllocations, getAllocationById, returnAsset, getAllocationOverview,
} from "../services/allocation_service";
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

// ── Donut Chart ───────────────────────────────────────────────────────────────
function DonutChart({ segments, total }) {
  const SIZE = 140, CX = 70, CY = 70, R = 52, STROKE = 18;
  const CIRC = 2 * Math.PI * R;
  let offset = 0;
  const arcs = segments.map((seg) => {
    const dash = total > 0 ? (seg.value / total) * CIRC : 0;
    const arc  = { ...seg, dash, gap: CIRC - dash, offset };
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
      <text x={CX} y={CY - 6} textAnchor="middle" fontSize={11} fill="#888" fontFamily="Inter,sans-serif">Total</text>
      <text x={CX} y={CY + 12} textAnchor="middle" fontSize={22} fontWeight={800} fill="#1a1a2e" fontFamily="Inter,sans-serif">{total}</text>
    </svg>
  );
}

// ── Recent Activity Item — premium compact ────────────────────────────────────
function ActivityItem({ row, isLast }) {
  const isActive   = row.status === "ACTIVE";
  const isReturned = row.status === "RETURNED";
  const isOverdue  = isActive && row.expectedReturnDate && row.expectedReturnDate < new Date().toISOString().split("T")[0];

  const badge = isOverdue  ? { label: "Overdue",  bg: "#fff3e0", color: "#e65100" }
              : isReturned ? { label: "Returned", bg: "#f3e5f5", color: "#6a1b9a" }
              :               { label: "Active",   bg: "#e8f5e9", color: "#2e7d32" };

  const fmtDt = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "";

  const eventDate = isReturned ? fmtDt(row.returnDate) : fmtDt(row.assignedDate);
  const iconBg    = isOverdue ? "#fff3e0" : isReturned ? "#f3e5f5" : "#e8f5e9";
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
    { label: "Active",   value: active,   color: "#4caf50" },
    { label: "Returned", value: returned, color: "#1976d2" },
    { label: "Overdue",  value: overdue,  color: "#ffa726" },
  ];

  const legend = [
    { label: "Active",   value: active,   dot: "#4caf50", text: "#2e7d32" },
    { label: "Returned", value: returned, dot: "#1976d2", text: "#1565c0" },
    { label: "Overdue",  value: overdue,  dot: "#ffa726", text: "#e65100" },
  ];

  const miniCards = [
    { label: "Total",    value: total,    bg: "#e3f2fd", icon: <FaBoxes size={13} color="#1976d2" /> },
    { label: "Active",   value: active,   bg: "#e8f5e9", icon: <FaCheckCircle size={13} color="#2e7d32" /> },
    { label: "Returned", value: returned, bg: "#ede7f6", icon: <FaLayerGroup size={13} color="#7b1fa2" /> },
    { label: "Overdue",  value: overdue,  bg: "#fff8e1", icon: <FaClock size={13} color="#f57c00" /> },
  ];

  const recent = (recentAllocations || []).slice(0, 6);

  return (
    <Box sx={{ display: "flex", gap: 2, mb: 2.5, flexWrap: "wrap" }}>

      {/* ── Left: Donut overview ── */}
      <Box sx={{
        flex: "1 1 320px",
        background: "linear-gradient(180deg, #ffffff, #fbfbfd)",
        borderRadius: "16px",
        border: "1px solid rgba(16,24,40,0.06)",
        boxShadow: "0 6px 18px rgba(16,24,40,0.06), 0 8px 24px rgba(0,0,0,0.04)",
        p: "16px",
      }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.07em", textTransform: "uppercase", mb: 1.5 }}>
          Asset Overview
        </Typography>

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
      </Box>

      {/* ── Right: Recent Activities (live from backend) ── */}
      <Box sx={{
        flex: "1 1 320px",
        background: "linear-gradient(180deg, #ffffff, #fbfbfd)",
        borderRadius: "16px",
        border: "1px solid rgba(16,24,40,0.06)",
        boxShadow: "0 6px 18px rgba(16,24,40,0.06), 0 8px 24px rgba(0,0,0,0.04)",
        p: "12px",
        display: "flex", flexDirection: "column",
      }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.07em", textTransform: "uppercase", mb: 1 }}>
          Recent Activities
        </Typography>

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
      </Box>

    </Box>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, gradient, iconBg, iconColor, borderColor }) => (
  <Box sx={{
    flex: 1, minWidth: 140,
    background: gradient || "linear-gradient(180deg, rgba(255,255,255,0.85), #fff)",
    border: `1px solid ${borderColor || 'rgba(16,24,40,0.04)'}`,
    borderRadius: "16px",
    p: "18px 20px",
    display: "flex", alignItems: "center", gap: 2,
    boxShadow: "0 8px 20px rgba(16,24,40,0.06), inset 0 1px 0 rgba(255,255,255,0.6)",
    transition: "transform 0.18s, box-shadow 0.18s",
    "&:hover": { transform: "translateY(-4px)", boxShadow: "0 14px 36px rgba(16,24,40,0.12)" },
  }}>
    <Box sx={{
      width: 48, height: 48, borderRadius: "12px",
      background: iconBg || "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(240,240,255,0.6))",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      boxShadow: "0 6px 18px rgba(16,24,40,0.06)",
    }}>
      {icon}
    </Box>
    <Box>
      <Typography fontSize={12} fontWeight={700} color={COLORS.textMuted} mb={0.3}>{label}</Typography>
      <Typography fontSize={26} fontWeight={800} color={COLORS.text} lineHeight={1}>{value}</Typography>
    </Box>
  </Box>
);

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
  if (Array.isArray(res))       return res;
  if (Array.isArray(res?.data)) return res.data;
  if (res?.data?.content)       return res.data.content;
  if (res?.content)             return res.content;
  return [];
}

const SIZE = 10;

export default function AssetAllocationPage() {
  const { userRole, userName } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const canWrite = userRole === "admin" || userRole === "manager";

  // ── Table state ───────────────────────────────────────────────────────────
  const [allocations,    setAllocations]    = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [page,           setPage]           = useState(0);
  const [totalPages,     setTotalPages]     = useState(0);
  const [totalElements,  setTotalElements]  = useState(0);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [searchInput,  setSearchInput]  = useState("");
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate,     setFromDate]     = useState("");
  const [toDate,       setToDate]       = useState("");
  const debounceRef = useRef(null);

  // ── Allocate modal state ──────────────────────────────────────────────────
  const [availableAssets,    setAvailableAssets]    = useState([]);
  const [allocateOpen,       setAllocateOpen]       = useState(false);
  const [saving,             setSaving]             = useState(false);
  const [form, setForm] = useState({
    assetId: "", assignedTo: "", assignedBy: userName || "",
    assignedDate: today(), expectedReturnDate: "", remarks: "",
  });
  const [adminUsers,         setAdminUsers]         = useState([]);
  const [allUsers,           setAllUsers]           = useState([]);
  const [userSearch,         setUserSearch]         = useState("");
  const [anchorEl,           setAnchorEl]           = useState(null);
  const [assignedToSearch,   setAssignedToSearch]   = useState("");
  const [assignedToAnchor,   setAssignedToAnchor]   = useState(null);
  const [assetSearch,        setAssetSearch]        = useState("");
  const [assetAnchor,        setAssetAnchor]        = useState(null);

  // ── Return / View state ───────────────────────────────────────────────────
  const [returnConfirm, setReturnConfirm] = useState(false);
  const [returnId,      setReturnId]      = useState(null);
  const [viewOpen,      setViewOpen]      = useState(false);
  const [viewData,      setViewData]      = useState(null);
  const [viewLoading,   setViewLoading]   = useState(false);

  // ── Overview state ────────────────────────────────────────────────────────
  const [overviewStats,    setOverviewStats]    = useState({ total: 0, active: 0, returned: 0, overdue: 0, awaitingReturn: 0 });
  const [overviewLoading,  setOverviewLoading]  = useState(true);
  // ── Recent activities state (separate from paginated table) ───────────────
  const [recentActivities, setRecentActivities] = useState([]);

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async (pg = 0) => {
    setLoading(true);
    try {
      const params = { page: pg, size: SIZE };
      if (search)       params.search   = search;
      if (statusFilter) params.status   = statusFilter;
      if (fromDate)     params.fromDate = fromDate;
      if (toDate)       params.toDate   = toDate;
      const res      = await getAllAllocations(params);
      const pageData = res?.data || res;
      setAllocations(pageData?.content   || []);
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
      const res  = await getAllocationOverview();
      const data = res?.data || res;
      setOverviewStats({
        total:          data.total          ?? 0,
        active:         data.active         ?? 0,
        returned:       data.returned       ?? 0,
        overdue:        data.overdue        ?? 0,
        awaitingReturn: data.awaitingReturn ?? 0,
      });
    } catch { /* silent */ } finally { setOverviewLoading(false); }
  }, []);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  // ── Recent activities loader — fetches latest 10 from backend ─────────────
  const loadRecentActivities = useCallback(async () => {
    try {
      const res      = await getAllAllocations({ page: 0, size: 10 });
      const pageData = res?.data || res;
      const items    = pageData?.content || (Array.isArray(pageData) ? pageData : []);
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
  const handleFromDate      = (e) => { setFromDate(e.target.value);    setPage(0); };
  const handleToDate        = (e) => { setToDate(e.target.value);      setPage(0); };

  // ── Clear / Reset all filters ─────────────────────────────────────────────
  const clearFilters = () => {
    setSearchInput(""); setSearch(""); setStatusFilter("");
    setFromDate(""); setToDate(""); setPage(0);
  };

  // ── Stat counts ───────────────────────────────────────────────────────────
  const activeCount   = allocations.filter((r) => r.status === "ACTIVE").length;
  const returnedCount = allocations.filter((r) => r.status === "RETURNED").length;
  const overdueCount  = allocations.filter(isOverdue).length;

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

  // ── Export CSV ────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ["ID","Asset","Code","Assigned To","Assigned By","Date","Expected Return","Return Date","Status","Remarks"];
    const rows = allocations.map((r) => [
      r.allocationId, r.assetName, r.assetCode || "",
      r.assignedTo, r.assignedBy,
      r.assignedDate || "", r.expectedReturnDate || "", r.returnDate || "",
      r.status, r.remarks || "",
    ]);
    const csv  = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "allocations.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Open allocate modal ───────────────────────────────────────────────────
  const loadAvailableAssets = async () => {
    try {
      const res = await getAssets({ page: 0, size: 200 });
      setAvailableAssets(extractList(res).filter((a) => a.status === "AVAILABLE"));
    } catch { toast.error("Failed to load assets"); }
  };

  const openAllocate = async () => {
    await loadAvailableAssets();
    setForm({ assetId: "", assignedTo: "", assignedBy: "", assignedDate: today(), expectedReturnDate: "", remarks: "" });
    setUserSearch(""); setAssignedToSearch(""); setAssetSearch("");
    try {
      const res = await getUsers({ page: 0, size: 200 });
      const all = extractList(res);
      setAllUsers(all);
      const admins = all.filter((u) => u.userRole === "ADMIN" || u.userRole === "MANAGER");
      setAdminUsers(admins.length > 0 ? admins : all);
    } catch { setAdminUsers([]); setAllUsers([]); }
    setAllocateOpen(true);
  };

  const handleAllocate = async () => {
    if (!form.assetId)      { toast.error("Select an asset"); return; }
    if (!form.assignedTo)   { toast.error("Enter employee name"); return; }
    if (!form.assignedBy)   { toast.error("Enter assigned-by name"); return; }
    if (!form.assignedDate) { toast.error("Select assigned date"); return; }
    if (form.expectedReturnDate && form.expectedReturnDate < form.assignedDate) {
      toast.error("Expected return date must be on or after the assigned date"); return;
    }
    setSaving(true);
    try {
      await allocateAsset({
        assetId: Number(form.assetId),
        assignedTo: form.assignedTo, assignedBy: form.assignedBy,
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
    } catch (e) {
      toast.error(e.response?.data?.message || "Allocation failed");
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
    <Box sx={{ mt: "78px", p: "2rem 2.5rem", background: COLORS.bg, minHeight: "100vh", fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* ── Page Header with reset hook ──────────────────────────────────── */}
      <PageHeader
        title="Asset Allocation"
        actions={
          canWrite && (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined" size="small"
                startIcon={<FaDownload size={11} />}
                onClick={exportCSV}
                sx={{ textTransform: "none", fontSize: 12, borderRadius: "8px" }}
              >
                Export CSV
              </Button>
              <Button
                variant="contained"
                startIcon={<FaPlus size={11} />}
                onClick={openAllocate}
                sx={{ textTransform: "none", fontSize: 13, fontWeight: 600, borderRadius: "8px", py: "8px", px: 2, background: COLORS.primary, boxShadow: "none", "&:hover": { background: COLORS.primaryDark, boxShadow: "none" } }}
              >
                Allocate Asset
              </Button>
            </Box>
          )
        }
      />

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <StatCard
          label="Total Records"
          value={totalElements}
          icon={<FaBoxes size={18} color="#1976d2" />}
          gradient="linear-gradient(135deg, #e3f2fd 0%, #fff 100%)"
          iconBg="#dbeafe" iconColor="#1976d2" borderColor="#bfdbfe"
        />
        <StatCard
          label="Active"
          value={activeCount}
          icon={<FaCheckCircle size={18} color="#2e7d32" />}
          gradient="linear-gradient(135deg, #e8f5e9 0%, #fff 100%)"
          iconBg="#dcfce7" iconColor="#2e7d32" borderColor="#a5d6a7"
        />
        <StatCard
          label="Returned"
          value={returnedCount}
          icon={<FaLayerGroup size={18} color="#6b7280" />}
          gradient="linear-gradient(135deg, #f3f4f6 0%, #fff 100%)"
          iconBg="#e5e7eb" iconColor="#6b7280" borderColor="#d1d5db"
        />
        <StatCard
          label="Overdue"
          value={overdueCount}
          icon={<FaClock size={18} color="#b45309" />}
          gradient="linear-gradient(135deg, #fffbeb 0%, #fff 100%)"
          iconBg="#fef3c7" iconColor="#b45309" borderColor="#fcd34d"
        />
      </Box>

      {/* (AssetOverview moved below the table) */}

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Search asset, code, employee…"
          value={searchInput}
          onChange={handleSearchChange}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><FaSearch size={12} color="#aaa" /></InputAdornment> } }}
          sx={{ minWidth: 240, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
        />
        <Select
          size="small" value={statusFilter} onChange={handleStatusChange} displayEmpty
          sx={{ minWidth: 130, fontSize: 13, borderRadius: "8px" }}
        >
          <MenuItem value="">All Status</MenuItem>
          <MenuItem value="ACTIVE">Active</MenuItem>
          <MenuItem value="RETURNED">Returned</MenuItem>
        </Select>
        <TextField
          size="small" type="date" label="From Date"
          value={fromDate} onChange={handleFromDate}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
        />
        <TextField
          size="small" type="date" label="To Date"
          value={toDate} onChange={handleToDate}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
        />

        {/* Reset icon button — same style as existing app buttons */}
        <Tooltip title="Reset filters">
          <IconButton
            onClick={clearFilters}
            aria-label="Reset"
            sx={{
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              p: "7px",
              background: "#fff",
              color: "#757575",
              "&:hover": { background: "#f5f5f5", borderColor: "#bbb", color: COLORS.primary },
            }}
          >
            <MdRefresh size={18} />
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
            <Table size="small" sx={{ minWidth: 860 }}>
              <TableHead>
                <TableRow sx={{ background: "#f8fafc" }}>
                  {["#","Asset","Code","Assigned To","Assigned By","Date","Expected Return","Return Date","Status","Remarks","Actions"].map((h) => (
                    <TableCell key={h} sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, py: 1.5, whiteSpace: "nowrap" }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {allocations.map((row, i) => {
                  const overdue = isOverdue(row);
                  return (
                    <TableRow
                      key={row.allocationId} hover
                      sx={{ "&:last-child td": { border: 0 }, background: overdue ? "#fffbeb" : undefined }}
                    >
                      <TableCell sx={{ fontSize: 12, color: COLORS.textFaint }}>{page * SIZE + i + 1}</TableCell>
                      <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          {overdue && <Tooltip title="Overdue"><span><FaExclamationTriangle size={11} color="#b45309" /></span></Tooltip>}
                          {row.assetName}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={row.assetCode || "—"} size="small" sx={{ fontSize: 11, height: 20, background: "#eff6ff", color: "#1d4ed8" }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 13 }}>{row.assignedTo}</TableCell>
                      <TableCell sx={{ fontSize: 12, color: COLORS.textMuted }}>{row.assignedBy}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{fmt(row.assignedDate)}</TableCell>
                      <TableCell sx={{ fontSize: 12, color: overdue ? "#b45309" : COLORS.textMuted, fontWeight: overdue ? 600 : 400 }}>
                        {row.expectedReturnDate ? fmt(row.expectedReturnDate) : "—"}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: COLORS.textMuted }}>{row.returnDate ? fmt(row.returnDate) : "—"}</TableCell>
                      <TableCell><StatusBadge status={row.status} /></TableCell>
                      <TableCell sx={{ fontSize: 12, color: COLORS.textMuted, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <Tooltip title={row.remarks || ""}><span>{row.remarks || "—"}</span></Tooltip>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => openView(row.allocationId)}
                              sx={{ color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: "6px", p: "4px 7px", "&:hover": { background: "#eff6ff" } }}>
                              <FaEye size={11} />
                            </IconButton>
                          </Tooltip>
                          {canWrite && row.status === "ACTIVE" && (
                            <Tooltip title="Mark as Returned">
                              <IconButton size="small"
                                onClick={() => { setReturnId(row.allocationId); setReturnConfirm(true); }}
                                sx={{ color: "#2e7d32", border: "1px solid #a5d6a7", borderRadius: "6px", p: "4px 8px", fontSize: 11, gap: 0.5, "&:hover": { background: "#e8f5e9" } }}>
                                <FaUndo size={11} />
                                <Typography fontSize={11} fontWeight={600}>Return</Typography>
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
      <Box sx={{ mt: 4 }}>
        <AssetOverview stats={overviewStats} loading={overviewLoading} recentAllocations={recentActivities} />
      </Box>

      {/* ── Allocate Modal (UNCHANGED) ───────────────────────────────────── */}
      <Dialog open={allocateOpen} onClose={() => setAllocateOpen(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: "12px" } } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
          <Typography fontWeight={700} fontSize={16}>Allocate Asset</Typography>
          <IconButton size="small" onClick={() => setAllocateOpen(false)}><FaTimes size={14} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}>
          {/* Asset */}
          <FormControl fullWidth size="small">
            <InputLabel shrink sx={{ fontSize: 13 }}>Asset *</InputLabel>
            <OutlinedInput readOnly notched label="Asset *" size="small"
              value={availableAssets.find((a) => a.assetId === form.assetId)
                ? `${availableAssets.find((a) => a.assetId === form.assetId).assetName}${availableAssets.find((a) => a.assetId === form.assetId).assetCode ? ` (${availableAssets.find((a) => a.assetId === form.assetId).assetCode})` : ""}`
                : ""}
              placeholder="Select asset..." onClick={(e) => setAssetAnchor(e.currentTarget)}
              endAdornment={<InputAdornment position="end"><Typography fontSize={12} color="#aaa">▾</Typography></InputAdornment>}
              sx={{ fontSize: 13, borderRadius: "8px", cursor: "pointer", caretColor: "transparent" }}
            />
            <Popover open={Boolean(assetAnchor)} anchorEl={assetAnchor}
              onClose={() => { setAssetAnchor(null); setAssetSearch(""); }}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              slotProps={{ paper: { sx: { width: assetAnchor?.offsetWidth, minWidth: 320, maxHeight: 280, display: "flex", flexDirection: "column" } } }}>
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
                      <ListItemText primary={a.assetName} secondary={a.assetCode || ""} primaryTypographyProps={{ fontSize: 13 }} secondaryTypographyProps={{ fontSize: 11 }} />
                    </ListItemButton>
                  )) : <ListItemButton disabled><ListItemText primary="No assets found" primaryTypographyProps={{ fontSize: 13 }} /></ListItemButton>;
                })()}
              </List>
            </Popover>
          </FormControl>
          {/* Assigned To */}
          <FormControl fullWidth size="small">
            <InputLabel shrink sx={{ fontSize: 13 }}>Assigned To *</InputLabel>
            <OutlinedInput readOnly notched label="Assigned To *" size="small"
              value={form.assignedTo || ""} placeholder="Select employee..." onClick={(e) => setAssignedToAnchor(e.currentTarget)}
              endAdornment={<InputAdornment position="end"><Typography fontSize={12} color="#aaa">▾</Typography></InputAdornment>}
              sx={{ fontSize: 13, borderRadius: "8px", cursor: "pointer", caretColor: "transparent" }}
            />
            <Popover open={Boolean(assignedToAnchor)} anchorEl={assignedToAnchor}
              onClose={() => { setAssignedToAnchor(null); setAssignedToSearch(""); }}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              slotProps={{ paper: { sx: { width: assignedToAnchor?.offsetWidth, minWidth: 320, maxHeight: 280, display: "flex", flexDirection: "column" } } }}>
              <Box sx={{ p: 1, borderBottom: "1px solid #f0f0f0" }}>
                <TextField autoFocus size="small" fullWidth placeholder="Search employee..."
                  value={assignedToSearch} onChange={(e) => setAssignedToSearch(e.target.value)}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><FaSearch size={11} color="#aaa" /></InputAdornment> } }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px", fontSize: 12 } }} />
              </Box>
              <List dense sx={{ overflowY: "auto", flex: 1 }}>
                {(() => {
                  const q = assignedToSearch.toLowerCase();
                  const filtered = allUsers.filter((u) => !q || u.userName?.toLowerCase().includes(q) || u.userEmail?.toLowerCase().includes(q));
                  return filtered.length > 0 ? filtered.map((u) => (
                    <ListItemButton key={u.userId} selected={form.assignedTo === u.userName}
                      onClick={() => { f("assignedTo", u.userName); setAssignedToAnchor(null); setAssignedToSearch(""); }} sx={{ py: 0.5 }}>
                      <ListItemText primary={u.userName} secondary={u.userEmail} primaryTypographyProps={{ fontSize: 13 }} secondaryTypographyProps={{ fontSize: 11 }} />
                    </ListItemButton>
                  )) : <ListItemButton disabled><ListItemText primary="No users found" primaryTypographyProps={{ fontSize: 13 }} /></ListItemButton>;
                })()}
              </List>
            </Popover>
          </FormControl>
          {/* Assigned By */}
          <FormControl fullWidth size="small">
            <InputLabel shrink sx={{ fontSize: 13 }}>Assigned By *</InputLabel>
            <OutlinedInput readOnly notched label="Assigned By *" size="small"
              value={form.assignedBy || ""} placeholder="Select user..." onClick={(e) => setAnchorEl(e.currentTarget)}
              endAdornment={<InputAdornment position="end"><Typography fontSize={12} color="#aaa">▾</Typography></InputAdornment>}
              sx={{ fontSize: 13, borderRadius: "8px", cursor: "pointer", caretColor: "transparent" }}
            />
            <Popover open={Boolean(anchorEl)} anchorEl={anchorEl}
              onClose={() => { setAnchorEl(null); setUserSearch(""); }}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              slotProps={{ paper: { sx: { width: anchorEl?.offsetWidth, minWidth: 320, maxHeight: 280, display: "flex", flexDirection: "column" } } }}>
              <Box sx={{ p: 1, borderBottom: "1px solid #f0f0f0" }}>
                <TextField autoFocus size="small" fullWidth placeholder="Search user..."
                  value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><FaSearch size={11} color="#aaa" /></InputAdornment> } }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px", fontSize: 12 } }} />
              </Box>
              <List dense sx={{ overflowY: "auto", flex: 1 }}>
                {(() => {
                  const q = userSearch.toLowerCase();
                  const filtered = adminUsers.filter((u) => !q || u.userName?.toLowerCase().includes(q) || u.userEmail?.toLowerCase().includes(q));
                  return filtered.length > 0 ? filtered.map((u) => (
                    <ListItemButton key={u.userId} selected={form.assignedBy === u.userName}
                      onClick={() => { f("assignedBy", u.userName); setAnchorEl(null); setUserSearch(""); }} sx={{ py: 0.5 }}>
                      <ListItemText primary={u.userName} secondary={u.userEmail} primaryTypographyProps={{ fontSize: 13 }} secondaryTypographyProps={{ fontSize: 11 }} />
                    </ListItemButton>
                  )) : <ListItemButton disabled><ListItemText primary="No users found" primaryTypographyProps={{ fontSize: 13 }} /></ListItemButton>;
                })()}
              </List>
            </Popover>
          </FormControl>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField label="Assigned Date *" type="date" size="small" fullWidth
              value={form.assignedDate} onChange={(e) => f("assignedDate", e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }} />
            <TextField label="Expected Return Date" type="date" size="small" fullWidth
              value={form.expectedReturnDate} onChange={(e) => f("expectedReturnDate", e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }} />
          </Box>
          <TextField label="Remarks" size="small" fullWidth multiline rows={2}
            value={form.remarks} onChange={(e) => f("remarks", e.target.value)}
            slotProps={{ htmlInput: { maxLength: 250 } }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setAllocateOpen(false)} sx={{ textTransform: "none", fontSize: 13 }}>Cancel</Button>
          <Button variant="contained" onClick={handleAllocate} disabled={saving}
            startIcon={saving ? <CircularProgress size={12} color="inherit" /> : <FaPlus size={11} />}
            sx={{ textTransform: "none", fontSize: 13, fontWeight: 600, borderRadius: "8px", background: COLORS.primary, boxShadow: "none", "&:hover": { background: COLORS.primaryDark } }}>
            {saving ? "Allocating..." : "Allocate"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── View Details Modal ───────────────────────────────────────────── */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: "12px" } } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
          <Typography fontWeight={700} fontSize={16}>Allocation Details</Typography>
          <IconButton size="small" onClick={() => setViewOpen(false)}><FaTimes size={14} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: "12px !important" }}>
          {viewLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
          ) : viewData ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {[
                ["Allocation ID",   viewData.allocationId],
                ["Asset",           `${viewData.assetName} (${viewData.assetCode || "—"})`],
                ["Location",        viewData.locationName || "—"],
                ["Assigned To",     viewData.assignedTo],
                ["Assigned By",     viewData.assignedBy],
                ["Assigned Date",   fmt(viewData.assignedDate)],
                ["Expected Return", viewData.expectedReturnDate ? fmt(viewData.expectedReturnDate) : "—"],
                ["Return Date",     viewData.returnDate ? fmt(viewData.returnDate) : "—"],
                ["Status",          viewData.status],
                ["Remarks",         viewData.remarks || "—"],
              ].map(([label, value]) => (
                <Box key={label} sx={{ display: "flex", gap: 1 }}>
                  <Typography fontSize={12} color={COLORS.textMuted} sx={{ minWidth: 130 }}>{label}</Typography>
                  <Typography fontSize={13} fontWeight={500}>{String(value)}</Typography>
                </Box>
              ))}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setViewOpen(false)} sx={{ textTransform: "none", fontSize: 13 }}>Close</Button>
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