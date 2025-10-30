"use client";

import React, { useState } from "react";
import { Edit, Trash2, Plus, Search } from "lucide-react";
import { Trip } from "../../../data/types";
import { trips as initialTrips } from "../../../data/database";
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
  Input,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Button,
} from "../../ui";
import { EditTrip } from "./EditTrip";

export function AdminManageTrips() {
  const [tripsList, setTripsList] = useState<Trip[]>(initialTrips);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const handleSaveTrip = (
    tripData: Omit<Trip, "id" | "passengers" | "status" | "ETA">
  ) => {
    if (editingTrip) {
      setTripsList((prev) =>
        prev.map((t) => (t.id === editingTrip.id ? { ...t, ...tripData } : t))
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
          passengers: 0,
          status: "Upcoming",
          ETA: tripData.endTime,
          ...tripData,
        },
      ]);
    }
    setShowDialog(false);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this trip?")) {
      setTripsList((prev) => prev.filter((trip) => trip.id !== id));
    }
  };

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
        <Button
          onClick={() => {
            setEditingTrip(null);
            setShowDialog(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Trip
        </Button>
      </div>

      {/* Search & Filter */}
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
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
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
                <TableHead>Driver</TableHead>
                <TableHead>Bus</TableHead>
                <TableHead>Start Terminal</TableHead>
                <TableHead>Stop Terminal</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Passengers</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell>{trip.driver}</TableCell>
                  <TableCell>{trip.bus}</TableCell>
                  <TableCell>{trip.startTerminal}</TableCell>
                  <TableCell>{trip.stopTerminal}</TableCell>
                  <TableCell>{trip.startTime}</TableCell>
                  <TableCell>{trip.endTime}</TableCell>
                  <TableCell>{trip.type}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        trip.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : trip.status === "Upcoming"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
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

      {/* Trip Form Dialog */}
      <EditTrip
        open={showDialog}
        onOpenChange={setShowDialog}
        onSave={handleSaveTrip}
        editingTrip={editingTrip}
      />
    </div>
  );
}
