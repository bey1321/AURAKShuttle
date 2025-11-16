"use client";

import React, { useState, useEffect } from "react";
import { Edit, Trash2, Plus, Search } from "lucide-react";
import { adminAPI } from "../../../lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from "../../ui";
import ConfirmDeleteDialog from "../../ConfirmDeleteDialog";
import CreateTrip from "./CreateTrip";
import CreateSemesterTrips from "./CreateSemesterTrips";

export function AdminManageTrips() {
  const [allTrips, setAllTrips] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [terminalsMap, setTerminalsMap] = useState<Record<number, string>>({});
  const [busesMap, setBusesMap] = useState<Record<number, string>>({});
  const [driversMap, setDriversMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showCreateSingle, setShowCreateSingle] = useState(false);
  const [showCreateSemester, setShowCreateSemester] = useState(false);

  const [tripToDelete, setTripToDelete] = useState<any | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<any | null>(null);
  const [deleteRouteDialogOpen, setDeleteRouteDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any | null>(null);

  // Load all trips, semester routes, and maps
  const loadTrips = async () => {
    try {
      setLoading(true);
      const [routesData, tripsData, buses, drivers, terminals] = await Promise.all([
        adminAPI.getRoutes(),
        adminAPI.getTrips(),
        adminAPI.getBuses(),
        adminAPI.getDrivers(),
        adminAPI.getTerminals(),
      ]);

      setRoutes(Array.isArray(routesData) ? routesData : []);
      setAllTrips(Array.isArray(tripsData) ? tripsData : []);

      setBusesMap(Object.fromEntries(buses.map((b: any) => [b.id, b.plate_num])));
      setDriversMap(Object.fromEntries(drivers.map((d: any) => [d.id, `${d.first_name} ${d.last_name}`])));
      setTerminalsMap(Object.fromEntries(terminals.map((t: any) => [t.id, t.terminalName])));
    } catch (e: any) {
      console.error("Error loading trips:", e);
      alert(e?.message || "Failed to load trips");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  // --- Delete Trip ---
  const handleDeleteClick = (trip: any) => {
    setTripToDelete(trip);
    setDeleteDialogOpen(true);
  };
  const confirmDelete = async () => {
    if (!tripToDelete) return;
    try {
      await adminAPI.deleteTrip(tripToDelete.id);
      await loadTrips();
    } catch (e: any) {
      alert(e?.message || "Failed to delete trip");
    } finally {
      setTripToDelete(null);
      setDeleteDialogOpen(false);
    }
  };
  const cancelDelete = () => {
    setTripToDelete(null);
    setDeleteDialogOpen(false);
  };

  // --- Delete Route ---
  const handleDeleteRouteClick = (route: any) => {
    setRouteToDelete(route);
    setDeleteRouteDialogOpen(true);
  };
  // --- Delete Route ---
const confirmDeleteRoute = async () => {
  if (!routeToDelete) return;

  try {
    // Pass routeToDelete.id as route_id
    console.log("Deleting route ID:", routeToDelete.id);
    await adminAPI.deleteSemesterTrip(routeToDelete.id);

    // Reload trips after deletion
    await loadTrips();

    alert("Route and all related trips deleted successfully");
  } catch (e: any) {
    console.error("Delete route error:", e);
    alert(e?.message || "Failed to delete route");
  } finally {
    setRouteToDelete(null);
    setDeleteRouteDialogOpen(false);
  }
};

  const cancelDeleteRoute = () => {
    setRouteToDelete(null);
    setDeleteRouteDialogOpen(false);
  };

  // --- Edit Route ---
  const handleEditRoute = (route: any) => {
    setEditingRoute(route);
    setShowCreateSemester(true);
  };

  // --- Filters ---
  const filterTrips = (trips: any[]) =>
    trips.filter((trip) => {
      const routeName = trip.route?.name || "";
      return routeName.toLowerCase().includes(search.toLowerCase());
    });
  const filterRoutes = (routesList: any[]) =>
    routesList.filter((route) => route.name?.toLowerCase().includes(search.toLowerCase()));

  // --- Render Terminals ---
  const renderTerminals = (terminalsArray: any[]) => {
    if (!Array.isArray(terminalsArray)) return "—";
    return terminalsArray
      .map((t: any) => t.terminal?.terminalName || terminalsMap[t.terminal_id] || "—")
      .filter((name: string) => name !== "—")
      .join(", ") || "—";
  };

  // --- Render Single Trip Row ---
  const renderRow = (trip: any) => {
    const route = trip.route || {};
    const bus = trip.bus || {};
    const driver = trip.driver || null;

    const routeName = route.name || "Unknown Route";
    const routeType = route.type || "Regular";
    const startTime = route.start_time || "—";
    const endTime = route.end_time || "—";
    const startTerminalName = route.start_terminal?.terminalName || terminalsMap[route.start_terminal_id] || "—";
    const terminals = route.terminals || [];
    const busPlate = bus.plate_num || busesMap[trip.bus_id] || "—";
    const driverName = driver
      ? `${driver.first_name || ""} ${driver.last_name || ""}`.trim() || "—"
      : driversMap[trip.driver_id] || "—";
    const formattedDate = trip.date
    ? new Date(trip.date).toLocaleDateString()
    : "—";    

    return (
      <TableRow key={trip.id}>
        <TableCell>{trip.id}</TableCell>
        <TableCell>{routeName}</TableCell>
        <TableCell>{routeType}</TableCell>
        <TableCell>{trip.status || "scheduled"}</TableCell>
        <TableCell>{busPlate}</TableCell>
        <TableCell>{driverName}</TableCell>
        <TableCell>{startTerminalName}</TableCell>
        <TableCell>{renderTerminals(terminals)}</TableCell>
        <TableCell>{formattedDate}</TableCell>
        <TableCell>{startTime}</TableCell>
        <TableCell>{endTime}</TableCell>
        <TableCell className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => alert(`Edit trip ${routeName} TBD`)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleDeleteClick(trip)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Manage Trips</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateSemester(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create Semester Trips
          </Button>
          <Button variant="outline" onClick={() => setShowCreateSingle(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create Single Trip
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full sm:w-[300px]">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Semester Routes */}
      <Card>
        <CardHeader>
          <CardTitle>Semester-Wide Trips</CardTitle>
          <CardDescription>Recurring semester-wide routes</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading routes...</p>
          ) : filterRoutes(routes).length === 0 ? (
            <p className="text-sm text-muted-foreground">No semester-wide trips found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Days of Week</TableHead>
                  <TableHead>Start Terminal</TableHead>
                  <TableHead>Terminals</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filterRoutes(routes).map((route: any) => {
                  const startTerminalName = route.start_terminal?.terminalName || "—";
                  const terminals = route.terminals || [];
                  const daysOfWeek = Array.isArray(route.days_of_week)
                    ? route.days_of_week.join(", ")
                    : "—";

                  return (
                    <TableRow key={route.id}>
                      <TableCell>{route.id}</TableCell>
                      <TableCell>{route.name || "—"}</TableCell>
                      <TableCell>{route.type || "—"}</TableCell>
                      <TableCell>{daysOfWeek}</TableCell>
                      <TableCell>{startTerminalName}</TableCell>
                      <TableCell>{renderTerminals(terminals)}</TableCell>
                      <TableCell>{route.start_time || "—"}</TableCell>
                      <TableCell>{route.end_time || "—"}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEditRoute(route)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteRouteClick(route)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* All Single Trips */}
      <Card>
        <CardHeader>
          <CardTitle>All Trips</CardTitle>
          <CardDescription>All scheduled trips</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading trips...</p>
          ) : filterTrips(allTrips).length === 0 ? (
            <p className="text-sm text-muted-foreground">No trips found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bus</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Start Terminal</TableHead>
                  <TableHead>Terminals</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{filterTrips(allTrips).map(renderRow)}</TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreateSemester} onOpenChange={setShowCreateSemester}>
  {showCreateSemester && (
    <DialogContent className="max-w-lg p-0 overflow-hidden">
      <div className="flex flex-col h-[70vh]">
        <DialogHeader className="p-6 border-b">
          <DialogTitle>
            {editingRoute ? "Edit Semester Trip Route" : "Create Semester Trips"}
          </DialogTitle>
          <DialogDescription>
            {editingRoute
              ? "Update the semester-wide route configuration."
              : "Generate recurring trips for the semester."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <CreateSemesterTrips
            editingRoute={editingRoute}
            onCancel={() => {
              setShowCreateSemester(false);
              setEditingRoute(null);
            }}
            onSuccess={() => {
              setShowCreateSemester(false);
              setEditingRoute(null);
              loadTrips();
            }}
          />
        </div>
      </div>
    </DialogContent>
  )}
</Dialog>


      {/* Create Single Trip Dialog */}
      <Dialog open={showCreateSingle} onOpenChange={setShowCreateSingle}>
  {showCreateSingle && (
    <DialogContent className="max-w-lg p-0 overflow-hidden">
      <div className="flex flex-col h-[70vh]">
        <DialogHeader className="p-6 border-b">
          <DialogTitle>Create Single Trip</DialogTitle>
          <DialogDescription>Configure and create a one-time trip.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <CreateTrip
            onCancel={() => setShowCreateSingle(false)}
            onSuccess={() => {
              setShowCreateSingle(false);
              loadTrips();
            }}
          />
        </div>
      </div>
    </DialogContent>
  )}
</Dialog>


      {/* Confirm Delete Trip Dialog */}
      {tripToDelete && (
        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          title={`Delete Trip`}
          message={`Are you sure you want to delete trip ${tripToDelete.route?.name || tripToDelete.route_name || tripToDelete.id}?`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}

      {/* Confirm Delete Route Dialog */}
      {routeToDelete && (
        <ConfirmDeleteDialog
          open={deleteRouteDialogOpen}
          title={`Delete Semester Route`}
          message={`Are you sure you want to delete the route "${routeToDelete.name}" and all related trips? This action cannot be undone.`}
          confirmLabel="Delete Route"
          onConfirm={confirmDeleteRoute}
          onCancel={cancelDeleteRoute}
        />
      )}
    </div>
  );
}
