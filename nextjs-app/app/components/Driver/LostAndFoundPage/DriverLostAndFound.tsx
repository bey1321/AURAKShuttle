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
  Label,
  Textarea,
  Badge,
} from "../../ui";
import { lostFoundAPI } from "../../../lib/api";

// Backend-aligned interface
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

export default function DriverLostFoundPage() {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [reportType, setReportType] = useState<"Lost" | "Found">("Found");
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);

  const [formData, setFormData] = useState({
    obj_name: "",
    obj_description: "",
    obj_type: "",
    trip_id: 0,
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
        setError(null);
        const [lostResponse, foundResponse] = await Promise.all([
          lostFoundAPI.getLostItems(),
          lostFoundAPI.getFoundItems(),
        ]);
        
        console.log("Lost items response:", lostResponse);
        console.log("Found items response:", foundResponse);
        
        // Map lost items and add type
        const lostItems = ((lostResponse as any)["lost items"] || []).map((item: any) => ({
          ...item,
          type: "Lost" as const,
        }));
        
        // Map found items and add type
        const foundItems = (foundResponse.found_items || []).map((item: any) => ({
          ...item,
          type: "Found" as const,
        }));
        
        console.log("Processed lost items:", lostItems);
        console.log("Processed found items:", foundItems);
        
        setItems([...lostItems, ...foundItems]);
      } catch (error) {
        console.error("Error fetching lost and found items:", error);
        setError("Failed to load items. Please try again.");
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredItems = (type: "Lost" | "Found") => {
    if (!Array.isArray(items)) return [];
    
    const filtered = items.filter(
      (item) =>
        item &&
        item.type === type &&
        (categoryFilter === "all" ||
          item.obj_type?.toLowerCase() === categoryFilter.toLowerCase()) &&
        (statusFilter === "all" ||
          item.status?.toLowerCase() === statusFilter.toLowerCase()) &&
        (item.obj_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.obj_description?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    console.log(`Filtered ${type} items:`, filtered);
    console.log(`Total items:`, items);
    console.log(`Filters - category: ${categoryFilter}, status: ${statusFilter}, search: ${searchQuery}`);
    
    return filtered;
  };

  const handleSubmitReport = async () => {
    if (!formData.obj_name || !formData.obj_description || !formData.obj_type) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      if (reportType === "Found") {
        await lostFoundAPI.reportFoundItem(formData);
      } else {
        await lostFoundAPI.reportLostItem(formData);
      }
      
      alert(`${reportType} item reported successfully!`);
      setFormData({
        obj_name: "",
        obj_description: "",
        obj_type: "",
        trip_id: 0,
      });
      setShowReportDialog(false);
      
      // Refetch items to get updated list
      const [lostResponse, foundResponse] = await Promise.all([
        lostFoundAPI.getLostItems(),
        lostFoundAPI.getFoundItems(),
      ]);
      
      const lostItems = ((lostResponse as any)["lost items"] || []).map((item: any) => ({
        ...item,
        type: "Lost" as const,
      }));
      const foundItems = (foundResponse.found_items || []).map((item: any) => ({
        ...item,
        type: "Found" as const,
      }));
      
      setItems([...lostItems, ...foundItems]);
    } catch (error: any) {
      console.error("Error reporting item:", error);
      alert(error?.message || "Failed to report item. Please try again.");
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Lost & Found</h1>
          <p className="text-muted-foreground">View passenger lost items and report found items</p>
        </div>
        <Button
          onClick={() => {
            setReportType("Found");
            setShowReportDialog(true);
          }}
          size="lg"
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> Report Found Item
        </Button>
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
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="claimed">Claimed</SelectItem>
              <SelectItem value="unclaimed">Unclaimed</SelectItem>
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

      {error && !loading && (
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-8">
          {/* Found Items Section */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-2 h-10 bg-green-500 rounded-full"></div>
              <div>
                <h2 className="text-2xl font-bold">Found Items</h2>
                <p className="text-base text-muted-foreground">Items found and waiting to be claimed</p>
              </div>
              <Badge variant="outline" className="ml-auto text-base px-3 py-1">
                {filteredItems("Found").length} items
              </Badge>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredItems("Found").length === 0 ? (
                <Card className="col-span-full border-dashed">
                  <CardContent className="py-10 text-center">
                    <p className="text-base text-muted-foreground">No found items to display.</p>
                  </CardContent>
                </Card>
              ) : (
                filteredItems("Found").map((item) => (
                  <Card 
                    key={item.id} 
                    className="hover:shadow-lg transition-all border-l-4 border-l-green-500 cursor-pointer bg-green-50/30"
                    onClick={() => {
                      setSelectedItem(item);
                      setShowViewDialog(true);
                    }}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          {item.obj_name}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={item.status === "Claimed" ? "bg-green-100 text-green-800 border-green-300 text-sm font-semibold" : "bg-amber-100 text-amber-800 border-amber-300 text-sm font-semibold"}
                        >
                          {item.status || "Unclaimed"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-base text-gray-700 line-clamp-2 leading-relaxed">{item.obj_description}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-sm px-2.5 py-0.5">
                          {item.obj_type}
                        </Badge>
                        {item.trip_id && (
                          <span className="text-sm text-muted-foreground font-medium">Trip #{item.trip_id}</span>
                        )}
                      </div>
                      <div className="pt-3 border-t">
                        {item.date && (
                          <p className="text-sm text-gray-600">
                            Date: <span className="font-semibold text-gray-800">{new Date(item.date).toLocaleDateString()}</span>
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </section>

          {/* Lost Items Section */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-2 h-10 bg-red-500 rounded-full"></div>
              <div>
                <h2 className="text-2xl font-bold">Lost Items</h2>
                <p className="text-base text-muted-foreground">Items reported as lost by passengers</p>
              </div>
              <Badge variant="outline" className="ml-auto text-base px-3 py-1">
                {filteredItems("Lost").length} items
              </Badge>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredItems("Lost").length === 0 ? (
                <Card className="col-span-full border-dashed">
                  <CardContent className="py-10 text-center">
                    <p className="text-base text-muted-foreground">No lost items reported yet.</p>
                  </CardContent>
                </Card>
              ) : (
                filteredItems("Lost").map((item) => (
                  <Card 
                    key={item.id} 
                    className="hover:shadow-lg transition-all border-l-4 border-l-red-500 cursor-pointer bg-red-50/30"
                    onClick={() => {
                      setSelectedItem(item);
                      setShowViewDialog(true);
                    }}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                          {item.obj_name}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={item.status === "Claimed" ? "bg-green-100 text-green-800 border-green-300 text-sm font-semibold" : "bg-amber-100 text-amber-800 border-amber-300 text-sm font-semibold"}
                        >
                          {item.status || "Unclaimed"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-base text-gray-700 line-clamp-2 leading-relaxed">{item.obj_description}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-sm px-2.5 py-0.5">
                          {item.obj_type}
                        </Badge>
                        {item.trip_id && (
                          <span className="text-sm text-muted-foreground font-medium">Trip #{item.trip_id}</span>
                        )}
                      </div>
                      <div className="pt-3 border-t">
                        {item.date && (
                          <p className="text-sm text-gray-600">
                            Date: <span className="font-semibold text-gray-800">{new Date(item.date).toLocaleDateString()}</span>
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {/* Report Item Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Report {reportType} Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-4">
                <div className="space-y-2">
                  <Label>
                    Item Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.obj_name}
                    onChange={(e) => setFormData({ ...formData, obj_name: e.target.value })}
                    placeholder="e.g., Backpack, Phone, Keys"
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    value={formData.obj_description}
                    onChange={(e) => setFormData({ ...formData, obj_description: e.target.value })}
                    placeholder="Provide details about the item..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.obj_type}
                    onValueChange={(value) => setFormData({ ...formData, obj_type: value })}
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
                  <Label>
                    Trip ID <span className="text-muted-foreground text-xs">(optional)</span>
                  </Label>
                  <Input
                    type="number"
                    value={formData.trip_id || ""}
                    onChange={(e) => setFormData({ ...formData, trip_id: parseInt(e.target.value) || 0 })}
                    placeholder="Enter trip ID if known"
                  />
                </div>

                <div className="flex gap-2 mt-4">
                  <Button onClick={handleSubmitReport} className="flex-1">
                    Submit Report
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowReportDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* View Item Modal */}
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
    </div>
  );
}
