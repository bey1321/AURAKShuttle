"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../ui";
import { Bus } from "../../../data/types";
import CreateBusForm from "./CreateBusForm";
import EditBus from "./EditBus";
import ConfirmDeleteDialog from "../../ConfirmDeleteDialog";
import { BusFormData } from "./BusSchema";
import { adminAPI } from "../../../lib/api";

export default function AdminCreateBus() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [showCreateBus, setShowCreateBus] = useState(false);
  const [editBus, setEditBus] = useState<Bus | null>(null);
  const [busToDelete, setBusToDelete] = useState<Bus | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBusForTrips, setSelectedBusForTrips] = useState<Bus | null>(null);
  const [busTrips, setBusTrips] = useState<any[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);

  // Fetch buses from backend on mount
  useEffect(() => {
    const fetchBuses = async () => {
      try {
        setLoading(true);
        const data = await adminAPI.getBuses();

        const mappedBuses: Bus[] = data.map((b: any) => ({
          busID: b.id,
          plate_num: b.plate_num,
          model: b.model,
          manufacturer: b.manufacturer,
          no_seats: b.no_seats,
          status: b.status,
        }));

        setBuses(mappedBuses);
      } catch (err: any) {
        console.error(err);
        alert(err?.message || "Server error while fetching buses");
      } finally {
        setLoading(false);
      }
    };

    fetchBuses();
  }, []);

  // Add bus
  const handleAddBus = async (data: BusFormData) => {
    try {
      // send only the fields your backend expects
      const payload = {
        plate_num: data.plate_num,
        model: data.model,
        manufacturer: data.manufacturer,
        no_seats: data.no_seats,
        status: data.status,
      };

      const json = await adminAPI.createBus(payload);

      // Add the new bus to the frontend state
      const newBus: Bus = {
        busID: json.bus_id, // id returned from backend
        ...payload,
      };

      setBuses((prev) => [newBus, ...prev]);
      setShowCreateBus(false);
    } catch (err: any) {
      console.error(err);
      alert(
        err?.message || JSON.stringify(err) || "Server error while adding bus"
      );
    }
  };


  // Update bus in state by busID
  const handleSaveEdit = async (busID: number, data: Partial<Bus>) => {
    try {
      await adminAPI.updateBus(busID, data);

      setBuses((prev) =>
        prev.map((b) => (b.busID === busID ? { ...b, ...data } : b))
      );
      setEditBus(null);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Server error while updating bus");
    }
  };

  const handleDeleteBus = async (busID: number) => {
    try {
      await adminAPI.deleteBus(busID);
      setBuses((prev) => prev.filter((b) => b.busID !== busID));
      setBusToDelete(null);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Server error while deleting bus");
    }
  };

  const handleViewBusTrips = async (bus: Bus) => {
    setSelectedBusForTrips(bus);
    try {
      setLoadingTrips(true);
      const trips = await adminAPI.getBusTrips(bus.busID);
      setBusTrips(trips);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to load bus trips");
      setBusTrips([]);
    } finally {
      setLoadingTrips(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Bus Management</h1>
          <p className="text-muted-foreground">
            Create and manage buses in the shuttle system
          </p>
        </div>

        <Button onClick={() => setShowCreateBus(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add New Bus
        </Button>
      </div>

      <Dialog open={showCreateBus} onOpenChange={setShowCreateBus}>
        <CreateBusForm
          onSubmit={handleAddBus} // correct prop name
          onCancel={() => setShowCreateBus(false)}
        />
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Bus List</CardTitle>
          <CardDescription>Manage and monitor registered buses</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plate Number</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {buses.map((bus) => (
                <TableRow key={bus.busID}>
                  <TableCell>{bus.plate_num}</TableCell>
                  <TableCell>{bus.model}</TableCell>
                  <TableCell>{bus.manufacturer}</TableCell>
                  <TableCell>
                    <Badge
                      variant={bus.status === "Active" ? "default" : "outline"}
                      className="cursor-pointer hover:opacity-80"
                      onClick={() => handleViewBusTrips(bus)}
                    >
                      {bus.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditBus(bus)}
                    >
                      <Edit className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setBusToDelete(bus)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editBus && (
        <EditBus
          bus={editBus}
          open={!!editBus}
          onOpenChange={(open) => !open && setEditBus(null)}
          onSave={handleSaveEdit} // handleSaveEdit(busID, data)
        />
      )}

      {busToDelete && (
        <ConfirmDeleteDialog
          open={!!busToDelete}
          title="Delete Bus"
          message={`Are you sure you want to delete bus "${busToDelete.plate_num}"?`}
          confirmLabel="Delete Bus"
          onConfirm={() => handleDeleteBus(busToDelete.busID)}
          onCancel={() => setBusToDelete(null)}
        />
      )}

      {/* Bus Trips Popup */}
      <Dialog
        open={!!selectedBusForTrips}
        onOpenChange={(open) => !open && setSelectedBusForTrips(null)}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Trips Assigned to Bus: {selectedBusForTrips?.plate_num}
            </DialogTitle>
            <DialogDescription>
              All trips assigned to this bus
            </DialogDescription>
          </DialogHeader>
          {loadingTrips ? (
            <p className="text-muted-foreground">Loading trips...</p>
          ) : busTrips.length === 0 ? (
            <p className="text-muted-foreground">
              No trips assigned to this bus.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Route</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {busTrips.map((trip: any) => (
                  <TableRow key={trip.id}>
                    <TableCell>{trip.id}</TableCell>
                    <TableCell>
                      {new Date(trip.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          trip.status === "scheduled" ||
                          trip.status === "upcoming"
                            ? "default"
                            : "outline"
                        }
                      >
                        {trip.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {trip.route?.name || trip.route_id || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
