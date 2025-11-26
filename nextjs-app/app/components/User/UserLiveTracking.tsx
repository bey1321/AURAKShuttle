"use client";

import { MapPin } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from "../ui";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { StudentGPSComponent } from "../GPS";
import { tripAPI } from "../../lib/api";
import type { LocationData } from "../../hooks/useGPSWebSocket";

// Dynamically import LiveTrackingMap to avoid SSR issues with Leaflet
const LiveTrackingMap = dynamic(
  () => import("../GPS/LiveTrackingMap").then((mod) => mod.LiveTrackingMap),
  { ssr: false }
);

export function UserLiveTracking() {
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
        }
      } catch (e: any) {
        console.error("Error fetching user trips for live tracking:", e);
        setTripsError((e && e.message) || String(e));
      } finally {
        if (mounted) setTripsLoading(false);
      }
    };
    fetchTrips();
    return () => {
      mounted = false;
    };
  }, []);

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
            <div className="ml-4 flex items-center gap-3">
              <label className="text-sm text-muted-foreground">Track Shuttle:</label>
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
                  myTrips.map((t) => {
                    // Extract route name from nested object structure
                    const routeName = t.route_name || t.route?.name || t.name || `Trip ${t.id}`;
                    // Format date properly
                    const dateStr = t.date ? (typeof t.date === 'string' ? t.date.split('T')[0] : t.date) : 'N/A';
                    return (
                      <option key={t.id} value={t.id}>
                        {routeName} ({dateStr})
                      </option>
                    );
                  })
                ) : (
                  <option value="" disabled>
                    No trips available
                  </option>
                )}
              </select>
              <Button
                size="sm"
                variant={isTracking ? "default" : "outline"}
                onClick={() => {
                  if (selectedTripId) {
                    setIsTracking(!isTracking);
                    if (!isTracking) {
                      setCurrentLocation(null); // Reset location when starting tracking
                    }
                  }
                }}
                disabled={!selectedTripId}
              >
                {isTracking ? "Stop Tracking" : "Live Track"}
              </Button>
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

      </div>
    </div>
  );
}