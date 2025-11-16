// Type definitions matching backend responses

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
  first_name: string;
  last_name: string;
  email: string;
  role: "student" | "staff" | "driver" | "admin";
  hased_password?: string;
  phone?: number;
}

export interface Admin {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: "admin";
  hased_password?: string;
}

export interface Driver {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: "driver";
  hased_password?: string;
  phone?: number;
}

export interface Claim {
  claimedBy: string;
  ClaimerSchoolID: string;
  PhoneNumber: string;
  SchoolEmail: string;
  date: Date;
}

// Backend Lost Item structure
export interface BackendLostItem {
  id: number;
  obj_name: string;
  obj_description: string;
  obj_type: string;
  date: string;
  status: string;
  trip_id: number;
}

// Backend Found Item structure
export interface BackendFoundItem {
  id: number;
  obj_name: string;
  obj_description: string;
  obj_type: string;
  date: string;
  status: string;
  trip_id: number;
  finder_id: number;
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
  tripId?: number;
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

// Backend Trip Response structure
export interface BackendTrip {
  id: number;
  route_name: string;
  date: string;
  bus_id: number | null;
  driver_id: number | null;
  route?: {
    id: number;
    name: string;
    start_terminal_id: number;
    type: string;
    start_time: string;
    end_time: string;
    start_terminal?: {
      id: number;
      terminalName: string;
      city: string;
    };
  };
  bus?: {
    id: number;
    plate_num: string;
    no_seats: number;
    model: string | null;
    manufacturer: string | null;
    status: string | null;
  };
  status?: string;
}

export interface Trip {
  id: number;
  date: string;
  schedule?: string; // e.g. "Morning Shuttle" - optional for compatibility
  status: "Active" | "Upcoming" | "In Progress" | "Completed" | "scheduled";
  bus?: string | number | null;
  driver?: string | number | null;
  startTerminal: string;
  middleTerminals: string[];
  stopTerminal: string;
  startTime: string;
  endTime: string;
  ETA?: string;
  type: "regular" | "academic" | "sport" | "Student Life Event";
  passengers?: number;
  route_name?: string;
}

export interface Terminal {
  id: number;
  terminalName: string;
  city: string;
  terminal?: string; // For backward compatibility
}

export interface Bus {
  id?: number; // Backend uses 'id'
  busID?: number; // Frontend uses 'busID' for compatibility
  plate_num: string;
  no_seats: number | string; // Backend sends as string sometimes
  model: string | null;
  manufacturer: string | null;
  status: string | null;
}

export interface Notification {
  id: number;
  type: "info" | "success" | "warning" | "error";
  message: string;
  time: string;
}

export interface Feedback {
  id: number;
  trip_id?: number;
  route: string;
  date: string;
  rating?: number;
  comment: string;
  categories?: {
    cleanliness: number;
    driver: number;
    timeliness: number;
  };
  cleanliness?: number;
  driver_rating?: number;
  timeliness?: number;
  user_id?: number;
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
