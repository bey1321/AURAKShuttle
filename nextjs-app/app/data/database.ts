// Central data exports - now using API calls
export * from "./types";

// Re-export API functions
export { getBuses } from "./buses";
export { getTerminals } from "./terminals";
export { getDrivers } from "./drivers";
export { getMyTrips, getAllTrips, getTripsForFeedback } from "./trips";
export { getLostItems, reportLostItem } from "./lostItems";
export { getFoundItems, reportFoundItem } from "./foundItems";
export { getMyFeedback, getRecentTrips } from "./feedback";

// Legacy exports for backward compatibility (now empty arrays)
export { buses } from "./buses";
export { terminals } from "./terminals";
export { drivers } from "./drivers";
export { trips, assignedTrips, todayTrips, upcomingTrips } from "./trips";
export { lostItems } from "./lostItems";
export { foundItems } from "./foundItems";
export { myFeedback, recentTrips } from "./feedback";

// Re-export types and other static data
export { schedules } from "./schedules";
export { activeShuttles } from "./activeShuttles";
export { routes } from "./route";
export { users } from "./user";
export { admins } from "./admin";
export { notifications } from "./notifications";
export { adminStats, driverStats, nextShuttle } from "./stats";
