"use client";

import React, { useState } from "react";
import LoginPage from "./components/LoginPage";
import {
  Layout,
  StudentDashboard,
  DriverDashboard,
  AdminDashboard,
  LostFoundPage,
  RealTimeTracking,
  ScheduleSearch,
  DriverTrips,
  AdminManageTrips,
  AdminManageUsers,
  AdminManageDrivers,
  AdminLostFoundPage,
} from "./components";
import AdminCreateBus from "./components/Admin/ManageBuses/AdminCreateBus";
import FeedbackPage from "./components/User/FeedBack/FeedbackPage"

type UserRole = "student" | "driver" | "admin";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Start as logged out
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userName, setUserName] = useState("");
  const [currentPage, setCurrentPage] = useState("dashboard");

  // Handle login and set role automatically
  const handleLogin = (username: string, role: UserRole) => {
    setUserName(username);
    setUserRole(role);
    setIsLoggedIn(true);
    setCurrentPage("dashboard");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName("");
    setUserRole(null);
    setCurrentPage("dashboard");
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderPage = () => {
    // Dashboard based on role
    if (currentPage === "dashboard") {
      switch (userRole) {
        case "student":
          return <StudentDashboard onNavigate={setCurrentPage} />;
        case "driver":
          return <DriverDashboard />;
        case "admin":
          return <AdminDashboard />;
        default:
          return null;
      }
    }

    switch (currentPage) {
      /** -----------------------------
       *  Admin Pages
       * ----------------------------- */
      case "admin-dashboard":
        return <AdminDashboard />;

      case "create-bus":
        return userRole === "admin" ? <AdminCreateBus /> : null;

      case "manage-trips":
        return userRole === "admin" ? <AdminManageTrips /> : null;

      case "manage-users":
        return userRole === "admin" ? <AdminManageUsers /> : null;

      case "manage-drivers":
        return userRole === "admin" ? <AdminManageDrivers /> : null;

      case "admin-lost-found":
        return userRole === "admin" ? <AdminLostFoundPage /> : null;

      /** -----------------------------
       *  Driver Pages
       * ----------------------------- */
      case "driver-dashboard":
        return userRole === "driver" ? <DriverDashboard /> : null;

      case "my-trips":
        return userRole === "driver" ? <DriverTrips /> : null;

      case "send-alert":
        return userRole === "driver" ? <DriverDashboard /> : null; // (or <SendAlertPage /> if you have one)

      /** -----------------------------
       *  Student Pages
       * ----------------------------- */
      case "user-dashboard":
        return userRole === "student" ? (
          <StudentDashboard onNavigate={setCurrentPage} />
        ) : null;

      case "user-lost-found":
        return userRole === "student" ? <LostFoundPage /> : null;

      /** -----------------------------
       *  Shared Pages
       * ----------------------------- */
      case "tracking":
        return <RealTimeTracking />;

      case "schedule":
        return <ScheduleSearch />;

      case "feedback":
        return <FeedbackPage />;

      /** -----------------------------
       *  Default Page
       * ----------------------------- */
      default:
        // fall back to correct dashboard per role
        if (userRole === "admin") return <AdminDashboard />;
        if (userRole === "driver") return <DriverDashboard />;
        return <StudentDashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Layout
      userRole={userRole!}
      userName={userName}
      onLogout={handleLogout}
      onNavigate={setCurrentPage}
      currentPage={currentPage}
    >
      {renderPage()}
    </Layout>
  );
}
