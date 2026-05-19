import { useRef, useState } from "react";
import {
  Box, Button, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, LinearProgress,
  Tab, Tabs, Typography,
} from "@mui/material";
import {
  FaCheckCircle, FaDownload, FaExclamationCircle,
  FaFileExcel, FaTimes, FaUpload,
} from "react-icons/fa";
import { MdOutlineSkipNext } from "react-icons/md";

/* ── tiny stat card ─────────────────────────────────────────────────────── */
function StatCard({ value, label, bg, border, color }) {
  return (
    <Box sx={{ p: "10px 8px", borderRadius: "10px", background: bg, border: `1px solid ${border}`, textAlign: "center", flex: 1 }}>
      <Typography fontSize={22} fontWeight={800} color={color} lineHeight={1}>{value}</Typography>
      <Typography fontSize={11} color={color} mt={0.4} fontWeight={500}>{label}</Typography>
    </Box>
  );
}

/* ── error / skipped table ──────────────────────────────────────────────── */
function IssueTable({ rows, type }) {
  const isError = type === "error";
  const border  = isError ? "#fecaca" : "#fde68a";
  const headBg  = isError ? "#fee2e2" : "#fef9c3";
  const headClr = isError ? "#991b1b" : "#92400e";
  const evenBg  = isError ? "#fef2f2" : "#fffbeb";
  const oddBg   = isError ? "#fff5f5" : "#fefce8";
  const rowClr  = isError ? "#7f1d1d" : "#78350f";
  const rowBdr  = isError ? "#fee2e2" : "#fef3c7";

  return (
    <Box sx={{ border: `1px solid ${border}`, borderRadius: "8px", overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ background: headBg }}>
            <th style={{ padding: "6px 10px", textAlign: "left", color: headClr, fontWeight: 700, borderBottom: `1px solid ${border}`, width: 52 }}>Row</th>
            {isError && (
              <th style={{ padding: "6px 10px", textAlign: "left", color: headClr, fontWeight: 700, borderBottom: `1px solid ${border}`, width: 100 }}>Field</th>
            )}
            <th style={{ padding: "6px 10px", textAlign: "left", color: headClr, fontWeight: 700, borderBottom: `1px solid ${border}` }}>
              {isError ? "Message" : "Reason"}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? evenBg : oddBg }}>
              <td style={{ padding: "5px 10px", color: headClr, borderBottom: `1px solid ${rowBdr}`, fontWeight: 600 }}>
                {typeof item === "object" ? item.row ?? "—" : "—"}
              </td>
              {isError && (
                <td style={{ padding: "5px 10px", color: headClr, borderBottom: `1px solid ${rowBdr}`, fontWeight: 500 }}>
                  {typeof item === "object" ? item.field ?? "—" : "—"}
                </td>
              )}
              <td style={{ padding: "5px 10px", color: rowClr, borderBottom: `1px solid ${rowBdr}` }}>
                {typeof item === "object" ? item.message : item}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
}

/* ── main component ─────────────────────────────────────────────────────── */
export default function BulkUploadDialog({
  open,
  onClose,
  title = "Bulk Upload",
  templateNote,          // e.g. "Status allowed: AVAILABLE / DAMAGED"
  onDownloadTemplate,
  onUpload,              // async fn(file) => result {successCount, totalRows, skippedCount, failedCount, skipped[], errors[]}
  onSuccess,             // called after successful upload
}) {
  const fileInputRef  = useRef(null);
  const [file,        setFile]        = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState(null);
  const [tab,         setTab]         = useState(0);   // 0=errors 1=skipped
  const [dragOver,    setDragOver]    = useState(false);

  const hasErrors  = result?.errors?.length  > 0;
  const hasSkipped = result?.skipped?.length > 0;
  const allGood    = result && !hasErrors && !hasSkipped;

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.match(/\.(xlsx|xls)$/i)) { alert("Please select an Excel file (.xlsx or .xls)"); return; }
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
      const res = await onUpload(file);
      const data = res?.data ?? res;
      setResult(data);
      setTab(0);
      if ((data?.successCount ?? 0) > 0) onSuccess?.(data.successCount);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setLoading(false);
    setTab(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  const removeFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: "14px", overflow: "hidden" } }}
    >
      {/* ── Header ── */}
      <DialogTitle sx={{ p: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2, borderBottom: "1px solid #f0f0f0" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ width: 34, height: 34, borderRadius: "8px", background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FaFileExcel color="#2e7d32" size={16} />
            </Box>
            <Box>
              <Typography fontWeight={700} fontSize={15} lineHeight={1.2}>{title}</Typography>
              <Typography fontSize={11} color="#888">Upload an Excel file to import records in bulk</Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={handleClose} sx={{ color: "#999" }}><FaTimes size={13} /></IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column", gap: 0 }}>
        <Box sx={{ display: "flex", minHeight: 420 }}>

          {/* ── Left panel: steps ── */}
          <Box sx={{ width: 220, flexShrink: 0, background: "#f8fafc", borderRight: "1px solid #f0f0f0", p: 2.5, display: "flex", flexDirection: "column", gap: 2.5 }}>

            {/* Step 1 */}
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Box sx={{ width: 22, height: 22, borderRadius: "50%", background: "#1565c0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography fontSize={11} color="#fff" fontWeight={700}>1</Typography>
                </Box>
                <Typography fontSize={12} fontWeight={700} color="#1565c0">Download Template</Typography>
              </Box>
              <Typography fontSize={11} color="#666" mb={1.2} lineHeight={1.5}>
                Get the Excel template, fill in your data, then save.
              </Typography>
              {templateNote && (
                <Box sx={{ background: "#fff3e0", border: "1px solid #ffcc80", borderRadius: "6px", px: 1, py: 0.75, mb: 1.2 }}>
                  <Typography fontSize={10.5} color="#e65100" fontWeight={500} lineHeight={1.5}>{templateNote}</Typography>
                </Box>
              )}
              {onDownloadTemplate && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<FaDownload size={10} />}
                  onClick={onDownloadTemplate}
                  sx={{ textTransform: "none", fontSize: 11, borderColor: "#1565c0", color: "#1565c0", borderRadius: "6px", py: 0.5 }}
                >
                  Download
                </Button>
              )}
            </Box>

            <Box sx={{ height: "1px", background: "#e8edf2" }} />

            {/* Step 2 */}
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Box sx={{ width: 22, height: 22, borderRadius: "50%", background: file ? "#2e7d32" : "#9e9e9e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography fontSize={11} color="#fff" fontWeight={700}>2</Typography>
                </Box>
                <Typography fontSize={12} fontWeight={700} color={file ? "#2e7d32" : "#9e9e9e"}>Select File</Typography>
              </Box>
              <Typography fontSize={11} color="#666" lineHeight={1.5}>
                Click the upload zone or drag & drop your filled .xlsx file.
              </Typography>
            </Box>

            <Box sx={{ height: "1px", background: "#e8edf2" }} />

            {/* Step 3 */}
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Box sx={{ width: 22, height: 22, borderRadius: "50%", background: result ? "#2e7d32" : "#9e9e9e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography fontSize={11} color="#fff" fontWeight={700}>3</Typography>
                </Box>
                <Typography fontSize={12} fontWeight={700} color={result ? "#2e7d32" : "#9e9e9e"}>Review Results</Typography>
              </Box>
              <Typography fontSize={11} color="#666" lineHeight={1.5}>
                Check the summary and fix any errors in your file.
              </Typography>
            </Box>
          </Box>

          {/* ── Right panel: upload + results ── */}
          <Box sx={{ flex: 1, p: 2.5, display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>

            {/* Drop zone */}
            <Box
              onClick={() => !loading && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              sx={{
                border: `2px dashed ${dragOver ? "#1565c0" : file ? "#4caf50" : "#d0d7de"}`,
                borderRadius: "10px",
                p: 3,
                textAlign: "center",
                cursor: loading ? "default" : "pointer",
                background: dragOver ? "#e8f0fe" : file ? "#f1f8e9" : "#fafbfc",
                transition: "all 0.18s",
                "&:hover": loading ? {} : { borderColor: "#1565c0", background: "#f0f4ff" },
                position: "relative",
              }}
            >
              {file ? (
                <>
                  <FaFileExcel size={32} color="#4caf50" />
                  <Typography fontSize={13} fontWeight={600} color="#2e7d32" mt={1}>{file.name}</Typography>
                  <Typography fontSize={11} color="#888" mt={0.3}>{(file.size / 1024).toFixed(1)} KB</Typography>
                  <Button
                    size="small"
                    onClick={removeFile}
                    sx={{ mt: 1, textTransform: "none", fontSize: 11, color: "#e53935", minWidth: 0 }}
                  >
                    Remove
                  </Button>
                </>
              ) : (
                <>
                  <FaUpload size={28} color="#bdbdbd" />
                  <Typography fontSize={13} color="#757575" mt={1} fontWeight={500}>
                    Drag & drop or click to select
                  </Typography>
                  <Typography fontSize={11} color="#aaa" mt={0.3}>.xlsx or .xls files only</Typography>
                </>
              )}
            </Box>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files?.[0])} />

            {/* Progress */}
            {loading && (
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography fontSize={12} color="#555">Processing your file…</Typography>
                  <CircularProgress size={14} />
                </Box>
                <LinearProgress sx={{ borderRadius: 4 }} />
              </Box>
            )}

            {/* Results */}
            {result && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>

                {/* All good banner */}
                {allGood && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px" }}>
                    <FaCheckCircle color="#16a34a" size={20} />
                    <Box>
                      <Typography fontSize={13} fontWeight={700} color="#15803d">All rows imported successfully!</Typography>
                      <Typography fontSize={11} color="#166534">{result.successCount} record(s) added with no issues.</Typography>
                    </Box>
                  </Box>
                )}

                {/* Stat row */}
                <Box sx={{ display: "flex", gap: 1 }}>
                  <StatCard value={result.totalRows ?? 0}    label="Total"      bg="#f8fafc" border="#e2e8f0" color="#475569" />
                  <StatCard value={result.successCount ?? 0} label="Imported"   bg="#f0fdf4" border="#bbf7d0" color="#16a34a" />
                  <StatCard value={result.skippedCount ?? 0} label="Skipped"    bg="#fffbeb" border="#fde68a" color="#d97706" />
                  <StatCard value={result.failedCount ?? 0}  label="Failed"     bg="#fef2f2" border="#fecaca" color="#dc2626" />
                </Box>

                {/* Tabs for errors / skipped */}
                {(hasErrors || hasSkipped) && (
                  <Box sx={{ border: "1px solid #e8edf2", borderRadius: "10px", overflow: "hidden" }}>
                    <Tabs
                      value={tab}
                      onChange={(_, v) => setTab(v)}
                      sx={{
                        minHeight: 38,
                        background: "#f8fafc",
                        borderBottom: "1px solid #e8edf2",
                        "& .MuiTab-root": { minHeight: 38, textTransform: "none", fontSize: 12, fontWeight: 600, py: 0 },
                      }}
                    >
                      {hasErrors && (
                        <Tab
                          label={
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                              <FaExclamationCircle color="#dc2626" size={12} />
                              <span style={{ color: "#dc2626" }}>Errors ({result.errors.length})</span>
                            </Box>
                          }
                          value={0}
                        />
                      )}
                      {hasSkipped && (
                        <Tab
                          label={
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                              <MdOutlineSkipNext color="#d97706" size={14} />
                              <span style={{ color: "#d97706" }}>Skipped ({result.skipped.length})</span>
                            </Box>
                          }
                          value={hasErrors ? 1 : 0}
                        />
                      )}
                    </Tabs>

                    <Box sx={{ maxHeight: 220, overflowY: "auto", p: 1 }}>
                      {tab === 0 && hasErrors  && <IssueTable rows={result.errors}  type="error"   />}
                      {tab === (hasErrors ? 1 : 0) && hasSkipped && <IssueTable rows={result.skipped} type="skipped" />}
                    </Box>

                    <Box sx={{ px: 1.5, py: 1, background: "#f8fafc", borderTop: "1px solid #e8edf2" }}>
                      <Typography fontSize={11} color="#888">
                        Fix the highlighted rows in your Excel file and re-upload to import them.
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      {/* ── Footer ── */}
      <DialogActions sx={{ px: 3, py: 1.75, borderTop: "1px solid #f0f0f0", gap: 1 }}>
        <Button onClick={handleClose} sx={{ textTransform: "none", fontSize: 13, color: "#666" }}>
          Close
        </Button>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!file || loading}
          startIcon={loading ? <CircularProgress size={13} color="inherit" /> : <FaUpload size={11} />}
          sx={{ textTransform: "none", fontSize: 13, fontWeight: 600, borderRadius: "8px", px: 2.5, background: "#2e7d32", boxShadow: "none", "&:hover": { background: "#1b5e20", boxShadow: "none" } }}
        >
          {loading ? "Uploading…" : "Upload File"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
