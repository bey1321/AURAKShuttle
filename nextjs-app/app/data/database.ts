// Central mock database - exports all data
export { schedules } from './schedules';
export { lostItems } from './lostItems';
export { foundItems } from "./foundItems";
export { activeShuttles } from './activeShuttles';
export { trips, assignedTrips, todayTrips, upcomingTrips } from './trips';
export { drivers } from './drivers';
export { notifications } from './notifications';
export { recentTrips, myFeedback } from './feedback';
export { routes } from './route';
export { users } from './user';
export { admins } from "./admin";
export { buses } from "./buses";
export { adminStats, driverStats, nextShuttle } from './stats';

// Re-export types
export * from './types';
