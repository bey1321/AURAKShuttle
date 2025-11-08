import { LostFoundItem, BackendLostItem } from "./types";
import { lostFoundAPI } from "../lib/api";

// Convert backend lost item to frontend format
function mapLostItemToFrontend(
  item: BackendLostItem,
  tripInfo?: any
): LostFoundItem {
  // Format date
  const dateStr = item.date
    ? typeof item.date === "string"
      ? item.date.split("T")[0]
      : item.date
    : "";

  // Format location from trip info if available
  const location = tripInfo?.route_name || `Trip ${item.trip_id}`;

  // Map status
  let status: LostFoundItem["status"] = "Unclaimed";
  if (item.status === "claimed" || item.status === "Claimed") {
    status = "Claimed";
  }

  return {
    id: item.id,
    item: item.obj_name,
    description: item.obj_description || "",
    date: dateStr,
    location: location,
    status: status,
    category: item.obj_type || "Other",
    type: "Lost" as const,
    reportedBy: "User", // Will need to get from user relationship
    createdAt: dateStr,
    tripId: item.trip_id,
  };
}

// Fetch lost items from backend
export async function getLostItems(): Promise<LostFoundItem[]> {
  try {
    const data = await lostFoundAPI.getLostItems();
    // The API returns { "lost items": [...] }
    const items = data["lost items"] || [];
    return items.map((item: BackendLostItem) => mapLostItemToFrontend(item));
  } catch (error) {
    console.error("Error fetching lost items:", error);
    throw error;
  }
}

// Report a lost item
export async function reportLostItem(data: {
  objName: string;
  objDescription: string;
  objType: string;
  tripId: number;
}): Promise<LostFoundItem> {
  try {
    const response = await lostFoundAPI.reportLostItem(data);
    return mapLostItemToFrontend(response.lost_item);
  } catch (error) {
    console.error("Error reporting lost item:", error);
    throw error;
  }
}

// Legacy export for backward compatibility
export const lostItems: LostFoundItem[] = [];
