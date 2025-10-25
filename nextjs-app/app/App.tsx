"use client";

import React, { useState } from "react";
import { LoginPage } from "./components/LoginPage";
import { Layout, StudentDashboard, DriverDashboard, AdminDashboard, LostFoundPage, RealTimeTracking, ScheduleSearch, DriverTrips, FeedbackPage } from "./components";


type UserRole = "student" | "driver" | "admin";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Start as logged in
  const [userRole, setUserRole] = useState<UserRole>("student");
  const [userName, setUserName] = useState("Demo User"); // Set default user
  const [currentPage, setCurrentPage] = useState("dashboard");

  const handleLogin = (username: string, role: UserRole) => {
    setUserName(username);
    setUserRole(role);
    setIsLoggedIn(true);
    setCurrentPage("dashboard");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName("");
    setCurrentPage("dashboard");
  };

  // Skip login page for development
  // if (!isLoggedIn) {
  //   return <LoginPage onLogin={handleLogin} />;
  // }

  const renderPage = () => {
    // For demo purposes, showing all dashboards in tabs
    // In production, this would be based on user navigation
    return (
      <div className="space-y-6">
        {/* Navigation Tabs for Demo */}
        <div className="bg-card border-b border-border p-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setCurrentPage("dashboard")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentPage === "dashboard"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentPage("tracking")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentPage === "tracking"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              }`}
            >
              Live Tracking
            </button>
            <button
              onClick={() => setCurrentPage("schedule")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentPage === "schedule"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              }`}
            >
              Schedule
            </button>
            <button
              onClick={() => setCurrentPage("lost-found")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentPage === "lost-found"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              }`}
            >
              Lost & Found
            </button>
            {/* Role switcher for demo */}
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => setUserRole("student")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  userRole === "student"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                Student View
              </button>
              <button
                onClick={() => setUserRole("driver")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  userRole === "driver"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                Driver View
              </button>
              <button
                onClick={() => setUserRole("admin")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  userRole === "admin"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                Admin View
              </button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        {currentPage === "dashboard" && (
          <>
            {userRole === "student" && <StudentDashboard onNavigate={setCurrentPage} />}
            {userRole === "driver" && <DriverDashboard />}
            {userRole === "admin" && <AdminDashboard />}
          </>
        )}
        {currentPage === "tracking" && <RealTimeTracking />}
        {currentPage === "schedule" && <ScheduleSearch />}
        {currentPage === "lost-found" && <LostFoundPage />}
        {currentPage === "my-trips" && <DriverTrips />}
        {currentPage === "manage-trips" && <AdminDashboard />}
        {currentPage === "manage-users" && <AdminDashboard />}
        {currentPage === "send-alert" && <DriverDashboard />}
        {currentPage === "feedback" && <FeedbackPage />}
      </div>
    );
  };

  return (
    <Layout 
      userRole={userRole} 
      userName={userName} 
      onLogout={handleLogout}
      onNavigate={setCurrentPage}
      currentPage={currentPage}
      children={renderPage()}
    />
  );
}
