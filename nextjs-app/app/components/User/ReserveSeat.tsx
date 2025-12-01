"use client";

import { Calendar, MapPin, Clock, Bus, Users, AlertCircle } from "lucide-react";
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
  Alert,
  AlertDescription,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui";
import React, { useState, useEffect } from "react";
import { userAPI } from "../../lib/api";

interface Trip {
  id: number;
  date: string;
  status: string;
  start_time: string;
  end_time: string;
  bus_id: number;
  route_id: number;
  route_name?: string;
  route?: {
    id: number;
    name: string;
    start_time: string;
    end_time: string;
  };
  bus?: {
    id: number;
    plate_num: string;
    no_seats: number;
  };
  driver?: {
    first_name: string;
    last_name: string;
  };
  driver_name?: string;
  seats_taken?: number;
  seats_available?: number;
  total_capacity?: number;
  is_registered?: boolean;
}

export function ReserveSeat() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllTrips, setShowAllTrips] = useState(false);
  
  // Dialog states
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);

  // Fetch all trips
  useEffect(() => {
    const fetchTrips = async () => {
      setLoading(true);
      try {
        const data = await userAPI.getAllTrips();

        // Filter to show only trips from today onwards
        const today = new Date().toISOString().split('T')[0];
        const upcomingTrips = (data || []).filter((trip: any) => {
          const tripDate = trip.date ? (typeof trip.date === 'string' ? trip.date.split('T')[0] : trip.date) : '';
          return tripDate >= today;
        });

        // Sort by date in ascending order (earliest first)
        upcomingTrips.sort((a: any, b: any) => {
          const dateA = new Date(a.date || "").getTime();
          const dateB = new Date(b.date || "").getTime();
          return dateA - dateB;
        });

        setTrips(upcomingTrips);
        setFilteredTrips(upcomingTrips);
      } catch (err) {
        console.error("Failed to fetch trips:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  // Filter trips
  useEffect(() => {
    let filtered = trips;

    if (selectedRoute !== "all") {
      filtered = filtered.filter(
        (trip) =>
          trip.route_name === selectedRoute || trip.route?.name === selectedRoute
      );
    }

    if (selectedDate) {
      filtered = filtered.filter((trip) => trip.date === selectedDate);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (trip) =>
          (trip.route_name || trip.route?.name || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (trip.bus?.plate_num || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.date || "");
      const dateB = new Date(b.date || "");
      return dateA.getTime() - dateB.getTime();
    });

    setFilteredTrips(filtered);
  }, [trips, selectedRoute, selectedDate, searchQuery]);

  // Get unique routes
  const routes = Array.from(
    new Set(
      trips.map((trip) => trip.route_name || trip.route?.name).filter(Boolean)
    )
  );

  // Handle reserve seat
  const handleReserveSeat = async (tripId: number) => {
    try {
      const response = await userAPI.reserveSeat(tripId);

      // Check if response is successful
      if (response && response.message) {
        setDialogMessage(response.message || "Your seat has been reserved successfully!");
        setShowSuccessDialog(true);

        // Refresh trips to update the UI - only show upcoming trips
        const data = await userAPI.getAllTrips();
        const today = new Date().toISOString().split('T')[0];
        const upcomingTrips = (data || []).filter((trip: any) => {
          const tripDate = trip.date ? (typeof trip.date === 'string' ? trip.date.split('T')[0] : trip.date) : '';
          return tripDate >= today;
        });
        setTrips(upcomingTrips);
      }
    } catch (err: any) {
      console.error(err);

      // Extract user-friendly error message from backend
      let errorMessage = "Unable to reserve seat. Please try again.";

      // Check for specific error messages from backend
      if (err?.response?.data?.detail) {
        const detail = err.response.data.detail;

        // Customize messages for common scenarios
        if (detail.includes("already registered for this route")) {
          errorMessage = "You're already registered for this route for the entire semester. No need to book individual trips!";
        } else if (detail.includes("already reserved")) {
          errorMessage = "You've already reserved a seat for this trip.";
        } else if (detail.includes("No available seats") || detail.includes("full")) {
          errorMessage = "Sorry, this trip is fully booked. Please try another trip.";
        } else if (detail.includes("No bus assigned")) {
          errorMessage = "This trip doesn't have a bus assigned yet. Please try again later.";
        } else {
          // Use the backend message if it doesn't match known patterns
          errorMessage = detail;
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setDialogMessage(errorMessage);
      setShowErrorDialog(true);
    }
  };

  // Handle cancel reservation - show confirmation dialog
  const handleCancelClick = (tripId: number) => {
    setSelectedTripId(tripId);
    setShowCancelDialog(true);
  };

  const confirmCancelReservation = async () => {
    if (selectedTripId === null) return;

    try {
      const response = await userAPI.cancelReservation(selectedTripId);

      if (response && response.message) {
        setShowCancelDialog(false);
        setDialogMessage(response.message || "Your reservation has been cancelled successfully!");
        setShowSuccessDialog(true);

        // Refresh trips - only show upcoming trips
        const data = await userAPI.getAllTrips();
        const today = new Date().toISOString().split('T')[0];
        const upcomingTrips = (data || []).filter((trip: any) => {
          const tripDate = trip.date ? (typeof trip.date === 'string' ? trip.date.split('T')[0] : trip.date) : '';
          return tripDate >= today;
        });
        setTrips(upcomingTrips);
        setSelectedTripId(null);
      }
    } catch (err: any) {
      console.error(err);
      setShowCancelDialog(false);

      // Extract user-friendly error message
      const errorMessage = err?.response?.data?.detail ||
                          err?.message ||
                          "Unable to cancel reservation. Please try again.";

      setDialogMessage(errorMessage);
      setShowErrorDialog(true);
      setSelectedTripId(null);
    }
  };

  if (loading) {
    return <p className="text-center py-20">Loading trips...</p>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Reserve a Seat</h1>
        <p className="text-muted-foreground">
          Browse upcoming trips and reserve your seat
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Find the perfect trip for you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Route name or bus plate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Route</Label>
              <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                <SelectTrigger>
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Routes</SelectItem>
                  {routes.map((route) => (
                    <SelectItem key={route} value={route || ""}>
                      {route}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {filteredTrips.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No trips found matching your criteria.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">
              Available Trips ({filteredTrips.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {(showAllTrips ? filteredTrips : filteredTrips.slice(0, 5)).map((trip) => {
              const routeName = trip.route_name || trip.route?.name || "Unknown Route";
              const startTime = trip.start_time || trip.route?.start_time || "N/A";
              const endTime = trip.end_time || trip.route?.end_time || "N/A";
              const busPlate = trip.bus?.plate_num || "N/A";
              const totalSeats = trip.bus?.no_seats || trip.total_capacity || 0;
              const seatsTaken = trip.seats_taken || 0;
              const seatsAvailable = trip.seats_available || (totalSeats - seatsTaken);
              const isRegistered = trip.is_registered || false;
              const isFull = seatsAvailable <= 0;

              return (
                <Card key={trip.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Bus className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 space-y-3">
                          {/* Route name and status */}
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold">{routeName}</h3>
                              {isRegistered && (
                                <Badge variant="default">Registered</Badge>
                              )}
                              {isFull && !isRegistered && (
                                <Badge variant="destructive">Full</Badge>
                              )}
                              <Badge variant="outline">{trip.status}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {trip.date}
                            </div>
                          </div>

                          {/* Trip details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span>
                                {startTime} - {endTime}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Bus className="w-4 h-4" />
                              <span>Bus: {busPlate}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Users className="w-4 h-4" />
                              <span>
                                Seats: {seatsTaken}/{totalSeats}
                              </span>
                            </div>
                          </div>

                          {/* Seat availability bar */}
                          {totalSeats > 0 && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{seatsAvailable} seats available</span>
                                <span>{Math.round((seatsTaken / totalSeats) * 100)}% full</span>
                              </div>
                              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    isFull ? "bg-destructive" : "bg-primary"
                                  }`}
                                  style={{
                                    width: `${(seatsTaken / totalSeats) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action button */}
                      <div className="ml-4">
                        {isRegistered ? (
                          <Button
                            variant="destructive"
                            onClick={() => handleCancelClick(trip.id)}
                          >
                            Cancel Reservation
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleReserveSeat(trip.id)}
                            disabled={isFull}
                          >
                            {isFull ? "Full" : "Reserve Seat"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* See More button */}
          {filteredTrips.length > 5 && (
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                onClick={() => setShowAllTrips(!showAllTrips)}
              >
                {showAllTrips ? "See Less" : `See More (${filteredTrips.length - 5} more trips)`}
              </Button>
            </div>
          )}
        </div>
      )}

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
            <DialogTitle>Unable to Reserve Seat</DialogTitle>
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
