"use client";

import React, { useEffect, useState } from "react";
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
} from "../../ui";
import { DriverInput } from "./DriverSchema";
import { AddDriver } from "./AddDriver";
import { EditDriver } from "./EditDriver";
import ConfirmDeleteDialog from "../../ConfirmDeleteDialog";

interface Driver extends DriverInput {
  id: number;
}

export function AdminManageDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [showEditDriver, setShowEditDriver] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);

  // ✅ Fetch drivers
  const fetchDrivers = async () => {
    try {
      const res = await fetch("http://localhost:8000/admin/drivers");
      const data = await res.json();
      setDrivers(data);
    } catch (err) {
      console.error("Error fetching drivers:", err);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleDeleteDriver = async (id: number) => {
    try {
      const res = await fetch(
        `http://localhost:8000/admin/delete/driver/${id}`,
        {
          method: "DELETE",
        }
      );
      if (res.ok) fetchDrivers();
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDriverToDelete(null);
    }
  };

  const filteredDrivers = drivers.filter((d) =>
    `${d.first_name} ${d.last_name}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Manage Drivers</h1>

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <Input
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-48"
        />
        <Button onClick={() => setShowAddDriver(true)}>+ Add Driver</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Drivers List</CardTitle>
          <CardDescription>View, edit, and manage drivers</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredDrivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell>{driver.first_name}</TableCell>
                  <TableCell>{driver.last_name}</TableCell>
                  <TableCell>{driver.email}</TableCell>
                  <TableCell className="flex gap-2">
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
                      onClick={() => setDriverToDelete(driver)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredDrivers.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-gray-500 py-6"
                  >
                    No drivers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modals */}
      <AddDriver
        open={showAddDriver}
        onOpenChange={setShowAddDriver}
        onAdded={fetchDrivers}
      />
      <EditDriver
        open={showEditDriver}
        onOpenChange={setShowEditDriver}
        driver={editDriver}
        onUpdated={fetchDrivers}
      />

      {driverToDelete && (
        <ConfirmDeleteDialog
          open={!!driverToDelete}
          title="Delete Driver"
          message={`Are you sure you want to delete ${driverToDelete.first_name} ${driverToDelete.last_name}?`}
          confirmLabel="Delete Driver"
          onConfirm={() => handleDeleteDriver(driverToDelete.id)}
          onCancel={() => setDriverToDelete(null)}
        />
      )}
    </div>
  );
}
