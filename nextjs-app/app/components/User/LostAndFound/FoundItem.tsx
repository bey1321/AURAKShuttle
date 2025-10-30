"use client";

import React from "react";
import { Eye, Hand } from "lucide-react";
import {
  Button,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../ui";
import { LostFoundItem } from "./ItemSchema";

interface FoundItemProps {
  item: LostFoundItem;
  onView: (item: LostFoundItem) => void;
  onClaim: (item: LostFoundItem) => void;
}

export default function FoundItem({ item, onView, onClaim }: FoundItemProps) {
  return (
    <Card key={item.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{item.item}</CardTitle>
          <Badge
            className={
              item.status === "Claimed"
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }
          >
            {item.status}
          </Badge>
        </div>
        <CardDescription>{item.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          <span className="text-muted-foreground">Location:</span>{" "}
          {item.location}
        </p>
        <p>
          <span className="text-muted-foreground">Reported by:</span>{" "}
          {item.reportedBy}
        </p>
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onView(item)}
          >
            <Eye className="w-4 h-4 mr-1" /> View
          </Button>

          <Button size="sm" variant="outline" onClick={() => onClaim(item)}>
            <Hand />Claim
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
