import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  Box, Button, Select, MenuItem, CircularProgress,
  Typography, Chip,
  Tooltip, IconButton, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { FormTextField } from "../components/FormFields";
import { FaFilter, FaFileExport, FaPlus, FaUpload, FaBoxes, FaCheckCircle, FaExclamationTriangle, FaWrench, FaTools } from "react-icons/fa";
import toast from "../utils/toast.jsx";
import {
  setAssetPage, setAssetSearch, setAssetFilter, setAssetStatusFilter, resetAssetFilters,
} from "../store/slices/assetSlice";
import {
  getAssetTypes, deleteAsset, getAssetById,
  exportAssets, getDashboard, createAssetType,
  getAssets
} from "../services/assets_service";
import { COLORS, primaryBtnSx, outlinedBtnSx, selectSx, inputSx } from "../theme/tokens";

import PageHeader from "../components/common/PageHeader";
import SearchBar from "../components/common/SearchBar";
import TableCard from "../components/common/TableCard";
import TablePagination from "../components/common/TablePagination";
import AssetTable from "../components/assets/AssetTable";
import AssetQR from "../components/assets/AssetQR";
import LocationHistoryModal from "../components/assets/LocationHistoryModal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import StatCard from "../components/common/StatCard";

export default function AssetsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { page, search, filterType, filterStatus } =
    useSelector((s) => s.assets);
  const { userRole, userName } = useSelector((s) => s.auth);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const statusParam = params.get("status") || "";
    if (statusParam !== filterStatus) {
      dispatch(setAssetStatusFilter(statusParam));
      dispatch(setAssetPage(0));
    }
  }, [location.search, filterStatus, dispatch]);

  const [inputValue, setInputValue] = useState("");
  const [showCount, setShowCount] = useState(10);
  const [warrantyDays, setWarrantyDays] = useState(null);
  const [qrModal, setQrModal] = useState(false);
  const [qrAsset, setQrAsset] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [historyModal, setHistoryModal] = useState(false);
  const [historyAsset, setHistoryAsset] = useState(null);

  const [exportLoading, setExportLoading] = useState(false);

  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [typeDialogLoading, setTypeDialogLoading] = useState(false);

  const queryClient = useQueryClient();

  const typeForm = useForm({
    defaultValues: { newTypeName: "" }
  });

  // ── Query Fetchers ──────────────────────────────────────────────────────────
  const { data: types = [] } = useQuery({
    queryKey: ["assetTypes"],
    queryFn: async () => {
      const res = await getAssetTypes();
      return getAssetTypeList(res);
    },
  });

  const { data: stats = null } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const res = await getDashboard();
      return res;
    },
  });

  // ── Helper: resolve typeName from filterType (typeId) ──────────────────────
  const resolveTypeName = (typeId, typeList) => {
    if (!typeId) return undefined;
    const found = typeList.find((t) => String(t.typeId) === String(typeId));
    return found?.typeName || undefined;
  };

  const typeName = resolveTypeName(filterType, types);

  const { data: assetsData, isLoading: loading } = useQuery({
    queryKey: ["assets", search, page, showCount, typeName, filterStatus],
    queryFn: async () => {
      const params = {
        keyword: search || undefined,
        type:    typeName || undefined,
        status:  filterStatus || undefined,
        page,
        size:    showCount,
      };
      const res = await getAssets(params);
      return {
        content:    res.data?.content    || res.content    || [],
        totalPages: res.data?.totalPages || res.totalPages || 0,
      };
    },
    placeholderData: keepPreviousData,
  });

  const assets = assetsData?.content || [];
  const totalPages = assetsData?.totalPages || 0;

  const handleAddType = async (data) => {
    if (!data.newTypeName?.trim()) {
      toast.error("Type name cannot be empty");
      return;
    }
    setTypeDialogLoading(true);
    try {
      await createAssetType(data.newTypeName.trim());
      toast.success("Asset type created successfully");
      queryClient.invalidateQueries({ queryKey: ["assetTypes"] });
      setTypeDialogOpen(false);
      typeForm.reset();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create asset type");
    } finally {
      setTypeDialogLoading(false);
    }
  };

  const canWrite = userRole === "admin" || userRole === "manager"; // create/edit
  const canDelete = userRole === "admin";                           // admin only
  const canExport = userRole === "admin" || userRole === "manager"; // admin + manager
  const canBulk = userRole === "admin";                           // admin only

  const reload = () => {
    queryClient.invalidateQueries({ queryKey: ["assets"] });
    queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
  };

  const handleSearch = () => {
    dispatch(setAssetSearch(inputValue));
    dispatch(setAssetPage(0));
  };

  const handleReset = () => {
    setInputValue("");
    dispatch(resetAssetFilters());
    navigate({ search: "" });
  };

  const handleFilterChange = (value) => {
    if (value === "ADD_NEW") {
      setTypeDialogOpen(true);
      typeForm.reset({ newTypeName: "" });
      return;
    }
    dispatch(setAssetFilter(value));
    dispatch(setAssetPage(0));
  };

  const handleStatusChange = (value) => {
    const params = new URLSearchParams(location.search);
    if (value) {
      params.set("status", value);
    } else {
      params.delete("status");
    }
    navigate({ search: params.toString() });
  };

  const handleShowCountChange = (value) => {
    setShowCount(Number(value));
    dispatch(setAssetPage(0));
  };

  const handleEdit = (item) => navigate(`/home/assets/edit/${item.assetId}`);
  const handleDelete = (id) => { setDeleteId(id); setConfirmOpen(true); };
  const handleHistory = (item) => { setHistoryAsset(item); setHistoryModal(true); };

  const confirmDelete = async () => {
    try {
      await deleteAsset(deleteId);
      toast.success("Asset deleted successfully");
      reload();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to delete asset");
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  const handleView = (item) => {
    navigate(`/home/assets/view/${item.assetId}`);
  };

  const handleQR = async (item) => {
    try {
      const res = await getAssetById(item.assetId);
      setQrAsset(res.data ?? res);
      setQrModal(true);
    } catch (e) {
      toast.error("Failed to generate QR code");
    }
  };



  // ── EXPORT ──────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      setExportLoading(true);
      await exportAssets();
      toast.success("Export downloaded successfully");
    } catch (e) {
      toast.error("Export failed. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };



  return (
    <Box sx={{ p: 0 }}>

      <PageHeader
        title="Assets"
        subtitle="Track, audit, search and manage organizational inventory"
        actions={
          <Box sx={{
            display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center",
            animation: "fadeLeft 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
            animationDelay: "50ms",
            "@keyframes fadeLeft": {
              from: { opacity: 0, transform: "translateX(15px)" },
              to: { opacity: 1, transform: "translateX(0)" },
            }
          }}>
            {/* Show count */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, fontSize: 11, color: COLORS.textMuted }}>
              Showing
              <Select
                value={showCount}
                onChange={(e) => handleShowCountChange(e.target.value)}
                size="small"
                sx={selectSx}
              >
                {[5, 10, 20, 50].map((n) => (
                  <MenuItem key={n} value={n} sx={{ fontSize: 11 }}>{n}</MenuItem>
                ))}
              </Select>
            </Box>

            {/* Filter by type */}
            <Select
              value={filterType}
              onChange={(e) => handleFilterChange(e.target.value)}
              displayEmpty
              size="small"
              sx={selectSx}
              startAdornment={
                <InputAdornment position="start" sx={{ mr: 0.25, pl: 0.5 }}>
                  <FaFilter size={9} color={COLORS.textMuted} />
                </InputAdornment>
              }
            >
              <MenuItem value="" sx={{ fontSize: 11 }}>All Types</MenuItem>
              {types.map((t) => (
                <MenuItem key={t.typeId} value={t.typeId} sx={{ fontSize: 11 }}>{t.typeName}</MenuItem>
              ))}
              {canWrite && (
                <MenuItem value="ADD_NEW" sx={{ fontSize: 11, color: "#2563eb", fontWeight: 600, borderTop: "1px solid #e2e8f0", mt: 0.5 }}>
                  + Add New Type...
                </MenuItem>
              )}
            </Select>

            {/* Filter by status */}
            <Select
              value={filterStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              displayEmpty
              size="small"
              sx={selectSx}
              startAdornment={
                <InputAdornment position="start" sx={{ mr: 0.25, pl: 0.5 }}>
                  <FaFilter size={9} color={COLORS.textMuted} />
                </InputAdornment>
              }
            >
              <MenuItem value="" sx={{ fontSize: 11 }}>All Statuses</MenuItem>
              {['AVAILABLE', 'ASSIGNED', 'DAMAGED', 'DISPOSED', 'UNDER_MAINTENANCE'].map((status) => (
                <MenuItem key={status} value={status} sx={{ fontSize: 11 }}>{status}</MenuItem>
              ))}
            </Select>

            {/* Export — admin + manager */}
            {canExport && (
              <Tooltip title="Exports all active assets to Excel">
                <span>
                  <Button
                    variant="outlined"
                    startIcon={exportLoading ? <CircularProgress size={11} /> : <FaFileExport size={11} />}
                    onClick={handleExport}
                    disabled={exportLoading}
                    sx={outlinedBtnSx}
                  >
                    Export
                  </Button>
                </span>
              </Tooltip>
            )}

            {/* Bulk Upload — admin only */}
            {canBulk && (
              <Button
                variant="outlined"
                startIcon={<FaUpload size={11} />}
                onClick={() => navigate("/home/assets/bulk-upload")}
                sx={outlinedBtnSx}
              >
                Bulk Upload
              </Button>
            )}

            {/* Add New — admin + manager */}
            {canWrite && (
              <Button
                variant="contained"
                startIcon={<FaPlus size={11} />}
                onClick={() => navigate("/home/assets/new")}
                sx={{ ...primaryBtnSx, background: COLORS.primary, "&:hover": { background: COLORS.primaryDark } }}
              >
                Add New Asset
              </Button>
            )}
          </Box>
        }
      />

      {/* ── Stat Ribbon (5 Symmetrical Columns with Clean Top Color Accents) ── */}
      <Box sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, 1fr)",
          sm: "repeat(3, 1fr)",
          md: "repeat(5, 1fr)"
        },
        gap: 2,
        mb: 2,
        animation: "fadeUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "@keyframes fadeUp": {
          from: { opacity: 0, transform: "translateY(10px)" },
          to: { opacity: 1, transform: "translateY(0)" }
        }
      }}>
        <StatCard label="Total Assets" value={stats?.totalAssets ?? 0} icon={<FaBoxes />} iconColor="#3949ab" onClick={() => handleStatusChange("")} />
        <StatCard label="Available" value={stats?.available ?? 0} icon={<FaCheckCircle />} iconColor="#10b981" onClick={() => handleStatusChange("AVAILABLE")} />
        <StatCard label="Assigned" value={stats?.assigned ?? 0} icon={<FaTools />} iconColor="#2563eb" onClick={() => handleStatusChange("ASSIGNED")} />
        <StatCard label="Maintenance" value={stats?.underMaintenance ?? 0} icon={<FaWrench />} iconColor="#d97706" onClick={() => handleStatusChange("UNDER_MAINTENANCE")} />
        <StatCard label="Damaged" value={stats?.damaged ?? 0} icon={<FaExclamationTriangle />} iconColor="#f43f5e" onClick={() => handleStatusChange("DAMAGED")} />
      </Box>

      <SearchBar
        value={inputValue}
        placeholder="Search by name, serial, asset code, location..."
        onChange={(e) => setInputValue(e.target.value)}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      <TableCard>
        {loading
          ? <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
          : <AssetTable assets={assets} loading={false} userRole={userRole} page={page} pageSize={showCount} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} onQR={handleQR} onHistory={handleHistory} />
        }
        <TablePagination page={page} totalPages={totalPages} onPageChange={(pg) => dispatch(setAssetPage(pg))} />
      </TableCard>

      {/* ── QR / History Modals ── */}
      <AssetQR open={qrModal} asset={qrAsset} onClose={() => setQrModal(false)} />
      <LocationHistoryModal
        open={historyModal}
        asset={historyAsset}
        onClose={() => setHistoryModal(false)}
      />
      <ConfirmDialog
        open={confirmOpen}
        title="Delete Asset"
        message="Are you sure you want to delete this asset? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
        confirmLabel="Delete"
      />

      {/* ── Dialog to add new type ── */}
      <Dialog
        open={typeDialogOpen}
        onClose={() => { if (!typeDialogLoading) { setTypeDialogOpen(false); typeForm.reset(); } }}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: "12px",
              padding: 1,
            }
          }
        }}
      >
        <DialogTitle sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
          fontWeight: 700,
          fontSize: 15,
          color: COLORS.text,
          borderBottom: `1px solid ${COLORS.borderLight || "#f1f5f9"}`
        }}>
          Add Asset Type
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important", pb: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
          <FormTextField
            name="newTypeName"
            control={typeForm.control}
            rules={{ required: "Type name is required" }}
            label="Type Name *"
            placeholder="e.g. Server, Projector, Tablet"
            autoFocus
            disabled={typeDialogLoading}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 1.5, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => { setTypeDialogOpen(false); typeForm.reset(); }}
            disabled={typeDialogLoading}
            sx={outlinedBtnSx}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={typeForm.handleSubmit(handleAddType)}
            disabled={typeDialogLoading}
            sx={{ ...primaryBtnSx, px: 2.5 }}
          >
            {typeDialogLoading ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Add Type"}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function getAssetTypeList(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (raw?.data?.content) return raw.data.content;
  if (raw?.content) return raw.content;
  return [];
}