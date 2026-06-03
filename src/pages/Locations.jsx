import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, InputAdornment,
  Table, TableBody, TableCell, TableHead, TableRow, TextField,
  Tooltip, Typography, Select, MenuItem,
} from "@mui/material";
import {
  FaMapMarkerAlt, FaPlus, FaTimes, FaEdit, FaTrash,
  FaSearch, FaCheckCircle, FaBuilding, FaCrosshairs,
} from "react-icons/fa";
import { MdRefresh } from "react-icons/md";
import toast from "../utils/toast.jsx";

import {
  getAllLocations, saveLocation, updateLocation, deleteLocation, getCurrentLocation,
} from "../services/location_service";
import { getCompanies } from "../services/Company service";
import PageHeader from "../components/common/PageHeader";
import TableCard from "../components/common/TableCard";
import TablePagination from "../components/common/TablePagination";
import ConfirmDialog from "../components/common/ConfirmDialog";
import StatCard from "../components/common/StatCard";
import { COLORS, primaryBtnSx, outlinedBtnSx, inputSx, selectSx, chipSx } from "../theme/tokens";
import { required } from "../utils/validate";

// ── Helpers ───────────────────────────────────────────────────────────────────
function extractList(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

export default function Locations() {
  const { userRole } = useSelector((s) => s.auth);
  const canWrite = userRole === "admin";

  // ── States ──────────────────────────────────────────────────────────────────
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(0);
  const [showCount, setShowCount] = useState(10);
  const debounceRef = useRef(null);

  // Add/Edit Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formName, setFormName] = useState("");
  const [formCompanyId, setFormCompanyId] = useState("");
  const [companies, setCompanies] = useState([]);
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Delete State
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // ── API Fetchers ────────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const res = await getAllLocations();
      setLocations(extractList(res));
    } catch {
      toast.error("Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const list = await getCompanies();
      setCompanies(list);
      if (list.length > 0) {
        setFormCompanyId(list[0].companyId || "");
      }
    } catch { }
  };

  useEffect(() => {
    load();
    loadCompanies();
  }, []);

  // ── Search & Filter Logic ──────────────────────────────────────────────────
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setPage(0);
    }, 400);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setPage(0);
  };

  const filteredLocations = locations.filter((loc) =>
    loc && (
      !search ||
      loc.locationName?.toLowerCase().includes(search.toLowerCase()) ||
      loc.locationCode?.toLowerCase().includes(search.toLowerCase()) ||
      loc.companyName?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const paginatedLocations = filteredLocations.slice(page * showCount, (page + 1) * showCount);

  // ── Add / Edit Actions ─────────────────────────────────────────────────────
  const openAdd = () => {
    setIsEdit(false);
    setEditId(null);
    setFormName("");
    if (companies.length > 0) {
      setFormCompanyId(companies[0].companyId);
    } else {
      setFormCompanyId("");
    }
    setDialogOpen(true);
  };

  const openEdit = (loc) => {
    setIsEdit(true);
    setEditId(loc.locationId);
    setFormName(loc.locationName || "");
    setFormCompanyId(loc.companyId || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const e = {};
    if (!required(formName) || formName.trim().length < 2)
      e.formName = "Location name is required (min 2 characters)";
    if (!formCompanyId)
      e.formCompanyId = "Corporate association is required";
    if (Object.keys(e).length > 0) { setFormErrors(e); return; }
    setFormErrors({});
    setSaving(true);
    try {
      const payload = { locationName: formName.trim(), companyId: Number(formCompanyId) };
      if (isEdit) {
        await updateLocation(editId, payload);
        toast.success("Location updated successfully");
      } else {
        await saveLocation(payload);
        toast.success("Location created successfully");
      }
      setDialogOpen(false);
      load();
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
        setFormName(data.city);
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
      load();
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

  return (
    <Box sx={{ p: 0 }}>

      <PageHeader
        title="Office Locations"
        subtitle="Manage company offices, sites and remote hubs"
        actions={
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
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
        }
      />

      {/* ── Symmetrical Statistics Ribbon ── */}
      <Box sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, 1fr)",
          sm: "repeat(4, 1fr)"
        },
        gap: 2,
        mb: 2.5,
        animation: "fadeUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "@keyframes fadeUp": {
          from: { opacity: 0, transform: "translateY(10px)" },
          to: { opacity: 1, transform: "translateY(0)" }
        }
      }}>
        <StatCard label="Total Locations" value={totalLocations} icon={<FaMapMarkerAlt size={15} />} iconBg="#e8eaf6" iconColor="#3949ab" />
        <StatCard label="Active Sites" value={totalLocations} icon={<FaCheckCircle size={15} />} iconBg="#ecfdf5" iconColor="#10b981" />
        <StatCard label="Associated Companies" value={uniqueCompanies || 1} icon={<FaBuilding size={15} />} iconBg="#eff6ff" iconColor="#2563eb" />
        <StatCard label="IP Geolocation Status" value="Online" icon={<FaCrosshairs size={15} />} iconBg="#fffbeb" iconColor="#d97706" />
      </Box>

      {/* ── Filters Bar ── */}
      <Box sx={{ display: "flex", gap: 1.5, mb: 2, alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Search location name, code, company..."
          value={searchInput}
          onChange={handleSearchChange}
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start"><FaSearch size={11} color="#aaa" /></InputAdornment>
            }
          }}
          sx={{ minWidth: 280, ...inputSx }}
        />

        <Tooltip title="Clear filters">
          <IconButton
            onClick={clearFilters}
            sx={{
              border: "1px solid #e0e0e0",
              borderRadius: "6px",
              width: 30, height: 30,
              display: "flex", alignItems: "center", justifyContent: "center",
              p: 0, background: "#fff", color: "#757575",
              "&:hover": { background: "#f5f5f5", borderColor: "#bbb", color: COLORS.primary }
            }}
          >
            <MdRefresh size={14} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── Data Table ── */}
      <TableCard>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
        ) : filteredLocations.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, color: COLORS.textFaint }}>
            <FaMapMarkerAlt size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
            <Typography fontSize={14}>No locations found.</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 600, borderCollapse: "collapse" }}>
              <TableHead>
                <TableRow>
                  {["#", "Location Name", "Location Code", "Corporate Association", ...(canWrite ? ["Actions"] : [])].map((h) => (
                    <TableCell key={h} sx={{
                      fontWeight: 700,
                      color: "#64748b",
                      whiteSpace: "nowrap",
                      background: "#f8fafc",
                      borderBottom: "2px solid #e2e8f0",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      fontSize: 11
                    }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedLocations.map((row, i) => (
                  <TableRow
                    key={row.locationId}
                    sx={{
                      borderLeft: "3px solid transparent",
                      transition: "all 180ms ease",
                      "&:last-child td": { border: 0 },
                      "& td": { background: i % 2 === 0 ? "#fff" : "#f8faff", borderBottom: "1px solid #f1f5f9" },
                      "&:hover": {
                        borderLeft: "3px solid #3b82f6",
                        "& td": { background: "#f0f7ff" }
                      }
                    }}
                  >
                    <TableCell sx={{ color: COLORS.textFaint, fontSize: 11, width: 50 }}>{page * showCount + i + 1}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 600, color: "#1e1b4b" }}>{row.locationName}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.locationCode || "—"}
                        size="small"
                        sx={chipSx({ bg: "#eff6ff", color: "#1d4ed8" })}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: 11, color: COLORS.textMuted }}>{row.companyName || "Default Organization"}</TableCell>
                    {canWrite && (
                      <TableCell sx={{ width: 100 }}>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Tooltip title="Edit Location" arrow>
                            <IconButton
                              size="small"
                              onClick={() => openEdit(row)}
                              sx={{
                                width: 22, height: 22, color: "#3b82f6",
                                borderRadius: "4px", transition: "all 0.15s ease",
                                "&:hover": { background: "rgba(59, 130, 246, 0.08)" }
                              }}
                            >
                              <FaEdit size={11} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete Location" arrow>
                            <IconButton
                              size="small"
                              onClick={() => triggerDelete(row.locationId)}
                              sx={{
                                width: 22, height: 22, color: "#f43f5e",
                                borderRadius: "4px", transition: "all 0.15s ease",
                                "&:hover": { background: "rgba(244, 63, 94, 0.08)" }
                              }}
                            >
                              <FaTrash size={11} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
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
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: "10px" } } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
          <Typography fontWeight={700} fontSize={14}>
            {isEdit ? "✏️ Edit Location" : "📍 Add Office Location"}
          </Typography>
          <IconButton size="small" onClick={() => setDialogOpen(false)} disabled={saving}><FaTimes size={12} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "10px !important" }}>

          {/* ✨ Premium Auto-Detect Geolocation Shortcut Widget */}
          {!isEdit && (
            <Box sx={{
              display: "flex", flexDirection: "column", gap: 1,
              p: 1.25, borderRadius: "6px", border: "1px dashed " + COLORS.primaryBorder,
              background: "linear-gradient(135deg, rgba(25, 118, 210, 0.02), rgba(25, 118, 210, 0.06))",
              position: "relative", overflow: "hidden"
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
          )}

          <TextField
            label="Location Name *"
            size="small"
            fullWidth
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="e.g. Chennai Office, Floor 3 Lab"
            disabled={saving}
            sx={inputSx}
            error={!!formErrors.formName}
            helperText={formErrors.formName || ""}
          />

          <Box>
            <Typography sx={{ fontSize: 11, color: COLORS.textMuted, mb: 0.5, fontWeight: 600 }}>
              Corporate Association (Company) *
            </Typography>
            <Select
              value={formCompanyId}
              onChange={(e) => setFormCompanyId(e.target.value)}
              size="small"
              fullWidth
              disabled={saving}
              sx={{ ...selectSx, ...(formErrors.formCompanyId ? { "& .MuiOutlinedInput-notchedOutline": { borderColor: "#c62828" } } : {}) }}
            >
              {companies.map((c) => (
                <MenuItem key={c.companyId} value={c.companyId} sx={{ fontSize: 11.5 }}>
                  {c.companyName}
                </MenuItem>
              ))}
            </Select>
            {formErrors.formCompanyId && <Typography sx={{ fontSize: 10.5, color: "#c62828", mt: 0.5 }}>{formErrors.formCompanyId}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving} sx={outlinedBtnSx}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
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
