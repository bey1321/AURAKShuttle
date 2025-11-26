"use client";

import React, { useState, useEffect } from "react";
import {
  Bus,
  MapPin,
  Bell,
  Clock,
  Users,
  CheckCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Circle,
  Navigation,
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
} from "../ui";
import { DriverNotification } from "./DriverNotification";
import { useRouter } from "next/navigation";

export function DriverDashboard() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTrip, setExpandedTrip] = useState<number | null>(null);
  const [endingTripId, setEndingTripId] = useState<number | null>(null);
  const router = useRouter();

  const today = new Date().toISOString().split("T")[0];
  const todaysTrips = trips.filter(
    (trip) => trip.date === today && !trip.route?.type?.toLowerCase().includes("semester")
  );
  const semesterTrips = trips.filter((trip) =>
    trip.route?.type?.toLowerCase().includes("semester") && trip.date === today
  );

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
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
  };

  const handleStartTrip = (tripId: number) => {
    // Navigate to Live Tracking page
    router.push(`/driver/live-tracking?tripId=${tripId}`);
  };

  const handleUpdateLocation = (tripId: number) => {
    // Navigate to Live Tracking page for the in-progress trip
    router.push(`/driver/live-tracking?tripId=${tripId}`);
  };

  const handleEndTrip = async (tripId: number) => {
    try {
      setEndingTripId(tripId);
      console.log("Attempting to complete trip:", tripId);

      const response = await driverAPI.completeTrip(tripId);
      console.log("Complete trip response:", response);

      // Refresh trips list
      await fetchTrips();
      console.log("Trips refreshed after completion");

      // Show success message
      alert("Trip completed successfully!");
    } catch (error: any) {
      console.error("Error completing trip:", error);
      console.error("Error details:", error?.message, error?.response);
      alert(`Failed to complete trip: ${error?.message || "Please try again."}`);
    } finally {
      setEndingTripId(null);
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
                                  handleStartTrip(trip.id);
                                }}
                              >
                                <Navigation className="w-4 h-4 mr-2" />
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
                                    handleUpdateLocation(trip.id);
                                  }}
                                >
                                  <MapPin className="w-4 h-4 mr-2" />
                                  Go to Tracking
                                </Button>
                                <Button
                                  className="flex-1"
                                  variant="destructive"
                                  size="lg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEndTrip(trip.id);
                                  }}
                                  disabled={endingTripId === trip.id}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  {endingTripId === trip.id ? "Ending..." : "End Trip"}
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
                                  handleStartTrip(trip.id);
                                }}
                              >
                                <Navigation className="w-4 h-4 mr-2" />
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
                                    handleUpdateLocation(trip.id);
                                  }}
                                >
                                  <MapPin className="w-4 h-4 mr-2" />
                                  Go to Tracking
                                </Button>
                                <Button
                                  className="flex-1"
                                  variant="destructive"
                                  size="lg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEndTrip(trip.id);
                                  }}
                                  disabled={endingTripId === trip.id}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  {endingTripId === trip.id ? "Ending..." : "End Trip"}
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

          {/* Send Notification */}
        <div className="space-y-6">
          <DriverNotification trips={trips} />
        </div>
      </div>    
    </div>
  );
}
