import Navbar from "../Navbar";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <div className="layout">
      <Navbar />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;