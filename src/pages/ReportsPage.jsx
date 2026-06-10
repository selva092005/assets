import { useEffect, useState } from "react";
import {
  Box, CircularProgress, Grid, Typography, Button, Paper
} from "@mui/material";
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, ResponsiveContainer, Legend, LabelList
} from "recharts";
import {
  FaBoxes, FaCheckCircle, FaExchangeAlt, FaRecycle, FaClock, FaChartPie,
  FaFileExcel, FaDownload, FaUsers, FaArrowDown, FaCalendarAlt, FaBuilding,
  FaMapMarkerAlt, FaLaptop, FaLock
} from "react-icons/fa";
import toast from "../utils/toast.jsx";
import PageHeader from "../components/common/PageHeader";
import PremiumCard from "../components/common/PremiumCard";
import StatCard from "../components/common/StatCard";
import { getFullReport, exportAllocations, exportTransfers, exportDisposals } from "../services/report_service";
import { exportAssets } from "../services/assets_service";
import { exportUsers } from "../services/users_service";
import { COLORS } from "../theme/tokens";
import CustomTooltip from "../components/common/CustomTooltip";

// Custom Premium Colors
const CHART_COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#ec4899"];

function mapToChartData(obj) {
  if (!obj) return [];
  return Object.entries(obj).map(([name, value]) => ({ name, value: Number(value) }));
}



// Custom Compact Legend
const CustomPieLegend = ({ data, colors }) => {
  return (
    <Box sx={{
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 1.5,
      mt: 1.5,
      px: 0.5
    }}>
      {data.map((item, index) => (
        <Box key={item.name} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Box sx={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: colors[index % colors.length]
          }} />
          <Typography sx={{ fontSize: "10px", fontWeight: 600, color: "#64748b" }}>
            {item.name} ({item.value})
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

// Realistic high-end mock report data for fully-populated demo view
const MOCK_REPORT_DATA = {
  totalAssets: 184,
  availableAssets: 42,
  assignedAssets: 128,
  disposedAssets: 6,
  damagedAssets: 4,
  underMaintenanceAssets: 4,

  byType: {
    "Laptops": 78,
    "Monitors": 45,
    "Phones": 34,
    "Tablets": 18,
    "Printers": 9
  },
  byLocation: {
    "Bangalore HQ": 62,
    "Mumbai Office": 48,
    "Chennai Branch": 35,
    "Delhi Hub": 28,
    "Remote": 11
  },
  byCompany: {
    "TechCorp Solutions": 94,
    "InnoSystems Ltd": 58,
    "Global Retail": 32
  },

  totalAllocations: 142,
  activeAllocations: 98,
  returnedAllocations: 38,
  overdueAllocations: 6,

  totalTransfers: 56,
  pendingTransfers: 8,
  approvedTransfers: 42,
  rejectedTransfers: 6,

  totalDisposals: 12,
  disposalsByMethod: {
    "Recycled": 6,
    "Sold": 4,
    "Scrapped": 2
  }
};

export default function ReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState({});
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getFullReport();
        const data = res?.data ?? res;

        // If data is completely empty (no assets loaded yet)
        if (!data || (!data.totalAssets && !data.totalAllocations && !data.totalTransfers)) {
          setReport(MOCK_REPORT_DATA);
          setIsDemoMode(true);
        } else {
          setReport(data);
          setIsDemoMode(false);
        }
      } catch {
        setReport(MOCK_REPORT_DATA);
        setIsDemoMode(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDownload = async (type, exportFn, filename) => {
    setDownloading(prev => ({ ...prev, [type]: true }));
    const id = toast.loading(`Preparing ${filename}...`);
    try {
      await exportFn();
      toast.success(`${filename} downloaded successfully!`, { id });
    } catch (err) {
      toast.error(`Failed to download ${filename}.`, { id });
    } finally {
      setDownloading(prev => ({ ...prev, [type]: false }));
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress size={24} sx={{ color: "#3b82f6" }} />
      </Box>
    );
  }

  const d = report ?? {};
  const byType = mapToChartData(d.byType);
  const byLocation = mapToChartData(d.byLocation);
  const byCompany = mapToChartData(d.byCompany);
  const byMethod = mapToChartData(d.disposalsByMethod);

  const downloadReports = [
    { type: "assets", label: "Asset Registry", desc: "Inventory list.", fn: exportAssets, filename: "Asset Registry" },
    { type: "users", label: "User Directory", desc: "System user profiles.", fn: exportUsers, filename: "User Directory" },
    { type: "allocations", label: "Allocations List", desc: "Active/overdue traces.", fn: exportAllocations, filename: "Allocation Registry" },
    { type: "transfers", label: "Transfers Ledger", desc: "Logistics and movements.", fn: exportTransfers, filename: "Transfer Ledger" },
    { type: "disposals", label: "Disposals Archive", desc: "Retired and sold hardware.", fn: exportDisposals, filename: "Disposal Archive" },
  ];

  return (
    <Box sx={{ p: 0, pb: 2 }}>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Aggregated system telemetry and premium exports hub"
      />

      {/* ── Compact Interactive Download Center ──────────────────────────────── */}
      <Paper elevation={0} sx={{
        background: "linear-gradient(135deg, #ffffff, #fcfdff)",
        borderRadius: "12px",
        border: "1px solid #f1f5f9",
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
        p: 1.5,
        mb: 2.5
      }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, pb: 1, borderBottom: "1px solid #f1f5f9" }}>
          <Box>
            <Typography sx={{ fontSize: "11.5px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 0.75 }}>
              <FaFileExcel style={{ color: "#10b981", fontSize: 12 }} /> Report Export Hub
            </Typography>
            <Typography sx={{ fontSize: "9.5px", color: "#64748b", mt: 0.25 }}>
              Select a module ledger to export full real-time database registers to Excel sheets.
            </Typography>
          </Box>
          {isDemoMode ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, bgcolor: "#fff7ed", color: "#ea580c", px: 1, py: 0.25, borderRadius: "10px", border: "1px solid #ffedd5" }}>
              <FaChartPie size={8} />
              <Typography sx={{ fontSize: "8px", fontWeight: 800, textTransform: "uppercase" }}>Demo Mode</Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, bgcolor: "#ecfdf5", color: "#10b981", px: 1, py: 0.25, borderRadius: "10px" }}>
              <FaCheckCircle size={8} />
              <Typography sx={{ fontSize: "8px", fontWeight: 700, textTransform: "uppercase" }}>Synced</Typography>
            </Box>
          )}
        </Box>

        {/* Dense CSS Grid for Report Cards */}
        <Box sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(3, 1fr)",
            md: "repeat(5, 1fr)"
          },
          gap: 2
        }}>
          {downloadReports.map((r) => (
            <Box key={r.type} sx={{
              background: "#ffffff",
              borderRadius: "8px",
              border: "1px solid #f1f5f9",
              p: "10px 12px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: 86,
              transition: "all 150ms ease",
              "&:hover": {
                borderColor: "#3b82f633",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.02)"
              }
            }}>
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
                  <Typography sx={{ fontSize: "10.5px", fontWeight: 800, color: "#0f172a" }}>{r.label}</Typography>
                  <Box sx={{ bgcolor: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b", fontSize: "7.5px", fontWeight: 700, px: 0.75, py: 0.1, borderRadius: "3px" }}>
                    XLSX
                  </Box>
                </Box>
                <Typography sx={{ fontSize: "9px", color: "#64748b", lineHeight: 1.2 }}>{r.desc}</Typography>
              </Box>

              <Button
                variant="contained"
                disableElevation
                onClick={() => handleDownload(r.type, r.fn, r.filename)}
                disabled={downloading[r.type]}
                startIcon={downloading[r.type] ? <CircularProgress size={8} color="inherit" /> : <FaDownload size={8} />}
                sx={{
                  mt: 0.5,
                  textTransform: "none",
                  fontSize: "9px",
                  fontWeight: 700,
                  py: "4px",
                  borderRadius: "4px",
                  background: "#10b981",
                  color: "#ffffff",
                  "&:hover": { background: "#059669" },
                  "&.Mui-disabled": { background: "#f1f5f9", color: "#94a3b8" }
                }}
              >
                {downloading[r.type] ? "Building..." : "Export"}
              </Button>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* ── Compact Stat KPI Row ────────────────────────────────────────────── */}
      <Box sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, minmax(0, 1fr))",
          sm: "repeat(3, minmax(0, 1fr))",
          md: "repeat(5, minmax(0, 1fr))"
        },
        gap: 2,
        mb: 2.5
      }}>
        {[
          { label: "Total Assets", value: d.totalAssets, icon: <FaBoxes />, iconBg: "#e8eaf6", iconColor: "#3949ab" },
          { label: "Available", value: d.available, icon: <FaCheckCircle />, iconBg: "#ecfdf5", iconColor: "#10b981" },
          { label: "Assigned", value: d.assigned, icon: <FaBoxes />, iconBg: "#eff6ff", iconColor: "#2563eb" },
          { label: "Disposed", value: d.disposed, icon: <FaRecycle />, iconBg: "#f1f5f9", iconColor: "#64748b" },
          { label: "Under Maintenance", value: d.underMaintenance, icon: <FaClock />, iconBg: "#fffbeb", iconColor: "#d97706" },
        ].map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </Box>

      {/* ── Section: Distribution charts (Highly space-efficient CSS Grid) ──── */}
      <Box sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          md: "repeat(3, 1fr)"
        },
        gap: 2,
        mb: 2.5
      }}>
        {/* By Type — Compact Donut */}
        <PremiumCard
          title="Assets by Type"
          subtitle="Category breakdowns"
          icon={<FaLaptop />}
        >
          <Box sx={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "center" }}>
            <Box sx={{ position: "relative", width: "100%", height: 150 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byType.length > 0 ? byType : [{ name: "No Categories", value: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius="50%"
                    outerRadius="70%"
                    paddingAngle={byType.length > 0 ? 2.5 : 0}
                    dataKey="value"
                  >
                    {byType.length > 0
                      ? byType.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="#ffffff" strokeWidth={1.5} />)
                      : <Cell fill="#f1f5f9" stroke="#ffffff" strokeWidth={1.5} />
                    }
                  </Pie>
                  {byType.length > 0 && <ReTooltip content={<CustomTooltip />} />}
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text Summary */}
              <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
                <Typography sx={{ fontSize: "20px", fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{d.totalAssets ?? 0}</Typography>
                <Typography sx={{ fontSize: "9.5px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", mt: 0.25 }}>Assets</Typography>
              </Box>
            </Box>
            {byType.length > 0 ? (
              <CustomPieLegend data={byType} colors={CHART_COLORS} />
            ) : (
              <Typography sx={{ fontSize: "9px", fontWeight: 700, color: "#cbd5e1", textAlign: "center", mt: 1.5, textTransform: "uppercase", letterSpacing: "0.02em" }}>
                No Categories Registered
              </Typography>
            )}
          </Box>
        </PremiumCard>

        {/* By Company — Compact Donut */}
        <PremiumCard
          title="By Company"
          subtitle="Per corporate entity"
          icon={<FaBuilding />}
        >
          <Box sx={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "center" }}>
            <Box sx={{ position: "relative", width: "100%", height: 150 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCompany.length > 0 ? byCompany : [{ name: "No Entities", value: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius="50%"
                    outerRadius="70%"
                    paddingAngle={byCompany.length > 0 ? 2.5 : 0}
                    dataKey="value"
                  >
                    {byCompany.length > 0
                      ? byCompany.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} stroke="#ffffff" strokeWidth={1.5} />)
                      : <Cell fill="#f1f5f9" stroke="#ffffff" strokeWidth={1.5} />
                    }
                  </Pie>
                  {byCompany.length > 0 && <ReTooltip content={<CustomTooltip />} />}
                </PieChart>
              </ResponsiveContainer>
              {/* Center Corporate Icon */}
              <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "#94a3b8" }}>
                <FaBuilding size={20} />
              </Box>
            </Box>
            {byCompany.length > 0 ? (
              <CustomPieLegend data={byCompany} colors={CHART_COLORS.slice(2).concat(CHART_COLORS.slice(0, 2))} />
            ) : (
              <Typography sx={{ fontSize: "9px", fontWeight: 700, color: "#cbd5e1", textAlign: "center", mt: 1.5, textTransform: "uppercase", letterSpacing: "0.02em" }}>
                No Corporate Entities
              </Typography>
            )}
          </Box>
        </PremiumCard>

        {/* By Location — Symmetrical Donut taking remaining width */}
        <PremiumCard
          title="Assets by Location"
          subtitle="Site-wide distribution"
          icon={<FaMapMarkerAlt />}
        >
          <Box sx={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "center" }}>
            <Box sx={{ position: "relative", width: "100%", height: 150 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byLocation.length > 0 ? byLocation : [{ name: "No Locations", value: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius="50%"
                    outerRadius="70%"
                    paddingAngle={byLocation.length > 0 ? 2.5 : 0}
                    dataKey="value"
                  >
                    {byLocation.length > 0
                      ? byLocation.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 4) % CHART_COLORS.length]} stroke="#ffffff" strokeWidth={1.5} />)
                      : <Cell fill="#f1f5f9" stroke="#ffffff" strokeWidth={1.5} />
                    }
                  </Pie>
                  {byLocation.length > 0 && <ReTooltip content={<CustomTooltip />} />}
                </PieChart>
              </ResponsiveContainer>
              {/* Center Location Icon */}
              <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "#f59e0b" }}>
                <FaMapMarkerAlt size={20} />
              </Box>
            </Box>
            {byLocation.length > 0 ? (
              <CustomPieLegend data={byLocation} colors={CHART_COLORS.slice(4).concat(CHART_COLORS.slice(0, 4))} />
            ) : (
              <Typography sx={{ fontSize: "9px", fontWeight: 700, color: "#cbd5e1", textAlign: "center", mt: 1.5, textTransform: "uppercase", letterSpacing: "0.02em" }}>
                No Locations Registered
              </Typography>
            )}
          </Box>
        </PremiumCard>
      </Box>

      {/* ── Section: Allocation + Transfer + Disposal (Compact sizing) ──────── */}
      <Box sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(3, 1fr)"
        },
        gap: 2
      }}>
        {/* Allocation Summary */}
          <PremiumCard
            title="Allocation Summary"
            subtitle="Assignment counts"
            icon={<FaBoxes />}
          >
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 0.5 }}>
              {/* Left Stats Column */}
              <Box sx={{ flex: 1.2, display: "flex", flexDirection: "column", gap: 0.35 }}>
                {[
                  { label: "Active", value: d.activeAllocations ?? 0, color: "#10b981", bg: "#ecfdf5" },
                  { label: "Returned", value: d.returnedAllocations ?? 0, color: "#64748b", bg: "#f8fafc" },
                  { label: "Overdue", value: d.overdueAllocations ?? 0, color: "#f43f5e", bg: "#fff1f2" },
                ].map((item) => (
                  <Box key={item.label} sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    bgcolor: item.bg,
                    p: "4px 8px",
                    borderRadius: "6px",
                    border: "1px solid #f8fafc"
                  }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: item.color }} />
                      <Typography sx={{ fontSize: "10px", fontWeight: 700, color: item.color }}>{item.label}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: "11.5px", fontWeight: 900, color: "#0f172a" }}>{item.value}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Right Mini Graph Column */}
              <Box sx={{ flex: 0.8, display: "flex", justifyContent: "center", alignItems: "center", minWidth: 80 }}>
                <Box sx={{ width: "100%", height: 95, position: "relative" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={
                          (Number(d.activeAllocations ?? 0) + Number(d.returnedAllocations ?? 0) + Number(d.overdueAllocations ?? 0)) > 0
                            ? [
                              { name: "Active", value: Number(d.activeAllocations ?? 0) },
                              { name: "Returned", value: Number(d.returnedAllocations ?? 0) },
                              { name: "Overdue", value: Number(d.overdueAllocations ?? 0) }
                            ].filter(x => x.value > 0)
                            : [{ name: "No Data", value: 1 }]
                        }
                        cx="50%"
                        cy="50%"
                        innerRadius={22}
                        outerRadius={34}
                        paddingAngle={
                          (Number(d.activeAllocations ?? 0) + Number(d.returnedAllocations ?? 0) + Number(d.overdueAllocations ?? 0)) > 0
                            ? 2
                            : 0
                        }
                        dataKey="value"
                      >
                        {(Number(d.activeAllocations ?? 0) + Number(d.returnedAllocations ?? 0) + Number(d.overdueAllocations ?? 0)) > 0
                          ? [
                            <Cell key={0} fill="#10b981" stroke="#ffffff" strokeWidth={1} />,
                            <Cell key={1} fill="#64748b" stroke="#ffffff" strokeWidth={1} />,
                            <Cell key={2} fill="#f43f5e" stroke="#ffffff" strokeWidth={1} />
                          ].slice(0, [Number(d.activeAllocations ?? 0) > 0, Number(d.returnedAllocations ?? 0) > 0, Number(d.overdueAllocations ?? 0) > 0].filter(Boolean).length)
                          : <Cell fill="#f1f5f9" stroke="#ffffff" strokeWidth={1} />
                        }
                      </Pie>
                      {(Number(d.activeAllocations ?? 0) + Number(d.returnedAllocations ?? 0) + Number(d.overdueAllocations ?? 0)) > 0 && (
                        <ReTooltip content={<CustomTooltip />} />
                      )}
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
                    <Typography sx={{ fontSize: "12px", fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{d.totalAllocations ?? 0}</Typography>
                    <Typography sx={{ fontSize: "7.5px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", mt: 0.1 }}>Total</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </PremiumCard>
        {/* Transfer Summary */}
          <PremiumCard
            title="Transfer Summary"
            subtitle="Logistics logs"
            icon={<FaExchangeAlt />}
          >
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 0.5 }}>
              {/* Left Stats Column */}
              <Box sx={{ flex: 1.2, display: "flex", flexDirection: "column", gap: 0.35 }}>
                {[
                  { label: "Approved", value: d.approvedTransfers ?? 0, color: "#10b981", bg: "#ecfdf5" },
                  { label: "Pending", value: d.pendingTransfers ?? 0, color: "#d97706", bg: "#fffbeb" },
                  { label: "Rejected", value: d.rejectedTransfers ?? 0, color: "#f43f5e", bg: "#fff1f2" },
                ].map((item) => (
                  <Box key={item.label} sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    bgcolor: item.bg,
                    p: "4px 8px",
                    borderRadius: "6px",
                    border: "1px solid #f8fafc"
                  }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: item.color }} />
                      <Typography sx={{ fontSize: "10px", fontWeight: 700, color: item.color }}>{item.label}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: "11.5px", fontWeight: 900, color: "#0f172a" }}>{item.value}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Right Mini Graph Column */}
              <Box sx={{ flex: 0.8, display: "flex", justifyContent: "center", alignItems: "center", minWidth: 80 }}>
                <Box sx={{ width: "100%", height: 95, position: "relative" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={
                          (Number(d.approvedTransfers ?? 0) + Number(d.pendingTransfers ?? 0) + Number(d.rejectedTransfers ?? 0)) > 0
                            ? [
                              { name: "Approved", value: Number(d.approvedTransfers ?? 0) },
                              { name: "Pending", value: Number(d.pendingTransfers ?? 0) },
                              { name: "Rejected", value: Number(d.rejectedTransfers ?? 0) }
                            ].filter(x => x.value > 0)
                            : [{ name: "No Data", value: 1 }]
                        }
                        cx="50%"
                        cy="50%"
                        innerRadius={22}
                        outerRadius={34}
                        paddingAngle={
                          (Number(d.approvedTransfers ?? 0) + Number(d.pendingTransfers ?? 0) + Number(d.rejectedTransfers ?? 0)) > 0
                            ? 2
                            : 0
                        }
                        dataKey="value"
                      >
                        {(Number(d.approvedTransfers ?? 0) + Number(d.pendingTransfers ?? 0) + Number(d.rejectedTransfers ?? 0)) > 0
                          ? [
                            <Cell key={0} fill="#10b981" stroke="#ffffff" strokeWidth={1} />,
                            <Cell key={1} fill="#d97706" stroke="#ffffff" strokeWidth={1} />,
                            <Cell key={2} fill="#f43f5e" stroke="#ffffff" strokeWidth={1} />
                          ].slice(0, [Number(d.approvedTransfers ?? 0) > 0, Number(d.pendingTransfers ?? 0) > 0, Number(d.rejectedTransfers ?? 0) > 0].filter(Boolean).length)
                          : <Cell fill="#f1f5f9" stroke="#ffffff" strokeWidth={1} />
                        }
                      </Pie>
                      {(Number(d.approvedTransfers ?? 0) + Number(d.pendingTransfers ?? 0) + Number(d.rejectedTransfers ?? 0)) > 0 && (
                        <ReTooltip content={<CustomTooltip />} />
                      )}
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
                    <Typography sx={{ fontSize: "12px", fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{d.totalTransfers ?? 0}</Typography>
                    <Typography sx={{ fontSize: "7.5px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", mt: 0.1 }}>Total</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </PremiumCard>
        {/* Disposal Summary */}
          <PremiumCard
            title="Disposal Summary"
            subtitle="Decommissioned records"
            icon={<FaRecycle />}
          >
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 0.5 }}>
              {/* Left Stats Column */}
              <Box sx={{ flex: 1.2, display: "flex", flexDirection: "column", gap: 0.35 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: "4px 8px", bg: "#f8fafc", borderRadius: "6px", mb: 0.35, border: "1px solid #f1f5f9" }}>
                  <Typography sx={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Retired Items</Typography>
                  <Typography sx={{ fontSize: "12px", fontWeight: 950, color: "#0f172a" }}>{d.totalDisposals ?? 0}</Typography>
                </Box>
                {byMethod.length > 0 ? (
                  byMethod.slice(0, 2).map((item, idx) => (
                    <Box key={item.name} sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      bgcolor: "#f8fafc",
                      p: "4px 8px",
                      borderRadius: "6px",
                      border: "1px solid #f1f5f9"
                    }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, overflow: "hidden" }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: CHART_COLORS[(idx + 4) % CHART_COLORS.length] }} />
                        <Typography sx={{ fontSize: "9.5px", fontWeight: 700, color: "#475569", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{item.name}</Typography>
                      </Box>
                      <Typography sx={{ fontSize: "11px", fontWeight: 900, color: "#0f172a" }}>{item.value}</Typography>
                    </Box>
                  ))
                ) : (
                  <Typography fontSize={10} color={COLORS.textFaint} py={2} textAlign="center">No method breakdown</Typography>
                )}
              </Box>

              {/* Right Mini Graph Column */}
              <Box sx={{ flex: 0.8, display: "flex", justifyContent: "center", alignItems: "center", minWidth: 80 }}>
                <Box sx={{ width: "100%", height: 95, position: "relative" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={byMethod.length > 0 ? byMethod : [{ name: "No Data", value: 1 }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={22}
                        outerRadius={34}
                        paddingAngle={byMethod.length > 0 ? 2 : 0}
                        dataKey="value"
                      >
                        {byMethod.length > 0
                          ? byMethod.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 4) % CHART_COLORS.length]} stroke="#ffffff" strokeWidth={1} />)
                          : <Cell fill="#f1f5f9" stroke="#ffffff" strokeWidth={1} />
                        }
                      </Pie>
                      {byMethod.length > 0 && <ReTooltip content={<CustomTooltip />} />}
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
                    <Typography sx={{ fontSize: "12px", fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{d.totalDisposals ?? 0}</Typography>
                    <Typography sx={{ fontSize: "7.5px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", mt: 0.1 }}>Total</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </PremiumCard>
      </Box>
    </Box>
  );
}



