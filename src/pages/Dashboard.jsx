import { useEffect, useState } from "react";
import {
  Box, Typography, Grid, Paper, Avatar, CircularProgress,
} from "@mui/material";
import { FaBoxes, FaCheckCircle, FaExclamationTriangle, FaTools } from "react-icons/fa";
import toast from "react-hot-toast";
import { getDashboard } from "../services/assets_service";
import { useNavigate } from "react-router-dom";
import { COLORS, STATUS_COLORS, chipSx } from "../theme/tokens";
import StatCard from "../components/common/StatCard";

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
      <Box sx={{ mt: "60px", minHeight: "100vh", background: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: COLORS.primary }} />
      </Box>
    );
  }

  const totalAssets = stats?.totalAssets ?? 0;
  const available   = stats?.available ?? 0;
  const assigned    = stats?.assigned ?? 0;
  const damaged     = stats?.damaged ?? 0;
  const warrantyExpiring = stats?.expiringWarrantyIn30Days ?? 0;
  const byType      = stats?.countByType || {};
  const byLocation  = stats?.countByLocation || {};
  const byCompany   = stats?.countByCompany || {};

  const renderChart = (title, data, colors, columns = 1) => {
    const entries = Object.entries(data || {});
    const maxValue = Math.max(...entries.map(([, value]) => Number(value || 0)), 1);

    return (
      <Paper elevation={0} sx={{ borderRadius: "14px", boxShadow: COLORS.shadow, p: 3 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 15, color: COLORS.text, mb: 2 }}>{title}</Typography>
        {entries.length === 0 ? (
          <Typography sx={{ fontSize: 13, color: COLORS.textMuted }}>No data available</Typography>
        ) : (
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: columns > 1 ? { xs: "repeat(1, minmax(0, 1fr))", sm: "repeat(2, minmax(0, 1fr))" } : "repeat(1, minmax(0, 1fr))",
            }}
          >
            {entries.map(([label, value], idx) => {
              const count = Number(value || 0);
              const width = `${(count / maxValue) * 100}%`;
              return (
                <Box key={label}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography sx={{ fontSize: 12, color: COLORS.textFaint }}>{label}</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.text }}>{count}</Typography>
                  </Box>
                  <Box sx={{ height: 10, borderRadius: 999, background: "#f3f4f6", overflow: "hidden" }}>
                    <Box sx={{ width, height: "100%", borderRadius: 999, background: colors[idx % colors.length] }} />
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Paper>
    );
  };

  return (
    <Box sx={{ mt: "60px", p: "2rem 2.5rem", background: COLORS.bg, minHeight: "100vh", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <Typography sx={{ fontWeight: 700, fontSize: 22, color: COLORS.text, mb: 3 }}>Dashboard</Typography>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: "Total Assets", value: totalAssets, icon: <FaBoxes size={18} />,             iconBg: "#e8eaf6", iconColor: "#3949ab" },
          { label: "Available",    value: available,    icon: <FaCheckCircle size={18} />,       iconBg: "#e8f5e9", iconColor: "#2e7d32" },
          { label: "Assigned",     value: assigned,     icon: <FaTools size={18} />,             iconBg: "#dbeafe", iconColor: "#2563eb" },
          { label: "Damaged",      value: damaged,      icon: <FaExclamationTriangle size={18} />, iconBg: "#ffebee", iconColor: "#c62828" },
        ].map((c) => (
          <Grid item xs={12} sm={6} md={3} key={c.label}>
            <StatCard {...c} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            onClick={() => navigate('/home/assets?expiringWarrantyInDays=30')}
            sx={{
              borderRadius: "14px",
              boxShadow: COLORS.shadow,
              p: 3,
              minHeight: 150,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: 15, color: COLORS.text, mb: 1 }}>Warranty expiring in 30 days</Typography>
              <Typography sx={{ fontSize: 38, fontWeight: 800, color: "#b45309" }}>{warrantyExpiring}</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "#92400e" }}>
              <FaExclamationTriangle size={16} />
              <Typography sx={{ fontSize: 12, color: "#92400e" }}>Review items before they expire.</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>{renderChart("Assets by Type", byType, ["#2563eb", "#60a5fa", "#93c5fd", "#0284c7"])}</Grid>
        <Grid item xs={12} md={4}>{renderChart("Assets by Location", byLocation, ["#2563eb", "#0f766e", "#4b5563", "#7c3aed"], 2)}</Grid>
        <Grid item xs={12} md={4}>{renderChart("Assets by Company", byCompany, ["#2563eb", "#10b981", "#f97316", "#8b5cf6"])}</Grid>
      </Grid>
    </Box>
  );
}
