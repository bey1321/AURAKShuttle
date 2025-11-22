export type LocalNotification = {
  id: number;
  type: "info" | "success" | "warning" | "error";
  message: string;
  time: string; // human friendly
  data?: any;
};

const STORAGE_KEY = "aurak_notifications_v1";

function nowLabel() {
  return new Date().toLocaleString();
}

export function getNotifications(): LocalNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalNotification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("Failed to read local notifications", e);
    return [];
  }
}

export function addNotification(n: Omit<LocalNotification, "id" | "time">) {
  try {
    const existing = getNotifications();
    const nextId = existing.length ? Math.max(...existing.map((x) => x.id)) + 1 : 1;
    const notif: LocalNotification = { id: nextId, time: nowLabel(), ...n } as any;
    const updated = [notif, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Dispatch a custom event so other tabs/components can react
    try {
      window.dispatchEvent(
        new CustomEvent("aurak:notifications:updated", { detail: notif })
      );
    } catch {}
    return notif;
  } catch (e) {
    console.warn("Failed to add local notification", e);
    return null as any;
  }
}

export function clearNotifications() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    try {
      window.dispatchEvent(new CustomEvent("aurak:notifications:cleared"));
    } catch {}
  } catch (e) {
    console.warn("Failed to clear local notifications", e);
  }
}
