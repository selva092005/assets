import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, List, ListItemButton,
  ListItemText, MenuItem, Select, Tab, Tabs, Table, TableBody,
  TableCell, TableHead, TableRow, TextField, Typography,
  FormControl, InputLabel, InputAdornment, OutlinedInput, Popover,
  Checkbox, Collapse, Tooltip
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { FormTextField, FormSelect } from "../components/FormFields";
import { FaExchangeAlt, FaCheck, FaTimes, FaSearch, FaClock, FaTruck, FaChevronDown, FaChevronUp, FaCheckCircle, FaTimesCircle, FaFileExport, FaFilter, FaEye, FaClipboardCheck, FaSyncAlt } from "react-icons/fa";
import toast from "../utils/toast.jsx";
import PageHeader from "../components/common/PageHeader";
import TableCard from "../components/common/TableCard";
import ConfirmDialog from "../components/common/ConfirmDialog";
import StatCard from "../components/common/StatCard";
import TablePagination from "../components/common/TablePagination";
import StatusBadge from "../components/common/StatusBadge";
import EmptyState from "../components/common/EmptyState";
import ActionBtn from "../components/common/ActionBtn";
import ErrorState from "../components/common/ErrorState";
import SkeletonLoader from "../components/common/SkeletonLoader";
import { COLORS, primaryBtnSx, outlinedBtnSx, inputSx, selectSx, chipSx, tabSx, premiumDialogPaperSx, premiumDialogTitleSx, premiumFormGroupSx, denseCellSx, searchFieldSx, resetBtnSx, dateFieldSx } from "../theme/tokens";
import { required, extractFieldErrors, isNotFutureDate } from "../utils/validate";
import {
  requestTransfer, approveTransfer, rejectTransfer, receiveTransfer,
  getAllTransfers, getTransferOverview, getAllLocations,
  approveBulkTransfers, rejectBulkTransfers, receiveBulkTransfers,
  exportTransfersToExcel, cancelTransfer, getTransferById,
} from "../services/transfer_service";
import { getAssets } from "../services/assets_service";

import InfoRow from "../components/common/InfoRow";

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

function today() {
  return new Date().toISOString().split("T")[0];
}

function fmt(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const CustomCheckboxIcon = () => (
  <Box sx={{
    width: 14,
    height: 14,
    borderRadius: "3px",
    border: "1.2px solid #cbd5e1",
    bgcolor: "#ffffff",
    transition: "all 120ms cubic-bezier(0.4, 0, 0.2, 1)",
    "&:hover": {
      borderColor: "#94a3b8",
      bgcolor: "#f8fafc",
    }
  }} />
);

const CustomCheckboxCheckedIcon = () => (
  <Box sx={{
    width: 14,
    height: 14,
    borderRadius: "3px",
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    border: "1.2px solid #2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 1px 3px rgba(37, 99, 235, 0.25)",
    color: "#ffffff",
    transform: "scale(1.05)",
    transition: "all 150ms cubic-bezier(0.175, 0.885, 0.32, 1.15)"
  }}>
    <svg width="7" height="7" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.5 4L3 5.5L6.5 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </Box>
);

const CustomCheckboxIndeterminateIcon = () => (
  <Box sx={{
    width: 14,
    height: 14,
    borderRadius: "3px",
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    border: "1.2px solid #2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 1px 3px rgba(37, 99, 235, 0.25)",
    color: "#ffffff",
    transform: "scale(1.05)",
    transition: "all 150ms cubic-bezier(0.175, 0.885, 0.32, 1.15)"
  }}>
    <Box sx={{ width: 6, height: 1.5, bgcolor: "#ffffff", borderRadius: "0.5px" }} />
  </Box>
);

export default function TransferPage() {
  const { userRole, userName, userEmail } = useSelector((s) => s.auth);
  const isAdmin = userRole === "admin";
  const canRequest = userRole === "admin" || userRole === "manager";

  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(0);
  const [showCount, setShowCount] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [myRequestsOnly, setMyRequestsOnly] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Details dialog state
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleExport = async () => {
    try {
      setExportLoading(true);
      await exportTransfersToExcel();
      toast.success("Transfer history exported successfully!");
    } catch (err) {
      toast.error("Failed to export transfer history.");
    } finally {
      setExportLoading(false);
    }
  };

  const handleResetFilters = () => {
    setStatusFilter("");
    setPriorityFilter("");
    setMyRequestsOnly(false);
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setPage(0);
    setSelectedIds([]);
    setExpandedId(null);
  };

  // Bulk action states
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState(""); // "APPROVE" | "REJECT" | "RECEIVE"
  const [bulkRemarks, setBulkRemarks] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);

  const isCheckable = (row) => {
    if (tab === 0) {
      return isAdmin && row.status === "PENDING";
    } else {
      return (isAdmin || userRole === "manager") && row.status === "IN_TRANSIT";
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const checkableIds = transfers.filter(isCheckable).map((t) => t.transferId);
      setSelectedIds(checkableIds);
    } else {
      setSelectedIds([]);
    }
  };

  const openBulkAction = (type) => {
    setBulkActionType(type);
    setBulkRemarks("");
    setBulkActionOpen(true);
  };

  const handleBulkActionSubmit = async () => {
    if (bulkActionType === "REJECT" && !bulkRemarks.trim()) {
      toast.error("Remarks are required to reject transfers");
      return;
    }
    setBulkSaving(true);
    try {
      let fn;
      if (bulkActionType === "APPROVE") fn = approveBulkTransfers;
      else if (bulkActionType === "REJECT") fn = rejectBulkTransfers;
      else if (bulkActionType === "RECEIVE") fn = receiveBulkTransfers;

      await fn({
        transferIds: selectedIds,
        resolvedBy: userName,
        remarks: bulkRemarks,
      });

      toast.success(`Bulk action '${bulkActionType}' completed successfully!`);
      setSelectedIds([]);
      setBulkActionOpen(false);
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      queryClient.invalidateQueries({ queryKey: ["transferOverview"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    } catch (e) {
      toast.error(e.response?.data?.message || "Bulk action failed");
    } finally {
      setBulkSaving(false);
    }
  };

  const queryClient = useQueryClient();

  // ── Query Fetchers ──────────────────────────────────────────────────────────
  const { data: transfersData, isLoading: loading, isError, error, refetch } = useQuery({
    queryKey: ["transfers", tab, page, showCount, debouncedSearch, statusFilter, priorityFilter, myRequestsOnly, startDate, endDate],
    queryFn: async () => {
      const params = {
        page,
        size: showCount,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(priorityFilter ? { priority: priorityFilter } : {}),
        ...(myRequestsOnly ? { requestedBy: userName || userEmail } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {})
      };
      if (tab === 0 && !statusFilter) params.status = "PENDING";
      const res = await getAllTransfers(params);
      return extractPage(res);
    },
    placeholderData: keepPreviousData,
  });

  const transfers = transfersData?.content || [];
  const totalPages = transfersData?.totalPages || 1;

  const { data: overview = { total: 0, pending: 0, approved: 0, rejected: 0, inTransit: 0 } } = useQuery({
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
    setAssetSearch("");
    setReqOpen(true);
  };

  const handleAssetSelect = (a, onChangeField) => {
    onChangeField(a.assetId);
    reqSetValue("toLocation", "");
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

  // ── Receive / Confirm Receipt Modal States & Handlers ───────────────────
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [receiveTransferItem, setReceiveTransferItem] = useState(null);
  const [receiveSaving, setReceiveSaving] = useState(false);

  const { control: receiveControl, handleSubmit: handleReceiveSubmit, reset: receiveReset } = useForm({
    defaultValues: {
      remarks: "",
      receivedDate: today(),
    }
  });

  const openReceive = (transfer) => {
    setReceiveTransferItem(transfer);
    receiveReset({ remarks: "", receivedDate: today() });
    setReceiveOpen(true);
  };

  // ── Self-cancellation States & Handlers ────────────────────────────────
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelTransferItem, setCancelTransferItem] = useState(null);
  const [cancelSaving, setCancelSaving] = useState(false);

  const openCancel = (transfer) => {
    setCancelTransferItem(transfer);
    setCancelConfirmOpen(true);
  };

  const confirmCancel = async () => {
    if (!cancelTransferItem) return;
    setCancelConfirmOpen(false);
    setCancelSaving(true);
    try {
      await cancelTransfer(cancelTransferItem.transferId, {
        resolvedBy: userName,
        remarks: "Cancelled by requester"
      });
      toast.success("Transfer request cancelled successfully");
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      queryClient.invalidateQueries({ queryKey: ["transferOverview"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to cancel transfer");
    } finally {
      setCancelSaving(false);
    }
  };

  const handleViewDetails = async (row) => {
    setViewOpen(true);
    setViewData(null);
    setViewLoading(true);
    try {
      const res = await getTransferById(row.transferId);
      setViewData(res?.data || res);
    } catch (err) {
      toast.error("Failed to load transfer details");
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const onConfirmReceive = async (data) => {
    setReceiveSaving(true);
    try {
      await receiveTransfer(receiveTransferItem.transferId, {
        resolvedBy: userName,
        remarks: data.remarks,
        receivedDate: data.receivedDate
      });
      toast.success("Transfer completed: Receipt confirmed!");
      setReceiveOpen(false);
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      queryClient.invalidateQueries({ queryKey: ["transferOverview"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to confirm receipt");
    } finally {
      setReceiveSaving(false);
    }
  };

  const selectedAsset = reqAssetId ? assets.find((a) => Number(a.assetId) === Number(reqAssetId)) : null;
  const fromLocation = selectedAsset?.locationName || "";

  const availableLocations = locations.filter((l) => {
    // 1. Cannot transfer to the exact same location
    if (l.locationName?.trim().toLowerCase() === fromLocation?.trim().toLowerCase()) return false;

    // 2. Ensure location belongs to the same company as the selected asset
    if (selectedAsset) {
      const assetComp = (selectedAsset.companyName || "").trim().toLowerCase();
      const locComp = (l.companyName || "").trim().toLowerCase();
      if (assetComp && locComp && assetComp !== locComp) {
        return false;
      }
    }
    return true;
  });

  const getStepStatus = (stepIndex, status) => {
    if (status === "REJECTED") {
      if (stepIndex === 0) return { label: "Requested", state: "done" };
      if (stepIndex === 1) return { label: "Rejected", state: "error" };
      return { label: "Cancelled", state: "disabled" };
    }
    if (status === "PENDING") {
      if (stepIndex === 0) return { label: "Requested", state: "done" };
      if (stepIndex === 1) return { label: "Approval Pending", state: "active" };
      return { label: "Transit", state: "disabled" };
    }
    if (status === "IN_TRANSIT") {
      if (stepIndex === 0) return { label: "Requested", state: "done" };
      if (stepIndex === 1) return { label: "Approved", state: "done" };
      if (stepIndex === 2) return { label: "In Transit", state: "active" };
      return { label: "Confirm Receipt", state: "disabled" };
    }
    if (status === "APPROVED") {
      return {
        label: stepIndex === 1 ? "Approved" : (stepIndex === 2 ? "In Transit" : (stepIndex === 3 ? "Completed" : "Requested")),
        state: "done"
      };
    }
    return { label: "", state: "disabled" };
  };

  const checkableTransfers = transfers.filter(isCheckable);
  const allCheckedOnPage = checkableTransfers.length > 0 && checkableTransfers.every(t => selectedIds.includes(t.transferId));
  const partialChecked = checkableTransfers.length > 0 && checkableTransfers.some(t => selectedIds.includes(t.transferId)) && !allCheckedOnPage;

  if (loading) {
    return <SkeletonLoader variant="list" statCount={5} columnCount={11} hasTabs={true} />;
  }

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

            {(userRole === "admin" || userRole === "manager") && (
              <Tooltip title="Export transfer logs to Excel">
                <span>
                  <Button
                    variant="outlined"
                    startIcon={exportLoading ? <CircularProgress size={11} /> : <FaFileExport size={10} />}
                    onClick={handleExport}
                    disabled={exportLoading}
                    sx={outlinedBtnSx}
                  >
                    Export
                  </Button>
                </span>
              </Tooltip>
            )}

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
          sm: "repeat(5, 1fr)"
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
        <StatCard label="In Transit" value={overview.inTransit || 0} icon={<FaTruck size={15} />} iconBg="#e0f2fe" iconColor="#0284c7" onClick={() => { setTab(1); setStatusFilter("IN_TRANSIT"); setPage(0); }} />
        <StatCard label="Approved" value={overview.approved} icon={<FaCheck size={15} />} iconBg="#ecfdf5" iconColor="#10b981" onClick={() => { setTab(1); setStatusFilter("APPROVED"); setPage(0); }} />
        <StatCard label="Rejected" value={overview.rejected} icon={<FaTimes size={15} />} iconBg="#ffe4e6" iconColor="#f43f5e" onClick={() => { setTab(1); setStatusFilter("REJECTED"); setPage(0); }} />
      </Box>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <Box sx={{ borderBottom: "1px solid #e5e7eb", mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(0); setStatusFilter(""); setPriorityFilter(""); setMyRequestsOnly(false); setSearchQuery(""); setStartDate(""); setEndDate(""); setSelectedIds([]); setExpandedId(null); }}
          sx={{ "& .MuiTabs-indicator": { backgroundColor: COLORS.primary, height: 2 }, minHeight: 0 }}>
          <Tab label={<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><FaClock size={10} />Pending Requests ({overview.pending || 0})</Box>}
            sx={{ ...tabSx, minHeight: 0, py: 1 }} />
          <Tab label={<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><FaExchangeAlt size={10} />All Transfers ({overview.total || 0})</Box>}
            sx={{ ...tabSx, minHeight: 0, py: 1 }} />
        </Tabs>
      </Box>

      {/* ── Filters (Pending and All Transfers tabs) ──────────────────────── */}
      {(tab === 0 || tab === 1) && (
        <Box sx={{ display: "flex", gap: 1.5, mb: 2, alignItems: "center", flexWrap: "wrap" }}>
          <TextField
            size="small"
            placeholder="Search asset, code, employee..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><FaSearch size={11} color="#aaa" /></InputAdornment> } }}
            sx={searchFieldSx(240, 300)}
          />

          {tab === 1 && (
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setSelectedIds([]); setExpandedId(null); }}
              displayEmpty
              size="small"
              sx={{ ...selectSx, minWidth: 130 }}
              startAdornment={
                <InputAdornment position="start" sx={{ mr: 0.25, pl: 0.5 }}>
                  <FaFilter size={9} color={COLORS.textMuted} />
                </InputAdornment>
              }
            >
              <MenuItem value="" sx={{ fontSize: 11.5 }}>All</MenuItem>
              <MenuItem value="PENDING" sx={{ fontSize: 11.5 }}>Pending</MenuItem>
              <MenuItem value="IN_TRANSIT" sx={{ fontSize: 11.5 }}>In Transit</MenuItem>
              <MenuItem value="APPROVED" sx={{ fontSize: 11.5 }}>Approved</MenuItem>
              <MenuItem value="REJECTED" sx={{ fontSize: 11.5 }}>Rejected</MenuItem>
            </Select>
          )}

          <Select
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(0); setSelectedIds([]); setExpandedId(null); }}
            displayEmpty
            size="small"
            sx={{ ...selectSx, minWidth: 130 }}
            startAdornment={
              <InputAdornment position="start" sx={{ mr: 0.25, pl: 0.5 }}>
                <FaFilter size={9} color={COLORS.textMuted} />
              </InputAdornment>
            }
          >
            <MenuItem value="" sx={{ fontSize: 11.5 }}>All</MenuItem>
            <MenuItem value="LOW" sx={{ fontSize: 11.5 }}>Low</MenuItem>
            <MenuItem value="MEDIUM" sx={{ fontSize: 11.5 }}>Medium</MenuItem>
            <MenuItem value="HIGH" sx={{ fontSize: 11.5 }}>High</MenuItem>
          </Select>

          <Chip
            label="My Requests"
            clickable
            color={myRequestsOnly ? "primary" : "default"}
            variant={myRequestsOnly ? "filled" : "outlined"}
            onClick={() => { setMyRequestsOnly(!myRequestsOnly); setPage(0); setSelectedIds([]); setExpandedId(null); }}
            sx={{
              height: 26,
              fontSize: 11,
              fontWeight: 500,
              borderRadius: "6px",
              borderColor: myRequestsOnly ? COLORS.primary : "#e0e0e0",
              bgcolor: myRequestsOnly ? `${COLORS.primary} !important` : "#ffffff",
              color: myRequestsOnly ? "#ffffff" : "#4b5563",
              "&:hover": {
                bgcolor: myRequestsOnly ? COLORS.primary : "#f3f4f6",
              }
            }}
          />

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted }}>From</Typography>
            <TextField
              type="date"
              size="small"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
              sx={dateFieldSx(130)}
            />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted }}>To</Typography>
            <TextField
              type="date"
              size="small"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
              sx={dateFieldSx(130)}
            />
          </Box>

          {/* Filter reset button */}
          <Tooltip title="Reset filters">
            <IconButton
              onClick={handleResetFilters}
              aria-label="Reset"
              sx={resetBtnSx}
            >
              <FaSyncAlt size={11} />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <TableCard>
        {isError ? (
          <ErrorState message={error?.message || error?.response?.data?.message} onRetry={refetch} />
        ) : transfers.length === 0 ? (
          <EmptyState icon={FaExchangeAlt} label={tab === 0 ? "No pending requests — all transfers are up to date." : "No transfer records found."} />
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 750, borderCollapse: "collapse" }}>
              <TableHead>
                <TableRow>
                  {((isAdmin || userRole === "manager")) && (
                    <TableCell sx={{ p: "4px 8px", width: 40, textAlign: "center", background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                      <Checkbox
                        size="small"
                        icon={<CustomCheckboxIcon />}
                        checkedIcon={<CustomCheckboxCheckedIcon />}
                        indeterminateIcon={<CustomCheckboxIndeterminateIcon />}
                        checked={allCheckedOnPage}
                        indeterminate={partialChecked}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        disabled={checkableTransfers.length === 0}
                      />
                    </TableCell>
                  )}
                  {((isAdmin || userRole === "manager")) && (
                    <TableCell sx={{ width: 40, background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }} />
                  )}
                  {["#", "Asset", "Code", "From → To", "Priority", "Expected Date", "Reason", "Requested By", "Date", "Status", "Actions"].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: "#64748b", whiteSpace: "nowrap", background: "#f8fafc", borderBottom: "2px solid #e2e8f0", textTransform: "uppercase", fontSize: 11 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {transfers.map((row, i) => {
                  const isSelected = selectedIds.includes(row.transferId);
                  const isExpanded = expandedId === row.transferId;
                  const canSelectRow = isCheckable(row);

                  return (
                    <tr key={row.transferId} style={{ display: "contents" }}>
                      <TableRow
                        sx={{
                          borderLeft: isSelected ? `3px solid ${COLORS.primary}` : "3px solid transparent",
                          background: isSelected ? "linear-gradient(90deg, rgba(37, 99, 235, 0.04) 0%, rgba(255, 255, 255, 0) 100%)" : "transparent",
                          transition: "all 180ms ease",
                          "&:hover": {
                            borderLeft: `3px solid ${COLORS.primary}`,
                            background: isSelected ? "linear-gradient(90deg, rgba(37, 99, 235, 0.08) 0%, rgba(255, 255, 255, 0) 100%)" : "#f0f7ff",
                          },
                          "& td": {
                            borderBottom: "1px solid #f1f5f9",
                            background: isSelected ? "transparent" : (i % 2 === 0 ? "#fff" : "#f8faff"),
                          }
                        }}
                      >
                        {((isAdmin || userRole === "manager")) && (
                          <TableCell sx={{ p: "4px 8px", textAlign: "center", verticalAlign: "middle" }}>
                            <Checkbox
                              size="small"
                              icon={<CustomCheckboxIcon />}
                              checkedIcon={<CustomCheckboxCheckedIcon />}
                              indeterminateIcon={<CustomCheckboxIndeterminateIcon />}
                              disabled={!canSelectRow}
                              checked={isSelected}
                              onChange={() => handleSelectOne(row.transferId)}
                              sx={{ p: 0.5 }}
                            />
                          </TableCell>
                        )}
                        {((isAdmin || userRole === "manager")) && (
                          <TableCell sx={{ p: "4px 8px", textAlign: "center", verticalAlign: "middle" }}>
                            <IconButton
                              size="small"
                              onClick={() => setExpandedId(isExpanded ? null : row.transferId)}
                              sx={{ color: COLORS.textMuted }}
                            >
                              {isExpanded ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
                            </IconButton>
                          </TableCell>
                        )}
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
                        <TableCell sx={{ fontSize: 11, color: COLORS.textMuted, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <Tooltip title={row.reason || ""} arrow placement="top">
                            <span>{row.reason}</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ fontSize: 11, color: COLORS.textMuted }}>{row.requestedBy}</TableCell>
                        <TableCell sx={{ fontSize: 11, whiteSpace: "nowrap" }}>{fmt(row.requestedAt)}</TableCell>
                        <TableCell><StatusBadge status={row.status} /></TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            <ActionBtn
                              title="View Details"
                              color="#3b82f6"
                              hoverBg="rgba(59, 130, 246, 0.08)"
                              onClick={() => handleViewDetails(row)}
                              sx={{ border: "none", background: "transparent" }}
                            >
                              <FaEye size={12} />
                            </ActionBtn>
                            {((isAdmin || userRole === "manager")) && (
                              <>
                                {row.status === "PENDING" && isAdmin && tab === 0 && (
                                  <>
                                    <ActionBtn
                                      title="Approve"
                                      color="#16a34a"
                                      hoverBg="rgba(22, 163, 74, 0.08)"
                                      onClick={() => openAction(row, "APPROVE")}
                                      sx={{ border: "none", background: "transparent" }}
                                    >
                                      <FaCheck size={11} />
                                    </ActionBtn>
                                    <ActionBtn
                                      title="Reject"
                                      color="#dc2626"
                                      hoverBg="rgba(220, 38, 38, 0.08)"
                                      onClick={() => openAction(row, "REJECT")}
                                      sx={{ border: "none", background: "transparent" }}
                                    >
                                      <FaTimes size={11} />
                                    </ActionBtn>
                                  </>
                                )}
                                {((row.status === "PENDING" && (row.requestedBy === userName || row.requestedBy === userEmail)) ||
                                  (row.status === "IN_TRANSIT" && isAdmin)) && (
                                    <ActionBtn
                                      title="Cancel"
                                      color="#e11d48"
                                      hoverBg="rgba(225, 29, 72, 0.08)"
                                      onClick={() => openCancel(row)}
                                      sx={{ border: "none", background: "transparent" }}
                                    >
                                      <FaTimes size={11} />
                                    </ActionBtn>
                                  )}
                                {row.status === "IN_TRANSIT" && (
                                  <ActionBtn
                                    title="Confirm Receipt"
                                    color="#2563eb"
                                    hoverBg="rgba(37, 99, 235, 0.08)"
                                    onClick={() => openReceive(row)}
                                    sx={{ border: "none", background: "transparent" }}
                                  >
                                    <FaClipboardCheck size={11} />
                                  </ActionBtn>
                                )}
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow sx={{ background: "#f8fafc" }}>
                          <TableCell colSpan={(isAdmin || userRole === "manager") ? 13 : 11} sx={{ p: 0, border: 0 }}>
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                              <Box sx={{ p: 3, pl: 6, borderBottom: "1px solid #e2e8f0" }}>
                                <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#475569", mb: 2.5, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                                  Transit Progress Tracker
                                </Typography>
                                <Box sx={{ display: "flex", alignItems: "flex-start", width: "100%", overflowX: "auto", py: 1 }}>
                                  <Box sx={{ display: "flex", width: "100%", justifyContent: "space-between", position: "relative", px: 2, minWidth: 600 }}>
                                    {[0, 1, 2, 3].map((idx) => {
                                      const stepInfo = getStepStatus(idx, row.status);
                                      const isLast = idx === 3;

                                      let bgColor = "#f1f5f9";
                                      let border = "2px solid #cbd5e1";
                                      let textColor = "#64748b";
                                      let icon = <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#94a3b8" }} />;

                                      if (stepInfo.state === "done") {
                                        bgColor = "#10b981";
                                        border = "2px solid #10b981";
                                        textColor = "#0f172a";
                                        icon = <FaCheck size={9} color="#fff" />;
                                      } else if (stepInfo.state === "active") {
                                        bgColor = "#e0f2fe";
                                        border = "2px solid #0284c7";
                                        textColor = "#0284c7";
                                        icon = <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#0284c7" }} />;
                                      } else if (stepInfo.state === "error") {
                                        bgColor = "#ffe4e6";
                                        border = "2px solid #f43f5e";
                                        textColor = "#f43f5e";
                                        icon = <FaTimes size={9} color="#fff" />;
                                      }

                                      const nextStepInfo = !isLast ? getStepStatus(idx + 1, row.status) : null;
                                      const connectorColor = (nextStepInfo && (nextStepInfo.state === "done" || nextStepInfo.state === "active")) ? "#2563eb" : "#e2e8f0";

                                      let dateStr = "";
                                      let actorStr = "";
                                      let descStr = "";
                                      if (idx === 0) {
                                        dateStr = fmt(row.requestedAt);
                                        actorStr = `By ${row.requestedBy}`;
                                      } else if (idx === 1) {
                                        dateStr = row.resolvedAt ? fmt(row.resolvedAt) : "";
                                        actorStr = row.status === "PENDING" ? "Awaiting admin" : `By ${row.resolvedBy || "Admin"}`;
                                        descStr = row.remarks && (row.status === "APPROVED" || row.status === "IN_TRANSIT" || row.status === "REJECTED") ? `"${row.remarks}"` : "";
                                      } else if (idx === 2) {
                                        dateStr = row.expectedDate ? `Expected: ${fmt(row.expectedDate)}` : "";
                                        actorStr = row.status === "APPROVED" ? "Delivered" : (row.status === "IN_TRANSIT" ? "On the way" : "");
                                      } else if (idx === 3) {
                                        dateStr = (row.status === "APPROVED") ? (row.receivedDate ? fmt(row.receivedDate) : (row.resolvedAt ? fmt(row.resolvedAt) : "")) : "";
                                        actorStr = row.status === "APPROVED" ? `By ${row.resolvedBy || "Recipient"}` : "";
                                        descStr = row.status === "APPROVED" && row.remarks ? `"${row.remarks}"` : "";
                                      }

                                      return (
                                        <Box key={idx} sx={{ flex: isLast ? "none" : 1, display: "flex", position: "relative" }}>
                                          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: 130, zIndex: 2 }}>
                                            <Box sx={{
                                              width: 26,
                                              height: 26,
                                              borderRadius: "50%",
                                              bgcolor: bgColor,
                                              border: border,
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              mb: 1,
                                              boxShadow: stepInfo.state === "active" ? "0 0 0 3px rgba(2, 132, 199, 0.15)" : "none",
                                            }}>
                                              {icon}
                                            </Box>
                                            <Typography sx={{ fontSize: 11, fontWeight: 700, color: textColor }}>
                                              {stepInfo.label}
                                            </Typography>
                                            <Typography sx={{ fontSize: 9.5, color: "#64748b", mt: 0.5, fontWeight: 500 }}>
                                              {actorStr}
                                            </Typography>
                                            <Typography sx={{ fontSize: 9, color: "#94a3b8", mt: 0.25 }}>
                                              {dateStr}
                                            </Typography>
                                            {descStr && (
                                              <Typography sx={{ fontSize: 9.5, color: "#475569", mt: 0.75, fontStyle: "italic", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                                {descStr}
                                              </Typography>
                                            )}
                                          </Box>

                                          {!isLast && (
                                            <Box sx={{
                                              position: "absolute",
                                              top: 13,
                                              left: 80,
                                              right: -50,
                                              height: 2,
                                              bgcolor: connectorColor,
                                              zIndex: 1,
                                            }} />
                                          )}
                                        </Box>
                                      );
                                    })}
                                  </Box>
                                </Box>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      )}
                    </tr >
                  );
                })}
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
              <FormControl fullWidth error={!!error} sx={{ mb: 1.5 }}>
                <Typography sx={{ fontSize: 11.5, color: COLORS.textMuted, mb: 0.5, fontWeight: 600 }}>
                  Asset *
                </Typography>
                <OutlinedInput
                  readOnly
                  size="small"
                  value={selectedAsset ? `${selectedAsset.assetName}${selectedAsset.assetCode ? ` (${selectedAsset.assetCode})` : ""}` : ""}
                  placeholder="Select asset to transfer..."
                  onClick={(e) => setAssetAnchor(e.currentTarget)}
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
                            primary={<Typography component="span" sx={{ fontSize: 11.5 }}>{a.assetName}</Typography>}
                            secondary={<Typography component="span" sx={{ fontSize: 10, color: "#64748b" }}>{`${a.assetCode || ""} • ${a.locationName || ""} • status: ${a.status || ""}`}</Typography>}
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
            <FormControl fullWidth sx={{ mb: 1.5 }}>
              <Typography sx={{ fontSize: 11.5, color: COLORS.textMuted, mb: 0.5, fontWeight: 600 }}>
                From Location
              </Typography>
              <OutlinedInput
                disabled
                size="small"
                value={fromLocation || "—"}
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

            <FormSelect
              name="toLocation"
              control={reqControl}
              rules={{ required: "Select a destination location" }}
              label="To Location *"
              disabled={reqSaving || !reqAssetId}
              displayEmpty
              renderValue={(value) => {
                if (!value) {
                  return <span style={{ color: "#aaa" }}>{!reqAssetId ? "Select an asset first..." : "Select destination..."}</span>;
                }
                return value;
              }}
            >
              {availableLocations.map((l) => (
                <MenuItem key={l.locationId || l.locationName} value={l.locationName} sx={{ fontSize: 11.5 }}>
                  {l.locationName}
                </MenuItem>
              ))}
            </FormSelect>
          </Box>

          {/* Priority & Expected Date */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
            <FormSelect
              name="priority"
              control={reqControl}
              rules={{ required: "Priority is required" }}
              label="Priority *"
              disabled={reqSaving}
            >
              <MenuItem value="LOW" sx={{ fontSize: 11.5 }}>Low</MenuItem>
              <MenuItem value="MEDIUM" sx={{ fontSize: 11.5 }}>Medium</MenuItem>
              <MenuItem value="HIGH" sx={{ fontSize: 11.5 }}>High</MenuItem>
            </FormSelect>

            <FormTextField
              name="expectedDate"
              control={reqControl}
              rules={{ required: "Expected transfer date is required" }}
              label="Expected Date *"
              type="date"
              disabled={reqSaving}
            />
          </Box>

          <FormTextField
            name="reason"
            control={reqControl}
            rules={{
              required: "Transfer reason is required",
              minLength: { value: 5, message: "Reason must be at least 5 characters" }
            }}
            label="Reason *"
            placeholder="Why is this asset being transferred?"
            multiline
            rows={2}
            disabled={reqSaving}
          />
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
          <FormTextField
            name="remarks"
            control={actionControl}
            rules={{
              required: actionType === "REJECT" ? "Remarks/reason is required for rejection" : false
            }}
            label={actionType === "REJECT" ? "Remarks *" : "Remarks (optional)"}
            placeholder="Add a note or remark..."
            multiline
            rows={2}
            disabled={actionSaving}
          />
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

      {/* ── Confirm Receipt Action Modal ──────────────────────────────── */}
      <Dialog open={receiveOpen} onClose={() => { if (!receiveSaving) { setReceiveOpen(false); receiveReset(); } }} maxWidth="xs" fullWidth
        slotProps={{ paper: { sx: premiumDialogPaperSx } }}>
        <DialogTitle sx={premiumDialogTitleSx}>
          <span style={{ display: "flex", alignItems: "center", gap: "8px", color: "#2563eb", fontWeight: 700 }}>
            <FaClipboardCheck size={14} /> Confirm Asset Receipt
          </span>
          <IconButton size="small" onClick={() => { if (!receiveSaving) { setReceiveOpen(false); receiveReset(); } }} sx={{ color: COLORS.textFaint }}><FaTimes size={13} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.75, pt: "18px !important", pb: 2 }}>
          {receiveTransferItem && (
            <Box sx={{ background: "#fbfcfd", borderRadius: "8px", p: 1.5, border: "1px solid #e2e8f0" }}>
              <Typography fontSize={12} fontWeight={700} color="#1e1b4b" mb={0.5}>{receiveTransferItem.assetName}</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
                <Typography fontSize={10.5} sx={{ color: COLORS.textMuted }}>{receiveTransferItem.fromLocation}</Typography>
                <Typography fontSize={12} sx={{ color: "#2563eb", fontWeight: 700 }}>→</Typography>
                <Typography fontSize={10.5} sx={{ color: "#2563eb", fontWeight: 600 }}>{receiveTransferItem.toLocation}</Typography>
              </Box>
              <Typography fontSize={10.5} color={COLORS.textFaint}>Please confirm that the asset has physically arrived and is in good condition.</Typography>
            </Box>
          )}
          <FormTextField
            name="receivedDate"
            control={receiveControl}
            rules={{
              required: "Received date is required",
              validate: (val) => isNotFutureDate(val) || "Received date cannot be in the future"
            }}
            label="Received Date *"
            type="date"
            disabled={receiveSaving}
          />
          <FormTextField
            name="remarks"
            control={receiveControl}
            label="Remarks (optional)"
            placeholder="Add delivery note or verification remark..."
            multiline
            rows={2}
            disabled={receiveSaving}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, borderTop: "1px solid #f1f5f9", pt: 1.5 }}>
          <Button onClick={() => { if (!receiveSaving) { setReceiveOpen(false); receiveReset(); } }} sx={outlinedBtnSx}>Cancel</Button>
          <Button variant="contained" onClick={handleReceiveSubmit(onConfirmReceive)} disabled={receiveSaving}
            startIcon={receiveSaving ? <CircularProgress size={11} color="inherit" /> : <FaCheck size={10} />}
            sx={{ ...primaryBtnSx, background: "#2563eb", "&:hover": { background: "#1d4ed8" } }}>
            {receiveSaving ? "Saving..." : "Confirm Receipt"}
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

      <ConfirmDialog
        open={cancelConfirmOpen}
        title="Confirm Cancellation"
        message={`Are you sure you want to cancel the transfer request for ${cancelTransferItem?.assetName}?`}
        onConfirm={confirmCancel}
        onCancel={() => setCancelConfirmOpen(false)}
        confirmLabel="Yes, Cancel"
      />

      {/* ── Floating Bulk Action Ribbon ─────────────────────────────────── */}
      {selectedIds.length > 0 && (
        <Box sx={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          bgcolor: "#0f172a",
          color: "#ffffff",
          px: 3,
          py: 1.25,
          borderRadius: 3,
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          display: "flex",
          alignItems: "center",
          gap: 3,
          animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
          "@keyframes slideUp": {
            from: { transform: "translate(-50%, 40px)", opacity: 0 },
            to: { transform: "translate(-50%, 0)", opacity: 1 }
          }
        }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.02em" }}>
            {selectedIds.length} {selectedIds.length === 1 ? "Transfer" : "Transfers"} Selected
          </Typography>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            {tab === 0 ? (
              <>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<FaCheck size={9} />}
                  onClick={() => openBulkAction("APPROVE")}
                  sx={{ bgcolor: "#16a34a", "&:hover": { bgcolor: "#15803d" }, textTransform: "none", py: 0.5, px: 2, borderRadius: "6px", fontWeight: 700, fontSize: 11.5, boxShadow: "none" }}
                >
                  Bulk Approve
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<FaTimes size={9} />}
                  onClick={() => openBulkAction("REJECT")}
                  sx={{ bgcolor: "#dc2626", "&:hover": { bgcolor: "#b91c1c" }, textTransform: "none", py: 0.5, px: 2, borderRadius: "6px", fontWeight: 700, fontSize: 11.5, boxShadow: "none" }}
                >
                  Bulk Reject
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                size="small"
                startIcon={<FaClipboardCheck size={10} />}
                onClick={() => openBulkAction("RECEIVE")}
                sx={{ bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" }, textTransform: "none", py: 0.5, px: 2, borderRadius: "6px", fontWeight: 700, fontSize: 11.5, boxShadow: "none" }}
              >
                Bulk Confirm Receipt
              </Button>
            )}
            <Button
              variant="text"
              size="small"
              onClick={() => setSelectedIds([])}
              sx={{ color: "#94a3b8", "&:hover": { color: "#ffffff" }, textTransform: "none", fontSize: 11.5 }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      )}

      {/* ── Bulk Action Dialog ─────────────────────────────────────────── */}
      <Dialog open={bulkActionOpen} onClose={() => { if (!bulkSaving) { setBulkActionOpen(false); } }} maxWidth="xs" fullWidth
        slotProps={{ paper: { sx: premiumDialogPaperSx } }}>
        <DialogTitle sx={premiumDialogTitleSx}>
          <span style={{ display: "flex", alignItems: "center", gap: "8px", color: bulkActionType === "APPROVE" ? "#16a34a" : bulkActionType === "REJECT" ? "#dc2626" : "#2563eb", fontWeight: 700 }}>
            {bulkActionType === "APPROVE" && <FaCheckCircle size={14} />}
            {bulkActionType === "REJECT" && <FaTimesCircle size={14} />}
            {bulkActionType === "RECEIVE" && <FaClipboardCheck size={14} />}
            {bulkActionType === "APPROVE" && "Bulk Approve Transfers"}
            {bulkActionType === "REJECT" && "Bulk Reject Transfers"}
            {bulkActionType === "RECEIVE" && "Bulk Confirm Receipt"}
          </span>
          <IconButton size="small" onClick={() => { if (!bulkSaving) { setBulkActionOpen(false); } }} sx={{ color: COLORS.textFaint }}><FaTimes size={13} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.75, pt: "18px !important", pb: 2 }}>
          <Box sx={{ background: "#fbfcfd", borderRadius: "8px", p: 1.5, border: "1px solid #e2e8f0", mb: 1 }}>
            <Typography fontSize={11.5} fontWeight={600} color="#1e1b4b">
              You are applying this action to {selectedIds.length} selected transfer {selectedIds.length === 1 ? "request" : "requests"}.
            </Typography>
            <Typography fontSize={10.5} color={COLORS.textFaint} mt={0.5}>
              This operation is atomic. If any validation fails, the entire batch will be rolled back.
            </Typography>
          </Box>
          <TextField
            label={bulkActionType === "REJECT" ? "Remarks *" : "Remarks (optional)"}
            placeholder={bulkActionType === "REJECT" ? "Remarks/reason is required for rejection..." : "Add comments for this batch operation..."}
            multiline
            rows={2}
            value={bulkRemarks}
            onChange={(e) => setBulkRemarks(e.target.value)}
            disabled={bulkSaving}
            fullWidth
            sx={inputSx}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, borderTop: "1px solid #f1f5f9", pt: 1.5 }}>
          <Button onClick={() => { if (!bulkSaving) { setBulkActionOpen(false); } }} sx={outlinedBtnSx}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleBulkActionSubmit}
            disabled={bulkSaving}
            startIcon={bulkSaving ? <CircularProgress size={11} color="inherit" /> : <FaCheck size={10} />}
            sx={{
              ...primaryBtnSx,
              background: bulkActionType === "APPROVE" ? "#16a34a" : bulkActionType === "REJECT" ? "#dc2626" : "#2563eb",
              "&:hover": {
                background: bulkActionType === "APPROVE" ? "#15803d" : bulkActionType === "REJECT" ? "#b91c1c" : "#1d4ed8"
              }
            }}
          >
            {bulkSaving ? "Processing..." : (bulkActionType === "RECEIVE" ? "Confirm Receipt" : "Submit Action")}
          </Button>
        </DialogActions>
      </Dialog>
      {/* ── View Details Modal ───────────────────────────────────────────── */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: premiumDialogPaperSx } }}>
        <DialogTitle sx={premiumDialogTitleSx}>
          <span>Transfer Details</span>
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
                  <FaExchangeAlt size={18} color={COLORS.primary} />
                </Box>
                <Typography sx={{ fontSize: "11px", fontWeight: 800, color: "#1e293b", mb: 0.5 }}>
                  {viewData.assetName}
                </Typography>
                <Chip
                  label={viewData.status}
                  size="small"
                  sx={{
                    height: 16, fontSize: 8, fontWeight: 700, borderRadius: "3px",
                    background: viewData.status === "PENDING" ? "#fffbeb"
                      : viewData.status === "IN_TRANSIT" ? "#e0f2fe"
                        : viewData.status === "APPROVED" ? "#ecfdf5"
                          : "#ffe4e6",
                    color: viewData.status === "PENDING" ? "#d97706"
                      : viewData.status === "IN_TRANSIT" ? "#0284c7"
                        : viewData.status === "APPROVED" ? "#10b981"
                          : "#f43f5e",
                    "& .MuiChip-label": { px: 1 }
                  }}
                />
              </Box>

              {/* Right Mini Specifications Panel */}
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 9.5, fontWeight: 800, color: COLORS.primary, mb: 0.75, textTransform: "uppercase", letterSpacing: "0.05em" }}>Transfer Route</Typography>
                <Table size="small" sx={{ mb: 1.5, border: "1px solid " + COLORS.borderLight }}>
                  <TableBody>
                    <InfoRow label="Asset Code" value={viewData.assetCode || "—"} bg />
                    <InfoRow label="From Location" value={viewData.fromLocation || "—"} />
                    <InfoRow label="To Location" value={viewData.toLocation || "—"} bg />
                    <InfoRow label="Priority" value={viewData.priority || "MEDIUM"} />
                  </TableBody>
                </Table>

                <Typography sx={{ fontSize: 9.5, fontWeight: 800, color: COLORS.primary, mb: 0.75, textTransform: "uppercase", letterSpacing: "0.05em" }}>Timeline & Participants</Typography>
                <Table size="small" sx={{ mb: 1.5, border: "1px solid " + COLORS.borderLight }}>
                  <TableBody>
                    <InfoRow label="Requested By" value={viewData.requestedBy} bg />
                    <InfoRow label="Requested At" value={viewData.requestedAt ? new Date(viewData.requestedAt).toLocaleString("en-IN") : "—"} />
                    <InfoRow label="Resolved By" value={viewData.resolvedBy || "—"} bg />
                    <InfoRow label="Resolved At" value={viewData.resolvedAt ? new Date(viewData.resolvedAt).toLocaleString("en-IN") : "—"} />
                    <InfoRow label="Received Date" value={viewData.receivedDate ? fmt(viewData.receivedDate) : "—"} bg />
                  </TableBody>
                </Table>

                {viewData.reason && (
                  <>
                    <Typography sx={{ fontSize: 9.5, fontWeight: 800, color: COLORS.primary, mb: 0.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Reason</Typography>
                    <Box sx={{ p: 1, border: "1px solid " + COLORS.borderLight, borderRadius: "3px", background: "#fcfcfd", mb: 1.5 }}>
                      <Typography sx={{ fontSize: 10, color: COLORS.text, whiteSpace: "pre-line" }}>{viewData.reason}</Typography>
                    </Box>
                  </>
                )}

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
    </Box>
  );
}
