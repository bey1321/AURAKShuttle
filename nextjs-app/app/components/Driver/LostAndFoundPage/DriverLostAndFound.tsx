"use client";

import React, { useState, useEffect } from "react";
import { Filter, Plus, Search } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Input,
  DialogContent,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../ui";
import {
  getLostItems,
  getFoundItems,
  reportFoundItem,
} from "../../../data/database";
import { LostFoundItem } from "../../User/LostAndFound/ItemSchema";
import FoundItem from "./FoundItem";
import ReportItem from "../../User/LostAndFound/ReportItem";

export default function DriverLostFoundPage() {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reportType, setReportType] = useState<"Lost" | "Found">("Found");
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);

  const [formData, setFormData] = useState({
    item: "",
    description: "",
    date: "",
    location: "",
    category: "",
    reportedBy: "",
    contactInfo: "",
  });

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [lost, found] = await Promise.all([
          getLostItems(),
          getFoundItems(),
        ]);
        setItems([...found, ...lost]);
      } catch (error) {
        console.error("Error fetching lost and found items:", error);
        alert("Failed to load items. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredItems = (type: "Lost" | "Found") =>
    items.filter(
      (item) =>
        item.type === type &&
        (categoryFilter === "all" ||
          item.category.toLowerCase() === categoryFilter.toLowerCase()) &&
        (statusFilter === "all" ||
          item.status.toLowerCase() === statusFilter.toLowerCase()) &&
        (item.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.location.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const handleSubmitReport = async () => {
    if (!formData.item || !formData.description || !formData.category) return;

    // Find trip ID from location - you may need to adjust this logic
    const tripId = parseInt(formData.location) || 1; // Default to 1, but should come from form

    try {
      // Drivers typically report found items
      const reportData = {
        objName: formData.item,
        objDescription: formData.description,
        objType: formData.category,
        tripId: tripId,
      };

      const newItem = await reportFoundItem(reportData);
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
    } catch (error) {
      console.error("Error reporting item:", error);
      alert("Failed to report item. Please try again.");
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Lost & Found</h1>
          <p className="text-muted-foreground">View and report found items</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setReportType("Found");
              setShowReportDialog(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Report Found
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-gray-100 border-none">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
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
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Unclaimed">Unclaimed</SelectItem>
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
            <Filter className="w-4 h-4 mr-1" /> Clear
          </Button>
        </CardContent>
      </Card>

      {loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading items...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Found Items */}
          <section>
            <h2 className="text-lg font-semibold mb-2">Found Items</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems("Found").map((item) => (
                <FoundItem
                  key={item.id}
                  item={item}
                  onView={(item) => {
                    setSelectedItem(item);
                    setShowViewDialog(true);
                  }}
                  onClaim={(i) => {
                    setSelectedItem(i);
                  }}
                />
              ))}
            </div>
          </section>

          {/* Modals */}
          <ReportItem
            open={showReportDialog}
            onOpenChange={setShowReportDialog}
            reportType={reportType}
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmitReport}
            categories={categories}
          />

          {/* View Item Modal */}
          {selectedItem && (
            <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{selectedItem.item}</DialogTitle>
                  <DialogDescription>
                    {selectedItem.description}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Location:</strong> {selectedItem.location}
                  </p>
                  <p>
                    <strong>Reported by:</strong> {selectedItem.reportedBy}
                  </p>
                  <p>
                    <strong>Status:</strong> {selectedItem.status}
                  </p>
                  {selectedItem.contactInfo && (
                    <p>
                      <strong>Contact Info:</strong> {selectedItem.contactInfo}
                    </p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </>
      )}
    </div>
  );
}
