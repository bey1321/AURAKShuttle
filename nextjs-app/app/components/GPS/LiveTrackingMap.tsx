"use client";

import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocationData } from "../../hooks/useGPSWebSocket";
import { Bus } from "lucide-react";

// Fix Leaflet default icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

interface LiveTrackingMapProps {
  location: LocationData | null;
  height?: string;
  zoom?: number;
  showPopup?: boolean;
}

// Custom component to handle map centering when location updates
function MapCenterUpdater({ location }: { location: LocationData | null }) {
  const map = useMap();

  useEffect(() => {
    if (location && location.latitude !== 0 && location.longitude !== 0) {
      map.flyTo([location.latitude, location.longitude], map.getZoom(), {
        duration: 1.5,
      });
    }
  }, [location, map]);

  return null;
}

// Custom bus marker icon
const createBusIcon = (status?: string) => {
  const color =
    status === "in_progress"
      ? "#3b82f6" // blue
      : status === "stopped"
      ? "#ef4444" // red
      : "#10b981"; // green

  return L.divIcon({
    className: "custom-bus-marker",
    html: `
      <div style="
        position: relative;
        width: 40px;
        height: 40px;
        background-color: ${color};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        border: 3px solid white;
      ">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M8 6v6"/>
          <path d="M15 6v6"/>
          <path d="M2 12h19.6"/>
          <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
          <circle cx="7" cy="18" r="2"/>
          <path d="M9 18h5"/>
          <circle cx="16" cy="18" r="2"/>
        </svg>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

export function LiveTrackingMap({
  location,
  height = "400px",
  zoom = 15,
  showPopup = true,
}: LiveTrackingMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  // Default center (UAE coordinates as fallback)
  const defaultCenter: [number, number] = [25.7617, 55.9777]; // RAK, UAE
  const center: [number, number] =
    location && location.latitude !== 0 && location.longitude !== 0
      ? [location.latitude, location.longitude]
      : defaultCenter;

  const hasValidLocation =
    location && location.latitude !== 0 && location.longitude !== 0;

  return (
    <div style={{ height, width: "100%", position: "relative" }}>
      {!hasValidLocation && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "8px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                margin: "0 auto 16px",
                color: "#9ca3af",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <p style={{ color: "#6b7280", fontSize: "14px" }}>
              Waiting for GPS location...
            </p>
          </div>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%", borderRadius: "8px" }}
        ref={mapRef as any}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {hasValidLocation && (
          <>
            {/* Path polyline - shows the route taken by the bus */}
            {location.path && location.path.length > 1 && (
              <Polyline
                positions={location.path.map((point) => [
                  point.latitude,
                  point.longitude,
                ])}
                pathOptions={{
                  color: "#3b82f6",
                  weight: 4,
                  opacity: 0.7,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
            )}

            <Marker
              position={[location.latitude, location.longitude]}
              icon={createBusIcon(location.status)}
            >
              {showPopup && (
                <Popup>
                  <div style={{ minWidth: "200px" }}>
                    <h3
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "16px",
                        fontWeight: "600",
                      }}
                    >
                      {location.bus_number || "Bus"}
                    </h3>
                    <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
                      <p style={{ margin: "4px 0" }}>
                        <strong>Status:</strong>{" "}
                        <span
                          style={{
                            textTransform: "capitalize",
                            color:
                              location.status === "in_progress"
                                ? "#10b981"
                                : "#6b7280",
                          }}
                        >
                          {location.status?.replace("_", " ") || "Active"}
                        </span>
                      </p>
                      {location.speed !== undefined && (
                        <p style={{ margin: "4px 0" }}>
                          <strong>Speed:</strong> {location.speed.toFixed(1)}{" "}
                          km/h
                        </p>
                      )}
                      <p style={{ margin: "4px 0" }}>
                        <strong>Coordinates:</strong>
                        <br />
                        {location.latitude.toFixed(6)},{" "}
                        {location.longitude.toFixed(6)}
                      </p>
                      <p style={{ margin: "4px 0", fontSize: "12px", color: "#6b7280" }}>
                        Last update:{" "}
                        {new Date(location.last_update).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </Popup>
              )}
            </Marker>
            <MapCenterUpdater location={location} />
          </>
        )}
      </MapContainer>
    </div>
  );
}