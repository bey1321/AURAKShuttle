"use client";

import React, { useState, useEffect } from "react";
import { Star, Eye, Filter, Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Input,
} from "../ui";
import { adminAPI } from "../../lib/api";

interface Feedback {
  id: number;
  cleanliness: number;
  driver_rating: number;
  timeliness: number;
  comment: string;
  created_at?: string;
  trip?: {
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    name?: string;
    route?: {
      id: number;
      name: string;
    };
    bus?: {
      id: number;
      plate_num: string;
      model?: string;
    };
  };
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
  };
  student?: {
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
  };
}

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<"all" | "high" | "medium" | "low">("all");

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getFeedbacks();
      setFeedbacks(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to fetch feedbacks:", err);
      alert(err?.message || "Failed to load feedbacks");
    } finally {
      setLoading(false);
    }
  };

  const getAverageRating = (feedback: Feedback) => {
    return (
      (feedback.cleanliness + feedback.driver_rating + feedback.timeliness) / 3
    ).toFixed(1);
  };

  const getRatingBadge = (rating: number) => {
    if (rating >= 4) return { text: "Excellent", color: "bg-green-100 text-green-800" };
    if (rating >= 3) return { text: "Good", color: "bg-blue-100 text-blue-800" };
    if (rating >= 2) return { text: "Fair", color: "bg-yellow-100 text-yellow-800" };
    return { text: "Poor", color: "bg-red-100 text-red-800" };
  };

  const handleViewDetails = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setShowDetailsDialog(true);
  };

  const filteredFeedbacks = feedbacks.filter((fb) => {
    const avgRating = parseFloat(getAverageRating(fb));
    const student = fb.user || fb.student;
    const matchesSearch =
      !searchQuery ||
      fb.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fb.trip?.route?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student?.last_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRating =
      ratingFilter === "all" ||
      (ratingFilter === "high" && avgRating >= 4) ||
      (ratingFilter === "medium" && avgRating >= 2 && avgRating < 4) ||
      (ratingFilter === "low" && avgRating < 2);

    return matchesSearch && matchesRating;
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading feedbacks...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Trip Feedbacks</h1>
        <p className="text-muted-foreground">
          View and manage all trip feedback from students
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Feedbacks</p>
              <h3 className="text-2xl font-bold">{feedbacks.length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Avg Cleanliness</p>
              <h3 className="text-2xl font-bold">
                {feedbacks.length
                  ? (
                      feedbacks.reduce((sum, fb) => sum + fb.cleanliness, 0) /
                      feedbacks.length
                    ).toFixed(1)
                  : "N/A"}
              </h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Avg Driver Rating</p>
              <h3 className="text-2xl font-bold">
                {feedbacks.length
                  ? (
                      feedbacks.reduce((sum, fb) => sum + fb.driver_rating, 0) /
                      feedbacks.length
                    ).toFixed(1)
                  : "N/A"}
              </h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Avg Timeliness</p>
              <h3 className="text-2xl font-bold">
                {feedbacks.length
                  ? (
                      feedbacks.reduce((sum, fb) => sum + fb.timeliness, 0) /
                      feedbacks.length
                    ).toFixed(1)
                  : "N/A"}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by comment, route, or student..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={ratingFilter === "all" ? "default" : "outline"}
                onClick={() => setRatingFilter("all")}
              >
                All
              </Button>
              <Button
                size="sm"
                variant={ratingFilter === "high" ? "default" : "outline"}
                onClick={() => setRatingFilter("high")}
              >
                High (4-5★)
              </Button>
              <Button
                size="sm"
                variant={ratingFilter === "medium" ? "default" : "outline"}
                onClick={() => setRatingFilter("medium")}
              >
                Medium (2-4★)
              </Button>
              <Button
                size="sm"
                variant={ratingFilter === "low" ? "default" : "outline"}
                onClick={() => setRatingFilter("low")}
              >
                Low (&lt;2★)
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Feedbacks List */}
      <Card>
        <CardHeader>
          <CardTitle>All Feedbacks ({filteredFeedbacks.length})</CardTitle>
          <CardDescription>Detailed feedback from students</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredFeedbacks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No feedbacks found
            </p>
          ) : (
            <div className="space-y-4">
              {filteredFeedbacks.map((feedback) => {
                const avgRating = parseFloat(getAverageRating(feedback));
                const badge = getRatingBadge(avgRating);
                const student = feedback.user || feedback.student;
                return (
                  <div
                    key={feedback.id}
                    className="p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className={badge.color}>{badge.text}</Badge>
                          <span className="font-medium">
                            {avgRating} ★ Average
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Route:</span>{" "}
                            <span className="font-medium">
                              {feedback.trip?.route?.name || feedback.trip?.name || "N/A"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Bus:</span>{" "}
                            <span className="font-medium">
                              {feedback.trip?.bus?.plate_num || "N/A"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Student:</span>{" "}
                            <span className="font-medium">
                              {student
                                ? `${student.first_name} ${student.last_name}`
                                : "N/A"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Date:</span>{" "}
                            <span className="font-medium">
                              {feedback.trip?.date || "N/A"}
                            </span>
                          </div>
                        </div>
                        {feedback.comment && (
                          <p className="text-sm text-muted-foreground italic">
                            "{feedback.comment.substring(0, 100)}
                            {feedback.comment.length > 100 ? "..." : ""}"
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(feedback)}
                      >
                        <Eye className="w-4 h-4 mr-1" /> View
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
            <DialogDescription>Complete feedback information</DialogDescription>
          </DialogHeader>
          {selectedFeedback && (() => {
            const student = selectedFeedback.user || selectedFeedback.student;
            return (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Trip ID</p>
                  <p className="font-medium">{selectedFeedback.trip?.id || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {selectedFeedback.trip?.date || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Route</p>
                  <p className="font-medium">
                    {selectedFeedback.trip?.route?.name ||
                      selectedFeedback.trip?.name ||
                      "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bus</p>
                  <p className="font-medium">
                    {selectedFeedback.trip?.bus?.plate_num || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Student</p>
                  <p className="font-medium">
                    {student
                      ? `${student.first_name} ${student.last_name}`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Student Email</p>
                  <p className="font-medium">
                    {student?.email || "N/A"}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <h4 className="font-semibold">Ratings</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cleanliness</span>
                    <div className="flex items-center gap-2">
                      {renderStars(selectedFeedback.cleanliness)}
                      <span className="text-sm font-medium">
                        {selectedFeedback.cleanliness}/5
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Driver Rating</span>
                    <div className="flex items-center gap-2">
                      {renderStars(selectedFeedback.driver_rating)}
                      <span className="text-sm font-medium">
                        {selectedFeedback.driver_rating}/5
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Timeliness</span>
                    <div className="flex items-center gap-2">
                      {renderStars(selectedFeedback.timeliness)}
                      <span className="text-sm font-medium">
                        {selectedFeedback.timeliness}/5
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-semibold">Average Rating</span>
                    <span className="text-lg font-bold">
                      {getAverageRating(selectedFeedback)} ★
                    </span>
                  </div>
                </div>
              </div>

              {selectedFeedback.comment && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Comment</h4>
                  <p className="text-sm bg-muted p-3 rounded">
                    {selectedFeedback.comment}
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}