"use client";

import React, { useState, useEffect } from "react";
import { assignedTrips } from "../../data/database";
import {
  Bus,
  MapPin,
  Bell,
  Clock,
  Users,
  Send,
  CheckCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Circle,
} from "lucide-react";
import { driverAPI } from "../../lib/api";
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
import { DriverGPSComponent } from "../GPS";

export function DriverDashboard() {
  const [alertMessage, setAlertMessage] = useState("");
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTrip, setExpandedTrip] = useState<number | null>(null);
  // TODO: Get driverId from auth context/session
  const driverId = 2; // Replace with actual driver ID from auth

  const today = new Date().toISOString().split("T")[0];
  const todaysTrips = trips.filter(
    (trip) => trip.date === today && !trip.route?.type?.toLowerCase().includes("semester")
  );
  const semesterTrips = trips.filter((trip) =>
    trip.route?.type?.toLowerCase().includes("semester")
  );

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const t = await driverAPI.getMyTrips();
        // Sort trips: semester-wide first, then by date
        const sortedTrips = t.sort((a: any, b: any) => {
          const aIsSemester = a.route?.type?.toLowerCase().includes("semester");
          const bIsSemester = b.route?.type?.toLowerCase().includes("semester");
          if (aIsSemester && !bIsSemester) return -1;
          if (!aIsSemester && bIsSemester) return 1;
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateA - dateB;
        });
        setTrips(sortedTrips);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
        <div className="lg:col-span-2 space-y-6">
          {/* Semester-Wide Trips */}
          {!loading && semesterTrips.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Semester-Wide Trips</CardTitle>
                <CardDescription>
                  Registered routes that run throughout the semester
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {semesterTrips.map((trip) => (
                  <Card
                    key={trip.id}
                    className="overflow-hidden transition-all hover:shadow-md cursor-pointer"
                    onClick={() => setExpandedTrip(expandedTrip === trip.id ? null : trip.id)}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              trip.status === "completed"
                                ? "bg-green-500"
                                : trip.status === "in_progress"
                                ? "bg-blue-500"
                                : trip.status === "scheduled"
                                ? "bg-red-400"
                                : "bg-gray-400"
                            }`}
                          >
                            {trip.status === "completed" ? (
                              <CheckCircle className="w-5 h-5 text-white" />
                            ) : trip.status === "in_progress" ? (
                              <Bus className="w-5 h-5 text-white" />
                            ) : trip.status === "scheduled" ? (
                              <Bus className="w-5 h-5 text-white" />
                            ) : (
                              <Circle className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{trip.route?.name || "Route"}</h3>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(trip.date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {trip.route?.start_time || "N/A"} - {trip.route?.end_time || "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={trip.status === "completed" ? "default" : "secondary"}
                            className={`${
                              trip.status === "completed"
                                ? "bg-green-500 hover:bg-green-600"
                                : trip.status === "in_progress"
                                ? "bg-blue-500 hover:bg-blue-600 text-white"
                                : trip.status === "scheduled"
                                ? "bg-red-400 hover:bg-red-500 text-white"
                                : ""
                            }`}
                          >
                            {trip.status.replace("_", " ").toUpperCase()}
                          </Badge>
                          {expandedTrip === trip.id ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {expandedTrip === trip.id && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <Bus className="w-5 h-5 text-primary" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">Bus Details</p>
                              <p className="text-sm text-muted-foreground">
                                {trip.bus?.plate_num || "N/A"} • {trip.bus?.model || "N/A"}
                              </p>
                            </div>
                            <Badge variant="outline">{trip.bus?.no_seats || 0} seats</Badge>
                          </div>

                          <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border border-primary/20">
                            <MapPin className="w-5 h-5 text-primary" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{trip.route?.type || "Standard Route"}</p>
                            </div>
                          </div>

                          {trip.route?.days_of_week && trip.route.days_of_week.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs text-muted-foreground">Operating Days</p>
                              <div className="flex flex-wrap gap-2">
                                {trip.route.days_of_week.map((day: string) => (
                                  <Badge key={day} variant="outline" className="text-xs">
                                    {day.substring(0, 3)}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="pt-2">
                            {trip.status === "scheduled" && (
                              <Button
                                className="w-full"
                                size="lg"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTripId(trip.id);
                                }}
                              >
                                Start Trip
                              </Button>
                            )}
                            {trip.status === "in_progress" && (
                              <div className="flex gap-2">
                                <Button
                                  className="flex-1"
                                  size="lg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTripId(trip.id);
                                  }}
                                >
                                  Update Location
                                </Button>
                                <Button
                                  className="flex-1"
                                  variant="outline"
                                  size="lg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                >
                                  End Trip
                                </Button>
                              </div>
                            )}
                            {trip.status === "completed" && (
                              <Button className="w-full" variant="ghost" size="lg" disabled>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Trip Completed
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Today's Trips */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Trips</CardTitle>
              <CardDescription>Your schedule for today</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : todaysTrips.length === 0 ? (
                <div className="text-sm text-muted-foreground">No trips scheduled for today.</div>
              ) : (
                todaysTrips.map((trip) => (
                  <Card
                    key={trip.id}
                    className="overflow-hidden transition-all hover:shadow-md cursor-pointer"
                    onClick={() => setExpandedTrip(expandedTrip === trip.id ? null : trip.id)}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              trip.status === "completed"
                                ? "bg-green-500"
                                : trip.status === "in_progress"
                                ? "bg-blue-500"
                                : trip.status === "scheduled"
                                ? "bg-red-400"
                                : "bg-gray-400"
                            }`}
                          >
                            {trip.status === "completed" ? (
                              <CheckCircle className="w-5 h-5 text-white" />
                            ) : trip.status === "in_progress" ? (
                              <Bus className="w-5 h-5 text-white" />
                            ) : trip.status === "scheduled" ? (
                              <Bus className="w-5 h-5 text-white" />
                            ) : (
                              <Circle className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{trip.route?.name || "Route"}</h3>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(trip.date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {trip.route?.start_time || "N/A"} - {trip.route?.end_time || "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={trip.status === "completed" ? "default" : "secondary"}
                            className={`${
                              trip.status === "completed"
                                ? "bg-green-500 hover:bg-green-600"
                                : trip.status === "in_progress"
                                ? "bg-blue-500 hover:bg-blue-600 text-white"
                                : trip.status === "scheduled"
                                ? "bg-red-400 hover:bg-red-500 text-white"
                                : ""
                            }`}
                          >
                            {trip.status.replace("_", " ").toUpperCase()}
                          </Badge>
                          {expandedTrip === trip.id ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {expandedTrip === trip.id && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <Bus className="w-5 h-5 text-primary" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">Bus Details</p>
                              <p className="text-sm text-muted-foreground">
                                {trip.bus?.plate_num || "N/A"} • {trip.bus?.model || "N/A"}
                              </p>
                            </div>
                            <Badge variant="outline">{trip.bus?.no_seats || 0} seats</Badge>
                          </div>

                          <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border border-primary/20">
                            <MapPin className="w-5 h-5 text-primary" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{trip.route?.type || "Standard Route"}</p>
                            </div>
                          </div>

                          {trip.route?.days_of_week && trip.route.days_of_week.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs text-muted-foreground">Operating Days</p>
                              <div className="flex flex-wrap gap-2">
                                {trip.route.days_of_week.map((day: string) => (
                                  <Badge key={day} variant="outline" className="text-xs">
                                    {day.substring(0, 3)}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="pt-2">
                            {trip.status === "scheduled" && (
                              <Button
                                className="w-full"
                                size="lg"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTripId(trip.id);
                                }}
                              >
                                Start Trip
                              </Button>
                            )}
                            {trip.status === "in_progress" && (
                              <div className="flex gap-2">
                                <Button
                                  className="flex-1"
                                  size="lg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTripId(trip.id);
                                  }}
                                >
                                  Update Location
                                </Button>
                                <Button
                                  className="flex-1"
                                  variant="outline"
                                  size="lg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                >
                                  End Trip
                                </Button>
                              </div>
                            )}
                            {trip.status === "completed" && (
                              <Button className="w-full" variant="ghost" size="lg" disabled>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Trip Completed
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </div>
  
          {/* Send Alert */}
        <div className="space-y-6">
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
