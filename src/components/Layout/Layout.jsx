import Sidebar from "../Sidebar";
import Navbar from "../Navbar";
import { Outlet } from "react-router-dom";
import { useState } from "react";
// import "../styles/Sidebar.css";

const Layout = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="layout">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      {/* MAIN WRAPPER */}
      <div className={`main ${isOpen ? "open" : "close"}`}>
        <Navbar toggleSidebar={() => setIsOpen(!isOpen)} />

        <div className="main-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;