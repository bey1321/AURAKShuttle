import { z } from "zod";

export const ItemSchema = z.object({
  id: z.number().optional(),
  item: z.string().min(2, "Item name is required"),
  description: z.string().min(5, "Description is required"),
  date: z.string().optional(),
  location: z.string().min(2, "Location is required"),
  category: z.string().min(1, "Category is required"),
  type: z.enum(["Lost", "Found"]),
  status: z.string().default("Unclaimed"),
  reportedBy: z.string().min(2, "Reporter name is required"),
  contactInfo: z.string().min(3, "Contact info is required"),
  createdAt: z.string().optional(),
  claimedInfo: z
    .object({
      claimedBy: z.string(),
      ClaimerSchoolID: z.string(),
      PhoneNumber: z.string(),
      SchoolEmail: z.string().email(),
      date: z.string(),
    })
    .optional(),
});

export type LostFoundItem = z.infer<typeof ItemSchema>;
