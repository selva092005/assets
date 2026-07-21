import { useEffect, useRef, useState } from "react";
import { Paper, Box, Typography } from "@mui/material";
import { COLORS } from "../../theme/tokens";

export default function TableCard({ title, children }) {
  const scrollRef = useRef(null);
  const [shadows, setShadows] = useState({ right: false, bottom: false });

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const s = {
      right: el.scrollWidth > el.clientWidth && el.scrollLeft < el.scrollWidth - el.clientWidth - 1,
      bottom: el.scrollHeight > el.clientHeight && el.scrollTop < el.scrollHeight - el.clientHeight - 1,
    };
    setShadows((p) => (p.right === s.right && p.bottom === s.bottom ? p : s));
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const timer = setTimeout(() => {
      checkScroll();
    }, 0);
    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => {
      clearTimeout(timer);
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkScroll();
    }, 0);
    return () => clearTimeout(timer);
  }, [children]);

  return (
    <Paper elevation={0} sx={{
      borderRadius: "8px",
      overflow: "hidden",
      border: "1px solid #f1f5f9",
      background: "#fff",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.05)",
      animation: "cardIn 300ms ease both",
      "@keyframes cardIn": {
        from: { opacity: 0, transform: "translateY(8px)" },
        to: { opacity: 1, transform: "translateY(0)" },
      },
    }}>
      {title && (
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: "1px solid #f1f5f9", background: "#fafbfc" }}>
          <Typography sx={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{title}</Typography>
        </Box>
      )}
      <Box sx={{ position: "relative" }}>
        <Box ref={scrollRef} sx={{ overflowX: "auto", overflowY: "auto" }}>
          {children}
        </Box>
        <Box sx={{
          pointerEvents: "none", position: "absolute",
          top: 0, right: 0, bottom: 0, width: 60,
          background: "linear-gradient(to left, rgba(255,255,255,0.95), transparent)",
          opacity: shadows.right ? 1 : 0, transition: "opacity 200ms ease",
        }} />
        <Box sx={{
          pointerEvents: "none", position: "absolute",
          left: 0, right: 0, bottom: 0, height: 48,
          background: "linear-gradient(to top, rgba(255,255,255,0.95), transparent)",
          opacity: shadows.bottom ? 1 : 0, transition: "opacity 200ms ease",
        }} />
      </Box>
    </Paper>
  );
}
