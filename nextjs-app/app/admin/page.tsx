"use client";

import { Layout } from "../components/Layout";
import { AdminDashboard } from "../components/Admin/AdminDashboard";
import { AdminLostFoundPage } from "../components/Admin/AdminLostFoundPage";
import { AdminManageTrips } from "../components/Admin/AdminManageTrips";
import { AdminManageDrivers } from "../components/Admin/AdminManageDrivers";
import { AdminManageUsers } from "../components/Admin/AdminManageUsers";
import { RealTimeTracking } from "../components/RealTimeTracking";
import { useState } from "react";

export default function AdminPage() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <AdminDashboard />;
      case "manage-trips":
        return <AdminManageTrips />;
      case "manage-users":
        return <AdminManageUsers />;
      case "manage-drivers":
        return <AdminManageDrivers />;
      case "tracking":
        return <RealTimeTracking />;
      case "lost-found":
        return <AdminLostFoundPage />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <Layout
      userRole="admin"
      userName="Admin User"
      onLogout={() => (window.location.href = "/")}
      onNavigate={setCurrentPage}
      currentPage={currentPage}
      children={renderPage()}
    />
  );
}
