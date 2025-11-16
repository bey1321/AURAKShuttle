"use client";

import React, { useState } from "react";
import { Eye, Hand } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../ui";
import { LostFoundItem } from "./ItemSchema";

interface FoundItemProps {
  item: LostFoundItem;
  onView: (item: LostFoundItem) => void;
  onClaim: (item: LostFoundItem) => void;
  availableLocations: string[];
}

export default function FoundItem({
  item,
  onView,
  onClaim,
  availableLocations,
}: FoundItemProps) {
  const [selectedLocation, setSelectedLocation] = useState(item.location);

  return (
    <Card
      key={item.id}
      className="hover:shadow-md transition-shadow border-blue-200 bg-blue-50"
    >
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
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {availableLocations.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Button
            size="sm"
            variant="outline"
            onClick={() => onClaim({ ...item, location: selectedLocation })}
          >
            <Hand className="w-4 h-4 mr-1" /> Claim
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
