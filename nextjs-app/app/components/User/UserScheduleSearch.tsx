"use client";

import { Search, Calendar, MapPin, User, Clock, Bus, Filter } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui";
import React, { useState, useEffect, useMemo } from "react";
import { userAPI, adminAPI } from "../../lib/api";

interface Trip {
  id: number;
  date: string;
  status: string;
  ETA: string;
  bus_id: number;
  route_id: number;
  route_name: string;
  departure: string;
  arrival: string;
  driver: string;
  capacity?: number;
  available?: number;
  seats_taken?: number;
  startTime?: string;
  endTime?: string;
  passengers?: number;
  bus?: string;
  raw?: any;
  days: string[];
}

// {
//   "id": trip.id,
//   "date": trip.date,
//   "status": trip.status,
//   "ETA": trip.ETA,
//   "bus_id": trip.bus_id,
//   "route_id": trip.route_id,
//   "route_name": trip.route.name if trip.route else None
// }


export function UserScheduleSearch() {
  const [mySchedules, setMySchedules] = useState<Trip[]>([]);
  const [semesterSchedules, setSemesterSchedules] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const [showReserveDialog, setShowReserveDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Trip | null>(null);
  const [showAllTrips, setShowAllTrips] = useState(false);

  // Dialog states
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [cancelScheduleId, setCancelScheduleId] = useState<number | null>(null);

  // Filter state
  const [filterRoute, setFilterRoute] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [filterTime, setFilterTime] = useState("all");

  // Fetch user's registered trips and semester-wide routes from API
  useEffect(() => {
    const fetchTrips = async () => {
      setLoading(true);
      try {
        const [myTripsData, routesData] = await Promise.all([userAPI.getMyTrips(), adminAPI.getRoutes()]);

        const mappedMy = (myTripsData || []).map((trip: any) => ({
          id: trip.id,
          date: trip.date || "",
          status: trip.status || "",
          ETA: trip.ETA || trip.start_time || "",
          bus_id: trip.bus_id || 0,
          route_id: trip.route_id || trip.route?.id || 0,
          route_name: trip.route_name || trip.route?.name || "",
          departure: trip.start_time || trip.ETA || "",
          arrival: trip.end_time || trip.ETA || "",
          driver: trip.driver_name || trip.driver || (trip.bus_id ? `Bus ${trip.bus_id}` : "N/A"),
          // Use bus.no_seats for capacity and seats_taken from backend
          capacity: trip.bus?.no_seats ? Number(trip.bus.no_seats) : undefined,
          available: typeof trip.seats_available === "number"
            ? trip.seats_available
            : typeof trip.seats_remaining === "number"
            ? trip.seats_remaining
            : typeof trip.available === "number"
            ? trip.available
            : undefined,
          seats_taken: typeof trip.seats_taken === "number" ? trip.seats_taken : undefined,
          days: trip.days_of_week || trip.route?.days_of_week || [],
          raw: trip,
        } as Trip));

        const mappedRoutes = (routesData || []).map((route: any) => ({
          // use negative id to avoid clashing with real trip ids
          id: -(route.id || 0),
          date: "",
          status: route.status || "semester",
          ETA: route.start_time || "",
          bus_id: 0,
          route_id: route.id,
          route_name: route.name || route.route_name || "",
          departure: route.start_time || "",
          arrival: route.end_time || "",
          driver: route.driver_name || "Semester Route",
          capacity: typeof route.capacity === "number" ? route.capacity : undefined,
          available: undefined,
          days: route.days_of_week || [],
          raw: route,
        } as Trip));

        setMySchedules(mappedMy);
        setSemesterSchedules(mappedRoutes);
      } catch (err) {
        console.error(err);
        alert("Failed to fetch trips");
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  // Filter helper
  const matchesFilters = (s: Trip) => {
    const routeMatch = filterRoute === "all" || (s.route_name || "").toLowerCase() === filterRoute.toLowerCase();
    const dateMatch = !filterDate || s.date === filterDate;
    const depHour = parseInt((s.departure || "").split(":")[0] || "0");
    const timeMatch =
      filterTime === "all" ||
      (filterTime === "morning" && depHour >= 6 && depHour < 12) ||
      (filterTime === "afternoon" && depHour >= 12 && depHour < 18) ||
      (filterTime === "evening" && depHour >= 18 && depHour <= 22);
    return routeMatch && dateMatch && timeMatch;
  };

  const filteredMySchedules = useMemo(() => {
    const filtered = mySchedules.filter(matchesFilters);
    // Sort by date chronologically (earliest first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.date || "");
      const dateB = new Date(b.date || "");
      return dateA.getTime() - dateB.getTime();
    });
  }, [mySchedules, filterRoute, filterDate, filterTime]);

  const displayedMySchedules = useMemo(() => {
    return showAllTrips ? filteredMySchedules : filteredMySchedules.slice(0, 5);
  }, [filteredMySchedules, showAllTrips]);

  const filteredSemesterSchedules = useMemo(() => semesterSchedules.filter(matchesFilters), [semesterSchedules, filterRoute, filterDate, filterTime]);

  // Handle reservation - call backend API
  const handleReserve = async (scheduleId: number) => {
    try {
      const response = await userAPI.reserveSeat(scheduleId);
      
      // Update local state with new seat counts from backend
      const updateSchedule = (s: Trip) => {
        if (s.id === scheduleId) {
          return {
            ...s,
            available: response.seats_remaining,
            capacity: response.total_seats,
          };
        }
        return s;
      };

      setMySchedules((prev) => prev.map(updateSchedule));
      setSemesterSchedules((prev) => prev.map(updateSchedule));
      
      setShowReserveDialog(false);
      setDialogMessage(response.message || "Seat reserved successfully!");
      setShowSuccessDialog(true);
    } catch (err: any) {
      console.error(err);
      setShowReserveDialog(false);
      setDialogMessage(err?.message || "Failed to reserve seat");
      setShowErrorDialog(true);
    }
  };

  // Handle cancel reservation - show confirmation dialog
  const handleCancelClick = (scheduleId: number) => {
    setCancelScheduleId(scheduleId);
    setShowCancelDialog(true);
  };

  const confirmCancelReservation = async () => {
    if (cancelScheduleId === null) return;
    
    try {
      const response = await userAPI.cancelReservation(cancelScheduleId);
      
      // Refresh trips after cancellation
      const [myTripsData] = await Promise.all([userAPI.getMyTrips()]);
      const mappedMy = (myTripsData || []).map((trip: any) => ({
        id: trip.id,
        date: trip.date || "",
        status: trip.status || "",
        ETA: trip.ETA || trip.start_time || "",
        bus_id: trip.bus_id || 0,
        route_id: trip.route_id || trip.route?.id || 0,
        route_name: trip.route_name || trip.route?.name || "",
        departure: trip.start_time || trip.ETA || "",
        arrival: trip.end_time || trip.ETA || "",
        driver: trip.driver_name || trip.driver || (trip.bus_id ? `Bus ${trip.bus_id}` : "N/A"),
        capacity: trip.bus?.no_seats ? Number(trip.bus.no_seats) : undefined,
        available: typeof trip.seats_available === "number"
          ? trip.seats_available
          : typeof trip.seats_remaining === "number"
          ? trip.seats_remaining
          : typeof trip.available === "number"
          ? trip.available
          : undefined,
        seats_taken: typeof trip.seats_taken === "number" ? trip.seats_taken : undefined,
        days: trip.days_of_week || trip.route?.days_of_week || [],
        raw: trip,
      } as Trip));
      
      setMySchedules(mappedMy);
      setShowCancelDialog(false);
      setDialogMessage(response.message || "Reservation cancelled successfully!");
      setShowSuccessDialog(true);
      setCancelScheduleId(null);
    } catch (err: any) {
      console.error(err);
      setShowCancelDialog(false);
      setDialogMessage(err?.message || "Failed to cancel reservation");
      setShowErrorDialog(true);
      setCancelScheduleId(null);
    }
  };

  if (loading) return <p className="text-center py-20">Loading trips...</p>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1>Schedule Search</h1>
        <p className="text-muted-foreground">Find and book shuttle trips</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Filters</CardTitle>
          <CardDescription>Filter schedules by your preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Route</Label>
              <Select value={filterRoute} onValueChange={setFilterRoute}>
                <SelectTrigger>
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Routes</SelectItem>
                  {[...new Set([...mySchedules, ...semesterSchedules].map((s) => s.route_name).filter(Boolean))].map((route) => (
                    <SelectItem key={route} value={route}>
                      {route}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Time Range</Label>
              <Select value={filterTime} onValueChange={setFilterTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Day</SelectItem>
                  <SelectItem value="morning">Morning (6AM - 12PM)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12PM - 6PM)</SelectItem>
                  <SelectItem value="evening">Evening (6PM - 10PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registered (Daily) Trips */}
      <div>
        <h2 className="text-lg font-medium">Your Registered Trips</h2>
        <p className="text-sm text-muted-foreground mb-4">Daily trips you've registered for</p>

        {filteredMySchedules.length === 0 ? (
          <p className="text-muted-foreground">You have no registered daily trips.</p>
        ) : (
          <Tabs defaultValue="list" className="space-y-4">
            <TabsList>
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="grid">Grid View</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              {displayedMySchedules.map((schedule) => (
                <Card key={schedule.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Bus className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <h3>{schedule.route_name}</h3>
                            <div className="text-xs text-muted-foreground mt-1">
                              {schedule.date || schedule.raw?.date || "—"} • {String(schedule.status || schedule.raw?.status || "—")}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>
                                  {schedule.departure || schedule.startTime || schedule.raw?.route?.start_time || "—"} - {schedule.arrival || schedule.endTime || schedule.raw?.route?.end_time || "—"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Bus className="w-4 h-4" />
                                <span>Bus: {schedule.raw?.bus?.plate_num || schedule.bus || "N/A"}</span>
                              </div>
                            </div>
                          </div>

                          {Array.isArray(schedule.days) && schedule.days.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Days:</span>
                              <div className="flex gap-1">
                                {schedule.days.map((day) => (
                                  <Badge key={day} variant="outline" className="text-xs">
                                    {day}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Seats:</span>
                            <span className="text-sm">
                              {typeof schedule.seats_taken === "number" && typeof schedule.capacity === "number"
                                ? `${schedule.seats_taken}/${schedule.capacity}`
                                : "Seats info unavailable"}
                            </span>
                            {typeof schedule.seats_taken === "number" && typeof schedule.capacity === "number" ? (
                              <div className="flex-1 max-w-xs">
                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary"
                                    style={{
                                      width: `${(schedule.seats_taken / schedule.capacity) * 100}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedSchedule(schedule);
                            setShowDetailsDialog(true);
                          }}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleCancelClick(schedule.id)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="grid">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedMySchedules.map((schedule) => (
                  <Card key={schedule.id}>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Bus className="w-5 h-5 text-primary" />
                        </div>
                        <CardTitle className="text-base">{schedule.route_name}</CardTitle>
                      </div>
                      <CardDescription>Driver: {schedule.driver}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>
                            {schedule.departure} - {schedule.arrival}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div className="flex gap-1">
                            {schedule.days.map((day) => (
                              <Badge key={day} variant="outline" className="text-xs">
                                {day}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Availability</span>
                          <span>
                            {schedule.available}/{schedule.capacity}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          {typeof schedule.seats_taken === "number" && typeof schedule.capacity === "number" ? (
                            <div className="h-full bg-primary"
                              style={{
                                width: `${(schedule.seats_taken / schedule.capacity) * 100}%`,
                              }}
                            />
                          ) : null}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          size="sm"
                          onClick={() => {
                            setSelectedSchedule(schedule);
                            setShowDetailsDialog(true);
                          }}
                        >
                          Details
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          size="sm"
                          onClick={() => handleCancelClick(schedule.id)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
        
        {filteredMySchedules.length > 5 && (
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              onClick={() => setShowAllTrips(!showAllTrips)}
            >
              {showAllTrips ? "See Less" : `See More (${filteredMySchedules.length - 5} more trips)`}
            </Button>
          </div>
        )}
      </div>

      {/* Semester-wide (Routes) */}
      <div>
        <h2 className="text-lg font-medium">All Semester-Wide Trips</h2>
        <p className="text-sm text-muted-foreground mb-4">Routes that run for the semester</p>

        {filteredSemesterSchedules.length === 0 ? (
          <p className="text-muted-foreground">No semester-wide trips available.</p>
        ) : (
          <Tabs defaultValue="list" className="space-y-4">
            <TabsList>
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="grid">Grid View</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              {filteredSemesterSchedules.map((schedule) => (
                <Card key={schedule.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Bus className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <h3>{schedule.route_name}</h3>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                <span>{schedule.driver}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>
                                  {schedule.departure} - {schedule.arrival}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Days:</span>
                            <div className="flex gap-1">
                              {schedule.days.map((day) => (
                                <Badge key={day} variant="outline" className="text-xs">
                                  {day}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Seats:</span>
                            <span className="text-sm">
                              {typeof schedule.seats_taken === "number" && typeof schedule.capacity === "number"
                                ? `${schedule.seats_taken}/${schedule.capacity}`
                                : "Seats info unavailable"}
                            </span>
                            {typeof schedule.seats_taken === "number" && typeof schedule.capacity === "number" ? (
                              <div className="flex-1 max-w-xs">
                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary"
                                    style={{
                                      width: `${(schedule.seats_taken / schedule.capacity) * 100}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            ) : null}
                          </div> */}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedSchedule(schedule);
                            setShowDetailsDialog(true);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="grid">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSemesterSchedules.map((schedule) => (
                  <Card key={schedule.id}>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Bus className="w-5 h-5 text-primary" />
                        </div>
                        <CardTitle className="text-base">{schedule.route_name}</CardTitle>
                      </div>
                      <CardDescription>Driver: {schedule.driver}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>
                            {schedule.departure} - {schedule.arrival}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div className="flex gap-1">
                            {schedule.days.map((day) => (
                              <Badge key={day} variant="outline" className="text-xs">
                                {day}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Availability</span>
                          <span>
                            {schedule.available}/{schedule.capacity}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          {typeof schedule.seats_taken === "number" && typeof schedule.capacity === "number" ? (
                            <div className="h-full bg-primary"
                              style={{
                                width: `${(schedule.seats_taken / schedule.capacity) * 100}%`,
                              }}
                            />
                          ) : null}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          size="sm"
                          onClick={() => {
                            setSelectedSchedule(schedule);
                            setShowDetailsDialog(true);
                          }}
                        >
                          Details
                        </Button>
                    
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Reserve Seat Dialog */}
      <Dialog open={showReserveDialog} onOpenChange={setShowReserveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reserve Seat</DialogTitle>
            <DialogDescription>Book your seat for this shuttle</DialogDescription>
          </DialogHeader>
          {selectedSchedule && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Route</Label>
                <Input value={selectedSchedule.route_name} disabled />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Departure</Label>
                  <Input value={selectedSchedule.departure} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Arrival</Label>
                  <Input value={selectedSchedule.arrival} disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Driver</Label>
                <Input value={selectedSchedule.driver} disabled />
              </div>
              <div className="space-y-2">
                <Label>Available Seats</Label>
                <Input value={`${selectedSchedule.available ?? "N/A"} of ${selectedSchedule.capacity ?? "N/A"}`} disabled />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => handleReserve(selectedSchedule.id)}
                  disabled={typeof selectedSchedule.available === "number" ? selectedSchedule.available === 0 : false}
                >
                  {typeof selectedSchedule.available === "number" && selectedSchedule.available === 0 ? "Full" : "Confirm Reservation"}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setShowReserveDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trip Details</DialogTitle>
            <DialogDescription>Complete schedule information</DialogDescription>
          </DialogHeader>
          {selectedSchedule && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Route</Label>
                <Input value={selectedSchedule.route_name} disabled />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input value={selectedSchedule.date || selectedSchedule.raw?.date || "—"} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Input value={String(selectedSchedule.status || selectedSchedule.raw?.status || "—")} disabled />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input value={selectedSchedule.departure || selectedSchedule.startTime || selectedSchedule.raw?.route?.start_time || "—"} disabled />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input value={selectedSchedule.arrival || selectedSchedule.endTime || selectedSchedule.raw?.route?.end_time || "—"} disabled />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bus Plate Number</Label>
                  <Input value={selectedSchedule.raw?.bus?.plate_num || selectedSchedule.bus || "N/A"} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Driver</Label>
                  <Input value={selectedSchedule.driver || selectedSchedule.raw?.driver?.first_name + ' ' + selectedSchedule.raw?.driver?.last_name || "N/A"} disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Operating Days</Label>
                <div className="flex gap-2">
                  {Array.isArray(selectedSchedule.days) && selectedSchedule.days.length > 0 ? (
                    selectedSchedule.days.map((day) => (
                      <Badge key={day} variant="outline">
                        {day}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No days specified</span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input value={`${selectedSchedule.capacity ?? "N/A"} seats (${selectedSchedule.available ?? "N/A"} available)`} disabled />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    setShowDetailsDialog(false);
                    setShowReserveDialog(true);
                  }}
                >
                  Reserve Seat
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Success</DialogTitle>
            <DialogDescription>{dialogMessage}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setShowSuccessDialog(false)}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>{dialogMessage}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button variant="destructive" onClick={() => setShowErrorDialog(false)}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Reservation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this reservation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              No, Keep It
            </Button>
            <Button variant="destructive" onClick={confirmCancelReservation}>
              Yes, Cancel Reservation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
