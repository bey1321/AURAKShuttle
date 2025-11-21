"use client";

import React, { useState } from "react";
import LoginPage from "./components/LoginPage";
import SignUpPage from "./components/SignUpPage";
import {
  Layout,
  StudentDashboard,
  DriverDashboard,
  AdminDashboard,
  LostFoundPage,
  RealTimeTracking,
  // ScheduleSearch,
  DriverTrips,
  AdminManageTrips,
  AdminManageUsers,
  AdminManageDrivers,
  AdminLostFoundPage,
  UserScheduleSearch,
} from "./components";
import AdminCreateBus from "./components/Admin/ManageBuses/AdminCreateBus";
import FeedbackPage from "./components/User/FeedBack/FeedbackPage";
import DriverLostFoundPage from "./components/Driver/LostAndFoundPage/DriverLostAndFound";
import ManageTerminal from "./components/Admin/ManageTrips/ManageTerminal";
import UserRouteRegistration from "./components/User/UserRouteRegistration";
import AdminApproveRegistrations from "./components/Admin/AdminApproveregistration";

type UserRole = "student" | "driver" | "admin";

export default function App({
  hideSidebar = false,
  initialLoggedIn = false,
  initialUserRole = null,
  initialUserName = "",
}: {
  hideSidebar?: boolean;
  initialLoggedIn?: boolean;
  initialUserRole?: UserRole | null;
  initialUserName?: string;
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(initialLoggedIn);
  const [userRole, setUserRole] = useState<UserRole | null>(initialUserRole);
  const [userName, setUserName] = useState(initialUserName);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [showSignUp, setShowSignUp] = useState(false);

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
    return showSignUp ? (
      <SignUpPage onSwitchToLogin={() => setShowSignUp(false)} />
    ) : (
      <LoginPage
        onLogin={handleLogin}
        onSwitchToSignup={() => setShowSignUp(true)}
      />
    );
  }

  const renderPage = () => {
    if (currentPage === "dashboard") {
      switch (userRole) {
        case "student":
          return <StudentDashboard onNavigate={setCurrentPage} />;
        case "driver":
          return <DriverDashboard />;
        case "admin":
          return <AdminDashboard />;
      }
    }

    switch (currentPage) {
      // 🔹 Admin
      case "manage-buses":
        return userRole === "admin" ? <AdminCreateBus /> : null;
      case "manage-terminals":
        return userRole === "admin" ? <ManageTerminal /> : null;
      case "manage-trips":
        return userRole === "admin" ? <AdminManageTrips /> : null;
      case "manage-users":
        return userRole === "admin" ? <AdminManageUsers /> : null;
      case "manage-drivers":
        return userRole === "admin" ? <AdminManageDrivers /> : null;
      case "admin-lost-found":
        return userRole === "admin" ? <AdminLostFoundPage /> : null;
      case "admin-approve-registration":
        return userRole === "admin" ? <AdminApproveRegistrations /> : null;

      // 🔹 Driver
      case "my-trips":
        return userRole === "driver" ? <DriverTrips /> : null;
      case "driver-lost-found":
        return userRole === "driver" ? <DriverLostFoundPage /> : null;

      // 🔹 Student
      case "user-lost-found":
        return userRole === "student" ? <LostFoundPage /> : null;
      case "user-route-registration":
        return userRole === "student" ? <UserRouteRegistration /> : null;
        case "schedule":
          return <UserScheduleSearch />; 

      // 🔹 Shared
      case "tracking":
        return <RealTimeTracking />;
      case "feedback":
        return <FeedbackPage />;

      default:
        return null;
    }
  };

  return (
    <Layout
      userRole={userRole!}
      userName={userName}
      onLogout={handleLogout}
      onNavigate={setCurrentPage}
      currentPage={currentPage}
      hideSidebar={hideSidebar}
    >
      {renderPage()}
    </Layout>
  );
}
