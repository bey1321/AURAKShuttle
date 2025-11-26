"use client";

import {
  Bus,
  MapPin,
  Package,
  Clock,
  User,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Progress,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
  Input,
} from "../ui";
import { getNotifications, LocalNotification } from "../../lib/localNotifications";
import { userAPI } from "../../lib/api";
import React, { useState, useEffect, useRef } from "react";

interface Trip {
  id: number;
  date: string;
  status: string;
  ETA: string;
  bus_id: number;
  route_id: number;
  route_name: string;
  departure: string;
  arrival: string;
  driver: string;
  capacity?: number;
  available?: number;
  days: string[];
  raw?: any;
  route?: {
    name: string;
    start_time: string;
    end_time: string;
    days_of_week: string[];
  };
  bus?: {
    plate_num: string;
    no_seats: number;
    model?: string;
  };
}

interface StudentDashboardProps {
  onNavigate?: (page: string) => void;
}

export function StudentDashboard({ onNavigate }: StudentDashboardProps) {
  const [showReserveDialog, setShowReserveDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [todaysTrips, setTodaysTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geoWatchRef = useRef<number | null>(null);

  useEffect(() => {
    // Load Leaflet CSS and JS via CDN when component mounts
    const leafletCssId = "leaflet-css";
    const leafletJsId = "leaflet-js";

    function ensureCss() {
      if (!document.getElementById(leafletCssId)) {
        const link = document.createElement("link");
        link.id = leafletCssId;
        link.rel = "stylesheet";
        // load local copy from public/
        link.href = "/leaflet.css";
        document.head.appendChild(link);
      }
    }

    function ensureScript(): Promise<void> {
      return new Promise((resolve, reject) => {
        if ((window as any).L) return resolve();
        if (document.getElementById(leafletJsId)) {
          // wait a bit
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
        // load local copy from public/
        script.src = "/leaflet.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load local Leaflet script"));
        document.body.appendChild(script);
      });
    }

    let intervalId: number | null = null;

    ensureCss();
    ensureScript()
      .then(() => {
        try {
          const L = (window as any).L;
          if (!L) return;
          // initialize map if not already
          if (!mapRef.current) {
            const map = L.map("leaflet-demo-map", { zoomControl: false }).setView([25.2, 55.3], 12);
            // Use CARTO Voyager (colorful) which commonly shows labels in English
            L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
              subdomains: "abcd",
              maxZoom: 19,
            }).addTo(map);
            mapRef.current = map;

            // initial marker (will be updated by geolocation)
            const demoIcon = L.divIcon({
              className: "custom-leaflet-marker",
              html: '<span style="display:block;width:16px;height:16px;background:#1976d2;border-radius:50%;box-shadow:0 0 6px rgba(25,118,210,0.6);border:2px solid white"></span>',
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            });
            const marker = L.marker([25.2, 55.3], { icon: demoIcon }).addTo(map);
            markerRef.current = marker;

            // start geolocation watch immediately to show user's real-time location
            if (navigator.geolocation) {
              const success = (pos: GeolocationPosition) => {
                const { latitude, longitude } = pos.coords;
                markerRef.current.setLatLng([latitude, longitude]);
                mapRef.current.panTo([latitude, longitude]);
                try {
                  const ts = new Date().toLocaleString("en-US");
                  markerRef.current.bindPopup(`You are here — ${ts}`).openPopup();
                } catch {}
              };

              const error = (err: GeolocationPositionError) => {
                console.warn("Geolocation error:", err);
              };

              const id = navigator.geolocation.watchPosition(success, error, {
                enableHighAccuracy: true,
                maximumAge: 10000,
                timeout: 10000,
              });
              geoWatchRef.current = id as unknown as number;
            }
          }
        } catch (err) {
          // ignore initialization errors
          // console.error("Leaflet init error", err);
        }
      })
      .catch(() => {
        // ignore load errors for demo
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
          markerRef.current = null;
        }
      } catch {}
    };
  }, []);
  // geolocation starts automatically on mount and is cleaned up on unmount
  const [localNotifs, setLocalNotifs] = React.useState<LocalNotification[]>([]);
  const [activeNotif, setActiveNotif] = React.useState<LocalNotification | null>(null);
  const [notifDialogOpen, setNotifDialogOpen] = React.useState(false);

  // Fetch today's trips
  useEffect(() => {
    const fetchTodaysTrips = async () => {
      setLoading(true);
      try {
        const myTripsData = await userAPI.getMyTrips();
        
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Map and filter trips for today
        const mappedTrips = (myTripsData || [])
          .map((trip: any) => ({
            id: trip.id,
            date: trip.date || "",
            status: trip.status || "",
            ETA: trip.ETA || trip.start_time || "",
            bus_id: trip.bus_id || 0,
            route_id: trip.route_id || trip.route?.id || 0,
            route_name: trip.route_name || trip.route?.name || "",
            departure: trip.start_time || trip.ETA || "",
            arrival: trip.end_time || trip.ETA || "",
            driver: trip.driver_name || trip.driver || (trip.bus_id ? `Bus ${trip.bus_id}` : "N/A"),
            capacity: typeof trip.total_seats === "number"
              ? trip.total_seats
              : typeof trip.capacity === "number"
              ? trip.capacity
              : trip.bus?.no_seats
              ? Number(trip.bus.no_seats)
              : undefined,
            available: typeof trip.seats_remaining === "number"
              ? trip.seats_remaining
              : typeof trip.available === "number"
              ? trip.available
              : undefined,
            days: trip.days_of_week || trip.route?.days_of_week || [],
            route: trip.route ? {
              name: trip.route.name || "",
              start_time: trip.route.start_time || "",
              end_time: trip.route.end_time || "",
              days_of_week: trip.route.days_of_week || [],
            } : undefined,
            bus: trip.bus ? {
              plate_num: trip.bus.plate_num || "",
              no_seats: trip.bus.no_seats || 0,
              model: trip.bus.model || "",
            } : undefined,
            raw: trip,
          } as Trip))
          .filter((trip: Trip) => trip.date === today); // Filter for today only
        
        setTodaysTrips(mappedTrips);
      } catch (err) {
        console.error("Failed to fetch today's trips:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTodaysTrips();
  }, []);

  useEffect(() => {
    // load notifications from localStorage (frontend-only)
    try {
      setLocalNotifs(getNotifications());
    } catch {}

    // listen for updates (other tabs/components)
    const onUpdate = (e: any) => {
      try {
        setLocalNotifs(getNotifications());
      } catch {}
    };
    window.addEventListener("aurak:notifications:updated", onUpdate);
    window.addEventListener("aurak:notifications:cleared", onUpdate);
    return () => {
      window.removeEventListener("aurak:notifications:updated", onUpdate);
      window.removeEventListener("aurak:notifications:cleared", onUpdate);
    };
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1>Student Dashboard</h1>
        <p className="text-muted-foreground">
          Track shuttles and manage your commute
        </p>
      </div>

      {/* Mini Map Placeholder - Leaflet demo */}
              <div className="h-48 bg-muted rounded-lg overflow-hidden" aria-hidden>
                <div id="leaflet-demo-map" className="w-full h-full" />
                {/* geolocation watch starts automatically; no toggle needed */}
              </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
          <CardDescription>Your registered trips for today</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-4 text-muted-foreground">Loading trips...</p>
          ) : todaysTrips.length === 0 ? (
            <p className="text-muted-foreground">You have no trips scheduled for today.</p>
          ) : (
            <div className="space-y-4">
              {todaysTrips.map((trip) => (
                <Card key={trip.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Bus className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <h3>{trip.route?.name || trip.route_name || `Trip ${trip.id}`}</h3>
                            <div className="text-xs text-muted-foreground mt-1">
                              ID: {trip.id} • {trip.date} • {trip.status}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{trip.route?.start_time || "09:00:00"} - {trip.route?.end_time || "—"}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Bus className="w-4 h-4" />
                                <span>Bus: {trip.bus?.plate_num || "N/A"}</span>
                              </div>
                            </div>
                          </div>

                          {Array.isArray(trip.route?.days_of_week) && trip.route.days_of_week.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Days:</span>
                              <div className="flex gap-1">
                                {trip.route.days_of_week.map((day: string) => (
                                  <Badge key={day} variant="outline" className="text-xs">
                                    {day.substring(0, 3)}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Seats:</span>
                            <span className="text-sm">
                              {trip.bus?.no_seats
                                ? `1/${trip.bus.no_seats}`
                                : "Seats info unavailable"}
                            </span>
                            {trip.bus?.no_seats ? (
                              <div className="flex-1 max-w-xs">
                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary"
                                    style={{
                                      width: `${(1 / trip.bus.no_seats) * 100}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedTrip(trip);
                            setShowDetailsDialog(true);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onNavigate?.("user-lost-found")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h4>Lost & Found</h4>
                <p className="text-sm text-muted-foreground">
                  Report or claim items
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onNavigate?.("schedule")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h4>Full Schedule</h4>
                <p className="text-sm text-muted-foreground">
                  View all routes and times
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trip Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trip Details</DialogTitle>
            <DialogDescription>
              Complete information about this shuttle trip
            </DialogDescription>
          </DialogHeader>
          {selectedTrip && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Trip ID</Label>
                  <Input value={selectedTrip.id} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input value={selectedTrip.date || "—"} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Input value={selectedTrip.status || "—"} disabled />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Route ID</Label>
                  <Input value={selectedTrip.route_id || "—"} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Bus ID</Label>
                  <Input value={selectedTrip.bus_id || "—"} disabled />
                </div>
                <div className="space-y-2">
                  <Label>ETA</Label>
                  <Input value={selectedTrip.ETA || "—"} disabled />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Route</Label>
                <Input value={selectedTrip.route_name} disabled />
              </div>
              <div className="space-y-2">
                <Label>Driver</Label>
                <Input value={selectedTrip.driver} disabled />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Departure Time</Label>
                  <Input value={selectedTrip.departure} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Arrival Time</Label>
                  <Input value={selectedTrip.arrival} disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Operating Days</Label>
                <div className="flex gap-2">
                  {selectedTrip.days.map((day) => (
                    <Badge key={day} variant="outline">
                      {day}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input 
                  value={`${selectedTrip.capacity ?? "N/A"} seats (${selectedTrip.available ?? "N/A"} available)`} 
                  disabled 
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    setShowDetailsDialog(false);
                    onNavigate?.("tracking");
                  }}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Track Live
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDetailsDialog(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
