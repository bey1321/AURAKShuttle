"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { busSchema, BusFormData } from "./BusSchema";
import {
  Button,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../ui";

interface CreateBusFormProps {
  onSubmit: (data: BusFormData) => void;
  onCancel: () => void;
}

export default function CreateBusForm({
  onSubmit,
  onCancel,
}: CreateBusFormProps) {
  const form = useForm<BusFormData>({
    resolver: zodResolver(busSchema),
    defaultValues: {
      plateNumber: "",
      model: "",
      manufacturer: "",
      numberOfSeats: 40,
      year: new Date().getFullYear(),
      fuelType: "Diesel",
      status: "Active",
      assignment: "Unassigned",
    },
  });

  const handleSubmit = form.handleSubmit(onSubmit);

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Add New Bus</DialogTitle>
        <DialogDescription>
          Fill in details to register a new bus
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Plate Number</Label>
          <Input {...form.register("plateNumber")} placeholder="RAK-1234" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Model</Label>
            <Input {...form.register("model")} placeholder="Sprinter 2023" />
          </div>
          <div className="space-y-2">
            <Label>Manufacturer</Label>
            <Input
              {...form.register("manufacturer")}
              placeholder="Mercedes-Benz"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Seats</Label>
            <Input
              type="number"
              {...form.register("numberOfSeats", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label>Year</Label>
            <Input
              type="number"
              {...form.register("year", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label>Fuel Type</Label>
            <Select
              onValueChange={(val) =>
                form.setValue("fuelType", val as BusFormData["fuelType"])
              }
              defaultValue="Diesel"
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Diesel">Diesel</SelectItem>
                <SelectItem value="Electric">Electric</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
                <SelectItem value="Petrol">Petrol</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              onValueChange={(val) =>
                form.setValue("status", val as BusFormData["status"])
              }
              defaultValue="Active"
            >
              <SelectTrigger>
                <SelectValue />
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
          <div className="space-y-2">
            <Label>Assignment</Label>
            <Select
              onValueChange={(val) =>
                form.setValue("assignment", val as BusFormData["assignment"])
              }
              defaultValue="Unassigned"
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Assigned">Assigned</SelectItem>
                <SelectItem value="Unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="flex-1">
            Add Bus
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}
