"use client";

import {
  Bus,
  MapPin,
  Bell,
  Package,
  Clock,
  Users,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Progress,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
  Input,
} from "../ui";
import React, { useState } from "react";
import { notifications, upcomingTrips, nextShuttle } from "../../data/database";
import GpsDashboard from "../GpsDashboard";

interface StudentDashboardProps {
  onNavigate?: (page: string) => void;
}

export function StudentDashboard({ onNavigate }: StudentDashboardProps) {
  const [showReserveDialog, setShowReserveDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1>Student Dashboard</h1>
        <p className="text-muted-foreground">
          Track shuttles and manage your commute
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Next Shuttle</p>
                <h3>5 min</h3>
              </div>
              <Clock className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Routes</p>
                <h3>8</h3>
              </div>
              <MapPin className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Notifications</p>
                <h3>3</h3>
              </div>
              <Bell className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lost Items</p>
                <h3>12</h3>
              </div>
              <Package className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <GpsDashboard role="student" userId={3} tripId={1} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Available Shuttle */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Next Available Shuttle</CardTitle>
            <CardDescription>Your upcoming ride details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-lg border-l-4 border-primary">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3>{nextShuttle.route}</h3>
                  <p className="text-muted-foreground">
                    Departure: {nextShuttle.time}
                  </p>
                </div>
                <Badge variant="default">
                  Arriving in {nextShuttle.arrivalIn}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>Driver: {nextShuttle.driver}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Occupancy</span>
                    <span>{nextShuttle.occupancy}%</span>
                  </div>
                  <Progress value={nextShuttle.occupancy} />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={() => onNavigate?.("tracking")}
              >
                <MapPin className="w-4 h-4 mr-2" />
                Track Live
              </Button>
              <Dialog
                open={showReserveDialog}
                onOpenChange={setShowReserveDialog}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1">
                    Reserve Seat
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reserve Seat</DialogTitle>
                    <DialogDescription>
                      Book your seat for the next shuttle
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Route</Label>
                      <Input value={nextShuttle.route} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Departure Time</Label>
                      <Input value={nextShuttle.time} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Your Name</Label>
                      <Input placeholder="Enter your full name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Student ID</Label>
                      <Input placeholder="Enter your student ID" />
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => {
                        // Seat reserved successfully!
                        setShowReserveDialog(false);
                      }}
                    >
                      Confirm Reservation
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Mini Map Placeholder */}
            <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Live Map View</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Recent updates and alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-3 border border-border rounded-lg space-y-2"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle
                    className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      notif.type === "info"
                        ? "text-blue-500"
                        : notif.type === "success"
                        ? "text-green-500"
                        : "text-yellow-500"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notif.time}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <Button variant="outline" className="w-full">
              View All Notifications
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Trips */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
          <CardDescription>All available shuttles for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingTrips.map((trip) => (
              <div
                key={trip.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Bus className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4>{trip.route}</h4>
                    <p className="text-sm text-muted-foreground">{trip.time}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <Badge
                      variant={
                        trip.status === "On Time" ? "default" : "destructive"
                      }
                    >
                      {trip.status}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      Seats: {trip.seats}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTrip(trip);
                      setShowDetailsDialog(true);
                    }}
                  >
                    Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onNavigate?.("lost-found")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h4>Lost & Found</h4>
                <p className="text-sm text-muted-foreground">
                  Report or claim items
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onNavigate?.("schedule")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h4>Full Schedule</h4>
                <p className="text-sm text-muted-foreground">
                  View all routes and times
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trip Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trip Details</DialogTitle>
            <DialogDescription>
              Complete information about this shuttle trip
            </DialogDescription>
          </DialogHeader>
          {selectedTrip && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Route</Label>
                <Input value={selectedTrip.route} disabled />
              </div>
              <div className="space-y-2">
                <Label>Departure Time</Label>
                <Input value={selectedTrip.time} disabled />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Badge
                  variant={
                    selectedTrip.status === "On Time"
                      ? "default"
                      : "destructive"
                  }
                >
                  {selectedTrip.status}
                </Badge>
              </div>
              <div className="space-y-2">
                <Label>Available Seats</Label>
                <Input value={selectedTrip.seats} disabled />
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
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDetailsDialog(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
