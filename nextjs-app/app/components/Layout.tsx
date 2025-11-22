"use client";

import {
  Bus,
  Home,
  MapPin,
  Package,
  Calendar,
  Users,
  LogOut,
  Bell,
  MessageSquare,
} from "lucide-react";

import { Button } from "./ui";
import React from "react";

interface LayoutProps {
  children: React.ReactNode;
  userRole: "student" | "driver" | "admin";
  userName?: string;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
  hideSidebar?: boolean;
}

export function Layout({
  children,
  userRole,
  userName = "User",
  onLogout,
  onNavigate,
  currentPage,
  hideSidebar = false,
}: LayoutProps) {
  const navItems = {
    student: [
      { icon: Home, label: "User Dashboard", id: "user-dashboard" },
      { icon: MessageSquare, label: "Register for a Trip", id: "user-route-registration" },
      { icon: MapPin, label: "Track Shuttle", id: "student-live-tracking" },
      { icon: Calendar, label: "Schedule", id: "schedule" },
      { icon: Package, label: "Lost & Found", id: "user-lost-found" },
      { icon: MessageSquare, label: "Feedback", id: "feedback" },
    ],
    driver: [
      { icon: Home, label: "Driver Dashboard", id: "driver-dashboard" },
      { icon: Bus, label: "My Trips", id: "my-trips" },
      { icon: Package, label: "Lost and Found", id: "driver-lost-found" },
      { icon: MapPin, label: "Live Tracking", id: "driver-live-tracking" },
      { icon: Bell, label: "Send Alert", id: "send-alert" },
    ],
    admin: [
      { icon: Home, label: "Admin Dashboard", id: "admin-dashboard" },
      { icon: Bus, label: "Manage Buses", id: "manage-buses" },
      { icon: MapPin, label: "Manage Terminals", id: "manage-terminals" },
      { icon: Calendar, label: "Manage Trips", id: "manage-trips" },
      { icon: MessageSquare, label: "Approve Registrations", id: "admin-approve-registration" },
      { icon: Users, label: "Manage Users", id: "manage-users" },
      { icon: Users, label: "Manage Drivers", id: "manage-drivers" },
      { icon: MapPin, label: "Live Tracking", id: "admin-live-tracking" },
      { icon: Package, label: "Admin Lost & Found", id: "admin-lost-found" },
    ],
  };

  const currentNavItems = navItems[userRole];

  return (
    <div className="flex h-screen bg-background">

      {/* Sidebar - only shows if hideSidebar = false */}
      {!hideSidebar && (
        <aside className="w-64 bg-card border-r border-border flex flex-col">

          {/* Logo/Header */}
          <div className="p-6 border-b border-border bg-primary">
            <div className="flex items-center gap-3">
              <Bus className="w-8 h-8 text-primary-foreground" />
              <div>
                <h1 className="text-primary-foreground">AURAK</h1>
                <p className="text-sm text-primary-foreground/80">Shuttle Tracker</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {currentNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                  currentPage === item.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
              >
                <item.icon
                  className={`w-5 h-5 ${
                    currentPage === item.id
                      ? "text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* User Info + Logout */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate">{userName}</p>
                <p className="text-sm text-muted-foreground capitalize">{userRole}</p>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={onLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
