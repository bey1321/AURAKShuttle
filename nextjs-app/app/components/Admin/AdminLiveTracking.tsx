"use client";

import { MapPin, Bus, Users, Navigation, Clock, Maximize } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Label,
  Input,
} from "../ui";
import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { activeShuttles, routes } from "../../data/database";
import { AdminGPSComponent } from "../GPS";
import { adminAPI } from "../../lib/api";
import type { LocationData } from "../../hooks/useGPSWebSocket";

// Dynamically import AdminLiveMap to avoid SSR issues with Leaflet
const AdminLiveMap = dynamic(
  () => import("../GPS/AdminLiveMap").then((mod) => mod.AdminLiveMap),
  { ssr: false }
);

export function AdminLiveTracking() {
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedShuttle, setSelectedShuttle] = useState<any>(null);
  const [showMapDialog, setShowMapDialog] = useState(false);
  // TODO: Get adminId from auth context/session - this component is used by admins
  const adminId = 1; // Replace with actual admin ID from auth

  const [trips, setTrips] = useState<any[]>([]);
  const [tripsLoading, setTripsLoading] = useState<boolean>(true);
  const [tripsError, setTripsError] = useState<string | null>(null);

  const [busLocations, setBusLocations] = useState<LocationData[]>([]);

  useEffect(() => {
    let mounted = true;
    setTripsLoading(true);
    adminAPI
      .getTrips()
      .then((res) => {
        if (!mounted) return;
        setTrips(Array.isArray(res) ? res : []);
      })
      .catch((err) => {
        if (!mounted) return;
        setTripsError(String(err));
      })
      .finally(() => {
        if (!mounted) return;
        setTripsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const getOccupancyColor = (occupancy: number) => {
    if (occupancy >= 80) return "text-red-600";
    if (occupancy >= 50) return "text-yellow-600";
    return "text-green-600";
  };

  const getOccupancyLabel = (occupancy: number) => {
    if (occupancy >= 80) return "Full";
    if (occupancy >= 50) return "Half Full";
    return "Available";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1>Live Shuttle Tracking</h1>
        <p className="text-muted-foreground">
          Real-time location of all active shuttles
        </p>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View - Shows all active buses */}
        {/* Map View - Leaflet + GPS Component */}

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Live Map</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Real-time tracking of all active buses
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{busLocations.length} Active</Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowMapDialog(true)}
                  className="gap-2"
                >
                  <Maximize className="w-4 h-4" />
                  Expand
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] rounded-lg border border-border overflow-hidden relative" style={{ isolation: 'isolate' }}>
              <AdminLiveMap locations={busLocations} height="600px" zoom={13} />
            </div>

          </CardContent>
        </Card>

        {/* GPS Component - Handles WebSocket connection and data */}
        <div className="hidden">
          <AdminGPSComponent
            onLocationUpdate={(locations) => {
              setBusLocations(locations);
              console.log("Admin GPS locations updated:", locations);
            }}
          />
        </div>

        {/* Shuttle List */}
        <Card>
          <CardHeader>
            <CardTitle>Active Shuttles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tripsLoading ? (
              <div className="text-center py-8">Loading trips...</div>
            ) : tripsError ? (
              <div className="text-destructive text-sm">{tripsError}</div>
            ) : (
              (trips && trips.length ? trips : activeShuttles).map((shuttle: any) => {
                const id = shuttle.id ?? shuttle.trip_id ?? shuttle.tripId;
                const routeName = String(
                  shuttle.route?.name ?? shuttle.route ?? shuttle.name ?? shuttle.route_name ?? `Trip ${id}`
                );
                const driverName = String(
                  shuttle.driver?.name ?? shuttle.driver ?? shuttle.driver_name ?? "N/A"
                );
                const status = String(shuttle.status ?? shuttle.trip_status ?? "Active");
                const passengers = shuttle.passengers ?? shuttle.current_passengers ?? 0;
                const capacity = shuttle.capacity ?? shuttle.total_seats ?? 0;
                const occupancy = shuttle.occupancy ?? (capacity ? Math.round((passengers / capacity) * 100) : 0);
                const location = String(shuttle.location ?? shuttle.current_location ?? "N/A");
                const eta = String(shuttle.eta ?? shuttle.estimated_time ?? "N/A");

                return (
                  <div
                    key={id}
                    className="p-4 border border-border rounded-lg space-y-3 hover:bg-accent transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            occupancy >= 80
                              ? "bg-red-100"
                              : occupancy >= 50
                              ? "bg-yellow-100"
                              : "bg-green-100"
                          }`}
                        >
                          <Bus
                            className={`w-5 h-5 ${
                              occupancy >= 80
                                ? "text-red-600"
                                : occupancy >= 50
                                ? "text-yellow-600"
                                : "text-green-600"
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm">{routeName}</h4>
                          <p className="text-xs text-muted-foreground">{driverName}</p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          status === "Moving"
                            ? "default"
                            : status === "At Stop"
                            ? "outline"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {status}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Occupancy</span>
                        <span className={getOccupancyColor(occupancy)}>
                          {getOccupancyLabel(occupancy)} ({passengers}/{capacity})
                        </span>
                      </div>

                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            occupancy >= 80
                              ? "bg-red-500"
                              : occupancy >= 50
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${occupancy}%` }}
                        />
                      </div>

                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{location}</span>
                      </div>

                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>ETA: {eta}</span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={() => {
                        setSelectedShuttle(shuttle);
                        setShowDetailsDialog(true);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Shuttle Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Shuttle Details</DialogTitle>
            <DialogDescription>
              Complete information about this shuttle
            </DialogDescription>
          </DialogHeader>
          {selectedShuttle && (
            <div className="space-y-4 py-4">
              {(() => {
                const routeVal =
                  selectedShuttle.route?.name ??
                  selectedShuttle.route ??
                  selectedShuttle.name ??
                  selectedShuttle.route_name ??
                  "";
                const driverVal =
                  selectedShuttle.driver?.name ??
                  selectedShuttle.driver ??
                  selectedShuttle.driver_name ??
                  "N/A";
                const statusVal = selectedShuttle.status ?? selectedShuttle.trip_status ?? "Unknown";
                const locationVal =
                  typeof selectedShuttle.location === "string"
                    ? selectedShuttle.location
                    : selectedShuttle.current_location ?? "N/A";
                const etaVal = selectedShuttle.eta ?? selectedShuttle.estimated_time ?? "N/A";
                const passengersVal = selectedShuttle.passengers ?? selectedShuttle.current_passengers ?? 0;
                const capacityVal = selectedShuttle.capacity ?? selectedShuttle.total_seats ?? 0;
                const occupancyVal =
                  selectedShuttle.occupancy ?? (capacityVal ? Math.round((passengersVal / capacityVal) * 100) : 0);

                return (
                  <>
                    <div className="space-y-2">
                      <Label>Route</Label>
                      <Input value={String(routeVal)} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Driver</Label>
                      <Input value={String(driverVal)} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Badge variant={statusVal === "Moving" ? "default" : "outline"}>
                        {statusVal}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label>Current Location</Label>
                      <Input value={String(locationVal)} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>ETA</Label>
                      <Input value={String(etaVal)} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Occupancy</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={`${passengersVal}/${capacityVal} (${occupancyVal}%)`}
                          disabled
                        />
                        <Badge
                          variant={
                            occupancyVal >= 80
                              ? "destructive"
                              : occupancyVal >= 50
                              ? "default"
                              : "outline"
                          }
                        >
                          {occupancyVal >= 80 ? "Full" : occupancyVal >= 50 ? "Half Full" : "Available"}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => setShowDetailsDialog(false)}>
                      Close
                    </Button>
                  </>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Full-Screen Map Dialog */}
      <Dialog open={showMapDialog} onOpenChange={setShowMapDialog}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Live Bus Tracking Map</DialogTitle>
                <DialogDescription>
                  Real-time location of all {busLocations.length} active buses
                </DialogDescription>
              </div>
              <Badge variant="default" className="bg-green-500">
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                Live
              </Badge>
            </div>
          </DialogHeader>
          <div className="flex-1 px-6 pb-6">
            <div className="h-[calc(95vh-140px)] rounded-lg border border-border overflow-hidden relative">
              <AdminLiveMap locations={busLocations} height="100%" zoom={13} />

              {/* Map Legend */}
              <div className="absolute bottom-4 left-4 bg-card p-4 rounded-lg shadow-lg border border-border z-[1000]">
                <p className="text-sm font-semibold mb-3">Bus Status</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow" />
                    <span>In Progress</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow" />
                    <span>Stopped</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow" />
                    <span>Active</span>
                  </div>
                </div>
              </div>

              {/* Active Buses Counter */}
              <div className="absolute top-4 right-4 bg-card p-3 rounded-lg shadow-lg border border-border z-[1000]">
                <div className="flex items-center gap-2">
                  <Bus className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Active Buses</p>
                    <p className="text-xl font-bold">{busLocations.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
