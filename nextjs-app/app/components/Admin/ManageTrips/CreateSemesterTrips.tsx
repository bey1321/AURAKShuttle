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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../ui";
import { useEffect, useState } from "react";
import { adminAPI } from "../../../lib/api";

// --- Updated Zod Schema ---
const semesterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  start_date: z.string().min(1, "Start date is required"), // YYYY-MM-DD
  end_date: z.string().min(1, "End date is required"),
  days_of_week: z.array(z.string()).min(1, "Select at least one day"),
  start_time: z.string().min(1, "Start time is required"), // HH:mm
  end_time: z.string().min(1, "End time is required"),
  type: z.enum(["regular", "academic", "sport", "student_life_event"]),
  bus_id: z.number().nullable().optional(),
  driver_id: z.number().nullable().optional(),
  start_terminal_id: z.number().min(1, "Select a start terminal"),
  terminals: z.array(z.number()).min(1, "Select at least one terminal"),
});

type SemesterForm = z.infer<typeof semesterSchema>;

const semesterDefaultValues: SemesterForm = {
  name: "",
  start_date: "",
  end_date: "",
  days_of_week: [],
  start_time: "",
  end_time: "",
  type: "regular",
  bus_id: null,
  driver_id: null,
  start_terminal_id: 0,
  terminals: [],
};

export default function CreateSemesterTrips({
  onCancel,
  editingRoute,
  onSuccess,
}: {
  onCancel: () => void;
  editingRoute?: any;
  onSuccess?: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SemesterForm>({
    resolver: zodResolver(semesterSchema),
    defaultValues: semesterDefaultValues,
  });

  const [terminals, setTerminals] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Dialog states
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");

  const daysOfWeek = watch("days_of_week");
  const selectedTerminals = watch("terminals");

  // Load buses, drivers, terminals
  useEffect(() => {
    (async () => {
      try {
        const [t, b, d] = await Promise.all([
          adminAPI.getTerminals(),
          adminAPI.getBuses(),
          adminAPI.getDrivers(),
        ]);
        setTerminals(t);
        setBuses(b);
        setDrivers(d);
      } catch (err) {
        console.error("Failed to load buses, drivers, or terminals", err);
      }
    })();
  }, []);

  useEffect(() => {
    if (!editingRoute) {
      reset(semesterDefaultValues);
      return;
    }

    const route = editingRoute;

    const normalizeDate = (dateValue: string | null | undefined) => {
      if (!dateValue) return "";
      return dateValue.includes("T") ? dateValue.split("T")[0] : dateValue;
    };

    const normalizeTime = (timeValue: string | null | undefined) => {
      if (!timeValue) return "";
      return timeValue.length > 5 ? timeValue.slice(0, 5) : timeValue;
    };

    const normalizeDays = (days: any): string[] => {
      if (Array.isArray(days)) return days;
      if (typeof days === "string" && days.trim().length > 0) {
        try {
          const parsed = JSON.parse(days);
          if (Array.isArray(parsed)) return parsed;
        } catch {
          return days
            .split(",")
            .map((d: string) => d.trim())
            .filter(Boolean);
        }
      }
      return [];
    };

    const terminalIds =
      route.terminals
        ?.map((tt: any) => {
          if (typeof tt === "number") return tt;
          return tt.terminal_id || tt.terminal?.id || tt.id || null;
        })
        .filter((id: number | null): id is number => typeof id === "number") ||
      [];

    reset({
      ...semesterDefaultValues,
      name: route.name || "",
      type: route.type || "regular",
      start_time: normalizeTime(route.start_time),
      end_time: normalizeTime(route.end_time),
      days_of_week: normalizeDays(route.days_of_week),
      start_terminal_id:
        route.start_terminal_id ||
        route.start_terminal?.id ||
        semesterDefaultValues.start_terminal_id,
      terminals: terminalIds,
      start_date: normalizeDate(route.start_date),
      end_date: normalizeDate(route.end_date),
      bus_id: route.bus_id ?? null,
      driver_id: route.driver_id ?? null,
    });
  }, [editingRoute, reset]);

  // --- Submit Handler ---
  const submit = async (data: SemesterForm) => {
    setSubmitting(true);
    try {
      const payload = {
        name: data.name,
        start_date: data.start_date,
        end_date: data.end_date,
        days_of_week: data.days_of_week,
        start_time: data.start_time,
        end_time: data.end_time,
        type: data.type,
        bus_id: data.bus_id ?? undefined,
        driver_id: data.driver_id ?? undefined,
        start_terminal_id: data.start_terminal_id,
        terminals: data.terminals,
      };

      if (editingRoute) {
        await adminAPI.updateSemesterTrip(editingRoute.id, payload);
        setDialogMessage("Semester route updated successfully!");
      } else {
        await adminAPI.createSemesterTrips(payload);
        setDialogMessage("Semester trips created successfully!");
      }

      setShowSuccessDialog(true);
    } catch (e: any) {
      setDialogMessage(
        e?.message ||
          `Failed to ${editingRoute ? "update" : "create"} semester trips`
      );
      setShowErrorDialog(true);
    } finally {
      setSubmitting(false);
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
          <Label>Start Date {editingRoute && "(for regenerating trips)"}</Label>
          <Input type="date" {...register("start_date")} />
          {errors.start_date && (
            <p className="text-sm text-red-500">{errors.start_date.message}</p>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <Label>End Date {editingRoute && "(for regenerating trips)"}</Label>
          <Input type="date" {...register("end_date")} />
          {errors.end_date && (
            <p className="text-sm text-red-500">{errors.end_date.message}</p>
          )}
        </div>
      </div>
      {editingRoute && (
        <p className="text-xs text-muted-foreground">
          Note: Updating the route will regenerate trips for the specified date
          range. Completed trips will be preserved.
        </p>
      )}

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
                <SelectItem value="student_life_event">
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
                  <SelectItem key={b.id} value={b.id.toString()}>
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
                  <SelectItem key={d.id} value={d.id.toString()}>
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

      {/* Start Terminal */}
      <div className="space-y-2">
        <Label>Start Terminal</Label>
        <Controller
          control={control}
          name="start_terminal_id"
          render={({ field }) => (
            <Select
              onValueChange={(v) => field.onChange(Number(v))}
              value={field.value?.toString() ?? ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Start Terminal" />
              </SelectTrigger>
              <SelectContent>
                {terminals.map((t) => (
                  <SelectItem key={t.id} value={t.id.toString()}>
                    {t.terminalName || t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.start_terminal_id && (
          <p className="text-sm text-red-500">
            {errors.start_terminal_id.message}
          </p>
        )}
      </div>

      {/* Terminals */}
      <div className="space-y-2">
        <Label>Terminals (including start terminal)</Label>
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
        <Button type="submit" className="flex-1" disabled={submitting}>
          {submitting
            ? editingRoute
              ? "Updating..."
              : "Creating..."
            : editingRoute
            ? "Update Route"
            : "Create Semester Trips"}
        </Button>
        <Button
          type="button"
          className="flex-1"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={(open) => {
        setShowSuccessDialog(open);
        if (!open) {
          onSuccess?.();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Success</DialogTitle>
            <DialogDescription>{dialogMessage}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => {
              setShowSuccessDialog(false);
              onSuccess?.();
            }}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>{dialogMessage}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button variant="destructive" onClick={() => setShowErrorDialog(false)}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}
