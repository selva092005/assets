import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, Button, Select, MenuItem, CircularProgress } from "@mui/material";
import { FaFilter, FaFileExport, FaPlus } from "react-icons/fa";
import {
  fetchAssets,
  setAssetPage, setAssetSearch, setAssetFilter, resetAssetFilters,
} from "../store/slices/assetSlice";
import {
  getAssetTypes, addAsset, updateAsset, deleteAsset, getAssetById,
} from "../services/assets_service";
import { COLORS } from "../theme/tokens";

import PageHeader      from "../components/common/PageHeader";
import SearchBar       from "../components/common/SearchBar";
import TableCard       from "../components/common/TableCard";
import TablePagination from "../components/common/TablePagination";
import AssetTable      from "../components/assets/AssetTable";
import AssetForm       from "../components/assets/AssetForm";
import AssetView       from "../components/assets/AssetView";
import AssetQR         from "../components/assets/AssetQR";

const EMPTY = {
  assetId: null, assetName: "", serialNumber: "", brand: "", model: "",
  purchaseDate: "", warrantyExpiry: "", cost: "", status: "AVAILABLE",
  assetCondition: "GOOD", notes: "", typeId: "", locationName: "", companyName: "",
};

const getAssetTypeList = (res) => {
  const list = Array.isArray(res)       ? res
             : Array.isArray(res?.data) ? res.data
             : res?.data?.content       ? res.data.content
             : res?.content             ? res.content
             : [];
  return list
    .map((t) => ({ typeId: t.typeId ?? t.type_id ?? t.id, typeName: t.typeName ?? t.type_name ?? t.name }))
    .filter((t) => t.typeId != null && t.typeName);
};

export default function AssetsPage() {
  const dispatch = useDispatch();
  const { items: assets, totalPages, page, search, filterType, loading } =
    useSelector((s) => s.assets);

  const [types,     setTypes]     = useState([]);
  const [showCount, setShowCount] = useState(10);
  const [form,      setForm]      = useState(EMPTY);
  const [showModal, setShowModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [viewData,  setViewData]  = useState(null);
  const [qrModal,   setQrModal]   = useState(false);
  const [qrAsset,   setQrAsset]   = useState(null);

  // Re-fetch whenever page, search, filterType, or showCount changes
  useEffect(() => {
    dispatch(fetchAssets({ keyword: search, page, size: showCount, typeId: filterType || undefined }));
  }, [page, showCount, filterType]);

  // Load asset types once
  useEffect(() => {
    getAssetTypes()
      .then((res) => setTypes(getAssetTypeList(res)))
      .catch(() => setTypes([]));
  }, []);

  const reload = () =>
    dispatch(fetchAssets({ keyword: search, page, size: showCount, typeId: filterType || undefined }));

  const handleSearch = () => {
    dispatch(setAssetPage(0));
    dispatch(fetchAssets({ keyword: search, page: 0, size: showCount, typeId: filterType || undefined }));
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

  const handleSave = async () => {
    const payload = {
      assetName:      form.assetName,
      serialNumber:   form.serialNumber,
      brand:          form.brand,
      model:          form.model,
      purchaseDate:   form.purchaseDate   || null,
      warrantyExpiry: form.warrantyExpiry || null,
      cost:           form.cost === ""    ? null : Number(form.cost),
      status:         form.status,
      assetCondition: form.assetCondition,
      notes:          form.notes,
      typeId:         form.typeId === ""  ? null : Number(form.typeId),
      locationName:   form.locationName   || null,
      companyName:    form.companyName    || null,
    };
    try {
      if (form.assetId) await updateAsset(form.assetId, payload);
      else              await addAsset(payload);
      reload();
      setShowModal(false);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to save asset");
    }
  };

  const handleEdit = (item) => {
    const resolvedTypeId = String(
      types.find((t) => t.typeName === (item.typeName || item.assetType?.typeName))?.typeId ?? ""
    );
    setForm({
      assetId:        item.assetId,
      assetName:      item.assetName      || "",
      serialNumber:   item.serialNumber   || "",
      brand:          item.brand          || "",
      model:          item.model          || "",
      purchaseDate:   item.purchaseDate   || "",
      warrantyExpiry: item.warrantyExpiry || "",
      cost:           item.cost           || "",
      status:         item.status         || "AVAILABLE",
      assetCondition: item.assetCondition || "GOOD",
      notes:          item.notes          || "",
      locationName:   item.locationName   || "",
      companyName:    item.companyName    || "",
      typeId:         resolvedTypeId,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this asset?")) return;
    try { await deleteAsset(id); reload(); }
    catch (e) { console.error(e); }
  };

  const handleView = async (item) => {
    try {
      const res = await getAssetById(item.assetId);
      setViewData(res.data ?? res);
      setViewModal(true);
    } catch (e) { console.error(e); }
  };

  const handleQR = async (item) => {
    try {
      const res = await getAssetById(item.assetId);
      setQrAsset(res.data ?? res);
      setQrModal(true);
    } catch (e) { console.error(e); }
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
              onClick={() => { setForm(EMPTY); setShowModal(true); }}
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
          : <AssetTable assets={assets} loading={false} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} onQR={handleQR} />
        }
        <TablePagination page={page} totalPages={totalPages} onPageChange={(pg) => dispatch(setAssetPage(pg))} />
      </TableCard>

      <AssetForm
        open={showModal}
        form={form}
        types={types}
        onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })}
        onSave={handleSave}
        onClose={() => setShowModal(false)}
      />
      <AssetView open={viewModal} data={viewData} onClose={() => setViewModal(false)} />
      <AssetQR   open={qrModal}   asset={qrAsset} onClose={() => setQrModal(false)} />
    </Box>
  );
}