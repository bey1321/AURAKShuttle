"use client";

import React, { useState, useEffect } from "react";
import FeedbackOverview from "./FeedbackOverview";
import PreviousFeedbacks from "./PreviousFeedbacks";
import NewFeedbackForm from "./NewFeedbackForm";
// Remove the problematic type import, define Feedback inline instead
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

export default function FeedbackPage() {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setLoading(true);
        const feedback = await tripAPI.getMyReviews(); // ✅ backend call
        setFeedbackList(
          feedback.map((r: any) => ({
            id: r.id,
            trip_id: r.trip_id,
            route: r.route_name || "Unknown Route",
            date: r.trip_date || "",
            rating: Math.round(
              (r.cleanliness + r.driver_rating + r.timeliness) / 3
            ),
            comment: r.comment,
            cleanliness: r.cleanliness,
            driver_rating: r.driver_rating,
            timeliness: r.timeliness,
            categories: {
              cleanliness: r.cleanliness,
              driver: r.driver_rating,
              timeliness: r.timeliness,
            },
          }))
        );
      } catch (error) {
        console.error("Error fetching feedback:", error);
        alert("Failed to load feedback. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, []);

  const handleNewFeedback = (feedback: Feedback) => {
    setFeedbackList([feedback, ...feedbackList]);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Feedback & Reviews</h1>
      <p className="text-muted-foreground">
        Share your shuttle travel experience with us
      </p>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading feedback...</p>
        </div>
      ) : (
        <>
          <FeedbackOverview feedbackList={feedbackList} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div>
              <NewFeedbackForm onSubmit={handleNewFeedback} />
            </div>
            <div>
              <PreviousFeedbacks feedbackList={feedbackList} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
