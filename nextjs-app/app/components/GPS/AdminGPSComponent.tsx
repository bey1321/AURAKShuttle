"use client";

import React, { useState } from "react";
import { MapPin, Bus, Clock, Navigation, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Alert,
  AlertDescription,
} from "../ui";
import { useGPSWebSocket, LocationData } from "../../hooks/useGPSWebSocket";

interface AdminGPSComponentProps {
  onLocationUpdate?: (locations: LocationData[]) => void;
}

export function AdminGPSComponent({
  onLocationUpdate,
}: AdminGPSComponentProps) {
  const [locations, setLocations] = useState<Map<number, LocationData>>(
    new Map()
  );
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const { isConnected, connectionStatus, lastError } = useGPSWebSocket({
    role: "admin",
    userId: undefined, // Not needed for admin route
    enabled: true,
    onMessage: (message) => {
      if (message.type === "all_buses" && Array.isArray(message.data)) {
        const locationsMap = new Map<number, LocationData>();
        message.data.forEach((loc: LocationData) => {
          locationsMap.set(loc.trip_id, loc);
        });
        setLocations(locationsMap);
        setLastUpdate(new Date());
        onLocationUpdate?.(Array.from(locationsMap.values()));
      } else if (
        message.type === "bus_location" &&
        !Array.isArray(message.data)
      ) {
        const locationData = message.data as LocationData;
        setLocations((prev) => {
          const updated = new Map(prev);
          updated.set(locationData.trip_id, locationData);
          setLastUpdate(new Date());
          onLocationUpdate?.(Array.from(updated.values()));
          return updated;
        });
      }
    },
    onError: (error) => {
      console.error("GPS WebSocket error:", error);
    },
  });

  const formatTime = (dateString: string) => {
    try {
      // Handle different timestamp formats
      // Replace timezone offset (+00:00) with Z for UTC, or just parse as-is
      let cleanDateString = dateString;
      if (dateString.includes('+00:00')) {
        cleanDateString = dateString.replace('+00:00', 'Z');
      } else if (!dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
        // Only append Z if there's no timezone info
        cleanDateString = `${dateString}Z`;
      }

      const date = new Date(cleanDateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error("[Admin GPS Time] Invalid date string for formatting:", dateString);
        return "Unknown";
      }

      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (error) {
      console.error("[Admin GPS Time] Error formatting time:", error, dateString);
      return "Unknown";
    }
  };

  const getTimeAgo = (dateString: string) => {
    try {
      // Handle different timestamp formats
      // Replace timezone offset (+00:00) with Z for UTC, or just parse as-is
      let cleanDateString = dateString;
      if (dateString.includes('+00:00')) {
        cleanDateString = dateString.replace('+00:00', 'Z');
      } else if (!dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
        // Only append Z if there's no timezone info
        cleanDateString = `${dateString}Z`;
      }

      const date = new Date(cleanDateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error("[Admin GPS Time] Invalid date string:", dateString);
        return "Unknown";
      }

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      // Handle future timestamps (server time ahead of client)
      if (diffMins < 0) {
        console.warn("[Admin GPS Time] Future timestamp detected.");
        return "Just now";
      }

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} min ago`;
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    } catch (error) {
      console.error("[Admin GPS Time] Error calculating time ago:", error, dateString);
      return "Unknown";
    }
  };

  const locationsArray = Array.from(locations.values());

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>All Active Buses</CardTitle>
            <CardDescription>
              Real-time tracking of all active shuttle buses
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={isConnected ? "default" : "secondary"}
              className={isConnected ? "bg-green-500" : ""}
            >
              {isConnected ? "Live" : connectionStatus}
            </Badge>
            <Badge variant="outline">{locationsArray.length} Active</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{lastError}</AlertDescription>
          </Alert>
        )}

        {!isConnected && connectionStatus === "connecting" && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Connecting to GPS service...</AlertDescription>
          </Alert>
        )}

        {locationsArray.length === 0 ? (
          <div className="text-center py-8">
            <Bus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {isConnected
                ? "No active buses at the moment"
                : "Not connected. Please wait..."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {locationsArray.map((location) => (
              <div
                key={location.trip_id}
                className="p-4 border border-border rounded-lg space-y-3 hover:bg-accent transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Bus className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">
                        Trip #{location.trip_id}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Bus: {location.bus_number || "N/A"}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      location.status === "in_progress" ? "default" : "outline"
                    }
                  >
                    {location.status || "Active"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Coordinates</p>
                    <p className="font-mono text-xs">
                      {location.latitude.toFixed(6)},{" "}
                      {location.longitude.toFixed(6)}
                    </p>
                  </div>

                  {location.speed !== undefined && (
                    <div>
                      <p className="text-muted-foreground">Speed</p>
                      <p className="font-semibold flex items-center gap-1">
                        <Navigation className="w-4 h-4" />
                        {location.speed.toFixed(1)} km/h
                      </p>
                    </div>
                  )}

                  <div className="col-span-2">
                    <p className="text-muted-foreground">Last Update</p>
                    <p className="font-semibold flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {formatTime(location.last_update)} (
                      {getTimeAgo(location.last_update)})
                    </p>
                  </div>
                </div>

                {/* Map Preview */}
                <div className="h-32 bg-muted rounded-lg border border-border relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-primary" />
                  </div>
                  {/* Bus Marker */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                    <Bus className="w-4 h-4 text-primary-foreground" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {lastUpdate && (
          <div className="text-center text-xs text-muted-foreground pt-2 border-t">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
