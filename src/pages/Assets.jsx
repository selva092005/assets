import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box, Button, Select, MenuItem, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, LinearProgress, Chip,
  Tooltip, IconButton,
} from "@mui/material";
import { FaFilter, FaFileExport, FaPlus, FaUpload, FaDownload, FaFileExcel, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import {
  fetchAssets,
  setAssetPage, setAssetSearch, setAssetFilter, setAssetStatusFilter, resetAssetFilters,
} from "../store/slices/assetSlice";
import {
  getAssetTypes, deleteAsset, getAssetById,
  bulkUploadExcel, exportAssets, downloadTemplate,
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

  // Bulk upload state
  const [bulkDialog,    setBulkDialog]    = useState(false);
  const [bulkFile,      setBulkFile]      = useState(null);
  const [bulkLoading,   setBulkLoading]   = useState(false);
  const [bulkResult,    setBulkResult]    = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const fileInputRef = useRef(null);

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

  // ── Re-fetch whenever page / search / filterType / showCount changes ─────────
  // BUG FIX: Only run after typesLoaded=true so resolveTypeName has the list
  useEffect(() => {
    if (!typesLoaded) return;
    const typeName = resolveTypeName(filterType, types);
    dispatch(fetchAssets({ keyword: search, page, size: showCount, type: typeName, status: filterStatus }));
  }, [page, showCount, filterType, filterStatus, typesLoaded, dispatch]);

  const reload = () => {
    const typeName = resolveTypeName(filterType, types);
    dispatch(fetchAssets({ keyword: search, page, size: showCount, type: typeName, status: filterStatus }));
  };

  const handleSearch = () => {
    dispatch(setAssetPage(0));
    const typeName = resolveTypeName(filterType, types);
    dispatch(fetchAssets({ keyword: search, page: 0, size: showCount, type: typeName, status: filterStatus }));
  };

  const handleReset = () => {
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

  // ── BULK UPLOAD ─────────────────────────────────────────────────────────────
  const handleDownloadTemplate = async () => {
    try {
      await downloadTemplate();
    } catch (e) {
      toast.error("Failed to download template");
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error("Please select an Excel file (.xlsx or .xls)");
      return;
    }
    setBulkFile(file);
    setBulkResult(null);
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) { toast.error("Please select a file first"); return; }
    try {
      setBulkLoading(true);
      const result = await bulkUploadExcel(bulkFile);
      setBulkResult(result?.data ?? result);
      const count = result?.data?.successCount ?? result?.successCount ?? 0;
      if (count > 0) {
        toast.success(`${count} asset(s) uploaded successfully`);
        reload();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Bulk upload failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const closeBulkDialog = () => {
    setBulkDialog(false);
    setBulkFile(null);
    setBulkResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
                onClick={() => setBulkDialog(true)}
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
        value={search}
        placeholder="Search by name, serial, asset code, location..."
        onChange={(e) => dispatch(setAssetSearch(e.target.value))}
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

      {/* ── Bulk Upload Dialog ─────────────────────────────────────────── */}
      <Dialog open={bulkDialog} onClose={closeBulkDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "12px" } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FaFileExcel color="#217346" />
            <Typography fontWeight={600} fontSize={16}>Bulk Upload Assets</Typography>
          </Box>
          <IconButton size="small" onClick={closeBulkDialog}><FaTimes size={14} /></IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          {/* Step 1: Download template — admin only */}
          <Box sx={{ mb: 2, p: 1.5, background: "#f0f7ff", borderRadius: "8px", border: "1px solid #bbdefb" }}>
            <Typography fontSize={13} color="#1565c0" fontWeight={500} mb={0.5}>Step 1 — Download the template</Typography>
            <Typography fontSize={12} color="#555" mb={1}>Fill in the Excel template with your asset data and save it.</Typography>
            <Typography fontSize={11} color="#e65100" fontWeight={500} mb={1}>Status allowed: AVAILABLE / DAMAGED &nbsp;—&nbsp; ASSIGNED and DISPOSED are not allowed.</Typography>
            {canTemplate && (
            <Button
              size="small"
              startIcon={<FaDownload size={11} />}
              onClick={handleDownloadTemplate}
              sx={{ textTransform: "none", fontSize: 12, color: "#1565c0", borderColor: "#1565c0", borderRadius: "6px" }}
              variant="outlined"
            >
              Download Template
            </Button>
            )}
          </Box>

          {/* Step 2: Upload file */}
          <Box sx={{ mb: 2 }}>
            <Typography fontSize={13} fontWeight={500} mb={1}>Step 2 — Upload your filled Excel file</Typography>
            <Box
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: `2px dashed ${bulkFile ? "#4caf50" : COLORS.border}`,
                borderRadius: "8px", p: 2.5, textAlign: "center", cursor: "pointer",
                background: bulkFile ? "#f1f8e9" : "#fafafa",
                transition: "all 0.2s",
                "&:hover": { borderColor: COLORS.primary, background: "#f0f7ff" },
              }}
            >
              <FaFileExcel size={28} color={bulkFile ? "#4caf50" : "#9e9e9e"} />
              <Typography fontSize={13} mt={1} color={bulkFile ? "#2e7d32" : "#757575"}>
                {bulkFile ? bulkFile.name : "Click to select .xlsx / .xls file"}
              </Typography>
              {bulkFile && (
                <Typography fontSize={11} color="#888" mt={0.5}>
                  {(bulkFile.size / 1024).toFixed(1)} KB
                </Typography>
              )}
            </Box>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />
          </Box>

          {/* Upload progress */}
          {bulkLoading && (
            <Box sx={{ mb: 2 }}>
              <Typography fontSize={12} color="#555" mb={0.5}>Uploading and processing...</Typography>
              <LinearProgress />
            </Box>
          )}

          {/* Results */}
          {bulkResult && (
            <Box sx={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px", p: 1.5 }}>
              <Typography fontSize={13} fontWeight={600} mb={1.5}>Upload Results</Typography>

              {/* Summary chips — always show all 4 */}
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, mb: 1.5 }}>
                <Box sx={{ p: 1, borderRadius: "8px", background: "#f8fafc", border: "1px solid #e2e8f0", textAlign: "center" }}>
                  <Typography fontSize={18} fontWeight={800} color={COLORS.text}>{bulkResult.totalRows ?? 0}</Typography>
                  <Typography fontSize={11} color={COLORS.textMuted}>Total Rows</Typography>
                </Box>
                <Box sx={{ p: 1, borderRadius: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", textAlign: "center" }}>
                  <Typography fontSize={18} fontWeight={800} color="#16a34a">{bulkResult.successCount ?? 0}</Typography>
                  <Typography fontSize={11} color="#16a34a">Successful</Typography>
                </Box>
                <Box sx={{ p: 1, borderRadius: "8px", background: "#fffbeb", border: "1px solid #fde68a", textAlign: "center" }}>
                  <Typography fontSize={18} fontWeight={800} color="#d97706">{bulkResult.skippedCount ?? 0}</Typography>
                  <Typography fontSize={11} color="#d97706">Skipped</Typography>
                </Box>
                <Box sx={{ p: 1, borderRadius: "8px", background: "#fef2f2", border: "1px solid #fecaca", textAlign: "center" }}>
                  <Typography fontSize={18} fontWeight={800} color="#dc2626">{bulkResult.failedCount ?? 0}</Typography>
                  <Typography fontSize={11} color="#dc2626">Failed</Typography>
                </Box>
              </Box>

              {/* Skipped table */}
              {bulkResult.skipped?.length > 0 && (
                <Box sx={{ mb: 1.5 }}>
                  <Typography fontSize={12} fontWeight={600} color="#d97706" mb={0.75}>⚠ Skipped Rows ({bulkResult.skipped.length})</Typography>
                  <Box sx={{ maxHeight: 160, overflowY: "auto", border: "1px solid #fde68a", borderRadius: "6px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                      <thead>
                        <tr style={{ background: "#fef9c3", position: "sticky", top: 0 }}>
                          <th style={{ padding: "5px 8px", textAlign: "left", color: "#92400e", fontWeight: 600, borderBottom: "1px solid #fde68a", width: 50 }}>Row</th>
                          <th style={{ padding: "5px 8px", textAlign: "left", color: "#92400e", fontWeight: 600, borderBottom: "1px solid #fde68a" }}>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkResult.skipped.map((item, i) => (
                          <tr key={i} style={{ background: i % 2 === 0 ? "#fffbeb" : "#fefce8" }}>
                            <td style={{ padding: "4px 8px", color: "#92400e", borderBottom: "1px solid #fef3c7" }}>
                              {typeof item === "object" ? item.row : "—"}
                            </td>
                            <td style={{ padding: "4px 8px", color: "#78350f", borderBottom: "1px solid #fef3c7" }}>
                              {typeof item === "object" ? item.message : item}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                </Box>
              )}

              {/* Errors table */}
              {bulkResult.errors?.length > 0 && (
                <Box>
                  <Typography fontSize={12} fontWeight={600} color="#dc2626" mb={0.75}>✕ Validation Errors ({bulkResult.errors.length})</Typography>
                  <Box sx={{ maxHeight: 200, overflowY: "auto", border: "1px solid #fecaca", borderRadius: "6px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                      <thead>
                        <tr style={{ background: "#fee2e2", position: "sticky", top: 0 }}>
                          <th style={{ padding: "5px 8px", textAlign: "left", color: "#991b1b", fontWeight: 600, borderBottom: "1px solid #fecaca", width: 50 }}>Row</th>
                          <th style={{ padding: "5px 8px", textAlign: "left", color: "#991b1b", fontWeight: 600, borderBottom: "1px solid #fecaca", width: 90 }}>Field</th>
                          <th style={{ padding: "5px 8px", textAlign: "left", color: "#991b1b", fontWeight: 600, borderBottom: "1px solid #fecaca" }}>Message</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkResult.errors.map((err, i) => (
                          <tr key={i} style={{ background: i % 2 === 0 ? "#fef2f2" : "#fff5f5" }}>
                            <td style={{ padding: "4px 8px", color: "#991b1b", borderBottom: "1px solid #fee2e2" }}>
                              {typeof err === "object" ? err.row : "—"}
                            </td>
                            <td style={{ padding: "4px 8px", color: "#b91c1c", fontWeight: 500, borderBottom: "1px solid #fee2e2" }}>
                              {typeof err === "object" ? (err.field ?? "—") : "—"}
                            </td>
                            <td style={{ padding: "4px 8px", color: "#7f1d1d", borderBottom: "1px solid #fee2e2" }}>
                              {typeof err === "object" ? err.message : err}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={closeBulkDialog} sx={{ textTransform: "none", fontSize: 13 }}>Close</Button>
          <Button
            variant="contained"
            startIcon={bulkLoading ? <CircularProgress size={12} color="inherit" /> : <FaUpload size={11} />}
            onClick={handleBulkUpload}
            disabled={!bulkFile || bulkLoading}
            sx={{ textTransform: "none", fontSize: 13, fontWeight: 600, borderRadius: "8px", background: "#2e7d32", "&:hover": { background: "#1b5e20" } }}
          >
            {bulkLoading ? "Uploading..." : "Upload"}
          </Button>
        </DialogActions>
      </Dialog>
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