import { useEffect, useState } from "react";
import {
  Box, Typography, Grid, Paper, Avatar, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, CircularProgress,
} from "@mui/material";
import { FaBoxes, FaCheckCircle, FaExclamationTriangle, FaTools, FaUsers } from "react-icons/fa";
import { getAssets } from "../services/assets_service";
import { getUsers }  from "../services/users_service";
import { COLORS, STATUS_COLORS, CONDITION_COLORS, chipSx } from "../theme/tokens";
import StatCard from "../components/common/StatCard";

export default function Dashboard() {
  const [assets,    setAssets]    = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      getAssets({ page: 0, size: 100 }),
      getUsers({ page: 0, size: 1 }),
    ])
      .then(([aRes, uRes]) => {
        setAssets(aRes?.data?.content || aRes?.content || []);
        setUserCount(uRes?.data?.totalElements || uRes?.totalElements || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const total     = assets.length;
  const available = assets.filter((a) => a.status === "AVAILABLE").length;
  const assigned  = assets.filter((a) => a.status === "ASSIGNED").length;
  const damaged   = assets.filter((a) => a.status === "DAMAGED").length;
  const good      = assets.filter((a) => a.assetCondition === "GOOD").length;
  const fair      = assets.filter((a) => a.assetCondition === "FAIR").length;
  const poor      = assets.filter((a) => a.assetCondition === "POOR").length;
  const recent    = [...assets].slice(0, 8);

  if (loading) {
    return (
      <Box sx={{ mt: "60px", minHeight: "100vh", background: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: COLORS.primary }} />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: "60px", p: "2rem 2.5rem", background: COLORS.bg, minHeight: "100vh", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <Typography sx={{ fontWeight: 700, fontSize: 22, color: COLORS.text, mb: 3 }}>Dashboard</Typography>

      {/* ── Stat cards ── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: "Total Assets", value: total,     icon: <FaBoxes size={18} />,             iconBg: "#e8eaf6", iconColor: "#3949ab" },
          { label: "Available",    value: available, icon: <FaCheckCircle size={18} />,       iconBg: "#e8f5e9", iconColor: "#2e7d32" },
          { label: "Assigned",     value: assigned,  icon: <FaTools size={18} />,             iconBg: "#fff3e0", iconColor: "#e65100" },
          { label: "Damaged",      value: damaged,   icon: <FaExclamationTriangle size={18} />, iconBg: "#ffebee", iconColor: "#c62828" },
          { label: "Total Users",  value: userCount, icon: <FaUsers size={18} />,             iconBg: "#e3f2fd", iconColor: "#1565c0" },
        ].map((c) => (
          <Grid item xs={12} sm={6} md={4} lg key={c.label}>
            <StatCard {...c} />
          </Grid>
        ))}
      </Grid>

      {/* ── Bottom row ── */}
      <Grid container spacing={2.5}>

        {/* Recent Assets table */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ borderRadius: "14px", boxShadow: COLORS.shadow, overflow: "hidden" }}>
            <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${COLORS.borderLight}` }}>
              <Typography sx={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>Recent Assets</Typography>
            </Box>
            <Box sx={{ overflowX: "auto" }}>
              <Table sx={{ fontSize: 13 }}>
                <TableHead>
                  <TableRow sx={{ background: "#f8f9fc" }}>
                    {["Asset Name","Asset ID","Brand","Type","Status","Condition"].map((h) => (
                      <TableCell key={h} sx={{ py: "10px", px: 2, fontSize: 12, fontWeight: 600, color: COLORS.textFaint, whiteSpace: "nowrap", borderBottom: `1px solid ${COLORS.borderLight}` }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recent.length > 0 ? recent.map((item, i) => (
                    <TableRow key={i} sx={{ borderBottom: `1px solid ${COLORS.borderLight}`, "&:hover": { background: "#fafbff" } }}>
                      <TableCell sx={{ py: "10px", px: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                          <Avatar sx={{ width: 30, height: 30, background: COLORS.avatarBg, color: COLORS.avatarColor, fontWeight: 700, fontSize: 12 }}>
                            {(item.assetName || "A")[0].toUpperCase()}
                          </Avatar>
                          <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#333" }}>{item.assetName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: "10px", px: 2, color: COLORS.textFaint, fontFamily: "monospace", fontSize: 13 }}>#{item.assetId}</TableCell>
                      <TableCell sx={{ py: "10px", px: 2, color: "#333", fontSize: 13 }}>{item.brand || "—"}</TableCell>
                      <TableCell sx={{ py: "10px", px: 2, color: "#333", fontSize: 13 }}>{item.assetType?.typeName || "—"}</TableCell>
                      <TableCell sx={{ py: "10px", px: 2 }}><Chip label={item.status}         size="small" sx={chipSx(STATUS_COLORS[item.status])} /></TableCell>
                      <TableCell sx={{ py: "10px", px: 2 }}><Chip label={item.assetCondition} size="small" sx={chipSx(CONDITION_COLORS[item.assetCondition])} /></TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={6} sx={{ textAlign: "center", py: 4, color: "#aaa" }}>No assets found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Grid>

        {/* Breakdowns */}
        <Grid item xs={12} md={4}>
          <Grid container direction="column" spacing={2.5}>
            {[
              { title: "Status Breakdown",    rows: [{ label:"Available",value:available,...STATUS_COLORS.AVAILABLE},{label:"Assigned",value:assigned,...STATUS_COLORS.ASSIGNED},{label:"Damaged",value:damaged,...STATUS_COLORS.DAMAGED}] },
              { title: "Condition Breakdown", rows: [{ label:"Good",    value:good,...CONDITION_COLORS.GOOD},{label:"Fair",value:fair,...CONDITION_COLORS.FAIR},{label:"Poor",value:poor,...CONDITION_COLORS.POOR}] },
            ].map(({ title, rows }) => (
              <Grid item key={title}>
                <Paper elevation={0} sx={{ borderRadius: "14px", boxShadow: COLORS.shadow, p: 3 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 15, color: COLORS.text, mb: 2 }}>{title}</Typography>
                  {rows.map((s) => (
                    <Box key={s.label} sx={{ mb: 1.5 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography sx={{ fontSize: 12, color: "#555", fontWeight: 500 }}>{s.label}</Typography>
                        <Typography sx={{ fontSize: 12, color: COLORS.textFaint }}>{s.value} / {total}</Typography>
                      </Box>
                      <Box sx={{ height: 6, borderRadius: 3, background: "#f0f0f0", overflow: "hidden" }}>
                        <Box sx={{ height: "100%", borderRadius: 3, background: s.color, width: total ? `${(s.value/total)*100}%` : "0%" }} />
                      </Box>
                    </Box>
                  ))}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Grid>

      </Grid>
    </Box>
  );
}
