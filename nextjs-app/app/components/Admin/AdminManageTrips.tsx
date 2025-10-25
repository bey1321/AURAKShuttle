"use client";

import React, { useState } from "react";
import { Edit, Trash2, Plus, Search } from "lucide-react";
import { Trip } from "../../data/types";
import { trips as initialTrips } from "../../data/database";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Label,
  Input,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Button,
} from "../ui";

export function AdminManageTrips() {
  const [tripsList, setTripsList] = useState<Trip[]>(initialTrips);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const [newTrip, setNewTrip] = useState({
    route: "",
    driver: "",
    bus: "",
    time: "",
  });

  const handleSaveTrip = () => {
    if (!newTrip.route || !newTrip.driver || !newTrip.bus || !newTrip.time)
      return alert("Please fill all fields.");

    if (editingTrip) {
      setTripsList((prev) =>
        prev.map((t) =>
          t.id === editingTrip.id
            ? {
                ...t,
                route: newTrip.route,
                driver: newTrip.driver,
                bus: newTrip.bus,
                time: newTrip.time,
              }
            : t
        )
      );
      setEditingTrip(null);
    } else {
      const newId = tripsList.length
        ? Math.max(...tripsList.map((t) => t.id)) + 1
        : 1;
      setTripsList([
        ...tripsList,
        {
          id: newId,
          route: newTrip.route,
          driver: newTrip.driver,
          bus: newTrip.bus,
          time: newTrip.time,
          passengers: 0,
          status: "Upcoming",
        },
      ]);
    }

    setNewTrip({ route: "", driver: "", bus: "", time: "" });
    setShowDialog(false);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this trip?")) {
      setTripsList((prev) => prev.filter((trip) => trip.id !== id));
    }
  };

  // Apply search + filter by driver name and status
  const filteredTrips = tripsList.filter((trip) => {
    const matchesDriver = trip.driver
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || trip.status === filterStatus;
    return matchesDriver && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Manage Trips</h1>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {editingTrip ? "Edit Trip" : "Create Trip"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTrip ? "Edit Trip" : "Create New Trip"}
              </DialogTitle>
              <DialogDescription>
                {editingTrip
                  ? "Modify trip details below."
                  : "Add a new shuttle trip to the schedule."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Route</Label>
                <Select
                  value={newTrip.route}
                  onValueChange={(value) =>
                    setNewTrip({ ...newTrip, route: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select route" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Main Campus → Khatt Terminal">
                      Main Campus → Khatt Terminal
                    </SelectItem>
                    <SelectItem value="Khatt Terminal → Main Campus">
                      Khatt Terminal → Main Campus
                    </SelectItem>
                    <SelectItem value="Main Campus → RAK Mall">
                      Main Campus → RAK Mall
                    </SelectItem>
                    <SelectItem value="RAK Mall → Main Campus">
                      RAK Mall → Main Campus
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assign Driver</Label>
                <Select
                  value={newTrip.driver}
                  onValueChange={(value) =>
                    setNewTrip({ ...newTrip, driver: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ahmed Hassan">Ahmed Hassan</SelectItem>
                    <SelectItem value="Mohammed Ali">Mohammed Ali</SelectItem>
                    <SelectItem value="Sara Ahmed">Sara Ahmed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Bus</Label>
                <Select
                  value={newTrip.bus}
                  onValueChange={(value) =>
                    setNewTrip({ ...newTrip, bus: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bus A1">Bus A1</SelectItem>
                    <SelectItem value="Bus B2">Bus B2</SelectItem>
                    <SelectItem value="Bus C3">Bus C3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Departure Time</Label>
                <Input
                  type="time"
                  value={newTrip.time}
                  onChange={(e) =>
                    setNewTrip({ ...newTrip, time: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleSaveTrip}>
                  {editingTrip ? "Save Changes" : "Create Trip"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full sm:w-[300px]">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by driver name..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Upcoming">Upcoming</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Trips List</CardTitle>
          <CardDescription>View, edit, or delete shuttle trips</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Bus</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Passengers</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell>{trip.route}</TableCell>
                  <TableCell>{trip.driver}</TableCell>
                  <TableCell>{trip.bus}</TableCell>
                  <TableCell>{trip.time}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        trip.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {trip.status}
                    </span>
                  </TableCell>
                  <TableCell>{trip.passengers}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingTrip(trip);
                        setNewTrip({
                          route: trip.route,
                          driver: trip.driver,
                          bus: trip.bus,
                          time: trip.time,
                        });
                        setShowDialog(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(trip.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
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
