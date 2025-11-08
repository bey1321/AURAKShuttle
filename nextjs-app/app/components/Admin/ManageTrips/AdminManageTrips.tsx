"use client";

import React, { useState, useEffect } from "react";
import { Edit, Trash2, Plus, Search } from "lucide-react";
import { adminAPI, tripAPI } from "../../../lib/api";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from "../../ui";
import ConfirmDeleteDialog from "../../ConfirmDeleteDialog";
import CreateTrip from "./CreateTrip";
import CreateSemesterTrips from "./CreateSemesterTrips";

export function AdminManageTrips() {
  const [allTrips, setAllTrips] = useState<any[]>([]);
  const [semesterTrips, setSemesterTrips] = useState<any[]>([]);
  const [singleTrips, setSingleTrips] = useState<any[]>([]);
  const [terminalsMap, setTerminalsMap] = useState<Record<number, string>>({});
  const [busesMap, setBusesMap] = useState<Record<number, string>>({});
  const [driversMap, setDriversMap] = useState<Record<number, string>>({});

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [showCreateSingle, setShowCreateSingle] = useState(false);
  const [showCreateSemester, setShowCreateSemester] = useState(false);

  const [tripToDelete, setTripToDelete] = useState<any | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const trips = await adminAPI.getTrips();
      setAllTrips(trips);

      // Fetch buses, drivers, and terminals for mapping
      const [buses, drivers, terminals] = await Promise.all([
        adminAPI.getBuses(),
        adminAPI.getDrivers(),
        adminAPI.getTerminals(),
      ]);

      // Create lookup maps
      setBusesMap(
        Object.fromEntries(buses.map((b: any) => [b.id, b.plate_num]))
      );
      setDriversMap(
        Object.fromEntries(
          drivers.map((d: any) => [d.id, `${d.first_name} ${d.last_name}`])
        )
      );
      setTerminalsMap(
        Object.fromEntries(terminals.map((t: any) => [t.id, t.terminalName]))
      );

      // Separate trips
      const semester = trips.filter(
        (t: any) => t.type === "academic" || t.type === "semester"
      );
      const single = trips.filter((t: any) => t.type === "regular");
      setSemesterTrips(semester);
      setSingleTrips(single);
    } catch (e) {
      console.error(e);
      alert("Failed to load trips");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  const handleDeleteClick = (trip: any) => {
    setTripToDelete(trip);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!tripToDelete) return;
    try {
      await adminAPI.deleteTrip(tripToDelete.id);
      await loadTrips();
    } catch (e: any) {
      alert(e?.message || "Failed to delete trip");
    } finally {
      setTripToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const cancelDelete = () => {
    setTripToDelete(null);
    setDeleteDialogOpen(false);
  };

  const filterTrips = (trips: any[]) =>
    trips.filter((trip) =>
      trip.name?.toLowerCase().includes(search.toLowerCase())
    );

  const renderTerminals = (ids: number[]) =>
    ids?.map((id) => terminalsMap[id] || "—").join(", ") || "—";

  const renderRow = (trip: any) => (
    <TableRow key={trip.id}>
      <TableCell>{trip.id}</TableCell>
      <TableCell>{trip.name}</TableCell>
      <TableCell>{trip.type}</TableCell>
      <TableCell>{trip.status}</TableCell>
      <TableCell>{busesMap[trip.bus_id] || "—"}</TableCell>
      <TableCell>{driversMap[trip.driver_id] || "—"}</TableCell>
      <TableCell>{terminalsMap[trip.start_terminal_id] || "—"}</TableCell>
      <TableCell>{renderTerminals(trip.terminals)}</TableCell>
      <TableCell>{new Date(trip.date).toLocaleDateString()}</TableCell>
      <TableCell>{trip.start_time}</TableCell>
      <TableCell>{trip.end_time}</TableCell>
      <TableCell className="flex gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => alert(`Edit trip ${trip.name} TBD`)}
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleDeleteClick(trip)}
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Manage Trips</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateSemester(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create Semester Trips
          </Button>
          <Button variant="outline" onClick={() => setShowCreateSingle(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create Single Trip
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full sm:w-[300px]">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="semester">Semester</SelectItem>
            <SelectItem value="single">Single</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Semester Trips */}
      {(filterType === "all" || filterType === "semester") && (
        <Card>
          <CardHeader>
            <CardTitle>Semester Trips</CardTitle>
            <CardDescription>Recurring semester-wide trips</CardDescription>
          </CardHeader>
          <CardContent>
            {filterTrips(semesterTrips).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No semester trips found.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bus</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Start Terminal</TableHead>
                    <TableHead>Terminals</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterTrips(semesterTrips).map(renderRow)}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Single Trips */}
      {(filterType === "all" || filterType === "single") && (
        <Card>
          <CardHeader>
            <CardTitle>Single Trips</CardTitle>
            <CardDescription>One-time scheduled trips</CardDescription>
          </CardHeader>
          <CardContent>
            {filterTrips(singleTrips).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No single trips found.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bus</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Start Terminal</TableHead>
                    <TableHead>Terminals</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{filterTrips(singleTrips).map(renderRow)}</TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Semester Trips Dialog */}
      {showCreateSemester && (
        <Dialog open={showCreateSemester} onOpenChange={setShowCreateSemester}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Semester Trips</DialogTitle>
              <DialogDescription>
                Generate recurring trips for the semester.
              </DialogDescription>
            </DialogHeader>
            <CreateSemesterTrips
              onCancel={() => setShowCreateSemester(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Create Single Trip Dialog */}
      {showCreateSingle && (
        <Dialog open={showCreateSingle} onOpenChange={setShowCreateSingle}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Single Trip</DialogTitle>
              <DialogDescription>
                Configure and create a one-time trip.
              </DialogDescription>
            </DialogHeader>
            <CreateTrip onCancel={() => setShowCreateSingle(false)} />
          </DialogContent>
        </Dialog>
      )}

      {/* Confirm Delete Dialog */}
      {tripToDelete && (
        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          title={`Delete Trip`}
          message={`Are you sure you want to delete trip ${tripToDelete.name}?`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
}
