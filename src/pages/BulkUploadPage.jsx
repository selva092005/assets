import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, CircularProgress, LinearProgress,
  Tab, Tabs, Typography,
} from "@mui/material";
import {
  FaArrowLeft, FaCheckCircle, FaDownload,
  FaExclamationCircle, FaFileExcel, FaUpload,
} from "react-icons/fa";
import { MdOutlineSkipNext } from "react-icons/md";
import toast from "react-hot-toast";
import { bulkUploadExcel, downloadTemplate } from "../services/assets_service";
import { COLORS } from "../theme/tokens";

/* ── stat card ── */
function StatCard({ value, label, bg, border, color }) {
  return (
    <Box sx={{ p: "18px 12px", borderRadius: "12px", background: bg, border: `1px solid ${border}`, textAlign: "center", flex: 1 }}>
      <Typography fontSize={32} fontWeight={800} color={color} lineHeight={1}>{value}</Typography>
      <Typography fontSize={12} color={color} mt={0.5} fontWeight={500}>{label}</Typography>
    </Box>
  );
}

/* ── issue table ── */
function IssueTable({ rows, type }) {
  const isError = type === "error";
  const border  = isError ? "#fecaca" : "#fde68a";
  const headBg  = isError ? "#fee2e2" : "#fef9c3";
  const headClr = isError ? "#991b1b" : "#92400e";
  const evenBg  = isError ? "#fef2f2" : "#fffbeb";
  const rowClr  = isError ? "#7f1d1d" : "#78350f";
  const rowBdr  = isError ? "#fee2e2" : "#fef3c7";

  return (
    <Box sx={{ border: `1px solid ${border}`, borderRadius: "8px", overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: headBg }}>
            <th style={{ padding: "8px 12px", textAlign: "left", color: headClr, fontWeight: 700, borderBottom: `1px solid ${border}`, width: 60 }}>Row</th>
            {isError && (
              <th style={{ padding: "8px 12px", textAlign: "left", color: headClr, fontWeight: 700, borderBottom: `1px solid ${border}`, width: 120 }}>Field</th>
            )}
            <th style={{ padding: "8px 12px", textAlign: "left", color: headClr, fontWeight: 700, borderBottom: `1px solid ${border}` }}>
              {isError ? "Message" : "Reason"}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? evenBg : "#fff" }}>
              <td style={{ padding: "7px 12px", color: headClr, borderBottom: `1px solid ${rowBdr}`, fontWeight: 600 }}>
                {typeof item === "object" ? item.row ?? "—" : "—"}
              </td>
              {isError && (
                <td style={{ padding: "7px 12px", color: headClr, borderBottom: `1px solid ${rowBdr}`, fontWeight: 500 }}>
                  {typeof item === "object" ? item.field ?? "—" : "—"}
                </td>
              )}
              <td style={{ padding: "7px 12px", color: rowClr, borderBottom: `1px solid ${rowBdr}` }}>
                {typeof item === "object" ? item.message : item}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
}

/* ── step indicator ── */
function Step({ num, label, active, done }) {
  const bg = done ? "#2e7d32" : active ? COLORS.primary : "#e0e0e0";
  const clr = done || active ? "#fff" : "#9e9e9e";
  const textClr = done ? "#2e7d32" : active ? COLORS.primary : "#9e9e9e";
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <Box sx={{ width: 32, height: 32, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s" }}>
        {done
          ? <FaCheckCircle color="#fff" size={14} />
          : <Typography fontSize={13} color={clr} fontWeight={700}>{num}</Typography>
        }
      </Box>
      <Typography fontSize={14} fontWeight={600} color={textClr}>{label}</Typography>
    </Box>
  );
}

export default function BulkUploadPage() {
  const navigate     = useNavigate();
  const fileInputRef = useRef(null);

  const [file,     setFile]     = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [tab,      setTab]      = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const hasErrors  = result?.errors?.length  > 0;
  const hasSkipped = result?.skipped?.length > 0;
  const allGood    = result && !hasErrors && !hasSkipped;

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.match(/\.(xlsx|xls)$/i)) { toast.error("Please select an Excel file (.xlsx or .xls)"); return; }
    setFile(f);
    setResult(null);
    setTab(0);
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
      setTab(0);
      const count = data?.successCount ?? 0;
      if (count > 0) toast.success(`${count} asset(s) uploaded successfully`);
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const step = result ? 3 : file ? 2 : 1;

  return (
    <Box sx={{ mt: "60px", minHeight: "100vh", background: COLORS.bg, fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* ── Top bar ── */}
      <Box sx={{ background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, px: "2.5rem", py: 2, display: "flex", alignItems: "center", gap: 2 }}>
        <Button
          startIcon={<FaArrowLeft size={12} />}
          onClick={() => navigate("/home/assets")}
          sx={{ textTransform: "none", fontSize: 13, color: COLORS.textMuted, minWidth: 0, p: "6px 12px", borderRadius: "8px", "&:hover": { background: "#f5f5f5" } }}
        >
          Back to Assets
        </Button>
        <Box sx={{ width: 1, height: 20, background: COLORS.border }} />
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: "10px", background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FaFileExcel color="#2e7d32" size={18} />
          </Box>
          <Box>
            <Typography fontWeight={700} fontSize={17} lineHeight={1.2}>Bulk Upload Assets</Typography>
            <Typography fontSize={12} color={COLORS.textFaint}>Import multiple assets at once using an Excel file</Typography>
          </Box>
        </Box>
      </Box>

      {/* ── Body ── */}
      <Box sx={{ p: "2rem 2.5rem", display: "flex", gap: 3, alignItems: "flex-start" }}>

        {/* ── Left: Steps sidebar ── */}
        <Box sx={{ width: 260, flexShrink: 0, background: COLORS.surface, borderRadius: "14px", border: `1px solid ${COLORS.border}`, p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
          <Typography fontSize={13} fontWeight={700} color={COLORS.textMuted} textTransform="uppercase" letterSpacing={0.8}>Steps</Typography>

          <Step num={1} label="Download Template" active={step === 1} done={step > 1} />
          <Box sx={{ ml: "15px", pl: 2, borderLeft: `2px solid ${step > 1 ? "#2e7d32" : "#e0e0e0"}`, pb: 1 }}>
            <Typography fontSize={12} color={COLORS.textFaint} lineHeight={1.6}>
              Download the Excel template, fill in your asset data, then save the file.
            </Typography>
            <Box sx={{ mt: 1, p: 1.25, background: "#fff3e0", border: "1px solid #ffcc80", borderRadius: "8px" }}>
              <Typography fontSize={11} color="#e65100" fontWeight={500} lineHeight={1.5}>
                Status allowed: AVAILABLE / DAMAGED<br />
                ASSIGNED and DISPOSED are not permitted.
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              startIcon={<FaDownload size={10} />}
              onClick={handleDownloadTemplate}
              sx={{ mt: 1.5, textTransform: "none", fontSize: 12, borderColor: COLORS.primary, color: COLORS.primary, borderRadius: "6px" }}
            >
              Download Template
            </Button>
          </Box>

          <Step num={2} label="Select File" active={step === 2} done={step > 2} />
          <Box sx={{ ml: "15px", pl: 2, borderLeft: `2px solid ${step > 2 ? "#2e7d32" : "#e0e0e0"}`, pb: 1 }}>
            <Typography fontSize={12} color={COLORS.textFaint} lineHeight={1.6}>
              Drag & drop or click the upload zone to select your filled .xlsx file.
            </Typography>
          </Box>

          <Step num={3} label="Review Results" active={step === 3} done={false} />
          <Box sx={{ ml: "15px", pl: 2 }}>
            <Typography fontSize={12} color={COLORS.textFaint} lineHeight={1.6}>
              Check the import summary and fix any errors in your file if needed.
            </Typography>
          </Box>
        </Box>

        {/* ── Right: Main content ── */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2.5 }}>

          {/* Drop zone */}
          <Box
            onClick={() => !loading && fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            sx={{
              background: COLORS.surface,
              border: `2px dashed ${dragOver ? COLORS.primary : file ? "#4caf50" : COLORS.border}`,
              borderRadius: "14px",
              p: "3rem 2rem",
              textAlign: "center",
              cursor: loading ? "default" : "pointer",
              background: dragOver ? "#e8f0fe" : file ? "#f1f8e9" : COLORS.surface,
              transition: "all 0.18s",
              "&:hover": loading ? {} : { borderColor: COLORS.primary, background: "#f0f4ff" },
            }}
          >
            {file ? (
              <>
                <FaFileExcel size={52} color="#4caf50" />
                <Typography fontSize={16} fontWeight={700} color="#2e7d32" mt={1.5}>{file.name}</Typography>
                <Typography fontSize={13} color={COLORS.textFaint} mt={0.5}>{(file.size / 1024).toFixed(1)} KB</Typography>
                <Button
                  size="small"
                  onClick={(e) => { e.stopPropagation(); removeFile(); }}
                  sx={{ mt: 1.5, textTransform: "none", fontSize: 12, color: "#e53935" }}
                >
                  Remove file
                </Button>
              </>
            ) : (
              <>
                <FaUpload size={44} color="#bdbdbd" />
                <Typography fontSize={16} fontWeight={600} color="#757575" mt={1.5}>
                  Drag & drop your Excel file here
                </Typography>
                <Typography fontSize={13} color="#aaa" mt={0.5}>or click to browse — .xlsx / .xls only</Typography>
              </>
            )}
          </Box>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files?.[0])} />

          {/* Upload button */}
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              size="large"
              startIcon={loading ? <CircularProgress size={15} color="inherit" /> : <FaUpload size={13} />}
              onClick={handleUpload}
              disabled={!file || loading}
              sx={{ textTransform: "none", fontSize: 14, fontWeight: 600, borderRadius: "10px", px: 3.5, py: 1.25, background: "#2e7d32", boxShadow: "none", "&:hover": { background: "#1b5e20", boxShadow: "none" } }}
            >
              {loading ? "Uploading…" : "Upload File"}
            </Button>
          </Box>

          {/* Progress */}
          {loading && (
            <Box sx={{ background: COLORS.surface, borderRadius: "12px", border: `1px solid ${COLORS.border}`, p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography fontSize={13} color={COLORS.textMuted}>Processing your file…</Typography>
                <CircularProgress size={16} />
              </Box>
              <LinearProgress sx={{ borderRadius: 4 }} />
            </Box>
          )}

          {/* Results */}
          {result && (
            <Box sx={{ background: COLORS.surface, borderRadius: "14px", border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>

              {/* Result header */}
              <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 1.5 }}>
                {allGood
                  ? <FaCheckCircle color="#16a34a" size={20} />
                  : <FaExclamationCircle color="#d97706" size={20} />
                }
                <Box>
                  <Typography fontSize={15} fontWeight={700} color={allGood ? "#15803d" : COLORS.text}>
                    {allGood ? "All rows imported successfully!" : "Import completed with issues"}
                  </Typography>
                  <Typography fontSize={12} color={COLORS.textFaint}>
                    {allGood
                      ? `${result.successCount} record(s) added with no issues.`
                      : "Review the errors and skipped rows below, fix your file, and re-upload."}
                  </Typography>
                </Box>
              </Box>

              {/* Stat cards */}
              <Box sx={{ display: "flex", gap: 2, p: 3, borderBottom: (hasErrors || hasSkipped) ? `1px solid ${COLORS.border}` : "none" }}>
                <StatCard value={result.totalRows ?? 0}    label="Total Rows"  bg="#f8fafc" border="#e2e8f0" color="#475569" />
                <StatCard value={result.successCount ?? 0} label="Imported"    bg="#f0fdf4" border="#bbf7d0" color="#16a34a" />
                <StatCard value={result.skippedCount ?? 0} label="Skipped"     bg="#fffbeb" border="#fde68a" color="#d97706" />
                <StatCard value={result.failedCount ?? 0}  label="Failed"      bg="#fef2f2" border="#fecaca" color="#dc2626" />
              </Box>

              {/* Tabs */}
              {(hasErrors || hasSkipped) && (
                <>
                  <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    sx={{
                      px: 2,
                      background: "#f8fafc",
                      borderBottom: `1px solid ${COLORS.border}`,
                      "& .MuiTab-root": { minHeight: 44, textTransform: "none", fontSize: 13, fontWeight: 600 },
                    }}
                  >
                    {hasErrors && (
                      <Tab
                        value={0}
                        label={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <FaExclamationCircle color="#dc2626" size={13} />
                            <span style={{ color: "#dc2626" }}>Errors ({result.errors.length})</span>
                          </Box>
                        }
                      />
                    )}
                    {hasSkipped && (
                      <Tab
                        value={hasErrors ? 1 : 0}
                        label={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <MdOutlineSkipNext color="#d97706" size={16} />
                            <span style={{ color: "#d97706" }}>Skipped ({result.skipped.length})</span>
                          </Box>
                        }
                      />
                    )}
                  </Tabs>

                  <Box sx={{ p: 2.5, maxHeight: 380, overflowY: "auto" }}>
                    {tab === 0 && hasErrors  && <IssueTable rows={result.errors}  type="error"   />}
                    {tab === (hasErrors ? 1 : 0) && hasSkipped && <IssueTable rows={result.skipped} type="skipped" />}
                  </Box>

                  <Box sx={{ px: 3, py: 1.5, background: "#f8fafc", borderTop: `1px solid ${COLORS.border}` }}>
                    <Typography fontSize={12} color={COLORS.textFaint}>
                      Fix the highlighted rows in your Excel file and re-upload to import them.
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
