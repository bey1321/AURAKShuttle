"use client";

import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Label,
  Input,
  Button,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../../ui";
import { useEffect, useState } from "react";
import { adminAPI } from "../../../lib/api";

const semesterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  days_of_week: z.array(z.string()).min(1, "Select at least one day"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  type: z.string().min(1, "Type is required"),
  bus_id: z.number().min(1, "Select a bus"),
  driver_id: z.number().min(1, "Select a driver"),
  terminals: z.array(z.number()).min(1, "Select at least one terminal"),
});

type SemesterForm = z.infer<typeof semesterSchema>;

export default function CreateSemesterTrips({
  onCancel,
}: {
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SemesterForm>({
    resolver: zodResolver(semesterSchema),
    defaultValues: {
      days_of_week: [],
      type: "regular",
      terminals: [],
    },
  });

  const [terminals, setTerminals] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const daysOfWeek = watch("days_of_week");
  const selectedTerminals = watch("terminals");

  useEffect(() => {
    (async () => {
      try {
        const t = await adminAPI.getTerminals();
        setTerminals(t);

        const b = await adminAPI.getBuses();
        setBuses(b);

        const d = await adminAPI.getDrivers();
        setDrivers(d);
      } catch (err) {
        console.error("Failed to load buses, drivers, or terminals", err);
      }
    })();
  }, []);

  const submit = async (data: SemesterForm) => {
    try {
      const payload = {
        ...data,
        start_terminal_id: data.terminals[0], // first terminal as start
        terminals: data.terminals, // keep as array of numbers
      };
      await adminAPI.createSemesterTrips(payload);
      alert("✅ Semester trips created successfully!");
      onCancel();
    } catch (e: any) {
      alert(e?.message || "❌ Failed to create semester trips");
    }
  };

  const addDay = (day: string) => {
    const current = watch("days_of_week");
    if (!current.includes(day)) setValue("days_of_week", [...current, day]);
  };

  const removeDay = (day: string) => {
    setValue(
      "days_of_week",
      watch("days_of_week").filter((d) => d !== day)
    );
  };

  const toggleTerminal = (id: number) => {
    const current = watch("terminals");
    if (current.includes(id)) {
      setValue(
        "terminals",
        current.filter((t) => t !== id)
      );
    } else {
      setValue("terminals", [...current, id]);
    }
  };

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4 py-4">
      {/* Name */}
      <div className="space-y-2">
        <Label>Name</Label>
        <Input {...register("name")} />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Dates */}
      <div className="flex gap-2">
        <div className="flex-1 space-y-2">
          <Label>Start Date</Label>
          <Input type="date" {...register("start_date")} />
          {errors.start_date && (
            <p className="text-sm text-red-500">{errors.start_date.message}</p>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <Label>End Date</Label>
          <Input type="date" {...register("end_date")} />
          {errors.end_date && (
            <p className="text-sm text-red-500">{errors.end_date.message}</p>
          )}
        </div>
      </div>

      {/* Days of Week */}
      <div className="space-y-2">
        <Label>Days of Week</Label>
        <Controller
          control={control}
          name="days_of_week"
          render={() => (
            <Select onValueChange={(v) => addDay(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Add day" />
              </SelectTrigger>
              <SelectContent>
                {days.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.days_of_week && (
          <p className="text-sm text-red-500">{errors.days_of_week.message}</p>
        )}
        <div className="flex flex-wrap gap-2 mt-2">
          {daysOfWeek.map((day) => (
            <span
              key={day}
              className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-sm flex items-center gap-1"
            >
              {day}
              <button
                type="button"
                onClick={() => removeDay(day)}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Time */}
      <div className="flex gap-2">
        <div className="flex-1 space-y-2">
          <Label>Start Time</Label>
          <Input type="time" {...register("start_time")} />
          {errors.start_time && (
            <p className="text-sm text-red-500">{errors.start_time.message}</p>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <Label>End Time</Label>
          <Input type="time" {...register("end_time")} />
          {errors.end_time && (
            <p className="text-sm text-red-500">{errors.end_time.message}</p>
          )}
        </div>
      </div>

      {/* Type */}
      <div className="space-y-2">
        <Label>Type</Label>
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
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
          )}
        />
        {errors.type && (
          <p className="text-sm text-red-500">{errors.type.message}</p>
        )}
      </div>

      {/* Bus */}
      <div className="space-y-2">
        <Label>Bus</Label>
        <Controller
          control={control}
          name="bus_id"
          render={({ field }) => (
            <Select
              onValueChange={(v) => field.onChange(Number(v))}
              value={field.value?.toString() ?? ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Bus" />
              </SelectTrigger>
              <SelectContent>
                {buses.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.plate_num || b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.bus_id && (
          <p className="text-sm text-red-500">{errors.bus_id.message}</p>
        )}
      </div>

      {/* Driver */}
      <div className="space-y-2">
        <Label>Driver</Label>
        <Controller
          control={control}
          name="driver_id"
          render={({ field }) => (
            <Select
              onValueChange={(v) => field.onChange(Number(v))}
              value={field.value?.toString() ?? ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.first_name} {d.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.driver_id && (
          <p className="text-sm text-red-500">{errors.driver_id.message}</p>
        )}
      </div>

      {/* Terminals */}
      <div className="space-y-2">
        <Label>Terminals</Label>
        <div className="flex flex-wrap gap-2">
          {terminals.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => toggleTerminal(t.id)}
              className={`px-3 py-1 rounded-lg text-sm border ${
                selectedTerminals.includes(t.id)
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white text-black border-gray-300"
              }`}
            >
              {t.terminalName || t.name}
            </button>
          ))}
        </div>
        {errors.terminals && (
          <p className="text-sm text-red-500">{errors.terminals.message}</p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          Create Semester Trips
        </Button>
        <Button
          type="button"
          className="flex-1"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
