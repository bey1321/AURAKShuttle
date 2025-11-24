"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Navigation,
  Clock,
  CheckCircle,
  AlertCircle,
  Power,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Alert,
  AlertDescription,
  Switch,
  Label,
} from "../ui";
import { useGPSWebSocket } from "../../hooks/useGPSWebSocket";
import { useRouter } from "next/navigation";

interface DriverGPSComponentProps {
  driverId: number;
  tripId?: number;
  isTrackingActive: boolean;
  onLocationSent?: (success: boolean) => void;
}

export function DriverGPSComponent({
  driverId,
  tripId,
  isTrackingActive,
  onLocationSent,
}: DriverGPSComponentProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentTripId, setCurrentTripId] = useState<number | undefined>(
    tripId
  );
  const [lastSentLocation, setLastSentLocation] = useState<Date | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [currentLocation, setCurrentLocation] =
    useState<GeolocationPosition | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update currentTripId when tripId prop changes
  useEffect(() => {
    setCurrentTripId(tripId);
  }, [tripId]);

  const { isConnected, connectionStatus, lastError, sendMessage, disconnect } =
    useGPSWebSocket({
      role: "driver",
      userId: driverId,
      tripId: currentTripId,
      enabled: isTrackingActive && !!currentTripId, // Only enable when tracking is active AND trip is selected
    });

  const sendLocationUpdate = (position: GeolocationPosition) => {
    if (!currentTripId) {
      setLocationError("No trip selected");
      return;
    }

    const locationData = {
      trip_id: currentTripId,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      speed: position.coords.speed ? position.coords.speed * 3.6 : 0, // Convert m/s to km/h
      heading: position.coords.heading || 0,
      accuracy: position.coords.accuracy,
    };

    const success = sendMessage(locationData);
    if (success) {
      setLastSentLocation(new Date());
      setLocationError(null);
      onLocationSent?.(true);
    } else {
      setLocationError("Failed to send location. Check connection.");
      onLocationSent?.(false);
    }
  };

  const startTracking = () => {
    if (!currentTripId) {
      setLocationError("Please select a trip first");
      return;
    }

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsTracking(true);
    setLocationError(null);

    // Get initial location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation(position);
        sendLocationUpdate(position);
      },
      (error) => {
        setLocationError(`Location error: ${error.message}`);
        setIsTracking(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // Watch position for continuous updates
    const id = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation(position);
        sendLocationUpdate(position);
      },
      (error) => {
        setLocationError(`Location error: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    setWatchId(id);
  };

  const stopTracking = () => {
    setIsTracking(false);
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Auto-start/stop tracking based on isTrackingActive prop
  useEffect(() => {
    if (isTrackingActive && currentTripId && !isTracking) {
      startTracking();
    } else if (!isTrackingActive && isTracking) {
      stopTracking();
    }
  }, [isTrackingActive, currentTripId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  // Handle tab close/refresh - ensure WebSocket is disconnected
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isConnected) {
        disconnect();
      }
      if (isTracking) {
        stopTracking();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isConnected, isTracking, disconnect]);

  const formatTime = (date: Date | null) => {
    if (!date) return "Never";
    return date.toLocaleTimeString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>GPS Location Sharing</CardTitle>
            <CardDescription>
              Real-time location sharing status
            </CardDescription>
          </div>
          <Badge
            variant={isTracking ? "default" : "secondary"}
            className={isTracking ? "bg-green-500" : ""}
          >
            {isTracking ? "Sharing" : "Stopped"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
          <div className="flex items-center gap-3">
            <Power
              className={`w-5 h-5 ${
                isConnected ? "text-green-500" : "text-muted-foreground"
              }`}
            />
            <div>
              <p className="text-sm font-medium">WebSocket Connection</p>
              <p className="text-xs text-muted-foreground">
                {isConnected ? "Connected" : connectionStatus}
              </p>
            </div>
          </div>
          <Badge variant={isConnected ? "default" : "outline"}>
            {isConnected ? "Active" : "Inactive"}
          </Badge>
        </div>

        {/* Errors */}
        {(lastError || locationError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{lastError || locationError}</AlertDescription>
          </Alert>
        )}

        {/* Trip Status */}
        {!currentTripId && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No trip selected. Please select a trip from the left panel.
            </AlertDescription>
          </Alert>
        )}

        {/* Current Location Info */}
        {currentLocation && (
          <div className="p-4 bg-accent rounded-lg space-y-2">
            <p className="text-sm font-medium">Current Location</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Latitude</p>
                <p className="font-mono">
                  {currentLocation.coords.latitude.toFixed(6)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Longitude</p>
                <p className="font-mono">
                  {currentLocation.coords.longitude.toFixed(6)}
                </p>
              </div>
              {currentLocation.coords.speed !== null && (
                <div>
                  <p className="text-muted-foreground">Speed</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Navigation className="w-4 h-4" />
                    {(currentLocation.coords.speed * 3.6).toFixed(1)} km/h
                  </p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Accuracy</p>
                <p className="font-semibold">
                  ±{currentLocation.coords.accuracy.toFixed(0)}m
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Last Sent Location */}
        {lastSentLocation && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Last sent: {formatTime(lastSentLocation)}</span>
          </div>
        )}

        {/* Info Message */}
        {isTracking && (
          <Alert>
            <MapPin className="h-4 w-4" />
            <AlertDescription>
              Your location is being shared with students in real-time.
              Click "End Trip" to stop sharing your location.
            </AlertDescription>
          </Alert>
        )}

        {!isTrackingActive && currentTripId && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Click "Start Trip" in the left panel to begin tracking.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
