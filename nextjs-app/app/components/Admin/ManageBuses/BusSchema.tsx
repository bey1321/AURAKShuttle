import { z } from "zod";

export const busSchema = z.object({
  plate_num: z.string().min(1, "Plate number is required"),
  model: z.string().min(1, "Model is required"),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  no_seats: z.number().min(1, "Must have at least 1 seat"),
  // year: z
  //   .number()
  //   .min(2000)
  //   .max(new Date().getFullYear() + 1),
  // fuelType: z.enum(["Diesel", "Electric", "Hybrid", "Petrol"]),
  status: z.enum(["Active", "UnderMaintenance", "Inactive"]),
  // assignment: z.enum(["Assigned", "Unassigned"]),
});

export type BusFormData = z.infer<typeof busSchema>;
