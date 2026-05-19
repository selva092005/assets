import { Box, Chip, Modal } from "@mui/material";
import { useState } from "react";
import { FaBox } from "react-icons/fa";
import { getImageUrl } from "../../services/assets_service";
import { COLORS, STATUS_COLORS, CONDITION_COLORS } from "../../theme/tokens";
import ViewModal from "../common/ViewModal";

const FIELDS = [
  ["Asset ID",        "assetId"],
  ["Asset Code",      "assetCode"],
  ["Serial No.",      "serialNumber"],
  ["Brand",           "brand"],
  ["Model",           "model"],
  ["Type",            "typeName"],
  ["Company",         "companyName"],
  ["Purchase Date",   "purchaseDate"],
  ["Warranty Expiry", "warrantyExpiry"],
  ["Created At",      "createdAt"],
  ["Updated At",      "updatedAt"],
  ["Cost",            "cost"],
  ["Location",        "locationName"],
  ["Notes",           "notes"],
];

export default function AssetView({ open, data, onClose }) {
  const [imgOpen, setImgOpen] = useState(false);
  const imageUrl  = getImageUrl(data?.imagePath);
  const statusClr = STATUS_COLORS[data?.status]         || { bg: "#f5f5f5", color: "#555" };
  const condClr   = CONDITION_COLORS[data?.assetCondition] || { bg: "#f5f5f5", color: "#555" };

  // ── Header slot: image thumbnail + status/condition pills + QR ──
  const header = (
    <Box
      sx={{
        display: "flex", alignItems: "center", gap: 1.5,
        px: 2.5, py: 1.5,
        background: COLORS.bg,
        borderBottom: `1px solid ${COLORS.borderLight}`,
      }}
    >
      {/* Asset image or placeholder */}
      <Box
        sx={{
          width: 72, height: 56, flexShrink: 0,
          borderRadius: "8px",
          border: `1px solid ${COLORS.border}`,
          background: COLORS.surface,
          overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {imageUrl
          ? <img src={imageUrl} alt="asset"
              onClick={() => setImgOpen(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in" }} />
          : <FaBox size={22} color={COLORS.textFaint} />
        }
      </Box>

      {/* Status + condition pills */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 0.6 }}>
        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
          {data?.status && (
            <Chip
              label={data.status}
              size="small"
              sx={{ background: statusClr.bg, color: statusClr.color,
                    fontWeight: 700, fontSize: 11, height: 22, borderRadius: "20px" }}
            />
          )}
          {data?.assetCondition && (
            <Chip
              label={data.assetCondition}
              size="small"
              sx={{ background: condClr.bg, color: condClr.color,
                    fontWeight: 700, fontSize: 11, height: 22, borderRadius: "20px" }}
            />
          )}
        </Box>
      </Box>

      {/* QR code thumbnail */}
      {data?.qrCode && (
        <Box
          sx={{
            width: 48, height: 48, flexShrink: 0,
            borderRadius: "8px",
            border: `1px solid ${COLORS.border}`,
            background: COLORS.surface,
            overflow: "hidden",
          }}
        >
          <img
            src={"data:image/png;base64," + data.qrCode}
            alt="QR"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Box>
      )}
    </Box>
  );

  return (
    <>
    <Modal open={imgOpen} onClose={() => setImgOpen(false)}
      sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Box
        component="img"
        src={imageUrl}
        alt="asset"
        onClick={() => setImgOpen(false)}
        sx={{ width: 420, height: 320, objectFit: "contain", borderRadius: 2,
              background: "#fff", boxShadow: 24, cursor: "zoom-out", outline: "none" }}
      />
    </Modal>
    <ViewModal
      open={open}
      title={data?.assetName || "Asset Details"}
      subtitle={data?.assetCode}
      icon={<FaBox size={16} />}
      iconBg={COLORS.primaryLight}
      iconColor={COLORS.primary}
      data={data}
      fields={FIELDS}
      header={header}
      onClose={onClose}
    />
    </>
  );
}