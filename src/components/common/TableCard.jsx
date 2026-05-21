import { useEffect, useRef, useState } from "react";
import { Paper, Box, Typography } from "@mui/material";
import { COLORS } from "../../theme/tokens";

export default function TableCard({ title, children }) {
  const scrollRef = useRef(null);
  const [shadows, setShadows] = useState({ right: false, bottom: false });

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const newShadows = {
      right: el.scrollWidth > el.clientWidth && el.scrollLeft < el.scrollWidth - el.clientWidth - 1,
      bottom: el.scrollHeight > el.clientHeight && el.scrollTop < el.scrollHeight - el.clientHeight - 1,
    };
    setShadows((prev) => {
      if (prev.right === newShadows.right && prev.bottom === newShadows.bottom) return prev;
      return newShadows;
    });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  useEffect(() => { checkScroll(); }, [children]);

  return (
    <Paper
      elevation={1}
      sx={{
        borderRadius: "14px",
        overflow: "hidden",
        border: "1px solid rgba(16,24,40,0.04)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.82), rgba(250,250,252,0.92))",
        boxShadow: "0 12px 32px rgba(16,24,40,0.08)",
        backdropFilter: "saturate(120%) blur(8px)",
      }}
    >
      {title && (
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid " + COLORS.borderLight, background: "linear-gradient(90deg, rgba(255,255,255,0.65), transparent)" }}>
          <Typography sx={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>{title}</Typography>
        </Box>
      )}
      <Box sx={{ position: "relative" }}>
        <Box ref={scrollRef} sx={{ overflowX: "auto", overflowY: "auto", px: 3, py: 2 }}>
          {children}
        </Box>

        <Box sx={{
          pointerEvents: "none",
          position: "absolute",
          top: 0, right: 0, bottom: 0,
          width: 48,
          background: "linear-gradient(to left, rgba(16,24,40,0.08), transparent)",
          opacity: shadows.right ? 1 : 0,
          transition: "opacity 200ms ease",
        }} />

        <Box sx={{
          pointerEvents: "none",
          position: "absolute",
          left: 0, right: 0, bottom: 0,
          height: 48,
          background: "linear-gradient(to top, rgba(16,24,40,0.08), transparent)",
          opacity: shadows.bottom ? 1 : 0,
          transition: "opacity 200ms ease",
        }} />
      </Box>
    </Paper>
  );
}
