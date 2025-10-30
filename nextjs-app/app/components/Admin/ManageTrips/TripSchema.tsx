// src/schemas/tripSchema.ts
import { z } from "zod";

export const tripSchema = z.object({
  date: z.string().nonempty("Date is required"),
  schedule: z.string().nonempty("Schedule is required"),
  driver: z.string().nonempty("Driver name is required"),
  bus: z.string().nonempty("Bus is required"),
  startTerminal: z.string().nonempty("Start terminal is required"),
  stopTerminal: z.string().nonempty("Stop terminal is required"),
  startTime: z.string().nonempty("Start time is required"),
  endTime: z.string().nonempty("End time is required"),
  type: z.enum(["regular", "academic", "sport", "Student Life Event"]),
});

export type TripFormData = z.infer<typeof tripSchema>;
