import React from "react";
import { Table, TableBody, TableCell, TableHead, TableRow, Skeleton, Box } from "@mui/material";

// ── 1. Table Skeleton ──────────────────────────────────────────────────────────
export function TableSkeleton({ rowCount = 5, columnCount = 6 }) {
  const rows = Array.from({ length: rowCount });
  const cols = Array.from({ length: columnCount });

  return (
    <Box sx={{ width: "100%", overflowX: "auto", background: "#ffffff" }}>
      <Table size="small" sx={{ minWidth: 600, borderCollapse: "collapse" }}>
        <TableHead>
          <TableRow>
            {cols.map((_, colIdx) => (
              <TableCell 
                key={`th-${colIdx}`}
                sx={{
                  background: "#f8fafc",
                  borderBottom: "2px solid #e2e8f0",
                  py: 1,
                  px: 2,
                }}
              >
                <Skeleton 
                  variant="text" 
                  width={colIdx === 0 ? 30 : colIdx === cols.length - 1 ? 60 : 80} 
                  height={15} 
                  animation="wave" 
                  sx={{ bgcolor: "#e2e8f0" }}
                />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((_, rowIdx) => (
            <TableRow 
              key={`tr-${rowIdx}`}
              sx={{
                borderBottom: "1px solid #f1f5f9",
                "&:hover": { background: "#fafbfc" }
              }}
            >
              {cols.map((_, colIdx) => (
                <TableCell key={`td-${rowIdx}-${colIdx}`} sx={{ py: 0.75, px: 2 }}>
                  {colIdx === 0 ? (
                    <Skeleton variant="rounded" width={20} height={14} animation="wave" sx={{ borderRadius: "4px", bgcolor: "#f1f5f9" }} />
                  ) : colIdx === cols.length - 1 ? (
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Skeleton variant="rounded" width={22} height={22} animation="wave" sx={{ borderRadius: "4px", bgcolor: "#f1f5f9" }} />
                      <Skeleton variant="rounded" width={22} height={22} animation="wave" sx={{ borderRadius: "4px", bgcolor: "#f1f5f9" }} />
                    </Box>
                  ) : (
                    <Skeleton 
                      variant="text" 
                      width={colIdx % 2 === 0 ? "75%" : "90%"} 
                      height={14} 
                      animation="wave" 
                      sx={{ bgcolor: "#f1f5f9" }}
                    />
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

// ── 2. Detail / Form Skeleton ───────────────────────────────────────────────────
export function DetailSkeleton() {
  return (
    <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" }, width: "100%", p: 1 }}>
      {/* Left mini panel skeleton */}
      <Box sx={{
        width: { xs: "100%", sm: 140 },
        height: 160,
        flexShrink: 0,
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "6px",
        p: 1.5,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5
      }}>
        <Skeleton variant="circular" width={64} height={64} animation="wave" sx={{ bgcolor: "#e2e8f0" }} />
        <Skeleton variant="text" width={80} height={15} animation="wave" sx={{ bgcolor: "#e2e8f0" }} />
        <Skeleton variant="rounded" width={60} height={16} animation="wave" sx={{ borderRadius: "10px", bgcolor: "#e2e8f0" }} />
      </Box>

      {/* Right details grid skeleton */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
          {Array.from({ length: 6 }).map((_, idx) => (
            <Box key={idx} sx={{ borderBottom: "1px solid #f1f5f9", pb: 0.5 }}>
              <Skeleton variant="text" width={60} height={12} animation="wave" sx={{ bgcolor: "#f1f5f9" }} />
              <Skeleton variant="text" width="85%" height={16} animation="wave" sx={{ mt: 0.5, bgcolor: "#e2e8f0" }} />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

// ── 3. Dashboard / Reports Skeleton ──────────────────────────────────────────────
export function DashboardSkeleton() {
  return (
    <Box sx={{ p: 0, display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
      {/* Page header skeleton */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Skeleton variant="text" width={240} height={24} animation="wave" sx={{ bgcolor: "#e2e8f0" }} />
          <Skeleton variant="text" width={340} height={14} animation="wave" sx={{ bgcolor: "#f1f5f9" }} />
        </Box>
        <Skeleton variant="rounded" width={100} height={36} animation="wave" sx={{ borderRadius: "8px", bgcolor: "#e2e8f0" }} />
      </Box>

      {/* Stat Ribbon (6 boxes) */}
      <Box sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, 1fr)",
          sm: "repeat(3, 1fr)",
          md: "repeat(6, 1fr)"
        },
        gap: 2
      }}>
        {Array.from({ length: 6 }).map((_, idx) => (
          <Box key={idx} sx={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            p: 1.5,
            display: "flex",
            flexDirection: "column",
            gap: 1
          }}>
            <Skeleton variant="circular" width={24} height={24} animation="wave" sx={{ bgcolor: "#f1f5f9" }} />
            <Skeleton variant="text" width="50%" height={12} animation="wave" sx={{ bgcolor: "#f1f5f9" }} />
            <Skeleton variant="text" width="75%" height={24} animation="wave" sx={{ bgcolor: "#e2e8f0" }} />
          </Box>
        ))}
      </Box>

      {/* Charts / Premium Cards Grid (6 cards) */}
      <Box sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          md: "repeat(2, 1fr)",
          lg: "repeat(3, 1fr)"
        },
        gap: 2
      }}>
        {Array.from({ length: 6 }).map((_, idx) => (
          <Box key={idx} sx={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            p: 2,
            minHeight: 220,
            display: "flex",
            flexDirection: "column",
            gap: 1.5
          }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Skeleton variant="text" width="60%" height={16} animation="wave" sx={{ bgcolor: "#e2e8f0" }} />
              <Skeleton variant="circular" width={16} height={16} animation="wave" sx={{ bgcolor: "#f1f5f9" }} />
            </Box>
            <Skeleton variant="text" width="40%" height={12} animation="wave" sx={{ mb: 1, bgcolor: "#f1f5f9" }} />
            <Skeleton variant="rounded" width="100%" height={110} animation="wave" sx={{ borderRadius: "8px", bgcolor: "#f1f5f9", flexGrow: 1 }} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ── 4. List Page Skeleton ───────────────────────────────────────────────────────
export function ListPageSkeleton({ statCount = 4, columnCount = 6, rowCount = 5, hasTabs = false }) {
  return (
    <Box sx={{ p: 0, display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
      {/* Header Section */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Skeleton variant="text" width={220} height={26} animation="wave" sx={{ bgcolor: "#e2e8f0" }} />
          <Skeleton variant="text" width={320} height={14} animation="wave" sx={{ bgcolor: "#f1f5f9" }} />
        </Box>
        <Skeleton variant="rounded" width={110} height={36} animation="wave" sx={{ borderRadius: "8px", bgcolor: "#e2e8f0" }} />
      </Box>

      {/* Stat Ribbon */}
      {statCount > 0 && (
        <Box sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            sm: `repeat(${Math.min(statCount, 3)}, 1fr)`,
            md: `repeat(${statCount}, 1fr)`
          },
          gap: 2,
          mb: 0.5
        }}>
          {Array.from({ length: statCount }).map((_, idx) => (
            <Box key={idx} sx={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              p: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 1.5
            }}>
              <Skeleton variant="circular" width={28} height={28} animation="wave" sx={{ bgcolor: "#f1f5f9" }} />
              <Box sx={{ flexGrow: 1 }}>
                <Skeleton variant="text" width="40%" height={12} animation="wave" sx={{ bgcolor: "#f1f5f9" }} />
                <Skeleton variant="text" width="60%" height={20} animation="wave" sx={{ bgcolor: "#e2e8f0", mt: 0.5 }} />
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Optional Tabs */}
      {hasTabs && (
        <Box sx={{ display: "flex", gap: 1, borderBottom: "1px solid #e2e8f0", pb: 1 }}>
          <Skeleton variant="rounded" width={100} height={32} animation="wave" sx={{ borderRadius: "6px", bgcolor: "#e2e8f0" }} />
          <Skeleton variant="rounded" width={120} height={32} animation="wave" sx={{ borderRadius: "6px", bgcolor: "#f1f5f9" }} />
        </Box>
      )}

      {/* Search and Filter Bar */}
      <Box sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 1.5,
        p: 1.5,
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "8px"
      }}>
        <Skeleton variant="rounded" width="40%" height={32} animation="wave" sx={{ borderRadius: "6px", bgcolor: "#f1f5f9", minWidth: 200 }} />
        <Skeleton variant="rounded" width={100} height={32} animation="wave" sx={{ borderRadius: "6px", bgcolor: "#f1f5f9" }} />
        <Skeleton variant="rounded" width={120} height={32} animation="wave" sx={{ borderRadius: "6px", bgcolor: "#f1f5f9" }} />
        <Box sx={{ flexGrow: 1 }} />
        <Skeleton variant="circular" width={32} height={32} animation="wave" sx={{ bgcolor: "#f1f5f9" }} />
      </Box>

      {/* Data Grid Table Card */}
      <Box sx={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        p: 2,
        display: "flex",
        flexDirection: "column",
        gap: 1.5
      }}>
        {/* Table Header Row */}
        <Box sx={{ display: "flex", gap: 2, pb: 1, borderBottom: "2px solid #e2e8f0" }}>
          {Array.from({ length: columnCount }).map((_, cIdx) => (
            <Skeleton key={cIdx} variant="text" width={`${80 / columnCount}%`} height={18} animation="wave" sx={{ bgcolor: "#e2e8f0", flexGrow: 1 }} />
          ))}
        </Box>

        {/* Table Data Rows */}
        {Array.from({ length: rowCount }).map((_, rIdx) => (
          <Box key={rIdx} sx={{ display: "flex", gap: 2, py: 1.2, borderBottom: "1px solid #f1f5f9", alignItems: "center" }}>
            {Array.from({ length: columnCount }).map((_, cIdx) => (
              <Skeleton key={cIdx} variant="rounded" width={`${85 / columnCount}%`} height={14} animation="wave" sx={{ bgcolor: "#f1f5f9", flexGrow: 1, borderRadius: "4px" }} />
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ── Main Route Component ───────────────────────────────────────────────────────
export default function SkeletonLoader({ variant = "table", ...props }) {
  switch (variant) {
    case "list":
      return <ListPageSkeleton {...props} />;
    case "detail":
      return <DetailSkeleton {...props} />;
    case "dashboard":
      return <DashboardSkeleton {...props} />;
    case "table":
    default:
      return <TableSkeleton {...props} />;
  }
}
