import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import {
  Box, Button, Grid, MenuItem,
  IconButton, Tooltip, Typography, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
} from "@mui/material";
import SkeletonLoader from "../components/common/SkeletonLoader";
import {
  FaArrowLeft, FaBox, FaBarcode, FaTrademark, FaCubes,
  FaCalendarAlt, FaShieldAlt, FaDollarSign, FaMapMarkerAlt,
  FaBuilding, FaStickyNote, FaImage, FaCheckCircle, FaEdit, FaHome, FaChevronRight,
  FaPlus, FaBoxes, FaTimes,
} from "react-icons/fa";
import { MdOutlineInventory2 } from "react-icons/md";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import toast from "../utils/toast.jsx";
import { inputSx, selectSx, primaryBtnSx, outlinedBtnSx, COLORS, premiumDialogPaperSx, premiumDialogTitleSx } from "../theme/tokens";
import { required, isValidDate, isDateAfter, extractFieldErrors } from "../utils/validate";
import { getAssetTypes, addAsset, updateAsset, getAssetById, uploadAssetImage, getImageUrl, createAssetType } from "../services/assets_service";
import { getCompanies } from "../services/Company service";
import { getAllLocations, getCurrentLocation } from "../services/location_service";
import { moveAsset } from "../services/location_history_service";
import { useQueryClient } from "@tanstack/react-query";
import { FormTextField, FormSelect } from "../components/FormFields";

const getAssetTypeList = (res) => {
  const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : res?.data?.content ?? res?.content ?? [];
  return list.map((t) => ({ typeId: t.typeId ?? t.id, typeName: t.typeName ?? t.name })).filter((t) => t.typeId != null && t.typeName);
};

function Section({ icon, title, index }) {
  return (
    <Box sx={{
      display: "flex", alignItems: "center", gap: 0.75, mb: 0.75, mt: index === 0 ? 0 : 1.25,
      animation: `sIn .4s ease ${index * 60}ms both`,
      "@keyframes sIn": { from: { opacity: 0, transform: "translateX(-8px)" }, to: { opacity: 1, transform: "translateX(0)" } },
    }}>
      <Box sx={{
        width: 20, height: 20, borderRadius: "4px", background: COLORS.primaryLight,
        display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.primary, flexShrink: 0
      }}>
        {icon}
      </Box>
      <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: COLORS.text, textTransform: "uppercase", letterSpacing: "0.07em" }}>
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
    <Box sx={{ color: "#c0c0c0", display: "flex", fontSize: 11 }}>{icon}</Box>
  </InputAdornment>
);

export default function AssetFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { page, search } = useSelector((s) => s.assets);
  const { userName } = useSelector((s) => s.auth);
  const isEdit = !!id;

  const [originalLocation, setOriginalLocation] = useState("");
  const [types, setTypes] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [locations, setLocations] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [loading, setLoading] = useState(isEdit);

  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [typeDialogLoading, setTypeDialogLoading] = useState(false);

  const { control, handleSubmit, reset, setValue, setError, watch } = useForm({
    defaultValues: {
      assetName: "",
      serialNumber: "",
      brand: "",
      model: "",
      typeId: "",
      purchaseDate: "",
      warrantyExpiry: "",
      cost: "",
      status: "AVAILABLE",
      assetCondition: "GOOD",
      locationId: "",
      companyName: "",
      notes: "",
      imagePath: "",
    }
  });

  const typeForm = useForm({
    defaultValues: { newTypeName: "" }
  });

  const currentStatus = watch("status");
  const purchaseDateValue = watch("purchaseDate");
  const selectedCompany = watch("companyName");
  const selectedLocationId = watch("locationId");

  const filteredLocations = locations.filter(loc => 
    !selectedCompany || (loc.companyName === selectedCompany)
  );

  // Auto-reset location if it doesn't match the new company selection
  useEffect(() => {
    if (selectedCompany && selectedLocationId) {
      const match = locations.find(loc => loc.locationId === Number(selectedLocationId));
      if (match && match.companyName && match.companyName !== selectedCompany) {
        setValue("locationId", "");
      }
    }
  }, [selectedCompany, locations, selectedLocationId, setValue]);

  const handleTypeChange = (e, rhfOnChange) => {
    const val = e.target.value;
    if (val === "ADD_NEW") {
      setTypeDialogOpen(true);
      typeForm.reset({ newTypeName: "" });
    } else {
      rhfOnChange(val);
    }
  };

  const handleAddType = async (data) => {
    if (!data.newTypeName?.trim()) {
      toast.error("Type name cannot be empty");
      return;
    }
    setTypeDialogLoading(true);
    try {
      const res = await createAssetType(data.newTypeName.trim());
      toast.success("Asset type created successfully");
      const r = await getAssetTypes();
      const updatedTypes = getAssetTypeList(r);
      setTypes(updatedTypes);
      const created = updatedTypes.find((t) => t.typeName?.toLowerCase() === data.newTypeName.trim().toLowerCase());
      if (created) {
        setValue("typeId", String(created.typeId));
      }
      setTypeDialogOpen(false);
      typeForm.reset();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create asset type");
    } finally {
      setTypeDialogLoading(false);
    }
  };

  useEffect(() => {
    getAssetTypes().then((r) => setTypes(getAssetTypeList(r))).catch(() => { });
    getCompanies().then(setCompanies).catch(() => { });
    getAllLocations().then((r) => {
      const raw = r?.data ?? r;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      setLocations(list);
    }).catch(() => { });
    if (isEdit) {
      getAssetById(id).then((res) => {
        const d = res.data ?? res;
        reset({
          assetName: d.assetName || "",
          serialNumber: d.serialNumber || "",
          brand: d.brand || "",
          model: d.model || "",
          purchaseDate: d.purchaseDate || "",
          warrantyExpiry: d.warrantyExpiry || "",
          cost: d.cost ?? "",
          status: d.status || "AVAILABLE",
          assetCondition: d.assetCondition || "GOOD",
          notes: d.notes || "",
          locationId: String(d.locationId || ""),
          companyName: d.companyName || "",
          typeId: String(d.typeId ?? d.assetType?.typeId ?? ""),
          imagePath: d.imagePath || "",
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
  }, [id, isEdit, reset, navigate]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleDetectLocation = () => {
    setGpsError("");
    setDetecting(true);

    const performCityMatch = (city, successPrefix = "Detected location") => {
      if (!city) return false;
      const match = filteredLocations.find(loc => {
        const locName = loc.locationName?.toLowerCase() || "";
        const cityName = city.toLowerCase();
        return locName === cityName || locName.includes(cityName) || cityName.includes(locName);
      });
      if (match) {
        setValue("locationId", String(match.locationId));
        toast.success(`${successPrefix}: matched to registered location "${match.locationName}"`);
        return true;
      }
      toast.info(`${successPrefix} is "${city}", but it is not registered under the selected company.`);
      return false;
    };

    const runIpFallback = async (reason) => {
      const id = toast.loading(`GPS unavailable (${reason}). Falling back to IP detection...`);
      try {
        const res = await getCurrentLocation();
        const data = res?.data ?? res;
        if (data?.city) {
          const matched = performCityMatch(data.city, "Detected location via IP");
          if (matched) {
            toast.success(`Fallback succeeded: location auto-selected via IP.`, { id });
          } else {
            toast.dismiss(id);
          }
        } else {
          toast.error("IP auto-detection could not resolve your city.", { id });
        }
      } catch {
        toast.error("Auto-detection failed. Please select your location manually.", { id });
      } finally {
        setDetecting(false);
      }
    };

    if (!navigator.geolocation) {
      runIpFallback("GPS not supported by browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          
          // 1. Proximity matching (Haversine formula)
          let closestLoc = null;
          let minDistance = Infinity;

          filteredLocations.forEach(loc => {
            if (loc.latitude != null && loc.longitude != null) {
              const dist = calculateDistance(latitude, longitude, Number(loc.latitude), Number(loc.longitude));
              if (dist < minDistance) {
                minDistance = dist;
                closestLoc = loc;
              }
            }
          });

          // If closest location is within 20 km, auto-select it
          if (closestLoc && minDistance <= 20) {
            setValue("locationId", String(closestLoc.locationId));
            toast.success(`Matched to nearest registered office: ${closestLoc.locationName} (${minDistance.toFixed(1)} km away)`);
            setDetecting(false);
            return;
          }

          // 2. City name fallback matching (if no location matches proximity)
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.state || "";
          
          performCityMatch(city, "Detected location via GPS");

        } catch (e) {
          runIpFallback("could not fetch coordinates address");
        } finally {
          setDetecting(false);
        }
      },
      (err) => {
        const errMsg = err.code === 1 ? "Permission denied" : "Timeout or GPS error";
        runIpFallback(errMsg);
      },
      { timeout: 8000 }
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data) => {
    setUploading(true);
    try {
      let resolvedImagePath = data.imagePath || null;
      if (imageFile) resolvedImagePath = await uploadAssetImage(imageFile);

      const payload = {
        assetName: data.assetName,
        serialNumber: data.serialNumber || null,
        brand: data.brand || null,
        model: data.model || null,
        purchaseDate: data.purchaseDate || null,
        warrantyExpiry: data.warrantyExpiry || null,
        cost: data.cost === "" ? null : Number(data.cost),
        status: data.status,
        assetCondition: data.assetCondition,
        notes: data.notes || null,
        typeId: data.typeId === "" ? null : Number(data.typeId),
        locationId: data.locationId === "" ? null : Number(data.locationId),
        imagePath: resolvedImagePath,
      };

      if (isEdit) {
        // If location changed, write history BEFORE updating the asset
        const newLocObj = locations.find(loc => loc.locationId === Number(data.locationId));
        const newLocationName = newLocObj ? newLocObj.locationName : "";
        const oldLocationName = originalLocation?.trim() || "";
        if (newLocationName && newLocationName !== oldLocationName) {
          try {
            await moveAsset({
              assetId: id,
              fromLocation: oldLocationName || null,
              newLocation: newLocationName,
              movedBy: userName || "Admin",
              reason: "Updated via asset edit form",
            });
          } catch {
            // History write failure should not block the main save
          }
        }
        await updateAsset(id, payload);
        toast.success("Asset updated successfully");
      } else {
        await addAsset(payload);
        toast.success("Asset created successfully");
      }

      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      navigate("/home/assets");
    } catch (e) {
      if (e.response?.status === 409) {
        toast.error(e.response.data.message);
      } else if (e.response?.status === 400) {
        const fe = extractFieldErrors(e);
        if (Object.keys(fe).length > 0) {
          Object.keys(fe).forEach((key) => {
            setError(key, { type: "server", message: fe[key] });
          });
          toast.error("Please fix the highlighted fields");
        } else {
          toast.error(e.response?.data?.message || "Failed to save asset");
        }
      } else {
        toast.error(e.response?.data?.message || "Failed to save asset");
      }
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <Box sx={{ p: 2 }}>
      <SkeletonLoader variant="detail" />
    </Box>
  );

  return (
    <Box sx={{ height: "calc(100vh - 70px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* ── Top bar ── */}
      <Box sx={{
        px: 1.5, py: 0.75, background: "#fff", borderBottom: `1px solid ${COLORS.borderLight}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
        animation: "topIn .35s ease both",
        "@keyframes topIn": { from: { opacity: 0, transform: "translateY(-8px)" }, to: { opacity: 1, transform: "translateY(0)" } },
      }}>
        {/* Breadcrumb */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, fontSize: 11.5, color: COLORS.textFaint }}>
          <FaHome size={11} />
          <Box component="span" onClick={() => navigate("/home")}
            sx={{ cursor: "pointer", "&:hover": { color: COLORS.primary }, transition: "color .2s" }}>Home</Box>
          <FaChevronRight size={9} />
          <Box component="span" onClick={() => navigate("/home/assets")}
            sx={{ cursor: "pointer", "&:hover": { color: COLORS.primary }, transition: "color .2s" }}>Assets</Box>
          <FaChevronRight size={9} />
          <Box component="span" sx={{ color: COLORS.primary, fontWeight: 600 }}>
            {isEdit ? "Edit Asset" : "New Asset"}
          </Box>
        </Box>

        <Button variant="outlined" startIcon={<FaArrowLeft size={10} />}
          onClick={() => navigate("/home/assets")}
          sx={outlinedBtnSx}>
          Back to Assets
        </Button>
      </Box>

      {/* ── Page content ── */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", p: 2, overflow: "hidden", maxWidth: 1200, width: "100%", mx: "auto" }}>
        {/* Page title */}
        <Box sx={{
          display: "flex", alignItems: "center", gap: 1.5, mb: 1.5, flexShrink: 0,
          animation: "titleIn .4s ease .05s both",
          "@keyframes titleIn": { from: { opacity: 0, transform: "translateY(12px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: "6px",
            background: isEdit ? "linear-gradient(135deg,#fff3e0,#ffe0b2)" : "linear-gradient(135deg,#e3f2fd,#bbdefb)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: isEdit ? "#e65100" : COLORS.primary,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}>
            {isEdit ? <FaEdit size={14} /> : <FaBox size={14} />}
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 14, color: COLORS.text, lineHeight: 1.2 }}>
              {isEdit ? "Edit Asset" : "Add New Asset"}
            </Typography>
            <Typography sx={{ fontSize: 11, color: COLORS.textFaint, mt: 0.15 }}>
              {isEdit ? "Update the asset details below" : "Fill in the information to register a new asset"}
            </Typography>
          </Box>
        </Box>

        {/* ── Card ── */}
        <Box sx={{
          flex: 1,
          background: "rgba(255, 255, 255, 0.98)",
          borderRadius: "14px",
          border: `1px solid rgba(226, 232, 240, 0.8)`,
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.04), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
          p: 3,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "cardIn .45s cubic-bezier(.22,1,.36,1) .08s both",
          "@keyframes cardIn": { from: { opacity: 0, transform: "translateY(20px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        }}>
          <Grid container spacing={4} sx={{ flex: 1, overflow: "hidden" }}>
            {/* Left Column: Basic Info & Status */}
            <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex", flexDirection: "column", gap: 1.5, height: "100%", overflowY: "auto", pr: 2 }}>
              {/* Basic Info */}
              <Section icon={<MdOutlineInventory2 size={14} />} title="Basic Information" index={0} />
              <Grid container spacing={2} sx={{ mb: 1 }}>
                <Grid size={{ xs: 12, md: 4 }} sx={anim(0)}>
                  <FormTextField
                    name="assetName"
                    control={control}
                    rules={{ required: "Asset name is required" }}
                    label="Asset Name *"
                    placeholder="e.g. Dell Laptop Pro"
                    slotProps={{ input: { startAdornment: adorn(<FaBox size={12} />) } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={anim(1)}>
                  <FormTextField
                    name="serialNumber"
                    control={control}
                    label="Serial Number"
                    placeholder="SN-XXXXXXXX"
                    slotProps={{ input: { startAdornment: adorn(<FaBarcode size={12} />) } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={anim(2)}>
                  <FormTextField
                    name="brand"
                    control={control}
                    label="Brand"
                    placeholder="e.g. Dell, HP, Apple"
                    slotProps={{ input: { startAdornment: adorn(<FaTrademark size={12} />) } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6 }} sx={anim(3)}>
                  <FormTextField
                    name="model"
                    control={control}
                    label="Model"
                    placeholder="e.g. XPS 15"
                    slotProps={{ input: { startAdornment: adorn(<FaCubes size={12} />) } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6 }} sx={anim(4)}>
                  <FormSelect
                    name="typeId"
                    control={control}
                    rules={{ required: "Asset type is required" }}
                    label="Asset Type *"
                    onChange={handleTypeChange}
                  >
                    <MenuItem value="" disabled sx={{ fontSize: 13 }}>Select Type</MenuItem>
                    {types.map((t) => <MenuItem key={t.typeId} value={String(t.typeId)} sx={{ fontSize: 13 }}>{t.typeName}</MenuItem>)}
                    <MenuItem value="ADD_NEW" sx={{ fontSize: 13, color: "#2563eb", fontWeight: 600, borderTop: "1px solid #e2e8f0", mt: 0.5 }}>
                      + Add New Type...
                    </MenuItem>
                  </FormSelect>
                </Grid>
              </Grid>

              {/* Status & Condition */}
              <Section icon={<FaCheckCircle size={13} />} title="Status & Condition" index={2} />
              <Grid container spacing={2}>
                <Grid size={6} sx={anim(8)}>
                  <FormSelect
                    name="status"
                    control={control}
                    label="Status"
                    disabled={currentStatus === "ASSIGNED"}
                  >
                    {["AVAILABLE", "DAMAGED", "UNDER_MAINTENANCE"].map((v) => (
                      <MenuItem key={v} value={v} sx={{ fontSize: 13 }}>{v.replace("_", " ")}</MenuItem>
                    ))}
                    {currentStatus === "ASSIGNED" && (
                      <MenuItem value="ASSIGNED" sx={{ fontSize: 13, color: "#f97316" }}>ASSIGNED (via Allocation)</MenuItem>
                    )}
                  </FormSelect>
                  {currentStatus === "ASSIGNED" && (
                    <Typography sx={{ fontSize: 11, color: "#f97316", mt: 0.5 }}>
                      ⚠ Status is controlled by the Allocation page
                    </Typography>
                  )}
                  {currentStatus === "UNDER_MAINTENANCE" && (
                    <Typography sx={{ fontSize: 11, color: "#e65100", mt: 0.5 }}>
                      🔧 Asset is under maintenance — allocation is blocked
                    </Typography>
                  )}
                </Grid>
                <Grid size={6} sx={anim(9)}>
                  <FormSelect
                    name="assetCondition"
                    control={control}
                    label="Condition"
                    options={["GOOD", "FAIR", "POOR"]}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Right Column: Purchase, Location, Notes & Image */}
            <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex", flexDirection: "column", gap: 1.5, height: "100%", overflowY: "auto", pl: 2, borderLeft: { md: "1px solid #f1f5f9" } }}>
              {/* Purchase Details */}
              <Section icon={<FaDollarSign size={13} />} title="Purchase Details" index={1} />
              <Grid container spacing={2} sx={{ mb: 1 }}>
                <Grid size={4} sx={anim(5)}>
                  <FormTextField
                    name="purchaseDate"
                    control={control}
                    rules={{
                      required: "Purchase date is required",
                      validate: (val) => isValidDate(val) || "Enter a valid purchase date"
                    }}
                    label="Purchase Date *"
                    type="date"
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                <Grid size={4} sx={anim(6)}>
                  <FormTextField
                    name="warrantyExpiry"
                    control={control}
                    rules={{
                      validate: (val) => {
                        if (!val) return true;
                        return isDateAfter(purchaseDateValue, val) || "Must be on or after purchase date";
                      }
                    }}
                    label="Warranty Expiry"
                    type="date"
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                <Grid size={4} sx={anim(7)}>
                  <FormTextField
                    name="cost"
                    control={control}
                    rules={{
                      required: "Cost is required",
                      validate: (val) => Number(val) >= 0 || "Cost must be zero or positive"
                    }}
                    label="Cost (₹) *"
                    type="number"
                    placeholder="0.00"
                    slotProps={{ input: { startAdornment: adorn(<FaDollarSign size={12} />) } }}
                  />
                </Grid>
              </Grid>

              {/* Location & Company */}
              <Section icon={<FaMapMarkerAlt size={13} />} title="Location & Company" index={3} />
              <Grid container spacing={2} sx={{ mb: 1 }}>
                <Grid size={6} sx={anim(10)}>
                  <FormSelect
                    name="companyName"
                    control={control}
                    rules={{ required: "Company is required" }}
                    label="Company *"
                  >
                    <MenuItem value="" disabled sx={{ fontSize: 13 }}>Select Company</MenuItem>
                    {companies.map((c) => <MenuItem key={c.companyId} value={c.companyName} sx={{ fontSize: 13 }}>{c.companyName}</MenuItem>)}
                  </FormSelect>
                </Grid>
                <Grid size={6} sx={anim(11)}>
                  <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <FormSelect
                        name="locationId"
                        control={control}
                        rules={{ required: "Location is required" }}
                        label="Location *"
                        disabled={!selectedCompany}
                      >
                        <MenuItem value="" disabled sx={{ fontSize: 13 }}>
                          {!selectedCompany ? "Select company first" : "Select Location"}
                        </MenuItem>
                        {filteredLocations.map((loc) => (
                          <MenuItem key={loc.locationId} value={String(loc.locationId)} sx={{ fontSize: 13 }}>
                            {loc.locationName}
                          </MenuItem>
                        ))}
                      </FormSelect>
                    </Box>
                    <Tooltip title={!selectedCompany ? "Select a company first" : "Detect my location"}>
                      <span>
                        <IconButton
                          disabled={detecting || !selectedCompany}
                          onClick={handleDetectLocation}
                          sx={{
                            mb: 0.5,
                            p: "6px",
                            height: 30,
                            width: 30,
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: "4px",
                            color: COLORS.primary,
                            "&:hover": { background: COLORS.primaryLight },
                            "&.Mui-disabled": { border: `1px solid ${COLORS.borderLight}` }
                          }}
                        >
                          {detecting ? <CircularProgress size={14} thickness={5} /> : <MyLocationIcon sx={{ fontSize: 16 }} />}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                  {gpsError && <Typography sx={{ fontSize: 11, color: "#c62828", mt: 0.5 }}>{gpsError}</Typography>}
                </Grid>
              </Grid>

              {/* Notes */}
              <Section icon={<FaStickyNote size={13} />} title="Notes" index={4} />
              <Box sx={{ ...anim(12), mb: 1 }}>
                <FormTextField
                  name="notes"
                  control={control}
                  label="Notes"
                  placeholder="Additional notes about this asset..."
                  multiline
                  rows={1.5}
                  sx={{ "& .MuiOutlinedInput-root": { height: "auto" } }}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: "8px", color: "#c0c0c0" }}><FaStickyNote size={12} /></InputAdornment> } }}
                />
              </Box>

              {/* Image Upload */}
              <Section icon={<FaImage size={13} />} title="Asset Image" index={5} />
              <Box sx={{
                ...anim(13),
                border: `2px dashed ${imagePreview ? COLORS.primary : "#ddd"}`,
                borderRadius: "8px", p: 1.5, textAlign: "center",
                background: imagePreview ? COLORS.primaryLight : "#fafafa",
                transition: "all .3s ease",
                "&:hover": { borderColor: COLORS.primary, background: COLORS.primaryLight },
              }}>
                {imagePreview ? (
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                    <img src={imagePreview} alt="preview"
                      style={{ maxHeight: 60, objectFit: "contain", borderRadius: 4 }} />
                    <Button size="small" component="label" startIcon={<FaImage size={11} />}
                      sx={{ textTransform: "none", fontSize: 12, color: COLORS.primary, fontWeight: 600 }}>
                      Change Image
                      <input type="file" accept="image/*" hidden onChange={handleImageChange} />
                    </Button>
                  </Box>
                ) : (
                  <Button component="label"
                    sx={{ textTransform: "none", color: COLORS.primary, display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 1.5, py: 0.5 }}>
                    <FaImage size={20} color={COLORS.primary} style={{ opacity: 0.6 }} />
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORS.primary }}>Click to upload image (PNG, JPG up to 5MB)</Typography>
                    <input type="file" accept="image/*" hidden onChange={handleImageChange} />
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* ── Action bar ── */}
          <Box sx={{
            display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1.5, mt: 2, pt: 1.5,
            borderTop: `1px solid ${COLORS.borderLight}`,
            flexShrink: 0,
            animation: "barIn .4s ease .2s both",
            "@keyframes barIn": { from: { opacity: 0, transform: "translateY(10px)" }, to: { opacity: 1, transform: "translateY(0)" } },
          }}>
            <Typography sx={{ fontSize: 11.5, color: COLORS.textFaint, flex: 1 }}>
              * Required fields must be filled before saving
            </Typography>
            <Button variant="outlined" onClick={() => navigate("/home/assets")} sx={outlinedBtnSx}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={uploading}
              startIcon={uploading ? null : (isEdit ? <FaEdit size={12} /> : <FaCheckCircle size={12} />)}
              sx={{ ...primaryBtnSx, minWidth: 130 }}>
              {uploading ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : (isEdit ? "Update Asset" : "Save Asset")}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* ── Dialog to add new type ── */}
      <Dialog
        open={typeDialogOpen}
        onClose={() => { if (!typeDialogLoading) setTypeDialogOpen(false); }}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: premiumDialogPaperSx } }}
      >
        <DialogTitle sx={premiumDialogTitleSx}>
          <span>Add Asset Type</span>
          <IconButton size="small" onClick={() => { if (!typeDialogLoading) { setTypeDialogOpen(false); } }} sx={{ color: COLORS.textFaint }} disabled={typeDialogLoading}><FaTimes size={13} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: "18px !important", pb: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
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
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, borderTop: "1px solid #f1f5f9", pt: 1.5 }}>
          <Button
            variant="outlined"
            onClick={() => { setTypeDialogOpen(false); }}
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