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
import { tripAPI } from "../../../lib/api";

interface Feedback {
  id: number;
  trip_id?: number;
  route: string;
  date: string;
  rating?: number;
  comment: string;
  categories?: {
    cleanliness: number;
    driver: number;
    timeliness: number;
  };
  cleanliness?: number;
  driver_rating?: number;
  timeliness?: number;
  user_id?: number;
}

interface Props {
  onSubmit: (feedback: Feedback) => void;
}

export default function NewFeedbackForm({ onSubmit }: Props) {
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState("");
  const [cleanlinessRating, setCleanlinessRating] = useState(0);
  const [driverRating, setDriverRating] = useState(0);
  const [timelinessRating, setTimelinessRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ✅ Fetch trips using your new /get_mytrips endpoint
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        // Use the user's trips endpoint per request
        // This will fetch the user's trips (past & reserved) for selection
        const trips = await tripAPI.getMyTrips();
        // Optional: only include past trips if needed
        const today = new Date();
        const filteredTrips = trips.filter(
          (trip: any) => new Date(trip.date) < today
        );
        setRecentTrips(filteredTrips);
      } catch (error) {
        console.error("Error fetching trips:", error);
        const msg = (error as any)?.message || String(error);
        alert("Failed to load trips for feedback: " + msg);
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
          className="cursor-pointer hover:scale-110 transition-transform"
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
      selectedTrip === "loading" ||
      selectedTrip === "none" ||
      !feedbackText ||
      cleanlinessRating === 0 ||
      driverRating === 0 ||
      timelinessRating === 0
    ) {
      return alert("Please fill in all fields before submitting.");
    }

    try {
      setSubmitting(true);
      await tripAPI.rateTrip({
        trip_id: parseInt(selectedTrip),
        cleanliness: cleanlinessRating,
        driver_rating: driverRating,
        timeliness: timelinessRating,
        comment: feedbackText,
      });

      const trip = recentTrips.find((t) => t.id === parseInt(selectedTrip));

      const newFeedback: Feedback = {
        id: Date.now(),
        trip_id: trip.id,
        route: trip.route_name || "Unknown Route",
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

      // Reset form
      setSelectedTrip("");
      setCleanlinessRating(0);
      setDriverRating(0);
      setTimelinessRating(0);
      setFeedbackText("");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      // apiCall throws Error with message containing status and detail when the response is not ok
      const errMsg = (error as any)?.message || JSON.stringify(error);
      alert("Failed to submit feedback: " + errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Submit New Feedback</CardTitle>
        <CardDescription>Rate your recent shuttle experience</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Select Trip</Label>
          <Select value={selectedTrip} onValueChange={setSelectedTrip}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a trip" />
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
                    {trip.route_name} • {trip.date}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium">Rate Specific Aspects</h4>
          <div className="flex justify-between items-center">
            <Label>Cleanliness</Label>
            <StarRating rating={cleanlinessRating} onRate={setCleanlinessRating} />
          </div>
          <div className="flex justify-between items-center">
            <Label>Driver Behavior</Label>
            <StarRating rating={driverRating} onRate={setDriverRating} />
          </div>
          <div className="flex justify-between items-center">
            <Label>Timeliness</Label>
            <StarRating rating={timelinessRating} onRate={setTimelinessRating} />
          </div>
        </div>

        <div>
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
