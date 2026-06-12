import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  Box, Button, CircularProgress, Typography, Select, MenuItem,
  Table, TableBody, TableCell, TableHead, TableRow, IconButton, Card,
  Dialog
} from "@mui/material";
import {
  FaCheckCircle, FaDownload, FaExclamationCircle,
  FaExclamationTriangle, FaFileExcel, FaUpload, FaEye, FaHistory,
  FaTrash, FaSyncAlt, FaBoxes, FaChevronRight, FaArrowLeft, FaInfoCircle,
  FaTimes
} from "react-icons/fa";
import toast from "../utils/toast.jsx";
import { bulkUploadExcel, downloadTemplate, getBulkUploadHistory } from "../services/assets_service";
import { bulkUploadUsers, downloadUserTemplate } from "../services/users_service";
import { COLORS, selectSx } from "../theme/tokens";
import TablePagination from "../components/common/TablePagination";
import StatusBadge from "../components/common/StatusBadge";

/* ── Suggestion mapper ── */
function getSuggestion(field, message, mode = "assets") {
  const f = (field || "").toLowerCase();
  const m = (message || "").toLowerCase();
  if (mode === "users") {
    if (f.includes("email") || m.includes("email")) return "Ensure email is valid and unique";
    if (f.includes("role") || m.includes("role")) return "Allowed roles: ADMIN, MANAGER, USER";
    if (f.includes("password") || m.includes("password")) return "Password is required (min 8 chars)";
    if (f.includes("phone") || m.includes("phone")) return "Enter a valid phone number format";
    if (f.includes("employee") || f.includes("id") || m.includes("employee") || m.includes("id")) return "Ensure Employee ID is unique";
    return "Verify input matches user template rules";
  } else {
    if (f.includes("serial") || m.includes("serial")) return "Enter valid serial number";
    if (f.includes("code") || m.includes("code") || f.includes("id") || m.includes("id")) return "Asset ID already exists in the system";
    if (f.includes("date") || m.includes("date")) return "Use format: YYYY-MM-DD";
    if (f.includes("cost") || m.includes("cost") || f.includes("value") || m.includes("value")) return "Enter positive numeric value";
    if (f.includes("status") || m.includes("status")) return "Allowed: AVAILABLE, DAMAGED or UNDER_MAINTENANCE";
    return "Verify input matches template rules";
  }
}



/* ── Date formatter for history logs ── */
const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  } catch {
    return dateStr;
  }
};

const ERR_PAGE_SIZE = 3;

/* ── Columns detected mock data for user interaction ── */
const DETECTED_EXCEL_HEADERS = [
  "assetName*",
  "serialNumber",
  "brand",
  "model",
  "purchaseDate* (YYYY-MM-DD)",
  "warrantyExpiry (YYYY-MM-DD)",
  "cost*",
  "status*",
  "assetCondition",
  "notes",
  "typeName*",
  "locationName*",
  "companyName*"
];

const DETECTED_USER_HEADERS = [
  "userName*",
  "userEmail*",
  "userPassword*",
  "userRole* (ADMIN/MANAGER/USER)",
  "employeeId",
  "department",
  "phoneNumber",
  "designation"
];

/* ── Interactive spreadsheet column details and preview data ── */
const SPREADSHEET_COLUMNS = [
  { index: 0, letter: "A", header: "assetName*", dbLabel: "Asset Name", required: true, sampleRows: ["MacBook Pro M3", "Dell XPS 15", "ThinkPad T14"] },
  { index: 1, letter: "B", header: "serialNumber", dbLabel: "Serial Number", required: false, sampleRows: ["SN-MBP98234", "SN-DELL48281", "SN-TP02938"] },
  { index: 2, letter: "C", header: "brand", dbLabel: "Brand", required: false, sampleRows: ["Apple", "Dell", "Lenovo"] },
  { index: 3, letter: "D", header: "model", dbLabel: "Model", required: false, sampleRows: ["M3 16-inch", "XPS 15", "T14 Gen 4"] },
  { index: 4, letter: "E", header: "purchaseDate* (YYYY-MM-DD)", dbLabel: "Purchase Date", required: true, sampleRows: ["2026-01-20", "2025-11-15", "2026-02-10"] },
  { index: 5, letter: "F", header: "warrantyExpiry (YYYY-MM-DD)", dbLabel: "Warranty Expiry", required: false, sampleRows: ["2028-01-20", "2027-11-15", "2027-02-10"] },
  { index: 6, letter: "G", header: "cost*", dbLabel: "Cost", required: true, sampleRows: ["150000", "120000", "95000"] },
  { index: 7, letter: "H", header: "status*", dbLabel: "Status", required: true, sampleRows: ["AVAILABLE", "AVAILABLE", "UNDER_MAINTENANCE"] },
  { index: 8, letter: "I", header: "assetCondition", dbLabel: "Asset Condition", required: false, sampleRows: ["GOOD", "GOOD", "FAIR"] },
  { index: 9, letter: "J", header: "notes", dbLabel: "Notes", required: false, sampleRows: ["Office laptop", "Manager laptop", "Needs repair"] },
  { index: 10, letter: "K", header: "typeName*", dbLabel: "Asset Type", required: true, sampleRows: ["IT", "IT", "IT"] },
  { index: 11, letter: "L", header: "locationName*", dbLabel: "Location", required: true, sampleRows: ["Office Room 1", "Conference Room", "IT Support Lab"] },
  { index: 12, letter: "M", header: "companyName*", dbLabel: "Company Entity", required: true, sampleRows: ["HEPL", "HEPL", "HEPL"] }
];

const USER_SPREADSHEET_COLUMNS = [
  { index: 0, letter: "A", header: "userName*", dbLabel: "User Name", required: true, sampleRows: ["John Doe", "Jane Smith", "Alice Johnson"] },
  { index: 1, letter: "B", header: "userEmail*", dbLabel: "User Email", required: true, sampleRows: ["john@example.com", "jane@example.com", "alice@example.com"] },
  { index: 2, letter: "C", header: "userPassword*", dbLabel: "Password", required: true, sampleRows: ["Pass@123", "Secure!45", "AlicePass9"] },
  { index: 3, letter: "D", header: "userRole* (ADMIN/MANAGER/USER)", dbLabel: "User Role", required: true, sampleRows: ["ADMIN", "MANAGER", "USER"] },
  { index: 4, letter: "E", header: "employeeId", dbLabel: "Employee ID", required: false, sampleRows: ["EMP-0012", "EMP-0013", "EMP-0014"] },
  { index: 5, letter: "F", header: "department", dbLabel: "Department", required: false, sampleRows: ["Engineering", "HR", "Sales"] },
  { index: 6, letter: "G", header: "phoneNumber", dbLabel: "Phone Number", required: false, sampleRows: ["9876543210", "9876543211", "9876543212"] },
  { index: 7, letter: "H", header: "designation", dbLabel: "Designation", required: false, sampleRows: ["Software Engineer", "HR Specialist", "Account Manager"] }
];

export default function BulkUploadPage({ mode = "assets" }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const columns = mode === "users" ? USER_SPREADSHEET_COLUMNS : SPREADSHEET_COLUMNS;

  const [wizardStep, setWizardStep] = useState(1);
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [parsedHeaders, setParsedHeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [filterType, setFilterType] = useState("errors");
  const [errPage, setErrPage] = useState(0);
  const [showAdvancedMapping, setShowAdvancedMapping] = useState(false);

  /* ── Upload History States ── */
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [uploadHistory, setUploadHistory] = useState([]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await getBulkUploadHistory();
      setUploadHistory(data || []);
    } catch (e) {
      toast.error("Failed to load upload history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenHistory = () => {
    setHistoryOpen(true);
    fetchHistory();
  };

  /* ── Interactive Mapping States ── */
  const [columnMapping, setColumnMapping] = useState(() =>
    mode === "users"
      ? {
          userName: "userName*",
          userEmail: "userEmail*",
          userPassword: "userPassword*",
          userRole: "userRole* (ADMIN/MANAGER/USER)",
          employeeId: "employeeId",
          department: "department",
          phoneNumber: "phoneNumber",
          designation: "designation"
        }
      : {
          name: "assetName*",
          serial: "serialNumber",
          brand: "brand",
          model: "model",
          purchaseDate: "purchaseDate* (YYYY-MM-DD)",
          warrantyExpiry: "warrantyExpiry (YYYY-MM-DD)",
          cost: "cost*",
          status: "status*",
          condition: "assetCondition",
          notes: "notes",
          typeName: "typeName*",
          locationName: "locationName*",
          companyName: "companyName*"
        }
  );

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.match(/\.(xlsx|xls)$/i)) {
      toast.error("Please select an Excel file (.xlsx or .xls)");
      return;
    }
    setFile(f);
    setResult(null);
    setErrPage(0);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (json.length > 0) {
          setParsedHeaders(json[0] || []);
          setParsedRows(json.slice(1) || []);
        } else {
          setParsedHeaders([]);
          setParsedRows([]);
        }
      } catch (err) {
        toast.error("Failed to parse Excel file for preview");
      }
    };
    reader.readAsArrayBuffer(f);

    // Proceed to Step 2 automatically once a file is selected
    setWizardStep(2);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const startValidation = async () => {
    if (!file) return;
    setValidating(true);
    setWizardStep(3);
    try {
      setLoading(true);
      // Simulate real-time parsing
      await new Promise(resolve => setTimeout(resolve, 1000));
      const res = mode === "users" ? await bulkUploadUsers(file) : await bulkUploadExcel(file);
      const data = res?.data ?? res;
      setResult(data);
      setErrPage(0);
      const count = data?.successCount ?? 0;
      if (count > 0) {
        toast.success(`${count} row(s) parsed and ready to import`);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Bulk upload failed");
      // Fallback back to mapping step if error happens
      setWizardStep(2);
    } finally {
      setLoading(false);
      setValidating(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      if (mode === "users") {
        await downloadUserTemplate();
      } else {
        await downloadTemplate();
      }
      toast.success("Template downloaded successfully");
    } catch {
      toast.error("Failed to download template");
    }
  };

  const removeFile = () => {
    setFile(null);
    setResult(null);
    setErrPage(0);
    setParsedRows([]);
    setParsedHeaders([]);
    setWizardStep(1);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
    <Box sx={{ p: 0 }}>
      {/* ── Breadcrumbs ── */}
      <Box sx={{ px: 2.5, pt: 2 }}>
        <Typography fontSize={10.5} color="#64748b" sx={{ display: "flex", gap: 0.5, alignItems: "center", mb: 0.5 }}>
          <span>Dashboard</span>
          <span>&gt;</span>
          <span>{mode === "users" ? "Users" : "Assets"}</span>
          <span>&gt;</span>
          <span style={{ fontWeight: 600, color: "#1e293b" }}>Bulk Upload</span>
        </Typography>
      </Box>

      {/* ── Top Header ── */}
      <Box sx={{ background: "#fff", borderBottom: `1px solid #e2e8f0`, px: 2.5, py: 1.75, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 38, height: 38, borderRadius: "8px", background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #c8e6c9" }}>
            <FaFileExcel color="#2e7d32" size={20} />
          </Box>
          <Box>
            <Typography fontWeight={800} fontSize={16} color="#0f172a">Bulk Upload {mode === "users" ? "Users" : "Assets"}</Typography>
            <Typography fontSize={11} color="#64748b">Import bulk data sheets into the {mode === "users" ? "User Management" : "Asset Management"} system.</Typography>
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
              fontSize: 11,
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
          {mode !== "users" && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<FaHistory size={11} />}
              onClick={handleOpenHistory}
              sx={{
                textTransform: "none",
                fontSize: 11,
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
          )}
        </Box>
      </Box>

      {/* Stepper Header Block */}
      <Box sx={{ display: "flex", justifyContent: "center", pt: 3.5, pb: 1, px: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", maxWidth: 640, flexWrap: "wrap", gap: { xs: 1, sm: 2 } }}>
          {/* Step 1 */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{
              width: 24, height: 24, borderRadius: "50%",
              background: wizardStep >= 1 ? COLORS.primary : "#e2e8f0",
              color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10.5, fontWeight: 700,
              boxShadow: wizardStep === 1 ? `0 0 0 3px rgba(37,99,235,0.18)` : "none"
            }}>{wizardStep > 1 ? <FaCheckCircle size={11} /> : "1"}</Box>
            <Typography sx={{ fontSize: 11.5, fontWeight: wizardStep === 1 ? 700 : 500, color: wizardStep === 1 ? "#0f172a" : "#64748b" }}>Upload Sheet</Typography>
          </Box>

          {/* Line */}
          <Box sx={{ flexGrow: 1, maxWidth: 100, minWidth: 20, height: 2, background: wizardStep >= 2 ? COLORS.primary : "#e2e8f0" }} />

          {/* Step 2 */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{
              width: 24, height: 24, borderRadius: "50%",
              background: wizardStep >= 2 ? COLORS.primary : "#e2e8f0",
              color: wizardStep >= 2 ? "#fff" : "#64748b",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10.5, fontWeight: 700,
              boxShadow: wizardStep === 2 ? `0 0 0 3px rgba(37,99,235,0.18)` : "none"
            }}>{wizardStep > 2 ? <FaCheckCircle size={11} /> : "2"}</Box>
            <Typography sx={{ fontSize: 11.5, fontWeight: wizardStep === 2 ? 700 : 500, color: wizardStep === 2 ? "#0f172a" : "#64748b" }}>Map Columns</Typography>
          </Box>

          {/* Line */}
          <Box sx={{ flexGrow: 1, maxWidth: 100, minWidth: 20, height: 2, background: wizardStep >= 3 ? COLORS.primary : "#e2e8f0" }} />

          {/* Step 3 */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{
              width: 24, height: 24, borderRadius: "50%",
              background: wizardStep >= 3 ? COLORS.primary : "#e2e8f0",
              color: wizardStep >= 3 ? "#fff" : "#64748b",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10.5, fontWeight: 700,
              boxShadow: wizardStep === 3 ? `0 0 0 3px rgba(37,99,235,0.18)` : "none"
            }}>3</Box>
            <Typography sx={{ fontSize: 11.5, fontWeight: wizardStep === 3 ? 700 : 500, color: wizardStep === 3 ? "#0f172a" : "#64748b" }}>Validate & Import</Typography>
          </Box>
        </Box>
      </Box>

      {/* ── Main Body Panel ── */}
      <Box sx={{ p: 2.5, display: "flex", justifyContent: "center" }}>
        <Box sx={{ width: "100%", maxWidth: 960 }}>

          {/* ────────────────── STEP 1: FILE SELECTION ────────────────── */}
          {wizardStep === 1 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
              <Card
                variant="outlined"
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  background: dragOver ? "rgba(37, 99, 235, 0.03)" : "#f8fafc",
                  border: `2px dashed ${dragOver ? COLORS.primary : "#cbd5e1"}`,
                  borderRadius: "12px",
                  p: "3.5rem 1rem",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": { borderColor: COLORS.primary, background: "#f1f7fe" },
                }}
              >
                <Box sx={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: "rgba(37, 99, 235, 0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  mx: "auto", mb: 2,
                }}>
                  <FaUpload size={18} color={COLORS.primary} />
                </Box>
                <Typography fontSize={14.5} fontWeight={800} color="#1e293b">
                  Drag & drop your Excel sheet here
                </Typography>
                <Typography fontSize={11} color="#64748b" mt={0.5}>
                  or click to browse local files
                </Typography>
                <Typography fontSize={9.5} color="#94a3b8" mt={1.5} sx={{ letterSpacing: 0.2 }}>
                  Supports: .xlsx, .xls (Max 10MB)
                </Typography>
              </Card>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files?.[0])} />

              {/* Informative Guidance Card */}
              <Box sx={{ display: "flex", gap: 1.5, p: 2, borderRadius: "8px", border: "1px solid #bfdbfe", background: "#f0f9ff" }}>
                <FaInfoCircle size={15} color="#0284c7" style={{ marginTop: 2.5, flexShrink: 0 }} />
                <Box>
                  <Typography fontSize={11.5} fontWeight={700} color="#0369a1">Tips for a seamless bulk import</Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2, mt: 0.75, fontSize: 10.5, color: "#0284c7", lineHeight: 1.5 }}>
                    <li>Download the Excel template using the <strong>Download Template</strong> button above.</li>
                    <li>Keep the column structure and headers in their original order.</li>
                    <li>
                      <strong>Start data from Row 5:</strong> Please input your actual records starting from <strong>Row 5</strong> onwards. Keep the first 4 rows (headers, requirements, and sample data) untouched, as the importer automatically skips them.
                    </li>
                    <li>Ensure essential fields ({mode === "users" ? "User Name, User Email, Password, User Role" : "Asset Name, Purchase Date, Cost, Status, Type, Location, Company"}) are properly filled to pass validation checks.</li>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}

          {/* ────────────────── STEP 2: COLUMN MAPPING ────────────────── */}
          {wizardStep === 2 && file && (
            <Card variant="outlined" sx={{ borderRadius: "12px", background: "#fff", overflow: "hidden" }}>
              <Box sx={{ p: 2, borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
                <Box>
                  <Typography fontSize={13.5} fontWeight={800} color="#0f172a">Map Sheet Columns</Typography>
                  <Typography fontSize={11} color="#64748b">Map the headers from <span style={{ fontWeight: 600 }}>{file.name}</span> to the AMS database fields.</Typography>
                </Box>
                <Button size="small" variant="text" color="error" startIcon={<FaTrash size={10} />} onClick={removeFile} sx={{ fontSize: 11, textTransform: "none", fontWeight: 600 }}>
                  Cancel
                </Button>
              </Box>

              <Box sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", gap: 1.5, p: 2, borderRadius: "8px", border: "1px solid #bfdbfe", background: "#f0f9ff", mb: 3 }}>
                  <FaInfoCircle size={15} color="#0284c7" style={{ marginTop: 2, flexShrink: 0 }} />
                  <Box>
                    <Typography fontSize={11.5} fontWeight={700} color="#0369a1">Spreadsheet Column Mapping & Data Preview</Typography>
                    <Typography fontSize={10.5} color="#0284c7" mt={0.5} lineHeight={1.4}>
                      Below is a live preview of the first few rows of <strong>{file.name}</strong>. The columns in your sheet are mapped automatically to the database fields shown below. Required database fields are marked with an asterisk (*).
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ overflowX: "auto", border: "1px solid #cbd5e1", borderRadius: "8px", background: "#f8fafc" }}>
                  <Table sx={{ minWidth: 1600, borderCollapse: "collapse", "& td, & th": { border: "1px solid #e2e8f0", p: 1 } }}>
                    <TableHead>
                      {/* Row 1: Column Letters */}
                      <TableRow sx={{ background: "#f1f5f9" }}>
                        <TableCell sx={{ width: 90, fontWeight: 700, color: "#64748b", fontSize: 9.5, textAlign: "center", py: 0.5, px: 1, background: "#cbd5e1", borderRight: "2px solid #cbd5e1" }}>
                          COLUMN
                        </TableCell>
                        {columns.map((col) => (
                          <TableCell key={col.index} sx={{ fontWeight: 800, color: "#475569", fontSize: 10.5, textAlign: "center", py: 0.5, background: "#e2e8f0" }}>
                            {col.letter}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Row 2: Database Field Mapping (Static Labels) */}
                      <TableRow sx={{ background: "#fff" }}>
                        <TableCell sx={{ fontWeight: 800, color: "#0f172a", fontSize: 10, textAlign: "center", py: 1.5, px: 1, background: "#f1f5f9", borderRight: "2px solid #cbd5e1" }}>
                          MAP TO FIELD
                        </TableCell>
                        {columns.map((col) => (
                          <TableCell key={col.index} sx={{ py: 1.5, px: 1.5, background: "#fff" }}>
                            {col.required ? (
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <FaCheckCircle size={12} color="#16a34a" />
                                <Typography fontSize={11.5} fontWeight={800} color="#15803d">
                                  {col.dbLabel} <span style={{ color: "#ef4444" }}>*</span>
                                </Typography>
                              </Box>
                            ) : (
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: "#94a3b8" }} />
                                <Typography fontSize={11.5} fontWeight={700} color="#475569">
                                  {col.dbLabel}
                                </Typography>
                              </Box>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Row 3: Excel Headers */}
                      <TableRow sx={{ background: "#f8fafc" }}>
                        <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: 9.5, textAlign: "center", py: 1.25, px: 1, background: "#f1f5f9", borderRight: "2px solid #cbd5e1" }}>
                          Header (Row 4)
                        </TableCell>
                        {columns.map((col) => (
                          <TableCell key={col.index} sx={{ py: 1.25, px: 1.5, background: "#f8fafc" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <FaFileExcel size={10} color="#16a34a" />
                                <Typography fontSize={11.5} fontWeight={700} color="#1e293b" fontFamily="monospace">
                                  {parsedHeaders[col.index] || col.header}
                                </Typography>
                            </Box>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {parsedRows.slice(0, 5).map((row, rIdx) => (
                        <TableRow key={rIdx} sx={{ background: "#fff", "&:hover": { background: "#fafafa" } }}>
                          <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: 9.5, textAlign: "center", py: 1, px: 1, background: "#f1f5f9", borderRight: "2px solid #cbd5e1" }}>
                            Row {rIdx + 5}
                          </TableCell>
                          {columns.map((col) => {
                            const val = row[col.index];
                            return (
                              <TableCell key={col.index} sx={{ py: 1, px: 1.5, fontSize: 11, color: "#475569", fontFamily: "monospace" }}>
                                {val !== undefined && val !== null ? String(val) : "—"}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                      {parsedRows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={columns.length + 1} sx={{ textAlign: "center", py: 3, fontSize: 12, color: "#64748b" }}>
                            No data rows found in sheet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Box>
              </Box>

              <Box sx={{ p: 2, background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FaArrowLeft size={10} />}
                  onClick={() => setWizardStep(1)}
                  sx={{ textTransform: "none", fontSize: 11, fontWeight: 600, borderColor: "#cbd5e1", color: "#475569", borderRadius: "6px" }}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  endIcon={<FaChevronRight size={10} />}
                  onClick={startValidation}
                  sx={{ textTransform: "none", fontSize: 11, fontWeight: 600, borderRadius: "6px", background: COLORS.primary, boxShadow: "none", "&:hover": { background: COLORS.primaryDark } }}
                >
                  Confirm & Validate
                </Button>
              </Box>
            </Card>
          )}

          {/* ────────────────── STEP 3: VALIDATE & IMPORT ────────────────── */}
          {wizardStep === 3 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
              {validating ? (
                <Card variant="outlined" sx={{ p: 6, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, borderRadius: "12px" }}>
                  <CircularProgress size={32} thickness={4.5} sx={{ color: COLORS.primary }} />
                  <Box sx={{ textAlign: "center" }}>
                    <Typography fontSize={13.5} fontWeight={800} color="#1e293b">Running validation checks...</Typography>
                    <Typography fontSize={11} color="#64748b" mt={0.5}>Parsing your {mode === "users" ? "user" : "asset"} sheet rows for format, duplicates, and errors.</Typography>
                  </Box>
                </Card>
              ) : (
                <>
                  {/* Results Dashboard Overview */}
                  <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", width: "100%" }}>
                    {[
                      { val: result ? (result.totalRows ?? 0) : "0", lab: "Total Records", bg: "#eff6ff", color: "#2563eb", icon: <FaBoxes size={14} color="#2563eb" /> },
                      { val: result ? (result.successCount ?? 0) : "0", lab: "Valid Rows", bg: "#f0fdf4", color: "#16a34a", icon: <FaCheckCircle size={14} color="#16a34a" /> },
                      { val: result ? (result.failedCount ?? 0) : "0", lab: "Formatting Errors", bg: "#fef2f2", color: "#dc2626", icon: <FaExclamationCircle size={14} color="#dc2626" /> },
                      { val: result ? (result.skippedCount ?? 0) : "0", lab: "Skipped Duplicates", bg: "#fffbeb", color: "#d97706", icon: <FaExclamationTriangle size={13} color="#d97706" /> }
                    ].map((item, idx) => (
                      <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderRadius: "8px", background: "#fff", border: "1px solid #e2e8f0", flex: 1, minWidth: 160 }}>
                        <Box sx={{ width: 34, height: 34, borderRadius: "6px", background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {item.icon}
                        </Box>
                        <Box>
                          <Typography fontSize={9.5} fontWeight={600} color="#64748b" textTransform="uppercase" letterSpacing={0.2}>{item.lab}</Typography>
                          <Typography fontSize={19} fontWeight={800} color="#0f172a" mt={0.25} sx={{ lineHeight: 1 }}>{item.val}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  {/* Errors Grid (If exists) */}
                  {result && (result.errors?.length > 0 || result.skipped?.length > 0) && (
                    <Card variant="outlined" sx={{ borderRadius: "12px", overflow: "hidden", background: "#fff" }}>
                      <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5 }}>
                        <Typography fontSize={13} fontWeight={800} color="#dc2626">
                          Validation Failures ({filterType === "errors" ? result.errors?.length ?? 0 : result.skipped?.length ?? 0} found)
                        </Typography>

                        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                          <Select
                            size="small"
                            value={filterType}
                            onChange={(e) => { setFilterType(e.target.value); setErrPage(0); }}
                            sx={{ ...selectSx, minWidth: 110, height: 28, fontSize: "11px" }}
                          >
                            <MenuItem value="errors" sx={{ fontSize: "11px" }}>Errors</MenuItem>
                            <MenuItem value="duplicates" sx={{ fontSize: "11px" }}>Duplicates</MenuItem>
                          </Select>
                        </Box>
                      </Box>

                      <Box sx={{ overflowX: "auto" }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ background: "#f8fafc" }}>
                              {["Row No.", mode === "users" ? "User Name" : "Asset Name", "Identifier/Field", "Issue Description", "Fix Suggestion"].map((h) => (
                                <TableCell key={h} sx={{ fontWeight: 700, color: "#64748b", fontSize: 10.5, borderBottom: "1px solid #e2e8f0", py: 1 }}>
                                  {h}
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {getCurrentErrRows().map((item, idx) => (
                              <TableRow key={idx} sx={{ "&:hover": { background: "#fafafa" } }}>
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
                                <TableCell sx={{ py: 1, fontSize: 11.5, fontWeight: 700, color: "#334155" }}>
                                  {item.userName || item.assetName || "—"}
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
                                      fontWeight: 600,
                                    }}
                                  >
                                    {item.message || "—"}
                                  </Box>
                                </TableCell>
                                <TableCell sx={{ py: 1, fontSize: 11, color: "#475569" }}>
                                  {getSuggestion(item.field || "", item.message || "", mode)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Box>

                      {/* Paginate validation warnings */}
                      <TablePagination page={errPage} totalPages={totalErrPages} onPageChange={(pg) => setErrPage(pg)} />
                    </Card>
                  )}

                  {/* Ready to Import Actions */}
                  {result && (
                    <Card
                      variant="outlined"
                      sx={{
                        borderRadius: "12px",
                        p: 2,
                        background: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 2.5,
                      }}
                    >
                      <Box sx={{ minWidth: 220 }}>
                        <Typography fontSize={13} fontWeight={800} color="#1e293b">
                          Import Ready
                        </Typography>
                        <Typography fontSize={10.5} color="#64748b" mt={0.25}>
                          {result.successCount} valid {mode === "users" ? "users" : "assets"} are prepared to import.
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, maxWidth: 300, minWidth: 160 }}>
                        <Box sx={{ width: 1, height: 6, background: "#e2e8f0", borderRadius: "3px", overflow: "hidden", position: "relative" }}>
                          <Box
                            sx={{
                              position: "absolute",
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: `${Math.round((result.successCount / (result.totalRows || 1)) * 100)}%`,
                              background: result.successCount > 0 ? "#16a34a" : "#cbd5e1",
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
                            fontSize: 11,
                            fontWeight: 600,
                            borderColor: "#cbd5e1",
                            color: "#475569",
                            borderRadius: "6px",
                            py: 0.5,
                            px: 2,
                            height: 30,
                            "&:hover": { borderColor: "#94a3b8", background: "#f8fafc" }
                          }}
                        >
                          Reset Upload
                        </Button>
                        <Button
                          variant="contained"
                          disabled={!result.successCount}
                          onClick={() => {
                            toast.success(`${result.successCount} ${mode === "users" ? "users" : "assets"} imported successfully!`);
                            navigate(mode === "users" ? "/home/users" : "/home/assets");
                          }}
                          startIcon={<FaCheckCircle size={10} />}
                          sx={{
                            textTransform: "none",
                            fontSize: 11,
                            fontWeight: 600,
                            borderRadius: "6px",
                            py: 0.5,
                            px: 2.5,
                            background: "#16a34a",
                            boxShadow: "none",
                            height: 30,
                            "&:hover": { background: "#15803d", boxShadow: "none" }
                          }}
                        >
                          Import Valid {mode === "users" ? "Users" : "Assets"}
                        </Button>
                      </Box>
                    </Card>
                  )}
                </>
              )}
            </Box>
          )}

        </Box>
      </Box>

      {/* ── UPLOAD HISTORY MODAL ── */}
      <Dialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "12px",
            background: "#fff",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }
        }}
      >
        <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: "6px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0" }}>
              <FaHistory color="#475569" size={14} />
            </Box>
            <Box>
              <Typography fontWeight={800} fontSize={14.5} color="#0f172a">Bulk Upload History</Typography>
              <Typography fontSize={10.5} color="#64748b">Logs of previous Excel sheets imported into the system.</Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton size="small" onClick={fetchHistory} disabled={historyLoading} sx={{ border: "1px solid #e2e8f0", borderRadius: "6px", p: 0.75 }}>
              <FaSyncAlt size={10} className={historyLoading ? "fa-spin" : ""} />
            </IconButton>
            <IconButton size="small" onClick={() => setHistoryOpen(false)} sx={{ border: "1px solid #e2e8f0", borderRadius: "6px", p: 0.75 }}>
              <FaTimes size={10} />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ p: 2.5, maxHeight: "60vh", overflowY: "auto" }}>
          {historyLoading ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 6, gap: 1.5 }}>
              <CircularProgress size={28} thickness={4.5} sx={{ color: COLORS.primary }} />
              <Typography fontSize={11} color="#64748b">Loading history records...</Typography>
            </Box>
          ) : uploadHistory.length === 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8, gap: 1.5 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: "50%", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0" }}>
                <FaHistory size={16} color="#94a3b8" />
              </Box>
              <Typography fontSize={12} fontWeight={700} color="#64748b">No upload logs found</Typography>
              <Typography fontSize={10} color="#94a3b8">Your bulk Excel imports will be logged here.</Typography>
            </Box>
          ) : (
            <Box sx={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ background: "#f8fafc" }}>
                    <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: 10.5, py: 1 }}>Date & Time</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: 10.5, py: 1 }}>File Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: 10.5, py: 1 }}>Uploaded By</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: 10.5, py: 1 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: 10.5, py: 1, textAlign: "right" }}>Stats</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {uploadHistory.map((item) => (
                    <TableRow key={item.uploadId} sx={{ "&:hover": { background: "#fafafa" } }}>
                      <TableCell sx={{ py: 1.25, fontSize: 11, color: "#334155", fontWeight: 600 }}>
                        {formatDate(item.uploadedAt)}
                      </TableCell>
                      <TableCell sx={{ py: 1.25, fontSize: 11, color: "#334155", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <FaFileExcel color="#2e7d32" size={10} />
                          {item.fileName}
                        </span>
                      </TableCell>
                      <TableCell sx={{ py: 1.25, fontSize: 11, color: "#64748b" }}>
                        {item.uploadedBy || "System"}
                      </TableCell>
                      <TableCell sx={{ py: 1.25 }}>
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell sx={{ py: 1.25, textAlign: "right" }}>
                        <Box sx={{ display: "inline-flex", gap: 1.5, alignItems: "center" }}>
                          <Box sx={{ display: "inline-flex", alignItems: "center", background: "#f8fafc", border: "1px solid #e2e8f0", px: 0.75, py: 0.25, borderRadius: "4px" }}>
                            <Typography fontSize={9.5} color="#475569" fontWeight={700}>
                              Total: {item.totalRows ?? 0}
                            </Typography>
                          </Box>
                          <Box sx={{ display: "inline-flex", alignItems: "center", background: "#f0fdf4", border: "1px solid #bbf7d0", px: 0.75, py: 0.25, borderRadius: "4px" }}>
                            <Typography fontSize={9.5} color="#16a34a" fontWeight={700}>
                              ✓ {item.successCount ?? 0}
                            </Typography>
                          </Box>
                          {(item.failedCount ?? 0) > 0 && (
                            <Box sx={{ display: "inline-flex", alignItems: "center", background: "#fef2f2", border: "1px solid #fecaca", px: 0.75, py: 0.25, borderRadius: "4px" }}>
                              <Typography fontSize={9.5} color="#dc2626" fontWeight={700}>
                                ✗ {item.failedCount}
                              </Typography>
                            </Box>
                          )}
                          {(item.skippedCount ?? 0) > 0 && (
                            <Box sx={{ display: "inline-flex", alignItems: "center", background: "#fffbeb", border: "1px solid #fef3c7", px: 0.75, py: 0.25, borderRadius: "4px" }}>
                              <Typography fontSize={9.5} color="#d97706" fontWeight={700}>
                                ⚠ {item.skippedCount}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </Box>

        <Box sx={{ p: 2, background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end" }}>
          <Button variant="outlined" size="small" onClick={() => setHistoryOpen(false)} sx={{ textTransform: "none", fontSize: 11, fontWeight: 600, borderColor: "#cbd5e1", color: "#475569", borderRadius: "6px" }}>
            Close
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}
