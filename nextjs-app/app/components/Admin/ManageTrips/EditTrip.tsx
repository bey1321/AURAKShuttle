"use client";

import React, { useState, useEffect } from "react";
import { Trip, Terminal } from "../../../data/types";
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
import MultiSelect from "../../MultiSelect";
import { getTerminals } from "../../../data/database";

interface TripFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    tripData: Omit<Trip, "id" | "passengers" | "status" | "ETA">
  ) => void;
  editingTrip: Trip | null;
}

export function EditTrip({
  open,
  onOpenChange,
  onSave,
  editingTrip,
}: TripFormDialogProps) {
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [loadingTerminals, setLoadingTerminals] = useState(true);
  const [tripData, setTripData] = useState<
    Omit<Trip, "id" | "passengers" | "status" | "ETA">
  >({
    date: "",
    schedule: "",
    driver: "",
    bus: "",
    startTerminal: "",
    middleTerminals: [],
    stopTerminal: "",
    startTime: "",
    endTime: "",
    type: "regular",
  });

  // Fetch terminals on mount
  useEffect(() => {
    const fetchTerminals = async () => {
      try {
        setLoadingTerminals(true);
        const data = await getTerminals();
        setTerminals(data);
      } catch (error) {
        console.error("Error fetching terminals:", error);
        alert("Failed to load terminals. Please try again.");
      } finally {
        setLoadingTerminals(false);
      }
    };
    fetchTerminals();
  }, []);

  useEffect(() => {
    if (editingTrip) {
      const {
        date,
        schedule,
        driver,
        bus,
        startTerminal,
        stopTerminal,
        startTime,
        endTime,
        type,
      } = editingTrip;
      setTripData({
        date,
        schedule,
        driver,
        bus,
        startTerminal,
        middleTerminals: editingTrip.middleTerminals ?? [],
        stopTerminal,
        startTime,
        endTime,
        type,
      });
    } else {
      setTripData({
        date: "",
        schedule: "",
        driver: "",
        bus: "",
        startTerminal: "",
        middleTerminals: [],
        stopTerminal: "",
        startTime: "",
        endTime: "",
        type: "regular",
      });
    }
  }, [editingTrip, open]);

  const handleSave = () => {
    const {
      date,
      schedule,
      driver,
      bus,
      startTerminal,
      stopTerminal,
      startTime,
      endTime,
    } = tripData;
    if (
      !date ||
      !schedule ||
      !driver ||
      !bus ||
      !startTerminal ||
      !stopTerminal ||
      !startTime ||
      !endTime
    ) {
      alert("Please fill all fields.");
      return;
    }
    onSave(tripData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingTrip ? "Edit Trip" : "Create New Trip"}
          </DialogTitle>
          <DialogDescription>
            {editingTrip
              ? "Modify trip details below."
              : "Add a new shuttle trip to the schedule."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={tripData.date}
              onChange={(e) =>
                setTripData({ ...tripData, date: e.target.value })
              }
            />
          </div>

          {/* Schedule */}
          <div className="space-y-2">
            <Label>Schedule</Label>
            <Input
              placeholder="e.g., Morning Shuttle"
              value={tripData.schedule}
              onChange={(e) =>
                setTripData({ ...tripData, schedule: e.target.value })
              }
            />
          </div>

          {/* Driver */}
          <div className="space-y-2">
            <Label>Driver</Label>
            <Input
              value={tripData.driver}
              onChange={(e) =>
                setTripData({ ...tripData, driver: e.target.value })
              }
            />
          </div>

          {/* Bus */}
          <div className="space-y-2">
            <Label>Bus</Label>
            <Input
              value={tripData.bus}
              onChange={(e) =>
                setTripData({ ...tripData, bus: e.target.value })
              }
            />
          </div>

          {/* Start Terminal */}
          <div className="space-y-2">
            <Label>Start Terminal</Label>
            <Input
              value={tripData.startTerminal}
              onChange={(e) =>
                setTripData({ ...tripData, startTerminal: e.target.value })
              }
            />
          </div>

          {/* Middle Terminals */}
          <div className="space-y-2">
            <Label>Middle Terminals</Label>
            {loadingTerminals ? (
              <p className="text-sm text-muted-foreground">
                Loading terminals...
              </p>
            ) : (
              <MultiSelect
                terminals={terminals.map((t) => ({
                  terminal: t.terminalName || t.terminal || "",
                  city: t.city || "",
                }))}
                field={{
                  value: tripData.middleTerminals,
                  onChange: (val: string[]) =>
                    setTripData({ ...tripData, middleTerminals: val }),
                }}
              />
            )}
          </div>

          {/* Stop Terminal */}
          <div className="space-y-2">
            <Label>Stop Terminal</Label>
            <Input
              value={tripData.stopTerminal}
              onChange={(e) =>
                setTripData({ ...tripData, stopTerminal: e.target.value })
              }
            />
          </div>

          {/* Start & End Times */}
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={tripData.startTime}
                onChange={(e) =>
                  setTripData({ ...tripData, startTime: e.target.value })
                }
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={tripData.endTime}
                onChange={(e) =>
                  setTripData({ ...tripData, endTime: e.target.value })
                }
              />
            </div>
          </div>

          {/* Trip Type */}
          <div className="space-y-2">
            <Label>Trip Type</Label>
            <Select
              value={tripData.type}
              onValueChange={(value) =>
                setTripData({ ...tripData, type: value as Trip["type"] })
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
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleSave}>
              {editingTrip ? "Save Changes" : "Create Trip"}
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
