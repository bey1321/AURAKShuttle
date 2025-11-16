"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Label,
  Input,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Button,
} from "../../ui";

interface ReportItemProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportType: "Lost" | "Found";
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  categories: string[];
  availableLocations: string[];
}

export default function ReportItem({
  open,
  onOpenChange,
  reportType,
  formData,
  setFormData,
  onSubmit,
  categories,
  availableLocations,
}: ReportItemProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Report {reportType} Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <Label>Item Name</Label>
          <Input
            value={formData.item}
            onChange={(e) => setFormData({ ...formData, item: e.target.value })}
          />

          <Label>Description</Label>
          <Textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />

          <Label>Location</Label>
          <Select
            value={formData.location}
            onValueChange={(v) => setFormData({ ...formData, location: v })}
          >
            <SelectTrigger>
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

          <Label>Category</Label>
          <Select
            value={formData.category}
            onValueChange={(v) => setFormData({ ...formData, category: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Label>Your Name</Label>
          <Input
            value={formData.reportedBy}
            onChange={(e) =>
              setFormData({ ...formData, reportedBy: e.target.value })
            }
          />

          <Label>Contact Info</Label>
          <Input
            value={formData.contactInfo}
            onChange={(e) =>
              setFormData({ ...formData, contactInfo: e.target.value })
            }
          />

          <Button className="w-full" onClick={onSubmit}>
            Submit Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
