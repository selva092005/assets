import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
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
import { FaTimes, FaSearch, FaEye, FaPlus, FaCheck, FaBan, FaHourglassHalf, FaWrench, FaTools, FaCheckCircle, FaUpload } from "react-icons/fa";
import { MdRefresh } from "react-icons/md";
import toast from "../utils/toast.jsx";

import { createRequest, getRequests, updateRequestStatus, getRequestOverview, uploadFile } from "../services/request_service";
import { getAssets, getAssetTypes } from "../services/assets_service";
import { getAllAllocations } from "../services/allocation_service";
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

const REQUEST_TYPES = ["NEW_ASSET", "REPAIR", "REPLACE", "LOST", "RETURN"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

export default function AssetRequestPage() {
  const { userRole, userName } = useSelector((s) => s.auth);
  const isAdminOrManager = userRole === "admin" || userRole === "manager";
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(0);
  const [showCount, setShowCount] = useState(10);

  const [requestOpen, setRequestOpen] = useState(false);
  const [respondOpen, setRespondOpen] = useState(false);
  const [respondData, setRespondData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const [assetAnchor, setAssetAnchor] = useState(null);
  const [assetSearch, setAssetSearch] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'approve' | 'reject' | 'progress' | 'resolve'
  const actionRemarksRef = useRef("");
  const actionCostRef = useRef("");

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: requestPage = { content: [], totalElements: 0 }, isLoading: loading, isError, error, refetch } = useQuery({
    queryKey: ["requests", searchInput, statusFilter, typeFilter, page, showCount],
    queryFn: async () => {
      const params = {
        page,
        size: showCount,
      };
      if (searchInput.trim()) params.search = searchInput.trim();
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.requestType = typeFilter;
      // Employees see only their own requests
      if (!isAdminOrManager) params.username = userName;
      return await getRequests(params);
    },
    placeholderData: keepPreviousData,
  });

  const { data: overview = { total: 0, pending: 0, inProgress: 0, resolved: 0, rejected: 0 } } = useQuery({
    queryKey: ["requests-overview", userName, isAdminOrManager],
    queryFn: () => getRequestOverview(isAdminOrManager ? null : userName),
  });

  // Get active allocations of the employee to report issues
  const { data: myAllocations = [] } = useQuery({
    queryKey: ["my-allocations", userName],
    queryFn: async () => {
      const res = await getAllAllocations({ search: userName, status: "ACTIVE" });
      return res?.data?.content || res?.data || res || [];
    },
    enabled: !isAdminOrManager,
  });

  // Get asset types for procurement requests
  const { data: assetTypes = [] } = useQuery({
    queryKey: ["asset-types-simple"],
    queryFn: getAssetTypes,
  });

  // ── Forms ────────────────────────────────────────────────────────────────
  const { control, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      requestType: "NEW_ASSET",
      assetId: "",
      typeId: "",
      priority: "LOW",
      description: "",
    }
  });

  const formRequestType = watch("requestType");
  const formAssetId = watch("assetId");

  const openRequestModal = () => {
    reset({
      requestType: "NEW_ASSET",
      assetId: "",
      typeId: "",
      priority: "LOW",
      description: "",
    });
    setSelectedFile(null);
    setRequestOpen(true);
  };

  const handleRequestSubmit = async (data) => {
    setSaving(true);
    let attachmentPath = null;
    try {
      if (data.requestType === "REPAIR" && selectedFile) {
        const fileRes = await uploadFile(selectedFile);
        // Backend upload controller returns a response containing the file path
        attachmentPath = fileRes?.filePath || fileRes;
      }
      await createRequest({
        requestedBy: userName,
        requestType: data.requestType,
        assetId: data.requestType !== "NEW_ASSET" && data.assetId ? Number(data.assetId) : null,
        typeId: data.requestType === "NEW_ASSET" && data.typeId ? Number(data.typeId) : null,
        priority: data.priority,
        description: data.description,
        attachmentPath
      });
      toast.success("Request submitted successfully!");
      setRequestOpen(false);
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["requests-overview"] });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit request");
    } finally {
      setSaving(false);
    }
  };

  const openRespondModal = (req) => {
    setRespondData(req);
    actionRemarksRef.current = "";
    actionCostRef.current = "";
    setRespondOpen(true);
  };

  const triggerAction = (action) => {
    setConfirmAction(action);
    setConfirmOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!respondData) return;
    setSaving(true);
    setConfirmOpen(false);

    let nextStatus = "PENDING";
    if (confirmAction === "approve") nextStatus = "APPROVED";
    if (confirmAction === "reject") nextStatus = "REJECTED";
    if (confirmAction === "progress") nextStatus = "IN_PROGRESS";
    if (confirmAction === "resolve") nextStatus = "RESOLVED";

    try {
      await updateRequestStatus(respondData.requestId, {
        status: nextStatus,
        remarks: actionRemarksRef.current,
        cost: confirmAction === "resolve" && actionCostRef.current ? parseFloat(actionCostRef.current) : undefined,
        adminUser: userName,
      });
      toast.success(`Request status updated to ${nextStatus}`);
      setRespondOpen(false);
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["requests-overview"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update request status");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <SkeletonLoader variant="list" statCount={4} columnCount={8} />;
  }

  const listData = requestPage?.data?.content || requestPage?.content || [];
  const totalElements = requestPage?.data?.totalElements || requestPage?.totalElements || 0;

  return (
    <Box sx={{ p: 0 }}>
      <PageHeader
        title={isAdminOrManager ? "Service & Procurement Requests" : "My Service & Asset Requests"}
        subtitle={isAdminOrManager ? "Review and respond to employee asset requests and damage reports" : "Submit new asset requests or report maintenance issues on your devices"}
        actions={
          !isAdminOrManager && (
            <Button
              variant="contained"
              startIcon={<FaPlus size={10} />}
              onClick={openRequestModal}
              sx={primaryBtnSx}
            >
              New Request
            </Button>
          )
        }
      />

      {/* KPI Overviews */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <StatCard label="Total Requests" value={overview.total} icon={<FaTools size={15} />} iconBg="#eef2ff" iconColor="#4f46e5" />
        <StatCard label="Pending Approval" value={overview.pending} icon={<FaHourglassHalf size={14} />} iconBg="#ffe4e6" iconColor="#f43f5e" onClick={() => { setStatusFilter("PENDING"); setPage(0); }} />
        <StatCard label="Under Action" value={overview.inProgress} icon={<FaWrench size={14} />} iconBg="#eff6ff" iconColor="#2563eb" onClick={() => { setStatusFilter("IN_PROGRESS"); setPage(0); }} />
        <StatCard label="Resolved Tickets" value={overview.resolved} icon={<FaCheckCircle size={14} />} iconBg="#ecfdf5" iconColor="#10b981" onClick={() => { setStatusFilter("RESOLVED"); setPage(0); }} />
      </Box>

      {/* Filters Bar */}
      <Box sx={{ display: "flex", gap: 1.5, mb: 2.5, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Search requests, users, descriptions..."
          value={searchInput}
          onChange={(e) => { setSearchInput(e.target.value); setPage(0); }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><FaSearch size={11} color="#aaa" /></InputAdornment> } }}
          sx={searchFieldSx(280, 340)}
        />
        <Select
          size="small"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          displayEmpty
          sx={{ ...selectSx, minWidth: 150 }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          {["PENDING", "IN_PROGRESS", "APPROVED", "REJECTED", "RESOLVED"].map(s => (
            <MenuItem key={s} value={s} sx={{ fontSize: 12 }}>{s}</MenuItem>
          ))}
        </Select>
        <Select
          size="small"
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
          displayEmpty
          sx={{ ...selectSx, minWidth: 150 }}
        >
          <MenuItem value="">All Request Types</MenuItem>
          {REQUEST_TYPES.map(t => (
            <MenuItem key={t} value={t} sx={{ fontSize: 12 }}>{t.replace("_", " ")}</MenuItem>
          ))}
        </Select>

        <Tooltip title="Reset filters">
          <IconButton
            onClick={() => { setSearchInput(""); setStatusFilter(""); setTypeFilter(""); setPage(0); }}
            sx={resetBtnSx}
          >
            <MdRefresh size={15} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Requests Table */}
      <TableCard>
        {listData.length === 0 ? (
          <EmptyState icon={FaTools} label="No request records found." />
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  {["#", "Type", "Requester", "Asset/Category", "Priority", "Status", "Request Date", "Actions"].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: "#64748b", background: "#f8fafc" }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {listData.map((row, index) => (
                  <TableRow key={row.requestId} sx={{ "&:hover": { bgcolor: "#f1f5f9" } }}>
                    <TableCell sx={{ fontSize: 11 }}>{page * showCount + index + 1}</TableCell>
                    <TableCell sx={{ fontSize: 11.5, fontWeight: 700, color: COLORS.primary }}>
                      {row.requestType?.replace("_", " ")}
                    </TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{row.requestedBy}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>
                      {row.assetName ? (
                        <Box>
                          <Typography sx={{ fontSize: 11, fontWeight: 600 }}>{row.assetName}</Typography>
                          <Typography sx={{ fontSize: 9.5, color: "#64748b" }}>{row.assetCode}</Typography>
                        </Box>
                      ) : (
                        row.typeName || "—"
                      )}
                    </TableCell>
                    <TableCell sx={{ fontSize: 11 }}>
                      <Chip
                        label={row.priority}
                        size="small"
                        sx={{
                          height: 16,
                          fontSize: 9,
                          bgcolor: row.priority === "HIGH" ? "#fee2e2" : row.priority === "MEDIUM" ? "#fef3c7" : "#f1f5f9",
                          color: row.priority === "HIGH" ? "#ef4444" : row.priority === "MEDIUM" ? "#d97706" : "#64748b"
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: 11 }}><StatusBadge status={row.status} /></TableCell>
                    <TableCell sx={{ fontSize: 11, color: COLORS.textMuted }}>{row.requestDate}</TableCell>
                    <TableCell sx={{ py: 0.5 }}>
                      <ActionBtn
                        title={isAdminOrManager ? "Review & Respond" : "View Details"}
                        color={isAdminOrManager ? "#4f46e5" : "#3b82f6"}
                        onClick={() => openRespondModal(row)}
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
              totalPages={Math.ceil(totalElements / showCount) || 1}
              onPageChange={setPage}
            />
          </Box>
        )}
      </TableCard>

      <Dialog
        open={requestOpen}
        onClose={() => !saving && setRequestOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: premiumDialogPaperSx } }}
      >
        <DialogTitle sx={premiumDialogTitleSx}>
          <Typography fontWeight={800} fontSize="14px" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FaTools size={14} style={{ color: COLORS.primary }} /> Submit Service / Asset Request
          </Typography>
          <IconButton size="small" onClick={() => !saving && setRequestOpen(false)} sx={{ color: COLORS.textFaint }} disabled={saving}>
            <FaTimes size={13} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: "20px !important", pb: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Request Type */}
          <FormSelect
            name="requestType"
            control={control}
            label="Request Purpose *"
            options={REQUEST_TYPES.map(t => ({ value: t, label: t.replace("_", " ") }))}
            onChange={(e, rhfOnChange) => {
              rhfOnChange(e.target.value);
              setValue("assetId", "");
              setValue("typeId", "");
            }}
          />

          {/* Conditional Asset Selection (Issue Reporting) */}
          {formRequestType !== "NEW_ASSET" && (
            <Controller
              name="assetId"
              control={control}
              rules={{ required: "Selecting your asset is required for reports" }}
              render={({ field, fieldState: { error } }) => (
                <FormControl fullWidth error={!!error} sx={{ mb: 1.5 }}>
                  <Typography sx={{ fontSize: 11.5, color: COLORS.textMuted, mb: 0.5, fontWeight: 600 }}>Select Assigned Device *</Typography>
                  <OutlinedInput
                    readOnly
                    size="small"
                    value={myAllocations.find((a) => a.assetId === field.value)
                      ? `${myAllocations.find((a) => a.assetId === field.value).assetName} (${myAllocations.find((a) => a.assetId === field.value).assetCode})`
                      : ""}
                    placeholder="Choose your device..."
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
                    slotProps={{ paper: { sx: { width: assetAnchor?.offsetWidth, maxHeight: 200 } } }}
                  >
                    <List dense sx={{ overflowY: "auto", maxPanelHeight: 180 }}>
                      {myAllocations.map((a) => (
                        <ListItemButton key={a.assetId} onClick={() => { field.onChange(a.assetId); setAssetAnchor(null); }}>
                          <ListItemText primary={<Typography sx={{ fontSize: 11.5 }}>{a.assetName}</Typography>} secondary={<Typography sx={{ fontSize: 10, color: "#64748b" }}>{a.assetCode}</Typography>} />
                        </ListItemButton>
                      ))}
                    </List>
                  </Popover>
                </FormControl>
              )}
            />
          )}

          {/* Conditional Category Selection (New Asset Procurement) */}
          {formRequestType === "NEW_ASSET" && (
            <FormSelect
              name="typeId"
              control={control}
              rules={{ required: "Category is required for procurement requests" }}
              label="Required Asset Category *"
              options={assetTypes.map(t => ({ value: t.typeId, label: t.typeName }))}
            />
          )}

          {/* Priority */}
          <FormSelect
            name="priority"
            control={control}
            label="Severity / Priority *"
            options={PRIORITIES}
          />

          {/* Description */}
          <FormTextField
            name="description"
            control={control}
            rules={{ required: "Detail statement is required" }}
            label="Detailed Description & Reason *"
            placeholder="Provide details about your request..."
            multiline
            rows={4}
          />

          {/* Attachment upload for repair requests */}
          {formRequestType === "REPAIR" && (
            <Box sx={{ border: "1.5px dashed #cbd5e1", borderRadius: "8px", p: 2, display: "flex", flexDirection: "column", gap: 1, alignItems: "center", bgcolor: "#f8fafc" }}>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#475569" }}>
                Damage Proof Photo (Optional)
              </Typography>
              <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                <Button
                  variant="outlined"
                  component="label"
                  size="small"
                  startIcon={<FaUpload size={10} />}
                  sx={{ ...outlinedBtnSx, textTransform: "none", fontSize: "10px", py: 0.75 }}
                >
                  Choose Image
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setSelectedFile(file);
                      }
                    }}
                  />
                </Button>
                <Typography sx={{ fontSize: "10.5px", color: "#64748b" }}>
                  {selectedFile ? selectedFile.name : "No image selected"}
                </Typography>
                {selectedFile && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setSelectedFile(null)}
                    sx={{ p: 0.25 }}
                  >
                    <FaTimes size={10} />
                  </IconButton>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5 }}>
          <Button onClick={() => setRequestOpen(false)} sx={outlinedBtnSx}>Cancel</Button>
          <Button onClick={handleSubmit(handleRequestSubmit)} sx={primaryBtnSx}>Submit Request</Button>
        </DialogActions>
      </Dialog>

      {/* Review & Action Dialog (Admin / View Dialog for Employee) */}
      <Dialog open={respondOpen} onClose={() => setRespondOpen(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: premiumDialogPaperSx } }}>
        <DialogTitle sx={premiumDialogTitleSx}>
          <Typography fontWeight={800} fontSize="14px" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FaHourglassHalf size={13} style={{ color: COLORS.primary }} /> Request Review
          </Typography>
          <IconButton size="small" onClick={() => setRespondOpen(false)} sx={{ color: COLORS.textFaint }}><FaTimes size={13} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: "20px !important", pb: 2.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
          {respondData && (
            <>
              <InfoRow label="Request ID" value={`#${respondData.requestId}`} />
              <InfoRow label="Type" value={respondData.requestType?.replace("_", " ")} />
              <InfoRow label="Requester Name" value={respondData.requestedBy} />
              <InfoRow label="Request Date" value={respondData.requestDate} />
              <InfoRow label="Current Status" value={<StatusBadge status={respondData.status} />} />
              <InfoRow label="Priority" value={respondData.priority} />

              {respondData.assetName && (
                <Box sx={{ border: "1px solid #e2e8f0", borderRadius: "6px", p: 1.2, bgcolor: "#f8fafc" }}>
                  <Typography sx={{ fontSize: 9.5, fontWeight: 800, color: COLORS.primary, mb: 0.5 }}>LINKED DEVICE DETAILS</Typography>
                  <Typography sx={{ fontSize: 11, fontWeight: 700 }}>{respondData.assetName}</Typography>
                  <Typography sx={{ fontSize: 10, color: "#64748b" }}>Asset Code: {respondData.assetCode}</Typography>
                </Box>
              )}

              {respondData.typeName && !respondData.assetName && (
                <InfoRow label="Requested Category" value={respondData.typeName} />
              )}

              <Box sx={{ border: "1px solid #e2e8f0", borderRadius: "6px", p: 1.2 }}>
                <Typography sx={{ fontSize: 9.5, fontWeight: 800, color: "#475569", mb: 0.25 }}>USER DESCRIPTION</Typography>
                <Typography sx={{ fontSize: 11, color: COLORS.text, whiteSpace: "pre-line" }}>{respondData.description}</Typography>
              </Box>

              {respondData.attachmentPath && (
                <Box sx={{ border: "1px solid #e2e8f0", borderRadius: "6px", p: 1.2 }}>
                  <Typography sx={{ fontSize: 9.5, fontWeight: 800, color: "#475569", mb: 0.75 }}>DAMAGE EVIDENCE PHOTO</Typography>
                  <Box sx={{ width: "100%", maxHeight: 200, display: "flex", justifyContent: "center", bgcolor: "#f8fafc", borderRadius: "4px", overflow: "hidden", border: "1px solid #f1f5f9" }}>
                    <img
                      src={`${import.meta.env.VITE_BASE_URL || "http://localhost:8080"}/api/files/download/${respondData.attachmentPath}`}
                      alt="Damage Evidence"
                      style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain" }}
                    />
                  </Box>
                </Box>
              )}

              {respondData.remarks && (
                <Box sx={{ border: "1px solid #ffe082", borderRadius: "6px", p: 1.2, bgcolor: "#fff8e1" }}>
                  <Typography sx={{ fontSize: 9.5, fontWeight: 800, color: "#b45309", mb: 0.25 }}>ADMIN RESPONSE REMARKS</Typography>
                  <Typography sx={{ fontSize: 11, color: COLORS.text, whiteSpace: "pre-line" }}>{respondData.remarks}</Typography>
                </Box>
              )}

              {/* Admin Actions Panel */}
              {isAdminOrManager && (respondData.status === "PENDING" || respondData.status === "IN_PROGRESS" || respondData.status === "APPROVED") && (
                <Box sx={{ borderTop: "1px dashed #cbd5e1", pt: 2, mt: 1, display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 800, color: COLORS.primary }}>ADMIN ACTION CONTROL PANEL</Typography>
                  <TextField
                    label="Response Remarks / Internal Notes"
                    size="small"
                    fullWidth
                    multiline
                    rows={2}
                    onChange={(e) => { actionRemarksRef.current = e.target.value; }}
                    sx={{ "& label": { fontSize: 11.5 }, "& .MuiOutlinedInput-root": { fontSize: 11.5 } }}
                  />

                  {respondData.status === "IN_PROGRESS" && respondData.requestType === "REPAIR" && (
                    <TextField
                      label="Repair Cost (₹)"
                      type="number"
                      size="small"
                      fullWidth
                      onChange={(e) => { actionCostRef.current = e.target.value; }}
                      sx={{ mt: 0.5, "& label": { fontSize: 11.5 }, "& .MuiOutlinedInput-root": { fontSize: 11.5 } }}
                    />
                  )}

                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {respondData.status === "PENDING" && (
                      <>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<FaCheck size={10} />}
                          onClick={() => triggerAction("approve")}
                          sx={{ ...primaryBtnSx, bgcolor: "#10b981", borderColor: "#10b981", "&:hover": { bgcolor: "#059669" } }}
                        >
                          Approve Request
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          startIcon={<FaBan size={10} />}
                          onClick={() => triggerAction("reject")}
                          sx={{ ...primaryBtnSx, bgcolor: "#ef4444", borderColor: "#ef4444", "&:hover": { bgcolor: "#dc2626" } }}
                        >
                          Reject
                        </Button>
                      </>
                    )}

                    {respondData.requestType === "REPAIR" && respondData.status === "PENDING" && (
                      <Button
                        variant="contained"
                        color="info"
                        startIcon={<FaWrench size={10} />}
                        onClick={() => triggerAction("progress")}
                        sx={{ ...primaryBtnSx, bgcolor: "#2563eb", borderColor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}
                      >
                        Send to Maintenance
                      </Button>
                    )}

                    {respondData.status === "IN_PROGRESS" && (
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<FaCheckCircle size={10} />}
                        onClick={() => triggerAction("resolve")}
                        sx={{ ...primaryBtnSx, bgcolor: "#10b981", borderColor: "#10b981", "&:hover": { bgcolor: "#059669" } }}
                      >
                        Resolve / Repair Completed
                      </Button>
                    )}
                  </Box>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button onClick={() => setRespondOpen(false)} sx={outlinedBtnSx}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Admin Action Confirmation Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Status Transition"
        message={`Are you sure you want to transition this request's status to ${confirmAction?.toUpperCase()}?`}
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={handleStatusUpdate}
        onCancel={() => setConfirmOpen(false)}
      />
    </Box>
  );
}
