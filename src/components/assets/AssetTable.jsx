import { useState } from "react";
import { Box, Typography, Tooltip } from "@mui/material";
import { FaEye, FaEdit, FaTrash, FaQrcode, FaHistory, FaLock, FaBoxes } from "react-icons/fa";
import { COLORS, STATUS_COLORS, CONDITION_COLORS } from "../../theme/tokens";
import { getImageUrl } from "../../services/assets_service";
import StatusPill from "../common/StatusPill";
import ActionBtn from "../common/ActionBtn";
import ImagePreviewDialog from "../common/ImagePreviewDialog";
import PremiumDataGrid from "../common/PremiumDataGrid";

export default function AssetTable({
  assets,
  loading,
  userRole = "user",
  page = 0,
  pageSize = 10,
  onView,
  onEdit,
  onDelete,
  onQR,
  onHistory,
  selectedIds = [],
  onSelectAll,
}) {
  const canEdit = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";
  const canSelect = userRole === "admin" || userRole === "manager";

  const selectedAssets = assets.filter((asset) => selectedIds.includes(asset.assetId));
  const firstSelectedCompany = selectedAssets[0]?.companyName;
  const firstSelectedLocation = selectedAssets[0]?.locationName;

  const isSelectable = (item) => {
    const status = item?.status?.toUpperCase();
    const isStatusSelectable = status === "AVAILABLE" || status === "UNDER_MAINTENANCE";
    if (!isStatusSelectable) return false;

    // If some assets are selected, restrict selection to the same company AND same location
    if (selectedIds.length > 0) {
      const matchCompany = !firstSelectedCompany || item.companyName === firstSelectedCompany;
      const matchLocation = !firstSelectedLocation || item.locationName === firstSelectedLocation;
      return matchCompany && matchLocation;
    }

    return true;
  };

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");

  const columns = [
    {
      field: "index",
      headerName: "#",
      fontFamily: "monospace",
      color: "#94a3b8",
      fontWeight: 700,
      fontSize: 10,
      renderCell: (item, index) => {
        const globalIndex = page * pageSize + index + 1;
        return String(globalIndex).padStart(2, "0");
      },
    },
    {
      field: "assetName",
      headerName: "Asset Name",
      sortable: true,
      renderCell: (item) => {
        const isDisposed = item.status?.toUpperCase() === "DISPOSED";
        const imageUrl = getImageUrl(item.imagePath);
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Box
              onClick={() =>
                imageUrl && (setPreviewSrc(imageUrl), setPreviewTitle(item.assetName), setPreviewOpen(true))
              }
              sx={{
                width: 26,
                height: 26,
                borderRadius: "6px",
                flexShrink: 0,
                cursor: imageUrl ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: isDisposed ? "#fee2e2" : imageUrl ? "#f1f5f9" : "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
                color: isDisposed ? "#ef4444" : "#3b82f6",
                border: "1px solid",
                borderColor: isDisposed ? "#fecaca" : imageUrl ? "#cbd5e1" : "#bbdefb",
                overflow: "hidden",
                boxShadow: imageUrl ? "0 1px 3px rgba(15, 23, 42, 0.05)" : "none",
                transition: "all 0.2s ease-in-out",
                "&:hover": imageUrl
                  ? {
                      transform: "scale(1.18)",
                      boxShadow: "0 4px 12px rgba(37, 99, 235, 0.18)",
                      borderColor: COLORS.primary,
                    }
                  : {},
              }}
            >
              {imageUrl ? (
                <img src={imageUrl} alt="asset" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <FaBoxes size={11} color="#3b82f6" style={{ opacity: 0.8 }} />
              )}
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#0f172a",
                  whiteSpace: "nowrap",
                  lineHeight: 1.25,
                }}
              >
                {item.assetName}
              </Typography>
              {isDisposed && (
                <Typography sx={{ fontSize: 9, color: "#ef4444", fontWeight: 500, lineHeight: 1 }}>
                  Permanently Disposed
                </Typography>
              )}
            </Box>
          </Box>
        );
      },
    },
    {
      field: "assetCode",
      headerName: "Asset Code",
      sortable: true,
      fontFamily: "monospace",
      color: "#475569",
      fontWeight: 600,
      fontSize: 10.5,
      renderCell: (item) => item.assetCode || "—",
    },
    {
      field: "cost",
      headerName: "Value",
      sortable: true,
      color: "#0f172a",
      fontWeight: 700,
      fontSize: 11,
      renderCell: (item) => (item.cost ? `₹${item.cost}` : "—"),
    },
    {
      field: "typeName",
      headerName: "Type",
      sortable: true,
      color: "#475569",
      fontSize: 11,
      renderCell: (item) => item.typeName || item.assetType?.typeName || "—",
    },
    {
      field: "locationName",
      headerName: "Location",
      sortable: true,
      renderCell: (item) => (
        <Box>
          <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: "#475569", lineHeight: 1.25 }}>
            {item.locationName || "—"}
          </Typography>
          {item.latitude !== null && item.longitude !== null && item.latitude !== undefined && (
            <Typography sx={{ fontSize: 9, color: "#64748b", fontFamily: "monospace", mt: 0.15 }}>
              {Number(item.latitude).toFixed(4)}, {Number(item.longitude).toFixed(4)}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: "companyName",
      headerName: "Company",
      sortable: true,
      color: "#475569",
      fontSize: 11,
      renderCell: (item) => item.companyName || "—",
    },
    {
      field: "status",
      headerName: "Status",
      sortable: true,
      renderCell: (item) => <StatusPill label={item.status} map={STATUS_COLORS} />,
    },
    {
      field: "assetCondition",
      headerName: "Condition",
      sortable: true,
      renderCell: (item) => <StatusPill label={item.assetCondition} map={CONDITION_COLORS} />,
    },
    {
      field: "actions",
      headerName: "Actions",
      renderCell: (item) => {
        const isDisposed = item.status?.toUpperCase() === "DISPOSED";
        const isAssigned = item.status?.toUpperCase() === "ASSIGNED";

        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <ActionBtn title="View" color="#2563eb" hoverBg="#eff6ff" onClick={() => onView(item)}>
              <FaEye size={11} />
            </ActionBtn>
            <ActionBtn title="QR Code" color="#7c3aed" hoverBg="#f5f3ff" onClick={() => onQR(item)}>
              <FaQrcode size={11} />
            </ActionBtn>
            <ActionBtn title="History" color="#0891b2" hoverBg="#f0f9ff" onClick={() => onHistory(item)}>
              <FaHistory size={11} />
            </ActionBtn>

            {canEdit &&
              (isAssigned ? (
                <Tooltip
                  arrow
                  placement="top"
                  title={
                    <Box sx={{ p: 0.5 }}>
                      <Typography fontSize={11} fontWeight={700} color="#fff" mb={0.25}>
                        Locked — In Use
                      </Typography>
                      <Typography fontSize={10} color="rgba(255,255,255,0.75)">
                        Return from Allocation page to edit
                      </Typography>
                    </Box>
                  }
                >
                  <span>
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 24,
                        height: 24,
                        borderRadius: "6px",
                        border: "1px solid #e2e8f0",
                        color: "#cbd5e1",
                        cursor: "not-allowed",
                      }}
                    >
                      <FaLock size={10} />
                    </Box>
                  </span>
                </Tooltip>
              ) : (
                <Tooltip title={isDisposed ? "Cannot edit a disposed asset" : "Edit"} arrow>
                  <span>
                    <ActionBtn
                      color="#d97706"
                      hoverBg="#fffbeb"
                      onClick={() => !isDisposed && onEdit(item)}
                      disabled={isDisposed}
                    >
                      <FaEdit size={11} />
                    </ActionBtn>
                  </span>
                </Tooltip>
              ))}

            {canDelete &&
              (isAssigned ? (
                <Tooltip
                  arrow
                  placement="top"
                  title={
                    <Box sx={{ p: 0.5 }}>
                      <Typography fontSize={11} fontWeight={700} color="#fff" mb={0.25}>
                        Locked — Assigned
                      </Typography>
                      <Typography fontSize={10} color="rgba(255,255,255,0.75)">
                        Cannot delete an assigned asset. Return it first.
                      </Typography>
                    </Box>
                  }
                >
                  <span>
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 24,
                        height: 24,
                        borderRadius: "6px",
                        border: "1px solid #e2e8f0",
                        color: "#cbd5e1",
                        cursor: "not-allowed",
                      }}
                    >
                      <FaLock size={10} />
                    </Box>
                  </span>
                </Tooltip>
              ) : (
                <ActionBtn
                  title="Delete"
                  color="#ef4444"
                  hoverBg="#fff1f2"
                  onClick={() => onDelete(item.assetId)}
                >
                  <FaTrash size={11} />
                </ActionBtn>
              ))}
          </Box>
        );
      },
    },
  ];

  const getRowStyle = (row) => {
    const isDisposed = row.status?.toUpperCase() === "DISPOSED";
    return {
      rowStyle: {
        opacity: isDisposed ? 0.5 : 1,
        "& td": {
          background: isDisposed ? "#fff5f5" : "transparent",
          borderBottom: "1px solid #f1f5f9",
        },
      },
    };
  };

  const emptyStateNode = (
    <Box sx={{ textAlign: "center", py: 8, animation: "fadeUp 300ms ease both" }}>
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: "16px",
          bgcolor: "#f0f9ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mx: "auto",
          mb: 2,
        }}
      >
        <FaBoxes size={28} color="#93c5fd" />
      </Box>
      <Typography sx={{ color: "#64748b", fontSize: 14, fontWeight: 600 }}>No assets found</Typography>
      <Typography sx={{ color: "#94a3b8", fontSize: 12, mt: 0.5 }}>Try adjusting your filters</Typography>
    </Box>
  );

  return (
    <Box>
      <PremiumDataGrid
        columns={columns}
        rows={assets}
        loading={loading}
        rowIdField="assetId"
        checkboxSelection={canSelect}
        selectedRowIds={selectedIds}
        onSelectionChange={onSelectAll}
        isRowSelectable={isSelectable}
        getRowStyle={getRowStyle}
        page={page}
        pageSize={pageSize}
        emptyMessage={emptyStateNode}
      />

      <ImagePreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        imageUrl={previewSrc}
        title={previewTitle}
      />
    </Box>
  );
}
