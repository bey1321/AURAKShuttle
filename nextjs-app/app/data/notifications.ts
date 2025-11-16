import { Notification } from './types';

export const notifications: Notification[] = [
  { id: 1, type: "info", message: "Route 3 will be delayed by 10 minutes", time: "5 min ago" },
  { id: 2, type: "success", message: "Your seat for 2:00 PM shuttle is confirmed", time: "1 hour ago" },
  { id: 3, type: "warning", message: "Schedule change for tomorrow's morning routes", time: "2 hours ago" },
];
