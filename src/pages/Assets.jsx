import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Box, Button, Select, MenuItem, CircularProgress } from "@mui/material";
import { FaFilter, FaFileExport, FaPlus } from "react-icons/fa";
import toast from "react-hot-toast";
import {
  fetchAssets,
  setAssetPage, setAssetSearch, setAssetFilter, resetAssetFilters,
} from "../store/slices/assetSlice";
import {
  getAssetTypes, deleteAsset, getAssetById,
} from "../services/assets_service";
import { moveAsset } from "../services/location_history_service";
import { COLORS } from "../theme/tokens";

import PageHeader      from "../components/common/PageHeader";
import SearchBar       from "../components/common/SearchBar";
import TableCard       from "../components/common/TableCard";
import TablePagination from "../components/common/TablePagination";
import AssetTable      from "../components/assets/AssetTable";
import AssetView       from "../components/assets/AssetView";
import AssetQR                from "../components/assets/AssetQR";
import MoveAssetModal         from "../components/assets/MoveAssetModal";
import LocationHistoryModal   from "../components/assets/LocationHistoryModal";
import ConfirmDialog   from "../components/common/ConfirmDialog";

export default function AssetsPage() {
  const dispatch = useDispatch();
  const { items: assets, totalPages, page, search, filterType, loading } =
    useSelector((s) => s.assets);
  const { userRole } = useSelector((s) => s.auth);

  const [types,        setTypes]        = useState([]);
  const [showCount,    setShowCount]    = useState(10);
  const [viewModal,    setViewModal]    = useState(false);
  const [viewData,     setViewData]     = useState(null);
  const [qrModal,      setQrModal]      = useState(false);
  const [qrAsset,      setQrAsset]      = useState(null);
  const [confirmOpen,  setConfirmOpen]  = useState(false);
  const [deleteId,     setDeleteId]     = useState(null);
  const [moveModal,    setMoveModal]    = useState(false);
  const [moveAssetData,setMoveAssetData]= useState(null);
  const [historyModal, setHistoryModal] = useState(false);
  const [historyAsset, setHistoryAsset] = useState(null);

  const navigate = useNavigate();
  const canWrite = userRole !== "user";

  // Re-fetch whenever page, search, filterType, or showCount changes
  useEffect(() => {
    const typeName = filterType ? types.find(t => String(t.typeId) === String(filterType))?.typeName : undefined;
    dispatch(fetchAssets({ keyword: search, page, size: showCount, type: typeName }));
  }, [page, showCount, filterType, dispatch, search, types]);

  // Load asset types once
  useEffect(() => {
    getAssetTypes()
      .then((res) => setTypes(getAssetTypeList(res)))
      .catch(() => setTypes([]));
  }, []);

  const reload = () => {
    const typeName = filterType ? types.find(t => String(t.typeId) === String(filterType))?.typeName : undefined;
    dispatch(fetchAssets({ keyword: search, page, size: showCount, type: typeName }));
  };

  const handleSearch = () => {
    dispatch(setAssetPage(0));
    const typeName = filterType ? types.find(t => String(t.typeId) === String(filterType))?.typeName : undefined;
    dispatch(fetchAssets({ keyword: search, page: 0, size: showCount, type: typeName }));
  };

  const handleReset = () => {
    dispatch(resetAssetFilters());
    dispatch(fetchAssets({ keyword: "", page: 0, size: showCount }));
  };

  const handleFilterChange = (value) => {
    dispatch(setAssetFilter(value));
    dispatch(setAssetPage(0));
    // useEffect above will trigger the fetch on filterType change
  };

  const handleShowCountChange = (value) => {
    setShowCount(Number(value));
    dispatch(setAssetPage(0));
    // useEffect above will trigger the fetch on showCount change
  };

  const handleEdit = (item) => navigate(`/home/assets/edit/${item.assetId}`);

  const handleDelete = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteAsset(deleteId, "admin");
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
      console.error(e); 
    }
  };

  const handleQR = async (item) => {
    try {
      const res = await getAssetById(item.assetId);
      setQrAsset(res.data ?? res);
      setQrModal(true);
    } catch (e) { 
      toast.error("Failed to generate QR code");
      console.error(e); 
    }
  };

  const handleMove = (item) => {
    setMoveAssetData(item);
    setMoveModal(true);
  };

  const handleHistory = (item) => {
    setHistoryAsset(item);
    setHistoryModal(true);
  };

  const confirmMove = async ({ newLocation, reason }) => {
    try {
      await moveAsset({
        assetId:     moveAssetData.assetId,
        newLocation,
        movedBy:     "Admin",
        reason,
      });
      toast.success("Asset moved successfully");
      reload();
      setMoveModal(false);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to move asset");
    }
  };

  return (
    <Box sx={{ mt: "60px", p: "2rem 2.5rem", background: COLORS.bg, minHeight: "100vh", fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      <PageHeader
        title="Assets"
        actions={
          <>
            {/* Show count — triggers backend re-fetch */}
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

            {/* Filter by type — delegates filtering to backend */}
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

            <Button
              variant="outlined"
              startIcon={<FaFileExport size={12} />}
              sx={{ textTransform: "none", fontSize: 13, borderColor: COLORS.border, color: COLORS.textMuted, borderRadius: "8px", py: "7px", px: 1.75 }}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<FaPlus size={11} />}
              onClick={() => navigate("/home/assets/new")}
              disabled={!canWrite}
              sx={{ textTransform: "none", fontSize: 13, fontWeight: 600, borderRadius: "8px", py: "8px", px: 2, background: COLORS.primary, boxShadow: "none", "&:hover": { background: COLORS.primaryDark, boxShadow: "none" } }}
            >
              Add New Asset
            </Button>
          </>
        }
      />

      <SearchBar
        value={search}
        placeholder="Search by name, serial, brand..."
        onChange={(e) => dispatch(setAssetSearch(e.target.value))}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      <TableCard>
        {loading
          ? <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
          : <AssetTable assets={assets} loading={false} canWrite={canWrite} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} onQR={handleQR} onHistory={handleHistory} />
        }
        <TablePagination page={page} totalPages={totalPages} onPageChange={(pg) => dispatch(setAssetPage(pg))} />
      </TableCard>

      <AssetView open={viewModal} data={viewData} onClose={() => setViewModal(false)} />
      <AssetQR   open={qrModal}   asset={qrAsset} onClose={() => setQrModal(false)} />
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