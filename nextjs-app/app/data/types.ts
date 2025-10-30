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
  password: string;
}

export interface Admin{
  id:string;
  name: string;
  email: string;
  role: "admin";
  password: string;
}

export interface Driver {
  id: number;
  name: string;
  email: string;
  status: "Active" | "Offline";
  trips: number;
  rating: number;
  password: string;
}

export interface Claim {
  claimedBy: string;
  ClaimerSchoolID: string;
  PhoneNumber: string;
  SchoolEmail: string;
  date: Date;
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
  claimedInfo?: Claim;
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
  date: string; // use string for easier JSON mock data
  schedule: string; // e.g. "Morning Shuttle"
  status: "Active" | "Upcoming" | "In Progress" | "Completed";
  bus: string;
  driver: string;
  startTerminal: string;
  stopTerminal: string;
  startTime: string;
  endTime: string;
  ETA?: string; // optional
  type: "regular" | "academic" | "sport" | "Student Life Event";
  passengers: number;
}


// export interface Terminal {
//   terminal: string;
//   city: string;
// }

export interface Bus {
  busID: number;
  plateNumber: string;
  numberOfSeats: number;
  model: string;
  manufacturer: string;
  year: number;
  fuelType: "Diesel" | "Electric" | "Hybrid" | "Petrol";
  status: "Active" | "UnderMaintenance" | "Inactive";
  assignment: "Assigned" | "Unassigned";
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
