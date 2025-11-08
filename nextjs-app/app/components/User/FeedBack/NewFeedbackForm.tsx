"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Label,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../ui";
import { Star } from "lucide-react";
import { getTripsForFeedback } from "../../../data/database";
import { Feedback, RecentTrip } from "../../../data/database";
import { tripAPI } from "../../../lib/api";

interface Props {
  onSubmit: (feedback: Feedback) => void;
}

export default function NewFeedbackForm({ onSubmit }: Props) {
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState("");
  const [overallRating, setOverallRating] = useState(0);
  const [cleanlinessRating, setCleanlinessRating] = useState(0);
  const [driverRating, setDriverRating] = useState(0);
  const [timelinessRating, setTimelinessRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        const trips = await getTripsForFeedback();
        setRecentTrips(
          trips.map((trip: any) => ({
            id: trip.id,
            route: trip.route_name || "Unknown Route",
            date: trip.date
              ? typeof trip.date === "string"
                ? trip.date
                : trip.date.split("T")[0]
              : "",
            driver: trip.driver_id?.toString() || "Unknown",
            time: trip.route?.start_time || "",
          }))
        );
      } catch (error) {
        console.error("Error fetching trips for feedback:", error);
        alert("Failed to load trips. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  const StarRating = ({
    rating,
    onRate,
  }: {
    rating: number;
    onRate: (r: number) => void;
  }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate(star)}
          className="cursor-pointer hover:scale-110 transition-colors"
        >
          <Star
            className={`w-6 h-6 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            }`}
          />
        </button>
      ))}
    </div>
  );

  const handleSubmit = async () => {
    if (
      !selectedTrip ||
      !feedbackText ||
      cleanlinessRating === 0 ||
      driverRating === 0 ||
      timelinessRating === 0
    )
      return;

    const trip = recentTrips.find((t) => t.id.toString() === selectedTrip);
    if (!trip) return;

    try {
      setSubmitting(true);
      await tripAPI.rateTrip({
        trip_id: parseInt(selectedTrip),
        cleanliness: cleanlinessRating,
        driver_rating: driverRating,
        timeliness: timelinessRating,
        comment: feedbackText,
      });

      const newFeedback: Feedback = {
        id: Date.now(),
        trip_id: parseInt(selectedTrip),
        route: trip.route,
        date: trip.date,
        rating: Math.round(
          (cleanlinessRating + driverRating + timelinessRating) / 3
        ),
        comment: feedbackText,
        cleanliness: cleanlinessRating,
        driver_rating: driverRating,
        timeliness: timelinessRating,
        categories: {
          cleanliness: cleanlinessRating,
          driver: driverRating,
          timeliness: timelinessRating,
        },
      };

      onSubmit(newFeedback);

      setSelectedTrip("");
      setOverallRating(0);
      setCleanlinessRating(0);
      setDriverRating(0);
      setTimelinessRating(0);
      setFeedbackText("");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit New Feedback</CardTitle>
        <CardDescription>Rate your recent shuttle experience</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Select Recent Trip</Label>
          <Select value={selectedTrip} onValueChange={setSelectedTrip}>
            <SelectTrigger>
              <SelectValue placeholder="Choose the trip you want to review" />
            </SelectTrigger>
            <SelectContent>
              {loading ? (
                <SelectItem value="loading" disabled>
                  Loading trips...
                </SelectItem>
              ) : recentTrips.length === 0 ? (
                <SelectItem value="none" disabled>
                  No trips available for feedback
                </SelectItem>
              ) : (
                recentTrips.map((trip) => (
                  <SelectItem key={trip.id} value={trip.id.toString()}>
                    {trip.route} • {trip.date} • Driver: {trip.driver}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Overall Experience</Label>
          <StarRating rating={overallRating} onRate={setOverallRating} />
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium">Rate Specific Aspects</h4>
          {[
            ["Cleanliness", cleanlinessRating, setCleanlinessRating],
            ["Driver Behavior", driverRating, setDriverRating],
            ["Timeliness", timelinessRating, setTimelinessRating],
          ].map(([label, value, setter]) => (
            <div key={label} className="flex items-center justify-between">
              <Label className="text-sm">{label}</Label>
              <StarRating rating={value as number} onRate={setter as any} />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Label>Your Feedback</Label>
          <Textarea
            placeholder="Share your experience..."
            rows={4}
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
          />
        </div>

        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={submitting || loading}
        >
          {submitting ? "Submitting..." : "Submit Feedback"}
        </Button>
      </CardContent>
    </Card>
  );
}
