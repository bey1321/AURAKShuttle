"use client";

import { MapPin, Bus, Users, Navigation, Clock, Maximize2 } from "lucide-react";
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
import { activeShuttles, routes } from "../../data/database";
import { AdminGPSComponent, AdminLiveMap } from "../GPS";
import { adminAPI } from "../../lib/api";
import type { LocationData } from "../../hooks/useGPSWebSocket";

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

  
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const geoWatchRef = useRef<number | null>(null);

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

  // Leaflet map initialization
  useEffect(() => {
    const leafletCssId = "leaflet-css";
    const leafletJsId = "leaflet-js";

    function ensureCss() {
      if (!document.getElementById(leafletCssId)) {
        const link = document.createElement("link");
        link.id = leafletCssId;
        link.rel = "stylesheet";
        link.href = "/leaflet.css";
        document.head.appendChild(link);
      }
    }

    function ensureScript(): Promise<void> {
      return new Promise((resolve, reject) => {
        if ((window as any).L) return resolve();
        if (document.getElementById(leafletJsId)) {
          const check = setInterval(() => {
            if ((window as any).L) {
              clearInterval(check);
              resolve();
            }
          }, 50);
          setTimeout(() => {
            clearInterval(check);
            reject(new Error("Leaflet script load timeout"));
          }, 5000);
          return;
        }

        const script = document.createElement("script");
        script.id = leafletJsId;
        script.src = "/leaflet.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Leaflet script"));
        document.body.appendChild(script);
      });
    }

    ensureCss();
    ensureScript()
      .then(() => {
        try {
          const L = (window as any).L;
          if (!L) return;
          
          if (!mapRef.current) {
            const map = L.map("admin-leaflet-map", { zoomControl: true }).setView([25.2, 55.3], 12);
            L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
              subdomains: "abcd",
              maxZoom: 19,
            }).addTo(map);
            mapRef.current = map;

            // Add sample markers for active shuttles
            const busIcon = L.divIcon({
              className: "custom-leaflet-marker",
              html: '<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;background:#ef4444;border-radius:50%;box-shadow:0 2px 8px rgba(239,68,68,0.6);border:3px solid white"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="3" y="6" width="18" height="11" rx="2"/><path d="M3 8h18M7 6V4M17 6V4M7 17v2M17 17v2"/></svg></div>',
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            });

            // Sample shuttle locations
            const sampleLocations = [
              { lat: 25.21, lng: 55.31, label: "Route 1" },
              { lat: 25.19, lng: 55.29, label: "Route 2" },
              { lat: 25.23, lng: 55.33, label: "Route 3" },
            ];

            sampleLocations.forEach((loc) => {
              const marker = L.marker([loc.lat, loc.lng], { icon: busIcon })
                .addTo(map)
                .bindPopup(`<b>${loc.label}</b><br>Active shuttle`);
              markersRef.current.push(marker);
            });

            // Add admin's real-time location marker
            const adminIcon = L.divIcon({
              className: "custom-leaflet-marker",
              html: '<div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;background:#8b5cf6;border-radius:50%;box-shadow:0 0 8px rgba(139,92,246,0.8);border:3px solid white"><div style="width:8px;height:8px;background:white;border-radius:50%;"></div></div>',
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            });

            const userMarker = L.marker([25.2, 55.3], { icon: adminIcon }).addTo(map);
            userMarkerRef.current = userMarker;

            // Get admin's current location and start watching
            if (navigator.geolocation) {
              let isFirstLocation = true;
              
              const success = (pos: GeolocationPosition) => {
                const { latitude, longitude } = pos.coords;
                if (userMarkerRef.current) {
                  userMarkerRef.current.setLatLng([latitude, longitude]);
                  const ts = new Date().toLocaleString("en-US");
                  userMarkerRef.current.bindPopup(`<b>Your Location</b><br>Admin<br>${ts}`).openPopup();
                  
                  // Only center map on first location update
                  if (isFirstLocation) {
                    mapRef.current.setView([latitude, longitude], 13);
                    isFirstLocation = false;
                  }
                }
              };

              const error = (err: GeolocationPositionError) => {
                console.warn("Geolocation error:", err);
              };

              const id = navigator.geolocation.watchPosition(success, error, {
                enableHighAccuracy: true,
                maximumAge: 5000,
                timeout: 10000,
              });
              geoWatchRef.current = id as unknown as number;
            }
          }
        } catch (err) {
          console.error("Leaflet init error", err);
        }
      })
      .catch((err) => {
        console.error("Failed to load Leaflet", err);
      });

    return () => {
      if (geoWatchRef.current && navigator.geolocation) {
        navigator.geolocation.clearWatch(geoWatchRef.current);
        geoWatchRef.current = null;
      }
      try {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
          markersRef.current = [];
          userMarkerRef.current = null;
        }
      } catch {}
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
                  <Maximize2 className="w-4 h-4" />
                  Expand
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] rounded-lg border border-border overflow-hidden">
              <AdminLiveMap locations={busLocations} height="600px" zoom={13} />
            </div>
=======

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
