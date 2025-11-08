"use client";

import { useForm, Controller } from "react-hook-form";
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
import MultiSelect from "../../MultiSelect";
import { adminAPI } from "../../../lib/api";
import { useState, useEffect } from "react";
import { Terminal } from "../../../data/types";

interface TripFormProps {
  onCancel: () => void;
  onSuccess?: () => void;
}

export default function CreateTrip({ onCancel, onSuccess }: TripFormProps) {
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
  });

  // Fetch data from centralized admin API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [terminalsData, driversData, busesData] = await Promise.all([
          adminAPI.getTerminals(),
          adminAPI.getDrivers(),
          adminAPI.getBuses(),
        ]);
        setTerminals(terminalsData);
        setDrivers(driversData);
        setBuses(busesData);
      } catch (error) {
        console.error("Error fetching data:", error);
        alert("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmitCreate = async (data: TripFormData) => {
    try {
      // Find start and stop terminals
      const startTerminal = terminals.find(
        (t) => t.terminalName === data.startTerminal
      );
      const stopTerminal = terminals.find(
        (t) => t.terminalName === data.stopTerminal
      );

      // Map middle terminals to their IDs
      const middleTerminalIds = terminals
        .filter((t) => data.middleTerminals?.includes(t.terminalName))
        .map((t) => t.id);

      // Prepare payload for API
      const payload = {
        date: data.date,
        start_time: data.startTime,
        end_time: data.endTime,
        name: data.schedule || "Route",
        status: "scheduled", // default
        bus_id: buses.find((b) => b.plate_num === data.bus)?.id,
        driver_id: drivers.find((d) => d.email === data.driver)?.id,
        start_terminal_id: startTerminal?.id || 1,
        type: data.type,
        terminals: [
          ...(middleTerminalIds || []),
          ...(stopTerminal ? [stopTerminal.id] : []),
        ],
      };

      await adminAPI.createSingleTrip(payload);
      alert("✅ Trip created successfully!");
      if (onSuccess) {
        onSuccess();
      } else {
        onCancel();
      }
    } catch (e: any) {
      alert(e?.message || "❌ Failed to create trip");
    }
  };

  if (loading)
    return (
      <p className="text-center text-gray-500 py-4">Loading form data...</p>
    );

  return (
    <form
      onSubmit={handleSubmit(handleSubmitCreate)}
      className="space-y-4 py-4"
    >
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
        <Select
          onValueChange={(value) => setValue("driver", value)}
          defaultValue=""
        >
          <SelectTrigger>
            <SelectValue placeholder="Select driver" />
          </SelectTrigger>
          <SelectContent>
            {drivers.map((driver) => (
              <SelectItem key={driver.id} value={driver.email}>
                {driver.first_name} {driver.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.driver && (
          <p className="text-red-500 text-sm">{errors.driver.message}</p>
        )}
      </div>

      {/* Bus */}
      <div className="space-y-2">
        <Label>Bus</Label>
        <Select
          onValueChange={(value) => setValue("bus", value)}
          defaultValue=""
        >
          <SelectTrigger>
            <SelectValue placeholder="Select bus" />
          </SelectTrigger>
          <SelectContent>
            {buses.map((bus) => (
              <SelectItem key={bus.id} value={bus.plate_num}>
                {bus.plate_num} ({bus.model || "No model"})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.bus && (
          <p className="text-red-500 text-sm">{errors.bus.message}</p>
        )}
      </div>

      {/* Terminals */}
      <div className="flex gap-2">
        <div className="flex-1 space-y-2">
          <Label>Start Terminal</Label>
          <Select
            onValueChange={(value) => setValue("startTerminal", value)}
            defaultValue=""
          >
            <SelectTrigger>
              <SelectValue placeholder="Select start terminal" />
            </SelectTrigger>
            <SelectContent>
              {terminals.map((t) => (
                <SelectItem key={t.id} value={t.terminalName}>
                  {t.terminalName} ({t.city})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-2">
          <Label>Stop Terminal</Label>
          <Select
            onValueChange={(value) => setValue("stopTerminal", value)}
            defaultValue=""
          >
            <SelectTrigger>
              <SelectValue placeholder="Select stop terminal" />
            </SelectTrigger>
            <SelectContent>
              {terminals.map((t) => (
                <SelectItem key={t.id} value={t.terminalName}>
                  {t.terminalName} ({t.city})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Middle Terminals */}
      <div className="space-y-2">
        <Label>Middle Terminals</Label>
        <Controller
          control={control}
          name="middleTerminals"
          render={({ field }) => (
            <MultiSelect
              terminals={terminals.map((t) => ({
                terminal: t.terminalName,
                city: t.city,
              }))}
              field={field}
            />
          )}
        />
        {errors.middleTerminals && (
          <p className="text-red-500 text-sm">
            {errors.middleTerminals.message}
          </p>
        )}
      </div>

      {/* Times */}
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
          Create Trip
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
