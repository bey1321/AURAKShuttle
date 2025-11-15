// File: src/pages/GpsDashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "./ui";

const WEBSOCKET_URL = "ws://localhost:8000/gps"; // change this to your backend URL

export default function GpsDashboard({ role, userId, tripId }) {
  const [locations, setLocations] = useState({});
  const wsRef = useRef(null);

  useEffect(() => {
    let ws;

    if (role === "student") {
      ws = new WebSocket(`${WEBSOCKET_URL}/ws/student/trip/${tripId}`);
    } else if (role === "admin") {
      ws = new WebSocket(`${WEBSOCKET_URL}/ws/admin/${userId}`);
    } else if (role === "driver") {
      ws = new WebSocket(`${WEBSOCKET_URL}/ws/driver/${userId}`);
    }

    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Connected to WebSocket");
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "location_update" || message.type === "bus_location") {
        setLocations((prev) => ({
          ...prev,
          [message.data.trip_id]: message.data,
        }));
      }

      if (message.type === "initial_location") {
        setLocations((prev) => ({
          ...prev,
          [message.data.trip_id]: message.data,
        }));
      }

      if (message.type === "error") {
        alert(message.message);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      ws.close();
    };
  }, [role, userId, tripId]);

  // For driver: send location updates
  const sendDriverLocation = (lat, lng) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          trip_id: tripId,
          latitude: lat,
          longitude: lng,
          speed: 40,
          heading: 180,
          accuracy: 5,
        })
      );
    }
  };

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.values(locations).map((loc) => (
        <Card key={loc.trip_id} className="shadow-md p-2">
          <CardContent>
            <h2 className="text-lg font-bold mb-1">Trip #{loc.trip_id}</h2>
            <p>
              <span className="font-semibold">Bus:</span> {loc.bus_number || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Lat:</span> {loc.latitude.toFixed(5)}
            </p>
            <p>
              <span className="font-semibold">Lng:</span> {loc.longitude.toFixed(5)}
            </p>
            <p>
              <span className="font-semibold">Speed:</span> {loc.speed} km/h
            </p>
            <p>
              <span className="font-semibold">Last Update:</span>{" "}
              {new Date(loc.last_update).toLocaleTimeString()}
            </p>
            <p>
              <span className="font-semibold">Status:</span> {loc.status}
            </p>
          </CardContent>
        </Card>
      ))}

      {/* Driver controls for testing */}
      {role === "driver" && (
        <button
          onClick={() => sendDriverLocation(25.2048 + Math.random() * 0.01, 55.2708 + Math.random() * 0.01)}
          className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600"
        >
          Send Random Location
        </button>
      )}
    </div>
  );
}
