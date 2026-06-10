import React from "react";
import { Chip } from "@mui/material";
import { STATUS_COLORS, CONDITION_COLORS, chipSx } from "../../theme/tokens";

const EXTRA_STYLES = {
  // Transfer Statuses
  PENDING: { bg: "#fef3c7", color: "#b45309" },
  APPROVED: { bg: "#d1fae5", color: "#065f46" },
  REJECTED: { bg: "#fee2e2", color: "#991b1b" },

  // Disposal Methods
  SOLD: { bg: "#e8f5e9", color: "#2e7d32" },
  SCRAPPED: { bg: "#fff3e0", color: "#e65100" },
  DONATED: { bg: "#e3f2fd", color: "#1565c0" },

  // Allocation Statuses
  ACTIVE: { bg: "#e8f5e9", color: "#2e7d32" },
  RETURNED: { bg: "#f3f4f6", color: "#6b7280" },

  // Bulk Upload Statuses
  COMPLETED_WITH_ERRORS: { bg: "#fffbeb", color: "#d97706" },
  FAILED: { bg: "#fef2f2", color: "#dc2626" },
  SUCCESS: { bg: "#f0fdf4", color: "#16a34a" },
  COMPLETED: { bg: "#f0fdf4", color: "#16a34a" },
};

const ALL_MAPPINGS = {
  ...STATUS_COLORS,
  ...CONDITION_COLORS,
  ...EXTRA_STYLES,
};

export default function StatusBadge({ status, label }) {
  if (!status) return null;
  const key = status.toString().toUpperCase();
  const style = ALL_MAPPINGS[key] || { bg: "#f3f4f6", color: "#6b7280" };

  let displayLabel = label || status;
  if (key === "COMPLETED_WITH_ERRORS") displayLabel = "Errors Found";
  else if (key === "COMPLETED" || key === "SUCCESS") displayLabel = "Success";
  else if (key === "FAILED") displayLabel = "Failed";

  return (
    <Chip
      label={displayLabel}
      size="small"
      sx={chipSx(style)}
    />
  );
}
