"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { busSchema, BusFormData } from "./BusSchema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../ui";
import { Bus } from "../../../data/types";

interface EditBusProps {
  bus: Bus; // expects bus.busID present
  onSave?: (busID: number, updatedData: Partial<BusFormData>) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditBus({
  bus,
  onSave,
  open,
  onOpenChange,
}: EditBusProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<BusFormData>({
    resolver: zodResolver(busSchema),
    defaultValues: {
      plate_num: bus.plate_num,
      model: bus.model,
      manufacturer: bus.manufacturer,
      no_seats: bus.no_seats,
      status: bus.status,
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    setLoading(true);
    setError(null);

    const updatedData: Partial<BusFormData> = {};
    (Object.keys(data) as Array<keyof BusFormData>).forEach((key) => {
      if (data[key] !== (bus as any)[key]) {
        (updatedData as any)[key] = data[key];
      }
    });

    if (Object.keys(updatedData).length === 0) {
      setError("No changes detected.");
      setLoading(false);
      return;
    }

    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${base}/admin/update/bus/${bus.busID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      const json = await res.json();
      if (!res.ok)
        throw new Error(json.detail || json.message || "Failed to update bus");

      // notify parent (pass busID so parent can update state)
      if (onSave) onSave(bus.busID, updatedData);
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Server error while updating bus");
    } finally {
      setLoading(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Bus</DialogTitle>
          <DialogDescription>
            Update this bus’s details. Only changed fields will be saved.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Plate Number</Label>
            <Input {...form.register("plate_num")} />
            {form.formState.errors.plate_num && (
              <p className="text-sm text-red-500">
                {form.formState.errors.plate_num.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Model</Label>
              <Input {...form.register("model")} />
              {form.formState.errors.model && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.model.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Manufacturer</Label>
              <Input {...form.register("manufacturer")} />
              {form.formState.errors.manufacturer && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.manufacturer.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Number of Seats</Label>
            <Input
              type="number"
              {...form.register("no_seats", { valueAsNumber: true })}
            />
            {form.formState.errors.no_seats && (
              <p className="text-sm text-red-500">
                {form.formState.errors.no_seats.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              onValueChange={(val) => form.setValue("status", val as any)}
              defaultValue={bus.status}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="UnderMaintenance">
                  Under Maintenance
                </SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
