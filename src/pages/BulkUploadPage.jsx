import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, CircularProgress, LinearProgress, Typography, Chip } from "@mui/material";
import {
  FaArrowLeft, FaCheckCircle, FaDownload, FaExclamationTriangle,
  FaFileExcel, FaTimesCircle, FaUpload, FaCloudUploadAlt,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { bulkUploadExcel, downloadTemplate } from "../services/assets_service";
import { COLORS } from "../theme/tokens";

/* ─── Horizontal step pill ─────────────────────────────────────────────────── */
function StepPill({ num, label, state }) {
  // state: "done" | "active" | "idle"
  const configs = {
    done:   { circleBg: "#16a34a", circleColor: "#fff", labelColor: "#16a34a", connectorBg: "#16a34a" },
    active: { circleBg: "#1976d2", circleColor: "#fff", labelColor: "#1976d2", connectorBg: "#e0e0e0" },
    idle:   { circleBg: "#e9ecef", circleColor: "#9e9e9e", labelColor: "#9e9e9e", connectorBg: "#e0e0e0" },
  };
  const c = configs[state];
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.75, minWidth: 90 }}>
      <Box sx={{
        width: 40, height: 40, borderRadius: "50%", background: c.circleBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: state === "active" ? "0 0 0 4px #dbeafe" : state === "done" ? "0 0 0 4px #dcfce7" : "none",
        transition: "all 0.25s",
      }}>
        {state === "done"
          ? <FaCheckCircle color="#fff" size={16} />
          : <Typography fontSize={14} fontWeight={700} color={c.circleColor}>{num}</Typography>
        }
      </Box>
      <Typography fontSize={11} fontWeight={600} color={c.labelColor} textAlign="center" lineHeight={1.3}>{label}</Typography>
    </Box>
  );
}

/* ─── Stat tile ─────────────────────────────────────────────────────────────── */
function StatTile({ value, label, icon, bg, accent }) {
  return (
    <Box sx={{
      flex: 1, borderRadius: "14px", background: bg,
      border: `1.5px solid ${accent}20`, p: "20px 16px",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5,
    }}>
      <Box sx={{ fontSize: 22, color: accent, mb: 0.25 }}>{icon}</Box>
      <Typography fontSize={30} fontWeight={800} color={accent} lineHeight={1}>{value}</Typography>
      <Typography fontSize={12} fontWeight={500} color={accent} sx={{ opacity: 0.75 }}>{label}</Typography>
    </Box>
  );
}

/* ─── Issue row ─────────────────────────────────────────────────────────────── */
function IssueRow({ item, index, type }) {
  const isError = type === "error";
  const rowBg   = index % 2 === 0 ? (isError ? "#fff5f5" : "#fffdf0") : "#fff";
  return (
    <Box sx={{
      display: "grid",
      gridTemplateColumns: isError ? "56px 110px 1fr" : "56px 1fr",
      background: rowBg,
      borderBottom: `1px solid ${isError ? "#fee2e2" : "#fef3c7"}`,
      "&:last-child": { borderBottom: "none" },
    }}>
      <Box sx={{ px: 2, py: 1.25, borderRight: `1px solid ${isError ? "#fee2e2" : "#fef3c7"}` }}>
        <Chip label={typeof item === "object" ? item.row ?? "—" : "—"} size="small"
          sx={{ fontSize: 11, height: 20, fontWeight: 700, background: isError ? "#fee2e2" : "#fef9c3", color: isError ? "#991b1b" : "#92400e" }} />
      </Box>
      {isError && (
        <Box sx={{ px: 2, py: 1.25, borderRight: `1px solid #fee2e2`, display: "flex", alignItems: "center" }}>
          <Typography fontSize={12} fontWeight={600} color="#b91c1c">
            {typeof item === "object" ? item.field ?? "—" : "—"}
          </Typography>
        </Box>
      )}
      <Box sx={{ px: 2, py: 1.25, display: "flex", alignItems: "center" }}>
        <Typography fontSize={12} color={isError ? "#7f1d1d" : "#78350f"}>
          {typeof item === "object" ? item.message : item}
        </Typography>
      </Box>
    </Box>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────────── */
export default function BulkUploadPage() {
  const navigate     = useNavigate();
  const fileInputRef = useRef(null);

  const [file,     setFile]     = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [issueTab, setIssueTab] = useState("errors"); // "errors" | "skipped"
  const [dragOver, setDragOver] = useState(false);

  const hasErrors  = (result?.errors?.length  ?? 0) > 0;
  const hasSkipped = (result?.skipped?.length ?? 0) > 0;
  const allGood    = result && !hasErrors && !hasSkipped;

  const stepState = (n) => {
    if (n === 1) return result || file ? "done" : "active";
    if (n === 2) return result ? "done" : file ? "active" : "idle";
    return result ? "active" : "idle";
  };

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.match(/\.(xlsx|xls)$/i)) { toast.error("Please select an Excel file (.xlsx or .xls)"); return; }
    setFile(f); setResult(null);
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); };

  const handleUpload = async () => {
    if (!file) return;
    try {
      setLoading(true);
      const res  = await bulkUploadExcel(file);
      const data = res?.data ?? res;
      setResult(data);
      setIssueTab(data?.errors?.length > 0 ? "errors" : "skipped");
      if ((data?.successCount ?? 0) > 0) toast.success(`${data.successCount} asset(s) imported`);
    } catch (e) {
      toast.error(e.response?.data?.message || "Bulk upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try { await downloadTemplate(); }
    catch { toast.error("Failed to download template"); }
  };

  const reset = () => {
    setFile(null); setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Box sx={{ mt: "60px", minHeight: "100vh", background: "#f0f2f7", fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* ── Hero header ── */}
      <Box sx={{
        background: "linear-gradient(135deg, #1565c0 0%, #1976d2 50%, #42a5f5 100%)",
        px: "2.5rem", pt: 3.5, pb: 5,
      }}>
        <Button
          startIcon={<FaArrowLeft size={11} />}
          onClick={() => navigate("/home/assets")}
          sx={{ textTransform: "none", fontSize: 13, color: "rgba(255,255,255,0.8)", mb: 2.5, p: "4px 10px", borderRadius: "8px", "&:hover": { background: "rgba(255,255,255,0.12)", color: "#fff" } }}
        >
          Back to Assets
        </Button>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: "14px", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
            <FaCloudUploadAlt color="#fff" size={22} />
          </Box>
          <Box>
            <Typography fontSize={22} fontWeight={800} color="#fff" lineHeight={1.2}>Bulk Upload Assets</Typography>
            <Typography fontSize={13} color="rgba(255,255,255,0.72)" mt={0.25}>Import multiple assets at once from an Excel spreadsheet</Typography>
          </Box>
        </Box>

        {/* Horizontal stepper */}
        <Box sx={{
          background: "rgba(255,255,255,0.13)", backdropFilter: "blur(8px)",
          borderRadius: "16px", border: "1px solid rgba(255,255,255,0.2)",
          px: 4, py: 2.5, display: "flex", alignItems: "center", gap: 0,
          maxWidth: 560,
        }}>
          <StepPill num={1} label="Download Template" state={stepState(1)} />
          <Box sx={{ flex: 1, height: 2, background: stepState(1) === "done" ? "#16a34a" : "rgba(255,255,255,0.25)", mx: 1, borderRadius: 2, transition: "background 0.3s" }} />
          <StepPill num={2} label="Upload File" state={stepState(2)} />
          <Box sx={{ flex: 1, height: 2, background: stepState(2) === "done" ? "#16a34a" : "rgba(255,255,255,0.25)", mx: 1, borderRadius: 2, transition: "background 0.3s" }} />
          <StepPill num={3} label="Review Results" state={stepState(3)} />
        </Box>
      </Box>

      {/* ── Content pulled up over hero ── */}
      <Box sx={{ px: "2.5rem", mt: "-2rem", pb: 4, display: "flex", gap: 2.5, alignItems: "flex-start" }}>

        {/* ── Left column ── */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: 300, flexShrink: 0 }}>

          {/* Template card */}
          <Box sx={{ background: "#fff", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.07)", overflow: "hidden" }}>
            <Box sx={{ background: "linear-gradient(135deg, #e8f5e9, #f1f8e9)", px: 2.5, py: 2, borderBottom: "1px solid #e8f5e9", display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ width: 34, height: 34, borderRadius: "10px", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                <FaFileExcel color="#217346" size={16} />
              </Box>
              <Typography fontSize={14} fontWeight={700} color="#1b5e20">Step 1 — Template</Typography>
            </Box>
            <Box sx={{ p: 2.5 }}>
              <Typography fontSize={12.5} color={COLORS.textMuted} lineHeight={1.7} mb={2}>
                Download the Excel template, fill in your asset data, then save the file before uploading.
              </Typography>
              <Box sx={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: "10px", p: 1.5, mb: 2 }}>
                <Typography fontSize={11.5} fontWeight={600} color="#e65100" mb={0.5}>⚠ Allowed Status Values</Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip label="AVAILABLE" size="small" sx={{ fontSize: 10.5, height: 20, background: "#e8f5e9", color: "#2e7d32", fontWeight: 700 }} />
                  <Chip label="DAMAGED"   size="small" sx={{ fontSize: 10.5, height: 20, background: "#ffebee", color: "#c62828", fontWeight: 700 }} />
                </Box>
                <Typography fontSize={11} color="#bf360c" mt={0.75}>ASSIGNED & DISPOSED are not permitted.</Typography>
              </Box>
              <Button
                fullWidth variant="contained"
                startIcon={<FaDownload size={11} />}
                onClick={handleDownloadTemplate}
                sx={{ textTransform: "none", fontSize: 13, fontWeight: 600, borderRadius: "10px", py: 1, background: "#217346", boxShadow: "none", "&:hover": { background: "#1b5e20", boxShadow: "none" } }}
              >
                Download Template
              </Button>
            </Box>
          </Box>

          {/* Tips card */}
          <Box sx={{ background: "#fff", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.07)", p: 2.5 }}>
            <Typography fontSize={13} fontWeight={700} color={COLORS.text} mb={1.5}>💡 Tips</Typography>
            {[
              "Don't change column headers in the template",
              "Date format: YYYY-MM-DD",
              "Asset Code must be unique",
              "Leave optional fields blank, not empty strings",
            ].map((tip, i) => (
              <Box key={i} sx={{ display: "flex", gap: 1, mb: 1, alignItems: "flex-start" }}>
                <Box sx={{ width: 5, height: 5, borderRadius: "50%", background: COLORS.primary, mt: "6px", flexShrink: 0 }} />
                <Typography fontSize={12} color={COLORS.textMuted} lineHeight={1.6}>{tip}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ── Right column ── */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>

          {/* Upload card */}
          <Box sx={{ background: "#fff", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.07)", overflow: "hidden" }}>
            <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography fontSize={14} fontWeight={700} color={COLORS.text}>Step 2 — Upload File</Typography>
              {file && !result && (
                <Button size="small" onClick={reset} sx={{ textTransform: "none", fontSize: 12, color: "#e53935", minWidth: 0 }}>
                  Clear
                </Button>
              )}
            </Box>

            <Box sx={{ p: 3 }}>
              {/* Drop zone */}
              <Box
                onClick={() => !loading && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                sx={{
                  border: `2px dashed ${dragOver ? "#1976d2" : file ? "#4caf50" : "#d0d7de"}`,
                  borderRadius: "14px",
                  p: "2.5rem 2rem",
                  textAlign: "center",
                  cursor: loading ? "default" : "pointer",
                  background: dragOver ? "#e8f0fe" : file ? "#f6fef6" : "#fafbfc",
                  transition: "all 0.2s",
                  "&:hover": loading ? {} : { borderColor: "#1976d2", background: "#f0f4ff" },
                }}
              >
                {file ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, justifyContent: "center" }}>
                    <Box sx={{ width: 52, height: 52, borderRadius: "12px", background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <FaFileExcel size={26} color="#217346" />
                    </Box>
                    <Box sx={{ textAlign: "left" }}>
                      <Typography fontSize={14} fontWeight={700} color="#1b5e20">{file.name}</Typography>
                      <Typography fontSize={12} color={COLORS.textFaint} mt={0.25}>{(file.size / 1024).toFixed(1)} KB · Excel Spreadsheet</Typography>
                      <Chip label="Ready to upload" size="small" sx={{ mt: 0.75, fontSize: 11, height: 20, background: "#dcfce7", color: "#15803d", fontWeight: 600 }} />
                    </Box>
                  </Box>
                ) : (
                  <>
                    <Box sx={{ width: 64, height: 64, borderRadius: "50%", background: "#f0f4ff", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 1.5 }}>
                      <FaCloudUploadAlt size={30} color="#1976d2" />
                    </Box>
                    <Typography fontSize={15} fontWeight={600} color="#374151">Drop your Excel file here</Typography>
                    <Typography fontSize={13} color="#9ca3af" mt={0.5}>or <span style={{ color: "#1976d2", fontWeight: 600 }}>click to browse</span></Typography>
                    <Typography fontSize={11} color="#c0c4cc" mt={1}>.xlsx or .xls files only</Typography>
                  </>
                )}
              </Box>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files?.[0])} />

              {/* Progress bar */}
              {loading && (
                <Box sx={{ mt: 2.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography fontSize={13} color={COLORS.textMuted} fontWeight={500}>Processing your file…</Typography>
                    <CircularProgress size={15} thickness={5} />
                  </Box>
                  <LinearProgress sx={{ borderRadius: 4, height: 6 }} />
                </Box>
              )}

              {/* Action row */}
              <Box sx={{ mt: 2.5, display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
                {result && (
                  <Button
                    variant="outlined"
                    onClick={reset}
                    sx={{ textTransform: "none", fontSize: 13, borderColor: COLORS.border, color: COLORS.textMuted, borderRadius: "10px", px: 2.5 }}
                  >
                    Upload Another
                  </Button>
                )}
                <Button
                  variant="contained"
                  onClick={handleUpload}
                  disabled={!file || loading || !!result}
                  startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <FaUpload size={12} />}
                  sx={{ textTransform: "none", fontSize: 13, fontWeight: 700, borderRadius: "10px", px: 3, py: 1.1, background: "#1976d2", boxShadow: "0 4px 14px rgba(25,118,210,0.35)", "&:hover": { background: "#1565c0", boxShadow: "0 4px 14px rgba(25,118,210,0.45)" }, "&.Mui-disabled": { background: "#e0e0e0", boxShadow: "none" } }}
                >
                  {loading ? "Uploading…" : "Upload File"}
                </Button>
              </Box>
            </Box>
          </Box>

          {/* Results card */}
          {result && (
            <Box sx={{ background: "#fff", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.07)", overflow: "hidden" }}>

              {/* Result banner */}
              <Box sx={{
                px: 3, py: 2,
                background: allGood ? "linear-gradient(135deg,#f0fdf4,#dcfce7)" : "linear-gradient(135deg,#fffbeb,#fef3c7)",
                borderBottom: `1px solid ${allGood ? "#bbf7d0" : "#fde68a"}`,
                display: "flex", alignItems: "center", gap: 1.5,
              }}>
                {allGood
                  ? <FaCheckCircle color="#16a34a" size={22} />
                  : <FaExclamationTriangle color="#d97706" size={20} />
                }
                <Box>
                  <Typography fontSize={15} fontWeight={700} color={allGood ? "#15803d" : "#92400e"}>
                    {allGood ? "All rows imported successfully!" : "Import completed with issues"}
                  </Typography>
                  <Typography fontSize={12} color={allGood ? "#166534" : "#78350f"}>
                    {allGood
                      ? `${result.successCount} record(s) added with no issues.`
                      : "Review the details below, fix your file, and re-upload the affected rows."}
                  </Typography>
                </Box>
              </Box>

              {/* Stat tiles */}
              <Box sx={{ display: "flex", gap: 2, p: 3, borderBottom: (hasErrors || hasSkipped) ? `1px solid ${COLORS.border}` : "none" }}>
                <StatTile value={result.totalRows ?? 0}    label="Total Rows" icon="📋" bg="#f8fafc" accent="#475569" />
                <StatTile value={result.successCount ?? 0} label="Imported"   icon="✅" bg="#f0fdf4" accent="#16a34a" />
                <StatTile value={result.skippedCount ?? 0} label="Skipped"    icon="⏭" bg="#fffbeb" accent="#d97706" />
                <StatTile value={result.failedCount ?? 0}  label="Failed"     icon="❌" bg="#fef2f2" accent="#dc2626" />
              </Box>

              {/* Issue tabs */}
              {(hasErrors || hasSkipped) && (
                <>
                  <Box sx={{ display: "flex", gap: 0, borderBottom: `1px solid ${COLORS.border}`, px: 3, background: "#fafbfc" }}>
                    {hasErrors && (
                      <Box
                        onClick={() => setIssueTab("errors")}
                        sx={{
                          px: 2.5, py: 1.5, cursor: "pointer", fontSize: 13, fontWeight: 600,
                          color: issueTab === "errors" ? "#dc2626" : COLORS.textFaint,
                          borderBottom: issueTab === "errors" ? "2px solid #dc2626" : "2px solid transparent",
                          display: "flex", alignItems: "center", gap: 1, transition: "all 0.15s",
                        }}
                      >
                        <FaTimesCircle size={13} />
                        Errors
                        <Chip label={result.errors.length} size="small" sx={{ fontSize: 10, height: 18, background: "#fee2e2", color: "#dc2626", fontWeight: 700 }} />
                      </Box>
                    )}
                    {hasSkipped && (
                      <Box
                        onClick={() => setIssueTab("skipped")}
                        sx={{
                          px: 2.5, py: 1.5, cursor: "pointer", fontSize: 13, fontWeight: 600,
                          color: issueTab === "skipped" ? "#d97706" : COLORS.textFaint,
                          borderBottom: issueTab === "skipped" ? "2px solid #d97706" : "2px solid transparent",
                          display: "flex", alignItems: "center", gap: 1, transition: "all 0.15s",
                        }}
                      >
                        <FaExclamationTriangle size={12} />
                        Skipped
                        <Chip label={result.skipped.length} size="small" sx={{ fontSize: 10, height: 18, background: "#fef9c3", color: "#d97706", fontWeight: 700 }} />
                      </Box>
                    )}
                  </Box>

                  {/* Table header */}
                  <Box sx={{
                    display: "grid",
                    gridTemplateColumns: issueTab === "errors" ? "56px 110px 1fr" : "56px 1fr",
                    background: issueTab === "errors" ? "#fff5f5" : "#fffdf0",
                    borderBottom: `1px solid ${issueTab === "errors" ? "#fecaca" : "#fde68a"}`,
                    px: 0,
                  }}>
                    {["Row", ...(issueTab === "errors" ? ["Field"] : []), "Message / Reason"].map((h, i) => (
                      <Box key={i} sx={{ px: 2, py: 1.25, borderRight: i < (issueTab === "errors" ? 2 : 1) ? `1px solid ${issueTab === "errors" ? "#fecaca" : "#fde68a"}` : "none" }}>
                        <Typography fontSize={11} fontWeight={700} color={issueTab === "errors" ? "#991b1b" : "#92400e"} textTransform="uppercase" letterSpacing={0.5}>{h}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ maxHeight: 320, overflowY: "auto" }}>
                    {issueTab === "errors" && result.errors.map((item, i) => (
                      <IssueRow key={i} item={item} index={i} type="error" />
                    ))}
                    {issueTab === "skipped" && result.skipped.map((item, i) => (
                      <IssueRow key={i} item={item} index={i} type="skipped" />
                    ))}
                  </Box>

                  <Box sx={{ px: 3, py: 1.5, background: "#fafbfc", borderTop: `1px solid ${COLORS.border}` }}>
                    <Typography fontSize={12} color={COLORS.textFaint}>
                      Fix the highlighted rows in your Excel file and use <strong>Upload Another</strong> to re-import them.
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
