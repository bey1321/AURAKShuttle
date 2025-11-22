"use client";

import React, { useEffect, useState } from "react";
import { adminAPI } from "../../lib/api";
import { trips, drivers, adminStats } from "../../data/database";
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
    loadSemesterTrips();
    loadBuses();
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

  const stats = adminStats;

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
                <h3>{stats.totalTrips}</h3>
              </div>
              <Bus className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Drivers</p>
                <h3>{stats.activeDrivers}</h3>
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
                <h3>{stats.totalStudents}</h3>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Registration reguests</p>
                <h3>{stats.avgOccupancy}</h3>
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
                <h3>{stats.avgOccupancy}</h3>
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
            <CardDescription>Trip statistics for this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Monday</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: "85%" }}
                    />
                  </div>
                  <span className="text-sm">680</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Tuesday</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: "92%" }}
                    />
                  </div>
                  <span className="text-sm">720</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Wednesday</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: "78%" }}
                    />
                  </div>
                  <span className="text-sm">610</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Thursday</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: "88%" }}
                    />
                  </div>
                  <span className="text-sm">690</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Friday</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: "65%" }}
                    />
                  </div>
                  <span className="text-sm">510</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Busiest Routes</CardTitle>
            <CardDescription>Top performing routes this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { route: "Main Campus → Khatt", trips: 156, growth: "+12%" },
                { route: "RAK Mall → Main Campus", trips: 142, growth: "+8%" },
                { route: "Main Campus → RAK Mall", trips: 138, growth: "+5%" },
                { route: "Khatt → Main Campus", trips: 129, growth: "+3%" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <span>{item.route}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>{item.trips} trips</span>
                    <Badge variant="outline" className="text-green-600">
                      {item.growth}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
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
