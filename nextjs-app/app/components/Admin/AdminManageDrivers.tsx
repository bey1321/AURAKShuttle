"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Label,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../ui";

interface Driver {
  id: number;
  name: string;
  status: string;
  trips: number;
  rating: number;
}

const initialDrivers: Driver[] = [
  { id: 1, name: "Ahmed Hassan", status: "Active", trips: 5, rating: 4.8 },
  { id: 2, name: "Sara Ahmed", status: "Inactive", trips: 2, rating: 4.2 },
  { id: 3, name: "Mohammed Ali", status: "Active", trips: 7, rating: 4.9 },
  { id: 4, name: "Fatima Ibrahim", status: "Active", trips: 3, rating: 4.5 },
];

export function AdminManageDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [minTrips, setMinTrips] = useState("");
  const [minRating, setMinRating] = useState("");

  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  const [showAddDriver, setShowAddDriver] = useState(false);
  const [showEditDriver, setShowEditDriver] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);

  const [newDriver, setNewDriver] = useState({
    name: "",
    status: "Active",
    trips: 0,
    rating: 0,
  });

  const handleAddDriver = () => {
    if (!newDriver.name) return;
    const addedDriver = { id: Date.now(), ...newDriver };
    setDrivers([...drivers, addedDriver]);
    setNewDriver({ name: "", status: "Active", trips: 0, rating: 0 });
    setShowAddDriver(false);
  };

  const handleDeleteDriver = (id: number) => {
    setDrivers(drivers.filter((d) => d.id !== id));
  };

  const filteredDrivers = drivers.filter((driver) => {
    const matchSearch = driver.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchStatus =
      filterStatus === "all" || driver.status === filterStatus;

    const matchTrips = !minTrips || driver.trips >= parseInt(minTrips);

    const matchRating = !minRating || driver.rating >= parseFloat(minRating);

    return matchSearch && matchStatus && matchTrips && matchRating;
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Manage Drivers</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <Input
          placeholder="Search name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-48"
        />

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Min Trips"
          type="number"
          value={minTrips}
          onChange={(e) => setMinTrips(e.target.value)}
          className="w-32"
        />

        <Input
          placeholder="Min Rating"
          type="number"
          step="0.1"
          min="0"
          max="5"
          value={minRating}
          onChange={(e) => setMinRating(e.target.value)}
          className="w-32"
        />

        <Button onClick={() => setShowAddDriver(true)}>+ Add Driver</Button>
      </div>

      {/* Drivers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Drivers List</CardTitle>
          <CardDescription>View, edit, and manage drivers</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Trips</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredDrivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell>{driver.name}</TableCell>
                  <TableCell>{driver.status}</TableCell>
                  <TableCell>{driver.trips}</TableCell>
                  <TableCell>⭐ {driver.rating.toFixed(1)}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedDriver(driver);
                        setShowProfile(true);
                      }}
                    >
                      Profile
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditDriver(driver);
                        setShowEditDriver(true);
                      }}
                    >
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteDriver(driver.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {filteredDrivers.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-6 text-muted-foreground"
                  >
                    No drivers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
