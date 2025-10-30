"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../ui";
import { Star, MessageSquare, ThumbsUp } from "lucide-react";
import { Feedback } from "../../../data/database";

interface Props {
  feedbackList: Feedback[];
}

export default function FeedbackOverview({ feedbackList }: Props) {
  const avgRating =
    feedbackList.reduce((sum, f) => sum + f.rating, 0) / feedbackList.length ||
    0;

  const aspectAverage = (aspect: keyof Feedback["categories"]) =>
    feedbackList.reduce((sum, f) => sum + f.categories[aspect], 0) /
      feedbackList.length || 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Your Avg Rating</p>
              <h3 className="text-2xl font-bold">{avgRating.toFixed(1)} ⭐</h3>
            </div>
            <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Reviews Given</p>
              <h3 className="text-2xl font-bold">{feedbackList.length}</h3>
            </div>
            <MessageSquare className="w-8 h-8 text-primary" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Positive Reviews</p>
              <h3 className="text-2xl font-bold">
                {feedbackList.filter((f) => f.rating >= 3).length}
              </h3>
            </div>
            <ThumbsUp className="w-8 h-8 text-green-600" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Performance Overview</CardTitle>
          <CardDescription>
            Average ratings across all your feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(["cleanliness", "driver", "timeliness", "overall"] as const).map(
            (aspect) => {
              const name =
                aspect === "cleanliness"
                  ? "Cleanliness"
                  : aspect === "driver"
                  ? "Driver Behavior"
                  : aspect === "timeliness"
                  ? "Timeliness"
                  : "Overall Experience";

              const value =
                aspect === "overall" ? avgRating : aspectAverage(aspect);

              return (
                <div
                  key={aspect}
                  className="flex items-center justify-between mb-2"
                >
                  <span className="font-medium">{name}</span>
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
        </CardContent>
      </Card>
    </div>
  );
}
