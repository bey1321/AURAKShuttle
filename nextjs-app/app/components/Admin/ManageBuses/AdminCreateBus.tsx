"use client";

import { useState } from "react";
import { Plus, Edit } from "lucide-react";
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
  DialogTrigger,
} from "../../ui";
import { buses as initialBuses } from "../../../data/database";
import { Bus } from "../../../data/types";
import CreateBusForm from "./CreateBusForm";
import EditBus from "./EditBus";

export default function AdminCreateBus() {
  const [buses, setBuses] = useState<Bus[]>(initialBuses);
  const [showCreateBus, setShowCreateBus] = useState(false);
  const [editBus, setEditBus] = useState<Bus | null>(null);

  const handleAddBus = (data: Omit<Bus, "busID">) => {
    const newBus = { ...data, busID: buses.length + 1 };
    setBuses([...buses, newBus]);
    setShowCreateBus(false);
  };

  const handleSaveEdit = (data: Bus) => {
    setBuses(buses.map((b) => (b.busID === data.busID ? data : b)));
    setEditBus(null);
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
        <Dialog open={showCreateBus} onOpenChange={setShowCreateBus}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add New Bus
            </Button>
          </DialogTrigger>
          <CreateBusForm
            onSubmit={handleAddBus}
            onCancel={() => setShowCreateBus(false)}
          />
        </Dialog>
      </div>

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
                <TableHead>Assignment</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buses.map((bus) => (
                <TableRow key={bus.busID}>
                  <TableCell>{bus.plateNumber}</TableCell>
                  <TableCell>{bus.model}</TableCell>
                  <TableCell>{bus.manufacturer}</TableCell>
                  <TableCell>
                    <Badge
                      variant={bus.status === "Active" ? "default" : "outline"}
                    >
                      {bus.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        bus.assignment === "Assigned" ? "default" : "outline"
                      }
                    >
                      {bus.assignment}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditBus(bus)}
                    >
                      <Edit className="w-4 h-4 mr-1" /> Edit
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
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
