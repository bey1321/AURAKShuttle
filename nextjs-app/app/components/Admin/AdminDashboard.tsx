"use client";

import React, { useEffect, useState } from "react";
import { adminAPI, lostFoundAPI } from "../../lib/api";
import {
  Bus,
  Users,
  MapPin,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  BarChart3,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui";
import { AdminGPSComponent } from "../GPS";

export function AdminDashboard({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [showCreateTrip, setShowCreateTrip] = useState(false);
  const [showAddDriver, setShowAddDriver] = useState(false);
  // TODO: Get adminId from auth context/session
  // const adminId = 1; // Replace with actual admin ID from auth

  const [buses, setBuses] = useState<any[]>([]);
  const [busLoading, setBusLoading] = useState(true);

  const [busiestRoutes, setBusiestRoutes] = useState<any[]>([]);
  const [busiestLoading, setBusiestLoading] = useState(true);

  const [weeklyUsage, setWeeklyUsage] = useState<{day: string, count: number, percentage: number}[]>([]);
  const [usageLoading, setUsageLoading] = useState(true);

  const [stats, setStats] = useState({
    totalTrips: 0,
    totalDrivers: 0,
    totalStudents: 0,
    registrationRequests: 0,
    lostItemClaims: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      
      const [usersData, driversData, tripsData, registrationsData, claimsData] = await Promise.all([
        adminAPI.getUsers().catch(() => []),
        adminAPI.getDrivers().catch(() => []),
        adminAPI.getTrips().catch(() => []),
        adminAPI.getRegistrationRequests().catch(() => []),
        lostFoundAPI.getAdminFoundAndClaims().catch(() => []),
      ]);

      console.log("Drivers data:", driversData);

      // Count total drivers
      const totalDriversCount = Array.isArray(driversData)
        ? driversData.length
        : 0;

      console.log("Total drivers count:", totalDriversCount);

      // Count total students (users with role 'student')
      const totalStudentsCount = Array.isArray(usersData)
        ? usersData.filter((u: any) => u.role === 'student' || u.role === 'Student').length
        : 0;

      // Count registration requests
      const registrationRequestsCount = Array.isArray(registrationsData) ? registrationsData.length : 0;

      // Count lost item claims
      let claimsCount = 0;
      if (Array.isArray(claimsData)) {
        claimsData.forEach((item: any) => {
          if (Array.isArray(item.claim)) {
            claimsCount += item.claim.length;
          }
        });
      }

      setStats({
        totalTrips: Array.isArray(tripsData) ? tripsData.length : 0,
        totalDrivers: totalDriversCount,
        totalStudents: totalStudentsCount,
        registrationRequests: registrationRequestsCount,
        lostItemClaims: claimsCount,
      });
    } catch (e: any) {
      console.error("Error loading stats:", e);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadBuses = async () => {
    try {
      setBusLoading(true);
      const data = await adminAPI.getBuses();

      const mapped = data.map((b: any) => ({
        id: b.id,
        plate: b.plate_num,
        model: b.model,
        manufacturer: b.manufacturer,
        seats: b.no_seats,
        status: b.status,
      }));

      setBuses(mapped);
    } catch (err: any) {
      console.error("Error loading buses:", err);
      alert(err?.message || "Failed to load buses");
    } finally {
      setBusLoading(false);
    }
  };

  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBusiestRoutes = async () => {
    try {
      setBusiestLoading(true);
      const routesData = await adminAPI.getRoutes();
      const tripsData = await adminAPI.getTrips();
      
      // Count trips for each route
      const routesWithTripCounts = (Array.isArray(routesData) ? routesData : []).map((route) => {
        const routeTrips = Array.isArray(tripsData) 
          ? tripsData.filter((trip: any) => trip.route_id === route.id)
          : [];
        
        return {
          id: route.id,
          name: route.name || "Unknown Route",
          startTerminal: route.start_terminal?.terminalName || "—",
          tripCount: routeTrips.length,
        };
      });

      // Sort by trip count (descending - highest to lowest) and take top 4
      const sorted = routesWithTripCounts
        .sort((a, b) => b.tripCount - a.tripCount)
        .slice(0, 4);

      setBusiestRoutes(sorted);
    } catch (e: any) {
      console.error("Error loading busiest routes:", e);
      setBusiestRoutes([]);
    } finally {
      setBusiestLoading(false);
    }
  };

  const loadWeeklyUsage = async () => {
    try {
      setUsageLoading(true);
      const tripsData = await adminAPI.getTrips();
      
      // Count trips by day of week
      const dayMap: {[key: string]: number} = {
        'Monday': 0,
        'Tuesday': 0,
        'Wednesday': 0,
        'Thursday': 0,
        'Friday': 0,
      };

      if (Array.isArray(tripsData)) {
        tripsData.forEach((trip: any) => {
          if (trip.date) {
            const date = new Date(trip.date);
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayName = dayNames[date.getDay()];
            if (dayMap.hasOwnProperty(dayName)) {
              dayMap[dayName]++;
            }
          }
        });
      }

      // Find max count for percentage calculation
      const maxCount = Math.max(...Object.values(dayMap), 1);

      // Convert to array format
      const usageData = Object.entries(dayMap).map(([day, count]) => ({
        day,
        count,
        percentage: (count / maxCount) * 100,
      }));

      setWeeklyUsage(usageData);
    } catch (e: any) {
      console.error("Error loading weekly usage:", e);
      setWeeklyUsage([]);
    } finally {
      setUsageLoading(false);
    }
  };

  const loadSemesterTrips = async () => {
    try {
      setLoading(true);
      const routesData = await adminAPI.getRoutes();
      setRoutes(Array.isArray(routesData) ? routesData : []);
    } catch (e: any) {
      console.error("Error loading semester routes:", e);
      alert(e?.message || "Failed to load semester routes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadSemesterTrips();
    loadBuses();
    loadBusiestRoutes();
    loadWeeklyUsage();
  }, []);

  const renderTerminals = (terminalsArray: any[]) => {
    if (!Array.isArray(terminalsArray)) return "—";
    return (
      terminalsArray
        .map((t) => t.terminal?.terminalName || "—")
        .filter((x) => x !== "—")
        .join(", ") || "—"
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage shuttle operations and users
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="flex gap-4 [&>*]:flex-1">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Trips</p>
                <h3>{statsLoading ? "..." : stats.totalTrips}</h3>
              </div>
              <Bus className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Drivers</p>
                <h3>{statsLoading ? "..." : stats.totalDrivers}</h3>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <h3>{statsLoading ? "..." : stats.totalStudents}</h3>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Registration requests</p>
                <h3>{statsLoading ? "..." : stats.registrationRequests}</h3>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lost Item Claims</p>
                <h3>{statsLoading ? "..." : stats.lostItemClaims}</h3>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Usage Analytics</CardTitle>
            <CardDescription>Trip statistics by day of week</CardDescription>
          </CardHeader>
          <CardContent>
            {usageLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : weeklyUsage.length === 0 ? (
              <p className="text-sm text-muted-foreground">No usage data available.</p>
            ) : (
              <div className="space-y-4">
                {weeklyUsage.map((item) => (
                  <div key={item.day} className="flex items-center justify-between">
                    <span>{item.day}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Busiest Routes</CardTitle>
            <CardDescription>Routes sorted by number of trips</CardDescription>
          </CardHeader>
          <CardContent>
            {busiestLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : busiestRoutes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No route data available.</p>
            ) : (
              <div className="space-y-4">
                {busiestRoutes.map((route) => (
                  <div key={route.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <span className="font-medium">{route.name}</span>
                        <p className="text-xs text-muted-foreground">{route.startTerminal}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{route.tripCount} trips</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
      <CardHeader>
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle>Semester-Wide Routes</CardTitle>
            <CardDescription>Recurring weekly semester trips</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => onNavigate?.("manage-trips")}>Manage Routes</Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : routes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No semester trips found.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Days of Week</TableHead>
                <TableHead>Start Terminal</TableHead>
                <TableHead>Stops</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {routes.map((route) => (
                <TableRow key={route.id}>
                  <TableCell>{route.id}</TableCell>
                  <TableCell>{route.name || "—"}</TableCell>
                  <TableCell>{route.type || "—"}</TableCell>
                  <TableCell>
                    {Array.isArray(route.days_of_week)
                      ? route.days_of_week.join(", ")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {route.start_terminal?.terminalName || "—"}
                  </TableCell>
                  <TableCell>{renderTerminals(route.terminals)}</TableCell>
                  <TableCell>{route.start_time || "—"}</TableCell>
                  <TableCell>{route.end_time || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>

      {/* buses Management */}
      <Card className="mt-4">
      <CardHeader>
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle>Buses</CardTitle>
            <CardDescription>List of all registered shuttle buses</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => onNavigate?.("manage-buses")}>
              Manage Buses
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {busLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : buses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No buses found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Plate Number</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {buses.map((bus) => (
                <TableRow key={bus.id}>
                  <TableCell>{bus.id}</TableCell>
                  <TableCell>{bus.plate}</TableCell>
                  <TableCell>{bus.model}</TableCell>
                  <TableCell>{bus.manufacturer}</TableCell>
                  <TableCell>{bus.seats}</TableCell>
                  <TableCell>
                    <Badge variant={bus.status === "Active" ? "default" : "outline"}>
                      {bus.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
