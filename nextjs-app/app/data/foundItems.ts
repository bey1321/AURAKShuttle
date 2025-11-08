import { LostFoundItem, BackendFoundItem } from "./types";
import { lostFoundAPI } from "../lib/api";

// Convert backend found item to frontend format
function mapFoundItemToFrontend(
  item: BackendFoundItem,
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
    type: "Found" as const,
    reportedBy: "User", // Will need to get from finder relationship
    createdAt: dateStr,
    tripId: item.trip_id,
  };
}

// Fetch found items from backend
export async function getFoundItems(): Promise<LostFoundItem[]> {
  try {
    const data = await lostFoundAPI.getFoundItems();
    // The API returns { found_items: [...] }
    const items = data.found_items || [];
    return items.map((item: BackendFoundItem) => mapFoundItemToFrontend(item));
  } catch (error) {
    console.error("Error fetching found items:", error);
    throw error;
  }
}

// Report a found item
export async function reportFoundItem(data: {
  objName: string;
  objDescription: string;
  objType: string;
  tripId: number;
}): Promise<LostFoundItem> {
  try {
    const response = await lostFoundAPI.reportFoundItem(data);
    return mapFoundItemToFrontend(response.found_item);
  } catch (error) {
    console.error("Error reporting found item:", error);
    throw error;
  }
}

// Legacy export for backward compatibility
export const foundItems: LostFoundItem[] = [];
