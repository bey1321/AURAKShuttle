"use client";

import { Bus, MapPin, Users, Clock, CheckCircle, Circle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Progress,
} from "../ui";
import React, { useEffect, useState } from "react";
import { driverAPI } from "../../lib/api";

export function DriverTrips() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const t = await driverAPI.getMyTrips();
        setTrips(t);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1>My Trips</h1>
        <p className="text-muted-foreground">
          View and manage your assigned shuttle trips
        </p>
      </div>

      {/* Quick note */}
      <div className="text-sm text-muted-foreground">Assigned trips below</div>

      {/* Today's Trips */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : trips.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No assigned trips.
            </div>
          ) : (
            trips.map((trip) => (
              <div
                key={trip.id}
                className="p-4 border border-border rounded-lg space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        trip.status === "Completed"
                          ? "bg-green-100"
                          : trip.status === "In Progress"
                          ? "bg-primary/10"
                          : "bg-muted"
                      }`}
                    >
                      {trip.status === "Completed" ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : trip.status === "In Progress" ? (
                        <Bus className="w-5 h-5 text-primary" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h4>{trip.route?.name || "Route"}</h4>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>
                          {trip.route?.start_time || ""} -{" "}
                          {trip.route?.end_time || ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge>{trip.status}</Badge>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Passengers data unavailable
                  </div>
                </div>

                {trip.status === "Upcoming" && (
                  <Button className="w-full" variant="outline">
                    Start Trip
                  </Button>
                )}

                {trip.status === "In Progress" && (
                  <div className="flex gap-2">
                    <Button className="flex-1">Update Location</Button>
                    <Button className="flex-1" variant="outline">
                      End Trip
                    </Button>
                  </div>
                )}

                {trip.status === "Completed" && (
                  <Button className="w-full" variant="ghost" disabled>
                    Trip Completed
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
