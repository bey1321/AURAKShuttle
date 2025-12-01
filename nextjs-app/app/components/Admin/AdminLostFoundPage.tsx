"use client";

import React, { useState, useEffect } from "react";
import { Eye, Trash2, Plus, Users } from "lucide-react";
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
import { addNotification } from "../../lib/localNotifications";

// Interfaces
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
  const [itemToDelete, setItemToDelete] = useState<LostFoundItem | null>(null);

  // Dialog states
  const [showLostDialog, setShowLostDialog] = useState(false);
  const [showFoundDialog, setShowFoundDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");

  // New item states
  const [newLostItem, setNewLostItem] = useState({
    obj_name: "",
    obj_description: "",
    obj_type: "",
    trip_id: 0,
  });
  const [newFoundItem, setNewFoundItem] = useState({
    obj_name: "",
    obj_description: "",
    obj_type: "",
    trip_id: 0,
  });

  // Claims
  const [claimsModalOpen, setClaimsModalOpen] = useState(false);
  const [claimsList, setClaimsList] = useState<Claim[]>([]);
  const [currentItemForClaims, setCurrentItemForClaims] = useState<LostFoundItem | null>(null);

  // Fetch items
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

  // Handlers for reporting items
  const handleReportLost = async () => {
    try {
      await lostFoundAPI.reportLostItem(newLostItem);
      setDialogMessage("Lost item reported successfully!");
      setShowSuccessDialog(true);
      setShowLostDialog(false);
      fetchItems();
      setNewLostItem({ obj_name: "", obj_description: "", obj_type: "", trip_id: 0 });
    } catch (err: any) {
      console.error(err);
      setDialogMessage(err?.message || "Failed to report lost item.");
      setShowErrorDialog(true);
    }
  };

  const handleReportFound = async () => {
    try {
      await lostFoundAPI.reportFoundItem(newFoundItem);
      setDialogMessage("Found item reported successfully!");
      setShowSuccessDialog(true);
      setShowFoundDialog(false);
      fetchItems();
      setNewFoundItem({ obj_name: "", obj_description: "", obj_type: "", trip_id: 0 });
    } catch (err: any) {
      console.error(err);
      setDialogMessage(err?.message || "Failed to report found item.");
      setShowErrorDialog(true);
    }
  };

  // Approve claim
  const handleApproveClaim = async (claimId: number) => {
    try {
      await lostFoundAPI.approveClaim(claimId);
      // Add a frontend-only notification so the student (or local user) sees the approval
      try {
        // try to find the claim to get claimer info
        const found = claimsList.find((c) => c.id === claimId);
        const claimerName = found ? `${found.claimer.first_name} ${found.claimer.last_name}` : undefined;
        addNotification({
          type: "success",
          message: `Claim approved for ${currentItemForClaims?.obj_name ?? "item"}`,
          data: { claimId, itemId: currentItemForClaims?.id, claimer: found?.claimer },
        });
      } catch {}
      setDialogMessage("Claim approved successfully!");
      setShowSuccessDialog(true);
      fetchItems();
      if (currentItemForClaims) handleSeeClaims(currentItemForClaims);
    } catch (err: any) {
      console.error(err);
      setDialogMessage("Failed to approve claim.");
      setShowErrorDialog(true);
    }
  };

  // Mark item received
  const handleMarkReceived = async (claimId: number, studentId: number) => {
    try {
      await lostFoundAPI.markItemReceived(studentId, claimId);
      setDialogMessage("Item marked as received!");
      setShowSuccessDialog(true);

      // Remove the corresponding item from the UI
      setItems((prev) =>
        prev.filter((item) => item.id !== (currentItemForClaims?.id ?? -1))
      );

      // Close the claims modal
      setClaimsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setDialogMessage("Failed to mark item as received.");
      setShowErrorDialog(true);
    }
  };
  

  // Fetch claims
  const handleSeeClaims = async (item: LostFoundItem) => {
    try {
      const foundClaims = await lostFoundAPI.getAdminFoundAndClaims();
      const itemClaims = foundClaims.find((i: any) => i.id === item.id)?.claim || [];
      setClaimsList(itemClaims);
      setCurrentItemForClaims(item);
      setClaimsModalOpen(true);
    } catch (err) {
      console.error(err);
      setDialogMessage("Failed to fetch claims.");
      setShowErrorDialog(true);
    }
  };

  const handleViewDetails = (item: LostFoundItem) => {
    setSelectedItem(item);
    setShowViewDialog(true);
  };

  const renderItemCard = (item: LostFoundItem) => (
    <Card
      key={item.id}
      className="hover:shadow-md transition-all cursor-pointer border border-border"
    >
      <CardContent className="pt-6 space-y-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold">{item.obj_name}</h3>
          <Badge
            variant="secondary"
            className={item.status === "Claimed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}
          >
            {item.status || "Unclaimed"}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">{item.obj_description}</p>

        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Location:</span> {item.trip_id ? `Shuttle Route ${item.trip_id}` : "N/A"}
          </p>
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Category:</span> {item.obj_type}
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => handleViewDetails(item)}
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          {item.type === "Found" && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => handleSeeClaims(item)}
            >
              <Users className="w-4 h-4 mr-1" />
              Claims
            </Button>
          )}
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setItemToDelete(item)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const lost = items.filter((i) => i.type === "Lost");
  const found = items.filter((i) => i.type === "Found");

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Admin Lost & Found</h1>
          <p className="text-muted-foreground">Manage all reported lost and found items</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowLostDialog(true)}>
            <Plus className="w-4 h-4 mr-1" /> Report Lost Item
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowFoundDialog(true)}>
            <Plus className="w-4 h-4 mr-1" /> Report Found Item
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Found Items Section */}
        <section>
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-1 h-12 bg-green-500 rounded-full"></div>
              <div>
                <h2 className="text-2xl font-bold">Found Items</h2>
                <p className="text-sm text-muted-foreground">Items found and waiting to be claimed</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-base px-4 py-2 font-semibold">
              {found.length} items
            </Badge>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {found.length === 0 ? (
              <Card className="col-span-full border-dashed">
                <CardContent className="py-10 text-center">
                  <p className="text-base text-muted-foreground">No found items to display.</p>
                </CardContent>
              </Card>
            ) : (
              found.map(renderItemCard)
            )}
          </div>
        </section>

        {/* Lost Items Section */}
        <section>
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-1 h-12 bg-red-500 rounded-full"></div>
              <div>
                <h2 className="text-2xl font-bold">Lost Items</h2>
                <p className="text-sm text-muted-foreground">Items reported as lost by passengers</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-base px-4 py-2 font-semibold">
              {lost.length} items
            </Badge>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {lost.length === 0 ? (
              <Card className="col-span-full border-dashed">
                <CardContent className="py-10 text-center">
                  <p className="text-base text-muted-foreground">No lost items reported yet.</p>
                </CardContent>
              </Card>
            ) : (
              lost.map(renderItemCard)
            )}
          </div>
        </section>
      </div>

      {/* View Item Dialog */}
      {selectedItem && (
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedItem.obj_name}</DialogTitle>
              <DialogDescription>
                {selectedItem.obj_description}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Type:</strong> {selectedItem.obj_type}
              </p>
              <p>
                <strong>Status:</strong> {selectedItem.status || "Unclaimed"}
              </p>
              {selectedItem.trip_id && (
                <p>
                  <strong>Trip ID:</strong> {selectedItem.trip_id}
                </p>
              )}
              {selectedItem.date && (
                <p>
                  <strong>Date:</strong> {selectedItem.date}
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Claims Modal */}
      <Dialog open={claimsModalOpen} onOpenChange={setClaimsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Claims for: {currentItemForClaims?.obj_name}</DialogTitle>
            <DialogDescription>List of students who claimed this found item.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {claimsList.length ? claimsList.map((c) => (
              <div key={c.id} className="flex justify-between items-center gap-2 border p-2 rounded">
                <div>
                  <p><span className="font-semibold">Name:</span> {c.claimer.first_name} {c.claimer.last_name}</p>
                  <p><span className="font-semibold">Email:</span> {c.claimer.email}</p>
                  <p className="text-sm text-muted-foreground"><span className="font-semibold">Status:</span> {c.status}</p>
                </div>
                <div className="flex gap-1">
                  {c.status !== "approved" && (
                    <Button size="sm" variant="outline" onClick={() => handleApproveClaim(c.id)}>Approve</Button>
                  )}
                  {c.status === "approved" && (
                    <Button size="sm" variant="default" onClick={() => handleMarkReceived(c.id, c.claimer.id)}>Mark Received</Button>
                  )}
                </div>
              </div>
            )) : <p className="text-muted-foreground">No claims yet.</p>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Lost Item Dialog */}
      <Dialog open={showLostDialog} onOpenChange={setShowLostDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Report Lost Item</DialogTitle>
            <DialogDescription>Fill in the details to report a lost item.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="lost_obj_name" className="block text-sm font-medium mb-2">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                id="lost_obj_name"
                type="text"
                placeholder="e.g., Blue Backpack, iPhone 13"
                value={newLostItem.obj_name}
                onChange={(e) => setNewLostItem({ ...newLostItem, obj_name: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label htmlFor="lost_obj_description" className="block text-sm font-medium mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="lost_obj_description"
                placeholder="Provide detailed description..."
                value={newLostItem.obj_description}
                onChange={(e) => setNewLostItem({ ...newLostItem, obj_description: e.target.value })}
                className="w-full p-2 border rounded min-h-[80px]"
              />
            </div>

            <div>
              <label htmlFor="lost_obj_type" className="block text-sm font-medium mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <input
                id="lost_obj_type"
                type="text"
                placeholder="e.g., Electronics, Clothing, Accessories"
                value={newLostItem.obj_type}
                onChange={(e) => setNewLostItem({ ...newLostItem, obj_type: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label htmlFor="lost_trip_id" className="block text-sm font-medium mb-2">
                Trip ID <span className="text-muted-foreground text-xs">(optional)</span>
              </label>
              <input
                id="lost_trip_id"
                type="number"
                placeholder="Enter trip ID if known"
                value={newLostItem.trip_id || ""}
                onChange={(e) => setNewLostItem({ ...newLostItem, trip_id: Number(e.target.value) })}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleReportLost}>Submit</Button>
              <Button variant="outline" onClick={() => setShowLostDialog(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Found Item Dialog */}
      <Dialog open={showFoundDialog} onOpenChange={setShowFoundDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Report Found Item</DialogTitle>
            <DialogDescription>Fill in the details to report a found item.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="found_obj_name" className="block text-sm font-medium mb-2">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                id="found_obj_name"
                type="text"
                placeholder="e.g., Blue Backpack, iPhone 13"
                value={newFoundItem.obj_name}
                onChange={(e) => setNewFoundItem({ ...newFoundItem, obj_name: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label htmlFor="found_obj_description" className="block text-sm font-medium mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="found_obj_description"
                placeholder="Provide detailed description..."
                value={newFoundItem.obj_description}
                onChange={(e) => setNewFoundItem({ ...newFoundItem, obj_description: e.target.value })}
                className="w-full p-2 border rounded min-h-[80px]"
              />
            </div>

            <div>
              <label htmlFor="found_obj_type" className="block text-sm font-medium mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <input
                id="found_obj_type"
                type="text"
                placeholder="e.g., Electronics, Clothing, Accessories"
                value={newFoundItem.obj_type}
                onChange={(e) => setNewFoundItem({ ...newFoundItem, obj_type: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label htmlFor="found_trip_id" className="block text-sm font-medium mb-2">
                Trip ID <span className="text-muted-foreground text-xs">(optional)</span>
              </label>
              <input
                id="found_trip_id"
                type="number"
                placeholder="Enter trip ID if known"
                value={newFoundItem.trip_id || ""}
                onChange={(e) => setNewFoundItem({ ...newFoundItem, trip_id: Number(e.target.value) })}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleReportFound}>Submit</Button>
              <Button variant="outline" onClick={() => setShowFoundDialog(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Success!</DialogTitle>
            <DialogDescription>{dialogMessage}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setShowSuccessDialog(false)}>
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>{dialogMessage}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowErrorDialog(false)}>
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
