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
import React, { useState, useEffect, useRef } from "react";
import { activeShuttles, routes } from "../../data/database";
import { DriverGPSComponent } from "../GPS";

export function DriverLiveTracking() {
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedShuttle, setSelectedShuttle] = useState<any>(null);
  // TODO: Get driverId and tripId from auth context/session
  const driverId = 2; // Replace with actual driver ID from auth
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const geoWatchRef = useRef<number | null>(null);

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
            const map = L.map("driver-leaflet-map", { zoomControl: true }).setView([25.2, 55.3], 12);
            L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
              subdomains: "abcd",
              maxZoom: 19,
            }).addTo(map);
            mapRef.current = map;

            // Add sample markers for active shuttles
            const busIcon = L.divIcon({
              className: "custom-leaflet-marker",
              html: '<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;background:#3b82f6;border-radius:50%;box-shadow:0 2px 8px rgba(59,130,246,0.6);border:3px solid white"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="3" y="6" width="18" height="11" rx="2"/><path d="M3 8h18M7 6V4M17 6V4M7 17v2M17 17v2"/></svg></div>',
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

            // Add driver's real-time location marker
            const driverIcon = L.divIcon({
              className: "custom-leaflet-marker",
              html: '<div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;background:#10b981;border-radius:50%;box-shadow:0 0 8px rgba(16,185,129,0.8);border:3px solid white"><div style="width:8px;height:8px;background:white;border-radius:50%;"></div></div>',
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            });

            const userMarker = L.marker([25.2, 55.3], { icon: driverIcon }).addTo(map);
            userMarkerRef.current = userMarker;

            // Get driver's current location and start watching
            if (navigator.geolocation) {
              let isFirstLocation = true;
              
              const success = (pos: GeolocationPosition) => {
                const { latitude, longitude } = pos.coords;
                if (userMarkerRef.current) {
                  userMarkerRef.current.setLatLng([latitude, longitude]);
                  const ts = new Date().toLocaleString("en-US");
                  userMarkerRef.current.bindPopup(`<b>Your Location</b><br>Driver<br>${ts}`).openPopup();
                  
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

      {/* Map View - Leaflet */}
      <div className="w-full">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Live Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div id="driver-leaflet-map" className="h-[500px] rounded-lg border border-border overflow-hidden" />
          </CardContent>
        </Card>
      </div>

      {/* GPS Tracking Component */}
      <div className="px-6">
        <DriverGPSComponent
          driverId={driverId}
          tripId={selectedTripId}
          onLocationSent={(success) => {
            if (!success) {
              console.log("GPS location sharing failed");
            }
          }}
        />
      </div>

    </div>
  );
}
