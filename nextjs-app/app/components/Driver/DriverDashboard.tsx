"use client";

import React, { useState } from "react";
import { assignedTrips } from "../../data/database";
import {
  Bus,
  MapPin,
  Bell,
  Clock,
  Users,
  Send,
  CheckCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Textarea,
  Label,
  Switch,
} from "../ui";

export function DriverDashboard() {
  const [alertMessage, setAlertMessage] = useState("");
  const [gpsEnabled, setGpsEnabled] = useState(true);

  const handleSendAlert = () => {
    if (alertMessage.trim()) {
      // Mock alert send
      // Alert sent to all passengers!
      setAlertMessage("");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1>Driver Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your trips and communicate with passengers
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Trips</p>
                <h3>4</h3>
              </div>
              <Bus className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Trip</p>
                <h3>In Progress</h3>
              </div>
              <Clock className="w-8 h-8 text-primary" />
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
                <h3>43</h3>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <h3>0/4</h3>
              </div>
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assigned Trips */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>My Assigned Trips</CardTitle>
            <CardDescription>Your schedule for today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {assignedTrips.map((trip) => (
              <div
                key={trip.id}
                className={`p-4 border rounded-lg ${
                  trip.status === "In Progress"
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Bus className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4>{trip.route}</h4>
                      <p className="text-sm text-muted-foreground">
                        {trip.time}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      trip.status === "In Progress" ? "default" : "outline"
                    }
                  >
                    {trip.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {trip.passengers}/{trip.capacity} passengers
                    </span>
                  </div>

                  {trip.status === "In Progress" ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <MapPin className="w-4 h-4 mr-2" />
                        Navigate
                      </Button>
                      <Button size="sm">Complete Trip</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline">
                      Start Trip
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* GPS Tracking & Send Alert */}
        <div className="space-y-6">
          {/* GPS Tracking Control */}
          <Card>
            <CardHeader>
              <CardTitle>GPS Tracking</CardTitle>
              <CardDescription>
                Control real-time location sharing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                <div className="flex items-center gap-3">
                  <MapPin
                    className={`w-6 h-6 ${
                      gpsEnabled ? "text-green-500" : "text-muted-foreground"
                    }`}
                  />
                  <div>
                    <p className="font-medium">GPS Status</p>
                    <p className="text-sm text-muted-foreground">
                      {gpsEnabled ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>
                <Switch checked={gpsEnabled} onCheckedChange={setGpsEnabled} />
              </div>

              {gpsEnabled && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    Your location is being shared with students in real-time
                  </p>
                </div>
              )}

              <Button variant="outline" className="w-full">
                <MapPin className="w-4 h-4 mr-2" />
                View on Map
              </Button>
            </CardContent>
          </Card>

          {/* Send Alert */}
          <Card>
            <CardHeader>
              <CardTitle>Send Alert</CardTitle>
              <CardDescription>
                Notify passengers about delays or issues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="alert-message">Alert Message</Label>
                <Textarea
                  id="alert-message"
                  placeholder="E.g., Running 10 minutes late due to traffic..."
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  rows={4}
                />
              </div>

              <Button onClick={handleSendAlert} className="w-full">
                <Send className="w-4 h-4 mr-2" />
                Send Alert to Passengers
              </Button>

              {/* Quick Alert Templates */}
              <div className="space-y-2">
                <p className="text-sm">Quick templates:</p>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left"
                    onClick={() =>
                      setAlertMessage("Running 10 minutes late due to traffic")
                    }
                  >
                    Delayed by 10 minutes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left"
                    onClick={() =>
                      setAlertMessage("Route changed due to road closure")
                    }
                  >
                    Route change
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left"
                    onClick={() =>
                      setAlertMessage(
                        "Shuttle is full. Next shuttle in 30 minutes"
                      )
                    }
                  >
                    Shuttle full
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Alerts Sent */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
          <CardDescription>Alerts you've sent to passengers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                id: 1,
                message: "Running 5 minutes late due to traffic",
                time: "Today, 10:25 AM",
                recipients: 28,
              },
              {
                id: 2,
                message: "Starting trip to Main Campus now",
                time: "Today, 8:00 AM",
                recipients: 35,
              },
            ].map((alert) => (
              <div
                key={alert.id}
                className="flex items-start justify-between p-3 border border-border rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p>{alert.message}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sent to {alert.recipients} passengers
                    </p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {alert.time}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
