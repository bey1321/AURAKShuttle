import { z } from "zod";

export const driverSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  status: z.enum(["Active", "Inactive"]),
  trips: z.number().min(0, "Trips must be 0 or more"),
  rating: z.number().min(0).max(5, "Rating must be between 0 and 5"),
});

export type DriverInput = z.infer<typeof driverSchema>;
