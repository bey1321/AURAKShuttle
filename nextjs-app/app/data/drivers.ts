import { Driver } from "../data/types";
import { adminAPI } from "../lib/api";

// Convert backend driver to frontend format
function mapDriverToFrontend(driver: any): Driver {
  return {
    id: driver.id,
    first_name: driver.first_name,
    last_name: driver.last_name,
    email: driver.email,
    role: "driver" as const,
    phone: driver.phone || undefined,
  };
}

// Fetch drivers from backend
export async function getDrivers(): Promise<Driver[]> {
  try {
    const data = await adminAPI.getDrivers();
    return data.map(mapDriverToFrontend);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    throw error;
  }
}

// Legacy export for backward compatibility
export const drivers: Driver[] = [];
