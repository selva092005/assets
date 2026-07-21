import { useState, useMemo, Fragment } from "react";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Box,
  Typography,
  Checkbox,
} from "@mui/material";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { COLORS } from "../../theme/tokens";

// ── Custom Checkbox Icons ───────────────────────────────────────────────────
const CustomCheckboxIcon = () => (
  <Box
    sx={{
      width: 14,
      height: 14,
      borderRadius: "3px",
      border: "1.2px solid #cbd5e1",
      bgcolor: "#ffffff",
      transition: "all 120ms cubic-bezier(0.4, 0, 0.2, 1)",
      "&:hover": {
        borderColor: "#94a3b8",
        bgcolor: "#f8fafc",
      },
    }}
  />
);

const CustomCheckboxCheckedIcon = () => (
  <Box
    sx={{
      width: 14,
      height: 14,
      borderRadius: "3px",
      background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
      border: "1.2px solid #2563eb",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 1px 3px rgba(37, 99, 235, 0.25)",
      color: "#ffffff",
      transform: "scale(1.05)",
      transition: "all 150ms cubic-bezier(0.175, 0.885, 0.32, 1.15)",
    }}
  />
);

const CustomCheckboxIndeterminateIcon = () => (
  <Box
    sx={{
      width: 14,
      height: 14,
      borderRadius: "3px",
      background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
      border: "1.2px solid #2563eb",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 1px 3px rgba(37, 99, 235, 0.25)",
      color: "#ffffff",
      transform: "scale(1.05)",
      transition: "all 150ms cubic-bezier(0.175, 0.885, 0.32, 1.15)",
    }}
  >
    <Box sx={{ width: 6, height: 1.5, bgcolor: "#ffffff", borderRadius: "0.5px" }} />
  </Box>
);

// Helper to access nested keys in objects (e.g. "assetType.typeName")
const getNestedValue = (obj, path) => {
  if (!obj || !path) return "";
  return path.split(".").reduce((acc, part) => acc && acc[part], obj) ?? "";
};

export default function PremiumDataGrid({
  columns,
  rows = [],
  loading = false,
  rowIdField = "id",
  checkboxSelection = false,
  selectedRowIds = [],
  onSelectionChange,
  isRowSelectable,
  onRowClick,
  getRowStyle,
  renderRowDetails,
  emptyMessage = "No records found",
}) {
  // Local sorting state (used when no external sort model is provided)
  const [localSort, setLocalSort] = useState({ field: null, direction: null });

  const handleHeaderClick = (col) => {
    if (!col.sortable) return;

    let nextDirection = null;
    if (localSort.field !== col.field) {
      nextDirection = "asc";
    } else if (localSort.direction === "asc") {
      nextDirection = "desc";
    } else if (localSort.direction === "desc") {
      nextDirection = null;
    }

    setLocalSort({ field: nextDirection ? col.field : null, direction: nextDirection });
  };

  // Perform client-side sorting if localSort is active
  const sortedRows = useMemo(() => {
    if (!localSort.field || !localSort.direction) return rows;

    const sorted = [...rows];
    const { field, direction } = localSort;

    sorted.sort((a, b) => {
      const valA = getNestedValue(a, field);
      const valB = getNestedValue(b, field);

      // Handle numbers
      if (typeof valA === "number" && typeof valB === "number") {
        return direction === "asc" ? valA - valB : valB - valA;
      }

      // Handle strings
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();

      if (strA < strB) return direction === "asc" ? -1 : 1;
      if (strA > strB) return direction === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [rows, localSort]);

  const selectableRows = useMemo(() => {
    if (!checkboxSelection) return [];
    return rows.filter((row) => (isRowSelectable ? isRowSelectable(row) : true));
  }, [rows, checkboxSelection, isRowSelectable]);

  const allSelectableIds = useMemo(() => {
    return selectableRows.map((r) => r[rowIdField]);
  }, [selectableRows, rowIdField]);

  const isAllSelected = useMemo(() => {
    if (allSelectableIds.length === 0) return false;
    return allSelectableIds.every((id) => selectedRowIds.includes(id));
  }, [allSelectableIds, selectedRowIds]);

  const isSomeSelected = useMemo(() => {
    if (allSelectableIds.length === 0) return false;
    const selectedCount = allSelectableIds.filter((id) => selectedRowIds.includes(id)).length;
    return selectedCount > 0 && selectedCount < allSelectableIds.length;
  }, [allSelectableIds, selectedRowIds]);

  const handleSelectAllChange = (e) => {
    if (!onSelectionChange) return;

    if (e.target.checked) {
      // Add all current page selectable IDs to selection
      const newSelection = Array.from(new Set([...selectedRowIds, ...allSelectableIds]));
      onSelectionChange(newSelection);
    } else {
      // Remove all current page selectable IDs from selection
      const newSelection = selectedRowIds.filter((id) => !allSelectableIds.includes(id));
      onSelectionChange(newSelection);
    }
  };

  const handleRowSelectChange = (rowId) => {
    if (!onSelectionChange) return;

    if (selectedRowIds.includes(rowId)) {
      onSelectionChange(selectedRowIds.filter((id) => id !== rowId));
    } else {
      onSelectionChange([...selectedRowIds, rowId]);
    }
  };

  return (
    <Box
      sx={{
        "@keyframes fadeUp": {
          from: { opacity: 0, transform: "translateY(10px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      <Table sx={{ minWidth: 750, tableLayout: "auto", borderCollapse: "collapse" }}>
        <TableHead>
          <TableRow>
            {checkboxSelection && (
              <TableCell
                sx={{
                  width: 40,
                  p: "6px 8px",
                  textAlign: "center",
                  background: "#f8fafc",
                  borderBottom: "2px solid #e2e8f0",
                }}
              >
                <Checkbox
                  size="small"
                  icon={<CustomCheckboxIcon />}
                  checkedIcon={<CustomCheckboxCheckedIcon />}
                  indeterminateIcon={<CustomCheckboxIndeterminateIcon />}
                  checked={isAllSelected}
                  indeterminate={isSomeSelected}
                  onChange={handleSelectAllChange}
                  sx={{ p: 0.5 }}
                />
              </TableCell>
            )}

            {columns.map((col) => {
              const isSorted = localSort.field === col.field;
              return (
                <TableCell
                  key={col.field || col.headerName}
                  onClick={() => handleHeaderClick(col)}
                  align={col.align || "left"}
                  sx={{
                    fontWeight: 700,
                    color: isSorted ? COLORS.primary : "#64748b",
                    background: "#f8fafc",
                    borderBottom: "2px solid #e2e8f0",
                    whiteSpace: "nowrap",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    fontSize: 11,
                    cursor: col.sortable ? "pointer" : "default",
                    userSelect: "none",
                    width: col.width || "auto",
                    transition: "all 120ms ease",
                    "&:hover": col.sortable
                      ? {
                          color: COLORS.primary,
                          background: "#f1f5f9",
                        }
                      : {},
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      justifyContent:
                        col.align === "right"
                          ? "flex-end"
                          : col.align === "center"
                          ? "center"
                          : "flex-start",
                    }}
                  >
                    <span>{col.headerName}</span>
                    {col.sortable && (
                      <Box
                        sx={{
                          display: "inline-flex",
                          color: isSorted ? COLORS.primary : "#cbd5e1",
                          fontSize: 10,
                          transition: "color 150ms ease",
                        }}
                      >
                        {localSort.field === col.field ? (
                          localSort.direction === "asc" ? (
                            <FaSortUp />
                          ) : (
                            <FaSortDown />
                          )
                        ) : (
                          <FaSort style={{ opacity: 0.5 }} />
                        )}
                      </Box>
                    )}
                  </Box>
                </TableCell>
              );
            })}
          </TableRow>
        </TableHead>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + (checkboxSelection ? 1 : 0)}
                sx={{ border: 0, py: 8, textAlign: "center" }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    mx: "auto",
                    border: "3px solid #e2e8f0",
                    borderTopColor: COLORS.primary,
                    animation: "spin 0.8s linear infinite",
                    "@keyframes spin": { to: { transform: "rotate(360deg)" } },
                  }}
                />
                <Typography sx={{ mt: 2, color: "#94a3b8", fontSize: 12 }}>
                  Loading…
                </Typography>
              </TableCell>
            </TableRow>
          ) : sortedRows.length > 0 ? (
            sortedRows.map((row, i) => {
              const rowId = row[rowIdField];
              const isSelected = selectedRowIds.includes(rowId);
              const customStyle = getRowStyle ? getRowStyle(row, i) : {};

              const rowSelectable = isRowSelectable ? isRowSelectable(row) : true;

              return (
                <Fragment key={rowId || i}>
                  <TableRow
                    onClick={() => onRowClick && onRowClick(row)}
                    sx={{
                      cursor: onRowClick ? "pointer" : "default",
                      animation: "fadeUp 250ms ease both",
                      animationDelay: `${i * 30}ms`,
                      borderLeft: isSelected
                        ? `3px solid ${COLORS.primary}`
                        : "3px solid transparent",
                      background: isSelected
                        ? "linear-gradient(90deg, rgba(37, 99, 235, 0.04) 0%, rgba(255, 255, 255, 0) 100%)"
                        : "transparent",
                      transition: "border-color 180ms ease, background 180ms ease",
                      "&:hover": {
                        borderLeft: `3px solid ${COLORS.primary}`,
                        background: isSelected
                          ? "linear-gradient(90deg, rgba(37, 99, 235, 0.08) 0%, rgba(255, 255, 255, 0) 100%)"
                          : "#f0f7ff",
                      },
                      "& td": {
                        borderBottom: "1px solid #f1f5f9",
                      },
                      ...customStyle.rowStyle,
                    }}
                  >
                    {checkboxSelection && (
                      <TableCell
                        onClick={(e) => e.stopPropagation()} // Prevent triggering onRowClick when selecting checkbox
                        sx={{ p: "4px 8px", textAlign: "center", verticalAlign: "middle" }}
                      >
                        <Checkbox
                          size="small"
                          icon={<CustomCheckboxIcon />}
                          checkedIcon={<CustomCheckboxCheckedIcon />}
                          indeterminateIcon={<CustomCheckboxIndeterminateIcon />}
                          disabled={!rowSelectable}
                          checked={isSelected}
                          onChange={() => handleRowSelectChange(rowId)}
                          sx={{
                            p: 0.5,
                            "&.Mui-disabled": {
                              opacity: 0.45,
                              "& > div": {
                                border: "1.5px solid #e2e8f0",
                                bgcolor: "#f1f5f9",
                              },
                            },
                          }}
                        />
                      </TableCell>
                    )}

                    {columns.map((col) => {
                      const value = getNestedValue(row, col.field);

                      return (
                        <TableCell
                          key={col.field || col.headerName}
                          align={col.align || "left"}
                          sx={{
                            verticalAlign: "middle",
                            fontFamily: col.fontFamily || "inherit",
                            fontSize: col.fontSize || 11.5,
                            color: col.color || "#334155",
                            fontWeight: col.fontWeight || 400,
                            py: col.py || 1.25,
                            px: col.px || 2,
                            ...customStyle.cellStyle,
                          }}
                        >
                          {col.renderCell ? col.renderCell(row, i) : String(value ?? "")}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  {renderRowDetails && renderRowDetails(row, i)}
                </Fragment>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length + (checkboxSelection ? 1 : 0)}
                sx={{ textAlign: "center", py: 8, color: "#94a3b8" }}
              >
                {typeof emptyMessage === "string" ? (
                  <Typography variant="body2" sx={{ fontSize: 12 }}>
                    {emptyMessage}
                  </Typography>
                ) : (
                  emptyMessage
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Box>
  );
}
