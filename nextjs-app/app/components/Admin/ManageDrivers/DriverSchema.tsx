import { z } from "zod";

export const driverSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export type DriverInput = z.infer<typeof driverSchema>;
