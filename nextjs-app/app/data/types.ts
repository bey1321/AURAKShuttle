// Type definitions for the mock database

export interface Schedule {
  id: number;
  route: string;
  terminal: string; // added terminal field
  driver: string;
  departure: string;
  arrival: string;
  days: string[];
  capacity: number;
  available: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  UserSchoolID: string;
  role: "student" | "staff";
  // phone: string;
}

export interface LostFoundItem {
  id: number;
  item: string;
  description: string;
  date: string;
  location: string;
  status: "Unclaimed" | "Claimed" | "";
  category: string;
  type: "Lost" | "Found";
  reportedBy: string;
  contactInfo?: string;
  createdAt: string;
  claimedInfo?: {
    claimedBy: string;
    contactInfo: string;
    notes: string;
    date: string;
  }[];
}

export interface ActiveShuttle {
  id: number;
  route: string;
  driver: string;
  status: "Moving" | "At Stop" | "Idle";
  occupancy: number;
  passengers: number;
  capacity: number;
  eta: string;
  location: string;
}

export interface Trip {
  id: number;
  route: string;
  driver: string;
  bus: string;
  time: string;
  status: "Active" | "Upcoming" | "In Progress" | "Completed";
  passengers: number;
  // date: Date;
  // schedule: string;
  // startTerminal: string;
  // stopTerminal: string;
  // ETA: TimeRanges;
  // startTime: TimeRanges;
  // endTime: TimeRanges;
}

// export interface Terminal {
//   terminal: string;
//   city: string;
// }

// export interface Bus {
//   plateNumber: string;
//   numberOfSeats: number;
// }

export interface Driver {
  id: number;
  name: string;
  status: "Active" | "Offline";
  trips: number;
  rating: number;
}

export interface Notification {
  id: number;
  type: "info" | "success" | "warning" | "error";
  message: string;
  time: string;
}

export interface Feedback {
  id: number;
  route: string;
  date: string;
  rating: number;
  comment: string;
  categories: {
    cleanliness: number;
    driver: number;
    timeliness: number;
  };
}

export interface RecentTrip {
  id: number;
  route: string;
  date: string;
  driver: string;
  time: string;
}

export interface Route {
  route: string;
  from: string;
  to: string;
  frequency: string;
}

export interface Stats {
  totalTrips: number;
  activeDrivers: number;
  totalStudents: number;
  avgOccupancy: number;
  completedToday?: number;
  inProgress?: number;
  upcoming?: number;
  totalPassengers?: number;
}
