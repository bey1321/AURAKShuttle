import { Feedback, RecentTrip } from "./types";
import { tripAPI } from "../lib/api";

// Fetch my reviews/feedback from backend
export async function getMyFeedback(): Promise<Feedback[]> {
  try {
    const data = await tripAPI.getMyReviews();
    // The API returns { reviews: [...] } or { message: "..." }
    if (data.reviews && Array.isArray(data.reviews)) {
      return data.reviews.map((review: any) => ({
        id: review.id,
        trip_id: review.trip_id,
        route: review.trip?.route_name || "Unknown Route",
        date: review.trip?.date || "",
        comment: review.comment || "",
        cleanliness: review.cleanliness,
        driver_rating: review.driver_rating,
        timeliness: review.timeliness,
        user_id: review.user_id,
        // For backward compatibility
        categories: {
          cleanliness: review.cleanliness || 0,
          driver: review.driver_rating || 0,
          timeliness: review.timeliness || 0,
        },
        rating: Math.round(
          ((review.cleanliness || 0) +
            (review.driver_rating || 0) +
            (review.timeliness || 0)) /
            3
        ),
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching my feedback:", error);
    throw error;
  }
}

// Fetch recent trips for feedback
export async function getRecentTrips(): Promise<RecentTrip[]> {
  try {
    const data = await tripAPI.getTripsForFeedback();
    return data.map((trip: any) => ({
      id: trip.id,
      route: trip.route_name || "Unknown Route",
      date: trip.date
        ? typeof trip.date === "string"
          ? trip.date
          : trip.date.split("T")[0]
        : "",
      driver: trip.driver_id?.toString() || "Unknown",
      time: trip.route?.start_time || "",
    }));
  } catch (error) {
    console.error("Error fetching recent trips:", error);
    throw error;
  }
}

// Legacy exports for backward compatibility
export const myFeedback: Feedback[] = [];
export const recentTrips: RecentTrip[] = [];
