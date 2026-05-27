import { useEffect, useState } from "react";
import {
  Box, Typography, CircularProgress, Button, Divider
} from "@mui/material";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import {
  FaBoxes,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTools,
  FaWrench,
  FaCalendarAlt,
  FaPlus,
  FaExchangeAlt,
  FaInfoCircle,
  FaChartBar,
  FaChartPie
} from "react-icons/fa";
import toast from "../utils/toast.jsx";
import { getDashboard } from "../services/assets_service";
import { useNavigate } from "react-router-dom";
import { COLORS, outlinedBtnSx } from "../theme/tokens";
import StatCard from "../components/common/StatCard";
import PremiumCard from "../components/common/PremiumCard";

const CHART_COLORS = ["#2563eb", "#10b981", "#d97706", "#f43f5e", "#8b5cf6", "#0891b2", "#f97316"];

// Clean, high-contrast custom tooltip for graphs
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <Box sx={{
        bgcolor: "#ffffff",
        p: "6px 10px",
        borderRadius: "6px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
        border: "1px solid #e2e8f0",
        pointerEvents: "none"
      }}>
        <Typography sx={{ fontSize: "9.5px", fontWeight: 700, color: "#1e293b" }}>
          {payload[0].name}
        </Typography>
        <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#2563eb", mt: 0.25 }}>
          {payload[0].value} Assets
        </Typography>
      </Box>
    );
  }
  return null;
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    getDashboard()
      .then((data) => setStats(data))
      .catch(() => toast.error("Failed to load dashboard data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
        <CircularProgress sx={{ color: COLORS.primary }} />
      </Box>
    );
  }

  const totalAssets = stats?.totalAssets ?? 0;
  const available = stats?.available ?? 0;
  const assigned = stats?.assigned ?? 0;
  const damaged = stats?.damaged ?? 0;
  const underMaintenance = stats?.underMaintenance ?? 0;
  const warrantyExpiring = stats?.expiringWarrantyIn30Days ?? 0;
  const byType = stats?.countByType || {};
  const byLocation = stats?.countByLocation || {};
  const byCompany = stats?.countByCompany || {};

  // Formatted data for Type/Category Bar Chart
  const typeData = Object.entries(byType).map(([name, value]) => ({
    name,
    value: Number(value)
  })).sort((a, b) => b.value - a.value);

  // Formatted data for Company Bar Chart
  const companyData = Object.entries(byCompany).map(([name, value]) => ({
    name,
    value: Number(value)
  })).sort((a, b) => b.value - a.value);

  // Formatted data for Location List
  const locationData = Object.entries(byLocation).map(([name, value]) => ({
    name,
    value: Number(value)
  })).sort((a, b) => b.value - a.value);

  // Status donut data
  const statusData = [
    { name: "Available", value: Number(available), color: "#10b981" },
    { name: "Assigned", value: Number(assigned), color: "#2563eb" },
    { name: "Maintenance", value: Number(underMaintenance), color: "#d97706" },
    { name: "Damaged", value: Number(damaged), color: "#f43f5e" }
  ].filter(x => x.value > 0);

  const todayString = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  return (
    <Box sx={{ p: 0, display: "flex", flexDirection: "column", gap: 2 }}>

      {/* ── Low-Profile Clean Header Ribbon ── */}
      <Box sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        bgcolor: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        p: "8px 12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.01)"
      }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "13px", color: "#0f172a", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
            Asset Management Dashboard
          </Typography>
          <Typography sx={{ fontSize: "9px", fontWeight: 600, color: "#64748b" }}>
            Operational overview, status distributions & site deployments
          </Typography>
        </Box>
        <Box sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          bgcolor: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "4px",
          p: "2px 6px"
        }}>
          <FaCalendarAlt size={8} color="#64748b" />
          <Typography sx={{ fontSize: "8.5px", fontWeight: 800, color: "#475569", fontFamily: "monospace" }}>
            {todayString}
          </Typography>
        </Box>
      </Box>

      {/* ── Stat Ribbon (5 Symmetrical Columns with Clean Top Color Accents) ── */}
      <Box sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, 1fr)",
          sm: "repeat(3, 1fr)",
          md: "repeat(5, 1fr)"
        },
        gap: 2
      }}>
        <StatCard label="Total Assets" value={totalAssets} icon={<FaBoxes />} iconBg="#e8eaf6" iconColor="#3949ab" />
        <StatCard label="Available" value={available} icon={<FaCheckCircle />} iconBg="#ecfdf5" iconColor="#10b981" />
        <StatCard label="Assigned" value={assigned} icon={<FaTools />} iconBg="#eff6ff" iconColor="#2563eb" />
        <StatCard label="Maintenance" value={underMaintenance} icon={<FaWrench />} iconBg="#fffbeb" iconColor="#d97706" />
        <StatCard label="Damaged" value={damaged} icon={<FaExclamationTriangle />} iconBg="#fff1f2" iconColor="#f43f5e" />
      </Box>

      {/* ── Main Layout Grid ── */}
      <Box sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          lg: "2fr 1fr"
        },
        gap: 2
      }}>
        
        {/* Left Column: Visual Charts Group */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          
          <Box sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(2, 1fr)"
            },
            gap: 2
          }}>
            {/* Chart 1: Category Dominance Bar Chart */}
            <PremiumCard title="Asset Type breakdown" icon={<FaChartBar />} subtitle="Total count per category">
              <Box sx={{ width: "100%", height: 115, mt: 0.5 }}>
                {typeData.length === 0 ? (
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                    <Typography sx={{ fontSize: "9px", color: "#94a3b8" }}>No category logged</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={typeData.slice(0, 5)} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 7.5, fill: "#64748b", fontWeight: 750 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 7.5, fill: "#64748b", fontWeight: 750 }} tickLine={false} axisLine={false} />
                      <ReTooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="value"
                        fill="#2563eb"
                        radius={[3, 3, 0, 0]}
                        barSize={13}
                        animationDuration={1500}
                        animationEasing="ease-out"
                      >
                        {typeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </PremiumCard>

            {/* Chart 2: Company Distribution Bar Chart */}
            <PremiumCard title="Ownership Distribution" icon={<FaChartBar />} subtitle="Devices owned per company">
              <Box sx={{ width: "100%", height: 115, mt: 0.5 }}>
                {companyData.length === 0 ? (
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                    <Typography sx={{ fontSize: "9px", color: "#94a3b8" }}>No company records</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={companyData.slice(0, 5)} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 7.5, fill: "#64748b", fontWeight: 750 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 7.5, fill: "#64748b", fontWeight: 750 }} tickLine={false} axisLine={false} />
                      <ReTooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="value"
                        fill="#8b5cf6"
                        radius={[3, 3, 0, 0]}
                        barSize={13}
                        animationDuration={1500}
                        animationEasing="ease-out"
                      >
                        {companyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 3) % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </PremiumCard>
          </Box>

          {/* Regional deployment block */}
          <PremiumCard title="Asset Deployments per Site Location" icon={<FaChartBar />} subtitle="Site allocation statistics">
            <Box sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(3, 1fr)"
              },
              gap: 1,
              mt: 0.5
            }}>
              {locationData.length === 0 ? (
                <Box sx={{ gridColumn: "1 / -1", textAlign: "center", py: 2 }}>
                  <Typography sx={{ fontSize: "9px", color: "#94a3b8" }}>No deployment tracked</Typography>
                </Box>
              ) : (
                locationData.slice(0, 6).map((item, idx) => {
                  const pct = Math.round((item.value / Math.max(totalAssets, 1)) * 100);
                  const themeColor = CHART_COLORS[(idx + 4) % CHART_COLORS.length];
                  return (
                    <Box
                      key={item.name}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        bgcolor: "#f8fafc",
                        p: "4px 8px",
                        borderRadius: "6px",
                        border: "1px solid #f1f5f9",
                        transition: "all 200ms ease",
                        "&:hover": {
                          borderColor: themeColor,
                          transform: "translateY(-1px)"
                        }
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Box sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "4px",
                          bgcolor: themeColor + "12",
                          color: themeColor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 8,
                          fontWeight: "bold"
                        }}>
                          📍
                        </Box>
                        <Typography sx={{ fontSize: "9px", fontWeight: 800, color: "#334155" }}>
                          {item.name}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Typography sx={{ fontSize: "9.5px", fontWeight: 950, color: "#0f172a" }}>
                          {item.value}
                        </Typography>
                        <Typography sx={{ fontSize: "7px", fontWeight: 700, color: "#94a3b8" }}>
                          ({pct}%)
                        </Typography>
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>
          </PremiumCard>

        </Box>

        {/* Right Column: Status Donut & Fast Action Hub */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          
          {/* Status Donut Graph */}
          <PremiumCard title="Asset Health Status" icon={<FaChartPie />} subtitle="Active operation state breakdown">
            <Box sx={{ position: "relative", width: "100%", height: 85, mt: 0.5, display: "flex", justifyContent: "center", alignItems: "center" }}>
              <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData.length > 0 ? statusData : [{ name: "No Data", value: 1 }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={24}
                      outerRadius={34}
                      paddingAngle={statusData.length > 0 ? 3 : 0}
                      dataKey="value"
                      animationDuration={1500}
                      animationEasing="ease-out"
                    >
                      {statusData.length > 0
                        ? statusData.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={entry.color} stroke="#ffffff" strokeWidth={1.5} />
                          ))
                        : <Cell fill="#e2e8f0" stroke="#ffffff" strokeWidth={1.5} />
                      }
                    </Pie>
                    {statusData.length > 0 && <ReTooltip content={<CustomTooltip />} />}
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
                  <Typography sx={{ fontSize: "12px", fontWeight: 950, color: "#0f172a", lineHeight: 1 }}>
                    {totalAssets}
                  </Typography>
                  <Typography sx={{ fontSize: "5.5px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", mt: 0.1 }}>
                    Total
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Custom Status Legend Row */}
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 0.5, mt: 0.5 }}>
              {[
                { label: "Available", val: available, color: "#10b981", bg: "#ecfdf5" },
                { label: "Assigned", val: assigned, color: "#2563eb", bg: "#eff6ff" },
                { label: "Maintenance", val: underMaintenance, color: "#d97706", bg: "#fffbeb" },
                { label: "Damaged", val: damaged, color: "#f43f5e", bg: "#fff1f2" }
              ].map((item) => (
                <Box key={item.label} sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  bgcolor: item.bg,
                  p: "2px 5px",
                  borderRadius: "6px",
                  border: "1px solid #f8fafc",
                  transition: "transform 0.2s ease",
                  "&:hover": {
                    transform: "scale(1.02)"
                  }
                }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: item.color }} />
                    <Typography sx={{ fontSize: "7.5px", fontWeight: 700, color: item.color }}>{item.label}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: "8.5px", fontWeight: 900, color: "#0f172a" }}>{item.val}</Typography>
                </Box>
              ))}
            </Box>
          </PremiumCard>

          {/* Quick Operations Panel */}
          <PremiumCard title="Alerts & Operations" icon={<FaInfoCircle />} subtitle="Attention items & quick links">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 0.5 }}>
              
              {/* Warranty expiry alert box */}
              <Box
                onClick={() => navigate('/home/assets?expiringWarrantyInDays=30')}
                sx={{
                  borderRadius: "6px",
                  border: "1px solid #fef3c7",
                  p: "6px 10px",
                  cursor: "pointer",
                  background: "linear-gradient(to bottom right, #fffdf5, #fffbeb)",
                  transition: "all 200ms ease",
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 8px rgba(217, 119, 6, 0.04)"
                  }
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Typography sx={{ fontWeight: 850, fontSize: "8px", color: "#b45309", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                    Warranty Expiring (30d)
                  </Typography>
                  <Box sx={{ bgcolor: "#fef3c7", color: "#d97706", borderRadius: "50%", width: 11, height: 11, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 900 }}>
                    !
                  </Box>
                </Box>
                <Typography sx={{ fontSize: "14px", fontWeight: 950, color: "#78350f", lineHeight: 1.2, mt: 0.1 }}>
                  {warrantyExpiring}
                </Typography>
                <Typography sx={{ fontSize: "7.5px", fontWeight: 700, color: "#92400e", mt: 0.2 }}>
                  Assets require renewal review
                </Typography>
              </Box>

              <Divider sx={{ borderStyle: "dashed", borderColor: "#f1f5f9" }} />

              {/* Fast links shortcuts */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                <Typography sx={{ fontSize: "7.5px", fontWeight: 850, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.25 }}>
                  Quick Shortcuts
                </Typography>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/home/assets')}
                  startIcon={<FaPlus size={8} />}
                  sx={{
                    ...outlinedBtnSx,
                    justifyContent: "flex-start",
                    width: "100%",
                  }}
                >
                  Register Asset
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/home/allocations')}
                  startIcon={<FaTools size={8} />}
                  sx={{
                    ...outlinedBtnSx,
                    justifyContent: "flex-start",
                    width: "100%",
                  }}
                >
                  Create Allocation
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/home/transfers')}
                  startIcon={<FaExchangeAlt size={8} />}
                  sx={{
                    ...outlinedBtnSx,
                    justifyContent: "flex-start",
                    width: "100%",
                  }}
                >
                  Request Location Transfer
                </Button>
              </Box>
            </Box>
          </PremiumCard>

        </Box>

      </Box>

    </Box>
  );
}
