"use client";

import React, { useState, useEffect } from "react";
import { Eye, Trash2, CheckCircle, Plus, Users } from "lucide-react";
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
import ConfirmDeleteDialog from "../ConfirmDeleteDialog";
import { lostFoundAPI } from "../../lib/api";

// ✅ Backend-aligned interfaces for claims
interface Claim {
  id: number;
  status: string;
  claimer: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}


// Keep your existing LostFoundItem
export interface LostFoundItem {
  id: number;
  obj_name: string;
  obj_description: string;
  obj_type: string;
  date?: string;
  trip_id?: number;
  status?: string;
  finder_id?: number;
  type: "Lost" | "Found";
}

export function AdminLostFoundPage() {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<LostFoundItem | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportType, setReportType] = useState<"Lost" | "Found">("Lost");
  const [newItemData, setNewItemData] = useState({
    obj_name: "",
    obj_description: "",
    obj_type: "",
    trip_id: 0,
  });

  // New state for claims modal
  const [claimsModalOpen, setClaimsModalOpen] = useState(false);
  const [claimsList, setClaimsList] = useState<Claim[]>([]);
  const [currentItemForClaims, setCurrentItemForClaims] = useState<LostFoundItem | null>(null);

  // Fetch lost/found items (keep your existing logic)
  const fetchItems = async () => {
    try {
      const [lostResponse, foundResponse] = await Promise.all([
        lostFoundAPI.getLostItems(),
        lostFoundAPI.getFoundItems(),
      ]);

      const lostItems = (lostResponse["lost items"] || []).map((item) => ({
        ...item,
        type: "Lost" as const,
      }));

      const foundItems = (foundResponse.found_items || []).map((item) => ({
        ...item,
        type: "Found" as const,
      }));

      setItems([...lostItems, ...foundItems]);
    } catch (err) {
      console.error("❌ Failed to fetch lost/found items:", err);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // ✅ Handle Approve Claim
  const handleApproveClaim = async (claimId: number) => {
    try {
      await lostFoundAPI.approveClaim(claimId);
      alert("Claim approved successfully!");
      fetchItems();
      // Refresh claims modal
      if (currentItemForClaims) handleSeeClaims(currentItemForClaims);
    } catch (err: any) {
      console.error("❌ Failed to approve claim:", err);
      alert(err?.message || "Failed to approve claim. Please try again.");
    }
  };

  // ✅ Handle Mark Item Received
  const handleMarkReceived = async (claimId: number, studentId: number) => {
    try {
      await lostFoundAPI.markItemReceived(studentId, claimId);
      alert("Item marked as received!");
      setClaimsModalOpen(false);
      fetchItems();
    } catch (err: any) {
      console.error("❌ Failed to mark received:", err);
      alert(err?.message || "Failed to mark item as received.");
    }
  };

  // ✅ Fetch claims for a found item
  const handleSeeClaims = async (item: LostFoundItem) => {
    try {
      const foundClaims = await lostFoundAPI.getAdminFoundAndClaims();
      const itemClaims = foundClaims.find((i: any) => i.id === item.id)?.claim || [];
      setClaimsList(itemClaims);
      setCurrentItemForClaims(item);
      setClaimsModalOpen(true);
    } catch (err) {
      console.error("❌ Failed to fetch claims:", err);
      alert("Failed to fetch claims.");
    }
  };

  const handleViewDetails = (item: LostFoundItem) => {
    setSelectedItem(item);
    setShowDetailsDialog(true);
  };

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
          <CardTitle className="text-lg">{item.obj_name}</CardTitle>
          <Badge
            className={
              item.type === "Found"
                ? "bg-blue-100 text-blue-800"
                : "bg-red-100 text-red-800"
            }
          >
            {item.type}
          </Badge>
        </div>
        <CardDescription>{item.obj_description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-2 text-sm">
        <p>
          <span className="text-muted-foreground">Category:</span>{" "}
          {item.obj_type}
        </p>
        <p>
          <span className="text-muted-foreground">Trip ID:</span>{" "}
          {item.trip_id ?? "N/A"}
        </p>
        {item.date && (
          <p>
            <span className="text-muted-foreground">Date:</span> {item.date}
          </p>
        )}
        {item.status && (
          <p>
            <span className="text-muted-foreground">Status:</span> {item.status}
          </p>
        )}

        {item.type === "Found" && (
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSeeClaims(item)}
            >
              <Users className="w-4 h-4 mr-1" />
              See Claims
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
            onClick={() => setItemToDelete(item)}
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
    <div className="p-6 space-y-10">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Admin Lost & Found</h1>
          <p className="text-muted-foreground">
            Manage all reported lost and found items
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowReportDialog(true)}
          >
            <Plus className="w-4 h-4 mr-1" /> Report Lost Item
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowReportDialog(true)}
          >
            <Plus className="w-4 h-4 mr-1" /> Report Found Item
          </Button>
        </div>
      </div>

      {/* Found Items */}
      <section className="bg-blue-100/40 border border-blue-200 p-4 rounded-xl shadow-sm">
        <h2 className="text-lg font-semibold mb-3 text-blue-900">
          Found Items
        </h2>
        {found.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {found.map(renderItemCard)}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No found items.</p>
        )}
      </section>

      {/* Lost Items */}
      <section className="bg-red-100/40 border border-red-200 p-4 rounded-xl shadow-sm">
        <h2 className="text-lg font-semibold mb-3 text-red-900">Lost Items</h2>
        {lost.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lost.map(renderItemCard)}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No lost items.</p>
        )}
      </section>

      {/* Claims Modal */}
      <Dialog open={claimsModalOpen} onOpenChange={setClaimsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Claims for: {currentItemForClaims?.obj_name}
            </DialogTitle>
            <DialogDescription>
              List of students who claimed this found item.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {claimsList.length ? (
              claimsList.map((c) => (
                <div
                  key={c.id}
                  className="flex justify-between items-center gap-2 border p-2 rounded"
                >
                  <div>
  <p>
    <span className="font-semibold">Name:</span> {c.claimer.first_name} {c.claimer.last_name}
  </p>
  <p>
    <span className="font-semibold">Email:</span> {c.claimer.email}
  </p>
  <p className="text-sm text-muted-foreground">
    <span className="font-semibold">Status:</span> {c.status}
  </p>
</div>

                  <div className="flex gap-1">
                    {c.status !== "approved" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApproveClaim(c.id)}
                      >
                        Approve
                      </Button>
                    )}
                    {c.status === "approved" && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() =>
                          handleMarkReceived(c.id, c.claimer.id)
                        }
                      >
                        Mark Received
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No claims yet.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
