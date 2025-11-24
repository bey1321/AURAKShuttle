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
import { adminAPI } from "../../../lib/api";
import { useState, useEffect } from "react";
import { Terminal } from "../../../data/types";
import React from "react";

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
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      date: "",
      schedule: "",
      driver: "",
      bus: "",
      startTerminal: "",
      stopTerminal: "",
      middleTerminals: [],
      startTime: "",
      endTime: "",
      type: undefined,
    },
  });

  const selectedMiddleTerminals = watch("middleTerminals") || [];

  const toggleMiddleTerminal = (terminalName: string) => {
    const current = getValues("middleTerminals") || [];
    if (current.includes(terminalName)) {
      setValue("middleTerminals", current.filter((name) => name !== terminalName));
    } else {
      setValue("middleTerminals", [...current, terminalName]);
    }
  };

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
      const startTerminal = terminals.find(
        (t) => t.terminalName === data.startTerminal
      );
      const stopTerminal = terminals.find(
        (t) => t.terminalName === data.stopTerminal
      );
      const middleTerminalIds =
        terminals
          .filter((t) => data.middleTerminals?.includes(t.terminalName))
          .map((t) => t.id) || [];

      const payload = {
        date: data.date,
        start_time: data.startTime,
        end_time: data.endTime,
        name: data.schedule || "Route",
        status: "scheduled",
        bus_id: buses.find((b) => b.plate_num === data.bus)?.id || 0,
        driver_id: drivers.find((d) => d.email === data.driver)?.id || 0,
        start_terminal_id: startTerminal?.id || 0,
        type: data.type,
        terminals: [...middleTerminalIds, ...(stopTerminal ? [stopTerminal.id] : [])],
      };

      await adminAPI.createSingleTrip(payload);
      alert("✅ Trip created successfully!");
      if (onSuccess) onSuccess();
      else onCancel();
    } catch (e: any) {
      alert(e?.message || "❌ Failed to create trip");
    }
  };

  if (loading)
    return <p className="text-center text-gray-500 py-4">Loading form data...</p>;

  return (
    <form
      onSubmit={handleSubmit(handleSubmitCreate)}
      className="space-y-4 py-4"
    >
      {/* Date */}
      <div className="space-y-2">
        <Label>Date</Label>
        <Input type="date" {...register("date")} />
        {errors.date && <p className="text-red-500 text-sm">{errors.date.message}</p>}
      </div>

      {/* Schedule */}
      <div className="space-y-2">
        <Label>Schedule</Label>
        <Input placeholder="e.g., Morning Shuttle" {...register("schedule")} />
        {errors.schedule && <p className="text-red-500 text-sm">{errors.schedule.message}</p>}
      </div>

      {/* Driver */}
      <div className="space-y-2">
        <Label>Driver</Label>
        <Controller
          control={control}
          name="driver"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value || ""}>
              <SelectTrigger>
                <SelectValue placeholder="Select driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((d) => (
                  <SelectItem key={d.id} value={d.email}>
                    {d.first_name} {d.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.driver && <p className="text-red-500 text-sm">{errors.driver.message}</p>}
      </div>

      {/* Bus */}
      <div className="space-y-2">
        <Label>Bus</Label>
        <Controller
          control={control}
          name="bus"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value || ""}>
              <SelectTrigger>
                <SelectValue placeholder="Select bus" />
              </SelectTrigger>
              <SelectContent>
                {buses.map((b) => (
                  <SelectItem key={b.id} value={b.plate_num}>
                    {b.plate_num} ({b.model || "No model"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.bus && <p className="text-red-500 text-sm">{errors.bus.message}</p>}
      </div>

      {/* Terminals */}
      <div className="flex gap-2">
        <div className="flex-1 space-y-2">
          <Label>Start Terminal</Label>
          <Controller
            control={control}
            name="startTerminal"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ""}>
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
            )}
          />
        </div>

        <div className="flex-1 space-y-2">
          <Label>Stop Terminal</Label>
          <Controller
            control={control}
            name="stopTerminal"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ""}>
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
            )}
          />
        </div>
      </div>

      {/* Middle Terminals */}
      <div className="space-y-2">
        <Label>Middle Terminals</Label>
        <div className="flex flex-wrap gap-2">
          {terminals
            .filter((t) => 
              t.terminalName !== watch("startTerminal") && 
              t.terminalName !== watch("stopTerminal")
            )
            .map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleMiddleTerminal(t.terminalName)}
                className={`px-3 py-1 rounded-lg text-sm border transition-colors ${
                  selectedMiddleTerminals.includes(t.terminalName)
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-black border-gray-300 hover:border-blue-500"
                }`}
              >
                {t.terminalName} ({t.city})
              </button>
            ))}
        </div>
        {errors.middleTerminals && (
          <p className="text-red-500 text-sm">{errors.middleTerminals.message}</p>
        )}
      </div>

      {/* Start / End Times */}
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
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value || ""}>
              <SelectTrigger>
                <SelectValue placeholder="Select trip type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="sport">Sport</SelectItem>
                <SelectItem value="Student Life Event">Student Life Event</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.type && <p className="text-red-500 text-sm">{errors.type.message}</p>}
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Create Trip
        </Button>
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
