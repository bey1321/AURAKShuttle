"use client";

import React, { useState, useEffect } from "react";
import { Eye, Trash2, CheckCircle, User } from "lucide-react";
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
} from "../ui";
import { LostFoundItem } from "../../data/types";
import { lostItems } from "../../data/lostItems";
import { foundItems } from "../../data/foundItems";

export function AdminLostFoundPage() {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showClaimerDialog, setShowClaimerDialog] = useState(false);

  // Combine Lost & Found data
  useEffect(() => {
    setItems([...foundItems, ...lostItems]);
  }, []);

  // ✅ Approve claim and update item
  const handleApproveClaim = (item: LostFoundItem, claimIndex: number) => {
    if (!item.claimedInfo) return;

    const updatedItems = items.map((i) => {
      if (i.id === item.id) {
        const approvedClaim = i.claimedInfo![claimIndex];
        return {
          ...i,
          status: "Claimed",
          claimedInfo: [approvedClaim], // keep only the approved one
        };
      }
      return i;
    });

    setItems(updatedItems);
  };

  const handleDeleteItem = (id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleViewDetails = (item: LostFoundItem) => {
    setSelectedItem(item);
    setShowDetailsDialog(true);
  };

  const handleViewClaimer = (item: LostFoundItem) => {
    setSelectedItem(item);
    setShowClaimerDialog(true);
  };

  // ✅ Render Item Card
  const renderItemCard = (item: LostFoundItem) => (
    <Card
      key={item.id}
      className={`hover:shadow-md transition-shadow ${
        item.type === "Found"
          ? "border-blue-200 bg-blue-50"
          : "border-red-200 bg-red-50"
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{item.item}</CardTitle>

          {/* Claimed/Unclaimed badge for Found items */}
          {item.type === "Found" && (
            <Badge
              className={
                item.status === "Claimed"
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }
            >
              {item.status === "Claimed" ? "Claimed" : "Unclaimed"}
            </Badge>
          )}
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

        {/* Pending Claims for Found Items */}
        {item.type === "Found" &&
          item.status !== "Claimed" &&
          item.claimedInfo &&
          item.claimedInfo.length > 0 && (
            <div className="mt-3">
              <p className="font-semibold text-sm mb-2">Pending Claims:</p>
              <div className="flex flex-col gap-2">
                {item.claimedInfo.map((claim, index) => (
                  <div
                    key={index}
                    className="bg-yellow-50 border-l-4 border-yellow-400 rounded-md p-3 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="text-xs space-y-1">
                        <p>
                          <span className="font-semibold">Claimed By:</span>{" "}
                          {claim.claimedBy}
                        </p>
                        <p>
                          <span className="font-semibold">Contact:</span>{" "}
                          {claim.contactInfo}
                        </p>
                        {claim.notes && (
                          <p>
                            <span className="font-semibold">Notes:</span>{" "}
                            {claim.notes}
                          </p>
                        )}
                        <p>
                          <span className="font-semibold">Date:</span>{" "}
                          {new Date(claim.date).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="ml-2 flex-shrink-0"
                        onClick={() => handleApproveClaim(item, index)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Claimed Items — View Claimer Details */}
        {item.type === "Found" &&
          item.status === "Claimed" &&
          item.claimedInfo &&
          item.claimedInfo.length > 0 && (
            <div className="mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleViewClaimer(item)}
                className="flex items-center"
              >
                <User className="w-4 h-4 mr-1" /> View Claimer Details
              </Button>
            </div>
          )}

        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => handleViewDetails(item)}
          >
            <Eye className="w-4 h-4 mr-1" /> View
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDeleteItem(item.id)}
          >
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const lost = items.filter((i) => i.type === "Lost");
  const found = items.filter((i) => i.type === "Found");

  return (
    <div className="p-6 space-y-10 space-x-10">
      <div>
        <h1 className="text-2xl font-semibold">Admin Lost & Found</h1>
        <p className="text-muted-foreground">
          Manage all reported lost and found items
        </p>
      </div>

      {/* Found Items Section */}
      <div className="bg-blue-100/40 border border-blue-200 p-4 rounded-xl shadow-sm">
        <h2 className="text-lg font-semibold mb-3 text-blue-900">
          Found Items
        </h2>
        {found.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {found.map(renderItemCard)}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No found items.</p>
        )}
      </div>

      {/* Lost Items Section */}
      <div className="bg-red-100/40 border border-red-200 p-4 rounded-xl shadow-sm">
        <h2 className="text-lg font-semibold mb-3 text-red-900">Lost Items</h2>
        {lost.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lost.map(renderItemCard)}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No lost items.</p>
        )}
      </div>

      {/* Item Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Item Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected item.
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-2 py-4 text-sm">
              <p>
                <strong>Item:</strong> {selectedItem.item}
              </p>
              <p>
                <strong>Description:</strong> {selectedItem.description}
              </p>
              <p>
                <strong>Category:</strong> {selectedItem.category}
              </p>
              <p>
                <strong>Type:</strong> {selectedItem.type}
              </p>
              <p>
                <strong>Status:</strong> {selectedItem.status}
              </p>
              <p>
                <strong>Location:</strong> {selectedItem.location}
              </p>
              <p>
                <strong>Date Reported:</strong> {selectedItem.date}
              </p>
              <p>
                <strong>Reported By:</strong> {selectedItem.reportedBy}
              </p>
              <p>
                <strong>Contact Info:</strong> {selectedItem.contactInfo}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Claimer Details Dialog */}
      <Dialog open={showClaimerDialog} onOpenChange={setShowClaimerDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Claimer Details</DialogTitle>
            <DialogDescription>
              Information about the person who claimed this item.
            </DialogDescription>
          </DialogHeader>

          {selectedItem &&
            selectedItem.claimedInfo &&
            selectedItem.claimedInfo.length > 0 && (
              <div className="space-y-2 py-4 text-sm">
                <p>
                  <strong>Claimed By:</strong>{" "}
                  {selectedItem.claimedInfo[0].claimedBy}
                </p>
                <p>
                  <strong>Contact:</strong>{" "}
                  {selectedItem.claimedInfo[0].contactInfo}
                </p>
                {selectedItem.claimedInfo[0].notes && (
                  <p>
                    <strong>Notes:</strong> {selectedItem.claimedInfo[0].notes}
                  </p>
                )}
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(selectedItem.claimedInfo[0].date).toLocaleString()}
                </p>
              </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
