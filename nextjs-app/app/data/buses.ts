import { Bus } from "../data/types";
import { adminAPI } from "../lib/api";

// Convert backend bus to frontend format
function mapBusToFrontend(bus: any): Bus {
  return {
    busID: bus.id,
    id: bus.id,
    plate_num: bus.plate_num,
    no_seats:
      typeof bus.no_seats === "string" ? parseInt(bus.no_seats) : bus.no_seats,
    model: bus.model || null,
    manufacturer: bus.manufacturer || null,
    status: bus.status || null,
  };
}

// Fetch buses from backend
export async function getBuses(): Promise<Bus[]> {
  try {
    const data = await adminAPI.getBuses();
    return data.map(mapBusToFrontend);
  } catch (error) {
    console.error("Error fetching buses:", error);
    throw error;
  }
}

// Legacy export for backward compatibility
export const buses: Bus[] = [];
