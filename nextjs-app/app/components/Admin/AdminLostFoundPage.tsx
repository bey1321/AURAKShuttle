"use client";

import React, { useState, useEffect } from "react";
import { Eye, Trash2, CheckCircle, Plus } from "lucide-react";
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

// ✅ Backend-aligned interface
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

  // ✅ Fetch from backend routes
  const fetchItems = async () => {
    try {
      const [lostResponse, foundResponse] = await Promise.all([
        lostFoundAPI.getLostItems(),
        lostFoundAPI.getFoundItems(),
      ]);

      // Map lost items and add type
      const lostItems = (lostResponse["lost items"] || []).map((item) => ({
        ...item,
        type: "Lost" as const,
      }));

      // Map found items and add type
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

  // ✅ Approve claim for found item (Admin only)
  const handleApproveClaim = async (item: LostFoundItem) => {
    try {
      // For admin, we need to get the claim ID first
      // This would require fetching claims for the item
      // For now, we'll use the item ID as claim ID (this may need adjustment based on backend)
      await lostFoundAPI.approveClaim(item.id);
      alert("Claim approved successfully!");
      fetchItems();
    } catch (err: any) {
      console.error("❌ Failed to approve claim:", err);
      alert(err?.message || "Failed to approve claim. Please try again.");
    }
  };

  // ✅ Simulated delete (since backend lacks DELETE)
  const handleDeleteConfirmed = async () => {
    if (!itemToDelete) return;
    setItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
    setItemToDelete(null);
  };

  const handleViewDetails = (item: LostFoundItem) => {
    setSelectedItem(item);
    setShowDetailsDialog(true);
  };

  const handleOpenReportDialog = (type: "Lost" | "Found") => {
    setReportType(type);
    setNewItemData({
      obj_name: "",
      obj_description: "",
      obj_type: "",
      trip_id: 0,
    });
    setShowReportDialog(true);
  };

  // ✅ Handle new report submission
  const handleReportSubmit = async () => {
    try {
      if (reportType === "Lost") {
        await lostFoundAPI.reportLostItem({
          obj_name: newItemData.obj_name,
          obj_description: newItemData.obj_description,
          obj_type: newItemData.obj_type,
          trip_id: newItemData.trip_id,
        });
      } else {
        await lostFoundAPI.reportFoundItem({
          obj_name: newItemData.obj_name,
          obj_description: newItemData.obj_description,
          obj_type: newItemData.obj_type,
          trip_id: newItemData.trip_id,
        });
      }
      alert(`${reportType} item reported successfully!`);
      setShowReportDialog(false);
      setNewItemData({
        obj_name: "",
        obj_description: "",
        obj_type: "",
        trip_id: 0,
      });
      fetchItems();
    } catch (err: any) {
      console.error("❌ Failed to report item:", err);
      alert(err?.message || "Failed to report item. Please try again.");
    }
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
              onClick={() => handleApproveClaim(item)}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Claim
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
            onClick={() => handleOpenReportDialog("Lost")}
          >
            <Plus className="w-4 h-4 mr-1" /> Report Lost Item
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOpenReportDialog("Found")}
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
                <strong>Item:</strong> {selectedItem.obj_name}
              </p>
              <p>
                <strong>Description:</strong> {selectedItem.obj_description}
              </p>
              <p>
                <strong>Category:</strong> {selectedItem.obj_type}
              </p>
              <p>
                <strong>Type:</strong> {selectedItem.type}
              </p>
              <p>
                <strong>Status:</strong> {selectedItem.status ?? "N/A"}
              </p>
              <p>
                <strong>Trip ID:</strong> {selectedItem.trip_id ?? "N/A"}
              </p>
              {selectedItem.date && (
                <p>
                  <strong>Date:</strong> {selectedItem.date}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      {itemToDelete && (
        <ConfirmDeleteDialog
          open={!!itemToDelete}
          title={`Delete ${itemToDelete.type} Item`}
          message={`Are you sure you want to delete ${itemToDelete.type.toLowerCase()} item "${
            itemToDelete.obj_name
          }"?`}
          confirmLabel="Delete Item"
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setItemToDelete(null)}
        />
      )}

      {/* Report Item Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Report {reportType} Item</DialogTitle>
            <DialogDescription>
              Fill out the form to report a new {reportType.toLowerCase()} item.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {["obj_name", "obj_description", "obj_type"].map((field) => (
              <input
                key={field}
                className="w-full border p-2 rounded"
                placeholder={
                  field === "obj_name"
                    ? "Item Name"
                    : field === "obj_description"
                    ? "Description"
                    : "Type/Category"
                }
                value={(newItemData as any)[field]}
                onChange={(e) =>
                  setNewItemData({ ...newItemData, [field]: e.target.value })
                }
              />
            ))}
            <input
              className="w-full border p-2 rounded"
              type="number"
              placeholder="Trip ID"
              value={newItemData.trip_id}
              onChange={(e) =>
                setNewItemData({
                  ...newItemData,
                  trip_id: Number(e.target.value),
                })
              }
            />
            <div className="flex justify-end gap-2 mt-2">
              <Button
                variant="outline"
                onClick={() => setShowReportDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleReportSubmit}>Submit</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
