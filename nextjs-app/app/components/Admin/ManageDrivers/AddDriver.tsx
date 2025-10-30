"use client";

import React, { useState } from "react";
import {
  Dialog,
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
} from "../../ui";
import { driverSchema, DriverInput } from "./DriverSchema";
import { z } from "zod";

interface AddDriverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (driver: DriverInput) => void;
}

export function AddDriver({
  open,
  onOpenChange,
  onAdd,
}: AddDriverDialogProps) {
  const [driver, setDriver] = useState<DriverInput>({
    name: "",
    email: "",
    status: "Active",
    trips: 0,
    rating: 0,
  });

  const handleAdd = () => {
    try {
      const validated = driverSchema.parse(driver);
      onAdd(validated);
      setDriver({ name: "", email: "", status: "Active", trips: 0, rating: 0 });
      onOpenChange(false);
    } catch (err) {
      if (err instanceof z.ZodError) {
        alert(err.errors.map((e) => e.message).join("\n"));
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Driver</DialogTitle>
          <DialogDescription>Add a new driver to the system.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={driver.name}
              onChange={(e) => setDriver({ ...driver, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              value={driver.email}
              onChange={(e) => setDriver({ ...driver, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={driver.status}
              onValueChange={(value) =>
                setDriver({ ...driver, status: value as DriverInput["status"] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Trips</Label>
            <Input
              type="number"
              value={driver.trips}
              onChange={(e) =>
                setDriver({ ...driver, trips: parseInt(e.target.value) || 0 })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Rating</Label>
            <Input
              type="number"
              step="0.1"
              min={0}
              max={5}
              value={driver.rating}
              onChange={(e) =>
                setDriver({
                  ...driver,
                  rating: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleAdd}>
              Add
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
