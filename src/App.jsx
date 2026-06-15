import React, { useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";
import toast from "./utils/toast.jsx";

export default function App() {
  useEffect(() => {
    const handleOnline = () => {
      toast.success("Connection restored", "Back online. Feeds and updates are active.");
    };

    const handleOffline = () => {
      toast.warning("Network connection lost", "You are currently offline. Working in read-only mode.", { duration: 8000 });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return <AppRoutes />;
}

