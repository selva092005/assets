import Sidebar from "../Sidebar";
import Navbar from "../Navbar";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <div>
      <Sidebar />
      <Navbar />

      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;