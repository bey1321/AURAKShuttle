"use client";

import React, { useState, useEffect } from "react";
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

interface StudentGPSComponentProps {
  tripId: number;
  userId?: number;
  onLocationUpdate?: (location: LocationData) => void;
}

export function StudentGPSComponent({
  tripId,
  userId,
  onLocationUpdate,
}: StudentGPSComponentProps) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const { isConnected, connectionStatus, lastError, sendMessage } =
    useGPSWebSocket({
      role: "student",
      userId,
      tripId,
      enabled: !!tripId,
      onMessage: (message) => {
        if (
          message.type === "location_update" ||
          message.type === "initial_location"
        ) {
          const locationData = Array.isArray(message.data)
            ? message.data[0]
            : message.data;
          if (locationData) {
            setLocation(locationData);
            setLastUpdate(new Date());
            onLocationUpdate?.(locationData);
          }
        }
      },
      onError: (error) => {
        console.error("GPS WebSocket error:", error);
      },
    });

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString();
    } catch {
      return "Unknown";
    }
  };

  const getTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} min ago`;
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    } catch {
      return "Unknown";
    }
  };

  if (!tripId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No trip selected for tracking.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Live Trip Tracking</CardTitle>
            <CardDescription>
              Real-time location of your shuttle
            </CardDescription>
          </div>
          <Badge
            variant={isConnected ? "default" : "secondary"}
            className={isConnected ? "bg-green-500" : ""}
          >
            {isConnected ? "Live" : connectionStatus}
          </Badge>
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

        {location ? (
          <div className="space-y-4">
            {/* Map Placeholder */}
            <div className="h-64 bg-muted rounded-lg border border-border relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">GPS Location</p>
                </div>
              </div>
              {/* Bus Marker */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <Bus className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>

            {/* Location Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Bus Number</p>
                <p className="font-semibold flex items-center gap-2">
                  <Bus className="w-4 h-4" />
                  {location.bus_number || "N/A"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  variant={
                    location.status === "in_progress" ? "default" : "outline"
                  }
                >
                  {location.status || "Active"}
                </Badge>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Coordinates</p>
                <p className="font-mono text-sm">
                  {location.latitude.toFixed(6)},{" "}
                  {location.longitude.toFixed(6)}
                </p>
              </div>

              {location.speed !== undefined && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Speed</p>
                  <p className="font-semibold flex items-center gap-2">
                    <Navigation className="w-4 h-4" />
                    {location.speed.toFixed(1)} km/h
                  </p>
                </div>
              )}

              <div className="space-y-1 col-span-2">
                <p className="text-sm text-muted-foreground">Last Update</p>
                <p className="font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {formatTime(location.last_update)} (
                  {getTimeAgo(location.last_update)})
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {isConnected
                ? "Waiting for location data..."
                : "Not connected. Please wait..."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
