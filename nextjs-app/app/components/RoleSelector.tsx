"use client";

import { Bus, Users, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from "./ui";
import { useRouter } from "next/navigation";

export function RoleSelector() {
  const router = useRouter();

  const handleRoleSelection = (role: string) => {
    // Set role in cookie for middleware
    document.cookie = `userRole=${role}; path=/`;
    router.push(`/${role}`);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full mb-4">
            <Bus className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-primary mb-2">AURAK Campus Shuttle Tracker</h1>
          <p className="text-muted-foreground text-lg">Select your role to continue</p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Student Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleRoleSelection('user')}>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl">User</CardTitle>
              <CardDescription>
                Track shuttles, view schedules, and manage your campus transportation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Real-time shuttle tracking</li>
                <li>• View schedules and routes</li>
                <li>• Report lost items</li>
                <li>• Submit feedback</li>
              </ul>
              <Button className="w-full mt-4">
                Access Student Portal
              </Button>
            </CardContent>
          </Card>

          {/* Driver Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleRoleSelection('driver')}>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bus className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-xl">Driver</CardTitle>
              <CardDescription>
                Manage your trips, send alerts, and track passenger information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• View assigned trips</li>
                <li>• Send passenger alerts</li>
                <li>• Track occupancy</li>
                <li>• Update trip status</li>
              </ul>
              <Button className="w-full mt-4">
                Access Driver Portal
              </Button>
            </CardContent>
          </Card>

          {/* Admin Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleRoleSelection('admin')}>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-xl">Administrator</CardTitle>
              <CardDescription>
                Manage the entire shuttle system, drivers, and system analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Manage trips and schedules</li>
                <li>• Manage drivers and users</li>
                <li>• View system analytics</li>
                <li>• System configuration</li>
              </ul>
              <Button className="w-full mt-4">
                Access Admin Portal
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          American University of Ras Al Khaimah
        </p>
      </div>
    </div>
  );
}
