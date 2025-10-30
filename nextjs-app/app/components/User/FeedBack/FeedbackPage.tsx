"use client";

import React, { useState } from "react";
import FeedbackOverview from "./FeedbackOverview";
import PreviousFeedbacks from "./PreviousFeedbacks";
import NewFeedbackForm from "./NewFeedbackForm";
import { Feedback } from "../../../data/database";
import { myFeedback as initialFeedback } from "../../../data/database";

export default function FeedbackPage() {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>(initialFeedback);

  const handleNewFeedback = (feedback: Feedback) => {
    setFeedbackList([feedback, ...feedbackList]);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Feedback & Reviews</h1>
      <p className="text-muted-foreground">
        Share your shuttle travel experience with us
      </p>

      <FeedbackOverview feedbackList={feedbackList} />
      <NewFeedbackForm onSubmit={handleNewFeedback} />
      <PreviousFeedbacks feedbackList={feedbackList} />
    </div>
  );
}
