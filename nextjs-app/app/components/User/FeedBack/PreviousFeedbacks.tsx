"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
} from "../../ui";
import { Bus, Calendar } from "lucide-react";

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
  feedbackList: Feedback[];
}

export default function PreviousFeedbacks({ feedbackList }: Props) {
  return (
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
            <div className="flex justify-between items-start">
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
              {(["cleanliness", "driver", "timeliness"] as const).map((aspect) => (
                <div
                  key={aspect}
                  className={`flex flex-col items-center p-2 rounded ${
                    feedback.rating >= 3 ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  <span className="text-muted-foreground capitalize">
                    {aspect}
                  </span>
                  <span className="mt-1 font-medium">
                    {feedback.categories[aspect]} ⭐
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
