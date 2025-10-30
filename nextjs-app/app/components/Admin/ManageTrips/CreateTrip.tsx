// src/components/admin/forms/TripForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tripSchema, TripFormData } from "./TripSchema";
import {
  Input,
  Label,
  Button,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../../ui";

interface TripFormProps {
  onSubmit: (data: TripFormData) => void;
  defaultValues?: Partial<TripFormData>;
  onCancel: () => void;
  isEditing?: boolean;
}

export default function TripForm({
  onSubmit,
  defaultValues,
  onCancel,
  isEditing = false,
}: TripFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
      {/* Date */}
      <div className="space-y-2">
        <Label>Date</Label>
        <Input type="date" {...register("date")} />
        {errors.date && (
          <p className="text-red-500 text-sm">{errors.date.message}</p>
        )}
      </div>

      {/* Schedule */}
      <div className="space-y-2">
        <Label>Schedule</Label>
        <Input placeholder="e.g., Morning Shuttle" {...register("schedule")} />
        {errors.schedule && (
          <p className="text-red-500 text-sm">{errors.schedule.message}</p>
        )}
      </div>

      {/* Driver */}
      <div className="space-y-2">
        <Label>Driver</Label>
        <Input {...register("driver")} />
        {errors.driver && (
          <p className="text-red-500 text-sm">{errors.driver.message}</p>
        )}
      </div>

      {/* Bus */}
      <div className="space-y-2">
        <Label>Bus</Label>
        <Input {...register("bus")} />
        {errors.bus && (
          <p className="text-red-500 text-sm">{errors.bus.message}</p>
        )}
      </div>

      {/* Start & Stop Terminals */}
      <div className="flex gap-2">
        <div className="flex-1 space-y-2">
          <Label>Start Terminal</Label>
          <Input {...register("startTerminal")} />
        </div>
        <div className="flex-1 space-y-2">
          <Label>Stop Terminal</Label>
          <Input {...register("stopTerminal")} />
        </div>
      </div>

      {/* Start & End Times */}
      <div className="flex gap-2">
        <div className="flex-1 space-y-2">
          <Label>Start Time</Label>
          <Input type="time" {...register("startTime")} />
        </div>
        <div className="flex-1 space-y-2">
          <Label>End Time</Label>
          <Input type="time" {...register("endTime")} />
        </div>
      </div>

      {/* Trip Type */}
      <div className="space-y-2">
        <Label>Trip Type</Label>
        <Select
          onValueChange={(value) =>
            setValue("type", value as TripFormData["type"])
          }
          defaultValue={defaultValues?.type}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select trip type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="regular">Regular</SelectItem>
            <SelectItem value="academic">Academic</SelectItem>
            <SelectItem value="sport">Sport</SelectItem>
            <SelectItem value="Student Life Event">
              Student Life Event
            </SelectItem>
          </SelectContent>
        </Select>
        {errors.type && (
          <p className="text-red-500 text-sm">{errors.type.message}</p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          {isEditing ? "Save Changes" : "Create Trip"}
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
  );
}
