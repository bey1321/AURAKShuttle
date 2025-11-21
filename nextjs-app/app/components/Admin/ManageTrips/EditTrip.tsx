"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../ui/dialog";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../ui/select";
import { Button } from "../../ui/button";
import { adminAPI } from "../../../lib/api";

interface TripFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTrip: any | null;
  onSuccess?: () => void;
}

const createDefaultTripState = () => ({
  date: "",
  startTime: "",
  endTime: "",
  driver: "",
  bus: "",
  name: "",
  type: "regular",
  startTerminal: "",
  middleTerminals: [] as string[],
  status: "scheduled",
});

export function EditTrip({
  open,
  onOpenChange,
  editingTrip,
  onSuccess,
}: TripFormDialogProps) {
  // ---------------- STATES ----------------
  const [tripData, setTripData] = useState(createDefaultTripState());

  const [drivers, setDrivers] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [terminals, setTerminals] = useState<any[]>([]);

  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [loadingBuses, setLoadingBuses] = useState(true);
  const [loadingTerminals, setLoadingTerminals] = useState(true);

  const [errors, setErrors] = useState<string[]>([]);

  // ---------------- FETCH DATA ----------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingDrivers(true);
        setLoadingBuses(true);
        setLoadingTerminals(true);

        const [driversRes, busesRes, terminalsRes] = await Promise.all([
          adminAPI.getDrivers(),
          adminAPI.getBuses(),
          adminAPI.getTerminals(),
        ]);

        setDrivers(driversRes || []);
        setBuses(busesRes || []);
        setTerminals(terminalsRes || []);
      } catch (err) {
        console.error("Failed to fetch dropdown data:", err);
      } finally {
        setLoadingDrivers(false);
        setLoadingBuses(false);
        setLoadingTerminals(false);
      }
    };

    fetchData();
  }, []);

  // ---------------- PREFILL EDIT DATA ----------------
  useEffect(() => {
    if (!editingTrip) {
      setTripData(createDefaultTripState());
      return;
    }

    const route = editingTrip.route || {};
    const normalizeDate = (dateValue: string | null | undefined) => {
      if (!dateValue) return "";
      return dateValue.includes("T") ? dateValue.split("T")[0] : dateValue;
    };

    const resolveStartTerminalId =
      editingTrip.start_terminal_id ||
      route.start_terminal_id ||
      route.start_terminal?.id ||
      "";

    const startTerminalName =
      route.start_terminal?.terminalName ||
      editingTrip.start_terminal?.terminalName ||
      "";

    const collectTerminalNames = () => {
      const routeTerminals = Array.isArray(route.terminals)
        ? route.terminals
        : Array.isArray(editingTrip.terminals)
        ? editingTrip.terminals
        : [];

      return routeTerminals
        .map(
          (t: any) =>
            t?.terminal?.terminalName || t?.terminalName || t?.name || ""
        )
        .filter((name: string) => !!name && name !== startTerminalName);
    };

    setTripData({
      date: normalizeDate(editingTrip.date),
      startTime: editingTrip.start_time || route.start_time || "",
      endTime: editingTrip.end_time || route.end_time || "",
      driver: editingTrip.driver_id
        ? editingTrip.driver_id.toString()
        : route.driver_id
        ? route.driver_id.toString()
        : "",
      bus: editingTrip.bus_id
        ? editingTrip.bus_id.toString()
        : route.bus_id
        ? route.bus_id.toString()
        : "",
      name: editingTrip.name || route.name || "",
      type: editingTrip.type || route.type || "regular",
      startTerminal: resolveStartTerminalId
        ? resolveStartTerminalId.toString()
        : "",
      middleTerminals: collectTerminalNames(),
      status: editingTrip.status || "scheduled",
    });
  }, [editingTrip, open]);

  // ---------------- HANDLE CHANGE ----------------
  const handleChange = (field: string, value: any) => {
    setTripData((prev) => ({ ...prev, [field]: value }));
  };

  // ---------------- VALIDATION ----------------
  const validate = () => {
    const errs: string[] = [];
    if (!tripData.date) errs.push("Date is required");
    if (!tripData.driver) errs.push("Driver is required");
    if (!tripData.bus) errs.push("Bus is required");
    return errs;
  };

  // ---------------- SAVE TRIP ----------------
  const handleSave = async () => {
    const validationErrors = validate();
    setErrors(validationErrors);
    if (validationErrors.length > 0) return;

    if (!editingTrip) return;

    const payload: {
      id: number;
      date?: string;
      status?: string;
      driver_id?: number;
      bus_id?: number;
    } = {
      id: editingTrip.id,
    };

    if (tripData.date) payload.date = tripData.date;
    if (tripData.status) payload.status = tripData.status;
    if (tripData.driver) payload.driver_id = Number(tripData.driver);
    if (tripData.bus) payload.bus_id = Number(tripData.bus);

    try {
      await adminAPI.updateSingleTrip(editingTrip.id, payload);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      console.error("Trip update error:", err);
      setErrors([err.message || "Failed to update trip"]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingTrip ? "Edit Trip" : "Create Trip"}</DialogTitle>
          <DialogDescription>
            {editingTrip
              ? "Modify trip details below."
              : "Add a new shuttle trip to the schedule."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {errors.length > 0 && (
            <div className="text-red-500">
              {errors.map((err, i) => (
                <div key={i}>{err}</div>
              ))}
            </div>
          )}

          {/* DATE */}
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={tripData.date}
              onChange={(e) => handleChange("date", e.target.value)}
            />
          </div>

          {/* START TIME */}
          <div>
            <Label>Start Time</Label>
            <Input type="time" value={tripData.startTime} disabled readOnly />
            <p className="text-xs text-muted-foreground">
              Start time is part of the route and can only be changed when
              editing the semester route definition.
            </p>
          </div>

          {/* END TIME */}
          <div>
            <Label>End Time</Label>
            <Input type="time" value={tripData.endTime} disabled readOnly />
          </div>

          {/* DRIVER */}
          <div>
            <Label>Driver</Label>
            {loadingDrivers ? (
              <div>Loading...</div>
            ) : (
              <Select
                value={tripData.driver}
                onValueChange={(val) => handleChange("driver", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>
                      {`${d.first_name || ""} ${d.last_name || ""}`.trim() ||
                        d.email ||
                        `Driver ${d.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* BUS */}
          <div>
            <Label>Bus</Label>
            {loadingBuses ? (
              <div>Loading...</div>
            ) : (
              <Select
                value={tripData.bus}
                onValueChange={(val) => handleChange("bus", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Bus" />
                </SelectTrigger>
                <SelectContent>
                  {buses.map((b) => (
                    <SelectItem key={b.id} value={b.id.toString()}>
                      {b.plate_num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* STATUS */}
          <div>
            <Label>Status</Label>
            <Select
              value={tripData.status}
              onValueChange={(val) => handleChange("status", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* START TERMINAL */}
          <div>
            <Label>Start Terminal</Label>
            {loadingTerminals ? (
              <div>Loading...</div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {terminals.find(
                  (t) => t.id.toString() === tripData.startTerminal
                )?.terminalName ||
                  editingTrip?.route?.start_terminal?.terminalName ||
                  "—"}
              </p>
            )}
          </div>

          {/* MIDDLE TERMINALS */}
          <div>
            <Label>Middle Terminals</Label>
            <p className="text-sm text-muted-foreground">
              {tripData.middleTerminals.length > 0
                ? tripData.middleTerminals.join(", ")
                : "—"}
            </p>
          </div>

          {/* TRIP NAME */}
          <div>
            <Label>Trip Name</Label>
            <p className="text-sm text-muted-foreground">
              {tripData.name || editingTrip?.route?.name || "—"}
            </p>
          </div>

          {/* TRIP TYPE */}
          <div>
            <Label>Trip Type</Label>
            <p className="text-sm text-muted-foreground capitalize">
              {(tripData.type || "regular").replace(/_/g, " ")}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
