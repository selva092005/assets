import React, { useEffect, useState } from "react";
import {
  Grid, Card, CardContent, Typography,
  Table, TableHead, TableRow, TableCell, TableBody, Button
} from "@mui/material";
import { getAssets } from "../../service/assets_service";
import { Container } from "@mui/material";

const Dashboard = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const res = await getAssets();

      console.log("API RESPONSE:", res);

      // ✅ handle all possible formats safely
      const data = res?.data?.content || res?.data || [];

      setAssets(Array.isArray(data) ? data : []);

    } catch (err) {
      console.error("Dashboard Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ SAFE FIELD ACCESS (adjust if needed after console check)
  const getName = (a) => a.name || a.assetName || a.title || "No Name";
  const getAssigned = (a) =>
    a.assignedTo || a.assigned_user || a.userName || "Not Assigned";

  // ✅ STATUS FIX (based on your API: AVAILABLE)
  const totalAssets = assets.length;

  const activeAssets = assets.filter(
    (a) => a.status === "AVAILABLE" || a.status === "ACTIVE"
  ).length;

  const inactiveAssets = assets.filter(
    (a) => a.status === "INACTIVE"
  ).length;

  const maintenanceAssets = assets.filter(
    (a) => a.status === "MAINTENANCE"
  ).length;

  const unassignedAssets = assets.filter(
    (a) => !a.assignedTo && !a.assigned_user
  ).length;

  if (loading) return <p>Loading Dashboard...</p>;

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
          <Grid container spacing={3}>

      {/* ✅ KPI CARDS */}
      {[
        { title: "Total Assets", value: totalAssets },
        { title: "Active", value: activeAssets },
        { title: "Inactive", value: inactiveAssets },
        { title: "Maintenance", value: maintenanceAssets },
      ].map((card, i) => (
        <Grid item xs={12} sm={6} md={3} key={i}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6">{card.title}</Typography>
              <Typography variant="h4">{card.value}</Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}

      {/* ✅ QUICK ACTIONS */}
      <Grid item xs={12}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6">Quick Actions</Typography>
            <Button variant="contained" sx={{ m: 1 }}>Add Asset</Button>
            <Button variant="contained" sx={{ m: 1 }}>Assign Asset</Button>
            <Button variant="contained" sx={{ m: 1 }}>Maintenance</Button>
          </CardContent>
        </Card>
      </Grid>

      {/* ✅ ALERTS */}
      <Grid item xs={12} md={6}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6">Alerts</Typography>
            <Typography>Unassigned Assets: {unassignedAssets}</Typography>
            <Typography>Maintenance Assets: {maintenanceAssets}</Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* ✅ USER SUMMARY */}
      <Grid item xs={12} md={6}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6">User Summary</Typography>
            <Typography>
              Total Users: {
                [...new Set(
                  assets.map(a => getAssigned(a)).filter(u => u !== "Not Assigned")
                )].length
              }
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* ✅ RECENT ACTIVITY */}
      <Grid item xs={12}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6">Recent Activity</Typography>

            {assets.slice(0, 5).map((a) => (
              <Typography key={a.id}>
                {getName(a)} → {a.status}
              </Typography>
            ))}

          </CardContent>
        </Card>
      </Grid>

      {/* ✅ TABLE */}
      <Grid item xs={12}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6">Asset Overview</Typography>

            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned To</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {assets.slice(0, 10).map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{getName(a)}</TableCell>
                    <TableCell>{a.status}</TableCell>
                    <TableCell>{getAssigned(a)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

          </CardContent>
        </Card>
      </Grid>

    </Grid>
    </Container>

  );
};

export default Dashboard;