import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function PremiumPieChart({
  data = [],
  colors = ["#2563eb", "#10b981", "#d97706", "#f43f5e", "#8b5cf6", "#0891b2", "#f97316"],
  isDonut = true,
  innerRadius,
  outerRadius = "80%",
  paddingAngle = 4,
  cornerRadius = 4,
  centerIcon,
  centerValue,
  centerLabel = "Total",
  activeIndex: externalActiveIdx,
  setActiveIndex: externalSetActiveIdx,
  emptyColor = "#f1f5f9"
}) {
  const [internalActiveIdx, setInternalActiveIdx] = useState(null);

  const activeIdx = externalActiveIdx !== undefined ? externalActiveIdx : internalActiveIdx;
  const setActiveIdx = externalSetActiveIdx !== undefined ? externalSetActiveIdx : setInternalActiveIdx;

  const actualInnerRadius = innerRadius !== undefined ? innerRadius : (isDonut ? "60%" : "0%");
  const hasData = data.length > 0;
  const chartData = hasData ? data : [{ name: "No Data", value: 1 }];

  // Center display resolution
  const renderCenter = () => {
    if (!isDonut) return null;

    const activeItem = activeIdx !== null && data[activeIdx] ? data[activeIdx] : null;

    if (activeItem) {
      return (
        <>
          <Typography noWrap sx={{ fontSize: "14px", fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>
            {activeItem.value}
          </Typography>
          <Typography noWrap sx={{ fontSize: "7.5px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", mt: 0.2, maxWidth: "75%", textAlign: "center" }}>
            {activeItem.name}
          </Typography>
        </>
      );
    }

    if (centerValue !== undefined) {
      return (
        <>
          <Typography sx={{ fontSize: "14px", fontWeight: 950, color: "#0f172a", lineHeight: 1 }}>
            {centerValue}
          </Typography>
          <Typography sx={{ fontSize: "7.5px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", mt: 0.1 }}>
            {centerLabel}
          </Typography>
        </>
      );
    }

    if (centerIcon) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          {centerIcon}
        </Box>
      );
    }

    return null;
  };

  return (
    <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={actualInnerRadius}
            outerRadius={outerRadius}
            paddingAngle={hasData ? paddingAngle : 0}
            cornerRadius={hasData ? cornerRadius : 0}
            dataKey="value"
            onMouseEnter={(_, index) => {
              if (hasData) setActiveIdx(index);
            }}
            onMouseLeave={() => setActiveIdx(null)}
          >
            {chartData.map((entry, index) => {
              const cellColor = hasData
                ? (entry.color || colors[index % colors.length])
                : emptyColor;
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={cellColor}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                />
              );
            })}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {isDonut && (
        <Box sx={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          pointerEvents: "none"
        }}>
          {renderCenter()}
        </Box>
      )}
    </Box>
  );
}
