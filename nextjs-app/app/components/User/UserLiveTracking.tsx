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
import React, { useState, useEffect } from "react";
import { activeShuttles } from "../../data/database";
import { StudentGPSComponent, LiveTrackingMap } from "../GPS";
import { tripAPI } from "../../lib/api";
import type { LocationData } from "../../hooks/useGPSWebSocket";

export function UserLiveTracking() {
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedShuttle, setSelectedShuttle] = useState<any>(null);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [myTrips, setMyTrips] = useState<any[]>([]);
  const [tripsLoading, setTripsLoading] = useState<boolean>(true);
  const [tripsError, setTripsError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false); // Track if user clicked "Live Track"
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get user's location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting user location:", error);
          // Set default location (RAK, UAE) if geolocation fails
          setUserLocation({ lat: 25.7617, lng: 55.9777 });
        }
      );
    } else {
      // Set default location if geolocation not available
      setUserLocation({ lat: 25.7617, lng: 55.9777 });
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchTrips = async () => {
      try {
        setTripsLoading(true);
        const trips = await tripAPI.getMyTrips();
        if (!mounted) return;
        setMyTrips(trips || []);
        if ((trips || []).length > 0) {
          setSelectedTripId((prev) => prev ?? trips[0].id);
        } else {
          // fallback to activeShuttles first id if available
          setSelectedTripId((prev) => prev ?? (activeShuttles.length > 0 ? activeShuttles[0].id : null));
        }
      } catch (e: any) {
        console.error("Error fetching user trips for live tracking:", e);
        setTripsError((e && e.message) || String(e));
        setSelectedTripId((prev) => prev ?? (activeShuttles.length > 0 ? activeShuttles[0].id : null));
      } finally {
        if (mounted) setTripsLoading(false);
      }
    };
    fetchTrips();
    return () => {
      mounted = false;
    };
  }, []);
  // TODO: Get adminId from auth context/session - this component is used by admins
  const StudentID = 1; // Replace with actual admin ID from auth

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
      {/* Student GPS Component (real student tracking) */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Live Map</CardTitle>
              {currentLocation && (
                <Badge variant="default" className="bg-green-500">
                  <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                  Tracking: {currentLocation.bus_number || "Bus"}
                </Badge>
              )}
            </div>
            <div className="ml-4">
              <label className="text-sm text-muted-foreground mr-2">Track Shuttle:</label>
              <select
                value={selectedTripId ?? ""}
                onChange={(e) => {
                  setSelectedTripId(Number(e.target.value));
                  setCurrentLocation(null); // Reset location when changing dropdown
                }}
                className="border border-border rounded px-2 py-1 text-sm"
              >
                {tripsLoading ? (
                  <option value="" disabled>
                    Loading trips...
                  </option>
                ) : myTrips.length > 0 ? (
                  myTrips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.route_name || t.route || t.name || `Trip ${t.id}`} ({t.date || "N/A"})
                    </option>
                  ))
                ) : (
                  // fallback to activeShuttles mock data
                  activeShuttles.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.route} ({s.location})
                    </option>
                  ))
                )}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {currentLocation && isTracking ? (
                <>
                  {/* Bus Tracking Map */}
                  <LiveTrackingMap location={currentLocation} height="600px" zoom={15} showPopup={true} />

                  {/* Map Legend */}
                  <div className="absolute bottom-4 left-4 bg-card p-4 rounded-lg shadow-lg border border-border z-[1000]">
                    <p className="text-sm font-semibold mb-2">Bus Status</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full" />
                        <span>Moving</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                        <span>Stopped</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                        <span>Active</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : userLocation ? (
                <>
                  {/* User Location Map */}
                  <LiveTrackingMap
                    location={{
                      trip_id: 0,
                      latitude: userLocation.lat,
                      longitude: userLocation.lng,
                      speed: 0,
                      heading: 0,
                      last_update: new Date().toISOString(),
                      status: "idle",
                      bus_number: "Your Location",
                    }}
                    height="600px"
                    zoom={13}
                    showPopup={false}
                  />

                  {/* Info overlay */}
                  <div className="absolute bottom-4 left-4 bg-card p-4 rounded-lg shadow-lg border border-border z-[1000]">
                    <p className="text-sm font-semibold mb-2">📍 Your Location</p>
                    <p className="text-xs text-muted-foreground">Click &quot;Live Track&quot; on a shuttle to track it</p>
                  </div>
                </>
              ) : (
                <div className="h-[600px] bg-muted rounded-lg border border-border relative overflow-hidden flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-16 h-16 text-primary mx-auto mb-4" />
                    <h3 className="mb-2">Loading Map...</h3>
                    <p className="text-muted-foreground">Getting your location...</p>
                    <div className="mt-4">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Student GPS Panel */}
        <div className="lg:col-span-1">
          {selectedTripId && isTracking ? (
            <StudentGPSComponent
              tripId={selectedTripId}
              onLocationUpdate={(loc) => {
                // Update location state to show on main map
                setCurrentLocation(loc);
                console.log("Student GPS location update:", loc);
              }}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  {selectedTripId
                    ? "Click 'Live Track' to start tracking this shuttle"
                    : "No shuttle selected for live tracking."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Shuttle List */}
        <Card>
          <CardHeader>
            <CardTitle>Active Shuttles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeShuttles.map((shuttle) => (
              <div
                key={shuttle.id}
                className={`p-4 border rounded-lg space-y-3 hover:bg-accent transition-colors ${
                  isTracking && selectedTripId === shuttle.id
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        shuttle.occupancy >= 80
                          ? "bg-red-100"
                          : shuttle.occupancy >= 50
                          ? "bg-yellow-100"
                          : "bg-green-100"
                      }`}
                    >
                      <Bus
                        className={`w-5 h-5 ${
                          shuttle.occupancy >= 80
                            ? "text-red-600"
                            : shuttle.occupancy >= 50
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm">{shuttle.route}</h4>
                      <p className="text-xs text-muted-foreground">
                        {shuttle.driver}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      shuttle.status === "Moving"
                        ? "default"
                        : shuttle.status === "At Stop"
                        ? "outline"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {shuttle.status}
                  </Badge>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Occupancy</span>
                    <span className={getOccupancyColor(shuttle.occupancy)}>
                      {getOccupancyLabel(shuttle.occupancy)} (
                      {shuttle.passengers}/{shuttle.capacity})
                    </span>
                  </div>

                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        shuttle.occupancy >= 80
                          ? "bg-red-500"
                          : shuttle.occupancy >= 50
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${shuttle.occupancy}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span>{shuttle.location}</span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>ETA: {shuttle.eta}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={isTracking && selectedTripId === shuttle.id ? "default" : "outline"}
                    className="flex-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click
                      setSelectedTripId(shuttle.id);
                      setIsTracking(true); // Enable WebSocket tracking
                      setCurrentLocation(null); // Reset location when switching trips
                    }}
                  >
                    {isTracking && selectedTripId === shuttle.id ? "Tracking" : "Live Track"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => {
                      setSelectedShuttle(shuttle);
                      setShowDetailsDialog(true);
                    }}
                  >
                    Details
                  </Button>
                </div>
              </div>
            ))}
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
              <div className="space-y-2">
                <Label>Route</Label>
                <Input value={selectedShuttle.route} disabled />
              </div>
              <div className="space-y-2">
                <Label>Driver</Label>
                <Input value={selectedShuttle.driver} disabled />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Badge
                  variant={
                    selectedShuttle.status === "Moving" ? "default" : "outline"
                  }
                >
                  {selectedShuttle.status}
                </Badge>
              </div>
              <div className="space-y-2">
                <Label>Current Location</Label>
                <Input value={selectedShuttle.location} disabled />
              </div>
              <div className="space-y-2">
                <Label>ETA</Label>
                <Input value={selectedShuttle.eta} disabled />
              </div>
              <div className="space-y-2">
                <Label>Occupancy</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={`${selectedShuttle.passengers}/${selectedShuttle.capacity} (${selectedShuttle.occupancy}%)`}
                    disabled
                  />
                  <Badge
                    variant={
                      selectedShuttle.occupancy >= 80
                        ? "destructive"
                        : selectedShuttle.occupancy >= 50
                        ? "default"
                        : "outline"
                    }
                  >
                    {selectedShuttle.occupancy >= 80
                      ? "Full"
                      : selectedShuttle.occupancy >= 50
                      ? "Half Full"
                      : "Available"}
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowDetailsDialog(false)}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
