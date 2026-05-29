import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box, Button, Select, MenuItem, CircularProgress,
  Typography, Chip,
  Tooltip, IconButton, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from "@mui/material";
import { FaFilter, FaFileExport, FaPlus, FaUpload, FaBoxes, FaCheckCircle, FaExclamationTriangle, FaWrench, FaTools } from "react-icons/fa";
import toast from "../utils/toast.jsx";
import {
  fetchAssets,
  setAssetPage, setAssetSearch, setAssetFilter, setAssetStatusFilter, resetAssetFilters,
} from "../store/slices/assetSlice";
import {
  getAssetTypes, deleteAsset, getAssetById,
  exportAssets, getDashboard, createAssetType,
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
  const { items: assets, totalPages, page, search, filterType, filterStatus, loading } =
    useSelector((s) => s.assets);
  const { userRole, userName } = useSelector((s) => s.auth);

  const [inputValue, setInputValue] = useState("");
  const [types, setTypes] = useState([]);
  const [typesLoaded, setTypesLoaded] = useState(false);
  const [showCount, setShowCount] = useState(10);
  const [warrantyDays, setWarrantyDays] = useState(null);
  const [qrModal, setQrModal] = useState(false);
  const [qrAsset, setQrAsset] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [historyModal, setHistoryModal] = useState(false);
  const [historyAsset, setHistoryAsset] = useState(null);

  const [stats, setStats] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [typeDialogLoading, setTypeDialogLoading] = useState(false);

  const handleAddType = async () => {
    if (!newTypeName.trim()) {
      toast.error("Type name cannot be empty");
      return;
    }
    setTypeDialogLoading(true);
    try {
      const res = await createAssetType(newTypeName.trim());
      toast.success("Asset type created successfully");
      const r = await getAssetTypes();
      const updatedTypes = getAssetTypeList(r);
      setTypes(updatedTypes);
      setTypeDialogOpen(false);
      setNewTypeName("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create asset type");
    } finally {
      setTypeDialogLoading(false);
    }
  };

  const navigate = useNavigate();
  const location = useLocation();
  const canWrite = userRole === "admin" || userRole === "manager"; // create/edit
  const canDelete = userRole === "admin";                           // admin only
  const canExport = userRole === "admin" || userRole === "manager"; // admin + manager
  const canBulk = userRole === "admin";                           // admin only
  const canTemplate = userRole === "admin";                           // admin only

  // ── Helper: resolve typeName from filterType (typeId) ──────────────────────
  const resolveTypeName = (typeId, typeList) => {
    if (!typeId) return undefined;
    const found = typeList.find((t) => String(t.typeId) === String(typeId));
    return found?.typeName || undefined;
  };

  // ── Load asset types ONCE, then trigger first fetch ─────────────────────────
  useEffect(() => {
    getAssetTypes()
      .then((res) => {
        setTypes(getAssetTypeList(res));
        setTypesLoaded(true);
      })
      .catch(() => {
        setTypes([]);
        setTypesLoaded(true); // still mark loaded so fetch proceeds
      });

    // Fetch dashboard stats for ribbon
    getDashboard()
      .then((res) => setStats(res))
      .catch(() => { });
  }, []);

  // ── Re-fetch whenever page / filterType / filterStatus / showCount changes ───
  useEffect(() => {
    if (!typesLoaded) return;
    const typeName = resolveTypeName(filterType, types);
    dispatch(fetchAssets({ keyword: search, page, size: showCount, type: typeName, status: filterStatus }));
  }, [page, showCount, filterType, filterStatus, search, typesLoaded, dispatch]);

  const reload = () => {
    const typeName = resolveTypeName(filterType, types);
    dispatch(fetchAssets({ keyword: search, page, size: showCount, type: typeName, status: filterStatus }));
    getDashboard()
      .then((res) => setStats(res))
      .catch(() => { });
  };

  const handleSearch = () => {
    dispatch(setAssetSearch(inputValue));
    dispatch(setAssetPage(0));
  };

  const handleReset = () => {
    setInputValue("");
    dispatch(resetAssetFilters());
    dispatch(fetchAssets({ keyword: "", page: 0, size: showCount }));
  };

  const handleFilterChange = (value) => {
    if (value === "ADD_NEW") {
      setTypeDialogOpen(true);
      return;
    }
    dispatch(setAssetFilter(value));
    dispatch(setAssetPage(0));
  };

  const handleStatusChange = (value) => {
    dispatch(setAssetStatusFilter(value));
    dispatch(setAssetPage(0));
    // useEffect will fire from filterStatus + page change
  };

  const handleShowCountChange = (value) => {
    setShowCount(Number(value));
    dispatch(setAssetPage(0));
    // useEffect will fire from showCount change
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
                sx={{ ...outlinedBtnSx, borderColor: "#4caf50", color: "#2e7d32", "&:hover": { borderColor: "#388e3c", background: "rgba(76, 175, 80, 0.04)" } }}
              >
                Bulk Upload
              </Button>
            )}

            {/* Add New — admin + manager */}
            {canWrite && (
              <Button
                variant="contained"
                startIcon={<FaPlus size={10} />}
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
        <StatCard label="Total Assets" value={stats?.totalAssets ?? 0} icon={<FaBoxes />} iconColor="#3949ab" />
        <StatCard label="Available" value={stats?.available ?? 0} icon={<FaCheckCircle />} iconColor="#10b981" />
        <StatCard label="Assigned" value={stats?.assigned ?? 0} icon={<FaTools />} iconColor="#2563eb" />
        <StatCard label="Maintenance" value={stats?.underMaintenance ?? 0} icon={<FaWrench />} iconColor="#d97706" />
        <StatCard label="Damaged" value={stats?.damaged ?? 0} icon={<FaExclamationTriangle />} iconColor="#f43f5e" />
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
        onClose={() => { if (!typeDialogLoading) setTypeDialogOpen(false); }}
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
          <Typography sx={{ fontSize: 11.5, color: COLORS.textFaint, mb: 0.5 }}>Type Name *</Typography>
          <TextField
            autoFocus
            placeholder="e.g. Server, Projector, Tablet"
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
            size="small"
            fullWidth
            disabled={typeDialogLoading}
            sx={inputSx}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 1.5, gap: 1 }}>
          <Button 
            variant="outlined" 
            onClick={() => { setTypeDialogOpen(false); setNewTypeName(""); }} 
            disabled={typeDialogLoading}
            sx={outlinedBtnSx}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleAddType} 
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