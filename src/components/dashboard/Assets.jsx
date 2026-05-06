import { useEffect, useState } from "react";
import {
  getAssets, getAssetTypes, addAsset, deleteAsset, updateAsset, getAssetById,
} from "../../service/assets_service";
import { FaEye, FaEdit, FaTrash, FaSearch, FaSyncAlt, FaPlus, FaFilter, FaFileExport } from "react-icons/fa";
import {
  Box, Typography, Button, IconButton, TextField, Select, MenuItem,
  Table, TableHead, TableBody, TableRow, TableCell, Paper, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, Avatar,
  InputAdornment, Tooltip,
} from "@mui/material";

const STATUS_COLORS = {
  AVAILABLE: { bg: "#e8f5e9", color: "#2e7d32" },
  ASSIGNED:  { bg: "#fff3e0", color: "#e65100" },
  DAMAGED:   { bg: "#ffebee", color: "#c62828" },
};
const CONDITION_COLORS = {
  GOOD: { bg: "#e3f2fd", color: "#1565c0" },
  FAIR: { bg: "#fffde7", color: "#f57f17" },
  POOR: { bg: "#ffebee", color: "#c62828" },
};

function Pill({ label, map }) {
  const s = map[label] || { bg: "#f5f5f5", color: "#555" };
  return (
    <Chip label={label} size="small"
      sx={{ background: s.bg, color: s.color, fontWeight: 600, fontSize: 12, borderRadius: "20px", height: 24 }} />
  );
}

const EMPTY = {
  assetId: null, assetName: "", serialNumber: "", brand: "", model: "",
  purchaseDate: "", warrantyExpiry: "", cost: "", status: "AVAILABLE",
  assetCondition: "GOOD", notes: "", typeId: "", locationName: "",  // ✅ added locationName
};

const PAGE_SIZE = 10;

// ✅ FIX: res is already the array (res.data was returned from service)
const getAssetTypeList = (res) => {
  const list = Array.isArray(res)
    ? res
    : res?.content || res?.data?.content || res?.data || [];

  return list
    .map(t => ({
      typeId: t.typeId ?? t.type_id ?? t.id,
      typeName: t.typeName ?? t.type_name ?? t.name,
    }))
    .filter(t => t.typeId != null && t.typeName);
};

const buildAssetPayload = form => ({
  assetName: form.assetName,
  serialNumber: form.serialNumber,
  brand: form.brand,
  model: form.model,
  purchaseDate: form.purchaseDate || null,
  warrantyExpiry: form.warrantyExpiry || null,
  cost: form.cost === "" ? null : Number(form.cost),
  status: form.status,
  assetCondition: form.assetCondition,
  notes: form.notes,
  typeId: form.typeId === "" ? null : Number(form.typeId),
  locationName: form.locationName || null,   // ✅ added
});

export default function Assets() {
  const [assets, setAssets]         = useState([]);
  const [types, setTypes]           = useState([]);
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage]             = useState(0);
  const [showModal, setShowModal]   = useState(false);
  const [viewModal, setViewModal]   = useState(false);
  const [viewData, setViewData]     = useState(null);
  const [form, setForm]             = useState(EMPTY);
  const [filterType, setFilterType] = useState("");
  const [showCount, setShowCount]   = useState(PAGE_SIZE);

  useEffect(() => { fetchAssets(search, page); fetchTypes(); }, [page]);

const fetchTypes = async () => {
  try {
    const res = await getAssetTypes();

    console.log("TYPE RESPONSE:", res);

    setTypes(res || []);

  } catch (e) {
    console.error("fetchTypes error:", e);
    setTypes([]);
  }
};

  const fetchAssets = async (keyword = "", pg = 0) => {
    try {
      setLoading(true);
      const data = await getAssets({ name: keyword || undefined, page: pg });
      setAssets(data.data?.content || data.content || []);
      setTotalPages(data.data?.totalPages || data.totalPages || 0);
    } catch (e) { console.error(e); setAssets([]); }
    finally { setLoading(false); }
  };

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    try {
      const payload = buildAssetPayload(form);
      if (form.assetId) await updateAsset(form.assetId, payload);
      else await addAsset(payload);
      fetchAssets(search, page);
      setShowModal(false);
    } catch (e) { alert(e.response?.data?.message || "Failed to save asset"); }
  };

  // ✅ FIX: AssetResponseDTO only sends typeName (no typeId), so resolve typeId by matching typeName in loaded types
const handleEdit = (item) => {
  // The API response has typeName but no typeId — look it up from the loaded types list
  const resolvedTypeId = String(
    types.find(t => t.typeName === (item.typeName || item.assetType?.typeName))?.typeId ?? ""
  );

  setForm({
    assetId: item.assetId,
    assetName: item.assetName || "",
    serialNumber: item.serialNumber || "",
    brand: item.brand || "",
    model: item.model || "",
    purchaseDate: item.purchaseDate || "",
    warrantyExpiry: item.warrantyExpiry || "",
    cost: item.cost || "",
    status: item.status || "AVAILABLE",
    assetCondition: item.assetCondition || "GOOD",
    notes: item.notes || "",
    locationName: item.locationName || "",
    typeId: resolvedTypeId,   // ✅ resolved from typeName → typeId
  });

  setShowModal(true);
};

  const handleDelete = async id => {
    if (!window.confirm("Delete this asset?")) return;
    try { await deleteAsset(id); fetchAssets(search, page); }
    catch (e) { console.error(e); }
  };

  const handleView = async item => {
    try {
      const res = await getAssetById(item.assetId);
      setViewData(res.data ?? res);
      setViewModal(true);
    } catch (e) { console.error(e); }
  };

  const filtered = filterType
    ? assets.filter(a =>
        String(a.assetType?.typeId) === String(filterType) ||
        String(types.find(t => t.typeName === a.typeName)?.typeId) === String(filterType)
      )
    : assets;

  const pageNums = [...Array(totalPages)].map((_, i) => i);

  const inputSx = {
    "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13, height: 36 },
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e0e0e0" }
  };
  const selectSx = {
    borderRadius: "8px", fontSize: 13, height: 36,
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e0e0e0" }
  };

  return (
    <Box sx={{ mt: "60px", p: "2rem 2.5rem", background: "#f4f6fb", minHeight: "100vh", fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* Header row */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5, flexWrap: "wrap", gap: 1.25 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 22, color: "#1a1a2e" }}>Asset</Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, fontSize: 13, color: "#555" }}>
            <Typography sx={{ fontSize: 13, color: "#555" }}>Showing</Typography>
            <Select value={showCount} onChange={e => setShowCount(Number(e.target.value))} size="small"
              sx={{ fontSize: 13, borderRadius: "6px", height: 30, "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e0e0e0" } }}>
              {[5, 10, 20, 50].map(n => <MenuItem key={n} value={n} sx={{ fontSize: 13 }}>{n}</MenuItem>)}
            </Select>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, border: "1px solid #e0e0e0", borderRadius: "8px", px: 1.5, py: "5px", background: "#fff" }}>
            <FaFilter size={12} />
            <Select value={filterType} onChange={e => setFilterType(e.target.value)} displayEmpty size="small"
              sx={{ fontSize: 13, border: "none", "& .MuiOutlinedInput-notchedOutline": { border: "none" }, height: 24, "& .MuiSelect-select": { p: 0, fontSize: 13, color: "#555" } }}>
              <MenuItem value="" sx={{ fontSize: 13 }}>All Types</MenuItem>
              {types.map(t => <MenuItem key={t.typeId} value={t.typeId} sx={{ fontSize: 13 }}>{t.typeName}</MenuItem>)}
            </Select>
          </Box>

          <Button variant="outlined" startIcon={<FaFileExport size={12} />}
            sx={{ textTransform: "none", fontSize: 13, borderColor: "#e0e0e0", color: "#555", borderRadius: "8px", py: "7px", px: 1.75 }}>
            Export
          </Button>

          <Button variant="contained" startIcon={<FaPlus size={11} />}
            onClick={() => { setForm(EMPTY); setShowModal(true); }}
            sx={{ textTransform: "none", fontSize: 13, fontWeight: 600, borderRadius: "8px", py: "8px", px: 2, background: "#1976d2", boxShadow: "none", "&:hover": { background: "#1565c0", boxShadow: "none" } }}>
            Add New Asset
          </Button>
        </Box>
      </Box>

      {/* Search bar */}
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <TextField placeholder="Search by name, serial, brand..." value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && (setPage(0), fetchAssets(search, 0))}
          size="small" sx={{ flex: 1, maxWidth: 380, ...inputSx }}
          InputProps={{ startAdornment: <InputAdornment position="start"><FaSearch style={{ color: "#aaa", fontSize: 13 }} /></InputAdornment> }} />
        <Tooltip title="Search">
          <IconButton onClick={() => { setPage(0); fetchAssets(search, 0); }}
            sx={{ width: 34, height: 34, border: "1px solid #e0e0e0", borderRadius: "8px", background: "#fff" }}>
            <FaSearch size={13} color="#1976d2" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Reset">
          <IconButton onClick={() => { setSearch(""); setPage(0); fetchAssets("", 0); }}
            sx={{ width: 34, height: 34, border: "1px solid #e0e0e0", borderRadius: "8px", background: "#fff" }}>
            <FaSyncAlt size={13} color="#757575" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Table */}
      <Paper elevation={0} sx={{ borderRadius: "14px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", overflow: "hidden" }}>
        <Box sx={{ overflowX: "auto" }}>
          <Table sx={{ minWidth: 900, fontSize: 13 }}>
            <TableHead>
              <TableRow sx={{ background: "#f8f9fc" }}>
                {["Asset Name ↕", "Asset ID ↕", "Value ↕", "Brand ↕", "Type ↕", "Location ↕", "Status ↕", "Condition ↕", "Actions ↕"].map(h => (
                  <TableCell key={h} sx={{ py: "12px", px: 2, fontSize: 12, fontWeight: 600, color: "#888", whiteSpace: "nowrap", borderBottom: "1px solid #f0f0f0" }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} sx={{ textAlign: "center", py: 5, color: "#aaa" }}>Loading...</TableCell></TableRow>
              ) : filtered.slice(0, showCount).length > 0 ? filtered.slice(0, showCount).map((item, i) => (
                <TableRow key={i} sx={{ borderBottom: "1px solid #f0f0f0", "&:hover": { background: "#fafbff" } }}>
                  <TableCell sx={{ py: "12px", px: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                      <Avatar sx={{ width: 32, height: 32, background: "#e8eaf6", color: "#3949ab", fontWeight: 700, fontSize: 13 }}>
                        {(item.assetName || "A")[0].toUpperCase()}
                      </Avatar>
                      <Typography sx={{ fontWeight: 500, fontSize: 13 }}>{item.assetName}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: "12px", px: 2, color: "#888", fontFamily: "monospace", fontSize: 13 }}>#{item.assetId}</TableCell>
                  <TableCell sx={{ py: "12px", px: 2, color: "#333", fontSize: 13 }}>₹{item.cost || "—"}</TableCell>
                  <TableCell sx={{ py: "12px", px: 2, color: "#333", fontSize: 13 }}>{item.brand || "—"}</TableCell>
                  {/* support both flat typeName and nested assetType.typeName */}
                  <TableCell sx={{ py: "12px", px: 2, color: "#333", fontSize: 13 }}>{item.typeName || item.assetType?.typeName || "—"}</TableCell>
                  {/* ✅ NEW: Location column */}
                  <TableCell sx={{ py: "12px", px: 2, color: "#555", fontSize: 13 }}>{item.locationName || "—"}</TableCell>
                  <TableCell sx={{ py: "12px", px: 2 }}><Pill label={item.status} map={STATUS_COLORS} /></TableCell>
                  <TableCell sx={{ py: "12px", px: 2 }}><Pill label={item.assetCondition} map={CONDITION_COLORS} /></TableCell>
                  <TableCell sx={{ py: "12px", px: 2, textAlign: "center" }}>
                    <Box sx={{ display: "flex", justifyContent: "center", gap: 0.75 }}>
                      <ActionBtn title="View" color="#1976d2" hoverBg="#e3f2fd" onClick={() => handleView(item)}><FaEye size={13} /></ActionBtn>
                      <ActionBtn title="Edit" color="#f59e0b" hoverBg="#fffbeb" onClick={() => handleEdit(item)}><FaEdit size={13} /></ActionBtn>
                      <ActionBtn title="Delete" color="#ef4444" hoverBg="#fef2f2" onClick={() => handleDelete(item.assetId)}><FaTrash size={13} /></ActionBtn>
                    </Box>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={9} sx={{ textAlign: "center", py: 5, color: "#aaa" }}>No assets found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Box>

        {/* Pagination */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2.5, py: 1.5, borderTop: "1px solid #f0f0f0", flexWrap: "wrap", gap: 1 }}>
          <Button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} sx={pageBtnSx(false)}>‹ Previous</Button>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            {pageNums.map(i => (
              <Button key={i} onClick={() => setPage(i)} sx={pageBtnSx(page === i)}>{String(i + 1).padStart(2, "0")}</Button>
            ))}
          </Box>
          <Button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} sx={pageBtnSx(false)}>Next ›</Button>
        </Box>
      </Paper>

      {/* Add / Edit Modal */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: "14px", p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16, pb: 1 }}>
          {form.assetId ? "Edit Asset" : "Add New Asset"}
        </DialogTitle>
        <DialogContent sx={{ pt: "8px !important" }}>
          <Grid container spacing={1.25}>
            {[["assetName","Asset Name"],["serialNumber","Serial Number"],["brand","Brand"],["model","Model"]].map(([n,l]) => (
              <Grid item xs={6} key={n}>
                <TextField name={n} placeholder={l} value={form[n]} onChange={handleChange} size="small" fullWidth sx={inputSx} />
              </Grid>
            ))}
            <Grid item xs={6}>
              <TextField name="purchaseDate" type="date" value={form.purchaseDate} onChange={handleChange} size="small" fullWidth sx={inputSx} />
            </Grid>
            <Grid item xs={6}>
              <TextField name="warrantyExpiry" type="date" value={form.warrantyExpiry} onChange={handleChange} size="small" fullWidth sx={inputSx} />
            </Grid>
            <Grid item xs={6}>
              <TextField name="cost" type="number" placeholder="Cost" value={form.cost} onChange={handleChange} size="small" fullWidth sx={inputSx} />
            </Grid>
            <Grid item xs={6}>
              <Select name="status" value={form.status} onChange={handleChange} size="small" fullWidth sx={selectSx}>
                {["AVAILABLE","ASSIGNED","DAMAGED"].map(s => <MenuItem key={s} value={s} sx={{ fontSize: 13 }}>{s}</MenuItem>)}
              </Select>
            </Grid>
            <Grid item xs={6}>
              <Select name="assetCondition" value={form.assetCondition} onChange={handleChange} size="small" fullWidth sx={selectSx}>
                {["GOOD","FAIR","POOR"].map(c => <MenuItem key={c} value={c} sx={{ fontSize: 13 }}>{c}</MenuItem>)}
              </Select>
            </Grid>
            {/* ✅ Type dropdown — shows typeName, stores typeId */}
            <Grid item xs={6}>
              <Select
  name="typeId"
  value={form.typeId}
  onChange={handleChange}
  displayEmpty
  size="small"
  fullWidth
>
  <MenuItem value="" disabled>
    Select Type
  </MenuItem>

  {types.map((t) => (
    <MenuItem
      key={t.typeId}
      value={String(t.typeId)}
    >
      {t.typeName}
    </MenuItem>
  ))}
</Select>
            </Grid>
            {/* ✅ Location Name field */}
            <Grid item xs={6}>
              <TextField name="locationName" placeholder="Location Name" value={form.locationName} onChange={handleChange} size="small" fullWidth sx={inputSx} />
            </Grid>
            <Grid item xs={12}>
              <TextField name="notes" placeholder="Notes" value={form.notes} onChange={handleChange} size="small" fullWidth sx={inputSx} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setShowModal(false)} variant="outlined"
            sx={{ textTransform: "none", fontSize: 13, borderColor: "#e0e0e0", color: "#555", borderRadius: "8px" }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained"
            sx={{ textTransform: "none", fontSize: 13, fontWeight: 600, borderRadius: "8px", background: "#1976d2", boxShadow: "none", "&:hover": { background: "#1565c0", boxShadow: "none" } }}>
            {form.assetId ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Modal */}
      <Dialog open={viewModal} onClose={() => setViewModal(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: "14px", p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16, pb: 1 }}>Asset Details</DialogTitle>
        <DialogContent sx={{ pt: "8px !important" }}>
          <Grid container spacing={1} sx={{ maxHeight: "60vh", overflowY: "auto" }}>
            {viewData && Object.entries(viewData).map(([k, v]) => (
              <Grid item xs={6} key={k}>
                <Box sx={{ background: "#f5f6fa", borderRadius: "8px", p: "8px 12px", border: "1px solid #e8e8e8" }}>
                  <Typography sx={{ fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.25 }}>{k}</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 500, wordBreak: "break-word" }}>{String(v ?? "—")}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
          <Button onClick={() => setViewModal(false)} variant="outlined"
            sx={{ textTransform: "none", fontSize: 13, borderColor: "#e0e0e0", color: "#555", borderRadius: "8px" }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function ActionBtn({ children, title, color, hoverBg, onClick }) {
  return (
    <Tooltip title={title}>
      <IconButton onClick={onClick} size="small"
        sx={{ width: 30, height: 30, border: "1px solid #e0e0e0", borderRadius: "6px", background: "#fff", color, "&:hover": { background: hoverBg }, transition: "all .15s" }}>
        {children}
      </IconButton>
    </Tooltip>
  );
}

const pageBtnSx = active => ({
  minWidth: 0, px: "10px", py: "5px",
  border: `1px solid ${active ? "#1976d2" : "#e0e0e0"}`,
  borderRadius: "6px", background: active ? "#1976d2" : "#fff",
  color: active ? "#fff" : "#555", fontSize: 12, fontWeight: active ? 700 : 400,
  textTransform: "none", "&:hover": { background: active ? "#1565c0" : "#f5f5f5" },
  "&.Mui-disabled": { background: "#fff", color: "#ccc", borderColor: "#e0e0e0" },
});