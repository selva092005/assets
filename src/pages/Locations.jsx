import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, InputAdornment,
  Table, TableBody, TableCell, TableHead, TableRow,
  Tooltip, Typography, MenuItem, Select, TextField,
  Accordion, AccordionSummary, AccordionDetails,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { FormTextField, FormSelect } from "../components/FormFields";
import {
  FaMapMarkerAlt, FaPlus, FaTimes, FaEdit, FaTrash,
  FaSearch, FaCheckCircle, FaBuilding, FaCrosshairs,
  FaChevronDown, FaSyncAlt, FaHome,
} from "react-icons/fa";
import toast from "../utils/toast.jsx";

import {
  getAllLocations, saveLocation, updateLocation, deleteLocation, getCurrentLocation,
} from "../services/location_service";
import { getCompanies } from "../services/Company service";
import PageHeader from "../components/common/PageHeader";
import TableCard from "../components/common/TableCard";
import TablePagination from "../components/common/TablePagination";
import PremiumDataGrid from "../components/common/PremiumDataGrid";
import ConfirmDialog from "../components/common/ConfirmDialog";
import StatCard from "../components/common/StatCard";
import ErrorState from "../components/common/ErrorState";
import SkeletonLoader from "../components/common/SkeletonLoader";
import { COLORS, primaryBtnSx, outlinedBtnSx, selectSx, premiumDialogPaperSx, premiumDialogTitleSx, searchFieldSx, resetBtnSx, locationIconSx } from "../theme/tokens";

// ── Helpers ───────────────────────────────────────────────────────────────────
function extractList(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

// ── Declarative Debounce Hook ──────────────────────────────────────────────────
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const getTypeChipColors = (type) => {
  switch (type?.toUpperCase()) {
    case "HQ":
      return { bg: "rgba(124, 58, 237, 0.04)", color: "#7c3aed", border: "rgba(124, 58, 237, 0.15)" }; // Purple
    case "OFFICE":
      return { bg: "rgba(5, 150, 105, 0.04)", color: "#059669", border: "rgba(5, 150, 105, 0.15)" }; // Green
    case "WAREHOUSE":
      return { bg: "rgba(37, 99, 213, 0.04)", color: "#2563eb", border: "rgba(37, 99, 213, 0.15)" }; // Blue
    case "LAB":
      return { bg: "rgba(217, 119, 6, 0.04)", color: "#d97706", border: "rgba(217, 119, 6, 0.15)" }; // Amber
    case "REMOTE HUB":
    case "REMOTE_HUB":
      return { bg: "rgba(13, 148, 136, 0.04)", color: "#0d9488", border: "rgba(13, 148, 136, 0.15)" }; // Teal
    default:
      return { bg: "rgba(100, 116, 139, 0.04)", color: "#64748b", border: "rgba(100, 116, 139, 0.15)" }; // Grey
  }
};

const accordionSx = {
  background: "transparent",
  boxShadow: "none",
  borderBottom: "1px solid #f1f5f9",
  "&:before": { display: "none" },
  "&.Mui-expanded": { margin: 0 },
  "&:last-child": { borderBottom: 0 }
};

const accordionSummarySx = {
  background: "#f8fafc",
  minHeight: 38,
  py: 0.5,
  px: 2.5,
  borderBottom: "1px solid #f1f5f9",
  "&.Mui-expanded": {
    minHeight: 38,
  },
  "& .MuiAccordionSummary-content": {
    margin: "0 !important",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  }
};

export default function Locations() {
  console.log("Locations component rendered - v2 with Geolocation Assistant & Map check active");
  const { userRole } = useSelector((s) => s.auth);
  const canWrite = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

  // ── Query Client ───────────────────────────────────────────────────────────
  const queryClient = useQueryClient();

  // ── States ──────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 600);
  const [page, setPage] = useState(0);
  const [showCount, setShowCount] = useState(10);
  const [typeFilter, setTypeFilter] = useState("");

  // ── Query Fetchers ──────────────────────────────────────────────────────────
  const { data: locations = [], isLoading: loading, isError, error, refetch: load } = useQuery({
    queryKey: ["locations", typeFilter, debouncedSearch],
    queryFn: async () => {
      const res = await getAllLocations(typeFilter, debouncedSearch);
      return extractList(res);
    },
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      try {
        const list = await getCompanies();
        return list || [];
      } catch {
        return [];
      }
    },
  });

  // Add/Edit Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const { control, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      locationName: "",
      companyId: "",
      latitude: "",
      longitude: "",
      locationType: "",
      address: "",
      contactPerson: "",
    }
  });

  const watchedLat = watch("latitude");
  const watchedLng = watch("longitude");

  const handleLocationNameBlur = async (e) => {
    const val = e.target.value;
    if (!val || val.trim().length < 3) return;

    // Check if coordinates are already filled
    const currentLat = watch("latitude");
    const currentLng = watch("longitude");
    if (currentLat || currentLng) return;

    try {
      const query = encodeURIComponent(val.trim());
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`);
      const data = await res.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setValue("latitude", Number(lat).toFixed(6), { shouldValidate: true, shouldDirty: true });
        setValue("longitude", Number(lon).toFixed(6), { shouldValidate: true, shouldDirty: true });
        toast.info(`Auto-resolved coordinates for "${val.trim()}"`);
      }
    } catch (err) {
      console.warn("Geocoding lookup failed:", err);
    }
  };

  // Delete State
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // ── Search & Filter Logic ──────────────────────────────────────────────────
  const clearFilters = () => {
    setSearch("");
    setTypeFilter("");
    setPage(0);
  };

  const filteredLocations = locations;

  const paginatedLocations = filteredLocations.slice(page * showCount, (page + 1) * showCount);

  // ── Add / Edit Actions ─────────────────────────────────────────────────────
  const openAdd = () => {
    setIsEdit(false);
    setEditId(null);
    reset({
      locationName: "",
      companyId: companies.length > 0 ? String(companies[0].companyId) : "",
      latitude: "",
      longitude: "",
      locationType: "OFFICE",
      address: "",
      contactPerson: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (loc) => {
    setIsEdit(true);
    setEditId(loc.locationId);

    // Normalize type value to match uppercase dropdown keys
    const rawType = loc.locationType || "OFFICE";
    const normalizedType = rawType.toUpperCase().replace(" ", "_");

    reset({
      locationName: loc.locationName || "",
      companyId: loc.companyId ? String(loc.companyId) : "",
      latitude: loc.latitude ?? "",
      longitude: loc.longitude ?? "",
      locationType: normalizedType,
      address: loc.address || "",
      contactPerson: loc.contactPerson || "",
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = {
        locationName: data.locationName.trim(),
        companyId: Number(data.companyId),
        latitude: data.latitude === "" ? null : Number(data.latitude),
        longitude: data.longitude === "" ? null : Number(data.longitude),
        locationType: data.locationType,
        address: data.address ? data.address.trim() : "",
        contactPerson: data.contactPerson ? data.contactPerson.trim() : ""
      };
      if (isEdit) {
        await updateLocation(editId, payload);
        toast.success("Location updated successfully");
      } else {
        await saveLocation(payload);
        toast.success("Location created successfully");
      }
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    } catch (e) {
      toast.error(e.response?.data?.message || "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  // ── ✨ Geolocation Auto-Detect shortcut ─────────────────────────────────────
  const handleAutoDetect = async () => {
    setDetecting(true);
    const id = toast.loading("Detecting your location from IP...");
    try {
      const res = await getCurrentLocation();
      const data = res?.data ?? res;
      if (data?.city) {
        setValue("locationName", data.city, { shouldValidate: true, shouldDirty: true });
        if (data.latitude != null) setValue("latitude", String(data.latitude), { shouldValidate: true, shouldDirty: true });
        if (data.longitude != null) setValue("longitude", String(data.longitude), { shouldValidate: true, shouldDirty: true });
        toast.success(`Detected location: ${data.city}`, { id });
      } else {
        toast.error("Could not auto-detect location", { id });
      }
    } catch {
      toast.error("Auto-detect failed. Please type location manually.", { id });
    } finally {
      setDetecting(false);
    }
  };

  // ── Delete Actions ──────────────────────────────────────────────────────────
  const triggerDelete = (id) => {
    setDeleteId(id);
    setDeleteConfirm(true);
  };

  const handleDelete = async () => {
    try {
      await deleteLocation(deleteId);
      toast.success("Location deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    } catch {
      toast.error("Failed to delete location");
    } finally {
      setDeleteConfirm(false);
      setDeleteId(null);
    }
  };

  // ── Statistics Aggregations ─────────────────────────────────────────────────
  const totalLocations = locations.length;
  const uniqueCompanies = new Set(locations.map((l) => l?.companyId).filter((id) => id != null)).size;

  const columns = [
    {
      field: "index",
      headerName: "#",
      fontFamily: "monospace",
      color: COLORS.textFaint,
      fontWeight: 700,
      fontSize: 10,
      renderCell: (row, idx) => idx + 1,
    },
    {
      field: "locationName",
      headerName: "Location Name",
      sortable: true,
      renderCell: (row) => (
        <Box>
          <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#1e1b4b" }}>{row.locationName}</Typography>
          {row.address && (
            <Typography sx={{ fontSize: 9.5, color: COLORS.textMuted, fontWeight: 500, mt: 0.25, display: "flex", alignItems: "center", gap: 0.5 }}>
              <FaHome size={10.5} style={{ color: "#64748b" }} /> {row.address}
            </Typography>
          )}
          {row.latitude != null && row.longitude != null && (
            <Typography sx={{ fontSize: 9, fontWeight: 400, mt: 0.25 }}>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${row.latitude},${row.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#3b82f6",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                  cursor: "pointer",
                }}
                onMouseOver={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseOut={(e) => (e.currentTarget.style.textDecoration = "none")}
              >
                <FaMapMarkerAlt size={9.5} style={locationIconSx} /> {Number(row.latitude).toFixed(6)}, {Number(row.longitude).toFixed(6)}
              </a>
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: "locationType",
      headerName: "Type",
      sortable: true,
      renderCell: (row) => {
        const colors = getTypeChipColors(row.locationType);
        return (
          <Chip
            label={row.locationType || "Office"}
            size="small"
            sx={{
              fontSize: 9,
              height: 16,
              fontWeight: 600,
              background: colors.bg,
              color: colors.color,
              border: `1px solid ${colors.border}`,
              borderRadius: "4px",
              textTransform: "uppercase",
              "& .MuiChip-label": { px: "5px" },
            }}
          />
        );
      },
    },
    {
      field: "locationCode",
      headerName: "Location Code",
      sortable: true,
      renderCell: (row) => (
        <Chip
          label={row.locationCode || "—"}
          size="small"
          sx={{
            fontSize: 9,
            height: 16,
            background: "#eff6ff",
            color: "#1d4ed8",
            border: "1px solid #dbeafe",
            borderRadius: "4px",
            "& .MuiChip-label": { px: "5px" },
          }}
        />
      ),
    },
    {
      field: "contactPerson",
      headerName: "Site Custodian",
      sortable: true,
      color: COLORS.textMuted,
      fontSize: 11,
      fontWeight: 500,
      renderCell: (row) => row.contactPerson || "—",
    },
    ...(canWrite
      ? [
          {
            field: "actions",
            headerName: "Actions",
            renderCell: (row) => (
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <Tooltip title="Edit Location" arrow>
                  <IconButton
                    size="small"
                    onClick={() => openEdit(row)}
                    sx={{
                      width: 22,
                      height: 22,
                      color: "#3b82f6",
                      borderRadius: "4px",
                      transition: "all 0.15s ease",
                      "&:hover": { background: "rgba(59, 130, 246, 0.08)" },
                    }}
                  >
                    <FaEdit size={11} />
                  </IconButton>
                </Tooltip>

                {canDelete && (
                  <Tooltip title="Delete Location" arrow>
                    <IconButton
                      size="small"
                      onClick={() => triggerDelete(row.locationId)}
                      sx={{
                        width: 22,
                        height: 22,
                        color: "#f43f5e",
                        borderRadius: "4px",
                        transition: "all 0.15s ease",
                        "&:hover": { background: "rgba(244, 63, 94, 0.08)" },
                      }}
                    >
                      <FaTrash size={11} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            ),
          },
        ]
      : []),
  ];

  if (loading) {
    return <SkeletonLoader variant="list" statCount={4} columnCount={6} />;
  }

  return (
    <Box sx={{ p: 0 }}>

      <PageHeader
        title="Office Locations"
        subtitle="Manage company offices, sites and remote hubs"
      />

      {/* ── Symmetrical Statistics Ribbon ── */}
      <Box sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, 1fr)",
          sm: "repeat(4, 1fr)"
        },
        gap: 2,
        mb: 2,
        animation: "fadeUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "@keyframes fadeUp": {
          from: { opacity: 0, transform: "translateY(10px)" },
          to: { opacity: 1, transform: "translateY(0)" }
        }
      }}>
        <StatCard label="Total Locations" value={totalLocations} icon={<FaMapMarkerAlt size={15} />} iconBg="#e8eaf6" iconColor="#3949ab" />
        <StatCard label="Active Sites" value={totalLocations} icon={<FaCheckCircle size={15} />} iconBg="#ecfdf5" iconColor="#10b981" />
        <StatCard label="Associated Companies" value={uniqueCompanies || 1} icon={<FaBuilding size={15} />} iconBg="#eff6ff" iconColor="#2563eb" />
        <StatCard label="IP Geolocation Status" value={<Box component="span" sx={{ fontFamily: "'Amoria', sans-serif !important" }}>Online</Box>} icon={<FaCrosshairs size={15} />} iconBg="#fffbeb" iconColor="#d97706" />
      </Box>

      {/* Actions and Filters Bar */}
      <Box sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1.5,
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        mb: 2,
        animation: "fadeLeft 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "@keyframes fadeLeft": {
          from: { opacity: 0, transform: "translateX(15px)" },
          to: { opacity: 1, transform: "translateX(0)" },
        }
      }}>
        {/* Left Side: Search & Filters */}
        <Box sx={{
          display: "flex",
          gap: 1.5,
          alignItems: "center",
          flexWrap: "wrap",
          flex: { xs: "1 1 100%", md: "auto" },
          order: { xs: 2, md: 1 }
        }}>
          <TextField
            size="small"
            placeholder="Search location name, code, company..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><FaSearch size={11} color="#aaa" /></InputAdornment>
              }
            }}
            sx={{
              ...searchFieldSx(280, 340),
              width: { xs: "100%", sm: "auto" },
              minWidth: { xs: "100%", sm: 280 }
            }}
          />

          <Select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
            size="small"
            displayEmpty
            sx={{
              ...selectSx,
              minWidth: 140,
              flex: { xs: 1, sm: "initial" }
            }}
          >
            <MenuItem value="" sx={{ fontSize: 11.5 }}>All</MenuItem>
            {["HQ", "Office", "Warehouse", "Lab", "Remote Hub"].map((t) => (
              <MenuItem key={t} value={t} sx={{ fontSize: 11.5 }}>{t}</MenuItem>
            ))}
          </Select>

          <Tooltip title="Clear filters">
            <IconButton
              onClick={clearFilters}
              sx={resetBtnSx}
            >
              <FaSyncAlt size={11} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Right Side: Actions */}
        <Box sx={{
          display: "flex",
          gap: 1.5,
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: { xs: "flex-end", md: "flex-end" },
          flex: { xs: "1 1 100%", md: "auto" },
          mt: { xs: 0.5, md: 0 },
          order: { xs: 1, md: 2 }
        }}>
          {/* Show count */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, fontSize: 11, color: COLORS.textMuted }}>
            Showing
            <Select
              value={showCount}
              onChange={(e) => { setShowCount(Number(e.target.value)); setPage(0); }}
              size="small"
              sx={selectSx}
            >
              {[5, 10, 20, 50].map((n) => (
                <MenuItem key={n} value={n} sx={{ fontSize: 11 }}>{n}</MenuItem>
              ))}
            </Select>
          </Box>

          {canWrite && (
            <Button
              variant="contained"
              startIcon={<FaPlus size={11} />}
              onClick={openAdd}
              sx={{ ...primaryBtnSx, background: COLORS.primary, "&:hover": { background: COLORS.primaryDark } }}
            >
              Add Location
            </Button>
          )}
        </Box>
      </Box>

      {/* ── Data Table ── */}
      <TableCard>
        {isError ? (
          <ErrorState message={error?.message || error?.response?.data?.message} onRetry={load} />
        ) : filteredLocations.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, color: COLORS.textFaint }}>
            <FaMapMarkerAlt size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
            <Typography fontSize={14}>No locations found.</Typography>
          </Box>
        ) : (
          (() => {
            const grouped = paginatedLocations.reduce((acc, loc) => {
              const compName = loc.companyName || "Default Organization";
              if (!acc[compName]) acc[compName] = [];
              acc[compName].push(loc);
              return acc;
            }, {});

            return (
              <Box>
                {Object.entries(grouped).map(([companyName, companyLocs]) => (
                  <Accordion key={companyName} defaultExpanded sx={accordionSx}>
                    <AccordionSummary expandIcon={<FaChevronDown size={10} color="#64748b" />} sx={accordionSummarySx}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <FaBuilding color={COLORS.primary} size={11} />
                        <Typography fontSize={11.5} fontWeight={700} color="#1e1b4b">
                          {companyName}
                        </Typography>
                        <Chip
                          label={`${companyLocs.length} Location${companyLocs.length > 1 ? "s" : ""}`}
                          size="small"
                          sx={{
                            fontSize: 8.5,
                            height: 16,
                            fontWeight: 700,
                            background: "rgba(25, 118, 210, 0.06)",
                            color: COLORS.primary,
                            border: "1px solid rgba(25, 118, 210, 0.12)",
                            borderRadius: "4px",
                            "& .MuiChip-label": { px: "4px" }
                          }}
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0 }}>
                      <Box sx={{ overflowX: "auto" }}>
                        <PremiumDataGrid
                          columns={columns}
                          rows={companyLocs}
                          loading={false}
                          rowIdField="locationId"
                          page={0}
                          pageSize={companyLocs.length}
                          emptyMessage="No locations under this organization."
                        />
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            );
          })()
        )}
        {!loading && filteredLocations.length > 0 && (
          <TablePagination
            page={page}
            totalPages={Math.ceil(filteredLocations.length / showCount) || 1}
            onPageChange={(pg) => setPage(pg)}
          />
        )}
      </TableCard>

      {/* ── Add / Edit Modal ── */}
      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: premiumDialogPaperSx } }}
      >
        <DialogTitle sx={premiumDialogTitleSx}>
          <span>{isEdit ? "Edit Location" : "Add Office Location"}</span>
          <IconButton size="small" onClick={() => setDialogOpen(false)} disabled={saving} sx={{ color: COLORS.textFaint }}><FaTimes size={13} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: "18px !important", pb: 2 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" }, gap: 3 }}>

            {/* Left Column: Form Fields */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
              <FormTextField
                name="locationName"
                control={control}
                rules={{
                  required: "Location name is required",
                  minLength: { value: 2, message: "Location name is required (min 2 characters)" }
                }}
                label="Location Name *"
                placeholder="e.g. Chennai Office, Floor 3 Lab"
                disabled={saving}
                onBlur={handleLocationNameBlur}
              />

              <FormSelect
                name="companyId"
                control={control}
                rules={{ required: "Corporate association is required" }}
                label="Corporate Association (Company) *"
                disabled={saving}
              >
                {companies.map((c) => (
                  <MenuItem key={c.companyId} value={String(c.companyId)} sx={{ fontSize: 11.5 }}>
                    {c.companyName}
                  </MenuItem>
                ))}
              </FormSelect>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                <FormSelect
                  name="locationType"
                  control={control}
                  rules={{ required: "Location Type is required" }}
                  label="Location Type *"
                  disabled={saving}
                >
                  {[
                    { value: "HQ", label: "HQ" },
                    { value: "OFFICE", label: "Office" },
                    { value: "WAREHOUSE", label: "Warehouse" },
                    { value: "LAB", label: "Lab" },
                    { value: "REMOTE_HUB", label: "Remote Hub" }
                  ].map((t) => (
                    <MenuItem key={t.value} value={t.value} sx={{ fontSize: 11.5 }}>
                      {t.label}
                    </MenuItem>
                  ))}
                </FormSelect>
                <FormTextField
                  name="contactPerson"
                  control={control}
                  label="Site Custodian (Contact Person)"
                  placeholder="e.g. John Doe"
                  disabled={saving}
                />
              </Box>

              <FormTextField
                name="address"
                control={control}
                label="Full Physical Address"
                placeholder="e.g. Block D, 3rd Floor, Tech Park"
                disabled={saving}
                multiline
                rows={3}
              />
            </Box>

            {/* Right Column: Geolocation & Live Map */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
              {/* ✨ Premium Auto-Detect Geolocation Shortcut Widget */}
              <Box sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                p: 1.25,
                borderRadius: "6px",
                border: "1px dashed " + COLORS.primaryBorder,
                background: "linear-gradient(135deg, rgba(25, 118, 210, 0.02), rgba(25, 118, 210, 0.06))",
                position: "relative",
                overflow: "hidden",
                flexShrink: 0
              }}>
                <Box>
                  <Typography fontSize={10.5} fontWeight={800} color={COLORS.primary} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <FaCrosshairs size={10} /> Geolocation Assistant
                  </Typography>
                  <Typography fontSize={9.5} color={COLORS.textMuted} mt={0.25}>
                    Are you registering a remote employee or local office city? Auto-detect their city instantly via IP lookup.
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={detecting}
                  onClick={handleAutoDetect}
                  startIcon={detecting ? <CircularProgress size={10} color="inherit" /> : <FaCrosshairs size={10} />}
                  sx={{
                    ...outlinedBtnSx,
                    alignSelf: "flex-start",
                    borderColor: COLORS.primary, color: COLORS.primary,
                    "&:hover": { background: "rgba(25, 118, 210, 0.06)", borderColor: COLORS.primaryDark }
                  }}
                >
                  {detecting ? "Detecting..." : "Auto-Detect My Current City"}
                </Button>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                <FormTextField
                  name="latitude"
                  control={control}
                  label="Latitude"
                  placeholder="e.g. 13.0827"
                  type="number"
                  disabled={saving}
                  rules={{
                    validate: (val) => {
                      if (val === "" || val == null) return true;
                      const num = Number(val);
                      return (num >= -90 && num <= 90) || "Must be between -90 and 90";
                    }
                  }}
                />
                <FormTextField
                  name="longitude"
                  control={control}
                  label="Longitude"
                  placeholder="e.g. 80.2707"
                  type="number"
                  disabled={saving}
                  rules={{
                    validate: (val) => {
                      if (val === "" || val == null) return true;
                      const num = Number(val);
                      return (num >= -180 && num <= 180) || "Must be between -180 and 180";
                    }
                  }}
                />
              </Box>

              {/* Map view or placeholder */}
              {watchedLat !== "" && watchedLng !== "" && watchedLat != null && watchedLng != null && !isNaN(Number(watchedLat)) && !isNaN(Number(watchedLng)) ? (
                <Box sx={{
                  width: "100%",
                  height: 180,
                  border: "1px solid " + COLORS.borderLight,
                  borderRadius: "6px",
                  overflow: "hidden",
                  background: "#f1f5f9",
                  flexShrink: 0
                }}>
                  <iframe
                    title="Location Form Map"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    marginHeight="0"
                    marginWidth="0"
                    src={`https://maps.google.com/maps?q=${watchedLat},${watchedLng}&z=15&output=embed`}
                    style={{ border: 0 }}
                  />
                </Box>
              ) : (
                <Box sx={{
                  width: "100%",
                  height: 180,
                  border: "1px dashed " + COLORS.border,
                  borderRadius: "6px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#fafafa",
                  color: COLORS.textFaint,
                  gap: 1,
                  flexShrink: 0
                }}>
                  <FaMapMarkerAlt size={16} color={COLORS.textFaint} />
                  <Typography fontSize={10} fontWeight={600}>Enter Coordinates to View Map</Typography>
                </Box>
              )}
            </Box>

          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, borderTop: "1px solid " + COLORS.borderLight, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving} sx={outlinedBtnSx}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit(onSubmit)}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={11} color="inherit" /> : <FaCheckCircle size={10} />}
            sx={{ ...primaryBtnSx, background: COLORS.primary, "&:hover": { background: COLORS.primaryDark } }}
          >
            {saving ? "Saving..." : "Save Location"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Soft Delete Confirmation ── */}
      <ConfirmDialog
        open={deleteConfirm}
        title="Confirm Location Deletion"
        message="Are you sure you want to delete this location? Deleted locations will no longer be visible or selectable in any new asset creation or transfer dialogs."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(false)}
        confirmLabel="Yes, Delete"
      />
    </Box>
  );
}
