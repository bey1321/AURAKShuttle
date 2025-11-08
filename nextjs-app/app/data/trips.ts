import { Trip, BackendTrip } from "./types";
import { tripAPI } from "../lib/api";

// Convert backend trip to frontend format
function mapTripToFrontend(trip: BackendTrip | any): Trip {
  // Extract route information
  const routeName = trip.route_name || trip.route?.name || "Unknown Route";
  const route = trip.route || {};
  const bus = trip.bus || {};

  // Extract terminal information
  const startTerminal = route.start_terminal?.terminalName || "Unknown";
  const startTime = route.start_time || "";
  const endTime = route.end_time || "";

  // Format date
  const dateStr = trip.date
    ? typeof trip.date === "string"
      ? trip.date
      : trip.date.split("T")[0]
    : "";

  // Extract middle terminals - we'll need to get this from the route terminals
  // For now, we'll use an empty array as the backend doesn't directly return this
  const middleTerminals: string[] = [];

  // Determine status
  const status = trip.status || "scheduled";
  let frontendStatus: Trip["status"] = "Upcoming";
  if (status === "active" || status === "Active") {
    frontendStatus = "Active";
  } else if (status === "completed" || status === "Completed") {
    frontendStatus = "Completed";
  } else if (status === "in_progress" || status === "In Progress") {
    frontendStatus = "In Progress";
  }

  return {
    id: trip.id,
    date: dateStr,
    route_name: routeName,
    status: frontendStatus,
    bus: bus.id
      ? `Bus ${bus.plate_num || bus.id}`
      : trip.bus_id?.toString() || null,
    driver: trip.driver_id?.toString() || null,
    startTerminal: startTerminal,
    middleTerminals: middleTerminals,
    stopTerminal: route.start_terminal?.terminalName || "Unknown", // Will need proper mapping
    startTime: startTime,
    endTime: endTime,
    type: (route.type || "regular") as Trip["type"],
    passengers: 0, // Will need to be calculated from reservations
  };
}

// Fetch user's trips from backend
export async function getMyTrips(): Promise<Trip[]> {
  try {
    const data = await tripAPI.getMyTrips();
    return data.map(mapTripToFrontend);
  } catch (error) {
    console.error("Error fetching my trips:", error);
    throw error;
  }
}

// Fetch all trips from backend
export async function getAllTrips(): Promise<Trip[]> {
  try {
    const data = await tripAPI.getAllTrips();
    return data.map(mapTripToFrontend);
  } catch (error) {
    console.error("Error fetching all trips:", error);
    throw error;
  }
}

// Fetch trips for feedback
export async function getTripsForFeedback(): Promise<Trip[]> {
  try {
    const data = await tripAPI.getTripsForFeedback();
    return data.map(mapTripToFrontend);
  } catch (error) {
    console.error("Error fetching trips for feedback:", error);
    throw error;
  }
}

// Legacy exports for backward compatibility
export const trips: Trip[] = [];
export const assignedTrips: Trip[] = [];
export const todayTrips: Trip[] = [];
export const upcomingTrips: Trip[] = [];
