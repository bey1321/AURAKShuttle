"use client";

import React, { useState } from "react";
import { trips, drivers, adminStats } from "../../data/database";
import {
  Bus,
  Users,
  MapPin,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  BarChart3,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui";

export function AdminDashboard() {
  const [showCreateTrip, setShowCreateTrip] = useState(false);
  const [showAddDriver, setShowAddDriver] = useState(false);

  const stats = adminStats;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage shuttle operations and users
          </p>
        </div>
        <Dialog open={showCreateTrip} onOpenChange={setShowCreateTrip}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Trip
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Trip</DialogTitle>
              <DialogDescription>
                Add a new shuttle trip to the schedule
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Route</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select route" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="route1">
                      Main Campus → Khatt Terminal
                    </SelectItem>
                    <SelectItem value="route2">
                      Khatt Terminal → Main Campus
                    </SelectItem>
                    <SelectItem value="route3">
                      Main Campus → RAK Mall
                    </SelectItem>
                    <SelectItem value="route4">
                      RAK Mall → Main Campus
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assign Driver</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="driver1">Ahmed Hassan</SelectItem>
                    <SelectItem value="driver2">Mohammed Ali</SelectItem>
                    <SelectItem value="driver3">Sara Ahmed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Departure Time</Label>
                  <Input type="time" />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input type="number" placeholder="40" />
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => setShowCreateTrip(false)}
                >
                  Create Trip
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCreateTrip(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Trips</p>
                <h3>{stats.totalTrips}</h3>
              </div>
              <Bus className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Drivers</p>
                <h3>{stats.activeDrivers}</h3>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <h3>{stats.totalStudents}</h3>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Occupancy</p>
                <h3>{stats.avgOccupancy}%</h3>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Usage Analytics</CardTitle>
            <CardDescription>Trip statistics for this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Monday</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: "85%" }}
                    />
                  </div>
                  <span className="text-sm">680</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Tuesday</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: "92%" }}
                    />
                  </div>
                  <span className="text-sm">720</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Wednesday</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: "78%" }}
                    />
                  </div>
                  <span className="text-sm">610</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Thursday</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: "88%" }}
                    />
                  </div>
                  <span className="text-sm">690</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Friday</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: "65%" }}
                    />
                  </div>
                  <span className="text-sm">510</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Busiest Routes</CardTitle>
            <CardDescription>Top performing routes this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { route: "Main Campus → Khatt", trips: 156, growth: "+12%" },
                { route: "RAK Mall → Main Campus", trips: 142, growth: "+8%" },
                { route: "Main Campus → RAK Mall", trips: 138, growth: "+5%" },
                { route: "Khatt → Main Campus", trips: 129, growth: "+3%" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <span>{item.route}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>{item.trips} trips</span>
                    <Badge variant="outline" className="text-green-600">
                      {item.growth}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trip Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Manage Trips</CardTitle>
              <CardDescription>
                View, edit, and delete shuttle trips
              </CardDescription>
            </div>
            <Button variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" />
              View Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Passengers</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell>{trip.route}</TableCell>
                  <TableCell>{trip.driver}</TableCell>
                  <TableCell>{trip.time}</TableCell>
                  <TableCell>
                    <Badge
                      variant={trip.status === "Active" ? "default" : "outline"}
                    >
                      {trip.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {trip.passengers}/{trip.capacity}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Driver Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Manage Drivers</CardTitle>
              <CardDescription>
                Assign and monitor driver activities
              </CardDescription>
            </div>
            <Dialog open={showAddDriver} onOpenChange={setShowAddDriver}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Driver
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Driver</DialogTitle>
                  <DialogDescription>
                    Add a new driver to the system
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input placeholder="Enter driver's full name" />
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" placeholder="driver@aurak.ac.ae" />
                  </div>

                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input type="tel" placeholder="+971 XX XXX XXXX" />
                  </div>

                  <div className="space-y-2">
                    <Label>License Number</Label>
                    <Input placeholder="Enter license number" />
                  </div>

                  <div className="space-y-2">
                    <Label>Assigned Vehicle</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bus1">Bus 001</SelectItem>
                        <SelectItem value="bus2">Bus 002</SelectItem>
                        <SelectItem value="bus3">Bus 003</SelectItem>
                        <SelectItem value="bus4">Bus 004</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => {
                        // Driver added successfully!
                        setShowAddDriver(false);
                      }}
                    >
                      Add Driver
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowAddDriver(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Today's Trips</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell>{driver.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        driver.status === "Active" ? "default" : "outline"
                      }
                    >
                      {driver.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{driver.trips}</TableCell>
                  <TableCell>⭐ {driver.rating}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        View Profile
                      </Button>
                      <Button size="sm" variant="outline">
                        Assign Trip
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
