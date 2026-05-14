import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography,
} from "@mui/material";
import { FaTimes } from "react-icons/fa";
import { COLORS, outlinedBtnSx } from "../../theme/tokens";

/**
 * ViewModal – compact drawer-style detail dialog.
 *
 * Props:
 *   open      {boolean}
 *   title     {string}          – dialog heading
 *   subtitle  {string}          – small line under title (e.g. asset code)
 *   icon      {ReactNode}       – icon shown in the header avatar box
 *   iconBg    {string}          – avatar box background color
 *   iconColor {string}          – icon color
 *   badge     {ReactNode}       – optional pill/chip rendered next to the title
 *   data      {object}          – the record to display
 *   fields    {[label, key][]}  – ordered [display label, data key] pairs;
 *                                  values that are null/undefined/"" are skipped
 *   header    {ReactNode}       – slot rendered between the title bar and field rows
 *                                  (used by AssetView for image + status strip)
 *   onClose   {() => void}
 */
export default function ViewModal({
  open,
  title     = "Details",
  subtitle,
  icon,
  iconBg    = COLORS.primaryLight,
  iconColor = COLORS.primary,
  badge,
  data,
  fields,
  header,
  onClose,
}) {
  const rows = (
    fields
      ? fields.map(([label, key]) => [label, data?.[key]])
      : data ? Object.entries(data) : []
  ).filter(([, v]) => v != null && v !== "");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableRestoreFocus
      TransitionComponent={({ children, in: inProp }) => (
        <Box sx={{
          "& > *": inProp ? {
            animation: "modalPop .38s cubic-bezier(.34,1.56,.64,1) both",
            "@keyframes modalPop": {
              from: { opacity: 0, transform: "scale(0.9) translateY(20px)" },
              to:   { opacity: 1, transform: "scale(1) translateY(0)" },
            },
          } : { opacity: 0 },
        }}>{children}</Box>
      )}
      slotProps={{
        paper: {
          sx: {
            borderRadius: "14px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
            overflow: "hidden",
            p: 0,
          },
        },
      }}
    >
      {/* ── Title bar ── */}
      <DialogTitle
        sx={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          px: 2.5, py: 2,
          borderBottom: `1px solid ${COLORS.borderLight}`,
          background: COLORS.surface,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {icon && (
            <Box sx={{
              width: 38, height: 38, borderRadius: "9px",
              background: iconBg,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: iconColor, flexShrink: 0,
            }}>
              {icon}
            </Box>
          )}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography sx={{ fontWeight: 600, fontSize: 15, color: COLORS.text, lineHeight: 1.3 }}>
                {title}
              </Typography>
              {badge}
            </Box>
            {subtitle && (
              <Typography sx={{ fontSize: 12, color: COLORS.textFaint, mt: 0.2 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        <Box
          onClick={onClose}
          sx={{
            cursor: "pointer", color: COLORS.textFaint, p: 0.5, borderRadius: "6px",
            "&:hover": { color: COLORS.text, background: COLORS.bg },
            transition: "all .15s",
          }}
        >
          <FaTimes size={15} />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, background: COLORS.surface }}>
        {/* Optional slot – image preview, QR, status strip, etc. */}
        {header}

        {/* Divider rows */}
        {rows.map(([label, value], idx) => (
          <Box
            key={label}
            sx={{
              display: "grid",
              gridTemplateColumns: "38% 62%",
              alignItems: "center",
              px: 2.5,
              py: "10px",
              background: idx % 2 === 0 ? COLORS.surface : COLORS.bg,
              borderBottom: idx < rows.length - 1 ? `1px solid ${COLORS.borderLight}` : "none",
              opacity: 0,
              animation: `rowIn .35s cubic-bezier(.22,1,.36,1) ${180 + idx * 40}ms both`,
              "@keyframes rowIn": {
                from: { opacity: 0, transform: "translateX(-12px)" },
                to:   { opacity: 1, transform: "translateX(0)" },
              },
            }}
          >
            <Typography sx={{ fontSize: 12, color: COLORS.textFaint, fontWeight: 500 }}>{label}</Typography>
            <Typography sx={{ fontSize: 13, color: COLORS.text, fontWeight: 500, wordBreak: "break-word" }}>{String(value)}</Typography>
          </Box>
        ))}
      </DialogContent>

      {/* ── Footer ── */}
      <DialogActions
        sx={{
          px: 2.5, py: 1.5,
          borderTop: `1px solid ${COLORS.borderLight}`,
          background: COLORS.surface,
          justifyContent: "flex-end",
        }}
      >
        <Button onClick={onClose} variant="outlined" sx={outlinedBtnSx}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}