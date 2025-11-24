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
  onLocationSent?: (success: boolean) => void;
}

export function DriverGPSComponent({
  driverId,
  tripId,
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

  const { isConnected, connectionStatus, lastError, sendMessage } =
    useGPSWebSocket({
      role: "driver",
      userId: driverId,
      tripId: currentTripId,
      enabled: !!currentTripId, // Enable when trip is selected, connection will be established
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

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

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
              Share your real-time location with students
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
              <p className="text-sm font-medium">Connection</p>
              <p className="text-xs text-muted-foreground">
                {isConnected ? "Connected" : connectionStatus}
              </p>
            </div>
          </div>
          <Switch
            checked={isTracking}
            onCheckedChange={(checked) => {
              if (checked) {
                startTracking();
              } else {
                stopTracking();
              }
            }}
            disabled={!isConnected || !currentTripId}
          />
        </div>

        {/* Errors */}
        {(lastError || locationError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{lastError || locationError}</AlertDescription>
          </Alert>
        )}

        {/* Trip ID Input */}
        {!tripId && (
          <div className="space-y-2">
            <Label htmlFor="trip-id">Trip ID</Label>
            <input
              id="trip-id"
              type="number"
              value={currentTripId || ""}
              onChange={(e) =>
                setCurrentTripId(Number(e.target.value) || undefined)
              }
              placeholder="Enter trip ID"
              className="w-full px-3 py-2 border border-border rounded-md"
              disabled={isTracking}
            />
          </div>
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

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={isTracking ? stopTracking : startTracking}
            disabled={!isConnected || !currentTripId}
            className="flex-1"
            variant={isTracking ? "destructive" : "default"}
          >
            {isTracking ? (
              <>
                <MapPin className="w-4 h-4 mr-2" />
                Stop Sharing
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 mr-2" />
                Start Sharing
              </>
            )}
          </Button>
        </div>

        {/* Info Message */}
        {isTracking && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your location is being shared with students in real-time. Make
              sure GPS is enabled on your device.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
