"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, Package, Plus, Eye, Hand } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
  Label,
  Textarea,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui";
import { LostFoundItem } from "../data/types";
import { lostItems } from "../data/database";
import { foundItems } from "../data/database";

export function LostFoundPage() {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);
  const [reportType, setReportType] = useState<"Lost" | "Found">("Found");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formData, setFormData] = useState({
    item: "",
    description: "",
    date: "",
    location: "",
    category: "",
    reportedBy: "",
    contactInfo: "",
  });

  const [claimForm, setClaimForm] = useState({
    claimedBy: "",
    contactInfo: "",
    notes: "",
  });

  // ✅ Load only from data files, not localStorage
  useEffect(() => {
    setItems([...foundItems, ...lostItems]);
  }, []);

  // ✅ Filters
  const filteredLost = items.filter(
    (item) =>
      item.type === "Lost" &&
      (categoryFilter === "all" ||
        item.category.toLowerCase() === categoryFilter.toLowerCase()) &&
      (statusFilter === "all" ||
        item.status.toLowerCase() === statusFilter.toLowerCase()) &&
      (item.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredFound = items.filter(
    (item) =>
      item.type === "Found" &&
      (categoryFilter === "all" ||
        item.category.toLowerCase() === categoryFilter.toLowerCase()) &&
      (statusFilter === "all" ||
        item.status.toLowerCase() === statusFilter.toLowerCase()) &&
      (item.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // ✅ Submit new lost/found report
  const handleSubmitReport = () => {
    if (!formData.item || !formData.description || !formData.reportedBy) return;

    const newItem: LostFoundItem = {
      id: Date.now(),
      item: formData.item,
      description: formData.description,
      date: formData.date || new Date().toISOString().split("T")[0],
      location: formData.location,
      status: "Unclaimed",
      category: formData.category,
      type: reportType,
      reportedBy: formData.reportedBy,
      contactInfo: formData.contactInfo,
      createdAt: new Date().toISOString(),
    };

    setItems((prev) => [...prev, newItem]);
    setFormData({
      item: "",
      description: "",
      date: "",
      location: "",
      category: "",
      reportedBy: "",
      contactInfo: "",
    });
    setShowReportDialog(false);
  };

  // ✅ Claim item (only for Found items)
  const handleClaimItem = (item: LostFoundItem) => {
    setSelectedItem(item);
    setShowClaimDialog(true);
  };

  const handleSubmitClaim = () => {
    if (!claimForm.claimedBy || !claimForm.contactInfo) return;

    const updatedItems = items.map((i) => {
      if (i.id === selectedItem?.id) {
        const alreadyClaimed = i.status === "Claimed";

        return {
          ...i,
          // ✅ If not already claimed, mark as Claimed
          status: alreadyClaimed ? i.status : "Claimed",
          claimedInfo: [
            ...(i.claimedInfo || []),
            {
              claimedBy: claimForm.claimedBy,
              contactInfo: claimForm.contactInfo,
              notes: claimForm.notes,
              date: new Date().toISOString(),
            },
          ],
        };
      }
      return i;
    });

    setItems(updatedItems);
    setShowClaimDialog(false);
    setClaimForm({ claimedBy: "", contactInfo: "", notes: "" });
  };


  const handleViewDetails = (item: LostFoundItem) => {
    setSelectedItem(item);
    setShowDetailsDialog(true);
  };

  const categories = [
    "Bag",
    "Electronics",
    "Documents",
    "Personal",
    "Clothing",
    "Books",
    "Keys",
    "Other",
  ];

  // ✅ Render Item Card (No delete, no admin buttons)
  const renderItemCard = (item: LostFoundItem) => (
    <Card key={item.id} className="hover:shadow-md transition-shadow">
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
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => handleViewDetails(item)}
          >
            <Eye className="w-4 h-4 mr-1" /> View
          </Button>

          {/* Only Found items can be claimed */}
          {item.type === "Found" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleClaimItem(item)}
            >
              <Hand className="w-4 h-4 mr-1" /> Claim
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Lost & Found</h1>
          <p className="text-muted-foreground">
            View, report, and claim lost and found items
          </p>
        </div>

        {/* Report Buttons */}
        <div className="flex gap-2">
          <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => setReportType("Lost")} variant="default">
                <Plus className="w-4 h-4 mr-2" />
                Report Lost Item
              </Button>
            </DialogTrigger>
            <DialogTrigger asChild>
              <Button onClick={() => setReportType("Found")} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Report Found Item
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  Report {reportType === "Lost" ? "Lost" : "Found"} Item
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-4">
                <div className="space-y-2">
                  <Label>Item Name</Label>
                  <Input
                    placeholder="Enter item name"
                    value={formData.item}
                    onChange={(e) =>
                      setFormData({ ...formData, item: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe the item..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    placeholder="Where?"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
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
                </div>
                <div className="space-y-2">
                  <Label>Your Name</Label>
                  <Input
                    value={formData.reportedBy}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reportedBy: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Info</Label>
                  <Input
                    value={formData.contactInfo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contactInfo: e.target.value,
                      })
                    }
                  />
                </div>
                <Button className="w-full" onClick={handleSubmitReport}>
                  Submit Report
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-gray-200 border-none">
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Unclaimed">Unclaimed</SelectItem>
                <SelectItem value="Requested">Requested</SelectItem>
                <SelectItem value="Claimed">Claimed</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("all");
                setStatusFilter("all");
              }}
            >
              <Filter className="w-4 h-4 mr-1" /> Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Found Items */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Found Items</h2>
        {filteredFound.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFound.map(renderItemCard)}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No found items.</p>
        )}
      </div>

      {/* Lost Items */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Lost Items</h2>
        {filteredLost.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLost.map(renderItemCard)}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No lost items.</p>
        )}
      </div>

      {/* Claim Form Dialog */}
      <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Claim Item</DialogTitle>
            <DialogDescription>
              Fill out this form to request a claim. The admin will review your
              submission.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="space-y-2">
              <Label>Your Name</Label>
              <Input
                value={claimForm.claimedBy}
                onChange={(e) =>
                  setClaimForm({ ...claimForm, claimedBy: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Contact Info</Label>
              <Input
                value={claimForm.contactInfo}
                onChange={(e) =>
                  setClaimForm({ ...claimForm, contactInfo: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional info..."
                value={claimForm.notes}
                onChange={(e) =>
                  setClaimForm({ ...claimForm, notes: e.target.value })
                }
              />
            </div>
            <Button className="w-full" onClick={handleSubmitClaim}>
              Submit Claim
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
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

              {selectedItem.claimedInfo &&
                selectedItem.claimedInfo.length > 0 && (
                  <div className="mt-3 border-t pt-2">
                    <p className="font-semibold mb-1">Claim History:</p>
                    {selectedItem.claimedInfo.map((claim, index) => (
                      <div key={index} className="ml-3 border-l pl-2 text-xs">
                        <p>Claimed By: {claim.claimedBy}</p>
                        <p>Contact: {claim.contactInfo}</p>
                        <p>Notes: {claim.notes}</p>
                        <p>Date: {new Date(claim.date).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
