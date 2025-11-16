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
  const startTime = route.start_time || trip.start_time || "";
  const endTime = route.end_time || trip.end_time || "";

  // Format date
  const dateStr = trip.date
    ? typeof trip.date === "string"
      ? trip.date.split("T")[0] // Handle ISO date strings
      : trip.date
    : "";

  // Extract middle terminals from route.terminals array
  // The structure is: route.terminals = [{ terminal: { terminalName: "..." }, terminal_id: ... }]
  const middleTerminals: string[] = [];
  if (route.terminals && Array.isArray(route.terminals)) {
    route.terminals.forEach((tt: any) => {
      // Skip the start terminal (it's already in startTerminal)
      const terminalName = tt.terminal?.terminalName;
      if (terminalName && terminalName !== startTerminal) {
        middleTerminals.push(terminalName);
      }
    });
  }

  // Get the last terminal as stop terminal (or use start terminal if no others)
  const stopTerminal = middleTerminals.length > 0 
    ? middleTerminals[middleTerminals.length - 1]
    : startTerminal;

  // Determine status
  const status = trip.status || "scheduled";
  let frontendStatus: Trip["status"] = "Upcoming";
  if (status === "active" || status === "Active") {
    frontendStatus = "Active";
  } else if (status === "completed" || status === "Completed") {
    frontendStatus = "Completed";
  } else if (status === "in_progress" || status === "In Progress") {
    frontendStatus = "In Progress";
  } else if (status === "scheduled") {
    frontendStatus = "Upcoming";
  }

  // Extract driver name if available
  const driverName = trip.driver
    ? `${trip.driver.first_name || ""} ${trip.driver.last_name || ""}`.trim()
    : trip.driver_id?.toString() || null;

  return {
    id: trip.id,
    date: dateStr,
    route_name: routeName,
    status: frontendStatus,
    bus: bus.id
      ? `Bus ${bus.plate_num || bus.id}`
      : trip.bus_id?.toString() || null,
    driver: driverName,
    startTerminal: startTerminal,
    middleTerminals: middleTerminals,
    stopTerminal: stopTerminal,
    startTime: startTime,
    endTime: endTime,
    type: (route.type || trip.type || "regular") as Trip["type"],
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
