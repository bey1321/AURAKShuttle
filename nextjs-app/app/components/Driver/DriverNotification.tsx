"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Label,
  Textarea,
} from "../ui";
import { Send, Bell, CheckCircle2, AlertCircle } from "lucide-react";
import { driverAPI } from "../../lib/api";

interface Trip {
  id: number;
  date: string;
  status: string;
  route?: {
    name: string;
    type: string;
    start_time?: string;
    end_time?: string;
  };
  bus?: {
    plate_num: string;
    model: string;
  };
}

interface DriverNotificationProps {
  trips: Trip[];
}

const MESSAGE_TEMPLATES = [
  {
    type: "arriving_10_min" as const,
    label: "Arriving in 10 minutes",
    preview: "Your shuttle will arrive in approximately 10 minutes. Please be ready at the pickup point.",
  },
  {
    type: "departing_3_min" as const,
    label: "Departing in 3 minutes",
    preview: "The shuttle will depart in 3 minutes. Please board immediately.",
  },
  {
    type: "running_late" as const,
    label: "Running late",
    preview: "The shuttle is running late due to unforeseen circumstances. We apologize for the inconvenience.",
  },
  {
    type: "custom" as const,
    label: "Custom message",
    preview: "Write your own message to students",
  },
];

export function DriverNotification({ trips }: DriverNotificationProps) {
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [selectedMessageType, setSelectedMessageType] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    recipients?: number;
  } | null>(null);

  // Filter trips to only show today's and upcoming trips
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const availableTrips = trips.filter((trip) => {
    const tripDate = new Date(trip.date);
    tripDate.setHours(0, 0, 0, 0);
    return tripDate >= today && trip.status !== "completed";
  });

  const selectedTrip = availableTrips.find((t) => t.id === selectedTripId);
  const selectedTemplate = MESSAGE_TEMPLATES.find((t) => t.type === selectedMessageType);

  const handleSendNotification = async () => {
    if (!selectedTripId || !selectedMessageType) {
      setResult({
        success: false,
        message: "Please select a trip and message type",
      });
      return;
    }

    if (selectedMessageType === "custom" && !customMessage.trim()) {
      setResult({
        success: false,
        message: "Please enter a custom message",
      });
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const response = await driverAPI.sendNotification({
        trip_id: selectedTripId,
        message_type: selectedMessageType as any,
        custom_message: selectedMessageType === "custom" ? customMessage : undefined,
      });

      setResult({
        success: true,
        message: `Notification sent successfully to ${response.recipients_count} student(s)`,
        recipients: response.recipients_count,
      });

      // Reset form after successful send
      setTimeout(() => {
        setSelectedTripId(null);
        setSelectedMessageType(null);
        setCustomMessage("");
        setResult(null);
      }, 5000);
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "Failed to send notification",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Send Notification
        </CardTitle>
        <CardDescription>
          Send SMS notifications to students registered for your trips
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trip Selection */}
        <div className="space-y-2">
          <Label htmlFor="trip-select">Select Trip</Label>
          <select
            id="trip-select"
            className="w-full p-2 border border-border rounded-md bg-background"
            value={selectedTripId || ""}
            onChange={(e) => setSelectedTripId(Number(e.target.value) || null)}
          >
            <option value="">-- Select a trip --</option>
            {availableTrips.map((trip) => (
              <option key={trip.id} value={trip.id}>
                {trip.route?.name || "Unknown Route"} - {new Date(trip.date).toLocaleDateString()}
                {trip.route?.start_time && ` (${trip.route.start_time})`}
              </option>
            ))}
          </select>
          {availableTrips.length === 0 && (
            <p className="text-sm text-muted-foreground">No upcoming trips available</p>
          )}
        </div>

        {/* Message Type Selection */}
        {selectedTripId && (
          <div className="space-y-2">
            <Label>Select Message Type</Label>
            <div className="space-y-2">
              {MESSAGE_TEMPLATES.map((template) => (
                <button
                  key={template.type}
                  onClick={() => setSelectedMessageType(template.type)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedMessageType === template.type
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-medium">{template.label}</div>
                  <div className="text-sm text-muted-foreground mt-1">{template.preview}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Message Input */}
        {selectedMessageType === "custom" && (
          <div className="space-y-2">
            <Label htmlFor="custom-message">Custom Message</Label>
            <Textarea
              id="custom-message"
              placeholder="Enter your custom message to students..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {customMessage.length} characters
            </p>
          </div>
        )}

        {/* Preview */}
        {selectedTrip && selectedTemplate && (
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <p className="text-sm font-medium">Preview:</p>
            <div className="text-sm">
              <span className="font-semibold">[{selectedTrip.route?.name}]</span>{" "}
              {selectedMessageType === "custom" ? customMessage : selectedTemplate.preview}
            </div>
          </div>
        )}

        {/* Result Message */}
        {result && (
          <div
            className={`flex items-start gap-2 p-3 rounded-lg ${
              result.success
                ? "bg-green-500/10 border border-green-500/20"
                : "bg-red-500/10 border border-red-500/20"
            }`}
          >
            {result.success ? (
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${result.success ? "text-green-700" : "text-red-700"}`}>
                {result.message}
              </p>
            </div>
          </div>
        )}

        {/* Send Button */}
        <Button
          onClick={handleSendNotification}
          disabled={!selectedTripId || !selectedMessageType || sending}
          className="w-full"
          size="lg"
        >
          {sending ? (
            <>Sending...</>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Notification
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
