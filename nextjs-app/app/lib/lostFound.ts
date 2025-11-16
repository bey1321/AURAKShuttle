// Centralized API utility for all backend API calls
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Helper function to make API calls with credentials
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultOptions: RequestInit = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  const data = await response.json();

  if (!response.ok) throw new Error(data.detail || "API Error");
  return data;
}

// Lost & Found API
const LostFoundAPI = {
  // --- LOST ITEM ---
  createLostItem: async (data: {
    obj_name: string;
    obj_description: string;
    obj_type: string;
    trip_id: number;
  }) => {
    return apiCall<{
      lost_item: {
        id: number;
        name: string;
        type: string;
        description: string;
      };
      user_lost: {
        id: number;
        user_id: number;
        lost_id: number;
      };
    }>("/lostfound/lost_item", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getLostItems: async () => {
    // ✅ Backend returns: { "lost items": [ {..}, {..} ] }
    const response = await apiCall<{ "lost items": any[] }>(
      "/lostfound/lost_item"
    );
    return response["lost items"];
  },

  // --- FOUND ITEM ---
  createFoundItem: async (data: {
    obj_name: string;
    obj_description: string;
    obj_type: string;
    trip_id: number;
  }) => {
    return apiCall<{
      found_item: {
        id: number;
        name: string;
        description: string;
      };
    }>("/lostfound/found_item", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getFoundItems: async () => {
    // ✅ Backend returns: { "found_items": [ {..}, {..} ] }
    const response = await apiCall<{ found_items: any[] }>(
      "/lostfound/found_items"
    );
    return response.found_items;
  },

  // --- CLAIM ITEM ---
  makeClaim: async (itemId: number) => {
    return apiCall<{ message: string }>(`/lostfound/claim/${itemId}`, {
      method: "POST",
    });
  },
};

export default LostFoundAPI;
