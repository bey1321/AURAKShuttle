"use client";

import { MapPin, Bus, Users, Navigation, Clock } from "lucide-react";
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
import React, { useEffect, useState } from "react";
import { activeShuttles, routes } from "../../data/database";
import { AdminGPSComponent } from "../GPS";
import { adminAPI } from "../../lib/api";

export function AdminLiveTracking() {
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedShuttle, setSelectedShuttle] = useState<any>(null);
  // TODO: Get adminId from auth context/session - this component is used by admins
  const adminId = 1; // Replace with actual admin ID from auth

  const [trips, setTrips] = useState<any[]>([]);
  const [tripsLoading, setTripsLoading] = useState<boolean>(true);
  const [tripsError, setTripsError] = useState<string | null>(null);

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

      {/* Active Shuttles Count */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Shuttles</p>
                <h3>3</h3>
              </div>
              <Bus className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Passengers
                </p>
                <h3>84</h3>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Occupancy</p>
                <h3>70%</h3>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Routes Active</p>
                <h3>4</h3>
              </div>
              <Navigation className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time GPS Component */}
      {/* <AdminGPSComponent /> */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View - use AdminGPSComponent to display live feed */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Live Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] bg-muted rounded-lg border border-border overflow-hidden">
              <AdminGPSComponent />
            </div>
          </CardContent>
        </Card>

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

      {/* Route Information */}
      <Card>
        <CardHeader>
          <CardTitle>Route Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                route: "Route 1",
                from: "Main Campus",
                to: "Khatt Terminal",
                frequency: "Every 30 min",
              },
              {
                route: "Route 2",
                from: "Khatt Terminal",
                to: "Main Campus",
                frequency: "Every 30 min",
              },
              {
                route: "Route 3",
                from: "Main Campus",
                to: "RAK Mall",
                frequency: "Every 45 min",
              },
              {
                route: "Route 4",
                from: "RAK Mall",
                to: "Main Campus",
                frequency: "Every 45 min",
              },
            ].map((route, index) => (
              <div key={index} className="p-4 border border-border rounded-lg">
                <h4 className="mb-2">{route.route}</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    From: <span className="text-foreground">{route.from}</span>
                  </p>
                  <p>
                    To: <span className="text-foreground">{route.to}</span>
                  </p>
                  <p>
                    Frequency:{" "}
                    <span className="text-foreground">{route.frequency}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
}
