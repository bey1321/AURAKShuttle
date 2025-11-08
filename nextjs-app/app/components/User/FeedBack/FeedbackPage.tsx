"use client";

import React, { useState, useEffect } from "react";
import FeedbackOverview from "./FeedbackOverview";
import PreviousFeedbacks from "./PreviousFeedbacks";
import NewFeedbackForm from "./NewFeedbackForm";
import { Feedback } from "../../../data/database";
import { getMyFeedback } from "../../../data/database";

export default function FeedbackPage() {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setLoading(true);
        const feedback = await getMyFeedback();
        setFeedbackList(feedback);
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
          <NewFeedbackForm onSubmit={handleNewFeedback} />
          <PreviousFeedbacks feedbackList={feedbackList} />
        </>
      )}
    </div>
  );
}
