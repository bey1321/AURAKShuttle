"use client";

import React, { useEffect, useState } from "react";
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

interface EditDriverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver: (DriverInput & { id: number }) | null;
  onEdit: (driver: DriverInput & { id: number }) => void;
}

export function EditDriver({
  open,
  onOpenChange,
  driver,
  onEdit,
}: EditDriverDialogProps) {
  const [formData, setFormData] = useState(driver);

  useEffect(() => {
    setFormData(driver || undefined);
  }, [driver, open]);

  if (!formData) return null;

  const handleSave = () => {
    try {
      const validated = driverSchema.parse(formData);
      onEdit(validated);
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
          <DialogTitle>Edit Driver</DialogTitle>
          <DialogDescription>Edit driver information below.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  status: value as DriverInput["status"],
                })
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
              value={formData.trips}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  trips: parseInt(e.target.value) || 0,
                })
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
              value={formData.rating}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  rating: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleSave}>
              Save
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
