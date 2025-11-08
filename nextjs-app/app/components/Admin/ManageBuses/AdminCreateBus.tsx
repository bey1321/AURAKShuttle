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
} from "../../ui";
import { Bus } from "../../../data/types";
import CreateBusForm from "./CreateBusForm";
import EditBus from "./EditBus";
import ConfirmDeleteDialog from "../../ConfirmDeleteDialog";
import { BusFormData } from "./BusSchema";

export default function AdminCreateBus() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [showCreateBus, setShowCreateBus] = useState(false);
  const [editBus, setEditBus] = useState<Bus | null>(null);
  const [busToDelete, setBusToDelete] = useState<Bus | null>(null);

  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Fetch buses from backend on mount
  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const res = await fetch(`${base}/admin/bus`);
        const data = await res.json();
        if (!res.ok) {
          alert(data.detail || "Failed to fetch buses");
          return;
        }

        const mappedBuses: Bus[] = data.map((b: any) => ({
          busID: b.id,
          plate_num: b.plate_num,
          model: b.model,
          manufacturer: b.manufacturer,
          no_seats: b.no_seats,
          status: b.status,
        }));

        setBuses(mappedBuses);
      } catch (err) {
        console.error(err);
        alert("Server error while fetching buses");
      }
    };

    fetchBuses();
  }, [base]);

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

      const res = await fetch(`${base}/admin/create/bus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.detail || "Failed to create bus");
      }

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
      const res = await fetch(`${base}/admin/update/bus/${busID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.detail || json.message || "Failed to update bus");
      }

      setBuses((prev) =>
        prev.map((b) => (b.busID === busID ? { ...b, ...data } : b))
      );
      setEditBus(null);
    } catch (err) {
      console.error(err);
      alert((err as any).message || "Server error while updating bus");
    }
  };

  const handleDeleteBus = async (busID: number) => {
    try {
      const res = await fetch(`${base}/admin/delete/bus/${busID}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.detail || json.message || "Failed to delete bus");
      }
      setBuses((prev) => prev.filter((b) => b.busID !== busID));
      setBusToDelete(null);
    } catch (err) {
      console.error(err);
      alert((err as any).message || "Server error while deleting bus");
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
    </div>
  );
}
