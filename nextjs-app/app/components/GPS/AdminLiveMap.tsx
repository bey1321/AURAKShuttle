"use client";

import React, { useEffect, useRef, useState } from "react";
import type { LocationData } from "../../hooks/useGPSWebSocket";

// Type definition for Leaflet
type LeafletModule = typeof import("leaflet");

interface AdminLiveMapProps {
  locations: LocationData[];
  height?: string;
  zoom?: number;
}

export function AdminLiveMap({
  locations,
  height = "500px",
  zoom = 13,
}: AdminLiveMapProps) {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<number, any>>(new Map());
  const polylinesRef = useRef<Map<number, any>>(new Map());
  const [leaflet, setLeaflet] = useState<LeafletModule | null>(null);

  // Load Leaflet dynamically
  useEffect(() => {
    if (typeof window !== "undefined") {
      Promise.all([
        import("leaflet"),
        import("leaflet/dist/leaflet.css")
      ]).then(([L]) => {
        setLeaflet(L);
      });
    }
  }, []);

  // Initialize map only once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !leaflet) return;

    // Default center (RAK, UAE)
    const defaultCenter: [number, number] = [25.7617, 55.9777];

    // Create map
    const map = leaflet.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: zoom,
      zoomControl: true,
    });

    // Add tile layer
    leaflet.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [zoom, leaflet]);

  // Update markers and polylines when locations change
  useEffect(() => {
    if (!mapRef.current || !leaflet || locations.length === 0) return;

    const map = mapRef.current;
    const currentMarkers = markersRef.current;
    const currentPolylines = polylinesRef.current;

    // Track which trip_ids are in the new locations
    const activeTripIds = new Set(locations.map((loc) => loc.trip_id));

    // Remove markers and polylines for buses that are no longer active
    currentMarkers.forEach((marker, tripId) => {
      if (!activeTripIds.has(tripId)) {
        marker.remove();
        currentMarkers.delete(tripId);
      }
    });

    currentPolylines.forEach((polyline, tripId) => {
      if (!activeTripIds.has(tripId)) {
        polyline.remove();
        currentPolylines.delete(tripId);
      }
    });

    // Add or update markers and polylines for each location
    locations.forEach((location) => {
      // Skip invalid coordinates
      if (!location.latitude || !location.longitude) return;

      const position: [number, number] = [location.latitude, location.longitude];

      // Create bus icon
      const busIcon = createBusIcon(leaflet, location.status);

      // Check if marker already exists
      let marker = currentMarkers.get(location.trip_id);

      if (marker) {
        // Update existing marker
        marker.setLatLng(position);
        marker.setIcon(busIcon);
      } else {
        // Create new marker
        marker = leaflet.marker(position, { icon: busIcon });

        // Add popup
        const popupContent = `
          <div style="font-family: sans-serif;">
            <strong>Trip #${location.trip_id}</strong><br/>
            <strong>Bus:</strong> ${location.bus_number || "N/A"}<br/>
            <strong>Status:</strong> ${location.status || "Active"}<br/>
            ${location.speed !== undefined ? `<strong>Speed:</strong> ${location.speed.toFixed(1)} km/h<br/>` : ""}
            <strong>Last Update:</strong> ${new Date(location.last_update + 'Z').toLocaleTimeString()}
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.addTo(map);
        currentMarkers.set(location.trip_id, marker);
      }

      // Handle path polyline
      if (location.path && location.path.length > 1) {
        const pathCoordinates: [number, number][] = location.path.map((point) => [
          point.latitude,
          point.longitude,
        ]);

        let polyline = currentPolylines.get(location.trip_id);

        if (polyline) {
          // Update existing polyline
          polyline.setLatLngs(pathCoordinates);
        } else {
          // Create new polyline
          polyline = leaflet.polyline(pathCoordinates, {
            color: getPathColor(location.trip_id),
            weight: 3,
            opacity: 0.6,
            smoothFactor: 1,
          });
          polyline.addTo(map);
          currentPolylines.set(location.trip_id, polyline);
        }
      }
    });

    // Auto-fit bounds to show all buses
    if (locations.length > 0) {
      const validLocations = locations.filter(
        (loc) => loc.latitude && loc.longitude
      );

      if (validLocations.length === 1) {
        // Single bus - center on it
        map.setView([validLocations[0].latitude, validLocations[0].longitude], 15);
      } else if (validLocations.length > 1) {
        // Multiple buses - fit bounds
        const bounds = leaflet.latLngBounds(
          validLocations.map((loc) => [loc.latitude, loc.longitude] as [number, number])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [locations, leaflet]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        height,
        width: "100%",
        borderRadius: "8px",
        position: "relative",
        zIndex: 0
      }}
      className="leaflet-map-container"
    />
  );
}

// Helper function to get unique color for each bus path
function getPathColor(tripId: number): string {
  const colors = [
    "#3b82f6", // blue
    "#ef4444", // red
    "#10b981", // green
    "#f59e0b", // amber
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#f97316", // orange
  ];
  return colors[tripId % colors.length];
}

// Helper function to create custom bus icon
function createBusIcon(leaflet: LeafletModule, status?: string) {
  const color =
    status === "in_progress" ? "#3b82f6" :
    status === "stopped" ? "#ef4444" :
    "#10b981";

  const html = `
    <div style="
      background-color: ${color};
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      border: 3px solid white;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 6v6"/>
        <path d="M15 6v6"/>
        <path d="M2 12h19.6"/>
        <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
        <circle cx="7" cy="18" r="2"/>
        <circle cx="17" cy="18" r="2"/>
      </svg>
    </div>
  `;

  return leaflet.divIcon({
    className: "custom-bus-marker",
    html: html,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
}
