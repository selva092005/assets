import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box, Typography, Button, Divider, Avatar, Select, MenuItem
} from "@mui/material";
import SkeletonLoader from "../components/common/SkeletonLoader";
import ErrorState from "../components/common/ErrorState";
import PremiumPieChart from "../components/common/PremiumPieChart";
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
  FaChartPie,
  FaClock,
  FaTrashAlt,
  FaUpload,
  FaFileAlt,
  FaTimes,
  FaMapMarkerAlt
} from "react-icons/fa";
import toast from "../utils/toast.jsx";
import { getDashboard, getImageUrl, getAssets } from "../services/assets_service";
import { getAllAllocations } from "../services/allocation_service";
import { getAllTransfers, approveTransfer, rejectTransfer } from "../services/transfer_service";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setAssetSearch, setAssetPage } from "../store/slices/assetSlice";
import { COLORS, outlinedBtnSx, locationBadgeSx } from "../theme/tokens";
import StatCard from "../components/common/StatCard";
import PremiumCard from "../components/common/PremiumCard";
import PageHeader from "../components/common/PageHeader";
import CustomTooltip from "../components/common/CustomTooltip";

const CHART_COLORS = ["#2563eb", "#10b981", "#d97706", "#f43f5e", "#8b5cf6", "#0891b2", "#f97316"];

export default function Dashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [warrantyDays, setWarrantyDays] = useState(90);
  const [statusActiveIdx, setStatusActiveIdx] = useState(null);

  const { data: stats, isLoading: statsLoading, isError: statsError, error: statsErr, refetch: refetchStats } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const res = await getDashboard();
      return res;
    },
  });

  const { data: recentActivities = [], isLoading: activitiesLoading, isError: actError, error: actErr, refetch: refetchActivities } = useQuery({
    queryKey: ["recentAllocationsLimit"],
    queryFn: async () => {
      const res = await getAllAllocations({ page: 0, size: 5 });
      return res?.data?.content || res?.content || [];
    },
  });

  const { data: allAssetsRes, isLoading: assetsLoading, isError: assetsError, error: assetsErr, refetch: refetchAssets } = useQuery({
    queryKey: ["dashboardAllAssets"],
    queryFn: async () => {
      const res = await getAssets({ page: 0, size: 200 });
      return res?.data?.content || res?.content || [];
    }
  });

  const { data: pendingTransfers = [], refetch: refetchTransfers } = useQuery({
    queryKey: ["dashboardPendingTransfers"],
    queryFn: async () => {
      try {
        const res = await getAllTransfers({ status: "PENDING" });
        return res?.data?.content || res?.content || res || [];
      } catch (err) {
        console.error("Failed to fetch pending transfers", err);
        return [];
      }
    }
  });

  const handleApproveTransfer = async (id) => {
    const toastId = toast.loading("Approving transfer...");
    try {
      await approveTransfer(id, { remarks: "Approved from Dashboard" });
      toast.success("Transfer approved successfully!", { id: toastId });
      refetchTransfers();
      refetchStats();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to approve transfer.", { id: toastId });
    }
  };

  const handleRejectTransfer = async (id) => {
    const toastId = toast.loading("Rejecting transfer...");
    try {
      await rejectTransfer(id, { remarks: "Rejected from Dashboard" });
      toast.success("Transfer rejected.", { id: toastId });
      refetchTransfers();
      refetchStats();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to reject transfer.", { id: toastId });
    }
  };

  const loading = statsLoading || activitiesLoading || assetsLoading;
  const isError = statsError || actError || assetsError;
  const error = statsErr || actErr || assetsErr;
  const refetchAll = () => {
    refetchStats();
    refetchActivities();
    refetchAssets();
    refetchTransfers();
  };

  if (loading) {
    return <SkeletonLoader variant="dashboard" />;
  }

  if (isError) {
    return (
      <Box sx={{ p: 2 }}>
        <ErrorState message={error?.message || error?.response?.data?.message} onRetry={refetchAll} />
      </Box>
    );
  }

  const totalAssets = stats?.totalAssets ?? 0;
  const available = stats?.available ?? 0;
  const assigned = stats?.assigned ?? 0;
  const damaged = stats?.damaged ?? 0;
  const underMaintenance = stats?.underMaintenance ?? 0;
  const lost = stats?.lost ?? 0;
  const warrantyExpiring = stats?.expiringWarrantyIn30Days ?? 0;
  const byType = stats?.countByType || {};
  const byLocation = stats?.countByLocation || {};
  const byCompany = stats?.countByCompany || {};

  const typeData = Object.entries(byType).map(([name, value]) => ({
    name,
    value: Number(value)
  })).sort((a, b) => b.value - a.value);

  const lowStockCategories = typeData.filter(item => item.value < 10);

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
    { name: "Damaged", value: Number(damaged), color: "#f43f5e" },
    { name: "Lost", value: Number(lost), color: "#ef4444" }
  ].filter(x => x.value > 0);

  // Expiring warranties calculation
  const expiringAssets = (allAssetsRes || []).filter(a => {
    if (!a.warrantyExpiry) return false;
    const exp = new Date(a.warrantyExpiry);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffTime = exp - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= warrantyDays;
  }).sort((a, b) => new Date(a.warrantyExpiry) - new Date(b.warrantyExpiry));

  const criticalWarranties = (allAssetsRes || []).filter(a => {
    if (!a.warrantyExpiry) return false;
    const exp = new Date(a.warrantyExpiry);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffTime = exp - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  });

  const now = new Date();
  const dayVal = now.toLocaleDateString("en-US", { day: "2-digit" });
  const monthVal = now.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const weekdayVal = now.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const yearVal = now.getFullYear();

  return (
    <Box sx={{ p: 0, display: "flex", flexDirection: "column", gap: 2 }}>

      <PageHeader
        title="Asset Management Dashboard"
        subtitle="Operational overview, status distributions & site deployments"
        actions={
          <Box sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            p: "4px 10px",
            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)"
          }}>
            {/* Calendar Tear-Off Block */}
            <Box sx={{
              width: 32,
              height: 34,
              borderRadius: "6px",
              border: "1.5px solid #e2e8f0",
              overflow: "hidden",
              bgcolor: "#ffffff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
            }}>
              <Box sx={{
                width: "100%",
                bgcolor: "#ef4444",
                color: "#ffffff",
                fontSize: "7px",
                fontWeight: 900,
                textAlign: "center",
                py: "1px",
                lineHeight: 1,
                letterSpacing: "0.02em"
              }}>
                {monthVal}
              </Box>
              <Box sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "13px",
                color: "#0f172a",
                lineHeight: 1
              }}>
                {dayVal}
              </Box>
            </Box>

            {/* Weekday & Year Details */}
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Typography sx={{ fontSize: "10px", fontWeight: 800, color: "#1e293b", lineHeight: 1.1, letterSpacing: "0.02em" }}>
                {weekdayVal}
              </Typography>
              <Typography sx={{ fontSize: "8.5px", fontWeight: 700, color: "#64748b", mt: 0.15, lineHeight: 1 }}>
                {yearVal}
              </Typography>
            </Box>
          </Box>
        }
      />

      {/* Warranty Expiry Alert Banner */}
      {criticalWarranties.length > 0 && (
        <Box sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "#fffbeb",
          border: "1.5px solid #fef3c7",
          borderRadius: "8px",
          p: "10px 16px",
          boxShadow: "0 2px 4px rgba(245, 158, 11, 0.05)",
          gap: 2
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              bgcolor: "#fef3c7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#b45309",
              flexShrink: 0
            }}>
              <FaExclamationTriangle size={15} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: "11.5px", fontWeight: 800, color: "#92400e" }}>
                Warranty Renewal Action Required
              </Typography>
              <Typography sx={{ fontSize: "10px", color: "#b45309", mt: 0.1 }}>
                There are {criticalWarranties.length} asset{criticalWarranties.length > 1 ? 's' : ''} whose warranty will expire in the next 30 days. Please review and plan renewals.
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            size="small"
            onClick={() => {
              setWarrantyDays(30);
              const element = document.getElementById("expiring-warranties-card");
              if (element) {
                element.scrollIntoView({ behavior: "smooth" });
              }
            }}
            sx={{
              bgcolor: "#d97706",
              color: "#ffffff",
              fontSize: "9.5px",
              fontWeight: 800,
              px: 1.5,
              py: 0.5,
              textTransform: "none",
              borderRadius: "6px",
              boxShadow: "none",
              "&:hover": {
                bgcolor: "#b45309",
                boxShadow: "none"
              }
            }}
          >
            Review Renewals
          </Button>
        </Box>
      )}

      {/* ── Stat Ribbon (7 Symmetrical Columns with Clean Top Color Accents) ── */}
      <Box sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, 1fr)",
          sm: "repeat(3, 1fr)",
          md: "repeat(7, 1fr)"
        },
        gap: 2
      }}>
        <StatCard label="Total Assets" value={totalAssets} icon={<FaBoxes />} iconBg="#e8eaf6" iconColor="#3949ab" onClick={() => navigate("/home/assets")} />
        <StatCard label="Available" value={available} icon={<FaCheckCircle />} iconBg="#ecfdf5" iconColor="#10b981" onClick={() => navigate("/home/assets?status=AVAILABLE")} />
        <StatCard label="Assigned" value={assigned} icon={<FaTools />} iconBg="#eff6ff" iconColor="#2563eb" onClick={() => navigate("/home/assets?status=ASSIGNED")} />
        <StatCard label="Maintenance" value={underMaintenance} icon={<FaWrench />} iconBg="#fffbeb" iconColor="#d97706" onClick={() => navigate("/home/assets?status=UNDER_MAINTENANCE")} />
        <StatCard label="Damaged" value={damaged} icon={<FaExclamationTriangle />} iconBg="#fff1f2" iconColor="#f43f5e" onClick={() => navigate("/home/assets?status=DAMAGED")} />
        <StatCard label="Lost / Missing" value={lost} icon={<FaTimes />} iconBg="#fef2f2" iconColor="#ef4444" onClick={() => navigate("/home/assets?status=LOST")} />
        <Box sx={{ gridColumn: { xs: "span 2", sm: "span 3", md: "span 1" } }}>
          <StatCard label="Asset Utilization" value={totalAssets > 0 ? `${((assigned / totalAssets) * 100).toFixed(1)}%` : "0%"} icon={<FaChartPie />} iconBg="#f5f3ff" iconColor="#7c3aed" onClick={() => navigate("/home/allocation")} />
        </Box>
      </Box>

      {/* ── Main Layout Grid ── */}
      <Box sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          md: "repeat(2, 1fr)",
          lg: "repeat(3, 1fr)"
        },
        gap: 2
      }}>

        {/* Chart 1: Category Dominance Bar Chart */}
        <PremiumCard title="Asset Type breakdown" icon={<FaChartBar />} subtitle="Total count per category">
          <Box sx={{ width: "100%", height: 160, mt: 0.5 }}>
            {typeData.length === 0 ? (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                <Typography sx={{ fontSize: "10px", color: "#94a3b8" }}>No category logged</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData.slice(0, 5)} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="typeGrad-0" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.35} />
                    </linearGradient>
                    <linearGradient id="typeGrad-1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.35} />
                    </linearGradient>
                    <linearGradient id="typeGrad-2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d97706" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.35} />
                    </linearGradient>
                    <linearGradient id="typeGrad-3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#fda4af" stopOpacity={0.35} />
                    </linearGradient>
                    <linearGradient id="typeGrad-4" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#c084fc" stopOpacity={0.35} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#64748b", fontWeight: 750 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#64748b", fontWeight: 750 }} tickLine={false} axisLine={false} />
                  <ReTooltip content={<CustomTooltip unit="Assets" />} />
                  <Bar
                    dataKey="value"
                    fill="#2563eb"
                    radius={[4, 4, 0, 0]}
                    barSize={18}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`url(#typeGrad-${index % 5})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Box>
        </PremiumCard>

        {/* Chart 2: Company Distribution Bar Chart */}
        <PremiumCard title="Ownership Distribution" icon={<FaChartBar />} subtitle="Devices owned per company">
          <Box sx={{ width: "100%", height: 160, mt: 0.5 }}>
            {companyData.length === 0 ? (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                <Typography sx={{ fontSize: "10px", color: "#94a3b8" }}>No company records</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={companyData.slice(0, 5)} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="compGrad-0" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#c084fc" stopOpacity={0.35} />
                    </linearGradient>
                    <linearGradient id="compGrad-1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0891b2" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.35} />
                    </linearGradient>
                    <linearGradient id="compGrad-2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#fdbb2d" stopOpacity={0.35} />
                    </linearGradient>
                    <linearGradient id="compGrad-3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.35} />
                    </linearGradient>
                    <linearGradient id="compGrad-4" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.35} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#64748b", fontWeight: 750 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#64748b", fontWeight: 750 }} tickLine={false} axisLine={false} />
                  <ReTooltip content={<CustomTooltip unit="Assets" />} />
                  <Bar
                    dataKey="value"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                    barSize={18}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  >
                    {companyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`url(#compGrad-${index % 5})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Box>
        </PremiumCard>

        {/* Chart 3: Status Donut Graph */}
        <PremiumCard title="Asset Health Status" icon={<FaChartPie />} subtitle="Active operation state breakdown">
          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 160, mt: 0.5 }}>
            {/* Left: Donut Graph */}
            <Box sx={{ position: "relative", width: "48%", height: "100%" }}>
              <PremiumPieChart
                data={statusData}
                isDonut={true}
                innerRadius="60%"
                outerRadius="80%"
                paddingAngle={4}
                cornerRadius={4}
                centerValue={totalAssets}
                centerLabel="Total"
                activeIndex={statusActiveIdx}
                setActiveIndex={setStatusActiveIdx}
              />
            </Box>

            {/* Right: Custom Status Legend Column */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, width: "48%", pr: 0.5 }}>
              {[
                { label: "Available", val: available, color: "#10b981", bg: "#ecfdf5" },
                { label: "Assigned", val: assigned, color: "#2563eb", bg: "#eff6ff" },
                { label: "Maintenance", val: underMaintenance, color: "#d97706", bg: "#fffbeb" },
                { label: "Damaged", val: damaged, color: "#f43f5e", bg: "#fff1f2" },
                { label: "Lost", val: lost, color: "#ef4444", bg: "#fef2f2" }
              ].map((item) => (
                <Box key={item.label} sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  bgcolor: item.bg,
                  p: "5px 10px",
                  borderRadius: "6px",
                  border: "1px solid #f8fafc",
                  transition: "transform 0.2s ease",
                  "&:hover": {
                    transform: "scale(1.02)"
                  }
                }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: item.color }} />
                    <Typography sx={{ fontSize: "10.5px", fontWeight: 700, color: item.color }}>{item.label}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: "12px", fontWeight: 900, color: "#0f172a" }}>{item.val}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </PremiumCard>

        {/* Card 4: Regional deployment block */}
        <PremiumCard title="Asset Deployments per Site Location" icon={<FaChartBar />} subtitle="Site allocation statistics">
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
            {locationData.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 2 }}>
                <Typography sx={{ fontSize: "10px", color: "#94a3b8" }}>No deployment tracked</Typography>
              </Box>
            ) : (
              locationData.slice(0, 5).map((item, idx) => {
                const pct = Math.round((item.value / Math.max(totalAssets, 1)) * 100);
                const themeColor = CHART_COLORS[(idx + 4) % CHART_COLORS.length];
                return (
                  <Box key={item.name} sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <Box sx={locationBadgeSx(themeColor)}>
                          <FaMapMarkerAlt size={10} />
                        </Box>
                        <Typography sx={{ fontSize: "11px", fontWeight: 800, color: "#1e293b" }}>
                          {item.name}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                        <Typography sx={{ fontSize: "11.5px", fontWeight: 950, color: "#0f172a" }}>
                          {item.value}
                        </Typography>
                        <Typography sx={{ fontSize: "9px", fontWeight: 700, color: "#64748b" }}>
                          ({pct}%)
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ width: "100%", height: 5, bgcolor: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                      <Box sx={{
                        width: `${pct}%`,
                        height: "100%",
                        bgcolor: themeColor,
                        borderRadius: "3px",
                        transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
                      }} />
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        </PremiumCard>

        {/* Card 5: Recent Activities */}
        <PremiumCard title="Recent Activity Ledger" icon={<FaClock />} subtitle="Latest asset allocations & returns">
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
            {recentActivities.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 2 }}>
                <Typography sx={{ fontSize: "10px", color: "#94a3b8" }}>No recent activity logged</Typography>
              </Box>
            ) : (
              recentActivities.slice(0, 5).map((row, idx) => {
                const isActive = row.status === "ACTIVE";
                const isReturned = row.status === "RETURNED";
                const isOverdue = isActive && row.expectedReturnDate && row.expectedReturnDate < new Date().toISOString().split("T")[0];

                const badge = isOverdue ? { label: "Overdue", bg: "#fef3c7", color: "#d97706", border: "#f59e0b" }
                  : isReturned ? { label: "Returned", bg: "#f3e5f5", color: "#8b5cf6", border: "#8b5cf6" }
                    : { label: "Active", bg: "#ecfdf5", color: "#10b981", border: "#10b981" };

                return (
                  <Box
                    key={row.allocationId || idx}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: "8px 12px",
                      bgcolor: "#ffffff",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      borderLeft: `3px solid ${badge.border}`,
                      transition: "all 200ms ease",
                      "&:hover": {
                        transform: "translateX(3px)",
                        borderColor: "#cbd5e1",
                        boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)"
                      }
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                      <Avatar
                        src={getImageUrl(row.assetImagePath)}
                        variant="rounded"
                        sx={{
                          width: 26,
                          height: 26,
                          borderRadius: "6px",
                          bgcolor: isReturned ? "#f3e5f5" : isOverdue ? "#fff3e0" : "#e8f5e9",
                          color: isReturned ? "#6a1b9a" : isOverdue ? "#e65100" : "#2e7d32",
                          border: `1.5px solid ${isReturned ? "#d8b4fe" : isOverdue ? "#fde047" : "#a7f3d0"}`,
                          fontSize: "11px",
                          fontWeight: 800,
                          flexShrink: 0,
                          "& img": { objectFit: "cover" }
                        }}
                      >
                        {row.assetName?.charAt(0).toUpperCase() || "A"}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: "10.5px", fontWeight: 800, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {row.assetName}
                        </Typography>
                        <Typography sx={{ fontSize: "9px", color: "#64748b" }}>
                          {isReturned ? `Returned by ${row.assignedTo}` : `Assigned to ${row.assignedTo}`}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.25 }}>
                      <Typography sx={{ fontSize: "9px", fontWeight: 900, color: badge.color, bgcolor: badge.bg, px: 0.75, py: 0.15, borderRadius: "4px" }}>
                        {badge.label}
                      </Typography>
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        </PremiumCard>

        {/* Card 6: Quick Operations Panel */}
        <PremiumCard title="Alerts & Operations" icon={<FaInfoCircle />} subtitle="Attention items & quick links">
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 0.5 }}>

            {/* Alert Cards Container */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
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
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 8px rgba(217, 119, 6, 0.04)"
                  }
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 850, fontSize: "9px", color: "#b45309", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                    Warranty Expiring (30d)
                  </Typography>
                  <Typography sx={{ fontSize: "8.5px", fontWeight: 700, color: "#92400e", mt: 0.1 }}>
                    Assets requiring renewal review
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography sx={{ fontSize: "15px", fontWeight: 950, color: "#78350f" }}>
                    {warrantyExpiring}
                  </Typography>
                  <Box sx={{ bgcolor: "#fef3c7", color: "#d97706", borderRadius: "50%", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900 }}>
                    !
                  </Box>
                </Box>
              </Box>

              {/* Damaged assets alert box */}
              <Box
                onClick={() => navigate('/home/assets?status=DAMAGED')}
                sx={{
                  borderRadius: "6px",
                  border: "1px solid #fee2e2",
                  p: "6px 10px",
                  cursor: "pointer",
                  background: "linear-gradient(to bottom right, #fff5f5, #fff0f0)",
                  transition: "all 200ms ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 8px rgba(239, 68, 68, 0.04)"
                  }
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 850, fontSize: "9px", color: "#b91c1c", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                    Damaged Assets
                  </Typography>
                  <Typography sx={{ fontSize: "8.5px", fontWeight: 700, color: "#991b1b", mt: 0.1 }}>
                    Assets marked out of order
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography sx={{ fontSize: "15px", fontWeight: 950, color: "#7f1d1d" }}>
                    {damaged}
                  </Typography>
                  <Box sx={{ bgcolor: "#fee2e2", color: "#ef4444", borderRadius: "50%", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900 }}>
                    !
                  </Box>
                </Box>
              </Box>

              {/* Lost assets alert box */}
              <Box
                onClick={() => navigate('/home/assets?status=LOST')}
                sx={{
                  borderRadius: "6px",
                  border: "1px solid #fee2e2",
                  p: "6px 10px",
                  cursor: "pointer",
                  background: "linear-gradient(to bottom right, #fff5f5, #ffebee)",
                  transition: "all 200ms ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 8px rgba(239, 68, 68, 0.04)"
                  }
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 850, fontSize: "9px", color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                    Lost / Missing Assets
                  </Typography>
                  <Typography sx={{ fontSize: "8.5px", fontWeight: 700, color: "#c53030", mt: 0.1 }}>
                    Assets marked as lost
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography sx={{ fontSize: "15px", fontWeight: 950, color: "#9b2c2c" }}>
                    {lost}
                  </Typography>
                  <Box sx={{ bgcolor: "#fee2e2", color: "#ef4444", borderRadius: "50%", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900 }}>
                    <FaTimes size={7} />
                  </Box>
                </Box>
              </Box>

              {/* Under maintenance alert box */}
              <Box
                onClick={() => navigate('/home/assets?status=UNDER_MAINTENANCE')}
                sx={{
                  borderRadius: "6px",
                  border: "1px solid #dbeafe",
                  p: "6px 10px",
                  cursor: "pointer",
                  background: "linear-gradient(to bottom right, #eff6ff, #f0f7ff)",
                  transition: "all 200ms ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 8px rgba(59, 130, 246, 0.04)"
                  }
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 850, fontSize: "9px", color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                    Under Maintenance
                  </Typography>
                  <Typography sx={{ fontSize: "8.5px", fontWeight: 700, color: "#1e40af", mt: 0.1 }}>
                    Assets undergoing repairs
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography sx={{ fontSize: "15px", fontWeight: 950, color: "#1e3a8a" }}>
                    {underMaintenance}
                  </Typography>
                  <Box sx={{ bgcolor: "#dbeafe", color: "#3b82f6", borderRadius: "50%", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900 }}>
                    ⚙️
                  </Box>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ borderStyle: "dashed", borderColor: "#f1f5f9", my: 0.25 }} />

            {/* Fast links shortcuts */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Typography sx={{ fontSize: "7.5px", fontWeight: 850, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.25 }}>
                Quick Shortcuts
              </Typography>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.75 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/home/assets/new')}
                  startIcon={<FaPlus size={8} />}
                  sx={{ ...outlinedBtnSx, justifyContent: "flex-start", width: "100%", fontSize: "9.5px", py: 0.5 }}
                >
                  Register Asset
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/home/allocation')}
                  startIcon={<FaTools size={8} />}
                  sx={{ ...outlinedBtnSx, justifyContent: "flex-start", width: "100%", fontSize: "9.5px", py: 0.5 }}
                >
                  Allocate Asset
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/home/transfer')}
                  startIcon={<FaExchangeAlt size={8} />}
                  sx={{ ...outlinedBtnSx, justifyContent: "flex-start", width: "100%", fontSize: "9.5px", py: 0.5 }}
                >
                  Transfer Asset
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/home/disposal')}
                  startIcon={<FaTrashAlt size={8} />}
                  sx={{ ...outlinedBtnSx, justifyContent: "flex-start", width: "100%", fontSize: "9.5px", py: 0.5 }}
                >
                  Dispose Asset
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/home/assets/bulk-upload')}
                  startIcon={<FaUpload size={8} />}
                  sx={{ ...outlinedBtnSx, justifyContent: "flex-start", width: "100%", fontSize: "9.5px", py: 0.5 }}
                >
                  Bulk Import
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/home/reports')}
                  startIcon={<FaFileAlt size={8} />}
                  sx={{ ...outlinedBtnSx, justifyContent: "flex-start", width: "100%", fontSize: "9.5px", py: 0.5 }}
                >
                  View Reports
                </Button>
              </Box>
            </Box>
          </Box>
        </PremiumCard>

        {/* Card 7: Expiring Warranties */}
        <PremiumCard
          id="expiring-warranties-card"
          title="Expiring Warranties"
          icon={<FaCalendarAlt />}
          subtitle="Track upcoming hardware renewals"
          actions={
            <Select
              value={warrantyDays}
              onChange={(e) => setWarrantyDays(Number(e.target.value))}
              size="small"
              sx={{
                height: 24,
                fontSize: 10,
                fontWeight: 700,
                minWidth: 90,
                "& .MuiSelect-select": { py: "2.5px", px: "8px" }
              }}
            >
              <MenuItem value={30} sx={{ fontSize: 11 }}>30 Days</MenuItem>
              <MenuItem value={60} sx={{ fontSize: 11 }}>60 Days</MenuItem>
              <MenuItem value={90} sx={{ fontSize: 11 }}>90 Days</MenuItem>
            </Select>
          }
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 0.5, maxHeight: 180, overflowY: "auto" }}>
            {expiringAssets.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography sx={{ fontSize: "10px", color: "#94a3b8" }}>No warranties expiring in {warrantyDays} days</Typography>
              </Box>
            ) : (
              expiringAssets.slice(0, 5).map((asset) => {
                const exp = new Date(asset.warrantyExpiry);
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
                return (
                  <Box
                    key={asset.assetId}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: "6px 10px",
                      bgcolor: "#f8fafc",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0"
                    }}
                  >
                    <Box sx={{ minWidth: 0, mr: 1, flexGrow: 1 }}>
                      <Typography sx={{ fontSize: "10.5px", fontWeight: 800, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {asset.assetName}
                      </Typography>
                      <Typography sx={{ fontSize: "8.5px", color: "#64748b" }}>
                        {asset.assetCode} • {asset.brand}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.25 }}>
                      <Typography sx={{ fontSize: "10px", fontWeight: 900, color: diffDays <= 30 ? "#ef4444" : "#f59e0b" }}>
                        {diffDays} days left
                      </Typography>
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => {
                          dispatch(setAssetSearch(asset.assetCode));
                          dispatch(setAssetPage(0));
                          navigate("/home/assets");
                        }}
                        sx={{
                          fontSize: "8.5px",
                          fontWeight: 700,
                          minWidth: 0,
                          p: 0,
                          color: "#2563eb",
                          textTransform: "none",
                          "&:hover": { textDecoration: "underline", bgcolor: "transparent" }
                        }}
                      >
                        Manage
                      </Button>
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        </PremiumCard>

        {/* Card 8: Pending Transfer Approvals */}
        <PremiumCard
          title="Pending Transfer Approvals"
          icon={<FaExchangeAlt />}
          subtitle="Requests requiring admin response"
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 0.5, maxHeight: 180, overflowY: "auto" }}>
            {pendingTransfers.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography sx={{ fontSize: "10px", color: "#94a3b8" }}>No pending transfer requests</Typography>
              </Box>
            ) : (
              pendingTransfers.slice(0, 4).map((tx) => (
                <Box
                  key={tx.transferId}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.75,
                    p: "8px 10px",
                    bgcolor: "#f8fafc",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0"
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: "10.5px", fontWeight: 800, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {tx.assetName || `Asset #${tx.assetId}`}
                      </Typography>
                      <Typography sx={{ fontSize: "8.5px", color: "#64748b" }}>
                        From {tx.sourceLocationName} ➔ To {tx.destinationLocationName}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: "8px", fontWeight: 900, color: "#2563eb", bgcolor: "#eff6ff", px: 0.75, py: 0.15, borderRadius: "4px" }}>
                      Pending
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1, mt: 0.25 }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleApproveTransfer(tx.transferId)}
                      sx={{
                        fontSize: "8.5px",
                        py: "2px",
                        px: "8px",
                        textTransform: "none",
                        fontWeight: 700,
                        background: "#10b981",
                        color: "#ffffff",
                        "&:hover": { background: "#059669" }
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleRejectTransfer(tx.transferId)}
                      sx={{
                        fontSize: "8.5px",
                        py: "2px",
                        px: "8px",
                        textTransform: "none",
                        fontWeight: 700,
                        borderColor: "#ef4444",
                        color: "#ef4444",
                        "&:hover": { borderColor: "#dc2626", background: "#fef2f2" }
                      }}
                    >
                      Reject
                    </Button>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </PremiumCard>

        {/* Card 9: Procurement & Stock Alerts */}
        <PremiumCard
          title="Procurement & Stock Alerts"
          icon={<FaExclamationTriangle />}
          subtitle="Categories with low stock levels"
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 0.5, maxHeight: 180, overflowY: "auto" }}>
            {lowStockCategories.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography sx={{ fontSize: "10px", color: "#94a3b8" }}>All asset categories adequately stocked</Typography>
              </Box>
            ) : (
              lowStockCategories.map((cat) => {
                const isCritical = cat.value <= 3;
                return (
                  <Box
                    key={cat.name}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: "6px 10px",
                      bgcolor: isCritical ? "#fff5f5" : "#fffbeb",
                      borderRadius: "6px",
                      border: `1px solid ${isCritical ? "#fee2e2" : "#fef3c7"}`
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: "10.5px", fontWeight: 800, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {cat.name}
                      </Typography>
                      <Typography sx={{ fontSize: "8.5px", color: isCritical ? "#ef4444" : "#f59e0b" }}>
                        {isCritical ? "Critical: Stock levels extremely low" : "Reorder soon: Stock below threshold"}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                      <Typography sx={{ fontSize: "12px", fontWeight: 950, color: isCritical ? "#b91c1c" : "#b45309" }}>
                        {cat.value} Units
                      </Typography>
                      <Typography sx={{ fontSize: "8px", color: "#94a3b8" }}>
                        Min Threshold: 10
                      </Typography>
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        </PremiumCard>

      </Box>

    </Box>
  );
}
