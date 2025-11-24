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
  getAllUsers: () => apiCall<any[]>("/admin/all_users"),
  getUsers: () => apiCall<any[]>("/admin/all_users"), // Alias for compatibility
  createUser: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: string;
  }) =>
    // Backend exposes `/admin/create_user` (underscore) so call that route
    apiCall<{ message: string; user_id: number }>("/admin/create_user", {
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
  // Backend DELETE endpoint is `/admin/user/{user_id}` (no 'delete' segment)
  deleteUser: (userId: number) =>
    apiCall<{ message: string; user_id: number }>(`/admin/user/${userId}`, {
      method: "DELETE",
    }),

  // Terminals
  getTerminals: () => apiCall<any[]>("/admin/terminals"),
  createTerminal: (data: { terminalName: string; city: string }) =>
    apiCall<{ message: string }>("/admin/create/terminal", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateTerminal: (data: {
    id: number;
    terminalName?: string;
    city?: string;
  }) =>
    apiCall<{ message: string }>("/admin/terminals", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteTerminal: (terminalId: number) =>
    apiCall<{ message: string }>(`/admin/terminal/${terminalId}`, {
      method: "DELETE",
    }),

  // Trips
  getTrips: async () => {
    try {
      const res = await apiCall<any>("/admin/all_trips");
      // Normalize the response to always return an array
      if (Array.isArray(res)) return res;
      if (res && typeof res === "object" && Array.isArray((res as any).data)) return (res as any).data;
      // If single object or null, wrap in array or return empty
      return res ? [res] : [];
    } catch (e) {
      console.error("Error fetching trips:", e);
      return [];
    }
  },
  updateTrip: (
    tripId: number,
    data: Partial<{
      id: number;
      date: string;
      status: string;
      bus_id: number;
      driver_id: number;
    }>
  ) =>
    apiCall<{ message: string; trip_id: number }>(`/admin/trip/${tripId}`, {
      method: "PATCH",
      body: JSON.stringify({
        id: tripId,
        ...data,
      }),
    }),
  updateSingleTrip: (
    tripId: number,
    data: Partial<{
      id: number;
      date: string;
      status: string;
      bus_id: number;
      driver_id: number;
    }>
  ) =>
    apiCall<{ message: string }>(`/admin/trip/${tripId}`, {
      method: "PATCH",
      body: JSON.stringify({
        id: tripId,
        ...data,
      }),
    }),
    
  deleteTrip: (tripId: number) =>
    apiCall<{ message: string; trip_id: number }>(`/admin/trip/${tripId}`, {
      method: "DELETE",
    }),
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
  updateSemesterTrip: (
    routeId: number,
    data: {
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
    }
  ) =>
    apiCall<{
      message: string;
      total_new_trips_created: number;
      note: string;
    }>(`/admin/semester_trip/${routeId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
    deleteSemesterTrip: (route_id: number) =>
      apiCall<{
        message: string;
        deleted_trips_count: number;
      }>(`/admin/semester_trip/${route_id}`, {
        method: "DELETE",
      }),    
    getRoutes: async () => {
      try {
        const res = await apiCall<any>("/admin/routes");
        if (Array.isArray(res)) return res;
        if (res && Array.isArray((res as any).data)) return (res as any).data;
        return res ? [res] : [];
      } catch (e) {
        console.error("Error fetching routes:", e);
        return [];
      }
    },
    approveRegistration: (registration_id: number) =>
      apiCall<{ message: string }>(`/admin/approve_registration/${registration_id}`, {
        method: "POST",
      }),     
      
    getRegistrationRequests: () =>
      apiCall<Array<{
        id: number;
        status: string;
        student: {
          last_name: any;
          first_name: any; id: number; name: string; email?: string 
};
        route: {
          days_of_week: any;
          end_time: any;
          start_time: any; id: number; name: string 
};
      }>>("/admin/registration_request"),
    
    getFeedbacks: () => apiCall<any[]>("/admin/feedback"),
};
export const userAPI = {
  getMyTrips: () => apiCall<any[]>("/user/get_mytrips"),
  getAllTrips: () => apiCall<any[]>("/user/all_trips"),
  reserveSeat: (tripId: number) =>
    apiCall<{
      message: string;
      trip_id: number;
      reservation_id: number;
      seats_remaining: number;
      total_seats: number;
    }>(`/user/reserve_seat/${tripId}`, { method: "POST" }),
  cancelReservation: (tripId: number) =>
    apiCall<{ message: string }>(`/user/cancel_reservation/${tripId}`, {
      method: "DELETE",
    }),
  getMyReviews: () => apiCall<any[]>("/user/my_reviews"),
  getTripsForFeedback: () => apiCall<any[]>("/user/getTrips_for_feedback"),
  rateTrip: (data: {
    trip_id: number;
    cleanliness: number;
    driver_rating: number;
    timeliness: number;
    comment: string;
  }) =>
    apiCall<{ message: string }>("/user/rate_trip", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    registerRouteRequest: (route_id: number) =>
      apiCall<{ message: string }>(`/user/route/${route_id}`, {
        method: "POST",
      }),
};

/* ---------------------- STUDENT/TRIP (Legacy - for backward compatibility) ---------------------- */
export const tripAPI = {
  getMyTrips: () => userAPI.getMyTrips(),
  getAllTrips: () => userAPI.getAllTrips(),
  reserveSeat: (tripId: number) => userAPI.reserveSeat(tripId),
  cancelReservation: (tripId: number) => userAPI.cancelReservation(tripId),
  getTripsForFeedback: () => userAPI.getTripsForFeedback(),
  rateTrip: (data: {
    trip_id: number;
    cleanliness: number;
    driver_rating: number;
    timeliness: number;
    comment: string;
  }) => userAPI.rateTrip(data),
  getMyReviews: () => userAPI.getMyReviews(),
};

/* ---------------------- DRIVER ---------------------- */
export const driverAPI = {
  getMyTrips: () => apiCall<any[]>("/driver/my_trips"),
};

/* ---------------------- LOST & FOUND ---------------------- */
export const lostFoundAPI = {
  // Student routes
  getLostItems: () =>
    apiCall<{ lost_items: Array<{
      id: number;
      name: string;
      description: string;
      type: string;
      trip_id: number;
    }> }>("/lostfound/lost_item"),

  getFoundItems: () =>
    apiCall<{ found_items: Array<{
      id: number;
      name: string;
      description: string;
      type: string;
      trip_id: number;
      status: string;
    }> }>("/lostfound/found_items"),

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
      found_item: { id: number; name: string; description: string; type?: string; trip_id?: number };
    }>("/lostfound/found_item", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  claimItem: (itemId: number) =>
    apiCall<{ message: string }>(`/lostfound/claim/${itemId}`, {
      method: "POST",
    }),

  // ------------------ Admin Routes ------------------ //
  /**
   * Get all found items that have claims from students.
   * The backend already filters sensitive info (like passwords) via response model.
   */
  getAdminFoundAndClaims: () =>
    apiCall<Array<{
      id: number;
      name: string;
      description: string;
      type: string;
      status: string;
      trip_id: number;
      discoveredBy: { id: number; name: string; email?: string }; // filtered user info
      claim: Array<{
        id: number;
        status: string;
        claimer: { id: number; name: string; email?: string }; // filtered student info
      }>;
    }>>("/lostfound/admin/found_and_claim"),

  /**
   * Approve a student's claim for a found item
   */
  approveClaim: (claimId: number) =>
    apiCall<{ message: string }>(`/lostfound/admin/approve/claim/${claimId}`, {
      method: "POST",
    }),

  /**
   * Mark a found item as received by a student
   */
  markItemReceived: (studentId: number, claimId: number) =>
    apiCall<{ message: string }>(
      `/lostfound/admin/found_recieved/student/${studentId}/claim/${claimId}`,
      {
        method: "POST",
      }
    ),
};
