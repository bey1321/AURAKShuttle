"use client";

import {
  Star,
  Send,
  MessageSquare,
  ThumbsUp,
  Calendar,
  Bus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui";
import React, { useState } from "react";
import {
  recentTrips,
  myFeedback as initialFeedback,
} from "../data/database";
import { Feedback } from "../data/types";

export function FeedbackPage() {
  // --- State ---
  const [overallRating, setOverallRating] = useState(0);
  const [cleanlinessRating, setCleanlinessRating] = useState(0);
  const [driverRating, setDriverRating] = useState(0);
  const [timelinessRating, setTimelinessRating] = useState(0);
  const [selectedTrip, setSelectedTrip] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackList, setFeedbackList] = useState<Feedback[]>(initialFeedback);

  // --- Star Rating Component ---
  const StarRating = ({
    rating,
    onRate,
    readonly = false,
  }: {
    rating: number;
    onRate?: (rating: number) => void;
    readonly?: boolean;
  }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !readonly && onRate?.(star)}
            className={`transition-colors ${
              readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
            }`}
            disabled={readonly}
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
  };

  // --- Submit Feedback ---
  const handleSubmitFeedback = () => {
    if (!selectedTrip || !feedbackText || overallRating === 0) return;

    const trip = recentTrips.find((t) => t.id.toString() === selectedTrip);
    if (!trip) return;

    const newFeedback: Feedback = {
      id: Date.now(),
      route: trip.route,
      date: trip.date,
      rating: overallRating,
      comment: feedbackText,
      categories: {
        cleanliness: cleanlinessRating,
        driver: driverRating,
        timeliness: timelinessRating,
      },
    };

    const updatedList = [newFeedback, ...feedbackList];
    setFeedbackList(updatedList);

    // Reset form
    setSelectedTrip("");
    setFeedbackText("");
    setOverallRating(0);
    setCleanlinessRating(0);
    setDriverRating(0);
    setTimelinessRating(0);
  };

  const avgRating =
    feedbackList.reduce((sum, f) => sum + f.rating, 0) / feedbackList.length ||
    0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Feedback & Reviews</h1>
        <p className="text-muted-foreground">
          Share your shuttle travel experience with us
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Your Avg Rating</p>
                <h3 className="text-2xl font-bold">
                  {avgRating.toFixed(1)} ⭐
                </h3>
              </div>
              <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reviews Given</p>
                <h3 className="text-2xl font-bold">{feedbackList.length}</h3>
              </div>
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Positive Reviews
                </p>
                <h3 className="text-2xl font-bold">
                  {feedbackList.filter((f) => f.rating >= 3).length}
                </h3>
              </div>
              <ThumbsUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submit Feedback Form */}
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
                {recentTrips.map((trip) => (
                  <SelectItem key={trip.id} value={trip.id.toString()}>
                    <div className="flex flex-col">
                      <span>{trip.route}</span>
                      <span className="text-xs text-muted-foreground">
                        {trip.date} • Driver: {trip.driver}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Overall Experience</Label>
            <StarRating rating={overallRating} onRate={setOverallRating} />
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Rate Specific Aspects</h4>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Cleanliness</Label>
              <StarRating
                rating={cleanlinessRating}
                onRate={setCleanlinessRating}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Driver Behavior</Label>
              <StarRating rating={driverRating} onRate={setDriverRating} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Timeliness</Label>
              <StarRating
                rating={timelinessRating}
                onRate={setTimelinessRating}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Your Feedback</Label>
            <Textarea
              placeholder="Share your experience, suggestions, or concerns..."
              rows={4}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Your feedback helps us improve our shuttle service
            </p>
          </div>

          <Button className="w-full" onClick={handleSubmitFeedback}>
            <Send className="w-4 h-4 mr-2" />
            Submit Feedback
          </Button>
        </CardContent>
      </Card>

      {/* Previous Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Your Previous Reviews</CardTitle>
          <CardDescription>Feedback you've submitted</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {feedbackList.map((feedback) => (
            <div
              key={feedback.id}
              className={`p-4 border rounded-lg space-y-3 ${
                feedback.rating >= 3
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      feedback.rating >= 3 ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    <Bus
                      className={`w-5 h-5 ${
                        feedback.rating >= 3 ? "text-green-600" : "text-red-600"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{feedback.route}</h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{feedback.date}</span>
                    </div>
                  </div>
                </div>
                <Badge
                  className={`ml-2 ${
                    feedback.rating >= 3
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {feedback.rating >= 3 ? "Positive" : "Negative"}
                </Badge>
              </div>

              <p className="text-sm">{feedback.comment}</p>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div
                  className={`flex flex-col items-center p-2 rounded ${
                    feedback.rating >= 3 ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  <span className="text-muted-foreground">Cleanliness</span>
                  <span className="mt-1 font-medium">
                    {feedback.categories.cleanliness} ⭐
                  </span>
                </div>
                <div
                  className={`flex flex-col items-center p-2 rounded ${
                    feedback.rating >= 3 ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  <span className="text-muted-foreground">Driver</span>
                  <span className="mt-1 font-medium">
                    {feedback.categories.driver} ⭐
                  </span>
                </div>
                <div
                  className={`flex flex-col items-center p-2 rounded ${
                    feedback.rating >= 3 ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  <span className="text-muted-foreground">Timeliness</span>
                  <span className="mt-1 font-medium">
                    {feedback.categories.timeliness} ⭐
                  </span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Service Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Service Performance Overview</CardTitle>
          <CardDescription>
            Average ratings across all your feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {["cleanliness", "driver", "timeliness", "overall"].map(
              (aspect) => {
                const aspectName =
                  aspect === "cleanliness"
                    ? "Cleanliness"
                    : aspect === "driver"
                    ? "Driver Behavior"
                    : aspect === "timeliness"
                    ? "Timeliness"
                    : "Overall Experience";

                let value = 0;
                if (aspect === "overall") {
                  value = avgRating;
                } else {
                  value =
                    feedbackList.reduce(
                      (sum, f) =>
                        sum + f.categories[aspect as keyof typeof f.categories],
                      0
                    ) / feedbackList.length || 0;
                }

                return (
                  <div
                    key={aspect}
                    className="flex items-center justify-between"
                  >
                    <span className="font-medium">{aspectName}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${(value / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm w-12 text-right font-medium">
                        {value.toFixed(1)}/5
                      </span>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
