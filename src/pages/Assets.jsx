import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box, Button, Select, MenuItem, CircularProgress,
  Typography, Chip,
  Tooltip, IconButton,
} from "@mui/material";
import { FaFilter, FaFileExport, FaPlus, FaUpload } from "react-icons/fa";
import toast from "react-hot-toast";
import {
  fetchAssets,
  setAssetPage, setAssetSearch, setAssetFilter, setAssetStatusFilter, resetAssetFilters,
} from "../store/slices/assetSlice";
import {
  getAssetTypes, deleteAsset, getAssetById,
  exportAssets,
} from "../services/assets_service";
import { moveAsset } from "../services/location_history_service";
import { COLORS } from "../theme/tokens";

import PageHeader      from "../components/common/PageHeader";
import SearchBar       from "../components/common/SearchBar";
import TableCard       from "../components/common/TableCard";
import TablePagination from "../components/common/TablePagination";
import AssetTable      from "../components/assets/AssetTable";
import AssetView       from "../components/assets/AssetView";
import AssetQR         from "../components/assets/AssetQR";
import MoveAssetModal  from "../components/assets/MoveAssetModal";
import LocationHistoryModal from "../components/assets/LocationHistoryModal";
import ConfirmDialog   from "../components/common/ConfirmDialog";

export default function AssetsPage() {
  const dispatch = useDispatch();
  const { items: assets, totalPages, page, search, filterType, filterStatus, loading } =
    useSelector((s) => s.assets);
  const { userRole, userName } = useSelector((s) => s.auth);

  const [inputValue,    setInputValue]    = useState("");
  const [types,         setTypes]         = useState([]);
  const [typesLoaded,   setTypesLoaded]   = useState(false);
  const [showCount,     setShowCount]     = useState(10);
  const [warrantyDays,  setWarrantyDays]  = useState(null);
  const [viewModal,     setViewModal]     = useState(false);
  const [viewData,      setViewData]      = useState(null);
  const [qrModal,       setQrModal]       = useState(false);
  const [qrAsset,       setQrAsset]       = useState(null);
  const [confirmOpen,   setConfirmOpen]   = useState(false);
  const [deleteId,      setDeleteId]      = useState(null);
  const [moveModal,     setMoveModal]     = useState(false);
  const [moveAssetData, setMoveAssetData] = useState(null);
  const [historyModal,  setHistoryModal]  = useState(false);
  const [historyAsset,  setHistoryAsset]  = useState(null);

  const [exportLoading, setExportLoading] = useState(false);

  const navigate    = useNavigate();
  const location    = useLocation();
  const canWrite     = userRole === "admin" || userRole === "manager"; // create/edit
  const canDelete    = userRole === "admin";                           // admin only
  const canExport    = userRole === "admin" || userRole === "manager"; // admin + manager
  const canBulk      = userRole === "admin";                           // admin only
  const canTemplate  = userRole === "admin";                           // admin only

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
    dispatch(setAssetFilter(value));
    dispatch(setAssetPage(0));
    // useEffect will fire from filterType + page change
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

  const handleEdit    = (item) => navigate(`/home/assets/edit/${item.assetId}`);
  const handleDelete  = (id)   => { setDeleteId(id); setConfirmOpen(true); };
  const handleMove    = (item) => { setMoveAssetData(item); setMoveModal(true); };
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

  const handleView = async (item) => {
    try {
      const res = await getAssetById(item.assetId);
      setViewData(res.data ?? res);
      setViewModal(true);
    } catch (e) {
      toast.error("Failed to load asset details");
    }
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

  const confirmMove = async ({ fromLocation, newLocation, reason }) => {
    try {
      await moveAsset({ assetId: moveAssetData.assetId, fromLocation: fromLocation || null, newLocation, movedBy: userName || "Admin", reason });
      toast.success("Asset moved successfully");
      reload();
      setMoveModal(false);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to move asset");
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
    <Box sx={{ mt: "60px", p: "2rem 2.5rem", background: COLORS.bg, minHeight: "100vh", fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      <PageHeader
        title="Assets"
        actions={
          <>
            {/* Show count */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, fontSize: 13, color: COLORS.textMuted }}>
              Showing
              <Select
                value={showCount}
                onChange={(e) => handleShowCountChange(e.target.value)}
                size="small"
                sx={{ fontSize: 13, borderRadius: "6px", height: 30, "& .MuiOutlinedInput-notchedOutline": { borderColor: COLORS.border } }}
              >
                {[5, 10, 20, 50].map((n) => (
                  <MenuItem key={n} value={n} sx={{ fontSize: 13 }}>{n}</MenuItem>
                ))}
              </Select>
            </Box>

            {/* Filter by type — FIX: uses typeId as value, resolves name on fetch */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, border: `1px solid ${COLORS.border}`, borderRadius: "8px", px: 1.5, py: "5px", background: COLORS.surface }}>
              <FaFilter size={12} />
              <Select
                value={filterType}
                onChange={(e) => handleFilterChange(e.target.value)}
                displayEmpty
                size="small"
                sx={{ fontSize: 13, border: "none", "& .MuiOutlinedInput-notchedOutline": { border: "none" }, height: 24, "& .MuiSelect-select": { p: 0, fontSize: 13, color: COLORS.textMuted } }}
              >
                <MenuItem value="" sx={{ fontSize: 13 }}>All Types</MenuItem>
                {types.map((t) => (
                  <MenuItem key={t.typeId} value={t.typeId} sx={{ fontSize: 13 }}>{t.typeName}</MenuItem>
                ))}
              </Select>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, border: `1px solid ${COLORS.border}`, borderRadius: "8px", px: 1.5, py: "5px", background: COLORS.surface }}>
              <FaFilter size={12} />
              <Select
                value={filterStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                displayEmpty
                size="small"
                sx={{ fontSize: 13, border: "none", "& .MuiOutlinedInput-notchedOutline": { border: "none" }, height: 24, "& .MuiSelect-select": { p: 0, fontSize: 13, color: COLORS.textMuted } }}
              >
                <MenuItem value="" sx={{ fontSize: 13 }}>All Statuses</MenuItem>
                {['AVAILABLE','ASSIGNED','DAMAGED','DISPOSED'].map((status) => (
                  <MenuItem key={status} value={status} sx={{ fontSize: 13 }}>{status}</MenuItem>
                ))}
              </Select>
            </Box>

            {/* Export — admin + manager */}
            {canExport && (
            <Tooltip title="Exports all active assets to Excel">
              <span>
                <Button
                  variant="outlined"
                  startIcon={exportLoading ? <CircularProgress size={12} /> : <FaFileExport size={12} />}
                  onClick={handleExport}
                  disabled={exportLoading}
                  sx={{ textTransform: "none", fontSize: 13, borderColor: COLORS.border, color: COLORS.textMuted, borderRadius: "8px", py: "7px", px: 1.75 }}
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
                startIcon={<FaUpload size={12} />}
                onClick={() => navigate("/home/assets/bulk-upload")}
                sx={{ textTransform: "none", fontSize: 13, borderColor: "#4caf50", color: "#2e7d32", borderRadius: "8px", py: "7px", px: 1.75 }}
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
                sx={{ textTransform: "none", fontSize: 13, fontWeight: 600, borderRadius: "8px", py: "8px", px: 2, background: COLORS.primary, boxShadow: "none", "&:hover": { background: COLORS.primaryDark, boxShadow: "none" } }}
              >
                Add New Asset
              </Button>
            )}
          </>
        }
      />

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
          : <AssetTable assets={assets} loading={false} userRole={userRole} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} onQR={handleQR} onHistory={handleHistory} onMove={handleMove} />
        }
        <TablePagination page={page} totalPages={totalPages} onPageChange={(pg) => dispatch(setAssetPage(pg))} />
      </TableCard>

      {/* ── View / QR / Move / History Modals ── */}
      <AssetView open={viewModal} data={viewData} onClose={() => setViewModal(false)} />
      <AssetQR   open={qrModal}  asset={qrAsset}  onClose={() => setQrModal(false)} />
      <MoveAssetModal
        open={moveModal}
        asset={moveAssetData}
        locations={[]}
        onMove={confirmMove}
        onClose={() => setMoveModal(false)}
      />
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


    </Box>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function getAssetTypeList(raw) {
  if (Array.isArray(raw))            return raw;
  if (Array.isArray(raw?.data))      return raw.data;
  if (raw?.data?.content)            return raw.data.content;
  if (raw?.content)                  return raw.content;
  return [];
}