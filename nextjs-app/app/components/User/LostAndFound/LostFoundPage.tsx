"use client";

import React, { useState, useEffect } from "react";
import { Eye, Plus, Hand } from "lucide-react";
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
} from "../../ui";
import { lostFoundAPI } from "../../../lib/api";
import { addNotification } from "../../../lib/localNotifications";

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

export function LostFoundPage() {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportType, setReportType] = useState<"Lost" | "Found">("Lost");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
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

  // ✅ Claim found item
  const handleApproveClaim = async (item: LostFoundItem) => {
    try {
      await lostFoundAPI.claimItem(item.id);
      // Add a frontend-only notification so the student sees feedback in their dashboard
      try {
        addNotification({ type: "info", message: `Claim submitted for ${item.obj_name}`, data: { itemId: item.id } });
      } catch {}
      setDialogMessage("Claim made successfully!");
      setShowSuccessDialog(true);
      fetchItems();
    } catch (err: any) {
      console.error("❌ Failed to make claim:", err);
      setDialogMessage(err?.message || "Failed to make claim. Please try again.");
      setShowErrorDialog(true);
    }
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
      setDialogMessage(`${reportType} item reported successfully!`);
      setShowSuccessDialog(true);
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
      setDialogMessage(err?.message || "Failed to report item. Please try again.");
      setShowErrorDialog(true);
    }
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
            <span className="font-medium text-foreground">Reported by:</span> {item.type === "Found" ? "Driver" : "Passenger"}
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
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                handleApproveClaim(item);
              }}
            >
              <Hand className="w-4 h-4 mr-1" />
              Claim
            </Button>
          )}
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
          <h1 className="text-2xl font-semibold">Lost & Found</h1>
          <p className="text-muted-foreground">
            View items and report lost or found items
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleOpenReportDialog("Found")}
            size="lg"
            className="gap-2"
            variant="outline"
          >
            <Plus className="w-4 h-4" /> Report Found Item
          </Button>
          <Button
            onClick={() => handleOpenReportDialog("Lost")}
            size="lg"
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> Report Lost Item
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

      {/* Report Item Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Report {reportType} Item</DialogTitle>
            <DialogDescription>
              Fill out the form to report a new {reportType.toLowerCase()} item.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="obj_name" className="block text-sm font-medium mb-2">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                id="obj_name"
                className="w-full border p-2 rounded"
                placeholder="e.g., Blue Backpack, iPhone 13"
                value={newItemData.obj_name}
                onChange={(e) =>
                  setNewItemData({ ...newItemData, obj_name: e.target.value })
                }
              />
            </div>

            <div>
              <label htmlFor="obj_description" className="block text-sm font-medium mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="obj_description"
                className="w-full border p-2 rounded min-h-[80px]"
                placeholder="Provide detailed description of the item..."
                value={newItemData.obj_description}
                onChange={(e) =>
                  setNewItemData({ ...newItemData, obj_description: e.target.value })
                }
              />
            </div>

            <div>
              <label htmlFor="obj_type" className="block text-sm font-medium mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <input
                id="obj_type"
                className="w-full border p-2 rounded"
                placeholder="e.g., Electronics, Clothing, Accessories"
                value={newItemData.obj_type}
                onChange={(e) =>
                  setNewItemData({ ...newItemData, obj_type: e.target.value })
                }
              />
            </div>

            <div>
              <label htmlFor="trip_id" className="block text-sm font-medium mb-2">
                Trip ID <span className="text-muted-foreground text-xs">(optional)</span>
              </label>
              <input
                id="trip_id"
                className="w-full border p-2 rounded"
                type="number"
                placeholder="Enter trip ID if known"
                value={newItemData.trip_id || ""}
                onChange={(e) =>
                  setNewItemData({
                    ...newItemData,
                    trip_id: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
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
