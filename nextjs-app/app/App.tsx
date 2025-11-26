"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import LoginPage from "./components/LoginPage";
import SignUpPage from "./components/SignUpPage";
import {
  Layout,
  StudentDashboard,
  DriverDashboard,
  AdminDashboard,
  LostFoundPage,
  DriverTrips,
  AdminManageTrips,
  AdminManageUsers,
  AdminManageDrivers,
  AdminLostFoundPage,
  UserScheduleSearch,
  ReserveSeat,
} from "./components";
import AdminCreateBus from "./components/Admin/ManageBuses/AdminCreateBus";
import FeedbackPage from "./components/User/FeedBack/FeedbackPage";
import DriverLostFoundPage from "./components/Driver/LostAndFoundPage/DriverLostAndFound";
import ManageTerminal from "./components/Admin/ManageTrips/ManageTerminal";
import UserRouteRegistration from "./components/User/UserRouteRegistration";
import AdminApproveRegistrations from "./components/Admin/AdminApproveregistration";
import { DriverLiveTracking } from "./components/Driver/DriverLiveTracking";
import { UserLiveTracking } from "./components/User/UserLiveTracking";
import { AdminLiveTracking } from "./components/Admin/AdminLiveTracking";
import AdminFeedback from "./components/Admin/AdminFeedback";
import { ca } from "zod/v4/locales";

type UserRole = "student" | "driver" | "admin";

export default function App({
  hideSidebar = false,
  initialLoggedIn = false,
  initialUserRole = null,
  initialUserName = "",
  onLogout: externalOnLogout,
}: {
  hideSidebar?: boolean;
  initialLoggedIn?: boolean;
  initialUserRole?: UserRole | null;
  initialUserName?: string;
  onLogout?: () => void;
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(initialLoggedIn);
  const [userRole, setUserRole] = useState<UserRole | null>(initialUserRole);
  const [userName, setUserName] = useState(initialUserName);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [showSignUp, setShowSignUp] = useState(false);
  const router = useRouter();

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
    // Notify parent (if provided) so it can show the public Landing component
    try {
      if (externalOnLogout) {
        externalOnLogout();
      } else {
        router.push("/");
      }
    } catch (e) {
      console.warn("Logout handler error:", e);
    }
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
          return <AdminDashboard onNavigate={setCurrentPage} />;
      }
    }

    switch (currentPage) {
      // 🔹 Admin
      case "admin-dashboard":
        return userRole === "admin" ? <AdminDashboard onNavigate={setCurrentPage} /> : null;
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
      // case "admin-live-tracking":
      //   return userRole === "admin" ? <AdminLiveTracking /> : null;
      case "admin-feedback":
        return userRole === "admin" ? <AdminFeedback /> : null;

      // 🔹 Driver
      case "driver-dashboard":
        return userRole === "driver" ? <DriverDashboard /> : null;
      case "my-trips":
        return userRole === "driver" ? <DriverTrips /> : null;
      case "driver-lost-found":
        return userRole === "driver" ? <DriverLostFoundPage /> : null;
      case "driver-live-tracking":
        return userRole === "driver" ? <DriverLiveTracking /> : null;

      // 🔹 Student
      case "user-dashboard":
        return userRole === "student" ? <StudentDashboard onNavigate={setCurrentPage} /> : null;
      case "user-lost-found":
        return userRole === "student" ? <LostFoundPage /> : null;
      case "user-route-registration":
        return userRole === "student" ? <UserRouteRegistration /> : null;
      case "schedule":
          return userRole === "student" ?  <UserScheduleSearch />: null;
      case "student-live-tracking":
          return userRole === "student" ?  <UserLiveTracking />: null;
      case "feedback":
        return userRole === "student" ?  <FeedbackPage /> : null;
      case "reserve-seat":
        return userRole === "student" ? <ReserveSeat /> : null;
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
