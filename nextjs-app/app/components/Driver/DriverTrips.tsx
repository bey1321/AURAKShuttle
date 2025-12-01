"use client";

import { Bus, MapPin, Users, Clock, CheckCircle, Circle, Search, Calendar, Navigation, ChevronDown, ChevronUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Progress,
  Input,
} from "../ui";
import React, { useEffect, useState } from "react";
import { driverAPI } from "../../lib/api";

export function DriverTrips() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTrip, setExpandedTrip] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const t = await driverAPI.getMyTrips();

        // Filter to show only upcoming trips (from today onwards)
        const today = new Date().toISOString().split('T')[0];
        const upcomingTrips = t.filter((trip: any) => {
          const tripDate = trip.date ? (typeof trip.date === 'string' ? trip.date.split('T')[0] : trip.date) : '';
          return tripDate >= today;
        });

        // Sort trips by date in ascending order (earliest first)
        const sortedTrips = upcomingTrips.sort((a: any, b: any) => {
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by route, status, or bus..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Upcoming Trips Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Trips</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Your assigned upcoming shuttle trips
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : trips.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No upcoming trips assigned.
            </div>
          ) : (
            trips
              .filter((trip: any) => {
                const query = searchQuery.toLowerCase();
                const routeName = trip.route?.name || "";
                const status = trip.status || "";
                const busPlate = trip.bus?.plate_num || "";
                const routeType = trip.route?.type || "";
                return (
                  routeName.toLowerCase().includes(query) ||
                  status.toLowerCase().includes(query) ||
                  busPlate.toLowerCase().includes(query) ||
                  routeType.toLowerCase().includes(query)
                );
              })
              .map((trip: any) => (
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
                          <h3 className="font-semibold flex items-center gap-2">
                            {trip.route?.name || "Route"}
                          </h3>
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

                    {/* Expanded Details */}
                    {expandedTrip === trip.id && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        {/* Bus Information */}
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

                        {/* Route Type */}
                        <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border border-primary/20">
                          <MapPin className="w-5 h-5 text-primary" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{trip.route?.type || "Standard Route"}</p>
                          </div>
                        </div>

                        {/* Operating Days */}
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

                        {/* Action Buttons */}
                        <div className="pt-2">
                        {trip.status === "in_progress" && (
                            <div className="flex gap-2">
                              <Button 
                                className="flex-1" 
                                size="lg"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Handle update location
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
                                  // Handle end trip
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
  );
}
