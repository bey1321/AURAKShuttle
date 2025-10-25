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
import React, { useState } from "react";
import { todayTrips, driverStats } from "../../data/database";

export function DriverTrips() {
  const stats = driverStats;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1>My Trips</h1>
        <p className="text-muted-foreground">
          View and manage your assigned shuttle trips
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <h3>{stats.completedToday}</h3>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <h3>{stats.inProgress}</h3>
              </div>
              <Bus className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <h3>{stats.upcoming}</h3>
              </div>
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Passengers</p>
                <h3>{stats.totalPassengers}</h3>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Trips */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {todayTrips.map((trip) => (
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
                    <h4>{trip.route}</h4>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>
                        {trip.departure} - {trip.arrival}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge
                  variant={
                    trip.status === "Completed"
                      ? "default"
                      : trip.status === "In Progress"
                      ? "default"
                      : "outline"
                  }
                >
                  {trip.status}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Occupancy</span>
                  <span>
                    {trip.passengers}/{trip.capacity} passengers
                  </span>
                </div>
                <Progress value={(trip.passengers / trip.capacity) * 100} />
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
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
