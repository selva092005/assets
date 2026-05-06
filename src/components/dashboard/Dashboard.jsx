import { useEffect, useState } from "react";
import {
  Box, Typography, Grid, Paper, Avatar, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, CircularProgress,
} from "@mui/material";
import { FaBoxes, FaCheckCircle, FaExclamationTriangle, FaTools, FaUsers } from "react-icons/fa";
import { getAssets } from "../../service/assets_service";
import { getUsers } from "../../service/users_service";

const STATUS_COLORS = {
  AVAILABLE: { bg: "#e8f5e9", color: "#2e7d32" },
  ASSIGNED:  { bg: "#fff3e0", color: "#e65100" },
  DAMAGED:   { bg: "#ffebee", color: "#c62828" },
};

const CONDITION_COLORS = {
  GOOD: { bg: "#e3f2fd", color: "#1565c0" },
  FAIR: { bg: "#fffde7", color: "#f57f17" },
  POOR: { bg: "#ffebee", color: "#c62828" },
};

function StatCard({ icon, label, value, iconBg, iconColor }) {
  return (
    <Paper elevation={0} sx={{ borderRadius: "14px", p: "20px 24px", background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: 2 }}>
      <Box sx={{ width: 48, height: 48, borderRadius: "12px", background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Box sx={{ color: iconColor, display: "flex" }}>{icon}</Box>
      </Box>
      <Box>
        <Typography sx={{ fontSize: 12, color: "#888", fontWeight: 500, mb: 0.25 }}>{label}</Typography>
        <Typography sx={{ fontSize: 26, fontWeight: 700, color: "#1a1a2e", lineHeight: 1 }}>{value}</Typography>
      </Box>
    </Paper>
  );
}

export default function Dashboard() {
  const [assets, setAssets]     = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      getAssets({ page: 0, size: 100 }),
      getUsers({ page: 0, size: 1 }),
    ]).then(([aRes, uRes]) => {
      setAssets(aRes?.data?.content || aRes?.content || []);
      setUserCount(uRes?.data?.totalElements || uRes?.totalElements || 0);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const total     = assets.length;
  const available = assets.filter(a => a.status === "AVAILABLE").length;
  const assigned  = assets.filter(a => a.status === "ASSIGNED").length;
  const damaged   = assets.filter(a => a.status === "DAMAGED").length;

  // condition breakdown
  const good = assets.filter(a => a.assetCondition === "GOOD").length;
  const fair = assets.filter(a => a.assetCondition === "FAIR").length;
  const poor = assets.filter(a => a.assetCondition === "POOR").length;

  const recent = [...assets].slice(0, 8);

  if (loading) {
    return (
      <Box sx={{ mt: "60px", minHeight: "100vh", background: "#f4f6fb", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: "#1976d2" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: "60px", p: "2rem 2.5rem", background: "#f4f6fb", minHeight: "100vh", fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* Page title */}
      <Typography sx={{ fontWeight: 700, fontSize: 22, color: "#1a1a2e", mb: 3 }}>Dashboard</Typography>

      {/* ── Stat cards ── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: "Total Assets",  value: total,     icon: <FaBoxes size={18} />,             iconBg: "#e8eaf6", iconColor: "#3949ab" },
          { label: "Available",     value: available, icon: <FaCheckCircle size={18} />,       iconBg: "#e8f5e9", iconColor: "#2e7d32" },
          { label: "Assigned",      value: assigned,  icon: <FaTools size={18} />,             iconBg: "#fff3e0", iconColor: "#e65100" },
          { label: "Damaged",       value: damaged,   icon: <FaExclamationTriangle size={18} />, iconBg: "#ffebee", iconColor: "#c62828" },
          { label: "Total Users",   value: userCount, icon: <FaUsers size={18} />,             iconBg: "#e3f2fd", iconColor: "#1565c0" },
        ].map(c => (
          <Grid item xs={12} sm={6} md={4} lg key={c.label}>
            <StatCard {...c} />
          </Grid>
        ))}
      </Grid>

      {/* ── Bottom row: Recent Assets table + Condition breakdown ── */}
      <Grid container spacing={2.5}>

        {/* Recent Assets */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ borderRadius: "14px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", overflow: "hidden" }}>
            <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #f0f0f0" }}>
              <Typography sx={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}>Recent Assets</Typography>
            </Box>
            <Box sx={{ overflowX: "auto" }}>
              <Table sx={{ fontSize: 13 }}>
                <TableHead>
                  <TableRow sx={{ background: "#f8f9fc" }}>
                    {["Asset Name", "Asset ID", "Brand", "Type", "Status", "Condition"].map(h => (
                      <TableCell key={h} sx={{ py: "10px", px: 2, fontSize: 12, fontWeight: 600, color: "#888", whiteSpace: "nowrap", borderBottom: "1px solid #f0f0f0" }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recent.length > 0 ? recent.map((item, i) => (
                    <TableRow key={i} sx={{ borderBottom: "1px solid #f0f0f0", "&:hover": { background: "#fafbff" } }}>
                      <TableCell sx={{ py: "10px", px: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                          <Avatar sx={{ width: 30, height: 30, background: "#e8eaf6", color: "#3949ab", fontWeight: 700, fontSize: 12 }}>
                            {(item.assetName || "A")[0].toUpperCase()}
                          </Avatar>
                          <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#333" }}>{item.assetName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: "10px", px: 2, color: "#888", fontFamily: "monospace", fontSize: 13 }}>#{item.assetId}</TableCell>
                      <TableCell sx={{ py: "10px", px: 2, color: "#333", fontSize: 13 }}>{item.brand || "—"}</TableCell>
                      <TableCell sx={{ py: "10px", px: 2, color: "#333", fontSize: 13 }}>{item.assetType?.typeName || "—"}</TableCell>
                      <TableCell sx={{ py: "10px", px: 2 }}>
                        <Chip label={item.status} size="small" sx={{ ...chipSx(STATUS_COLORS[item.status]) }} />
                      </TableCell>
                      <TableCell sx={{ py: "10px", px: 2 }}>
                        <Chip label={item.assetCondition} size="small" sx={{ ...chipSx(CONDITION_COLORS[item.assetCondition]) }} />
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={6} sx={{ textAlign: "center", py: 4, color: "#aaa" }}>No assets found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Grid>

        {/* Condition & Status breakdown */}
        <Grid item xs={12} md={4}>
          <Grid container direction="column" spacing={2.5}>

            {/* Status breakdown */}
            <Grid item>
              <Paper elevation={0} sx={{ borderRadius: "14px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", p: 3 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e", mb: 2 }}>Status Breakdown</Typography>
                {[
                  { label: "Available", value: available, total, ...STATUS_COLORS.AVAILABLE },
                  { label: "Assigned",  value: assigned,  total, ...STATUS_COLORS.ASSIGNED },
                  { label: "Damaged",   value: damaged,   total, ...STATUS_COLORS.DAMAGED },
                ].map(s => (
                  <Box key={s.label} sx={{ mb: 1.5 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography sx={{ fontSize: 12, color: "#555", fontWeight: 500 }}>{s.label}</Typography>
                      <Typography sx={{ fontSize: 12, color: "#888" }}>{s.value} / {total}</Typography>
                    </Box>
                    <Box sx={{ height: 6, borderRadius: 3, background: "#f0f0f0", overflow: "hidden" }}>
                      <Box sx={{ height: "100%", borderRadius: 3, background: s.color, width: total ? `${(s.value / total) * 100}%` : "0%" }} />
                    </Box>
                  </Box>
                ))}
              </Paper>
            </Grid>

            {/* Condition breakdown */}
            <Grid item>
              <Paper elevation={0} sx={{ borderRadius: "14px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", p: 3 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e", mb: 2 }}>Condition Breakdown</Typography>
                {[
                  { label: "Good", value: good, total, ...CONDITION_COLORS.GOOD },
                  { label: "Fair", value: fair, total, ...CONDITION_COLORS.FAIR },
                  { label: "Poor", value: poor, total, ...CONDITION_COLORS.POOR },
                ].map(c => (
                  <Box key={c.label} sx={{ mb: 1.5 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography sx={{ fontSize: 12, color: "#555", fontWeight: 500 }}>{c.label}</Typography>
                      <Typography sx={{ fontSize: 12, color: "#888" }}>{c.value} / {total}</Typography>
                    </Box>
                    <Box sx={{ height: 6, borderRadius: 3, background: "#f0f0f0", overflow: "hidden" }}>
                      <Box sx={{ height: "100%", borderRadius: 3, background: c.color, width: total ? `${(c.value / total) * 100}%` : "0%" }} />
                    </Box>
                  </Box>
                ))}
              </Paper>
            </Grid>

          </Grid>
        </Grid>

      </Grid>
    </Box>
  );
}

const chipSx = (s = { bg: "#f5f5f5", color: "#555" }) => ({
  background: s.bg, color: s.color, fontWeight: 600, fontSize: 11, borderRadius: "20px", height: 22,
});
