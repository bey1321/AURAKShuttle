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
      alert("Lost item reported successfully!");
      setShowLostDialog(false);
      fetchItems();
      setNewLostItem({ obj_name: "", obj_description: "", obj_type: "", trip_id: 0 });
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to report lost item.");
    }
  };

  const handleReportFound = async () => {
    try {
      await lostFoundAPI.reportFoundItem(newFoundItem);
      alert("Found item reported successfully!");
      setShowFoundDialog(false);
      fetchItems();
      setNewFoundItem({ obj_name: "", obj_description: "", obj_type: "", trip_id: 0 });
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to report found item.");
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
      alert("Claim approved successfully!");
      fetchItems();
      if (currentItemForClaims) handleSeeClaims(currentItemForClaims);
    } catch (err: any) {
      console.error(err);
      alert("Failed to approve claim.");
    }
  };

  // Mark item received
  const handleMarkReceived = async (claimId: number, studentId: number) => {
    try {
      await lostFoundAPI.markItemReceived(studentId, claimId);
      alert("Item marked as received!");
  
      // Remove the corresponding item from the UI
      setItems((prev) =>
        prev.filter((item) => item.id !== (currentItemForClaims?.id ?? -1))
      );
  
      // Close the claims modal
      setClaimsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      alert("Failed to mark item as received.");
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
      alert("Failed to fetch claims.");
    }
  };

  const handleViewDetails = (item: LostFoundItem) => {
    setSelectedItem(item);
  };

  const renderItemCard = (item: LostFoundItem) => (
    <Card
      key={item.id}
      className={`hover:shadow-md transition-shadow ${
        item.type === "Found" ? "border-blue-200 bg-blue-50" : "border-red-200 bg-red-50"
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{item.obj_name}</CardTitle>
          <Badge className={item.type === "Found" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"}>
            {item.type}
          </Badge>
        </div>
        <CardDescription>{item.obj_description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p><span className="text-muted-foreground">Category:</span> {item.obj_type}</p>
        <p><span className="text-muted-foreground">Trip ID:</span> {item.trip_id ?? "N/A"}</p>
        {item.status && <p><span className="text-muted-foreground">Status:</span> {item.status}</p>}
        {item.type === "Found" && (
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="outline" onClick={() => handleSeeClaims(item)}>
              <Users className="w-4 h-4 mr-1" /> See Claims
            </Button>
          </div>
        )}
        <div className="flex gap-2 mt-3">
          <Button size="sm" variant="outline" className="flex-1" onClick={() => handleViewDetails(item)}>
            <Eye className="w-4 h-4 mr-1" /> View
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setItemToDelete(item)}>
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

      {/* Found Items */}
      <section className="bg-blue-100/40 border border-blue-200 p-4 rounded-xl shadow-sm">
        <h2 className="text-lg font-semibold mb-3 text-blue-900">Found Items</h2>
        {found.length ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{found.map(renderItemCard)}</div> :
          <p className="text-muted-foreground text-sm">No found items.</p>}
      </section>

      {/* Lost Items */}
      <section className="bg-red-100/40 border border-red-200 p-4 rounded-xl shadow-sm">
        <h2 className="text-lg font-semibold mb-3 text-red-900">Lost Items</h2>
        {lost.length ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{lost.map(renderItemCard)}</div> :
          <p className="text-muted-foreground text-sm">No lost items.</p>}
      </section>

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
    </div>
  );
}
