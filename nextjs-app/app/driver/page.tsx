"use client";

import { DriverDashboard } from "../components/Driver/DriverDashboard";
import { DriverTrips } from "../components/Driver/DriverTrips";
import { Layout } from "../components/Layout";
import { RealTimeTracking } from "../components/RealTimeTracking";
import { useState } from "react";

export default function DriverPage() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  const renderPage = () => {
    switch (currentPage) {
      case "driver-dashboard":
        return <DriverDashboard />;
      case "my-trips":
        return <DriverTrips />;
      case "tracking":
        return <RealTimeTracking />;
      case "send-alert":
        return <div>Send Alert Page</div>;
      default:
        return <DriverDashboard />;
    }
  };

  return (
    <Layout
      userRole="driver"
      userName="Driver User"
      onLogout={() => (window.location.href = "/")}
      onNavigate={setCurrentPage}
      currentPage={currentPage}
      children={renderPage()}
    />
  );
}
