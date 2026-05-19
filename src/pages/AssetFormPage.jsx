import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Box, Button, Grid, TextField, Select, MenuItem,
  IconButton, Tooltip, CircularProgress, Typography, InputAdornment,
} from "@mui/material";
import {
  FaArrowLeft, FaBox, FaBarcode, FaTrademark, FaCubes,
  FaCalendarAlt, FaShieldAlt, FaDollarSign, FaMapMarkerAlt,
  FaBuilding, FaStickyNote, FaImage, FaCheckCircle, FaEdit, FaHome, FaChevronRight,
} from "react-icons/fa";
import { MdOutlineInventory2 } from "react-icons/md";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import toast from "react-hot-toast";
import { inputSx, selectSx, primaryBtnSx, outlinedBtnSx, COLORS } from "../theme/tokens";
import { getAssetTypes, addAsset, updateAsset, getAssetById, uploadAssetImage, getImageUrl } from "../services/assets_service";
import { getCompanies } from "../services/Company service";
import { moveAsset } from "../services/location_history_service";
import { fetchAssets } from "../store/slices/assetSlice";

const EMPTY = {
  assetId: null, assetName: "", serialNumber: "", brand: "", model: "",
  purchaseDate: "", warrantyExpiry: "", cost: "", status: "AVAILABLE",
  assetCondition: "GOOD", notes: "", typeId: "", locationName: "", companyName: "", imagePath: "",
};

const getAssetTypeList = (res) => {
  const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : res?.data?.content ?? res?.content ?? [];
  return list.map((t) => ({ typeId: t.typeId ?? t.id, typeName: t.typeName ?? t.name })).filter((t) => t.typeId != null && t.typeName);
};

// ── Section header ──
function Section({ icon, title, index }) {
  return (
    <Box sx={{
      display: "flex", alignItems: "center", gap: 1, mb: 2, mt: index === 0 ? 0 : 3,
      animation: `sIn .4s ease ${index * 60}ms both`,
      "@keyframes sIn": { from: { opacity: 0, transform: "translateX(-8px)" }, to: { opacity: 1, transform: "translateX(0)" } },
    }}>
      <Box sx={{ width: 28, height: 28, borderRadius: "8px", background: COLORS.primaryLight,
        display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.primary, flexShrink: 0 }}>
        {icon}
      </Box>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.text, textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {title}
      </Typography>
      <Box sx={{ flex: 1, height: "1px", background: COLORS.borderLight }} />
    </Box>
  );
}

const anim = (i) => ({
  animation: `fIn .38s cubic-bezier(.22,1,.36,1) ${60 + i * 35}ms both`,
  "@keyframes fIn": { from: { opacity: 0, transform: "translateY(10px)" }, to: { opacity: 1, transform: "translateY(0)" } },
});

const adorn = (icon) => (
  <InputAdornment position="start">
    <Box sx={{ color: "#c0c0c0", display: "flex", fontSize: 13 }}>{icon}</Box>
  </InputAdornment>
);

export default function AssetFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { page, search } = useSelector((s) => s.assets);
  const { userName } = useSelector((s) => s.auth);
  const isEdit = !!id;

  const [form,             setForm]             = useState(EMPTY);
  const [originalLocation, setOriginalLocation] = useState("");
  const [types,        setTypes]        = useState([]);
  const [companies,    setCompanies]    = useState([]);
  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading,    setUploading]    = useState(false);
  const [detecting,    setDetecting]    = useState(false);
  const [gpsError,     setGpsError]     = useState("");
  const [loading,      setLoading]      = useState(isEdit);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  useEffect(() => {
    getAssetTypes().then((r) => setTypes(getAssetTypeList(r))).catch(() => {});
    getCompanies().then(setCompanies).catch(() => {});
    if (isEdit) {
      getAssetById(id).then((res) => {
        const d = res.data ?? res;
        setForm({
          assetId: d.assetId, assetName: d.assetName || "", serialNumber: d.serialNumber || "",
          brand: d.brand || "", model: d.model || "", purchaseDate: d.purchaseDate || "",
          warrantyExpiry: d.warrantyExpiry || "", cost: d.cost || "", status: d.status || "AVAILABLE",
          assetCondition: d.assetCondition || "GOOD", notes: d.notes || "",
          locationName: d.locationName || "", companyName: d.companyName || "",
          typeId: String(d.typeId ?? d.assetType?.typeId ?? ""), imagePath: d.imagePath || "",
        });
        setOriginalLocation(d.locationName || "");

        // Block editing disposed assets — redirect back
        if (d.status?.toUpperCase() === "DISPOSED") {
          toast.error("Disposed assets cannot be edited.");
          navigate("/home/assets");
          return;
        }

        if (d.imagePath) setImagePreview(getImageUrl(d.imagePath));
        setLoading(false);
      }).catch(() => { toast.error("Failed to load asset"); navigate("/home/assets"); });
    }
  }, [id]);

  const handleDetectLocation = () => {
    setGpsError("");
    if (!navigator.geolocation) { setGpsError("GPS not supported."); return; }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.state || "";
          setForm((f) => ({ ...f, locationName: city }));
        } catch { setGpsError("Could not fetch location."); }
        finally  { setDetecting(false); }
      },
      (err) => { setDetecting(false); setGpsError(err.code === 1 ? "GPS permission denied." : "Could not get location."); },
      { timeout: 10000 }
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.assetName.trim()) { toast.error("Asset name is required"); return; }
    setUploading(true);
    try {
      let resolvedImagePath = form.imagePath || null;
      if (imageFile) resolvedImagePath = await uploadAssetImage(imageFile);

      const payload = {
        assetName: form.assetName, serialNumber: form.serialNumber, brand: form.brand, model: form.model,
        purchaseDate: form.purchaseDate || null, warrantyExpiry: form.warrantyExpiry || null,
        cost: form.cost === "" ? null : Number(form.cost),
        status: form.status, assetCondition: form.assetCondition, notes: form.notes,
        typeId: form.typeId === "" ? null : Number(form.typeId),
        locationName: form.locationName || null, companyName: form.companyName || null,
        imagePath: resolvedImagePath,
      };

      if (isEdit) {
        // If location changed, write history BEFORE updating the asset
        // (so the backend still sees the old location in DB when it records fromLocation)
        const newLocation = form.locationName?.trim() || "";
        const oldLocation = originalLocation?.trim() || "";
        if (newLocation && newLocation !== oldLocation) {
          try {
            await moveAsset({
              assetId: form.assetId,
              fromLocation: oldLocation || null,
              newLocation,
              movedBy: userName || "Admin",
              reason: "Updated via asset edit form",
            });
          } catch {
            // History write failure should not block the main save
          }
        }
        await updateAsset(form.assetId, payload);
        toast.success("Asset updated successfully");
      } else {
        await addAsset(payload);
        toast.success("Asset created successfully");
      }

      dispatch(fetchAssets({ keyword: search, page, size: 10 }));
      navigate("/home/assets");
    } catch (e) {
      if (e.response?.status === 409) {
        toast.error(e.response.data.message);
      } else {
        toast.error(e.response?.data?.message || "Failed to save asset");
      }
    } finally { setUploading(false); }
  };

  if (loading) return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: COLORS.bg }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ mt: "60px", minHeight: "100vh", background: COLORS.bg, fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* ── Top bar ── */}
      <Box sx={{
        px: "2.5rem", py: 1.75, background: "#fff", borderBottom: `1px solid ${COLORS.borderLight}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        animation: "topIn .35s ease both",
        "@keyframes topIn": { from: { opacity: 0, transform: "translateY(-8px)" }, to: { opacity: 1, transform: "translateY(0)" } },
      }}>
        {/* Breadcrumb */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, fontSize: 13, color: COLORS.textFaint }}>
          <FaHome size={12} />
          <Box component="span" onClick={() => navigate("/home")}
            sx={{ cursor: "pointer", "&:hover": { color: COLORS.primary }, transition: "color .2s" }}>Home</Box>
          <FaChevronRight size={10} />
          <Box component="span" onClick={() => navigate("/home/assets")}
            sx={{ cursor: "pointer", "&:hover": { color: COLORS.primary }, transition: "color .2s" }}>Assets</Box>
          <FaChevronRight size={10} />
          <Box component="span" sx={{ color: COLORS.primary, fontWeight: 600 }}>
            {isEdit ? "Edit Asset" : "New Asset"}
          </Box>
        </Box>

        <Button variant="outlined" startIcon={<FaArrowLeft size={11} />}
          onClick={() => navigate("/home/assets")}
          sx={{ ...outlinedBtnSx, fontSize: 12, py: "5px" }}>
          Back to Assets
        </Button>
      </Box>

      {/* ── Page content ── */}
      <Box sx={{ maxWidth: 720, mx: "auto", px: 3, py: 4 }}>

        {/* Page title */}
        <Box sx={{
          display: "flex", alignItems: "center", gap: 2, mb: 3,
          animation: "titleIn .4s ease .05s both",
          "@keyframes titleIn": { from: { opacity: 0, transform: "translateY(12px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        }}>
          <Box sx={{
            width: 46, height: 46, borderRadius: "12px",
            background: isEdit ? "linear-gradient(135deg,#fff3e0,#ffe0b2)" : "linear-gradient(135deg,#e3f2fd,#bbdefb)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: isEdit ? "#e65100" : COLORS.primary,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}>
            {isEdit ? <FaEdit size={18} /> : <FaBox size={18} />}
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 20, color: COLORS.text, lineHeight: 1.2 }}>
              {isEdit ? "Edit Asset" : "Add New Asset"}
            </Typography>
            <Typography sx={{ fontSize: 13, color: COLORS.textFaint, mt: 0.3 }}>
              {isEdit ? "Update the asset details below" : "Fill in the information to register a new asset"}
            </Typography>
          </Box>
        </Box>

        {/* ── Card ── */}
        <Box sx={{
          background: "#fff", borderRadius: "16px", border: `1px solid ${COLORS.borderLight}`,
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)", p: { xs: 2.5, sm: 3.5 },
          animation: "cardIn .45s cubic-bezier(.22,1,.36,1) .08s both",
          "@keyframes cardIn": { from: { opacity: 0, transform: "translateY(20px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        }}>

          {/* Basic Info */}
          <Section icon={<MdOutlineInventory2 size={14} />} title="Basic Information" index={0} />
          <Grid container spacing={2}>
            <Grid size={12} sx={anim(0)}>
              <Typography sx={{ fontSize: 11, color: COLORS.textFaint, mb: 0.5 }}>Asset Name *</Typography>
              <TextField name="assetName" placeholder="e.g. Dell Laptop Pro" value={form.assetName} onChange={onChange}
                size="small" fullWidth sx={inputSx}
                slotProps={{ input: { startAdornment: adorn(<FaBox size={12} />) } }} />
            </Grid>
            <Grid size={6} sx={anim(1)}>
              <Typography sx={{ fontSize: 11, color: COLORS.textFaint, mb: 0.5 }}>Serial Number</Typography>
              <TextField name="serialNumber" placeholder="SN-XXXXXXXX" value={form.serialNumber} onChange={onChange}
                size="small" fullWidth sx={inputSx}
                slotProps={{ input: { startAdornment: adorn(<FaBarcode size={12} />) } }} />
            </Grid>
            <Grid size={6} sx={anim(2)}>
              <Typography sx={{ fontSize: 11, color: COLORS.textFaint, mb: 0.5 }}>Brand</Typography>
              <TextField name="brand" placeholder="e.g. Dell, HP, Apple" value={form.brand} onChange={onChange}
                size="small" fullWidth sx={inputSx}
                slotProps={{ input: { startAdornment: adorn(<FaTrademark size={12} />) } }} />
            </Grid>
            <Grid size={6} sx={anim(3)}>
              <Typography sx={{ fontSize: 11, color: COLORS.textFaint, mb: 0.5 }}>Model</Typography>
              <TextField name="model" placeholder="e.g. XPS 15" value={form.model} onChange={onChange}
                size="small" fullWidth sx={inputSx}
                slotProps={{ input: { startAdornment: adorn(<FaCubes size={12} />) } }} />
            </Grid>
            <Grid size={6} sx={anim(4)}>
              <Typography sx={{ fontSize: 11, color: COLORS.textFaint, mb: 0.5 }}>Asset Type</Typography>
              <Select name="typeId" value={form.typeId} onChange={onChange} displayEmpty size="small" fullWidth sx={selectSx}>
                <MenuItem value="" disabled sx={{ fontSize: 13 }}>Select Type</MenuItem>
                {types.map((t) => <MenuItem key={t.typeId} value={String(t.typeId)} sx={{ fontSize: 13 }}>{t.typeName}</MenuItem>)}
              </Select>
            </Grid>
          </Grid>

          {/* Purchase Details */}
          <Section icon={<FaDollarSign size={13} />} title="Purchase Details" index={1} />
          <Grid container spacing={2}>
            <Grid size={4} sx={anim(5)}>
              <Typography sx={{ fontSize: 11, color: COLORS.textFaint, mb: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}>
                <FaCalendarAlt size={10} /> Purchase Date
              </Typography>
              <TextField name="purchaseDate" type="date" value={form.purchaseDate} onChange={onChange}
                size="small" fullWidth sx={inputSx} />
            </Grid>
            <Grid size={4} sx={anim(6)}>
              <Typography sx={{ fontSize: 11, color: COLORS.textFaint, mb: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}>
                <FaShieldAlt size={10} /> Warranty Expiry
              </Typography>
              <TextField name="warrantyExpiry" type="date" value={form.warrantyExpiry} onChange={onChange}
                size="small" fullWidth sx={inputSx} />
            </Grid>
            <Grid size={4} sx={anim(7)}>
              <Typography sx={{ fontSize: 11, color: COLORS.textFaint, mb: 0.5 }}>Cost (₹)</Typography>
              <TextField name="cost" type="number" placeholder="0.00" value={form.cost} onChange={onChange}
                size="small" fullWidth sx={inputSx}
                slotProps={{ input: { startAdornment: adorn(<FaDollarSign size={12} />) } }} />
            </Grid>
          </Grid>

          {/* Status & Condition */}
          <Section icon={<FaCheckCircle size={13} />} title="Status & Condition" index={2} />
          <Grid container spacing={2}>
            <Grid size={6} sx={anim(8)}>
              <Typography sx={{ fontSize: 11, color: COLORS.textFaint, mb: 0.5 }}>Status</Typography>
              <Select name="status" value={form.status} onChange={onChange} size="small" fullWidth sx={selectSx}
                disabled={form.status === "ASSIGNED"}>
                {["AVAILABLE", "DAMAGED"].map((v) => (
                  <MenuItem key={v} value={v} sx={{ fontSize: 13 }}>{v}</MenuItem>
                ))}
                {form.status === "ASSIGNED" && (
                  <MenuItem value="ASSIGNED" sx={{ fontSize: 13, color: "#f97316" }}>ASSIGNED (via Allocation)</MenuItem>
                )}
              </Select>
              {form.status === "ASSIGNED" && (
                <Typography sx={{ fontSize: 11, color: "#f97316", mt: 0.5 }}>
                  ⚠ Status is controlled by the Allocation page
                </Typography>
              )}
            </Grid>
            <Grid size={6} sx={anim(9)}>
              <Typography sx={{ fontSize: 11, color: COLORS.textFaint, mb: 0.5 }}>Condition</Typography>
              <Select name="assetCondition" value={form.assetCondition} onChange={onChange} size="small" fullWidth sx={selectSx}>
                {["GOOD", "FAIR", "POOR"].map((v) => (
                    <MenuItem key={v} value={v} sx={{ fontSize: 13 }}>{v}</MenuItem>
                  ))}
              </Select>
            </Grid>
          </Grid>

          {/* Location & Company */}
          <Section icon={<FaMapMarkerAlt size={13} />} title="Location & Company" index={3} />
          <Grid container spacing={2}>
            <Grid size={6} sx={anim(10)}>
              <Typography sx={{ fontSize: 11, color: COLORS.textFaint, mb: 0.5 }}>Location</Typography>
              <TextField name="locationName" placeholder="City / Location" value={form.locationName} onChange={onChange}
                size="small" fullWidth sx={inputSx}
                slotProps={{ input: {
                  startAdornment: adorn(<FaMapMarkerAlt size={12} />),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Detect my location">
                        <span>
                          <IconButton size="small" onClick={handleDetectLocation} disabled={detecting}
                            sx={{ p: "3px", color: COLORS.primary, "&:hover": { background: COLORS.primaryLight } }}>
                            {detecting ? <CircularProgress size={12} thickness={5} /> : <MyLocationIcon sx={{ fontSize: 15 }} />}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}} />
              {gpsError && <Typography sx={{ fontSize: 11, color: "#c62828", mt: 0.4 }}>{gpsError}</Typography>}
            </Grid>
            <Grid size={6} sx={anim(11)}>
              <Typography sx={{ fontSize: 11, color: COLORS.textFaint, mb: 0.5 }}>Company</Typography>
              <Select name="companyName" value={form.companyName} onChange={onChange} displayEmpty size="small" fullWidth sx={selectSx}>
                <MenuItem value="" disabled sx={{ fontSize: 13 }}>Select Company</MenuItem>
                {companies.map((c) => <MenuItem key={c.companyId} value={c.companyName} sx={{ fontSize: 13 }}>{c.companyName}</MenuItem>)}
              </Select>
            </Grid>
          </Grid>

          {/* Notes */}
          <Section icon={<FaStickyNote size={13}  />} title="Notes" index={4} />
          <Box sx={anim(12)}>
            <TextField name="notes" placeholder="Additional notes about this asset..." value={form.notes} onChange={onChange}
              size="small" fullWidth multiline rows={3}
              sx={{ ...inputSx, "& .MuiOutlinedInput-root": { ...inputSx["& .MuiOutlinedInput-root"], height: "auto" } }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: "8px", color: "#c0c0c0" }}><FaStickyNote size={12} /></InputAdornment> } }} />
          </Box>

          {/* Image Upload */}
          <Section icon={<FaImage size={13} />} title="Asset Image" index={5} />
          <Box sx={{
            ...anim(13),
            border: `2px dashed ${imagePreview ? COLORS.primary : "#ddd"}`,
            borderRadius: "12px", p: 2.5, textAlign: "center",
            background: imagePreview ? COLORS.primaryLight : "#fafafa",
            transition: "all .3s ease",
            "&:hover": { borderColor: COLORS.primary, background: COLORS.primaryLight },
          }}>
            {imagePreview ? (
              <Box>
                <img src={imagePreview} alt="preview"
                  style={{ width: "100%", maxHeight: 200, objectFit: "contain", borderRadius: 8, marginBottom: 10 }} />
                <Button size="small" component="label" startIcon={<FaImage size={11} />}
                  sx={{ textTransform: "none", fontSize: 12, color: COLORS.primary, fontWeight: 600 }}>
                  Change Image
                  <input type="file" accept="image/*" hidden onChange={handleImageChange} />
                </Button>
              </Box>
            ) : (
              <Button component="label"
                sx={{ textTransform: "none", color: COLORS.primary, flexDirection: "column", gap: 0.75, py: 1.5 }}>
                <FaImage size={32} color={COLORS.primary} style={{ opacity: 0.4 }} />
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORS.primary }}>Click to upload image</Typography>
                <Typography sx={{ fontSize: 11, color: COLORS.textFaint }}>PNG, JPG up to 5MB</Typography>
                <input type="file" accept="image/*" hidden onChange={handleImageChange} />
              </Button>
            )}
          </Box>

        </Box>

        {/* ── Action bar ── */}
        <Box sx={{
          display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1.5, mt: 3,
          animation: "barIn .4s ease .2s both",
          "@keyframes barIn": { from: { opacity: 0, transform: "translateY(10px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        }}>
          <Typography sx={{ fontSize: 12, color: COLORS.textFaint, flex: 1 }}>
            * Required fields must be filled before saving
          </Typography>
          <Button variant="outlined" onClick={() => navigate("/home/assets")} sx={outlinedBtnSx}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={uploading}
            startIcon={uploading ? null : (isEdit ? <FaEdit size={12} /> : <FaCheckCircle size={12} />)}
            sx={{ ...primaryBtnSx, minWidth: 130 }}>
            {uploading ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : (isEdit ? "Update Asset" : "Save Asset")}
          </Button>
        </Box>

      </Box>
    </Box>
  );
}