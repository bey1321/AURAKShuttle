import { Feedback } from './types';

export const recentTrips = [
  { id: 1, route: "Main Campus → Khatt Terminal", date: "Oct 21, 2025 - 08:00 AM", driver: "Ahmed Hassan" },
  { id: 2, route: "Khatt Terminal → Main Campus", date: "Oct 20, 2025 - 10:00 AM", driver: "Mohammed Ali" },
  { id: 3, route: "Main Campus → RAK Mall", date: "Oct 19, 2025 - 02:00 PM", driver: "Sara Ahmed" },
  { id: 4, route: "RAK Mall → Main Campus", date: "Oct 18, 2025 - 04:30 PM", driver: "Ahmed Hassan" },
];

export const myFeedback: Feedback[] = [
  {
    id: 1,
    route: "Main Campus → Khatt Terminal",
    date: "Oct 15, 2025",
    rating: 5,
    comment: "Excellent service! Driver was very professional and the shuttle was clean.",
    categories: { cleanliness: 5, driver: 5, timeliness: 5 },
  },
  {
    id: 2,
    route: "RAK Mall → Main Campus",
    date: "Oct 10, 2025",
    rating: 4,
    comment: "Good experience overall. Slight delay but comfortable ride.",
    categories: { cleanliness: 4, driver: 5, timeliness: 3 },
  },
  {
    id: 3,
    route: "Main Campus → RAK Mall",
    date: "Oct 5, 2025",
    rating: 5,
    comment: "Perfect timing and very clean shuttle. Great driver!",
    categories: { cleanliness: 5, driver: 5, timeliness: 5 },
  },
];

