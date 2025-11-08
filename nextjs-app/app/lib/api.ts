// utils/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Generic API call handler
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  // handle non-OK responses safely
  if (!response.ok) {
    let detail = "Unknown error";
    try {
      const err = await response.json();
      detail = err.detail || JSON.stringify(err);
    } catch {
      detail = response.statusText;
    }
    throw new Error(`API ${response.status}: ${detail}`);
  }

  try {
    return await response.json();
  } catch {
    // handle empty 204 or plain responses
    return {} as T;
  }
}

/* ---------------------- AUTH ---------------------- */
export const authAPI = {
  login: (email: string, password: string) =>
    apiCall<{ role: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  signup: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) =>
    apiCall<{ message: string }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

/* ---------------------- ADMIN ---------------------- */
export const adminAPI = {
  // Drivers
  getDrivers: () => apiCall<any[]>("/admin/drivers"),
  createDriver: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) =>
    apiCall<{ message: string; driver_id: number }>("/admin/create/driver", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateDriver: (
    driverId: number,
    data: Partial<{
      email: string;
      first_name: string;
      last_name: string;
      password: string;
    }>
  ) =>
    apiCall<{ message: string; driver_id: number }>(
      `/admin/update/driver/${driverId}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    ),
  deleteDriver: (driverId: number) =>
    apiCall<{ message: string; driver_id: number }>(
      `/admin/delete/driver/${driverId}`,
      { method: "DELETE" }
    ),

  // Buses
  getBuses: () => apiCall<any[]>("/admin/bus"),
  createBus: (data: {
    plate_num: string;
    no_seats: string;
    model?: string;
    manufacturer?: string;
    status?: string;
  }) =>
    apiCall<{ message: string; bus_id: number }>("/admin/create/bus", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateBus: (
    busId: number,
    data: Partial<{
      plate_num: string;
      no_seats: string;
      model?: string;
      manufacturer?: string;
      status?: string;
    }>
  ) =>
    apiCall<{ message: string; bus_id: number }>(`/admin/update/bus/${busId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteBus: (busId: number) =>
    apiCall<{ message: string; bus_id: number }>(`/admin/delete/bus/${busId}`, {
      method: "DELETE",
    }),
  getBusTrips: (busId: number) =>
    apiCall<any[]>(`/admin/get_bus_assigned_trips/${busId}`),

  // Users
  getUsers: () => apiCall<any[]>("/admin/users"),
  createUser: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: string;
  }) =>
    apiCall<{ message: string; user_id: number }>("/admin/create/user", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateUser: (
    userId: number,
    data: Partial<{
      email: string;
      first_name: string;
      last_name: string;
      role: string;
      password: string;
    }>
  ) =>
    apiCall<{ message: string; user_id: number }>(
      `/admin/update/user/${userId}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    ),
  deleteUser: (userId: number) =>
    apiCall<{ message: string; user_id: number }>(
      `/admin/delete/user/${userId}`,
      { method: "DELETE" }
    ),

  // Terminals
  getTerminals: () => apiCall<any[]>("/admin/terminals"),
  createTerminal: (data: { terminalName: string; city: string }) =>
    apiCall<{ message: string }>("/admin/create/terminal", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Trips
  getTrips: () => apiCall<any[]>("/trip/all_trips"),
  updateTrip: (
    tripId: number,
    data: Partial<{
      date: string;
      status: string;
      bus_id: number;
      driver_id: number;
      start_time: string;
      end_time: string;
      name: string;
      type: string;
      start_terminal_id: number;
      terminals: number[];
    }>
  ) =>
    apiCall<{ message: string; trip_id: number }>(
      `/admin/update/trip/${tripId}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    ),
  deleteTrip: (tripId: number) =>
    apiCall<{ message: string; trip_id: number }>(
      `/admin/delete/trip/${tripId}`,
      { method: "DELETE" }
    ),
  createSingleTrip: (data: {
    date: string;
    start_time: string;
    end_time: string;
    name: string;
    status?: string;
    bus_id?: number;
    driver_id?: number;
    start_terminal_id: number;
    type: string;
    terminals: number[];
  }) =>
    apiCall<{ message: string }>("/admin/create_single_trip", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  createSemesterTrips: (data: {
    start_date: string;
    end_date: string;
    days_of_week: string[];
    bus_id?: number;
    driver_id?: number;
    start_terminal_id: number;
    start_time: string;
    end_time: string;
    type: string;
    terminals: number[];
    name: string;
  }) =>
    apiCall<{
      message: string;
      total_trips_created: number;
      semester_info: any;
      trip_details: any[];
      route_info: any;
    }>("/admin/semester_trips", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

/* ---------------------- STUDENT/TRIP ---------------------- */
export const tripAPI = {
  getMyTrips: () => apiCall<any[]>("/trip/get_mytrips"),
  getAllTrips: () => apiCall<any[]>("/trip/all_trips"),
  reserveSeat: (tripId: number) =>
    apiCall<{
      message: string;
      trip_id: number;
      reservation_id: number;
      seats_remaining: number;
      total_seats: number;
    }>(`/trip/reserve_seat/${tripId}`, { method: "POST" }),
  cancelReservation: (tripId: number) =>
    apiCall<{ message: string }>(`/trip/cancel_reservation/${tripId}`, {
      method: "DELETE",
    }),
  getTripsForFeedback: () => apiCall<any[]>("/trip/getTrips_for_feedback"),
  rateTrip: (data: {
    trip_id: number;
    cleanliness: number;
    driver_rating: number;
    timeliness: number;
    comment: string;
  }) =>
    apiCall<{ message: string }>("/trip/rate_trip", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getMyReviews: () => apiCall<any>("/trip/my_reviews"),
};

/* ---------------------- DRIVER ---------------------- */
export const driverAPI = {
  getMyTrips: () => apiCall<any[]>("/driver/my_trips"),
};

/* ---------------------- LOST & FOUND ---------------------- */
export const lostFoundAPI = {
  getLostItems: () => apiCall<{
    data: any; "lost items": any[] 
}>("/lostfound/lost_item"),
  getFoundItems: () =>
    apiCall<{
      data: any; found_items: any[] 
}>("/lostfound/found_items"),

  reportLostItem: (data: {
    obj_name: string;
    obj_description: string;
    obj_type: string;
    trip_id: number;
  }) =>
    apiCall<{
      lost_item: {
        id: number;
        name: string;
        type: string;
        description: string;
      };
      user_lost: { id: number; user_id: number; lost_id: number };
    }>("/lostfound/lost_item", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  reportFoundItem: (data: {
    obj_name: string;
    obj_description: string;
    obj_type: string;
    trip_id: number;
  }) =>
    apiCall<{
      found_item: { id: number; name: string; description: string };
    }>("/lostfound/found_item", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  claimItem: (itemId: number) =>
    apiCall<{ message: string }>(`/lostfound/claim/${itemId}`, {
      method: "POST",
    }),
};
