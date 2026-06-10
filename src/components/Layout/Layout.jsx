import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";

const Layout = () => (
  <Box sx={{ display: "flex", flexDirection: "column" }}>
    <Navbar />
    <Box sx={{
      pt: "54px",
      px: 1,
      pb: 1,
      minHeight: "100vh",
      background: "#f4f6fb",
      boxSizing: "border-box",
    }}>
      <Outlet />
    </Box>
  </Box>
);

export default Layout;
