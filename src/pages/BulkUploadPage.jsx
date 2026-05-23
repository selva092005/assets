import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, CircularProgress, Typography, Select, MenuItem,
  Table, TableBody, TableCell, TableHead, TableRow, IconButton, Tooltip
} from "@mui/material";
import {
  FaCheckCircle, FaDownload, FaExclamationCircle,
  FaExclamationTriangle, FaFileExcel, FaUpload, FaEye, FaHistory,
  FaTrash, FaSyncAlt, FaBoxes
} from "react-icons/fa";
import toast from "react-hot-toast";
import { bulkUploadExcel, downloadTemplate } from "../services/assets_service";
import { COLORS } from "../theme/tokens";

/* ── Step item component ── */
function StepItem({ num, title, subtitle, active, done, isLast }) {
  const circleBg = done ? "#16a34a" : active ? "#2563eb" : "#f1f5f9";
  const circleColor = done || active ? "#fff" : "#64748b";
  const titleColor = active || done ? "#0f172a" : "#64748b";
  const subtitleColor = active ? "#3b82f6" : "#94a3b8";

  return (
    <Box sx={{ display: "flex", position: "relative", gap: 1.5, pb: isLast ? 0 : 2.5 }}>
      {/* Line connector */}
      {!isLast && (
        <Box
          sx={{
            position: "absolute",
            left: 11,
            top: 24,
            bottom: 0,
            width: 2,
            background: done ? "#16a34a" : "#e2e8f0",
            zIndex: 1,
          }}
        />
      )}

      {/* Circle indicator */}
      <Box
        sx={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: circleBg,
          color: circleColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10.5,
          fontWeight: 700,
          zIndex: 2,
          border: active ? "2px solid #bfdbfe" : "none",
          transition: "all 0.25s ease",
        }}
      >
        {done ? <FaCheckCircle size={12} color="#fff" /> : num}
      </Box>

      {/* Text details */}
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Typography fontSize={11.5} fontWeight={700} color={titleColor} lineHeight={1.2}>
          {title}
        </Typography>
        <Typography fontSize={9.5} color={subtitleColor} mt={0.25} lineHeight={1.3}>
          {subtitle}
        </Typography>
      </Box>
    </Box>
  );
}

/* ── Stat Card widget ── */
function StatCard({ value, label, bg, border, color, icon }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        p: 1.25,
        borderRadius: "8px",
        background: "#fff",
        border: "1px solid #e2e8f0",
        flex: 1,
        minWidth: 150,
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: "6px",
          background: bg,
          border: `1px solid ${border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography fontSize={9.5} fontWeight={500} color="#64748b" noWrap lineHeight={1.2}>
          {label}
        </Typography>
        <Typography fontSize={18} fontWeight={800} color="#0f172a" mt={0.25} lineHeight={1}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

/* ── Suggestion mapper ── */
function getSuggestion(field, message) {
  const f = (field || "").toLowerCase();
  const m = (message || "").toLowerCase();
  if (f.includes("serial") || m.includes("serial")) return "Enter valid serial number";
  if (f.includes("code") || m.includes("code") || f.includes("id") || m.includes("id")) return "Asset ID already exists in the system";
  if (f.includes("date") || m.includes("date")) return "Use format: DD-MM-YYYY";
  if (f.includes("cost") || m.includes("cost") || f.includes("value") || m.includes("value")) return "Enter positive numeric value";
  if (f.includes("status") || m.includes("status")) return "Allowed: AVAILABLE, DAMAGED or UNDER_MAINTENANCE";
  return "Verify input matches template rules";
}

const ERR_PAGE_SIZE = 3;

export default function BulkUploadPage() {
  const navigate     = useNavigate();
  const fileInputRef = useRef(null);

  const [file,       setFile]       = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState(null);
  const [dragOver,   setDragOver]   = useState(false);
  const [filterType, setFilterType] = useState("errors");
  const [errPage,    setErrPage]    = useState(0);

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.match(/\.(xlsx|xls)$/i)) {
      toast.error("Please select an Excel file (.xlsx or .xls)");
      return;
    }
    setFile(f);
    setResult(null);
    setErrPage(0);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      setLoading(true);
      const res = await bulkUploadExcel(file);
      const data = res?.data ?? res;
      setResult(data);
      setErrPage(0);
      const count = data?.successCount ?? 0;
      if (count > 0) {
        toast.success(`${count} asset(s) verified successfully`);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Bulk upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadTemplate();
    } catch {
      toast.error("Failed to download template");
    }
  };

  const removeFile = () => {
    setFile(null);
    setResult(null);
    setErrPage(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const step = result ? (result.failedCount > 0 ? 3 : 4) : file ? 2 : 1;

  const getTotalErrRows = () => {
    if (filterType === "errors") return result?.errors || [];
    return result?.skipped || [];
  };

  const getCurrentErrRows = () => {
    const rows = getTotalErrRows();
    return rows.slice(errPage * ERR_PAGE_SIZE, (errPage + 1) * ERR_PAGE_SIZE);
  };

  const totalErrPages = Math.ceil(getTotalErrRows().length / ERR_PAGE_SIZE);

  return (
    <Box sx={{ p: 0, fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      {/* ── Breadcrumbs ── */}
      <Box sx={{ px: 2, pt: 1.5 }}>
        <Typography fontSize={10.5} color="#64748b" sx={{ display: "flex", gap: 0.5, alignItems: "center", mb: 0.5 }}>
          <span>Dashboard</span>
          <span>&gt;</span>
          <span>Assets</span>
          <span>&gt;</span>
          <span style={{ fontWeight: 600, color: "#1e293b" }}>Bulk Upload</span>
        </Typography>
      </Box>

      {/* ── Top Header ── */}
      <Box sx={{ background: "#fff", borderBottom: `1px solid #e2e8f0`, px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: "8px", background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #c8e6c9" }}>
            <FaFileExcel color="#2e7d32" size={18} />
          </Box>
          <Box>
            <Typography fontWeight={800} fontSize={16} color="#0f172a">Bulk Upload Assets</Typography>
            <Typography fontSize={11} color="#64748b">Import hundreds of assets quickly using Excel templates.</Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FaDownload size={11} />}
            onClick={handleDownloadTemplate}
            sx={{
              textTransform: "none",
              fontSize: 11.5,
              fontWeight: 600,
              borderColor: "#bfdbfe",
              color: "#1d4ed8",
              borderRadius: "6px",
              py: 0.5,
              px: 1.5,
              background: "#eff6ff",
              "&:hover": { borderColor: "#93c5fd", background: "#dbeafe" }
            }}
          >
            Download Template
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FaEye size={11} />}
            sx={{
              textTransform: "none",
              fontSize: 11.5,
              fontWeight: 600,
              borderColor: "#cbd5e1",
              color: "#475569",
              borderRadius: "6px",
              py: 0.5,
              px: 1.5,
              background: "#fff",
              "&:hover": { borderColor: "#94a3b8", background: "#f8fafc" }
            }}
          >
            View Sample
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FaHistory size={11} />}
            sx={{
              textTransform: "none",
              fontSize: 11.5,
              fontWeight: 600,
              borderColor: "#cbd5e1",
              color: "#475569",
              borderRadius: "6px",
              py: 0.5,
              px: 1.5,
              background: "#fff",
              "&:hover": { borderColor: "#94a3b8", background: "#f8fafc" }
            }}
          >
            Upload History
          </Button>
        </Box>
      </Box>

      {/* ── Main Body ── */}
      <Box sx={{ p: 2, display: "flex", gap: 2, alignItems: "flex-start", flexWrap: { xs: "wrap", md: "nowrap" } }}>
        
        {/* ── Left Sidebar ── */}
        <Box sx={{ width: { xs: 1, md: 240 }, flexShrink: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Progress Card */}
          <Box sx={{ background: COLORS.surface, borderRadius: "8px", border: `1px solid ${COLORS.border}`, p: 2 }}>
            <Typography fontSize={11} fontWeight={700} color="#334155" mb={2} textTransform="uppercase" letterSpacing={0.5}>
              Upload Progress
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <StepItem num={1} title="Download Template" subtitle="Download and fill the AMS Excel template" active={step === 1} done={step > 1} />
              <StepItem num={2} title="Upload Excel File" subtitle="Upload the completed template file" active={step === 2} done={step > 2} />
              <StepItem num={3} title="Validate Data" subtitle="System validates your data for errors" active={step === 3} done={step > 3} />
              <StepItem num={4} title="Import Assets" subtitle="Import valid assets into the system" active={step === 4} done={false} isLast />
            </Box>
          </Box>

          {/* Rules Card */}
          <Box sx={{ background: COLORS.surface, borderRadius: "8px", border: `1px solid ${COLORS.border}`, p: 1.5 }}>
            <Typography fontSize={11} fontWeight={700} color="#334155" mb={1.25} textTransform="uppercase" letterSpacing={0.5}>
              Upload Rules
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {[
                "Use AMS template only",
                "File format: .xlsx / .xls",
                "Maximum file size: 10MB",
                "First row should contain column headers",
                "Required fields must be filled",
              ].map((rule, idx) => (
                <Box key={idx} sx={{ display: "flex", alignItems: "flex-start", gap: 0.75 }}>
                  <FaCheckCircle color="#16a34a" size={10} style={{ marginTop: 2, flexShrink: 0 }} />
                  <Typography fontSize={10} color="#475569" lineHeight={1.3}>
                    {rule}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Need Help Card */}
          <Box sx={{ background: COLORS.surface, borderRadius: "8px", border: `1px solid ${COLORS.border}`, p: 1.5 }}>
            <Typography fontSize={11} fontWeight={700} color="#334155" mb={0.5}>
              Need Help?
            </Typography>
            <Typography fontSize={10} color="#64748b" mb={1.25} lineHeight={1.4}>
              View our guide to learn about bulk upload.
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FaEye size={9} />}
              sx={{
                textTransform: "none",
                fontSize: 10.5,
                fontWeight: 600,
                borderColor: COLORS.primary,
                color: COLORS.primary,
                borderRadius: "6px",
                py: 0.5,
                px: 1.5,
                "&:hover": { borderColor: COLORS.primaryDark, background: "rgba(37, 99, 235, 0.04)" }
              }}
            >
              View Guide
            </Button>
          </Box>
        </Box>

        {/* ── Right Content Area ── */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          {/* Stat Cards */}
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", width: 1 }}>
            <StatCard
              value={result ? (result.totalRows ?? 0) : "—"}
              label="Total Assets"
              bg="#eff6ff"
              border="#bfdbfe"
              color="#2563eb"
              icon={<FaBoxes size={14} color="#2563eb" />}
            />
            <StatCard
              value={result ? (result.successCount ?? 0) : "—"}
              label="Successful"
              bg="#f0fdf4"
              border="#bbf7d0"
              color="#16a34a"
              icon={<FaCheckCircle size={14} color="#16a34a" />}
            />
            <StatCard
              value={result ? (result.failedCount ?? 0) : "—"}
              label="Failed"
              bg="#fef2f2"
              border="#fecaca"
              color="#dc2626"
              icon={<FaExclamationCircle size={14} color="#dc2626" />}
            />
            <StatCard
              value={result ? (result.skippedCount ?? 0) : "—"}
              label="Duplicates"
              bg="#fffbeb"
              border="#fde68a"
              color="#d97706"
              icon={<FaExclamationTriangle size={13} color="#d97706" />}
            />
          </Box>

          {/* Drag & Drop Zone */}
          <Box
            onClick={() => !loading && fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            sx={{
              background: dragOver ? "#eff6ff" : "#f8fafc",
              border: `2px dashed ${dragOver ? "#2563eb" : "#bfdbfe"}`,
              borderRadius: "8px",
              p: "2rem 1rem",
              textAlign: "center",
              cursor: loading ? "default" : "pointer",
              transition: "all 0.18s ease",
              "&:hover": loading ? {} : { borderColor: "#2563eb", background: "#f1f7fe" },
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 1.25,
              }}
            >
              <FaUpload size={16} color="#2563eb" />
            </Box>
            <Typography fontSize={13.5} fontWeight={700} color="#1e293b">
              Drag & Drop Excel File Here
            </Typography>
            <Typography fontSize={11} color="#64748b" mt={0.25}>
              or click to browse
            </Typography>
            <Typography fontSize={9.5} color="#94a3b8" mt={0.75}>
              Supported formats: .xlsx, .xls | Maximum file size: 10MB
            </Typography>
            <Button
              variant="contained"
              disabled={loading}
              sx={{
                mt: 1.75,
                textTransform: "none",
                fontSize: 11,
                fontWeight: 600,
                borderRadius: "6px",
                py: 0.5,
                px: 2,
                background: "#2563eb",
                boxShadow: "none",
                "&:hover": { background: "#1d4ed8", boxShadow: "none" }
              }}
            >
              Browse Files
            </Button>
          </Box>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files?.[0])} />

          {/* Uploaded File Info Bar */}
          {file && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 1.5,
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                flexWrap: "wrap",
                gap: 1.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "6px",
                    background: "#e8f5e9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <FaFileExcel size={15} color="#2e7d32" />
                </Box>
                <Box>
                  <Typography fontSize={12} fontWeight={700} color="#1e293b">
                    {file.name}
                  </Typography>
                  <Typography fontSize={10} color="#94a3b8">
                    Uploaded on {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", gap: 2.5, flexWrap: "wrap" }}>
                <Box>
                  <Typography fontSize={9.5} color="#94a3b8" fontWeight={500}>Rows</Typography>
                  <Typography fontSize={11.5} fontWeight={700} color="#475569">{result ? (result.totalRows ?? 0) : "—"}</Typography>
                </Box>
                <Box>
                  <Typography fontSize={9.5} color="#94a3b8" fontWeight={500}>Valid</Typography>
                  <Typography fontSize={11.5} fontWeight={700} color="#16a34a">{result ? (result.successCount ?? 0) : "—"}</Typography>
                </Box>
                <Box>
                  <Typography fontSize={9.5} color="#94a3b8" fontWeight={500}>Errors</Typography>
                  <Typography fontSize={11.5} fontWeight={700} color="#dc2626">{result ? (result.failedCount ?? 0) : "—"}</Typography>
                </Box>
                <Box>
                  <Typography fontSize={9.5} color="#94a3b8" fontWeight={500}>Duplicates</Typography>
                  <Typography fontSize={11.5} fontWeight={700} color="#d97706">{result ? (result.skippedCount ?? 0) : "—"}</Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", gap: 1 }}>
                {result ? (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FaSyncAlt size={10} />}
                    onClick={handleUpload}
                    disabled={loading}
                    sx={{
                      textTransform: "none",
                      fontSize: 11,
                      fontWeight: 600,
                      borderColor: "#cbd5e1",
                      color: "#475569",
                      borderRadius: "6px",
                      py: 0.5,
                      px: 1.5,
                      "&:hover": { background: "#f8fafc", borderColor: "#94a3b8" }
                    }}
                  >
                    Validate Again
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={loading ? <CircularProgress size={10} color="inherit" /> : <FaUpload size={10} />}
                    onClick={handleUpload}
                    disabled={loading}
                    sx={{
                      textTransform: "none",
                      fontSize: 11,
                      fontWeight: 600,
                      borderRadius: "6px",
                      py: 0.5,
                      px: 1.5,
                      background: "#2563eb",
                      boxShadow: "none",
                      "&:hover": { background: "#1d4ed8", boxShadow: "none" }
                    }}
                  >
                    {loading ? "Validating..." : "Validate Data"}
                  </Button>
                )}

                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<FaTrash size={10} />}
                  onClick={removeFile}
                  disabled={loading}
                  sx={{
                    textTransform: "none",
                    fontSize: 11,
                    fontWeight: 600,
                    borderColor: "#fee2e2",
                    color: "#dc2626",
                    borderRadius: "6px",
                    py: 0.5,
                    px: 1.5,
                    "&:hover": { background: "#fef2f2", borderColor: "#fecaca" }
                  }}
                >
                  Remove
                </Button>
              </Box>
            </Box>
          )}

          {/* Validation Results Table */}
          {result && (result.errors?.length > 0 || result.skipped?.length > 0) && (
            <Box sx={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
              <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5 }}>
                <Typography fontSize={13} fontWeight={700} color="#dc2626">
                  Validation Results ({filterType === "errors" ? result.errors?.length ?? 0 : result.skipped?.length ?? 0} {filterType === "errors" ? "Errors" : "Duplicates"})
                </Typography>

                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <Select
                    size="small"
                    value={filterType}
                    onChange={(e) => { setFilterType(e.target.value); setErrPage(0); }}
                    sx={{
                      height: 30,
                      fontSize: 11.5,
                      borderRadius: "6px",
                      minWidth: 120,
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" }
                    }}
                  >
                    <MenuItem value="errors">All Errors</MenuItem>
                    <MenuItem value="duplicates">Duplicates</MenuItem>
                  </Select>

                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FaDownload size={11} />}
                    sx={{
                      textTransform: "none",
                      fontSize: 11.5,
                      fontWeight: 600,
                      borderColor: "#cbd5e1",
                      color: "#475569",
                      borderRadius: "6px",
                      height: 30,
                      "&:hover": { borderColor: "#94a3b8", background: "#f8fafc" }
                    }}
                  >
                    Download Error Report
                  </Button>
                </Box>
              </Box>

              <Box sx={{ overflowX: "auto" }}>
                <Table size="small" sx={{ minWidth: 600 }}>
                  <TableHead>
                    <TableRow sx={{ background: "#f8fafc" }}>
                      {["Row No.", "Asset Name", "Asset ID", "Issue", "Suggestion"].map((h) => (
                        <TableCell key={h} sx={{ fontWeight: 700, color: "#64748b", fontSize: 10.5, borderBottom: "1px solid #e2e8f0", py: 1 }}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getCurrentErrRows().map((item, idx) => (
                      <TableRow key={idx} sx={{ "&:hover": { background: "#f8fafc" } }}>
                        <TableCell sx={{ py: 1 }}>
                          <Box
                            sx={{
                              display: "inline-block",
                              background: filterType === "errors" ? "#fef2f2" : "#fffbeb",
                              border: `1px solid ${filterType === "errors" ? "#fca5a5" : "#fcd34d"}`,
                              color: filterType === "errors" ? "#dc2626" : "#d97706",
                              fontWeight: 700,
                              fontSize: 10,
                              px: 0.75,
                              py: 0.25,
                              borderRadius: "4px",
                              textAlign: "center",
                              minWidth: 24,
                            }}
                          >
                            {item.row ?? "—"}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 1, fontSize: 11, fontWeight: 500, color: "#334155" }}>
                          {item.assetName || "—"}
                        </TableCell>
                        <TableCell sx={{ py: 1, fontSize: 11, color: "#64748b" }}>
                          {item.assetCode || item.field || "—"}
                        </TableCell>
                        <TableCell sx={{ py: 1 }}>
                          <Box
                            sx={{
                              display: "inline-block",
                              background: filterType === "errors" ? "#fff5f5" : "#fffbeb",
                              color: filterType === "errors" ? "#ef4444" : "#b45309",
                              border: `1px solid ${filterType === "errors" ? "#fee2e2" : "#fef3c7"}`,
                              borderRadius: "12px",
                              px: 1,
                              py: 0.25,
                              fontSize: 9.5,
                              fontWeight: 500,
                            }}
                          >
                            {item.message || "—"}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 1, fontSize: 11, color: "#475569" }}>
                          {getSuggestion(item.field || "", item.message || "")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>

              {getTotalErrRows().length > ERR_PAGE_SIZE && (
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2, py: 1, borderTop: "1px solid #e2e8f0", background: "#fff" }}>
                  <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                    <IconButton
                      size="small"
                      disabled={errPage === 0}
                      onClick={() => setErrPage((p) => p - 1)}
                      sx={{ border: "1px solid #e2e8f0", borderRadius: "4px", p: 0.5 }}
                    >
                      <Typography fontSize={10} fontWeight={700}>&lt;</Typography>
                    </IconButton>
                    
                    {Array.from({ length: totalErrPages }).map((_, i) => (
                      <Button
                        key={i}
                        size="small"
                        onClick={() => setErrPage(i)}
                        variant={errPage === i ? "contained" : "outlined"}
                        sx={{
                          minWidth: 24,
                          height: 24,
                          p: 0,
                          fontSize: 10,
                          fontWeight: 700,
                          borderRadius: "4px",
                          background: errPage === i ? "#2563eb" : "transparent",
                          color: errPage === i ? "#fff" : "#475569",
                          borderColor: errPage === i ? "#2563eb" : "#e2e8f0",
                          boxShadow: "none",
                          "&:hover": { boxShadow: "none" }
                        }}
                      >
                        {i + 1}
                      </Button>
                    ))}

                    <IconButton
                      size="small"
                      disabled={errPage >= totalErrPages - 1}
                      onClick={() => setErrPage((p) => p + 1)}
                      sx={{ border: "1px solid #e2e8f0", borderRadius: "4px", p: 0.5 }}
                    >
                      <Typography fontSize={10} fontWeight={700}>&gt;</Typography>
                    </IconButton>
                  </Box>

                  <Typography fontSize={10.5} color="#64748b">
                    Showing {errPage * ERR_PAGE_SIZE + 1} to {Math.min((errPage + 1) * ERR_PAGE_SIZE, getTotalErrRows().length)} of {getTotalErrRows().length} errors
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Import / Complete Section */}
          {result && result.successCount > 0 && (
            <Box
              sx={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                p: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Box sx={{ minWidth: 200 }}>
                <Typography fontSize={13} fontWeight={700} color="#1e293b">
                  Ready to import
                </Typography>
                <Typography fontSize={10.5} color="#64748b">
                  {result.successCount} valid assets ready to be imported
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, maxWidth: 360, minWidth: 150 }}>
                <Box sx={{ width: 1, height: 6, background: "#e2e8f0", borderRadius: "3px", overflow: "hidden", position: "relative" }}>
                  <Box
                    sx={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${Math.round((result.successCount / (result.totalRows || 1)) * 100)}%`,
                      background: "#2563eb",
                      borderRadius: "3px",
                      transition: "width 0.5s ease-in-out",
                    }}
                  />
                </Box>
                <Typography fontSize={11} fontWeight={700} color="#475569">
                  {Math.round((result.successCount / (result.totalRows || 1)) * 100)}%
                </Typography>
              </Box>

              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={removeFile}
                  sx={{
                    textTransform: "none",
                    fontSize: 11.5,
                    fontWeight: 600,
                    borderColor: "#cbd5e1",
                    color: "#475569",
                    borderRadius: "6px",
                    py: 0.5,
                    px: 2,
                    height: 32,
                    "&:hover": { borderColor: "#94a3b8", background: "#f8fafc" }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    toast.success(`${result.successCount} assets imported successfully!`);
                    navigate("/home/assets");
                  }}
                  startIcon={<FaUpload size={10} />}
                  sx={{
                    textTransform: "none",
                    fontSize: 11.5,
                    fontWeight: 600,
                    borderRadius: "6px",
                    py: 0.5,
                    px: 2.5,
                    background: "#2563eb",
                    boxShadow: "none",
                    height: 32,
                    "&:hover": { background: "#1d4ed8", boxShadow: "none" }
                  }}
                >
                  Import Assets
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
