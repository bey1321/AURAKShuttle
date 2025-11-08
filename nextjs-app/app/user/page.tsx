"use client";

import { StudentDashboard } from "../components/User/StudentDashboard";
import { Layout } from "../components/Layout";
import { RealTimeTracking } from "../components/RealTimeTracking";
import { ScheduleSearch } from "../components/ScheduleSearch";
import { LostFoundPage } from "../components/User/LostAndFound/LostFoundPage";
import FeedbackPage from "../components/User/FeedBack/FeedbackPage";
import { useState } from "react";

export default function StudentPage() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  const renderPage = () => {
    switch (currentPage) {
      case "user-dashboard":
        return <StudentDashboard onNavigate={setCurrentPage} />;
      case "tracking":
        return <RealTimeTracking />;
      case "schedule":
        return <ScheduleSearch />;
      case "user-lost-found":
        return <LostFoundPage />;
      case "feedback":
        return <FeedbackPage />;
      default:
        return <StudentDashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Layout
      userRole="student"
      userName="Student User"
      onLogout={() => (window.location.href = "/")}
      onNavigate={setCurrentPage}
      currentPage={currentPage}
      children={renderPage()}
    />
  );
}
