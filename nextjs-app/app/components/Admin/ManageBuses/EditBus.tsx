"use client";

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

interface EditBusProps {
  bus: BusFormData;
  onSave: (data: BusFormData) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditBus({
  bus,
  onSave,
  open,
  onOpenChange,
}: EditBusProps) {
  const form = useForm<BusFormData>({
    resolver: zodResolver(busSchema),
    defaultValues: bus,
  });

  const handleSubmit = form.handleSubmit((data) => {
    onSave(data);
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Bus</DialogTitle>
          <DialogDescription>Modify the details of this bus</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Plate Number</Label>
            <Input {...form.register("plateNumber")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Model</Label>
              <Input {...form.register("model")} />
            </div>
            <div className="space-y-2">
              <Label>Manufacturer</Label>
              <Input {...form.register("manufacturer")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                onValueChange={(val) =>
                  form.setValue("status", val as BusFormData["status"])
                }
                defaultValue={bus.status}
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
                defaultValue={bus.assignment}
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

          <Button type="submit" className="w-full">
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
