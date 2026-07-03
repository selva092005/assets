import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, InputAdornment,
  MenuItem, Popover, List, ListItemButton, ListItemText,
  Select, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Tooltip, Typography, InputLabel, FormControl, OutlinedInput, FormHelperText,
  Avatar,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { FormTextField } from "../components/FormFields";
import {
  FaPlus, FaUndo, FaTimes, FaBoxOpen, FaSearch,
  FaEye, FaExclamationTriangle, FaDownload, FaFileExport,
  FaLayerGroup, FaCheckCircle, FaBoxes, FaClock, FaCalendarAlt, FaSyncAlt,
} from "react-icons/fa";
import { getUsers } from "../services/users_service";
import toast from "../utils/toast.jsx";

import {
  allocateAsset, allocateAssetBulk, getAllAllocations, getAllocationById, returnAsset, returnAssetBulk, getAllocationOverview,
} from "../services/allocation_service";
import { getAssets, getImageUrl } from "../services/assets_service";
import { exportAllocations } from "../services/report_service";
import PageHeader from "../components/common/PageHeader";
import TableCard from "../components/common/TableCard";
import ConfirmDialog from "../components/common/ConfirmDialog";
import ActionBtn from "../components/common/ActionBtn";
import TablePagination from "../components/common/TablePagination";
import PremiumCard from "../components/common/PremiumCard";
import StatCard from "../components/common/StatCard";
import ErrorState from "../components/common/ErrorState";
import SkeletonLoader from "../components/common/SkeletonLoader";
import { COLORS, outlinedBtnSx, primaryBtnSx, selectSx, inputSx, premiumDialogPaperSx, premiumDialogTitleSx, premiumFormGroupSx, denseCellSx, searchFieldSx, resetBtnSx, dateFieldSx } from "../theme/tokens";
import { required, isValidDate, isDateAfter, extractFieldErrors } from "../utils/validate";
import StatusBadge from "../components/common/StatusBadge";
import EmptyState from "../components/common/EmptyState";
import InfoRow from "../components/common/InfoRow";

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
      <Avatar
        src={getImageUrl(row.assetImagePath)}
        variant="rounded"
        sx={{
          width: 30,
          height: 30,
          borderRadius: "8px",
          bgcolor: iconBg,
          color: iconColor,
          border: `1.5px solid ${isReturned ? "#d8b4fe" : isOverdue ? "#fde047" : "#a7f3d0"}`,
          fontSize: "12px",
          fontWeight: 800,
          flexShrink: 0,
          "& img": { objectFit: "cover" }
        }}
      >
        {row.assetName?.charAt(0).toUpperCase() || "A"}
      </Avatar>
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

export default function AssetAllocationPage() {
  const { userRole, userName } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const canWrite = userRole === "admin" || userRole === "manager";
  const queryClient = useQueryClient();

  // ── Table state ───────────────────────────────────────────────────────────
  const [page, setPage] = useState(0);
  const [showCount, setShowCount] = useState(10);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 600);
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // ── Allocate modal state ──────────────────────────────────────────────────
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: allocationsData, isLoading: loading, isError, error, refetch } = useQuery({
    queryKey: ["allocations", page, showCount, debouncedSearch, statusFilter, fromDate, toDate],
    queryFn: async () => {
      const params = { page, size: showCount };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      const res = await getAllAllocations(params);
      return res?.data || res;
    },
    placeholderData: keepPreviousData,
    staleTime: 30000,
  });

  const allocations = allocationsData?.content || [];
  const totalPages = allocationsData?.totalPages || 0;
  const totalElements = allocationsData?.totalElements || 0;

  const { data: overviewStats = { total: 0, active: 0, returned: 0, overdue: 0, awaitingReturn: 0 }, isLoading: overviewLoading } = useQuery({
    queryKey: ["allocationOverview"],
    queryFn: async () => {
      const res = await getAllocationOverview();
      const data = res?.data || res;
      return {
        total: data.total ?? 0,
        active: data.active ?? 0,
        returned: data.returned ?? 0,
        overdue: data.overdue ?? 0,
        awaitingReturn: data.awaitingReturn ?? 0,
      };
    },
    staleTime: 30000,
  });

  // Optimize: Avoid duplicate request to allocations API on initial load if the parameters are the same as default.
  const needsSeparateRecentFetch = page !== 0 || !!debouncedSearch || !!statusFilter || !!fromDate || !!toDate;

  const { data: recentQueryData } = useQuery({
    queryKey: ["recentAllocations"],
    queryFn: async () => {
      const res = await getAllAllocations({ page: 0, size: 10 });
      const pageData = res?.data || res;
      return pageData?.content || (Array.isArray(pageData) ? pageData : []);
    },
    enabled: needsSeparateRecentFetch,
    staleTime: 30000,
  });

  const recentActivities = (() => {
    if (!needsSeparateRecentFetch && allocationsData?.content) {
      const items = allocationsData.content;
      const sorted = [...items];
      sorted.sort((a, b) => (b.assignedDate || "") > (a.assignedDate || "") ? 1 : -1);
      return sorted;
    }
    const items = recentQueryData || [];
    const sorted = [...items];
    sorted.sort((a, b) => (b.assignedDate || "") > (a.assignedDate || "") ? 1 : -1);
    return sorted;
  })();

  // Fetch available assets (enabled when allocateOpen is true)
  const { data: availableAssets = [] } = useQuery({
    queryKey: ["availableAssets"],
    queryFn: async () => {
      const res = await getAssets({ page: 0, size: 200 });
      return extractList(res).filter((a) => a.status === "AVAILABLE");
    },
    enabled: allocateOpen,
  });

  // Fetch users (enabled when allocateOpen is true)
  const { data: usersData = { allUsers: [], adminUsers: [] } } = useQuery({
    queryKey: ["allocateUsers"],
    queryFn: async () => {
      const res = await getUsers({ page: 0, size: 200 });
      const all = extractList(res);
      const admins = all.filter((u) => u.userRole === "ADMIN" || u.userRole === "MANAGER");
      return {
        allUsers: all,
        adminUsers: admins.length > 0 ? admins : all,
      };
    },
    enabled: allocateOpen,
  });

  const allUsers = usersData.allUsers;
  const adminUsers = usersData.adminUsers;

  const { control, handleSubmit, reset, setValue, setError, watch } = useForm({
    defaultValues: {
      assetId: "",
      assetIds: [],
      assignedTo: "",
      assignedBy: userName || "",
      assignedDate: today(),
      expectedReturnDate: "",
      remarks: "",
    }
  });

  const formAssignedDate = watch("assignedDate");

  const [userSearch, setUserSearch] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [assignedToSearch, setAssignedToSearch] = useState("");
  const [assignedToAnchor, setAssignedToAnchor] = useState(null);
  const [assetSearch, setAssetSearch] = useState("");
  const [assetAnchor, setAssetAnchor] = useState(null);

  // ── Return / View state ───────────────────────────────────────────────────
  const [returnConfirm, setReturnConfirm] = useState(false);
  const [returnId, setReturnId] = useState(null);
  const [returnAssignedDate, setReturnAssignedDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [returnDateError, setReturnDateError] = useState("");
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  // ── Bulk Return state ──────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkReturnOpen, setBulkReturnOpen] = useState(false);
  const [bulkReturnDate, setBulkReturnDate] = useState(today());
  const [bulkCondition, setBulkCondition] = useState("GOOD");
  const [bulkReturning, setBulkReturning] = useState(false);
  const [bulkReturnDateError, setBulkReturnDateError] = useState("");

  const handleStatusChange = (e) => { setStatusFilter(e.target.value); setPage(0); };
  const handleFromDate = (e) => { setFromDate(e.target.value); setPage(0); };
  const handleToDate = (e) => { setToDate(e.target.value); setPage(0); };

  // ── Clear / Reset all filters ─────────────────────────────────────────────
  const clearFilters = () => {
    setSearch(""); setStatusFilter("");
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

  const openAllocate = async (preselectedAssetId = null) => {
    const actualId = (preselectedAssetId && typeof preselectedAssetId !== "object") ? preselectedAssetId : null;
    reset({
      assetId: actualId || "",
      assetIds: actualId ? [actualId] : [],
      assignedTo: "",
      assignedBy: userName || "",
      assignedDate: today(),
      expectedReturnDate: "",
      remarks: "",
    });
    setUserSearch(""); setAssignedToSearch(""); setAssetSearch("");
    setAllocateOpen(true);
  };

  useEffect(() => {
    const assetIdParam = searchParams.get("assetId");
    if (assetIdParam && canWrite) {
      openAllocate(Number(assetIdParam));
      setSearchParams({});
    }
  }, [searchParams, canWrite]);

  const handleAllocate = async (data) => {
    setSaving(true);
    try {
      if (data.assetIds && data.assetIds.length > 0) {
        const sanitizedIds = data.assetIds
          .map(Number)
          .filter((id) => !isNaN(id) && id > 0);
        await allocateAssetBulk({
          assetIds: sanitizedIds,
          assignedTo: data.assignedTo,
          assignedBy: data.assignedBy || userName,
          assignedDate: data.assignedDate,
          expectedReturnDate: data.expectedReturnDate || null,
          remarks: data.remarks || null,
        });
      } else {
        await allocateAsset({
          assetId: Number(data.assetId),
          assignedTo: data.assignedTo,
          assignedBy: data.assignedBy || userName,
          assignedDate: data.assignedDate,
          expectedReturnDate: data.expectedReturnDate || null,
          remarks: data.remarks || null,
        });
      }
      toast.success("Asset(s) allocated successfully");
      setAllocateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["allocations"] });
      queryClient.invalidateQueries({ queryKey: ["allocationOverview"] });
      queryClient.invalidateQueries({ queryKey: ["recentAllocations"] });
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
          toast.error(err.response?.data?.message || "Allocation failed");
        }
      } else {
        toast.error(err.response?.data?.message || "Allocation failed");
      }
    } finally { setSaving(false); }
  };

  const handleReturnClick = (row) => {
    setReturnId(row.allocationId);
    setReturnAssignedDate(row.assignedDate || "");
    setReturnDate(new Date().toISOString().split("T")[0]);
    setReturnDateError("");
    setReturnConfirm(true);
  };

  const handleReturnConfirmSubmit = async () => {
    if (!returnDate) {
      setReturnDateError("Actual return date is required");
      return;
    }
    if (returnAssignedDate && returnDate < returnAssignedDate) {
      setReturnDateError(`Return date cannot be before assigned date (${returnAssignedDate})`);
      return;
    }
    try {
      await returnAsset(returnId, returnDate);
      toast.success("Asset returned successfully");
      queryClient.invalidateQueries({ queryKey: ["allocations"] });
      queryClient.invalidateQueries({ queryKey: ["allocationOverview"] });
      queryClient.invalidateQueries({ queryKey: ["recentAllocations"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setReturnConfirm(false);
      setReturnId(null);
    } catch (e) {
      toast.error(e.response?.data?.message || "Return failed");
    }
  };

  const handleBulkReturnSubmit = async () => {
    if (!bulkReturnDate) {
      setBulkReturnDateError("Actual return date is required");
      return;
    }
    const selectedAllocations = allocations.filter(a => selectedIds.includes(a.allocationId));
    const maxAssignedDate = selectedAllocations.reduce((max, a) => {
      if (!a.assignedDate) return max;
      return a.assignedDate > max ? a.assignedDate : max;
    }, "");

    if (maxAssignedDate && bulkReturnDate < maxAssignedDate) {
      setBulkReturnDateError(`Return date cannot be before the latest assigned date (${maxAssignedDate})`);
      return;
    }

    setBulkReturning(true);
    try {
      await returnAssetBulk({
        allocationIds: selectedIds,
        returnDate: bulkReturnDate,
        returnedCondition: bulkCondition,
      });
      toast.success(`Successfully returned ${selectedIds.length} asset(s)`);
      queryClient.invalidateQueries({ queryKey: ["allocations"] });
      queryClient.invalidateQueries({ queryKey: ["allocationOverview"] });
      queryClient.invalidateQueries({ queryKey: ["recentAllocations"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setBulkReturnOpen(false);
      setSelectedIds([]);
    } catch (e) {
      toast.error(e.response?.data?.message || "Bulk return failed. Please try again.");
    } finally {
      setBulkReturning(false);
    }
  };


  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return <SkeletonLoader variant="list" statCount={5} columnCount={11} />;
  }

  return (
    <Box sx={{ p: 0 }}>

      {/* ── Page Header with reset hook ──────────────────────────────────── */}
      <PageHeader
        title="Asset Allocation"
        subtitle="Allocate, track, assign and manage employee asset assignments"
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

            {canWrite && (
              <Box sx={{ display: "flex", gap: 1 }}>
                {selectedIds.length > 0 && (
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<FaUndo size={11} />}
                    onClick={() => {
                      setBulkReturnDate(new Date().toISOString().split("T")[0]);
                      setBulkReturnDateError("");
                      setBulkCondition("GOOD");
                      setBulkReturnOpen(true);
                    }}
                    sx={{ ...primaryBtnSx, background: "#ef4444", "&:hover": { background: "#dc2626" } }}
                  >
                    Return Selected ({selectedIds.length})
                  </Button>
                )}
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
                  onClick={() => openAllocate(null)}
                  sx={{ ...primaryBtnSx, background: COLORS.primary, "&:hover": { background: COLORS.primaryDark } }}
                >
                  Allocate Asset
                </Button>
              </Box>
            )}
          </Box>
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
        <StatCard label="Total Records" value={totalElements} icon={<FaBoxes size={15} />} iconBg="#e8eaf6" iconColor="#3949ab" onClick={() => { setStatusFilter(""); setPage(0); }} />
        <StatCard label="Active" value={activeCount} icon={<FaCheckCircle size={15} />} iconBg="#ecfdf5" iconColor="#10b981" onClick={() => { setStatusFilter("ACTIVE"); setPage(0); }} />
        <StatCard label="Returned" value={returnedCount} icon={<FaLayerGroup size={15} />} iconBg="#eff6ff" iconColor="#2563eb" onClick={() => { setStatusFilter("RETURNED"); setPage(0); }} />
        <StatCard label="Overdue" value={overdueCount} icon={<FaClock size={15} />} iconBg="#fffbeb" iconColor="#d97706" onClick={() => { setStatusFilter("ACTIVE"); setPage(0); }} />
      </Box>

      {/* (AssetOverview moved below the table) */}

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Search asset, code, employee…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><FaSearch size={11} color="#aaa" /></InputAdornment> } }}
          sx={searchFieldSx(240, 300)}
        />
        <Select
          size="small" value={statusFilter} onChange={handleStatusChange} displayEmpty
          sx={{ ...selectSx, minWidth: 130 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="ACTIVE">Active</MenuItem>
          <MenuItem value="RETURNED">Returned</MenuItem>
        </Select>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted }}>From</Typography>
          <TextField
            type="date"
            size="small"
            value={fromDate}
            onChange={handleFromDate}
            sx={dateFieldSx(130)}
          />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted }}>To</Typography>
          <TextField
            type="date"
            size="small"
            value={toDate}
            onChange={handleToDate}
            sx={dateFieldSx(130)}
          />
        </Box>

        {/* Reset icon button — same style as existing app buttons */}
        <Tooltip title="Reset filters">
          <IconButton
            onClick={clearFilters}
            aria-label="Reset"
            sx={resetBtnSx}
          >
            <FaSyncAlt size={11} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <TableCard>
        {isError ? (
          <ErrorState message={error?.message || error?.response?.data?.message} onRetry={refetch} />
        ) : allocations.length === 0 ? (
          <EmptyState icon={FaBoxOpen} label="No allocation records found." />
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 860, tableLayout: "auto", borderCollapse: "collapse" }}>
              <TableHead>
                <TableRow>
                  {canWrite && (
                    <TableCell sx={{
                      width: 40,
                      background: "#f8fafc",
                      borderBottom: "2px solid #e2e8f0",
                      px: 1
                    }}>
                      <Checkbox
                        size="small"
                        checked={allocations.filter(row => row.status === "ACTIVE").length > 0 && selectedIds.length === allocations.filter(row => row.status === "ACTIVE").length}
                        indeterminate={selectedIds.length > 0 && selectedIds.length < allocations.filter(row => row.status === "ACTIVE").length}
                        onChange={(e) => {
                          const active = allocations.filter(row => row.status === "ACTIVE");
                          if (e.target.checked) {
                            setSelectedIds(active.map(a => a.allocationId));
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                        sx={{ p: 0.5 }}
                      />
                    </TableCell>
                  )}
                  {["#", "Asset", "Code", "Assigned To", "Assigned By", "Date", "Expected Return", "Return Date", "Status", "Remarks", "Actions"].map((h) => (
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
                {allocations.map((row, i) => {
                  const overdue = isOverdue(row);
                  const isRowSelected = selectedIds.includes(row.allocationId);
                  return (
                    <TableRow key={row.allocationId} sx={{ borderLeft: "3px solid transparent", transition: "all 180ms ease", "&:last-child td": { border: 0 }, "&:hover": { borderLeft: "3px solid #3b82f6", "& td": { background: overdue ? "#fff7ed" : "#f0f7ff" } }, "& td": { background: overdue ? "#fffbeb" : i % 2 === 0 ? "#fff" : "#f8faff", borderBottom: "1px solid #f1f5f9" } }}>
                      {canWrite && (
                        <TableCell sx={{ verticalAlign: "middle", px: 1 }}>
                          {row.status === "ACTIVE" ? (
                            <Checkbox
                              size="small"
                              checked={isRowSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedIds([...selectedIds, row.allocationId]);
                                } else {
                                  setSelectedIds(selectedIds.filter(id => id !== row.allocationId));
                                }
                              }}
                              sx={{ p: 0.5 }}
                            />
                          ) : (
                            <Checkbox size="small" disabled sx={{ p: 0.5, opacity: 0.3 }} />
                          )}
                        </TableCell>
                      )}
                      <TableCell sx={{ verticalAlign: "middle", color: COLORS.textFaint }}>{page * showCount + i + 1}</TableCell>
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
                           <ActionBtn
                             title="View Details"
                             color="#3b82f6"
                             hoverBg="rgba(59, 130, 246, 0.08)"
                             onClick={() => openView(row.allocationId)}
                             sx={{ border: "none", background: "transparent" }}
                           >
                             <FaEye size={11} />
                           </ActionBtn>
                           {canWrite && row.status === "ACTIVE" && (
                             <ActionBtn
                               title="Mark as Returned"
                               color="#10b981"
                               hoverBg="rgba(16, 185, 129, 0.08)"
                               onClick={() => handleReturnClick(row)}
                               sx={{ border: "none", background: "transparent" }}
                             >
                               <FaUndo size={11} />
                             </ActionBtn>
                           )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <TablePagination page={page} totalPages={totalPages} onPageChange={(pg) => setPage(pg)} />
          </Box>
        )}
      </TableCard>

      {/* ── Asset Overview ──────────────────────────────────────────────── */}
      <Box sx={{ mt: 2 }}>
        <AssetOverview stats={overviewStats} loading={overviewLoading} recentAllocations={recentActivities} />
      </Box>

      {/* ── Allocate Modal (UNCHANGED) ───────────────────────────────────── */}
      {/* ── Dialog to allocate asset ── */}
      <Dialog open={allocateOpen} onClose={() => { if (!saving) { setAllocateOpen(false); reset(); } }} maxWidth="sm" fullWidth slotProps={{ paper: { sx: premiumDialogPaperSx } }}>
        <DialogTitle sx={premiumDialogTitleSx}>
          <span>Allocate Asset</span>
          <IconButton size="small" onClick={() => { if (!saving) { setAllocateOpen(false); reset(); } }} sx={{ color: COLORS.textFaint }}><FaTimes size={13} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.75, pt: "18px !important", pb: 2 }}>
          {/* Asset */}
          {/* Asset */}
          <Controller
            name="assetIds"
            control={control}
            rules={{
              validate: (val) => (val && val.length > 0) || "Select at least one asset to allocate"
            }}
            render={({ field, fieldState: { error } }) => {
              const selectedAssetsText = field.value && field.value.length > 0
                ? field.value.map(id => {
                    const found = availableAssets.find(a => a.assetId === id);
                    return found ? `${found.assetName}${found.assetCode ? ` (${found.assetCode})` : ""}` : "";
                  }).filter(Boolean).join(", ")
                : "";

              return (
                <FormControl fullWidth error={!!error} sx={{ mb: 1.5 }}>
                  <Typography sx={{ fontSize: 11.5, color: COLORS.textMuted, mb: 0.5, fontWeight: 600 }}>
                    Asset(s) *
                  </Typography>
                  <OutlinedInput
                    readOnly
                    size="small"
                    value={selectedAssetsText}
                    placeholder="Select asset(s) to allocate..."
                    onClick={(e) => setAssetAnchor(e.currentTarget)}
                    error={!!error}
                    endAdornment={<InputAdornment position="end"><Typography fontSize={11} color="#aaa">▾</Typography></InputAdornment>}
                    sx={{
                      background: "#ffffff",
                      borderRadius: "6px",
                      minHeight: 30,
                      fontSize: 11.5,
                      cursor: "pointer",
                      caretColor: "transparent",
                      transition: "all 100ms ease",
                      "& .MuiOutlinedInput-input": {
                        py: "4px !important",
                        px: "8px !important",
                        cursor: "pointer",
                        whiteSpace: "normal"
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
                  <Popover open={Boolean(assetAnchor)} anchorEl={assetAnchor}
                    onClose={() => { setAssetAnchor(null); setAssetSearch(""); }}
                    anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                    slotProps={{ paper: { sx: { width: assetAnchor?.offsetWidth, minWidth: 320, maxHeight: 280, display: "flex", flexDirection: "column", borderRadius: "10px", boxShadow: "0 10px 25px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0" } } }}>
                    <Box sx={{ p: 1, borderBottom: "1px solid #f0f0f0", display: "flex", gap: 1, alignItems: "center" }}>
                      <TextField autoFocus size="small" fullWidth placeholder="Search asset..."
                        value={assetSearch} onChange={(e) => setAssetSearch(e.target.value)}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><FaSearch size={11} color="#aaa" /></InputAdornment> } }}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px", fontSize: 11.5 } }} />
                      {field.value && field.value.length > 0 && (
                        <Button size="small" onClick={() => field.onChange([])} sx={{ minWidth: "auto", fontSize: 10, py: 0.5, px: 1, textTransform: "none", color: "#ef4444", fontWeight: 600, "&:hover": { background: "rgba(239, 68, 68, 0.08)" } }}>
                          Clear
                        </Button>
                      )}
                    </Box>
                    <List dense sx={{ overflowY: "auto", flex: 1 }}>
                      {(() => {
                        const q = assetSearch.toLowerCase();
                        const filtered = availableAssets.filter((a) => !q || a.assetName?.toLowerCase().includes(q) || a.assetCode?.toLowerCase().includes(q));
                        return filtered.length > 0 ? filtered.map((a) => {
                          const isSelected = (field.value || []).includes(a.assetId);
                          return (
                            <ListItemButton key={a.assetId} onClick={() => {
                              const newValue = isSelected
                                ? (field.value || []).filter(id => id !== a.assetId)
                                : [...(field.value || []), a.assetId];
                              field.onChange(newValue);
                            }} sx={{ py: 0.5 }}>
                              <Checkbox size="small" checked={isSelected} sx={{ p: 0.5, mr: 1 }} />
                              <ListItemText
                                primary={<Typography component="span" sx={{ fontSize: 12 }}>{a.assetName}</Typography>}
                                secondary={<Typography component="span" sx={{ fontSize: 10.5, color: "#64748b" }}>{a.assetCode || ""}</Typography>}
                              />
                            </ListItemButton>
                          );
                        }) : <ListItemButton disabled><ListItemText primary={<Typography component="span" sx={{ fontSize: 12 }}>No assets found</Typography>} /></ListItemButton>;
                      })()}
                    </List>
                    <Box sx={{ p: 1, borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", borderBottomLeftRadius: "10px", borderBottomRightRadius: "10px" }}>
                      <Typography sx={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 500 }}>
                        {field.value?.length || 0} selected
                      </Typography>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => { setAssetAnchor(null); setAssetSearch(""); }}
                        sx={{
                          py: 0.5,
                          px: 1.5,
                          fontSize: 11.5,
                          textTransform: "none",
                          background: COLORS.primary,
                          color: "#ffffff",
                          borderRadius: "4px",
                          fontWeight: 600,
                          "&:hover": { background: COLORS.primaryDark }
                        }}
                      >
                        Done
                      </Button>
                    </Box>
                  </Popover>
                </FormControl>
              );
            }}
          />

          {/* Assigned To */}
          <Controller
            name="assignedTo"
            control={control}
            rules={{
              required: "Employee name is required",
              validate: (val) => val !== userName || "You cannot allocate an asset to yourself"
            }}
            render={({ field, fieldState: { error } }) => (
              <FormControl fullWidth error={!!error} sx={{ mb: 1.5 }}>
                <Typography sx={{ fontSize: 11.5, color: COLORS.textMuted, mb: 0.5, fontWeight: 600 }}>
                  Assigned To *
                </Typography>
                <OutlinedInput
                  readOnly
                  size="small"
                  value={field.value || ""}
                  placeholder="Select employee..."
                  onClick={(e) => setAssignedToAnchor(e.currentTarget)}
                  error={!!error}
                  endAdornment={<InputAdornment position="end"><Typography fontSize={11} color="#aaa">▾</Typography></InputAdornment>}
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
                <Popover open={Boolean(assignedToAnchor)} anchorEl={assignedToAnchor}
                  onClose={() => { setAssignedToAnchor(null); setAssignedToSearch(""); }}
                  anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                  slotProps={{ paper: { sx: { width: assignedToAnchor?.offsetWidth, minWidth: 320, maxHeight: 280, display: "flex", flexDirection: "column", borderRadius: "10px", boxShadow: "0 10px 25px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0" } } }}>
                  <Box sx={{ p: 1, borderBottom: "1px solid #f0f0f0" }}>
                    <TextField autoFocus size="small" fullWidth placeholder="Search employee..."
                      value={assignedToSearch} onChange={(e) => setAssignedToSearch(e.target.value)}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start"><FaSearch size={11} color="#aaa" /></InputAdornment> } }}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px", fontSize: 11.5 } }} />
                  </Box>
                  <List dense sx={{ overflowY: "auto", flex: 1 }}>
                    {(() => {
                      const q = assignedToSearch.toLowerCase();
                      const filtered = allUsers.filter((u) => u.userName !== userName && (!q || u.userName?.toLowerCase().includes(q) || u.userEmail?.toLowerCase().includes(q)));
                      return filtered.length > 0 ? filtered.map((u) => (
                        <ListItemButton key={u.userId} selected={field.value === u.userName}
                          onClick={() => { field.onChange(u.userName); setAssignedToAnchor(null); setAssignedToSearch(""); }} sx={{ py: 0.5 }}>
                          <ListItemText
                            primary={
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Typography component="span" sx={{ fontSize: 12, fontWeight: 500 }}>{u.userName}</Typography>
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
                            secondary={<Typography component="span" sx={{ fontSize: 10.5, color: "#64748b" }}>{u.userEmail}</Typography>}
                          />
                        </ListItemButton>
                      )) : <ListItemButton disabled><ListItemText primary={<Typography component="span" sx={{ fontSize: 12 }}>No users found</Typography>} /></ListItemButton>;
                    })()}
                  </List>
                </Popover>
              </FormControl>
            )}
          />

          {/* Assigned By */}
          <Controller
            name="assignedBy"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth sx={{ mb: 1.5 }}>
                <Typography sx={{ fontSize: 11.5, color: COLORS.textMuted, mb: 0.5, fontWeight: 600 }}>
                  Assigned By
                </Typography>
                <OutlinedInput
                  disabled
                  size="small"
                  value={field.value || userName || ""}
                  sx={{
                    background: "#f8fafc",
                    borderRadius: "6px",
                    height: 30,
                    fontSize: 11.5,
                    transition: "all 100ms ease",
                    "& .MuiOutlinedInput-input": {
                      py: "4px !important",
                      px: "8px !important",
                    },
                    "& fieldset": { borderColor: "#cbd5e1" },
                    "& .MuiOutlinedInput-input.Mui-disabled": {
                      WebkitTextFillColor: "#475569",
                    }
                  }}
                />
              </FormControl>
            )}
          />

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <FormTextField
              name="assignedDate"
              control={control}
              rules={{ required: "Assigned date is required" }}
              label="Assigned Date *"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <FormTextField
              name="expectedReturnDate"
              control={control}
              rules={{
                validate: (val) => {
                  if (!val) return true;
                  return isDateAfter(formAssignedDate, val) || "Must be on or after the assigned date";
                }
              }}
              label="Expected Return Date"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

          <FormTextField
            name="remarks"
            control={control}
            label="Remarks"
            placeholder="Add any details or notes..."
            multiline
            rows={2}
            slotProps={{ htmlInput: { maxLength: 250 } }}
            sx={{ "& .MuiOutlinedInput-root": { height: "auto" } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, borderTop: "1px solid #f1f5f9", pt: 1.5 }}>
          <Button onClick={() => { setAllocateOpen(false); reset(); }} sx={outlinedBtnSx}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit(handleAllocate)} disabled={saving}
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
                    <FaBoxOpen size={18} color={COLORS.textFaint} />
                  )}
                </Box>
                <Typography sx={{ fontSize: "11px", fontWeight: 800, color: "#1e293b", mb: 0.5 }}>
                  {viewData.assetName}
                </Typography>
                <Chip
                  label={viewData.status}
                  size="small"
                  sx={{
                    height: 16, fontSize: 8, fontWeight: 700, borderRadius: "3px",
                    background: viewData.status === "ACTIVE" ? "#e8f5e9" : "#f3f4f6",
                    color: viewData.status === "ACTIVE" ? "#2e7d32" : "#6b7280",
                    "& .MuiChip-label": { px: 1 }
                  }}
                />
              </Box>

              {/* Right Mini Specifications Panel */}
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 9.5, fontWeight: 800, color: COLORS.primary, mb: 0.75, textTransform: "uppercase", letterSpacing: "0.05em" }}>Allocation Information</Typography>
                <Table size="small" sx={{ mb: 1.5, border: "1px solid " + COLORS.borderLight }}>
                  <TableBody>
                    <InfoRow label="Asset Code" value={viewData.assetCode || "—"} bg />
                    <InfoRow label="Location" value={viewData.locationName || "—"} />
                    <InfoRow label="Assigned To" value={viewData.assignedTo} bg />
                    <InfoRow label="Assigned By" value={viewData.assignedBy} />
                  </TableBody>
                </Table>

                <Typography sx={{ fontSize: 9.5, fontWeight: 800, color: COLORS.primary, mb: 0.75, textTransform: "uppercase", letterSpacing: "0.05em" }}>Timeline Details</Typography>
                <Table size="small" sx={{ mb: 1.5, border: "1px solid " + COLORS.borderLight }}>
                  <TableBody>
                    <InfoRow label="Assigned Date" value={fmt(viewData.assignedDate)} bg />
                    <InfoRow label="Expected Return" value={viewData.expectedReturnDate ? fmt(viewData.expectedReturnDate) : "—"} />
                    <InfoRow label="Return Date" value={viewData.returnDate ? fmt(viewData.returnDate) : "—"} bg />
                  </TableBody>
                </Table>

                {viewData.remarks && (
                  <>
                    <Typography sx={{ fontSize: 9.5, fontWeight: 800, color: COLORS.primary, mb: 0.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Remarks</Typography>
                    <Box sx={{ p: 1, border: "1px solid " + COLORS.borderLight, borderRadius: "3px", background: "#fcfcfd" }}>
                      <Typography sx={{ fontSize: 10, color: COLORS.text, whiteSpace: "pre-line" }}>{viewData.remarks}</Typography>
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

      {/* ── Return Confirm Dialog Modal ── */}
      <Dialog
        open={returnConfirm}
        onClose={() => { setReturnConfirm(false); setReturnId(null); }}
        PaperProps={{ sx: premiumDialogPaperSx }}
      >
        <DialogTitle sx={premiumDialogTitleSx}>Return Asset</DialogTitle>
        <DialogContent sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography sx={{ fontSize: 12, color: "#64748b" }}>
            Specify the actual return date for this asset. The asset status will be updated to Available.
          </Typography>
          <TextField
            label="Actual Return Date"
            type="date"
            fullWidth
            value={returnDate}
            onChange={(e) => {
              setReturnDate(e.target.value);
              setReturnDateError("");
            }}
            error={!!returnDateError}
            helperText={returnDateError}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={inputSx}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setReturnConfirm(false); setReturnId(null); }} sx={outlinedBtnSx}>
            Cancel
          </Button>
          <Button onClick={handleReturnConfirmSubmit} variant="contained" sx={primaryBtnSx}>
            Return Asset
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Bulk Return Confirm Dialog Modal ── */}
      <Dialog
        open={bulkReturnOpen}
        onClose={() => { if (!bulkReturning) setBulkReturnOpen(false); }}
        PaperProps={{ sx: premiumDialogPaperSx }}
      >
        <DialogTitle sx={premiumDialogTitleSx}>Bulk Return Assets</DialogTitle>
        <DialogContent sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2, pt: "18px !important" }}>
          <Typography sx={{ fontSize: 12, color: "#64748b" }}>
            You are about to return <strong>{selectedIds.length}</strong> selected asset(s). Specify the return date and condition.
          </Typography>
          <TextField
            label="Actual Return Date"
            type="date"
            fullWidth
            value={bulkReturnDate}
            onChange={(e) => {
              setBulkReturnDate(e.target.value);
              setBulkReturnDateError("");
            }}
            error={!!bulkReturnDateError}
            helperText={bulkReturnDateError}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={inputSx}
          />
          <FormControl fullWidth sx={{ mt: 1 }}>
            <Typography sx={{ fontSize: 11.5, color: COLORS.textMuted, mb: 0.5, fontWeight: 600 }}>
              Returned Condition
            </Typography>
            <Select
              value={bulkCondition}
              onChange={(e) => setBulkCondition(e.target.value)}
              size="small"
              sx={selectSx}
            >
              <MenuItem value="GOOD">Good</MenuItem>
              <MenuItem value="BAD">Bad</MenuItem>
              <MenuItem value="DAMAGED">Damaged</MenuItem>
              <MenuItem value="POOR">Poor</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setBulkReturnOpen(false)} sx={outlinedBtnSx} disabled={bulkReturning}>
            Cancel
          </Button>
          <Button onClick={handleBulkReturnSubmit} variant="contained" disabled={bulkReturning}
            startIcon={bulkReturning ? <CircularProgress size={12} color="inherit" /> : null}
            sx={{ ...primaryBtnSx, background: "#ef4444", "&:hover": { background: "#dc2626" } }}>
            {bulkReturning ? "Returning..." : "Return Assets"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}