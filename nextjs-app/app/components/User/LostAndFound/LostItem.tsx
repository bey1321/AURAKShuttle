"use client";

import React from "react";
import { Eye } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../ui";
import { LostFoundItem } from "./ItemSchema";

interface LostItemProps {
  item: LostFoundItem;
  onView: (item: LostFoundItem) => void;
}

export default function LostItem({ item, onView }: LostItemProps) {
  return (
    <Card key={item.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{item.item}</CardTitle>
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
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={() => onView(item)}
        >
          <Eye className="w-4 h-4 mr-1" /> View
        </Button>
      </CardContent>
    </Card>
  );
}
