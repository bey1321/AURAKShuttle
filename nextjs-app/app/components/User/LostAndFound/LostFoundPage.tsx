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
} from "../../ui";
import { lostItems, foundItems } from "../../../data/database";
import { LostFoundItem } from "./ItemSchema";
import FoundItem from "./FoundItem";
import LostItem from "./LostItem";
import ClaimForm from "./ClaimForm";
import ReportItem from "./ReportItem";

export function LostFoundPage() {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reportType, setReportType] = useState<"Lost" | "Found">("Found");
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);

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
    ClaimerSchoolID: "",
    PhoneNumber: "",
    SchoolEmail: "",
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
    setItems([...foundItems, ...lostItems]);
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

  const handleSubmitReport = () => {
    if (!formData.item || !formData.description || !formData.reportedBy) return;

    const newItem: LostFoundItem = {
      ...formData,
      id: Date.now(),
      status: "Unclaimed",
      type: reportType,
      createdAt: new Date().toISOString(),
      date: new Date().toISOString().split("T")[0],
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

  const handleClaimSubmit = () => {
    if (!selectedItem) return;

    const updated = items.map((i) =>
      i.id === selectedItem.id
        ? {
            ...i,
            status: "Claimed", // status changes
            claimedInfo: [
              ...(i.claimedInfo || []),
              { ...claimForm, date: new Date().toISOString() },
            ], // append new claim
          }
        : i
    );

    setItems(updated);

    // Reset the claim form
    setClaimForm({
      claimedBy: "",
      ClaimerSchoolID: "",
      PhoneNumber: "",
      SchoolEmail: "",
    });

    // Keep claim dialog open if needed
    setShowClaimDialog(false);
  };


  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Lost & Found</h1>
          <p className="text-muted-foreground">
            View, report, and claim lost and found items
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setReportType("Lost");
              setShowReportDialog(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Report Lost
          </Button>
          <Button
            variant="outline"
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

      {/* Found Items */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Found Items</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems("Found").map((item) => (
            <FoundItem
              key={item.id}
              item={item}
              onView={setSelectedItem}
              onClaim={(i) => {
                setSelectedItem(i);
                setShowClaimDialog(true);
              }}
            />
          ))}
        </div>
      </section>

      {/* Lost Items */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Lost Items</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems("Lost").map((item) => (
            <LostItem key={item.id} item={item} onView={setSelectedItem} />
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

      <ClaimForm
        open={showClaimDialog}
        onClose={setShowClaimDialog}
        claimForm={claimForm}
        setClaimForm={setClaimForm}
        onSubmit={handleClaimSubmit}
      />
    </div>
  );
}
